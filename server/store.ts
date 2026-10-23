/**
 * Состояние заказов для бота: статус, секретная ссылка клиента и его чат в MAX.
 * Один JSON-файл в ORDERS_DIR — для десятков заказов в день этого достаточно.
 */
import { randomBytes } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export type Status = 'new' | 'confirmed' | 'ready' | 'rejected';

export interface OrderState {
  status: Status;
  /** Секрет для ссылки https://max.ru/<бот>?start=<token>: по номеру заказа чужой чат не подключить */
  token: string;
  createdAt: number;
  pickup: boolean;
  /** Чат покупателя в MAX — только если он сам открыл бота по ссылке со страницы «Спасибо» */
  customerChatId?: number;
}

interface State { marker: number | null; orders: Record<string, OrderState> }

const KEEP_MS = 30 * 24 * 3600_000;

let file = '';
let state: State = { marker: null, orders: {} };
let saving = Promise.resolve();

export async function loadStore(dir: string) {
  await mkdir(dir, { recursive: true });
  file = join(dir, 'bot-state.json');
  try {
    state = JSON.parse(await readFile(file, 'utf8')) as State;
  } catch {
    state = { marker: null, orders: {} };
  }
}

/** Запись через временный файл, по очереди — файл не бьётся при одновременных изменениях */
function persist() {
  const now = Date.now();
  for (const [id, o] of Object.entries(state.orders)) if (now - o.createdAt > KEEP_MS) delete state.orders[id];
  const snapshot = JSON.stringify(state);
  saving = saving.then(async () => {
    await writeFile(`${file}.tmp`, snapshot, { mode: 0o600 });
    await rename(`${file}.tmp`, file);
  }).catch((e) => console.error('store save failed', e));
  return saving;
}

export const newToken = () => randomBytes(12).toString('base64url');

export function addOrder(id: string, pickup: boolean) {
  const o: OrderState = { status: 'new', token: newToken(), createdAt: Date.now(), pickup };
  state.orders[id] = o;
  void persist();
  return o;
}

export const getOrder = (id: string) => (Object.prototype.hasOwnProperty.call(state.orders, id) ? state.orders[id] : undefined);

export const findByToken = (token: string) =>
  Object.entries(state.orders).find(([, o]) => o.token === token) as [string, OrderState] | undefined;

export function updateOrder(id: string, patch: Partial<OrderState>) {
  const o = getOrder(id);
  if (!o) return undefined;
  Object.assign(o, patch);
  void persist();
  return o;
}

export const getMarker = () => state.marker;
export function setMarker(m: number | null | undefined) {
  if (m == null || m === state.marker) return;
  state.marker = m;
  void persist();
}
