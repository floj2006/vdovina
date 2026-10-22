import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { IPlus } from './Icons';

export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="faq">
      {items.map((it, i) => {
        const on = open === i;
        return (
          <div key={it.q} className={`qa ${on ? 'on' : ''}`}>
            <button type="button" aria-expanded={on} onClick={() => setOpen(on ? null : i)}>
              <span>{it.q}</span>
              <motion.i animate={{ rotate: on ? 45 : 0 }}><IPlus /></motion.i>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div className="ans" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
                  <p>{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
