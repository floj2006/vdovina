import { BY_ID } from '../data/menu';

export const rub = (n: number) => n.toLocaleString('ru-RU') + ' ₽';

export const plural = (n: number, f: [string, string, string]) => {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return f[2];
  if (b > 1 && b < 5) return f[1];
  if (b === 1) return f[0];
  return f[2];
};

export const guestsWord = (n: number) => plural(n, ['гость', 'гостя', 'гостей']);
export const piecesWord = (n: number) => plural(n, ['закуска', 'закуски', 'закусок']);

export interface OrderForm {
  name: string;
  phone: string;
  date: string;
  guests: string;
  method: 'pickup' | 'delivery';
  address: string;
  note: string;
}

/** Маска российского номера: +7 (908) 049-56-39. 8 в начале заменяется на 7 */
export function maskPhone(v: string) {
  let d = v.replace(/\D/g, '');
  if (!d) return '';
  if (d[0] === '8') d = '7' + d.slice(1);
  if (d[0] !== '7') d = '7' + d;
  d = d.slice(0, 11);
  const p = [d.slice(1, 4), d.slice(4, 7), d.slice(7, 9), d.slice(9, 11)];
  let out = '+7';
  if (p[0]) out += ` (${p[0]}`;
  if (p[0].length === 3 && p[1]) out += `) ${p[1]}`;
  if (p[2]) out += `-${p[2]}`;
  if (p[3]) out += `-${p[3]}`;
  return out;
}

export const phoneOk = (v: string) => /^7\d{10}$/.test(v.replace(/\D/g, ''));

/** Значение для input[type=datetime-local] в локальном времени */
export const toLocalInput = (d: Date) => {
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;
};

/** Срок до получения: past — дата прошла, soon — меньше суток (стоит предупредить) */
export function dateStatus(v: string): 'empty' | 'past' | 'soon' | 'ok' {
  if (!v) return 'empty';
  const t = new Date(v).getTime();
  if (isNaN(t)) return 'empty';
  const left = t - Date.now();
  if (left < 0) return 'past';
  return left < 24 * 3600_000 ? 'soon' : 'ok';
}

export const emptyForm: OrderForm = { name: '', phone: '', date: '', guests: '', method: 'pickup', address: '', note: '' };

export const cartLines = (items: Record<string, number>) =>
  Object.entries(items).filter(([id, q]) => Object.prototype.hasOwnProperty.call(BY_ID, id) && q > 0).map(([id, q]) => ({ p: BY_ID[id], q }));

export const cartTotal = (items: Record<string, number>) =>
  cartLines(items).reduce((s, { p, q }) => s + p.price * q, 0);

export function orderText(items: Record<string, number>, f: OrderForm) {
  const lines = cartLines(items);
  const hasFrom = lines.some(({ p }) => p.from);
  const out = ['Здравствуйте, Оксана! Хочу сделать заказ:', ''];
  for (const { p, q } of lines) out.push(`• ${p.name} — ${q} × ${rub(p.price)}${p.from ? ' (от)' : ''} = ${rub(p.price * q)}`);
  out.push('', `Итого: ${hasFrom ? 'от ' : ''}${rub(cartTotal(items))}`);
  const extra: [string, string][] = [
    ['Гостей', f.guests],
    ['Дата и время', f.date ? formatDate(f.date) : ''],
    ['Получение', f.method === 'delivery' ? `доставка${f.address ? ': ' + f.address : ''}` : 'самовывоз'],
    ['Имя', f.name],
    ['Телефон', f.phone],
    ['Комментарий', f.note],
  ];
  const filled = extra.filter(([, v]) => v.trim());
  if (filled.length) out.push('', ...filled.map(([k, v]) => `${k}: ${v.trim()}`));
  return out.join('\n');
}

export function formatDate(v: string) {
  const d = new Date(v);
  if (isNaN(+d)) return v;
  return d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short', hour: '2-digit', minute: '2-digit' });
}
