import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { BY_ID, shortName } from '../data/menu';
import { goal } from '../lib/analytics';
import { cartLines, cartTotal, emptyForm, type OrderForm } from '../lib/format';

type Items = Record<string, number>;

type Action =
  | { type: 'add'; id: string; n: number }
  | { type: 'set'; id: string; q: number }
  | { type: 'merge'; items: Items }
  | { type: 'clear' };

function reducer(s: Items, a: Action): Items {
  switch (a.type) {
    case 'add': return { ...s, [a.id]: Math.max(0, (s[a.id] || 0) + a.n) };
    case 'set': {
      const n = { ...s };
      if (a.q <= 0) delete n[a.id]; else n[a.id] = Math.min(999, a.q);
      return n;
    }
    case 'merge': {
      const n = { ...s };
      for (const [id, q] of Object.entries(a.items)) if (q > 0) n[id] = (n[id] || 0) + q;
      return n;
    }
    case 'clear': return {};
  }
}

const load = <T,>(key: string, fallback: T): T => {
  try { const v = localStorage.getItem(key); return v ? { ...fallback, ...JSON.parse(v) } : fallback; } catch { return fallback; }
};

interface Ctx {
  items: Items;
  lines: ReturnType<typeof cartLines>;
  count: number;
  total: number;
  hasFrom: boolean;
  add: (id: string, n?: number, from?: HTMLElement | null) => void;
  set: (id: string, q: number) => void;
  merge: (items: Items, from?: HTMLElement | null) => void;
  clear: () => void;
  form: OrderForm;
  setForm: (patch: Partial<OrderForm>) => void;
  /** Стереть данные формы (имя, телефон, адрес) после отправки заказа */
  resetForm: () => void;
  drawer: boolean;
  setDrawer: (v: boolean) => void;
  toast: (msg: string) => void;
  toastMsg: { id: number; msg: string } | null;
  bump: number;
}

const CartCtx = createContext<Ctx | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, undefined, () => {
    const raw = load<Items>('ov_cart', {});
    return Object.fromEntries(Object.entries(raw).filter(([id, q]) => BY_ID[id] && q > 0));
  });
  const [form, setFormState] = useState<OrderForm>(() => load('ov_form', emptyForm));
  const [drawer, setDrawer] = useState(false);
  const [toastMsg, setToast] = useState<Ctx['toastMsg']>(null);
  const [bump, setBump] = useState(0);
  const tid = useRef<number>();

  useEffect(() => { try { localStorage.setItem('ov_cart', JSON.stringify(items)); } catch { /* приватный режим */ } }, [items]);
  useEffect(() => { try { localStorage.setItem('ov_form', JSON.stringify(form)); } catch { /* приватный режим */ } }, [form]);

  const toast = useCallback((msg: string) => {
    setToast({ id: Date.now(), msg });
    window.clearTimeout(tid.current);
    tid.current = window.setTimeout(() => setToast(null), 2400);
  }, []);

  const add = useCallback((id: string, n = 1, from?: HTMLElement | null) => {
    dispatch({ type: 'add', id, n });
    if (n > 0) {
      goal('add_to_cart', { id, qty: n });
      flyToCart(from, BY_ID[id]?.img).then(() => setBump((b) => b + 1));
      toast(`«${shortName(BY_ID[id].name)}» в заказе`);
    }
  }, [toast]);

  const merge = useCallback((m: Items, from?: HTMLElement | null) => {
    dispatch({ type: 'merge', items: m });
    goal('add_to_cart', { source: 'constructor', items: Object.keys(m).length });
    const first = Object.keys(m)[0];
    flyToCart(from, first ? BY_ID[first]?.img : null).then(() => setBump((b) => b + 1));
  }, []);

  const value = useMemo<Ctx>(() => {
    const lines = cartLines(items);
    return {
      items, lines,
      count: lines.reduce((a, l) => a + l.q, 0),
      total: cartTotal(items),
      hasFrom: lines.some((l) => l.p.from),
      add, merge,
      set: (id, q) => dispatch({ type: 'set', id, q }),
      clear: () => dispatch({ type: 'clear' }),
      form, setForm: (patch) => setFormState((f) => ({ ...f, ...patch })),
      resetForm: () => setFormState(emptyForm),
      drawer, setDrawer, toast, toastMsg, bump,
    };
  }, [items, form, drawer, toastMsg, bump, add, merge, toast]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error('useCart вне CartProvider');
  return c;
};

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Летящая к корзине картинка товара — дуга с уменьшением */
function flyToCart(from: HTMLElement | null | undefined, img: string | null | undefined): Promise<void> {
  const target = [...document.querySelectorAll<HTMLElement>('[data-cart-target]')].find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight && getComputedStyle(el).visibility !== 'hidden';
  });
  if (!from || !target || reduced()) return Promise.resolve();
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(110, Math.max(56, a.width * 0.5));
  const el = document.createElement('div');
  el.className = 'fly';
  el.style.cssText = `width:${size}px;height:${size}px;left:${a.left + a.width / 2 - size / 2}px;top:${a.top + a.height / 2 - size / 2}px;` +
    (img ? `background-image:url(${img})` : '');
  document.body.appendChild(el);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = el.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 140}px) scale(.7) rotate(-12deg)`, opacity: 1, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(.16) rotate(8deg)`, opacity: 0.6 },
  ], { duration: 820, easing: 'cubic-bezier(.5,0,.3,1)' });
  return anim.finished.then(() => el.remove(), () => el.remove());
}
