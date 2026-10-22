import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Faq } from '../components/Faq';
import { IArrow, IChat, IHome, IList } from '../components/Icons';
import { Page } from '../components/Layout';
import { Platter } from '../components/Platter';
import { ProductCard, QuickView } from '../components/ProductCard';
import { Counter, Img, Reveal, SectionHead, SplitTitle } from '../components/ui';
import { Unbox } from '../components/Unbox';
import { BESTSELLERS, BOXES, CATEGORIES, PRICE_MIN, PRODUCTS, find, imgUrl, shortName, type Product } from '../data/menu';
import { FAQ, PLANS, SITE, USP } from '../data/site';
import { rub } from '../lib/format';
import { useSeo } from '../lib/useSeo';
import { useCart } from '../store/cart';

const PLATES = [
  { img: imgUrl('019bd26315b27229b00b15419fcc468f'), alt: 'Бокс «Под винишко»', cls: 'p1', depth: 18 },
  { img: imgUrl('019bd658fda170169e01c661ff31883c'), alt: 'Трайфлы', cls: 'p2', depth: 34 },
  { img: imgUrl('019bd2799a307828874fac3bc776831d'), alt: 'Канапе с картофелем беби', cls: 'p3', depth: 26 },
  { img: imgUrl('019bd27b36d277bf9a958d0bebd4266a'), alt: 'Брускетта с креветками', cls: 'p4', depth: 44 },
];

function Plate({ pl, mx, my, i, scroll }: { pl: typeof PLATES[number]; mx: MotionValue<number>; my: MotionValue<number>; i: number; scroll: MotionValue<number> }) {
  const x = useTransform(mx, (v) => v * pl.depth);
  const yMouse = useTransform(my, (v) => v * pl.depth);
  const yScroll = useTransform(scroll, [0, 1], [0, -pl.depth * 6]);
  const y = useTransform(() => yMouse.get() + yScroll.get());
  return (
    <motion.div className={`plate ${pl.cls}`} style={{ x, y }}
      initial={{ scale: 0.4, opacity: 0, rotate: -20 }} animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.35 + i * 0.12 }}>
      <div className="float" style={{ animationDelay: `${-i * 1.5}s` }}><Img src={pl.img} alt={pl.alt} eager /></div>
    </motion.div>
  );
}

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const mx = useSpring(useMotionValue(0), { stiffness: 60, damping: 16 });
  const my = useSpring(useMotionValue(0), { stiffness: 60, damping: 16 });
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const lift = useTransform(scrollYProgress, [0, 1], [0, 120]);

  const move = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    mx.set(e.clientX / innerWidth - 0.5);
    my.set(e.clientY / innerHeight - 0.5);
  };

  return (
    <section className="hero" ref={ref} onPointerMove={move}>
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      <div className="wrap">
        <motion.div style={{ opacity: fade, y: lift }}>
          <motion.div className="eyebrow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <b>Новинка</b> <Link to={`/product/${find('boxes', 'Настроение').slug}`}>Бокс «Настроение» — уже в меню</Link>
          </motion.div>
          <SplitTitle as="h1" text="Фуршет, от которого гости" em="не отходят" delay={0.2} />
          <motion.p className="lead" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.7 }}>
            Авторские закуски, салаты, горячее и десерты на вынос. Соберите заказ за 2 минуты — я приготовлю и красиво оформлю к вашему празднику.
          </motion.p>
          <motion.div className="hero-cta" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85, duration: 0.7 }}>
            <Link to="/constructor" className="btn btn-primary shine">Собрать фуршет на моих гостей <IArrow /></Link>
            <Link to="/menu" className="btn btn-ghost">Смотреть меню</Link>
          </motion.div>
          <motion.div className="trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <div><b><Counter value={PRODUCTS.length} /></b><span>блюд в меню</span></div>
            <div><b>от {PRICE_MIN} ₽</b><span>за закуску</span></div>
            <div><b>{BOXES.length} боксов</b><span>готовых наборов</span></div>
          </motion.div>
        </motion.div>

        <div className="stage" aria-hidden>
          {PLATES.map((pl, i) => <Plate key={pl.cls} pl={pl} mx={mx} my={my} i={i} scroll={scrollYProgress} />)}
          <motion.div className="badge-rot" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1, type: 'spring' }}>
            <svg viewBox="0 0 120 120"><defs><path id="cp" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" /></defs>
              <text fontFamily="Manrope" fontSize="10.5" fontWeight="800" letterSpacing="3.2" fill="#3A2219"><textPath href="#cp">ГОТОВЛЮ С ЛЮБОВЬЮ · ДОМАШНЕЕ · </textPath></text></svg>
            <div className="c">ОВ</div>
          </motion.div>
          <motion.div className="tag t1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}><b>49</b>закусок в одном боксе</motion.div>
          <motion.div className="tag t2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.35 }}><b>★</b>Бенто-торты и трайфлы</motion.div>
        </div>
      </div>
      <div className="scroll-hint" aria-hidden />
    </section>
  );
}

