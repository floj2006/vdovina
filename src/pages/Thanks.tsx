import { motion } from 'framer-motion';
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Page } from '../components/Layout';
import { SITE } from '../data/site';
import { useSeo } from '../lib/useSeo';
import { useCart } from '../store/cart';

const COLORS = ['#9A2F3E', '#C39A5B', '#E3C38E', '#7E8C6A', '#B8445A'];

export default function Thanks() {
  useSeo('Спасибо за заказ');
  const { count, clear } = useCart();
  const [cleared, setCleared] = useState(false);
  const sent = Boolean((useLocation().state as { sent?: boolean } | null)?.sent);
  const bits = [...Array(36)].map((_, i) => ({
    x: (Math.cos(i * 2.4) * (140 + (i % 5) * 40)),
    y: (Math.sin(i * 2.4) * (110 + (i % 4) * 36)) - 40,
    r: (i * 47) % 360,
    c: COLORS[i % COLORS.length],
    round: i % 3 === 0,
  }));
  return (
    <Page className="thanks-page">
      <section className="thanks wrap">
        <div className="th-burst" aria-hidden>
          {bits.map((b, i) => (
            <motion.i key={i} className={b.round ? 'r' : ''} style={{ background: b.c }}
              initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
              animate={{ x: b.x, y: [0, b.y, b.y + 180], scale: [0, 1, 0.8], rotate: b.r + 360, opacity: [1, 1, 0] }}
              transition={{ duration: 2.2, delay: 0.5 + (i % 6) * 0.03, ease: 'easeOut' }} />
          ))}
        </div>
        <svg className="th-check" viewBox="0 0 120 120" aria-hidden>
          <motion.circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="5"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: 'easeInOut' }} />
          <motion.path d="M38 62 L54 77 L84 45" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.45, delay: 0.6 }} />
        </svg>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>Спасибо! <em>{sent ? 'Заказ принят' : 'Заказ почти у Оксаны'}</em></motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
          {sent
            ? <>Заказ отправлен — Оксана свяжется с вами, подтвердит состав, время и сумму. Если срочно, позвоните: <a href={SITE.phoneHref}>{SITE.phone}</a>.</>
            : <>Отправьте сообщение в открывшемся окне — Оксана ответит, подтвердит состав, время и сумму. Если окно не открылось, позвоните: <a href={SITE.phoneHref}>{SITE.phone}</a>.</>}
        </motion.p>
        <motion.div className="row center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.15 }}>
          {count > 0 && !cleared && (
            <button className="btn btn-ghost" onClick={() => { clear(); setCleared(true); }}>Очистить корзину</button>
          )}
          <Link to="/cart" className="btn btn-ghost">Вернуться к заказу</Link>
          <Link to="/" className="btn btn-primary">На главную</Link>
        </motion.div>
      </section>
    </Page>
  );
}
