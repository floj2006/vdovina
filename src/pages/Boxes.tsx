import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { IArrow } from '../components/Icons';
import { Page } from '../components/Layout';
import { Badges, Price } from '../components/ProductCard';
import { AddControl, Reveal, SplitTitle } from '../components/ui';
import { Unbox } from '../components/Unbox';
import { BOXES, shortName, type Product } from '../data/menu';
import { useSeo } from '../lib/useSeo';
import { FinalCta } from './Home';

function BoxCard({ p, i }: { p: Product; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Reveal className="box-card" delay={(i % 3) * 0.08}>
      <div ref={ref} className="bc-media">
        <Unbox img={p.img} name={p.name} autoDelay={0.4 + (i % 3) * 0.25} />
        <Badges p={p} />
      </div>
      <div className="bc-b">
        <Link to={`/product/${p.slug}`} className="card-t">{shortName(p.name)}</Link>
        <div className="card-w">{p.weight}</div>
        <div className="card-f">
          <Price p={p} />
          <AddControl p={p} imgRef={ref} />
        </div>
        <Link to={`/product/${p.slug}`} className="more-link">Рассмотреть поближе <IArrow /></Link>
      </div>
    </Reveal>
  );
}

export default function Boxes() {
  useSeo('Боксы', 'Готовые боксы с закусками и десертами: открыли — и стол накрыт. Подарочные боксы, бенто-торты, наборы на компанию.');
  return (
    <Page className="boxes-page">
      <section className="page-hero">
        <div className="wrap">
          <nav className="crumbs"><Link to="/">Главная</Link><span>/</span><b>Боксы</b></nav>
          <SplitTitle as="h1" text="Боксы, которые" em="хочется открыть" />
          <Reveal delay={0.2}>
            <p className="lead">Каждая коробка — готовый стол или подарок. Прокрутите вниз: боксы открываются сами, а по клику можно закрыть и открыть ещё раз — так их увидят ваши гости.</p>
          </Reveal>
        </div>
      </section>
      <section className="sec tight">
        <div className="wrap box-grid">
          {BOXES.map((p, i) => <BoxCard key={p.id} p={p} i={i} />)}
        </div>
      </section>
      <FinalCta />
    </Page>
  );
}
