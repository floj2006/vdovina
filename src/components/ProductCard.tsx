import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { CAT, HITS, NEW, shortName, type Product } from '../data/menu';
import { rub } from '../lib/format';
import { IArrow, IClose, IZoom } from './Icons';
import { AddControl, Img } from './ui';
import { Tilt, ZoomLens } from './Viewer';
import { lockScroll } from '../lib/lock';

export function Badges({ p }: { p: Product }) {
  return (
    <div className="badges">
      {HITS.has(p.id) && <span className="bdg hit">Хит</span>}
      {NEW.has(p.id) && <span className="bdg new">Новинка</span>}
    </div>
  );
}

export function Price({ p }: { p: Product }) {
  return <span className="price">{p.from && <small>от </small>}{rub(p.price)}</span>;
}

export function ProductCard({ p, onQuick, i = 0 }: { p: Product; onQuick?: (p: Product) => void; i?: number }) {
  const imgRef = useRef<HTMLDivElement>(null);
  return (
    <motion.article className="card" layout
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, delay: Math.min(i, 8) * 0.04, ease: [0.2, 0.8, 0.2, 1] }}>
      <Tilt max={6} className="card-tilt">
        <motion.div ref={imgRef} className="card-img" layoutId={`qv-${p.id}`}
          onClick={() => onQuick?.(p)} role={onQuick ? 'button' : undefined} tabIndex={onQuick ? 0 : undefined}
          onKeyDown={(e) => e.key === 'Enter' && onQuick?.(p)} aria-label={`Быстрый просмотр: ${p.name}`}>
          <Img src={p.img} alt={p.name} />
          <Badges p={p} />
          {onQuick && <span className="peek"><IZoom /> Рассмотреть</span>}
        </motion.div>
      </Tilt>
      <div className="card-b">
        <Link to={`/product/${p.slug}`} className="card-t">{shortName(p.name)}</Link>
        <div className="card-w">{p.weight}</div>
        <div className="card-f">
          <Price p={p} />
          <AddControl p={p} imgRef={imgRef} />
        </div>
      </div>
    </motion.article>
  );
}

/** Быстрый просмотр: фото «вырастает» из карточки в окно */
export function QuickView({ p, onClose }: { p: Product | null; onClose: () => void }) {
  const imgRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!p) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    const unlock = lockScroll();
    return () => { document.removeEventListener('keydown', k); unlock(); };
  }, [p, onClose]);

  return createPortal(
    <AnimatePresence>
      {p && (
        <motion.div className="qv" key="qv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="qv-bg" onClick={onClose} />
          <motion.div className="qv-card" role="dialog" aria-modal aria-label={p.name}
            initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <motion.div ref={imgRef} className="qv-img" layoutId={`qv-${p.id}`} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
              {p.img ? (
                <ZoomLens src={p.img} alt={p.name}>
                  <Img src={p.img} alt={p.name} eager />
                </ZoomLens>
              ) : <Img src={null} alt={p.name} />}
              <Badges p={p} />
            </motion.div>
            <motion.div className="qv-b" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.15 } }} exit={{ opacity: 0 }}>
              <div className="kicker">{CAT[p.cat].title}</div>
              <h3>{p.name}</h3>
              <div className="qv-meta"><span>{p.weight}</span><Price p={p} /></div>
              <p>{CAT[p.cat].about}</p>
              {p.img && <p className="hint-lens"><IZoom /> Наведите курсор на фото — появится лупа</p>}
              <AddControl p={p} imgRef={imgRef} big />
              <Link className="more-link" to={`/product/${p.slug}`} onClick={onClose}>Подробнее о блюде <IArrow /></Link>
            </motion.div>
            <button className="qv-x" onClick={onClose} aria-label="Закрыть"><IClose /></button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
