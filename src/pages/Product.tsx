import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IArrow, IClock, ICube, IGift, IPin, IUsers, IZoom } from '../components/Icons';
import { Page } from '../components/Layout';
import { PortionPlate } from '../components/Platter';
import { Badges, Price, ProductCard } from '../components/ProductCard';
import { AddControl, Img, Reveal, Stepper } from '../components/ui';
import { Unbox } from '../components/Unbox';
import { Lightbox, Tilt, ZoomLens } from '../components/Viewer';
import { BY_SLUG, CAT, HITS, isPiece, shortName, type Product } from '../data/menu';
import { SITE } from '../data/site';
import { guestsWord, rub } from '../lib/format';
import { useSeo } from '../lib/useSeo';
import { useCart } from '../store/cart';
import NotFound from './NotFound';

type View = 'photo' | 'close' | 'unbox' | 'table';

/** Микроразметка schema.org: блюдо с ценой и хлебные крошки */
const productLd = (p: Product) => {
  const cat = CAT[p.cat];
  const abs = (path: string) => (SITE.url ? SITE.url + path : path);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: cat.about,
      category: cat.title,
      ...(p.img && { image: p.img }),
      offers: {
        '@type': 'Offer',
        price: p.price,
        priceCurrency: 'RUB',
        availability: 'https://schema.org/PreOrder',
        url: abs(`/product/${p.slug}`),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { name: 'Главная', path: '/' },
        { name: 'Меню', path: '/menu' },
        { name: cat.title, path: `/menu/${cat.slug}` },
        { name: shortName(p.name), path: `/product/${p.slug}` },
      ].map((x, i) => ({ '@type': 'ListItem', position: i + 1, name: x.name, item: abs(x.path) })),
    },
  ];
};

function JsonLd({ data }: { data: unknown }) {
  // «<» экранируется, чтобы название блюда не могло закрыть тег script
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** Ракурсы одного фото: целиком, крупный план, детали — плавный «наезд камеры» */
const SHOTS = [
  { k: 'full', l: 'Целиком', scale: 1, ox: 50, oy: 50 },
  { k: 'mid', l: 'Крупнее', scale: 1.6, ox: 50, oy: 45 },
  { k: 'det', l: 'Детали', scale: 2.3, ox: 35, oy: 60 },
];

function Gallery({ p }: { p: Product }) {
  const [shot, setShot] = useState(0);
  const [lb, setLb] = useState(false);
  const s = SHOTS[shot];
  if (!p.img) return <div className="pd-photo"><Img src={null} alt={p.name} /></div>;
  return (
    <>
      <Tilt max={5} className="pd-tilt">
        <div className="pd-photo">
          <ZoomLens src={p.img} alt={p.name} onOpen={() => setLb(true)} zoom={2.6}>
            <motion.div className="pd-cam" animate={{ scale: s.scale }} style={{ transformOrigin: `${s.ox}% ${s.oy}%` }}
              transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}>
              <Img src={p.img} alt={p.name} eager />
            </motion.div>
          </ZoomLens>
          <Badges p={p} />
          <button className="pd-full" onClick={() => setLb(true)}><IZoom /> На весь экран</button>
        </div>
      </Tilt>
      <div className="shots" role="tablist" aria-label="Ракурс">
        {SHOTS.map((x, i) => (
          <button key={x.k} role="tab" aria-selected={shot === i} className={shot === i ? 'on' : ''} onClick={() => setShot(i)}>
            <span className="sh-img"><img src={p.img!} alt="" style={{ transform: `scale(${x.scale})`, transformOrigin: `${x.ox}% ${x.oy}%` }} /></span>
            {x.l}
          </button>
        ))}
      </div>
      <Lightbox src={p.img} alt={p.name} open={lb} onClose={() => setLb(false)} />
    </>
  );
}

/** «Сколько это на столе»: тарелка с реальным числом штук под гостей */
function TableView({ p }: { p: Product }) {
  const { add } = useCart();
  const [guests, setGuests] = useState(10);
  const [per, setPer] = useState(1);
  const count = guests * per;
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div className="table-view">
      <div ref={ref}><PortionPlate img={p.img} count={count} name={p.name} /></div>
      <div className="tv-ctrl">
        <label>
          <span><IUsers /> Гостей: <b>{guests}</b></span>
          <input type="range" min={2} max={60} value={guests} onChange={(e) => setGuests(+e.target.value)} />
        </label>
        <div className="tv-per">
          <span>По штуке на гостя</span>
          <Stepper value={per} min={1} onChange={(v) => setPer(Math.min(6, v))} small />
        </div>
        <div className="tv-sum">
          <span>{count} шт × {rub(p.price)}</span>
          <b>{rub(count * p.price)}</b>
        </div>
        <button className="btn btn-primary" onClick={() => add(p.id, count, ref.current)}>Положить {count} шт в заказ</button>
      </div>
    </div>
  );
}