function Marquee() {
  const words = ['Канапе', 'Брускетты', 'Тарталетки', 'Блинные закуски', 'Боксы', 'Бенто-торты', 'Трайфлы', 'Рулеты', 'Пироги', 'Горячее', 'Детское меню'];
  const row = [...words, ...words];
  return (
    <div className="mq-wrap" aria-hidden>
      <div className="marquee"><div className="track">{row.map((w, i) => <span key={i}>{w}<i>✦</i></span>)}</div></div>
    </div>
  );
}

function BoxShowcase() {
  const box = BOXES[0];
  const { add } = useCart();
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  return (
    <section className="sec showcase">
      <div className="wrap sc-grid">
        <div ref={ref}>
          <Unbox big img={box.img} name={box.name} open={open} onToggle={setOpen} />
        </div>
        <div className="sc-text">
          <Reveal><div className="kicker">Посмотрите, что внутри</div></Reveal>
          <SplitTitle text="Откройте бокс" em="прямо сейчас" />
          <Reveal delay={0.1}>
            <p>Нажмите на коробку — она откроется так же, как у ваших гостей. Бокс «Под винишко» — 49 закусок, разложенных так, что их не нужно перекладывать: открыли, поставили на стол, и праздник начался.</p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="sc-price"><b>{rub(box.price)}</b><span>{box.weight}</span></div>
            <div className="row">
              <button className="btn btn-primary" onClick={() => (open ? add(box.id, 1, ref.current) : setOpen(true))}>
                {open ? 'Положить в заказ' : 'Открыть коробку'}
              </button>
              <Link to="/boxes" className="btn btn-ghost">Все {BOXES.length} боксов <IArrow /></Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CategoryTiles() {
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHead kicker="Меню" title="Соберите стол" em="по своему вкусу" text="12 разделов — от канапе на один укус до бенто-тортов. Выберите, с чего начать." />
        <div className="tiles">
          {CATEGORIES.map((c, i) => {
            const cover = c.items.find((p) => p.img)?.img ?? null;
            return (
              <Reveal key={c.key} delay={(i % 4) * 0.06} className={`tile ${i === 0 ? 'big' : i === 11 ? 'wide' : ''}`}>
                <Link to={`/menu/${c.slug}`}>
                  <Img src={cover} alt={c.title} />
                  <div className="tile-b">
                    <b>{c.title}</b>
                    <small>{c.items.length} поз. · {c.desc}</small>
                  </div>
                  <span className="tile-go"><IArrow /></span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Bestsellers() {
  const [qv, setQv] = useState<Product | null>(null);
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHead kicker="Хиты" title="Что заказывают" em="чаще всего" text="Нажмите на фото, чтобы рассмотреть блюдо поближе — с лупой." />
        <div className="grid">
          {BESTSELLERS.map((p, i) => <ProductCard key={p.id} p={p} i={i} onQuick={setQv} />)}
        </div>
        <div className="center-row"><Link to="/menu" className="btn btn-ghost">Всё меню — {PRODUCTS.length} блюд <IArrow /></Link></div>
      </div>
      <QuickView p={qv} onClose={() => setQv(null)} />
    </section>
  );
}

/** Демонстрация конструктора: поднос сам заполняется закусками */
function ConstructorTeaser() {
  const picks = PLANS.rich.picks;
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVis(e.isIntersecting), { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!vis) return;
    const t = setInterval(() => setN((v) => (v >= picks.length + 3 ? 0 : v + 1)), 700);
    return () => clearInterval(t);
  }, [vis, picks.length]);
  const lines = picks.slice(0, Math.min(n, picks.length)).map((p, i) => ({ p, q: 10 + ((i * 7) % 12) }));
  const total = lines.reduce((s, l) => s + l.p.price * l.q, 0);
  return (
    <section className="sec ct">
      <div className="wrap ct-grid" ref={ref}>
        <div>
          <Reveal><div className="kicker">Конструктор фуршета</div></Reveal>
          <SplitTitle text="Смотрите, как собирается" em="ваш стол" />
          <Reveal delay={0.1}>
            <p>Укажите число гостей и формат — закуски сами разложатся на подносе. Видно всё: что, сколько штук и во сколько обойдётся. Любую позицию можно добавить или убрать.</p>
            <ul className="ticks">
              <li>Расчёт по количеству гостей</li>
              <li>Живой поднос: видно каждую закуску</li>
              <li>Один клик — и весь набор в заказе</li>
            </ul>
            <Link to="/constructor" className="btn btn-primary shine">Открыть конструктор <IArrow /></Link>
          </Reveal>
        </div>
        <Reveal delay={0.1}>
          <Platter lines={lines} caption={lines.length ? `${lines.reduce((a, l) => a + l.q, 0)} закусок · ${rub(total)}` : 'Собираем стол…'} />
        </Reveal>
      </div>
    </section>
  );
}

function Steps() {
  const s = [
    { ic: <IList />, t: 'Выберите блюда', d: 'Соберите заказ из меню, возьмите готовый бокс или посчитайте фуршет в конструкторе.' },
    { ic: <IChat />, t: 'Отправьте заказ', d: 'Список уйдёт мне в WhatsApp или ВКонтакте готовым сообщением. Я отвечу и подтвержу время.' },
    { ic: <IHome />, t: 'Заберите и удивляйте', d: 'Заказ будет готов к согласованному времени — свежий, красиво оформленный и готовый к подаче.' },
  ];
  return (
    <section className="sec">
      <div className="wrap">
        <SectionHead kicker="Как заказать" title="Три шага" em="до вкусного стола" />
        <div className="steps">
          {s.map((x, i) => (
            <Reveal key={x.t} delay={i * 0.12} className="st">
              <span className="num">0{i + 1}</span>
              <div className="ic">{x.ic}</div>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Why() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  const p = find('boxes', 'Гости на пороге');
  return (
    <section className="sec">
      <div className="wrap why">
        <Reveal className="why-img">
          <div ref={ref} className="why-in">
            <motion.div className="why-par" style={{ y }}><Img src={p.img} alt={shortName(p.name)} /></motion.div>
          </div>
          <div className="stamp"><span className="mono">ОВ</span><div><b>{SITE.name}</b><small>готовлю сама — от канапе до бенто-тортов</small></div></div>
        </Reveal>
        <div>
          <Reveal><div className="kicker">Почему заказывают у меня</div></Reveal>
          <SplitTitle text="Домашний вкус," em="ресторанная подача" />
          <div className="usp">
            {USP.map((u, i) => (
              <Reveal key={u.t} delay={0.08 * i}><i>0{i + 1}</i><span><b>{u.t}</b><p>{u.d}</p></span></Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="sec">
      <div className="wrap">
        <Reveal className="final">
          <div>
            <h2>Праздник уже скоро? <em>Давайте накроем стол</em></h2>
            <p>Позвоните или напишите — помогу подобрать меню под количество гостей и бюджет.</p>
            <div className="row">
              <a className="btn btn-light" href={SITE.phoneHref}>Позвонить</a>
              <a className="btn btn-ghost light" href={`${SITE.wa}?text=${encodeURIComponent('Здравствуйте, Оксана! Хочу заказать фуршет')}`} target="_blank" rel="noopener">Написать в WhatsApp</a>
            </div>
          </div>
          <div className="final-c">
            <span><small>Приём заказов</small><b>{SITE.hours}</b></span>
            <span><small>Самовывоз</small><b>{SITE.address}</b></span>
            <span><small>Телефон</small><b><a href={SITE.phoneHref}>{SITE.phone}</a></b></span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export default function Home() {
  useSeo('', 'Авторские фуршетные закуски, боксы, горячее и десерты на вынос от Оксаны Вдовиной. Конструктор фуршета на ваших гостей.');
  return (
    <Page className="home">
      <Hero />
      <Marquee />
      <BoxShowcase />
      <CategoryTiles />
      <Bestsellers />
      <ConstructorTeaser />
      <Steps />
      <Why />
      <section className="sec">
        <div className="wrap">
          <SectionHead center kicker="Вопросы" title="Частые" em="вопросы" />
          <Faq items={FAQ.slice(0, 4)} />
          <div className="center-row"><Link to="/delivery" className="btn btn-ghost">Все вопросы и условия <IArrow /></Link></div>
        </div>
      </section>
      <FinalCta />
    </Page>
  );
}
