/** Минимальный клиент MAX Bot API: отправка сообщений, ответы на кнопки, long polling */

const API = (process.env.MAX_API_URL || 'https://platform-api.max.ru').replace(/\/+$/, '');
const TOKEN = process.env.MAX_BOT_TOKEN || '';

export const maxConfigured = () => Boolean(TOKEN);

export interface Button { type: 'callback'; text: string; payload: string; intent?: 'default' | 'positive' | 'negative' }
export interface NewMessage {
  text: string;
  attachments?: { type: 'inline_keyboard'; payload: { buttons: Button[][] } }[];
}

export interface MaxUser { user_id: number; name?: string; username?: string }
export interface Update {
  update_type: string;
  timestamp: number;
  chat_id?: number;
  user?: MaxUser;
  payload?: string | null;
  callback?: { callback_id: string; payload?: string; user?: MaxUser };
  message?: { recipient?: { chat_id?: number; user_id?: number }; sender?: MaxUser & { is_bot?: boolean }; body?: { mid?: string; text?: string } };
}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown, timeoutMs = 10_000): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: TOKEN, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`MAX ${method} ${path.split('?')[0]} ${r.status}: ${text.slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

export const keyboard = (rows: Button[][]): NewMessage['attachments'] => [{ type: 'inline_keyboard', payload: { buttons: rows } }];

export const sendToChat = (chatId: number | string, msg: NewMessage) =>
  call('POST', `/messages?chat_id=${chatId}`, { ...msg, text: msg.text.slice(0, 4000) });

/** Ответ на нажатие кнопки: всплывающее уведомление и, если нужно, новая версия сообщения */
export const answerCallback = (callbackId: string, notification: string, message?: NewMessage) =>
  call('POST', `/answers?callback_id=${encodeURIComponent(callbackId)}`, { notification, ...(message && { message }) });

export const getMe = () => call<{ user_id: number; username?: string; name?: string }>('GET', '/me');

/** Long polling: сервер MAX держит запрос до timeout секунд, пока не появятся события */
export const getUpdates = (marker: number | null, types: string[]) =>
  call<{ updates: Update[]; marker?: number }>(
    'GET',
    `/updates?timeout=30&limit=100&types=${types.join(',')}${marker != null ? `&marker=${marker}` : ''}`,
    undefined,
    45_000,
  );
