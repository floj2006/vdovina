import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Page } from '../components/Layout';
import { useSeo } from '../lib/useSeo';

export default function NotFound() {
  useSeo('Страница не найдена');
  return (
    <Page className="nf-page">
      <section className="nf wrap">
        <motion.div className="nf-plate" initial={{ rotate: -40, scale: 0.6, opacity: 0 }} animate={{ rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 120, damping: 12 }}>
          <span>4</span><i className="mono">ОВ</i><span>4</span>
        </motion.div>
        <h1>Эта тарелка пуста</h1>
        <p>Такой страницы нет — возможно, блюдо убрали из меню или ссылка устарела.</p>
        <div className="row center">
          <Link to="/menu" className="btn btn-primary">Открыть меню</Link>
          <Link to="/" className="btn btn-ghost">На главную</Link>
        </div>
      </section>
    </Page>
  );
}
