# Оксана Вдовина — фуршеты и десерты

Сайт-витрина с корзиной на React 18 + TypeScript + Vite, анимации — framer-motion, роутинг — react-router v6.
Заказы принимает небольшой node-сервер (`server/`): проверяет, считает сумму по меню, сохраняет в файл и присылает Оксане в **MAX**.
Запасной канал — WhatsApp / ВКонтакте.

## Команды

```bash
npm i
npm run dev          # http://localhost:5173 (без API заказов)
npm run build        # типы + сайт + предрендер страниц в dist/ + сервер в dist-server/
npm run preview      # собранный сайт на http://localhost:4173
npm start            # API заказов на http://127.0.0.1:3001 (нужен .env)
npm run lint         # ESLint
npm run test:e2e     # Playwright (после build; первый раз: npx playwright install chromium)
npm run max:chat-id  # узнать MAX_CHAT_ID (нужен MAX_BOT_TOKEN в окружении)
```

CI (`.github/workflows/ci.yml`) на каждый push и PR гоняет lint, сборку и e2e.

## Деплой на VDS (Ubuntu/Debian, nginx, Node 20+)

Один раз:

0. Node 20+ в `/usr/bin` — из NodeSource или официального пакета (в apt Ubuntu слишком старый, nvm не подойдёт), плюс `nginx rsync git`.
1. Пользователь и каталог: `adduser --disabled-password oksana`, `mkdir -p /var/www/oksana && chown oksana /var/www/oksana`.
2. Под `oksana`: `git clone https://github.com/floj2006/vdovina.git /var/www/oksana/repo`.
   Рабочая сборка лежит в `repo/dist`, nginx отдаёт выложенную копию `/var/www/oksana/site`.
3. В `repo`: `cp .env.example .env && chmod 600 .env` и заполнить (см. ниже).
4. Бот MAX: создать на business.max.ru → «Чат-боты», токен — в `MAX_BOT_TOKEN`. Оксана пишет боту любое сообщение,
   затем `set -a; . ./.env; set +a; npm run max:chat-id` — полученный `MAX_CHAT_ID` вписать в `.env`.
5. `cp deploy/oksana-orders.service /etc/systemd/system/ && systemctl daemon-reload && systemctl enable oksana-orders`.
6. `cp deploy/security-headers.conf /etc/nginx/snippets/oksana-security-headers.conf`,
   `cp deploy/nginx.conf /etc/nginx/sites-available/oksana`, заменить `example.ru`, включить сайт, `certbot --nginx`,
   затем раскомментировать HSTS в snippet.
7. Разрешить пользователю перезапуск сервиса: в `visudo` строка
   `oksana ALL=NOPASSWD: /usr/bin/systemctl restart oksana-orders`.
8. `bash deploy/deploy.sh`.

Обновление: `bash deploy/deploy.sh` — git pull, сборка в `dist/`, выкладка в `site/` без простоя
(старые ассеты живут ещё 30 дней), перезапуск API, проверка `/api/health`.
Без `VITE_SITE_URL` деплой-сборка остановится с ошибкой.

## Переменные `.env`

| Переменная | Зачем |
|---|---|
| `VITE_SITE_URL` | домен без слэша: canonical, og:url, sitemap.xml |
| `VITE_YM_ID` | номер счётчика Яндекс Метрики |
| `SITE_URL` | тот же домен — API принимает заказы только с него; без него API отвечает 503 |
| `PORT` | порт API (nginx проксирует на 3001) |
| `ORDERS_DIR` | каталог копий заказов для локального запуска; на сервере — `/var/lib/oksana-orders` из юнита |
| `MAX_BOT_TOKEN`, `MAX_CHAT_ID` | бот MAX и диалог, куда приходят заказы |
| `MAX_API_URL` | адрес Bot API. `platform-api2.max.ru` требует сертификат Минцифры (`NODE_EXTRA_CA_CERTS`), поэтому по умолчанию `platform-api.max.ru` |

Формат запроса к MAX проверен на заглушке — после настройки отправьте один тестовый заказ.
Без MAX-переменных API отвечает 503, и сайт предлагает отправить заказ в WhatsApp / ВК.

## Как устроено

- **Заказ.** Клиент отправляет только состав `{id: количество}` и форму. Сервер (`server/order.ts`) проверяет поля,
  берёт цены из `src/data/menu.ts` и сам собирает текст. Защита: проверка `Origin`, лимит 5 заказов / 10 мин с IP
  в приложении и `limit_req` в nginx, только JSON, поле-ловушка для ботов, лимит размера запроса.
  Каждый заказ дописывается в `/var/lib/oksana-orders/orders-ГГГГ-ММ.jsonl` (права 600) — он не потеряется, даже если MAX недоступен.
  Храните эти файлы не дольше года (так написано в политике).
- **Предрендер** (`src/entry-server.tsx`, `scripts/prerender.mjs`): каждая страница, категория и блюдо — готовый HTML
  со своими title, description, canonical и JSON-LD. `/cart` и `/thanks` отдаются из `spa.html` (noindex),
  несуществующие адреса — настоящий 404.
- **Аналитика** (`src/lib/analytics.ts`): Метрика грузится только после «Разрешить» в cookie-баннере.
  Цели (JavaScript-события): `add_to_cart`, `checkout_details`, `checkout_review`, `order_sent`, `order_failed`,
  `order_wa`, `order_vk`, `call_click`.
- **Шрифты** локальные (`@fontsource`).

## Где менять данные

- `src/data/site.ts` — телефон, WhatsApp, ВК, адрес, часы, реквизиты продавца (`LEGAL`).
- `src/data/menu.ts` — категории, блюда, цены, вес, фото, бейджи, боксы.
- `src/pages/Legal.tsx` — тексты политики конфиденциальности и условий заказа.
- `src/styles/global.css` — цвета и шрифты (переменные в `:root`).

Блюда идентифицируются по позиции в категории (`kanape-0`), поэтому новые блюда добавляйте в конец категории —
иначе у покупателей со старой корзиной позиции перепутаются.
