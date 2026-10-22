# Оксана Вдовина — фуршеты и десерты

Сайт-витрина с корзиной на React 18 + TypeScript + Vite, анимации — framer-motion, роутинг — react-router v6.
Заказы принимает серверная функция `api/order.js` и пересылает в Telegram; запасной канал — WhatsApp / ВКонтакте.

## Запуск

```bash
npm i
npm run dev        # http://localhost:5173
npm run build      # типы + сборка + предрендер страниц в dist/
npm run preview    # собранная версия на http://localhost:4173
npm run lint       # ESLint
npm run test:e2e   # Playwright (нужен npm run build; первый раз: npx playwright install chromium)
```

CI (`.github/workflows/ci.yml`) на каждый push и PR гоняет lint, сборку и e2e.

## Переменные окружения

Шаблон — `.env.example`. В Vercel: Settings → Environment Variables.

| Переменная | Где | Зачем |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | сервер, секрет | бот от @BotFather |
| `TELEGRAM_CHAT_ID` | сервер | чат, куда приходят заказы (напишите боту, затем `https://api.telegram.org/bot<токен>/getUpdates` → `chat.id`) |
| `VITE_SITE_URL` | сборка | домен без слэша: canonical, og:url, sitemap.xml |
| `VITE_YM_ID` | сборка | номер счётчика Яндекс Метрики |

Без Telegram-переменных функция отвечает 503 и сайт предлагает отправить заказ в WhatsApp / ВК.

## Деплой

- **Vercel** — импортировать репозиторий; `vercel.json` уже настроен (cleanUrls, заголовки безопасности, кэш ассетов). Функция из `api/` подхватывается автоматически.
- **Netlify** — build `npm run build`, publish `dist`; редиректы в `public/_redirects`. Функцию `api/order.js` нужно перенести в `netlify/functions`.

## Как устроено

- **Предрендер** (`src/entry-server.tsx`, `scripts/prerender.mjs`): каждая страница, категория и блюдо сохраняются готовым HTML со своими title, description, canonical и JSON-LD (Product + BreadcrumbList). Это нужно для Яндекса и Google. В браузере React рендерит страницу заново поверх этой разметки. `/cart` и `/thanks` отдаются из `spa.html` с noindex, у несуществующих адресов настоящий 404.
- **Аналитика** (`src/lib/analytics.ts`): Метрика загружается только после «Разрешить» в cookie-баннере. Цели: `add_to_cart`, `checkout_details`, `checkout_review`, `order_sent`, `order_failed`, `order_wa`, `order_vk`, `call_click` — заведите их в счётчике как JavaScript-события.
- **Шрифты** локальные (`@fontsource`), без Google Fonts.
- Корзина и форма хранятся в localStorage; после успешной отправки стираются.

## Где менять данные

- `src/data/site.ts` — телефон, WhatsApp, ВК, адрес, часы, **реквизиты продавца (`LEGAL`)**.
- `src/data/menu.ts` — категории, блюда, цены, вес, фото, бейджи, боксы.
- `src/pages/Legal.tsx` — тексты политики конфиденциальности и условий заказа.
- `src/styles/global.css` — цвета и шрифты (переменные в `:root`).

## Перед запуском

- Заполнить `LEGAL` в `src/data/site.ts`: статус (самозанятая / ИП), ИНН, город, e-mail.
- Задать переменные окружения (таблица выше), создать цели в Метрике.
- Проверить тексты политики и условий с юристом: сайт собирает персональные данные (152-ФЗ), а хостинг и Telegram находятся за рубежом.
- Домен в JSON-LD `index.html` и `addressLocality` в адресе.
