# Оксана Вдовина — фуршеты и десерты

Сайт-витрина с корзиной на React 18 + TypeScript + Vite, анимации — framer-motion, роутинг — react-router v6.
Заказы принимает небольшой node-сервер (`server/`): проверяет, считает сумму по меню, сохраняет в файл и присылает Оксане в **MAX**
с кнопками статуса. Покупатель может подписаться на статус своего заказа в том же боте.
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

## Деплой на VDS

Сайт живёт на общем VDS (176.12.66.134, Ubuntu 24.04) рядом с сайтом ведущей (`/opt/olga`).
Порты 80/443 держит общий прокси **edge** (`deploy/edge`, на сервере `/opt/edge`) — отдельный Caddy, который
выпускает HTTPS и по домену направляет запросы в независимые docker-проекты `olga-zhukova` и `oksana`
через docker-сеть `edge`. Передеплой одного сайта не трогает другой. Наружу открыт только edge.

```
браузер → edge Caddy (:443) → oksana-web (nginx :8080) → /api/ → oksana-api (node :3001) → MAX
```

- Код: `/opt/oksana/repo` (git clone), настройки — `/opt/oksana/repo/.env` (права 600).
- Выложенный сайт: `/opt/oksana/site`; заказы и состояние бота — docker-том `oksana_orders`.
- Node на сервере не нужен: сборка идёт в одноразовом контейнере `node:22-alpine`.

**Обновить сайт** (после `git push`): `ssh root@176.12.66.134 bash /opt/oksana/repo/deploy/deploy.sh`
— pull, сборка, выкладка без простоя, перезапуск API, проверка `/api/health`.
Изменения в самом `deploy.sh` применяются со следующего запуска (bash читает файл, который обновляет git pull).

**Общий прокси edge.** Однократный перевод сервера: `bash /opt/edge/migrate.sh` (бэкап, проверка конфига,
перенос сертификатов, переключение портов с автооткатом). Новый сайт — блок в `/opt/edge/Caddyfile`, затем
`docker exec edge-caddy-1 caddy reload --config /etc/caddy/Caddyfile` (без простоя).

**Важно для проекта Жуковой:** в её `compose.yaml` (и в исходниках, откуда она деплоится) нужно убрать сервис
`caddy` и подключить `app` к сети `edge` с алиасом `olga-app`:

```yaml
  app:
    networks:
      default:
      edge:
        aliases: [olga-app]
networks:
  edge:
    external: true
```

Иначе её следующий `docker compose up` снова запустит её Caddy, он упрётся в занятые порты 80/443.

**Полезное:**
- логи API: `cd /opt/oksana/repo && docker compose -f deploy/compose.yaml logs -f api`;
- chat_id Оксаны: в тех же логах строка `MAX message from … chat_id=…`;
- резервная копия заказов: `docker run --rm -v oksana_orders:/d alpine tar cz -C /d . > orders.tgz`.

## Переменные `.env`

| Переменная | Зачем |
|---|---|
| `VITE_SITE_URL` | домен без слэша: canonical, og:url, sitemap.xml |
| `VITE_YM_ID` | номер счётчика Яндекс Метрики |
| `SITE_URL` | тот же домен — API принимает заказы только с него; без него API отвечает 503 |
| `PORT`, `ORDERS_DIR` | для локального запуска; в docker их задаёт `deploy/compose.yaml` |
| `MAX_BOT_TOKEN`, `MAX_CHAT_ID` | бот MAX и диалог, куда приходят заказы |
| `MAX_API_URL` | адрес Bot API. `platform-api2.max.ru` требует сертификат Минцифры (`NODE_EXTRA_CA_CERTS`), поэтому по умолчанию `platform-api.max.ru` |

Формат запроса к MAX проверен на заглушке — после настройки отправьте один тестовый заказ.
Без MAX-переменных API отвечает 503, и сайт предлагает отправить заказ в WhatsApp / ВК.

## Как устроено

- **Заказ.** Клиент отправляет только состав `{id: количество}` и форму. Сервер (`server/order.ts`) проверяет поля,
  берёт цены из `src/data/menu.ts` и сам собирает текст. Защита: проверка `Origin`, лимит 5 заказов / 10 мин с IP
  в приложении и `limit_req` в nginx, только JSON, поле-ловушка для ботов, лимит размера запроса.
  Каждый заказ дописывается в `orders-ГГГГ-ММ.jsonl` в томе `oksana_orders` (права 600) — он не потеряется, даже если MAX недоступен.
  Храните эти файлы не дольше года (так написано в политике).
- **Статусы в MAX** (`server/bot.ts`, `server/store.ts`). Заказ приходит только в чат `MAX_CHAT_ID` с кнопками
  «Принять / Отклонить», затем «Готов / Отменить». Покупатель на странице «Спасибо» жмёт «Следить за заказом в MAX»
  (ссылка `max.ru/<бот>?start=<код>`) или отправляет боту код — если диалог с ботом уже был, ссылка код не передаёт.
  После этого бот пишет ему при каждой смене статуса. Код — 16 случайных символов, по номеру заказа чужой не подключить.
  Состояние — `bot-state.json` рядом с заказами, хранится 30 дней. События бот забирает long polling'ом, вебхук не нужен.
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
