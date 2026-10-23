/**
 * Бот MAX: заказы с кнопками статуса — только в чат Оксаны (MAX_CHAT_ID);
 * покупателям — уведомления о статусе, если они сами подключились по ссылке со страницы «Спасибо».
 */
import { answerCallback, getMe, getUpdates, keyboard, sendToChat, type Button, type NewMessage, type Update } from './max';
import { addOrder, findByToken, getMarker, getOrder, setMarker, updateOrder, type OrderState, type Status } from './store';

const OWNER_CHAT = Number(process.env.MAX_CHAT_ID) || 0;
const SITE_URL = (process.env.SITE_URL || '').replace(/\/+$/, '');
const PHONE = '+7 (908) 049-56-39';

let botName = process.env.MAX_BOT_NAME || '';

const STATUS_LABEL: Record<Status, string> = {
  new: '🆕 Новый',
  confirmed: '✅ Принят',
  ready: '🍽 Готов',
  rejected: '❌ Отклонён',
};

/** Что видит покупатель при смене статуса */
const customerText = (id: string, o: OrderState): string => {
  switch (o.status) {
    case 'new': return `Заявка №${id} получена. Как только Оксана её подтвердит, напишу здесь.`;
    case 'confirmed': return `✅ Заказ №${id} принят! Оксана свяжется с вами, чтобы уточнить детали и оплату.`;
    case 'ready': return o.pickup
      ? `🍽 Заказ №${id} готов — можно забирать. Если что-то изменилось, позвоните: ${PHONE}.`
      : `🍽 Заказ №${id} готов и скоро будет у вас.`;
    case 'rejected': return `К сожалению, заказ №${id} выполнить не получится. Оксана свяжется с вами и всё объяснит. Телефон: ${PHONE}.`;
  }
};

/** Кнопки под заказом у Оксаны: только допустимые переходы */
function ownerButtons(id: string, s: Status): NewMessage['attachments'] {
  const b = (to: Status, text: string, intent: Button['intent'] = 'default'): Button => ({ type: 'callback', text, payload: `st:${id}:${to}`, intent });
  const rows: Button[][] =
    s === 'new' ? [[b('confirmed', '✅ Принять', 'positive'), b('rejected', '❌ Отклонить', 'negative')]]
      : s === 'confirmed' ? [[b('ready', '🍽 Готов', 'positive')], [b('rejected', '❌ Отменить', 'negative')]]
        : [];
  return rows.length ? keyboard(rows) : undefined;
}

const ownerText = (text: string, o: OrderState) =>
  `${text}\n\nСтатус: ${STATUS_LABEL[o.status]}${o.customerChatId ? ' · покупатель получает уведомления в MAX' : ''}`;

/** Тексты заказов у Оксаны, чтобы при смене статуса перерисовать сообщение */
const orderTexts = new Map<string, string>();

export const botReady = () => Boolean(OWNER_CHAT);

/** Новый заказ: сообщение Оксане с кнопками. Возвращает ссылку для покупателя на статус в MAX */
export async function announceOrder(id: string, text: string, pickup: boolean) {
  const o = addOrder(id, pickup);
  const full = `🛒 Заказ ${id} с сайта\n\n${text}`;
  orderTexts.set(id, full);
  await sendToChat(OWNER_CHAT, { text: ownerText(full, o), attachments: ownerButtons(id, o.status) });
  return botName ? `https://max.ru/${botName}?start=${o.token}` : undefined;
}

