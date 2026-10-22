import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';
import { Fragment, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CAT, type Product } from '../data/menu';
import { useCart } from '../store/cart';
import { IMinus, IPlus } from './Icons';

/* ---------- Изображение с плавным появлением и заглушкой ---------- */
export function Img({ src, alt, className = '', eager, ...rest }: { src: string | null; alt: string; className?: string; eager?: boolean } & Omit<HTMLMotionProps<'img'>, 'src' | 'alt'>) {
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`ph ${className}`} role="img" aria-label={alt}>
        <span className="mono">ОВ</span>
        <small>фото скоро</small>
      </div>
    );
  }
  return (
    <motion.img
      src={src} alt={alt} className={`${className} ${ok ? 'ok' : ''} lz`}
      loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false}
      onLoad={() => setOk(true)} onError={() => setErr(true)} {...rest}
    />
  );
}

/* ---------- Появление при прокрутке ---------- */
export function Reveal({ children, delay = 0, y = 28, className, as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'section' | 'li' }) {
  const M = motion[as];
  return (
    <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, delay, ease: [0.2, 0.8, 0.2, 1] }}>
      {children}
    </M>
  );
}

/* ---------- Заголовок по словам ---------- */
export function SplitTitle({ text, em, as = 'h2', className, delay = 0 }: { text: string; em?: string; as?: 'h1' | 'h2'; className?: string; delay?: number }) {
  const H = motion[as];
  const words = text.split(' ');
  const emWords = em ? em.split(' ') : [];
  const w = (s: string, i: number, isEm: boolean) => (
    <Fragment key={(isEm ? 'e' : 't') + i}>
      <span className="w">
        <motion.span className={isEm ? 'em' : undefined} variants={{ h: { y: '110%' }, v: { y: '0%' } }}
          transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}>{s}</motion.span>
      </span>{' '}
    </Fragment>
  );
  return (
    <H className={className} initial="h" whileInView="v" viewport={{ once: true }}
      transition={{ staggerChildren: 0.06, delayChildren: delay }}>
      {words.map((s, i) => w(s, i, false))}
      {emWords.map((s, i) => w(s, i, true))}
    </H>
  );
}

export function SectionHead({ kicker, title, em, text, center }: { kicker: string; title: string; em?: string; text?: string; center?: boolean }) {
  return (
    <div className={`sec-head ${center ? 'center' : ''}`}>
      <div>
        <Reveal><div className="kicker">{kicker}</div></Reveal>
        <SplitTitle text={title} em={em} />
      </div>
      {text && <Reveal delay={0.15}><p>{text}</p></Reveal>}
    </div>
  );
}

/* ---------- Счётчик количества ---------- */
export function Stepper({ value, onChange, min = 0, small }: { value: number; onChange: (v: number) => void; min?: number; small?: boolean }) {
  return (
    <div className={`step ${small ? 'sm' : ''}`}>
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} aria-label="Меньше"><IMinus /></button>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.output key={value} initial={{ y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 14, opacity: 0 }} transition={{ duration: 0.18 }}>
          {value}
        </motion.output>
      </AnimatePresence>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="Больше"><IPlus /></button>
    </div>
  );
}

/* ---------- Кнопка «В заказ» ↔ степпер ---------- */
export function AddControl({ p, imgRef, big }: { p: Product; imgRef?: RefObject<HTMLElement>; big?: boolean }) {
  const { items, add, set } = useCart();
  const q = items[p.id] || 0;
  return (
    <div className={`addc ${big ? 'big' : ''}`}>
      <AnimatePresence mode="wait" initial={false}>
        {q === 0 ? (
          <motion.button key="add" type="button" className="add" onClick={(e) => add(p.id, 1, imgRef?.current ?? e.currentTarget)}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} whileTap={{ scale: 0.94 }}>
            <IPlus /> В заказ
          </motion.button>
        ) : (
          <motion.div key="step" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
            <Stepper value={q} onChange={(v) => set(p.id, v)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const catTitle = (p: Product) => CAT[p.cat].title;

/* ---------- Анимированное число ---------- */
export function Counter({ value, format = (n: number) => String(n) }: { value: number; format?: (n: number) => string }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / 500);
      const e = 1 - Math.pow(1 - k, 3);
      setShown(Math.round(a + (value - a) * e));
      if (k < 1) raf = requestAnimationFrame(tick); else from.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = value; };
  }, [value]);
  return <>{format(shown)}</>;
}
