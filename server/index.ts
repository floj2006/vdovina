/**
 * Сервер заказов для VDS: принимает POST /api/order, сохраняет заказ в файл и пересылает в MAX.
 * Статику отдаёт nginx (deploy/nginx.conf), сюда проксируется только /api/.
 * Настройки — переменные окружения, см. .env.example.
 */
import { randomUUID } from 'node:crypto';
import { appendFile, mkdir } from 'node:fs/promises';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join } from 'node:path';
import { parseOrder, type Order } from './order';

const env = process.env;
const PORT = Number(env.PORT) || 3001;
const HOST = env.HOST || '127.0.0.1';
const SITE_URL = (env.SITE_URL || '').replace(/\/+$/, '');
const ORDERS_DIR = env.ORDERS_DIR || join(process.cwd(), 'orders');
const MAX_API = (env.MAX_API_URL || 'https://platform-api.max.ru').replace(/\/+$/, '');
const MAX_TOKEN = env.MAX_BOT_TOKEN || '';
// Куда слать: личный диалог с ботом (MAX_CHAT_ID) или конкретному пользователю (MAX_USER_ID)
const MAX_TARGET = env.MAX_CHAT_ID ? `chat_id=${env.MAX_CHAT_ID}` : env.MAX_USER_ID ? `user_id=${env.MAX_USER_ID}` : '';

const MAX_BODY = 16 * 1024;
const WINDOW_MS = 10 * 60_000;
// Считаются и ошибочные попытки: запас на опечатки в телефоне и сбои MAX
const MAX_PER_WINDOW = 10;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}
// Чистим старые записи, чтобы карта не росла бесконечно
setInterval(() => {
  const now = Date.now();
  for (const [ip, list] of hits) if (list.every((t) => now - t >= WINDOW_MS)) hits.delete(ip);
}, WINDOW_MS).unref();

/** Короткий номер заказа для общения с клиентом: день, месяц и 4 символа */
function orderId() {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${z(d.getDate())}${z(d.getMonth() + 1)}-${randomUUID().slice(0, 4).toUpperCase()}`;
}

function send(res: ServerResponse, status: number, body: object) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > MAX_BODY) { reject(new Error('too_large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('bad_json')); }
    });
    req.on('error', reject);
  });
}

/** Резервная копия: даже если MAX недоступен, заказ останется на сервере */
async function save(id: string, order: Order) {
  await mkdir(ORDERS_DIR, { recursive: true });
  const month = new Date().toISOString().slice(0, 7);
  const line = JSON.stringify({ id, at: new Date().toISOString(), total: order.total, items: order.items, form: order.form }) + '\n';
  await appendFile(join(ORDERS_DIR, `orders-${month}.jsonl`), line, { mode: 0o600 });
}

async function notifyMax(text: string) {
  const r = await fetch(`${MAX_API}/messages?${MAX_TARGET}`, {
    method: 'POST',
    headers: { Authorization: MAX_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, 4000) }),
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error(`MAX ${r.status}: ${(await r.text().catch(() => '')).slice(0, 300)}`);
}

async function handleOrder(req: IncomingMessage, res: ServerResponse) {
  if (!MAX_TOKEN || !MAX_TARGET || !SITE_URL) return send(res, 503, { error: 'not_configured' });

  // Только со своего сайта и только JSON (у JSON-запроса с чужого сайта браузер спросит разрешение, CORS его не даст).
  // От curl не спасает — для этого лимиты ниже и в nginx
  if (req.headers.origin !== SITE_URL) return send(res, 403, { error: 'forbidden' });
  if (!String(req.headers['content-type'] || '').startsWith('application/json')) return send(res, 415, { error: 'json_only' });

  // X-Real-IP ставит nginx; доверять ему можно, только пока сервер слушает 127.0.0.1 (HOST)
  const ip = String(req.headers['x-real-ip'] || req.socket.remoteAddress || 'unknown');
  if (limited(ip)) return send(res, 429, { error: 'too_many_requests' });

  let body: unknown;
  try { body = await readJson(req); } catch (e) { return send(res, (e as Error).message === 'too_large' ? 413 : 400, { error: (e as Error).message }); }

  // Поле-ловушка заполняют только боты: отвечаем «ок», заказ не создаём
  if ((body as { hp?: unknown })?.hp) return send(res, 200, { ok: true });

  const order = parseOrder(body);
  if (typeof order === 'string') return send(res, 400, { error: order });

  const id = orderId();
  try {
    await save(id, order);
  } catch (e) {
    console.error('save failed', e);
  }
  try {
    await notifyMax(`🛒 Заказ ${id} с сайта\n\n${order.text}`);
  } catch (e) {
    console.error('max failed', id, e);
    // Заказ сохранён, но Оксана его не увидела — клиенту предлагаем WhatsApp / ВК
    return send(res, 502, { error: 'notify_failed' });
  }
  console.log('order', id, order.total);
  send(res, 200, { ok: true, id });
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname === '/api/health') return send(res, 200, { ok: true });
    if (url.pathname === '/api/order') {
      if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { error: 'method_not_allowed' }); }
      return await handleOrder(req, res);
    }
    send(res, 404, { error: 'not_found' });
  } catch (e) {
    console.error(e);
    if (!res.headersSent) send(res, 500, { error: 'internal' });
  }
}).listen(PORT, HOST, () => {
  console.log(`orders api on http://${HOST}:${PORT}${MAX_TOKEN && MAX_TARGET ? '' : ' (MAX не настроен — заказы получат 503)'}`);
});
