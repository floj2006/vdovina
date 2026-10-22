import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { IArrow, IClose, ISearch } from '../components/Icons';
import { Page } from '../components/Layout';
import { ProductCard, QuickView } from '../components/ProductCard';
import { SplitTitle } from '../components/ui';
import { CATEGORIES, HITS, PRODUCTS, catBySlug, type Product } from '../data/menu';
import { plural } from '../lib/format';
import { useSeo } from '../lib/useSeo';
import NotFound from './NotFound';

type Sort = 'pop' | 'cheap' | 'exp';
const SORTS: { k: Sort; l: string }[] = [
  { k: 'pop', l: 'Популярные' },
  { k: 'cheap', l: 'Дешевле' },
  { k: 'exp', l: 'Дороже' },
];

export default function Menu() {
  const { cat: slug } = useParams();
  const cat = catBySlug(slug);
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const [sort, setSort] = useState<Sort>('pop');
  const [qv, setQv] = useState<Product | null>(null);

  useSeo(cat ? cat.title : 'Меню', cat ? `${cat.title}: ${cat.desc}. Заказ на вынос у Оксаны Вдовиной.` : 'Полное меню: закуски, салаты, горячее, пироги, десерты и боксы.');

  const list = useMemo(() => {
    let l = cat ? cat.items : PRODUCTS;
    const s = q.trim().toLowerCase();
    if (s) l = PRODUCTS.filter((p) => p.name.toLowerCase().includes(s));
    const arr = [...l];
    if (sort === 'cheap') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'exp') arr.sort((a, b) => b.price - a.price);
    else arr.sort((a, b) => Number(HITS.has(b.id)) - Number(HITS.has(a.id)));
    return arr;
  }, [cat, q, sort]);

  if (slug && !cat) return <NotFound />;

  const setQ = (v: string) => setSp(v ? { q: v } : {}, { replace: true });
  const title = q ? `Поиск: «${q}»` : cat ? cat.title : 'Всё меню';

  return (
    <Page className="menu-page">
      <section className="page-hero small">
        <div className="wrap">
          <nav className="crumbs"><Link to="/">Главная</Link><span>/</span>{cat ? <><Link to="/menu">Меню</Link><span>/</span><b>{cat.title}</b></> : <b>Меню</b>}</nav>
          <SplitTitle as="h1" text={cat ? cat.title : 'Меню'} em={cat ? undefined : 'на любой праздник'} />
          <motion.p key={cat?.key ?? 'all'} className="lead" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {cat ? cat.about : `${PRODUCTS.length} блюд в ${CATEGORIES.length} разделах. Нажмите на фото, чтобы рассмотреть блюдо, — или добавьте сразу в заказ.`}
          </motion.p>
        </div>
      </section>

      <div className="filters">
        <div className="wrap">
          <LayoutGroup id="chips">
            <div className="chips" role="tablist">
              {[{ slug: '', title: 'Все' }, ...CATEGORIES].map((c) => {
                const on = !q && (c.slug ? cat?.slug === c.slug : !cat);
                return (
                  <button key={c.slug || 'all'} role="tab" aria-selected={on} className={`chip ${on ? 'on' : ''}`}
                    onClick={() => { setQ(''); nav(c.slug ? `/menu/${c.slug}` : '/menu'); }}>
                    {on && <motion.span className="chip-bg" layoutId="chip-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                    <span>{c.title}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          <div className="tools">
            <label className="search">
              <ISearch />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти блюдо: креветки, сыр, торт…" aria-label="Поиск по меню" />
              {q && <button onClick={() => setQ('')} aria-label="Очистить поиск"><IClose /></button>}
            </label>
            <div className="sort" role="radiogroup" aria-label="Сортировка">
              {SORTS.map((s) => (
                <button key={s.k} role="radio" aria-checked={sort === s.k} className={sort === s.k ? 'on' : ''} onClick={() => setSort(s.k)}>{s.l}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="sec tight">
        <div className="wrap">
          <div className="list-head">
            <h2>{title}</h2>
            <span>{list.length} {plural(list.length, ['позиция', 'позиции', 'позиций'])}</span>
          </div>
          <motion.div className="grid" layout>
            <AnimatePresence>
              {list.map((p, i) => <ProductCard key={p.id} p={p} i={i} onQuick={setQv} />)}
            </AnimatePresence>
          </motion.div>
          {!list.length && (
            <div className="nothing">
              <p>Ничего не нашлось. Попробуйте другое слово или позвоните — возможно, приготовлю под заказ.</p>
              <button className="btn btn-ghost" onClick={() => setQ('')}>Сбросить поиск</button>
            </div>
          )}
          {cat && (
            <div className="cat-serve">
              <b>Как подавать</b>
              <p>{cat.serve}</p>
            </div>
          )}
          {cat?.finger && (
            <Link to="/constructor" className="cta-strip">
              <span><b>Не знаете, сколько брать?</b> Конструктор посчитает закуски на ваших гостей</span>
              <IArrow />
            </Link>
          )}
        </div>
      </section>
      <QuickView p={qv} onClose={() => setQv(null)} />
    </Page>
  );
}
