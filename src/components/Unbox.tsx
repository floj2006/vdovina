import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { shortName } from '../data/menu';
import { Img } from './ui';

/**
 * «Распаковка» бокса: развязывается лента, поднимается крышка,
 * уходит пергамент — и видно, что внутри.
 */
export function Unbox({ img, name, autoDelay = 0.3, open: controlled, onToggle, big }: {
  img: string | null; name: string; autoDelay?: number; open?: boolean; onToggle?: (v: boolean) => void; big?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -20% 0px' });
  const [self, setSelf] = useState(false);
  const open = controlled ?? self;

  useEffect(() => {
    if (!inView || controlled !== undefined) return;
    const t = setTimeout(() => setSelf(true), autoDelay * 1000);
    return () => clearTimeout(t);
  }, [inView, autoDelay, controlled]);

  const toggle = () => (onToggle ? onToggle(!open) : setSelf((v) => !v));
  const st = open ? 'open' : 'closed';
  const label = shortName(name).replace(/^Бокс( для девушек)?\s*/, '').replace(/, \d+ шт$/, '') || 'Бокс';

  return (
    <motion.div ref={ref} className={`unbox ${big ? 'big' : ''}`} initial={false} animate={st} onClick={toggle}
      role="button" tabIndex={0} aria-pressed={open} aria-label={open ? 'Закрыть коробку' : 'Открыть коробку'}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), toggle())}>
      <div className="ub-tray">
        <motion.div className="ub-photo" variants={{ closed: { scale: 1.15, filter: 'brightness(.7)' }, open: { scale: 1, filter: 'brightness(1)', transition: { delay: 0.7, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] } } }}>
          <Img src={img} alt={name} />
        </motion.div>
        <motion.div className="ub-tissue l" variants={{ closed: { x: '0%', rotate: 0 }, open: { x: '-104%', rotate: -6, transition: { delay: 0.6, duration: 0.7, ease: [0.6, 0, 0.3, 1] } } }} />
        <motion.div className="ub-tissue r" variants={{ closed: { x: '0%', rotate: 0 }, open: { x: '104%', rotate: 6, transition: { delay: 0.65, duration: 0.7, ease: [0.6, 0, 0.3, 1] } } }} />
        {[...Array(6)].map((_, i) => (
          <motion.i key={i} className="ub-spark" style={{ left: `${12 + i * 15}%`, top: `${20 + ((i * 37) % 60)}%` }}
            variants={{ closed: { scale: 0, opacity: 0 }, open: { scale: [0, 1.2, 0], opacity: [0, 1, 0], transition: { delay: 1.1 + i * 0.08, duration: 0.9 } } }} />
        ))}
      </div>

      <motion.div className="ub-lid"
        variants={{
          closed: { rotateX: 0, y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
          open: { rotateX: -112, y: -18, opacity: 0, transition: { delay: 0.25, duration: 0.95, ease: [0.5, 0, 0.2, 1], opacity: { delay: 0.85, duration: 0.3 } } },
        }}>
        <div className="ub-label">
          <span className="mono">ОВ</span>
          <span className="ub-name"><b>{label}</b><small>ручная работа</small></span>
        </div>
        <motion.span className="rb v" variants={{ closed: { scaleY: 1 }, open: { scaleY: 0, transition: { duration: 0.35 } } }} />
        <motion.span className="rb h" variants={{ closed: { scaleX: 1 }, open: { scaleX: 0, transition: { duration: 0.35 } } }} />
        <motion.span className="bow" variants={{ closed: { scale: 1, rotate: 0 }, open: { scale: 0, rotate: 90, transition: { duration: 0.3 } } }}>
          <i /><i />
        </motion.span>
      </motion.div>

      <motion.span className="ub-hint" variants={{ closed: { opacity: 1, y: 0 }, open: { opacity: 0, y: 8 } }}>Нажмите, чтобы открыть</motion.span>
    </motion.div>
  );
}
