import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { IArrow } from '../components/Icons';
import { Page } from '../components/Layout';
import { Img, Reveal, SplitTitle } from '../components/ui';
import { CATEGORIES, COVER, PRODUCTS, find } from '../data/menu';
import { USP } from '../data/site';
import { useSeo } from '../lib/useSeo';
import { FinalCta } from './Home';

const STRIP = [
  find('blin', 'Красный бархат'), find('kanape', 'Картофель беби'), find('dess', 'Трайфлы'),
  find('brus', 'креветками'), find('boxes', 'Под винишко'), find('zak', 'шашлычки'), find('tart', 'Жюльен'),
];

export default function About() {
  useSeo('О себе', 'Оксана Вдовина готовит фуршетные закуски, боксы и десерты на заказ — по-домашнему вкусно и красиво.');
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['4%', '-34%']);
  return (
    <Page className="about-page">
      <section className="page-hero">
        <div className="wrap about-hero">
          <div>
            <nav className="crumbs"><Link to="/">Главная</Link><span>/</span><b>О себе</b></nav>
            <SplitTitle as="h1" text="Готовлю так," em="как для своих" />
            <Reveal delay={0.2}>
              <p className="lead">Меня зовут Оксана Вдовина. Я готовлю фуршетные закуски, боксы, горячее и десерты на заказ — для дней рождения, корпоративов, девичников и просто тёплых вечеров с близкими.</p>
              <p>Каждый заказ я делаю под конкретный праздник: ничего не лежит на витрине и не ждёт покупателя. Поэтому закуски свежие, а подача — такая, что их сразу можно ставить на стол.</p>
            </Reveal>
          </div>
          <Reveal className="about-cover" delay={0.1}>
            <Img src={COVER} alt="Фуршетный стол от Оксаны Вдовиной" eager />
            <span className="mono">ОВ</span>
          </Reveal>
        </div>
      </section>

      <section className="sec nums-sec">
        <div className="wrap nums">
          {[
            [String(PRODUCTS.length), 'блюд в меню'],
            [String(CATEGORIES.length), 'разделов — от канапе до тортов'],
            ['1–2', 'дня — и заказ готов'],
            ['100%', 'ручная работа'],
          ].map(([n, t], i) => (
            <Reveal key={t} delay={i * 0.08}><b>{n}</b><span>{t}</span></Reveal>
          ))}
        </div>
      </section>

      <section className="strip-sec" ref={ref} aria-hidden>
        <motion.div className="strip" style={{ x }}>
          {STRIP.map((p) => <div key={p.id} className="strip-i"><Img src={p.img} alt="" /></div>)}
        </motion.div>
      </section>

      <section className="sec">
        <div className="wrap why-list">
          <div>
            <Reveal><div className="kicker">Мои принципы</div></Reveal>
            <SplitTitle text="Что для меня" em="важно" />
          </div>
          <div className="usp">
            {USP.map((u, i) => (
              <Reveal key={u.t} delay={0.08 * i}><i>0{i + 1}</i><span><b>{u.t}</b><p>{u.d}</p></span></Reveal>
            ))}
          </div>
        </div>
        <div className="center-row"><Link to="/menu" className="btn btn-primary">Посмотреть меню <IArrow /></Link></div>
      </section>
      <FinalCta />
    </Page>
  );
}
