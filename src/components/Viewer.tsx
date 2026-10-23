import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IClose, IMinus, IPlus, IRotate } from './Icons';
import { lockScroll } from '../lib/lock';

/* ---------- 3D-наклон с бликом ---------- */
/** На тач-экранах наклона нет — и не нужно делать каждую карточку отдельным 3D-слоем с бликом */
const canHover = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover)').matches;

export function Tilt(props: { children: ReactNode; max?: number; className?: string; glare?: boolean }) {
  if (!canHover) return <div className={`tilt ${props.className ?? ''}`}>{props.children}</div>;
  return <TiltInner {...props} />;
}

function TiltInner({ children, max = 10, className = '', glare = true }: { children: ReactNode; max?: number; className?: string; glare?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 18 });
  const sy = useSpring(py, { stiffness: 160, damping: 18 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const gx = useTransform(sx, (v) => `${v * 100}%`);
  const gy = useTransform(sy, (v) => `${v * 100}%`);
  const bg = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,.38), transparent 55%)`;

  const move = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = ref.current!.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const leave = () => { px.set(0.5); py.set(0.5); };

  return (
    <motion.div ref={ref} className={`tilt ${className}`} onPointerMove={move} onPointerLeave={leave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}>
      {children}
      {glare && <motion.div className="glare" style={{ background: bg }} />}
    </motion.div>
  );
}

/* ---------- Лупа под курсором ---------- */
export function ZoomLens({ src, alt, onOpen, zoom = 2.4, children }: { src: string; alt: string; onOpen?: () => void; zoom?: number; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const bx = useMotionValue('50%');
  const by = useMotionValue('50%');
  const size = 190;
  const bgPos = useMotionTemplate`${bx} ${by}`;

  const move = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    const r = ref.current!.getBoundingClientRect();
    const cx = e.clientX - r.left;
    const cy = e.clientY - r.top;
    x.set(cx - size / 2);
    y.set(cy - size / 2);
    bx.set(`${(cx / r.width) * 100}%`);
    by.set(`${(cy / r.height) * 100}%`);
  };

  return (
    <div ref={ref} className="lens-wrap" onPointerEnter={(e) => e.pointerType !== 'touch' && setOn(true)}
      onPointerLeave={() => setOn(false)} onPointerMove={move} onClick={onOpen} role="button" tabIndex={0}
      aria-label={`Открыть фото: ${alt}`} onKeyDown={(e) => e.key === 'Enter' && onOpen?.()}>
      {children}
      <AnimatePresence>
        {on && (
          <motion.div className="lens" aria-hidden
            style={{ x, y, width: size, height: size, backgroundImage: `url(${src})`, backgroundSize: `${zoom * 100}%`, backgroundPosition: bgPos }}
            initial={{ scale: 0.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.3, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- Полноэкранный просмотр: зум колесом/кнопками, перетаскивание ---------- */
export function Lightbox({ src, alt, open, onClose, layoutId }: { src: string; alt: string; open: boolean; onClose: () => void; layoutId?: string }) {
  const [scale, setScale] = useState(1);
  const [rot, setRot] = useState(0);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  useEffect(() => {
    if (!open) return;
    setScale(1); setRot(0); x.set(0); y.set(0);
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setScale((s) => Math.min(4, s + 0.5));
      if (e.key === '-') setScale((s) => Math.max(1, s - 0.5));
    };
    document.addEventListener('keydown', k);
    const unlock = lockScroll();
    return () => { document.removeEventListener('keydown', k); unlock(); };
  }, [open, onClose, x, y]);

  useEffect(() => { if (scale === 1) { x.set(0); y.set(0); } }, [scale, x, y]);

  if (import.meta.env.SSR) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div className="lb" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onWheel={(e) => setScale((s) => Math.min(4, Math.max(1, s - e.deltaY * 0.002)))}>
          <div className="lb-bg" onClick={onClose} />
          <motion.div className="lb-stage" layoutId={layoutId}
            initial={layoutId ? undefined : { scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={layoutId ? undefined : { scale: 0.85, opacity: 0 }}>
            <motion.img src={src} alt={alt} draggable={false}
              drag={scale > 1} dragElastic={0.12} dragMomentum={false}
              style={{ x, y, cursor: scale > 1 ? 'grab' : 'zoom-in' }}
              animate={{ scale, rotate: rot }} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
              onClick={() => scale === 1 && setScale(2)} />
          </motion.div>
          <div className="lb-ui">
            <button onClick={() => setScale((s) => Math.max(1, s - 0.5))} aria-label="Уменьшить"><IMinus /></button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(4, s + 0.5))} aria-label="Увеличить"><IPlus /></button>
            <button onClick={() => setRot((r) => r + 90)} aria-label="Повернуть"><IRotate /></button>
          </div>
          <button className="lb-x" onClick={onClose} aria-label="Закрыть"><IClose /></button>
          <div className="lb-hint">{scale > 1 ? 'Перетаскивайте фото' : 'Нажмите на фото или прокрутите колесо, чтобы приблизить'}</div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
