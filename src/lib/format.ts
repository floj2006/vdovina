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

export const emptyForm: OrderForm = { name: '', phone: '', date: '', guests: '', method: 'pickup', address: '', note: '' };

export const cartLines = (items: Record<string, number>) =>
  Object.entries(items).filter(([id, q]) => BY_ID[id] && q > 0).map(([id, q]) => ({ p: BY_ID[id], q }));

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
