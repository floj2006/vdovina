import { AnimatePresence, motion } from 'framer-motion';
import type { Product } from '../data/menu';
import { shortName } from '../data/menu';

const GOLDEN = 2.39996;

/** Расстановка по «подсолнуху» — равномерно заполняет круг */
const spot = (i: number, n: number, R: number) => {
  if (n === 1) return { x: 50, y: 50 };
  const r = R * Math.sqrt((i + 0.6) / n);
  const a = i * GOLDEN - Math.PI / 2;
  return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) };
};

/**
 * Позиция и размер в процентах анимируются напрямую, а не через layout:
 * layout-анимация масштабирует блок трансформом, и фото внутри сплющиваются и мигают,
 * когда при каждом новом блюде перестраивается вся раскладка.
 */
const place = (s: { x: number; y: number }, size: number) => ({
  left: `${s.x}%`, top: `${s.y}%`, width: `${size}%`, marginLeft: `${-size / 2}%`, marginTop: `${-size / 2}%`,
});
const glide = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };
const MOVE = { left: glide, top: glide, width: glide, marginLeft: glide, marginTop: glide };

/**
 * «Ваш стол»: живая доска-поднос. Каждый вид закуски — горка из фото,
 * чем больше штук, тем выше горка; бейдж показывает количество.
 */
export function Platter({ lines, caption, compact }: { lines: { p: Product; q: number }[]; caption?: string; compact?: boolean }) {
  const n = lines.length;
  const size = n <= 1 ? 34 : n <= 4 ? 27 : n <= 8 ? 22 : n <= 14 ? 18 : 14;
  const R = 50 - size / 2 - 7;
  return (
    <div className={`platter ${compact ? 'compact' : ''}`}>
      <div className="board" aria-label={caption ?? 'Ваш стол'}>
        <div className="grain" />
        <AnimatePresence>
          {n === 0 && (
            <motion.div className="empty" key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <span>Добавляйте блюда —<br />они появятся на подносе</span>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {lines.map(({ p, q }, i) => {
            const box = place(spot(i, n, R), size);
            const stack = Math.min(4, Math.max(1, Math.ceil(Math.log2(q + 1))));
            return (
              <motion.div key={p.id} className="pile"
                initial={{ scale: 0, opacity: 0, y: -60, ...box }} animate={{ scale: 1, opacity: 1, y: 0, ...box }}
                exit={{ scale: 0, opacity: 0, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', stiffness: 320, damping: 20, mass: 0.8, ...MOVE }}
                title={`${shortName(p.name)} — ${q} шт`}>
                {[...Array(stack)].map((_, k) => (
                  <motion.span key={k} className="pc" initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18, delay: k * 0.05 }}
                    style={{ backgroundImage: p.img ? `url(${p.img})` : undefined, left: `${(k % 2 ? 1 : -1) * k * 7}%`, top: `${-k * 9}%`, zIndex: k }} />
                ))}
                <motion.b key={q} className="qty" initial={{ scale: 1.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
                  {q}
                </motion.b>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      {caption && <div className="platter-cap">{caption}</div>}
    </div>
  );
}

/**
 * Тарелка порции: показывает буквально, сколько штук окажется на столе.
 */
export function PortionPlate({ img, count, name }: { img: string | null; count: number; name: string }) {
  const shown = Math.min(count, 48);
  const size = shown <= 4 ? 30 : shown <= 10 ? 22 : shown <= 20 ? 16 : shown <= 32 ? 13 : 11;
  const R = 50 - size / 2 - 6;
  return (
    <div className="portion">
      <div className="plate-ui" aria-label={`${count} шт — ${name}`}>
        <AnimatePresence initial={false}>
          {[...Array(shown)].map((_, i) => {
            const box = place(spot(i, shown, R), size);
            return (
              <motion.span key={i} className="pc" style={{ backgroundImage: img ? `url(${img})` : undefined }}
                initial={{ scale: 0, opacity: 0, ...box }} animate={{ scale: 1, opacity: 1, ...box }} exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 360, damping: 22, delay: Math.min(i, 20) * 0.012, ...MOVE }} />
            );
          })}
        </AnimatePresence>
        {count > shown && <span className="more">+{count - shown}</span>}
      </div>
    </div>
  );
}
