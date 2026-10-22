// Vercel serverless function: принимает заказ и пересылает его в Telegram.
// Переменные окружения: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, VITE_SITE_URL (см. .env.example).
import { randomUUID } from 'node:crypto';

const MAX_TEXT = 4000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
// Память живёт, пока жив инстанс функции: защита от повторных кликов и простых ботов, не от DDoS
const hits = new Map();

const limited = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > MAX_PER_WINDOW;
};

/** Короткий номер заказа для общения с клиентом: дата + 4 символа */
const orderId = () => {
  const d = new Date();
  const z = (n) => String(n).padStart(2, '0');
  return `${z(d.getUTCDate())}${z(d.getUTCMonth() + 1)}-${randomUUID().slice(0, 4).toUpperCase()}`;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(503).json({ error: 'not_configured' });

  // Только со своего сайта, если домен задан. От curl не спасает, но отсекает чужие формы
  const site = (process.env.VITE_SITE_URL || '').replace(/\/+$/, '');
  const origin = String(req.headers.origin || '');
  if (site && origin && origin !== site) return res.status(403).json({ error: 'forbidden' });

  const ip = String(req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'too_many_requests' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  // honeypot: скрытое поле заполняют только боты — отвечаем «ок», но никуда не шлём
  if (body?.hp) return res.status(200).json({ ok: true });
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone : '';
  if (!text || text.length > MAX_TEXT || !/^7\d{10}$/.test(phone.replace(/\D/g, ''))) {
    return res.status(400).json({ error: 'invalid_order' });
  }

  const id = orderId();
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `🛒 Заказ ${id} с сайта\n\n${text}` }),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) {
      console.error('telegram', r.status, await r.text().catch(() => ''));
      return res.status(502).json({ error: 'upstream_failed' });
    }
    return res.status(200).json({ ok: true, id });
  } catch (e) {
    console.error('telegram', e);
    return res.status(502).json({ error: 'upstream_failed' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
