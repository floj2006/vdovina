/**
 * Яндекс Метрика, которая загружается только после согласия на аналитические cookie.
 * Счётчик задаётся VITE_YM_ID; без него все вызовы — пустые.
 */

export type Consent = 'all' | 'necessary';

/** Цели Метрики — заведите такие же идентификаторы в интерфейсе счётчика */
export type Goal =
  | 'add_to_cart'
  | 'checkout_details'
  | 'checkout_review'
  | 'order_sent'
  | 'order_failed'
  | 'order_wa'
  | 'order_vk'
  | 'call_click';

const KEY = 'ov_consent';
const EVENT = 'ov:consent-open';
const YM_ID = Number(import.meta.env.VITE_YM_ID) || 0;

type Ym = (id: number, method: string, ...args: unknown[]) => void;
declare global {
  interface Window { ym?: Ym & { a?: unknown[]; l?: number } }
}

let loaded = false;

export function getConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'all' || v === 'necessary' ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: Consent) {
  try { localStorage.setItem(KEY, v); } catch { /* приватный режим */ }
  if (v === 'all' && !loaded) {
    load();
    hit(location.pathname + location.search);
  }
  // Отзыв согласия: стираем cookie Метрики и перезагружаем страницу, чтобы выгрузить счётчик
  if (v === 'necessary' && loaded) {
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0].trim();
      if (name.startsWith('_ym')) {
        const host = location.hostname;
        for (const domain of ['', `; domain=${host}`, `; domain=.${host.replace(/^www\./, '')}`]) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
        }
      }
    }
    location.reload();
  }
}

const allowed = () => loaded && !!window.ym && getConsent() === 'all';

/** Открыть баннер повторно (кнопка «Настройки cookie» в футере) */
export const openConsent = () => window.dispatchEvent(new Event(EVENT));
export const onConsentOpen = (fn: () => void) => {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
};

export function initAnalytics() {
  if (getConsent() === 'all') load();
  document.addEventListener('click', (e) => {
    if ((e.target as Element | null)?.closest?.('a[href^="tel:"]')) goal('call_click');
  });
}

function load() {
  if (loaded || !YM_ID || typeof window === 'undefined') return;
  loaded = true;
  const ym = ((...args: unknown[]) => { (ym.a = ym.a || []).push(args); }) as NonNullable<Window['ym']>;
  ym.l = Date.now();
  window.ym = window.ym || ym;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://mc.yandex.ru/metrika/tag.js';
  document.head.appendChild(s);
  // defer: просмотры отправляем сами при смене маршрута (SPA)
  window.ym(YM_ID, 'init', { defer: true, clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: false });
}

let prevUrl = '';

export function hit(url: string) {
  if (!allowed() || url === prevUrl) return;
  // Для внутренних переходов источник — предыдущая страница сайта
  const referer = prevUrl ? location.origin + prevUrl : document.referrer;
  prevUrl = url;
  window.ym!(YM_ID, 'hit', url, { title: document.title, referer });
}

export function goal(name: Goal, params?: Record<string, unknown>) {
  if (allowed()) window.ym!(YM_ID, 'reachGoal', name, params);
}
