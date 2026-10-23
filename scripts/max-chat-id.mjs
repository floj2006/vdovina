// Узнать chat_id диалога с ботом MAX: напишите боту любое сообщение, затем запустите
//   MAX_BOT_TOKEN=... node scripts/max-chat-id.mjs
const api = (process.env.MAX_API_URL || 'https://platform-api.max.ru').replace(/\/+$/, '');
const token = process.env.MAX_BOT_TOKEN;
if (!token) {
  console.error('Задайте MAX_BOT_TOKEN');
  process.exit(1);
}
const r = await fetch(`${api}/updates?limit=100&timeout=0`, { headers: { Authorization: token } });
if (!r.ok) {
  console.error('Ошибка', r.status, await r.text());
  process.exit(1);
}
const { updates = [] } = await r.json();
const seen = new Map();
for (const u of updates) {
  const m = u.message;
  const chatId = m?.recipient?.chat_id ?? u.chat_id;
  if (chatId && !seen.has(chatId)) seen.set(chatId, `${m?.sender?.name ?? '?'} (user_id ${m?.sender?.user_id ?? '?'}): «${(m?.body?.text ?? '').slice(0, 40)}»`);
}
if (!seen.size) console.log('Новых сообщений нет — напишите боту в MAX и запустите снова.');
for (const [id, who] of seen) console.log(`MAX_CHAT_ID=${id}   ← ${who}`);