async function onCallback(u: Update) {
  const cb = u.callback!;
  // Кнопки статуса работают только в чате Оксаны
  if (u.message?.recipient?.chat_id !== OWNER_CHAT) return answerCallback(cb.callback_id, 'Недоступно');
  const [kind, id, to] = (cb.payload || '').split(':');
  const o = kind === 'st' ? getOrder(id) : undefined;
  if (!o || !(to in STATUS_LABEL)) return answerCallback(cb.callback_id, 'Заказ не найден — возможно, он старше 30 дней');
  if (o.status === to) return answerCallback(cb.callback_id, 'Статус уже установлен');

  updateOrder(id, { status: to as Status });
  let note = `Заказ ${id}: ${STATUS_LABEL[o.status]}`;
  if (o.customerChatId) {
    try {
      await sendToChat(o.customerChatId, { text: customerText(id, o) });
      note += ' · покупатель уведомлён';
    } catch (e) {
      console.error('notify customer failed', id, e);
      note += ' · не удалось уведомить покупателя';
    }
  } else {
    note += ' · покупатель не подключил MAX — позвоните ему';
  }
  // Сообщение перерисовываем с новым статусом; если текст потерялся после перезапуска — берём из исходного
  const base = orderTexts.get(id) || (u.message?.body?.text || '').replace(/\n\nСтатус: .*$/s, '');
  await answerCallback(cb.callback_id, note, { text: ownerText(base, o), attachments: ownerButtons(id, o.status) ?? [] });
}

/** Привязать чат покупателя к заказу по секретному коду; false — код не найден */
async function linkCustomer(chat: number, token: string) {
  const found = findByToken(token);
  if (!found) return false;
  const [id, o] = found;
  updateOrder(id, { customerChatId: chat });
  await sendToChat(chat, { text: customerText(id, o) });
  return true;
}

const HELLO = `Здравствуйте! Сюда приходят уведомления о заказах с сайта Оксаны Вдовиной${SITE_URL ? ` (${SITE_URL})` : ''}. ` +
  'Оформите заказ на сайте и нажмите «Следить за заказом в MAX» или отправьте сюда код со страницы заказа.';

async function onStart(u: Update) {
  const chat = u.chat_id;
  if (!chat) return;
  if (u.payload && (await linkCustomer(chat, u.payload))) return;
  if (chat !== OWNER_CHAT) await sendToChat(chat, { text: HELLO });
}

/**
 * Если диалог с ботом уже был, переход по ссылке ?start= не присылает событие —
 * поэтому код заказа можно просто отправить боту сообщением.
 */
async function onMessage(u: Update) {
  const chat = u.message?.recipient?.chat_id;
  if (!chat || u.message?.sender?.is_bot) return;
  // Для настройки: так находится MAX_CHAT_ID Оксаны (journalctl -u oksana-orders | grep "MAX message")
  if (chat !== OWNER_CHAT) console.log(`MAX message from ${u.message?.sender?.name ?? '?'} chat_id=${chat}`);
  const code = (u.message?.body?.text || '').match(/[A-Za-z0-9_-]{16}/)?.[0];
  if (code && (await linkCustomer(chat, code))) return;
  if (chat === OWNER_CHAT) return;
  // Покупателям бот не переписывается: подсказываем, куда звонить
  await sendToChat(chat, {
    text: code
      ? `Заказ с таким кодом не найден. Проверьте код на странице заказа или позвоните: ${PHONE}.`
      : `Это бот уведомлений о заказах — сообщения здесь не читаются. Вопросы по заказу: ${PHONE}.`,
  });
}

async function handle(u: Update) {
  try {
    if (u.update_type === 'message_callback' && u.callback) await onCallback(u);
    else if (u.update_type === 'bot_started') await onStart(u);
    else if (u.update_type === 'message_created') await onMessage(u);
  } catch (e) {
    console.error('update failed', u.update_type, e);
  }
}

/** Long polling в фоне: на VDS не нужен публичный webhook */
export async function startBot() {
  try {
    const me = await getMe();
    botName = botName || me.username || '';
    console.log(`MAX bot @${botName}`);
  } catch (e) {
    console.error('MAX /me failed', e);
  }
  for (;;) {
    try {
      const { updates, marker } = await getUpdates(getMarker(), ['message_callback', 'bot_started', 'message_created']);
      for (const u of updates) await handle(u);
      setMarker(marker);
    } catch (e) {
      console.error('MAX polling', (e as Error).message);
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}