function Related({ p }: { p: Product }) {
  const list = useMemo(() => {
    const same = CAT[p.cat].items.filter((x) => x.id !== p.id);
    return [...same.filter((x) => HITS.has(x.id)), ...same.filter((x) => !HITS.has(x.id))].slice(0, 4);
  }, [p]);
  if (!list.length) return null;
  return (
    <section className="sec">
      <div className="wrap">
        <div className="list-head"><h2>С этим берут</h2><Link to={`/menu/${CAT[p.cat].slug}`} className="more-link">Весь раздел <IArrow /></Link></div>
        <div className="grid">{list.map((x, i) => <ProductCard key={x.id} p={x} i={i} />)}</div>
      </div>
    </section>
  );
}

export default function ProductPage() {
  const { slug } = useParams();
  const p = slug ? BY_SLUG[slug] : undefined;
  const isBox = p?.cat === 'boxes';
  const piece = p ? isPiece(p) : false;
  const [view, setView] = useState<View>(isBox ? 'unbox' : 'photo');
  const [open, setOpen] = useState(false);
  const addRef = useRef<HTMLDivElement>(null);
  useSeo(p ? shortName(p.name) : 'Блюдо не найдено', p ? `${p.name} — ${p.weight}, ${rub(p.price)}. ${CAT[p.cat].about}` : undefined);

  useEffect(() => { setView(isBox ? 'unbox' : 'photo'); setOpen(false); }, [slug, isBox]);

  if (!p) return <NotFound />;
  const cat = CAT[p.cat];
  const views: { k: View; l: string; ic: JSX.Element }[] = [
    ...(isBox ? [{ k: 'unbox' as View, l: 'Распаковка', ic: <IGift /> }] : []),
    { k: 'photo', l: 'Рассмотреть', ic: <IZoom /> },
    ...(piece ? [{ k: 'table' as View, l: 'На столе', ic: <IUsers /> }] : []),
  ];

  return (
    <Page className="product-page">
      <JsonLd data={productLd(p)} />
      <div className="wrap">
        <nav className="crumbs">
          <Link to="/">Главная</Link><span>/</span><Link to="/menu">Меню</Link><span>/</span>
          <Link to={`/menu/${cat.slug}`}>{cat.title}</Link><span>/</span><b>{shortName(p.name)}</b>
        </nav>
      </div>
      <section className="pd wrap">
        <div className="pd-media">
          {views.length > 1 && (
            <LayoutGroup id="views">
              <div className="views">
                {views.map((v) => (
                  <button key={v.k} className={view === v.k ? 'on' : ''} onClick={() => setView(v.k)}>
                    {view === v.k && <motion.span className="chip-bg" layoutId="view-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span>{v.ic}{v.l}</span>
                  </button>
                ))}
              </div>
            </LayoutGroup>
          )}
          <AnimatePresence mode="wait">
            <motion.div key={view} initial={{ opacity: 0, y: 16, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}>
              {view === 'photo' && <Gallery p={p} />}
              {view === 'unbox' && (
                <div className="pd-unbox">
                  <Unbox big img={p.img} name={p.name} open={open} onToggle={setOpen} />
                  <p className="hint-lens">{open ? 'Нажмите ещё раз — коробка закроется' : 'Нажмите на коробку, чтобы открыть'}</p>
                </div>
              )}
              {view === 'table' && <TableView p={p} />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="pd-info">
          <Reveal><div className="kicker">{cat.title}</div></Reveal>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.7 }}>{p.name}</motion.h1>
          <Reveal delay={0.1}>
            <div className="pd-meta">
              <Price p={p} />
              <span className="w">{p.weight}</span>
            </div>
            {p.from && <p className="note">Цена за минимальную порцию — точную сумму подтвержу при оформлении.</p>}
            <div className="pd-buy" ref={addRef}>
              <AddControl p={p} imgRef={addRef} big />
              {piece && <button className="btn btn-ghost sm" onClick={() => setView('table')}><IUsers /> Посчитать на гостей</button>}
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="pd-text">
              <h3>О блюде</h3>
              <p>{cat.about}</p>
              <h3>Как подавать</h3>
              <p>{cat.serve}</p>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <ul className="pd-facts">
              <li><IClock /><span><b>Заказ за 1–2 дня</b>готовлю под ваш праздник</span></li>
              <li><IPin /><span><b>Самовывоз</b>{SITE.address}</span></li>
              <li><ICube /><span><b>Готово к подаче</b>красиво оформлено, без перекладки</span></li>
            </ul>
          </Reveal>
          {piece && (
            <Reveal delay={0.25}>
              <p className="pd-tip">Совет: на фуршет берут 1–2 штуки каждой закуски на гостя. Для 10 {guestsWord(10)} — 10–20 шт.</p>
            </Reveal>
          )}
        </div>
      </section>
      <Related p={p} />
    </Page>
  );
}
