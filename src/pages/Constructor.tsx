import { AnimatePresence, LayoutGroup, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IArrow, ICheck, IPlus, IUsers } from '../components/Icons';
import { Page } from '../components/Layout';
import { Platter } from '../components/Platter';
import { Counter, Img, Reveal, SplitTitle, Stepper } from '../components/ui';
import { CATEGORIES, shortName, type Product } from '../data/menu';
import { DESSERT, PLANS, type PlanKey } from '../data/site';
import { guestsWord, piecesWord, rub } from '../lib/format';
import { useSeo } from '../lib/useSeo';
import { useCart } from '../store/cart';

const FINGER = CATEGORIES.filter((c) => c.finger).flatMap((c) => c.items.filter((p) => p.weight === '1 шт'));

/** Раскладываем «штук на гостя» по выбранным закускам: поровну, остаток — первым */
function plan(picks: Product[], guests: number, per: number) {
  const total = guests * per;
  const base = Math.floor(total / picks.length);
  let rest = total - base * picks.length;
  const out: Record<string, number> = {};
  for (const p of picks) {
    const extra = rest > 0 ? 1 : 0;
    rest -= extra;
    out[p.id] = Math.max(1, base + extra);
  }
  return out;
}

export default function Constructor() {
  useSeo('Конструктор фуршета', 'Посчитайте фуршет на ваших гостей: закуски сами разложатся на подносе, видно количество и стоимость.');
  const { merge } = useCart();
  const nav = useNavigate();
  const [guests, setGuests] = useState(10);
  const [fmt, setFmt] = useState<PlanKey>('buffet');
  const [dessert, setDessert] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>(() => plan(PLANS.buffet.picks, 10, PLANS.buffet.per));
  const [palette, setPalette] = useState(false);
  const [done, setDone] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);

  // Пересчёт при смене гостей/формата
  useEffect(() => { setQty(plan(PLANS[fmt].picks, guests, PLANS[fmt].per)); }, [guests, fmt]);

  const lines = useMemo(() => {
    const l = Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ p: FINGER.find((x) => x.id === id)!, q })).filter((x) => x.p);
    if (dessert) l.push({ p: DESSERT, q: Math.max(1, Math.ceil(guests / 2)) });
    return l;
  }, [qty, dessert, guests]);

  const pieces = lines.filter((l) => l.p.id !== DESSERT.id).reduce((a, l) => a + l.q, 0);
  const total = lines.reduce((a, l) => a + l.p.price * l.q, 0);
  const perGuest = Math.round(total / guests);

  const setQ = (id: string, q: number) => setQty((s) => {
    const n = { ...s };
    if (q <= 0) delete n[id]; else n[id] = q;
    return n;
  });

  const toCart = () => {
    merge(Object.fromEntries(lines.map((l) => [l.p.id, l.q])), boardRef.current);
    setDone(true);
  };

  return (
    <Page className="ctor-page">
      <section className="page-hero small">
        <div className="wrap">
          <nav className="crumbs"><Link to="/">Главная</Link><span>/</span><b>Конструктор фуршета</b></nav>
          <SplitTitle as="h1" text="Соберите фуршет" em="на своих гостей" />
          <Reveal delay={0.2}><p className="lead">Три настройки — и стол готов. Меняйте количество, добавляйте закуски из меню: поднос справа обновляется вживую.</p></Reveal>
        </div>
      </section>

      <section className="sec tight">
        <div className="wrap ctor">
          <div className="ctor-l">
            <div className="ctor-step">
              <div className="cs-h"><i>1</i><b>Сколько гостей?</b></div>
              <div className="guests">
                <input type="range" min={4} max={60} value={guests} onChange={(e) => setGuests(+e.target.value)} aria-label="Количество гостей" />
                <div className="g-val"><IUsers /><b><Counter value={guests} /></b> {guestsWord(guests)}</div>
              </div>
            </div>

            <div className="ctor-step">
              <div className="cs-h"><i>2</i><b>Какой формат?</b></div>
              <LayoutGroup id="fmt">
                <div className="fmts" role="radiogroup">
                  {(Object.keys(PLANS) as PlanKey[]).map((k) => (
                    <button key={k} role="radio" aria-checked={fmt === k} className={fmt === k ? 'on' : ''} onClick={() => setFmt(k)}>
                      {fmt === k && <motion.span className="fmt-bg" layoutId="fmt-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                      <b>{PLANS[k].label}</b>
                      <small>{PLANS[k].per} шт на гостя</small>
                      <em>{PLANS[k].hint}</em>
                    </button>
                  ))}
                </div>
              </LayoutGroup>
              <label className="check">
                <input type="checkbox" checked={dessert} onChange={(e) => setDessert(e.target.checked)} />
                <span className="box">{dessert && <ICheck />}</span>
                Добавить десерт — {shortName(DESSERT.name).toLowerCase()} ({rub(DESSERT.price)} за шт, 1 на двоих)
              </label>
            </div>

            <div className="ctor-step">
              <div className="cs-h"><i>3</i><b>Состав стола</b><button className="link" onClick={() => setPalette((v) => !v)}><IPlus /> {palette ? 'Скрыть меню' : 'Добавить закуску'}</button></div>
              <AnimatePresence initial={false}>
                {palette && (
                  <motion.div className="palette" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="pal-in">
                      {FINGER.filter((p) => !qty[p.id]).map((p) => (
                        <motion.button key={p.id} layout className="pal" onClick={() => setQ(p.id, guests)} title={p.name}>
                          <Img src={p.img} alt={p.name} />
                          <span>{shortName(p.name)}</span>
                          <small>{rub(p.price)}</small>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.ul className="ctor-list" layout>
                <AnimatePresence initial={false}>
                  {lines.map(({ p, q }) => {
                    const isD = p.id === DESSERT.id;
                    return (
                      <motion.li key={p.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}>
                        <Img src={p.img} alt={p.name} className="th" />
                        <div className="ci"><b>{shortName(p.name)}</b><small>{rub(p.price)} × {q} = {rub(p.price * q)}</small></div>
                        {isD ? <span className="tag-d">десерт</span> : <Stepper small value={q} onChange={(v) => setQ(p.id, v)} />}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </motion.ul>
            </div>
          </div>

          <div className="ctor-r">
            <div className="ctor-sticky" ref={boardRef}>
              <Platter lines={lines} caption={`Ваш стол на ${guests} ${guestsWord(guests)}`} />
              <div className="ctor-sum">
                <div><small>Закусок</small><b><Counter value={pieces} /></b><span>{piecesWord(pieces)}</span></div>
                <div><small>На гостя</small><b><Counter value={perGuest} format={rub} /></b></div>
                <div className="big"><small>Итого</small><b><Counter value={total} format={rub} /></b></div>
              </div>
              <AnimatePresence mode="wait">
                {done ? (
                  <motion.div key="done" className="ctor-done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <span><ICheck /> Набор в заказе</span>
                    <button className="btn btn-primary" onClick={() => nav('/cart')}>Оформить заказ <IArrow /></button>
                    <button className="link" onClick={() => setDone(false)}>Собрать ещё</button>
                  </motion.div>
                ) : (
                  <motion.button key="add" className="btn btn-primary shine wide" onClick={toCart} disabled={!lines.length} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    Положить весь стол в заказ <IArrow />
                  </motion.button>
                )}
              </AnimatePresence>
              <p className="fine">Расчёт ориентировочный: перед приготовлением подтвержу состав и сумму.</p>
            </div>
          </div>
        </div>
      </section>
    </Page>
  );
}
