import { expect, test, type Page } from '@playwright/test';

// Баннер cookie не мешает кликам: выбор уже сделан
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ov_consent', 'necessary'));
});

async function fillCart(page: Page) {
  await page.goto('/menu');
  await page.getByRole('button', { name: 'В заказ' }).first().click();
  await page.goto('/cart');
  await page.getByRole('button', { name: /Дальше: детали/ }).click();
}

async function fillDetails(page: Page) {
  await page.getByLabel('Ваше имя *').fill('Тест');
  await page.getByLabel('Телефон *').fill('89001234567');
  await expect(page.getByLabel('Телефон *')).toHaveValue('+7 (900) 123-45-67');
}

test('заказ уходит с сайта и показывает номер', async ({ page }) => {
  let body: { text?: string; phone?: string } = {};
  await page.route('/api/order', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: { ok: true, id: '2310-TEST' } });
  });
  await fillCart(page);
  await fillDetails(page);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Проверить заказ/ }).click();
  await page.getByRole('button', { name: 'Отправить заказ' }).click();

  await expect(page.getByText('Заказ принят')).toBeVisible();
  await expect(page.getByText('2310-TEST')).toBeVisible();
  expect(body.phone).toBe('+7 (900) 123-45-67');
  expect(body.text).toContain('Имя: Тест');
  // Корзина и личные данные стёрты
  expect(await page.evaluate(() => localStorage.getItem('ov_cart'))).toBe('{}');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ov_form') || '{}').phone)).toBe('');
});

test('без согласия заказ не отправить', async ({ page }) => {
  await fillCart(page);
  await fillDetails(page);
  await page.getByRole('button', { name: /Проверить заказ/ }).click();
  await expect(page.getByRole('checkbox')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('button', { name: 'Отправить заказ' })).toHaveCount(0);
});

test('если сервер недоступен — предлагает WhatsApp', async ({ page }) => {
  await page.route('/api/order', (route) => route.fulfill({ status: 503, json: { error: 'not_configured' } }));
  await fillCart(page);
  await fillDetails(page);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Проверить заказ/ }).click();
  await page.getByRole('button', { name: 'Отправить заказ' }).click();
  await expect(page.getByText(/Не удалось отправить с сайта/)).toBeVisible();
  await expect(page.getByRole('button', { name: /WhatsApp/ })).toBeVisible();
});

test('страницы предрендерены для поисковиков', async ({ request }) => {
  const html = await (await request.get('/delivery')).text();
  expect(html).toContain('<title>Доставка и оплата');
  expect(html).toContain('Частые');
});
