import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { CATEGORIES, shortName } from '../data/menu';
import { SITE } from '../data/site';
import { rub } from '../lib/format';
import { useCart } from '../store/cart';
import { IArrow, IBag, IClose, IMenu, IPhone, IVk, IWa } from './Icons';
import { Platter } from './Platter';
import { Img, Stepper } from './ui';
import { lockScroll } from '../lib/lock';

export const NAV = [
  { to: '/menu', label: 'Меню' },
  { to: '/boxes', label: 'Боксы' },
  { to: '/constructor', label: 'Конструктор' },
  { to: '/about', label: 'О себе' },
  { to: '/delivery', label: 'Доставка' },
  { to: '/contacts', label: 'Контакты' },
];

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="На главную">
      <span className="mono">ОВ</span>
      <span><b>{SITE.name}</b><small>{SITE.tagline}</small></span>
    </Link>
  );
}

function Header() {
  const { count, setDrawer, bump } = useCart();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);
  const loc = useLocation();

  useMotionValueEvent(scrollY, 'change', (v) => {
    const prev = scrollY.getPrevious() ?? 0;
    setSolid(v > 24);
    setHidden(v > 400 && v > prev + 4 && !menu);
    if (v < prev - 4) setHidden(false);
  });
  useEffect(() => setMenu(false), [loc.pathname]);

  return (
    <>
      <motion.header className={`hdr ${solid ? 'solid' : ''}`} animate={{ y: hidden ? '-110%' : '0%' }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
        <div className="wrap">
          <Logo />
          <nav className="nav" aria-label="Основное меню">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to}>
                {({ isActive }) => (
                  <>
                    {n.label}
                    {isActive && <motion.i className="ul" layoutId="nav-ul" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
          <div className="hdr-r">
            <a className="phone" href={SITE.phoneHref}>{SITE.phone}<small><i />Принимаю заказы {SITE.hoursShort}</small></a>
            <button className="cart-btn" data-cart-target onClick={() => setDrawer(true)} aria-label={`Открыть заказ, позиций: ${count}`}>
              <motion.span key={bump} className="ic" animate={bump ? { scale: [1, 1.35, 0.9, 1], rotate: [0, -12, 6, 0] } : undefined} transition={{ duration: 0.55 }}>
                <IBag />
              </motion.span>
              <AnimatePresence>
                {count > 0 && (
                  <motion.span className="cnt" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>{count > 99 ? '99+' : count}</motion.span>
                )}
              </AnimatePresence>
            </button>
            <button className="burger" onClick={() => setMenu(true)} aria-label="Открыть меню"><IMenu /></button>
          </div>
        </div>
      </motion.header>
      <MobileMenu open={menu} onClose={() => setMenu(false)} />
    </>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => (open ? lockScroll() : undefined), [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="mmenu" initial={{ clipPath: 'circle(0% at 92% 4%)' }} animate={{ clipPath: 'circle(150% at 92% 4%)' }}
          exit={{ clipPath: 'circle(0% at 92% 4%)' }} transition={{ duration: 0.6, ease: [0.7, 0, 0.2, 1] }}>
          <div className="mm-top"><Logo /><button className="x" onClick={onClose} aria-label="Закрыть меню"><IClose /></button></div>
          <motion.nav initial="h" animate="v" transition={{ staggerChildren: 0.06, delayChildren: 0.25 }}>
            {[{ to: '/', label: 'Главная' }, ...NAV, { to: '/cart', label: 'Корзина' }].map((n, i) => (
              <motion.div key={n.to} variants={{ h: { y: 40, opacity: 0 }, v: { y: 0, opacity: 1 } }}>
                <NavLink to={n.to} end={n.to === '/'}><i>0{i + 1}</i>{n.label}</NavLink>
              </motion.div>
            ))}
          </motion.nav>
          <motion.div className="mm-foot" initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.6 } }}>
            <a href={SITE.phoneHref}><IPhone /> {SITE.phone}</a>
            <span>{SITE.hours}</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CartDrawer() {
  const { drawer, setDrawer, lines, set, total, hasFrom, count } = useCart();
  const nav = useNavigate();
  useEffect(() => {
    if (!drawer) return;
    const unlock = lockScroll();
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', k);
    return () => { unlock(); document.removeEventListener('keydown', k); };
  }, [drawer, setDrawer]);

  return (
    <AnimatePresence>
      {drawer && (
        <>
          <motion.div className="ovl" onClick={() => setDrawer(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside className="drawer" aria-label="Ваш заказ" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 34 }}>
            <div className="dr-h">
              <h3>Ваш заказ {count > 0 && <small>{count} шт</small>}</h3>
              <button className="x" onClick={() => setDrawer(false)} aria-label="Закрыть"><IClose /></button>
            </div>
            <div className="dr-b">
              <Platter compact lines={lines} />
              {lines.length === 0 ? (
                <div className="dr-empty">
                  <p>Пока пусто. Загляните в меню или соберите фуршет в конструкторе — это займёт пару минут.</p>
                  <div className="row">
                    <button className="btn btn-primary" onClick={() => { setDrawer(false); nav('/menu'); }}>В меню</button>
                    <button className="btn btn-ghost" onClick={() => { setDrawer(false); nav('/constructor'); }}>Конструктор</button>
                  </div>
                </div>
              ) : (
                <ul className="dr-list">
                  <AnimatePresence initial={false}>
                    {lines.map(({ p, q }) => (
                      <motion.li key={p.id} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30, height: 0, marginBottom: 0 }}>
                        <Img src={p.img} alt={p.name} className="th" />
                        <div className="ci">
                          <Link to={`/product/${p.slug}`} onClick={() => setDrawer(false)}>{shortName(p.name)}</Link>
                          <small>{p.from && 'от '}{rub(p.price)} × {q} = <b>{rub(p.price * q)}</b></small>
                        </div>
                        <Stepper small value={q} onChange={(v) => set(p.id, v)} />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>
            {lines.length > 0 && (
              <div className="dr-f">
                <div className="tot"><span>Итого</span><b>{hasFrom && 'от '}{rub(total)}</b></div>
                <button className="btn btn-primary wide shine" onClick={() => { setDrawer(false); nav('/cart'); }}>Оформить заказ <IArrow /></button>
                <div className="fine">Оплата и время — после подтверждения Оксаной</div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="f-brand">
          <Logo />
          <p>Фуршетные закуски, горячие обеды и десерты на вынос. Готовлю сама — под ваш праздник.</p>
          <div className="soc">
            <a href={SITE.wa} target="_blank" rel="noopener" aria-label="WhatsApp"><IWa /></a>
            <a href={SITE.vk} target="_blank" rel="noopener" aria-label="ВКонтакте"><IVk /></a>
            <a href={SITE.phoneHref} aria-label="Позвонить"><IPhone /></a>
          </div>
        </div>
        <div>
          <h4>Сайт</h4>
          {NAV.map((n) => <Link key={n.to} to={n.to}>{n.label}</Link>)}
        </div>
        <div>
          <h4>Меню</h4>
          {CATEGORIES.slice(0, 8).map((c) => <Link key={c.key} to={`/menu/${c.slug}`}>{c.title}</Link>)}
        </div>
        <div>
          <h4>Контакты</h4>
          <a href={SITE.phoneHref}>{SITE.phone}</a>
          <span>{SITE.hours}</span>
          <span>Самовывоз: {SITE.address}</span>
        </div>
      </div>
      <div className="wrap f-bot">
        <span>© {new Date().getFullYear()} {SITE.name}. Все цены в рублях.</span>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Наверх ↑</button>
      </div>
    </footer>
  );
}

function MobileBar() {
  const { count, total, setDrawer, hasFrom } = useCart();
  const loc = useLocation();
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setShow(v > window.innerHeight * 0.5));
  const visible = (show || count > 0) && loc.pathname !== '/cart' && loc.pathname !== '/thanks';
  return (
    <AnimatePresence>
      {visible && (
        <motion.div className="mbar" initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} transition={{ type: 'spring', stiffness: 320, damping: 30 }}>
          <a className="call" href={SITE.phoneHref} aria-label="Позвонить"><IPhone /></a>
          <button className="go" onClick={() => setDrawer(true)} data-cart-target>
            <IBag />
            {count > 0 ? <>Заказ · {count} шт · {hasFrom && 'от '}{rub(total)}</> : 'Собрать заказ'}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Toast() {
  const { toastMsg } = useCart();
  return (
    <div className="toast-wrap" aria-live="polite">
      <AnimatePresence>
        {toastMsg && (
          <motion.div key={toastMsg.id} className="toast" initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -10, opacity: 0 }}>
            <span className="ok">✓</span>{toastMsg.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return <motion.div className="progress" style={{ scaleX: scrollYProgress }} />;
}

export function Shell({ children }: { children: ReactNode }) {
  return (
    <>
      <ScrollProgress />
      <Header />
      {children}
      <Footer />
      <MobileBar />
      <CartDrawer />
      <Toast />
    </>
  );
}

/** Обёртка страницы: шторка-переход и плавное появление */
let firstPage = true;

export function Page({ children, className = '' }: { children: ReactNode; className?: string }) {
  // При первом входе шторку не показываем — контент должен появиться сразу
  const [curtain] = useState(() => !firstPage);
  useEffect(() => { firstPage = false; }, []);
  return (
    <motion.main className={`page ${className}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      {curtain && (
        <motion.div className="curtain" aria-hidden initial={{ scaleY: 1 }} animate={{ scaleY: 0, transition: { duration: 0.7, ease: [0.7, 0, 0.2, 1] } }}
          exit={{ scaleY: 0 }} style={{ originY: 0 }}>
          <motion.span className="mono" initial={{ opacity: 1 }} animate={{ opacity: 0, transition: { duration: 0.25 } }}>ОВ</motion.span>
        </motion.div>
      )}
      {children}
    </motion.main>
  );
}
