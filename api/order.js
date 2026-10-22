// Vercel serverless function: принимает заказ и пересылает его в Telegram.
// Переменные окружения: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (см. .env.example).

const MAX_TEXT = 4000;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map();

const limited = (ip) => {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return res.status(503).json({ error: 'not_configured' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (limited(ip)) return res.status(429).json({ error: 'too_many_requests' });

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body;
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  const phone = typeof body?.phone === 'string' ? body.phone : '';
  if (body?.website) return res.status(200).json({ ok: true }); // honeypot: боты заполняют скрытое поле
  if (!text || text.length > MAX_TEXT || phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'invalid_order' });
  }

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `🛒 Новый заказ с сайта\n\n${text}` }),
    });
    if (!r.ok) return res.status(502).json({ error: 'upstream_failed' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(502).json({ error: 'upstream_failed' });
  }
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return null; }
}
