import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { IClock, IPhone, IPin, IVk, IWa } from '../components/Icons';
import { Page } from '../components/Layout';
import { Reveal, SplitTitle } from '../components/ui';
import { SITE } from '../data/site';
import { useSeo } from '../lib/useSeo';

export default function Contacts() {
  useSeo('Контакты', `Телефон ${SITE.phone}, WhatsApp, ВКонтакте. Самовывоз: ${SITE.address}.`);
  const items = [
    { ic: <IPhone />, t: 'Телефон', v: SITE.phone, href: SITE.phoneHref },
    { ic: <IWa />, t: 'WhatsApp', v: 'Написать в WhatsApp', href: SITE.wa },
    { ic: <IVk />, t: 'ВКонтакте', v: 'Страница ВКонтакте', href: SITE.vk },
    { ic: <IPin />, t: 'Самовывоз', v: SITE.address },
    { ic: <IClock />, t: 'Приём заказов', v: SITE.hours },
  ];
  return (
    <Page className="contacts-page">
      <section className="page-hero small">
        <div className="wrap">
          <nav className="crumbs"><Link to="/">Главная</Link><span>/</span><b>Контакты</b></nav>
          <SplitTitle as="h1" text="Давайте" em="обсудим ваш праздник" />
          <Reveal delay={0.2}><p className="lead">Звоните или пишите — помогу подобрать меню под количество гостей, повод и бюджет.</p></Reveal>
        </div>
      </section>
      <section className="sec tight">
        <div className="wrap contacts">
          <div className="c-list">
            {items.map((c, i) => {
              const inner = <><span className="ic">{c.ic}</span><span><small>{c.t}</small><b>{c.v}</b></span></>;
              return (
                <motion.div key={c.t} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}>
                  {c.href
                    ? <a className="c-item" href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener">{inner}</a>
                    : <div className="c-item">{inner}</div>}
                </motion.div>
              );
            })}
          </div>
          <Reveal className="c-card" delay={0.15}>
            <span className="mono big">ОВ</span>
            <h2>Хотите заказать прямо сейчас?</h2>
            <p>Соберите заказ на сайте — готовое сообщение со списком блюд отправится мне в один клик.</p>
            <div className="row">
              <Link to="/menu" className="btn btn-light">Открыть меню</Link>
              <Link to="/constructor" className="btn btn-ghost light">Конструктор фуршета</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </Page>
  );
}
