import { BY_ID } from '../src/data/menu';
import { cartTotal, maskPhone, orderText, phoneOk, type OrderForm } from '../src/lib/format';

/** Заказ, собранный и проверенный на сервере: цены и текст берутся из меню, а не от клиента */
export interface Order {
  items: Record<string, number>;
  form: OrderForm;
  total: number;
  text: string;
}

const LIMITS: Record<keyof OrderForm, number> = { name: 80, phone: 30, date: 20, guests: 3, method: 10, address: 300, note: 1000 };
const MAX_LINES = 100;
const MAX_QTY = 999;

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Возвращает заказ или текст ошибки для клиента */
export function parseOrder(body: unknown): Order | string {
  if (!body || typeof body !== 'object') return 'bad_body';
  const { items: rawItems, form: rawForm } = body as { items?: unknown; form?: unknown };

  if (!rawItems || typeof rawItems !== 'object') return 'no_items';
  const entries = Object.entries(rawItems as Record<string, unknown>);
  if (!entries.length || entries.length > MAX_LINES) return 'bad_items';
  const items: Record<string, number> = {};
  for (const [id, q] of entries) {
    if (!Object.prototype.hasOwnProperty.call(BY_ID, id) || !Number.isInteger(q) || (q as number) < 1 || (q as number) > MAX_QTY) return 'bad_items';
    items[id] = q as number;
  }

  const f = (rawForm && typeof rawForm === 'object' ? rawForm : {}) as Record<string, unknown>;
  const form: OrderForm = {
    name: str(f.name, LIMITS.name),
    phone: maskPhone(str(f.phone, LIMITS.phone)),
    date: str(f.date, LIMITS.date),
    guests: str(f.guests, LIMITS.guests).replace(/\D/g, ''),
    method: f.method === 'delivery' ? 'delivery' : 'pickup',
    address: str(f.address, LIMITS.address),
    note: str(f.note, LIMITS.note),
  };
  if (!form.name) return 'no_name';
  if (!phoneOk(form.phone)) return 'bad_phone';
  if (form.method === 'delivery' && !form.address) return 'no_address';
  if (form.date && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(form.date)) return 'bad_date';

  return { items, form, total: cartTotal(items), text: orderText(items, form) };
}
