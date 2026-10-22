import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, onConsentOpen, setConsent, type Consent } from '../lib/analytics';

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!getConsent()) setOpen(true);
    return onConsentOpen(() => setOpen(true));
  }, []);

  const choose = (v: Consent) => { setConsent(v); setOpen(false); };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="cookie" role="region" aria-live="polite" aria-label="Использование cookie"
          initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 0.8 } }} exit={{ y: 40, opacity: 0 }}>
          <p>
            Сайт хранит корзину в браузере. С вашего разрешения подключу Яндекс Метрику — она помогает понять, что удобно, а что нет.{' '}
            <Link to="/privacy">Подробнее</Link>
          </p>
          <div className="row">
            <button className="btn btn-ghost" onClick={() => choose('necessary')}>Только необходимые</button>
            <button className="btn btn-primary" onClick={() => choose('all')}>Разрешить</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
