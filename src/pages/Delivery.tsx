import { Link } from 'react-router-dom';
import { Faq } from '../components/Faq';
import { ICard, IClock, IPin, ITruck } from '../components/Icons';
import { Page } from '../components/Layout';
import { Reveal, SectionHead, SplitTitle } from '../components/ui';
import { FAQ, SITE } from '../data/site';
import { useSeo } from '../lib/useSeo';
import { FinalCta } from './Home';

const CARDS = [
  { ic: <IPin />, t: 'Самовывоз', d: `Забрать заказ можно по адресу: ${SITE.address}. Время выдачи согласуем заранее.` },
  { ic: <ITruck />, t: 'Доставка', d: 'Доставка обсуждается индивидуально — укажите адрес при оформлении, и я расскажу об условиях.' },
  { ic: <IClock />, t: 'Сроки', d: `Заказ лучше оформить за 1–2 дня. Принимаю заказы: ${SITE.hours.toLowerCase()}.` },
  { ic: <ICard />, t: 'Оплата', d: 'Способ оплаты и предоплату обсуждаем после подтверждения заказа.' },
];

export default function Delivery() {
  useSeo('Доставка и оплата', 'Самовывоз, доставка, сроки и оплата заказов Оксаны Вдовиной. Ответы на частые вопросы.');
  return (
    <Page className="delivery-page">
      <section className="page-hero small">
        <div className="wrap">
          <nav className="crumbs"><Link to="/">Главная</Link><span>/</span><b>Доставка и оплата</b></nav>
          <SplitTitle as="h1" text="Получение" em="и оплата" />
          <Reveal delay={0.2}><p className="lead">Всё просто: вы оформляете заказ, я подтверждаю его и называю время, когда можно забрать.</p></Reveal>
        </div>
      </section>
      <section className="sec tight">
        <div className="wrap info-cards">
          {CARDS.map((c, i) => (
            <Reveal key={c.t} delay={i * 0.08} className="info-card">
              <div className="ic">{c.ic}</div>
              <h3>{c.t}</h3>
              <p>{c.d}</p>
            </Reveal>
          ))}
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <SectionHead center kicker="FAQ" title="Частые" em="вопросы" />
          <Faq items={FAQ} />
        </div>
      </section>
      <FinalCta />
    </Page>
  );
}
