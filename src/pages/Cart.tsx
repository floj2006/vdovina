import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { IArrow, IBack, ICheck, IPhone, IVk, IWa } from '../components/Icons';
import { Page } from '../components/Layout';
import { Platter } from '../components/Platter';
import { Counter, Img, Stepper } from '../components/ui';
import { shortName } from '../data/menu';
import { SITE } from '../data/site';
import { goal } from '../lib/analytics';
import { dateStatus, maskPhone, orderText, phoneOk, rub, toLocalInput } from '../lib/format';
import { useSeo } from '../lib/useSeo';
import { useCart } from '../store/cart';

const STEPS = ['Состав', 'Детали', 'Отправка'];

const ERR = {
  name: 'Как к вам обращаться?',
  phone: 'Нужен номер из 11 цифр: +7 (___) ___-__-__',
  address: 'Укажите адрес доставки',
};

export default function Cart() {
  useSeo('Оформление заказа');
  const { items, lines, total, hasFrom, set, count, form, setForm, resetForm, toast, clear } = useCart();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [tried, setTried] = useState(false);
  const [agree, setAgree] = useState(false);
  const [sending, setSending] = useState(false);
  const [hp, setHp] = useState('');

  const reached = useRef(new Set<number>());
  const go = (n: number) => {
    // Каждый шаг воронки — одна цель за визит на страницу, даже если вернуться и пройти снова
    if (n > step && !reached.current.has(n)) {
      reached.current.add(n);
      goal(n === 1 ? 'checkout_details' : 'checkout_review');
    }
    setDir(n > step ? 1 : -1); setStep(n); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const when = dateStatus(form.date);
  const errs = {
    name: !form.name.trim(),
    phone: !phoneOk(form.phone),
    address: form.method === 'delivery' && !form.address.trim(),
    date: when === 'past',
    agree: !agree,
  };
  const valid = !Object.values(errs).some(Boolean);
  const text = orderText(items, form);

  const done = (state?: { sent: boolean; id?: string }) => {
    nav('/thanks', { state });
  };
  const sendSite = async () => {
    setSending(true);
    try {
      const r = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, form, hp }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const { id } = (await r.json().catch(() => ({}))) as { id?: string };
      goal('order_sent', { total, items: count });
      clear();
      resetForm();
      done({ sent: true, id });
    } catch {
      goal('order_failed');
      toast('Не удалось отправить с сайта — отправьте через WhatsApp или ВК');
    } finally {
      setSending(false);
    }
  };
  const sendWa = () => {
    goal('order_wa', { total, items: count });
    window.open(`${SITE.wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    done();
  };
  const sendVk = () => {
    goal('order_vk', { total, items: count });
    // Окно открываем синхронно в обработчике клика — иначе Safari его заблокирует
    const copy = navigator.clipboard?.writeText(text) ?? Promise.reject(new Error('no clipboard'));
    window.open(SITE.vkWrite, '_blank', 'noopener');
    copy.then(() => toast('Текст заказа скопирован — вставьте его в сообщение'), () => toast('Скопируйте текст заказа вручную'));
    done();
  };

  if (!lines.length) {
    return (
      <Page className="cart-page">
        <section className="empty-cart wrap">
          <motion.div className="ec-ic" initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.3 }}>ОВ</motion.div>
          <h1>В заказе пока пусто</h1>
          <p>Загляните в меню или соберите фуршет в конструкторе — он сам посчитает закуски на ваших гостей.</p>
          <div className="row center">
            <Link to="/menu" className="btn btn-primary">Открыть меню</Link>
            <Link to="/constructor" className="btn btn-ghost">Конструктор фуршета</Link>
          </div>
        </section>
      </Page>
    );
  }

  const field = (k: 'name' | 'phone' | 'address', label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={`fld ${tried && errs[k] ? 'err' : ''}`}>
      <span>{label}</span>
      <input value={form[k]} onChange={(e) => setForm({ [k]: k === 'phone' ? maskPhone(e.target.value) : e.target.value })}
        aria-invalid={tried && errs[k]} {...props} />
      <AnimatePresence>{tried && errs[k] && <motion.em initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{ERR[k]}</motion.em>}</AnimatePresence>
    </label>
  );

  return (
    <Page className="cart-page">
      <div className="wrap">
        <nav className="crumbs"><Link to="/">Главная</Link><span>/</span><b>Оформление заказа</b></nav>
        <h1 className="cart-h">Оформление заказа</h1>
        <ol className="stepper-bar">
          {STEPS.map((s, i) => (
            <li key={s} className={i === step ? 'on' : i < step ? 'done' : ''}>
              <button disabled={i > step + 1} onClick={() => {
                if (i <= step) return go(i);
                if (step === 1) { setTried(true); if (!valid) return; }
                go(i);
              }}>
                <i>{i < step ? <ICheck /> : i + 1}</i>{s}
              </button>
            </li>
          ))}
          <motion.span className="sb-fill" animate={{ scaleX: step / (STEPS.length - 1) }} transition={{ type: 'spring', stiffness: 200, damping: 30 }} />
        </ol>
      </div>

      <section className="wrap checkout">
        <div className="co-main">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir}
              variants={{ i: (d: number) => ({ opacity: 0, x: 40 * d }), a: { opacity: 1, x: 0 }, e: (d: number) => ({ opacity: 0, x: -40 * d }) }}
              initial="i" animate="a" exit="e" transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}>
              {step === 0 && (
                <div className="co-card">
                  <h2>Что в заказе</h2>
                  <ul className="co-list">
                    <AnimatePresence initial={false}>
                      {lines.map(({ p, q }) => (
                        <motion.li key={p.id} layout exit={{ opacity: 0, height: 0, transition: { duration: 0.25 } }}>
                          <Link to={`/product/${p.slug}`}><Img src={p.img} alt={p.name} className="th" /></Link>
                          <div className="ci">
                            <Link to={`/product/${p.slug}`}><b>{shortName(p.name)}</b></Link>
                            <small>{p.weight} · {p.from && 'от '}{rub(p.price)}</small>
                          </div>
                          <Stepper value={q} onChange={(v) => set(p.id, v)} small />
                          <span className="sum">{rub(p.price * q)}</span>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                  <div className="co-nav">
                    <Link to="/menu" className="btn btn-ghost"><IBack /> Добавить ещё</Link>
                    <button className="btn btn-primary" onClick={() => go(1)}>Дальше: детали <IArrow /></button>
                  </div>
                </div>
              )}

              {step === 1 && (
                <form className="co-card" onSubmit={(e) => { e.preventDefault(); setTried(true); if (valid) go(2); }} noValidate>
                  <h2>Куда и когда</h2>
                  <div className="fgrid">
                    {field('name', 'Ваше имя *', { autoComplete: 'name', placeholder: 'Как к вам обращаться' })}
                    {field('phone', 'Телефон *', { type: 'tel', autoComplete: 'tel', placeholder: '+7 (___) ___-__-__', inputMode: 'tel' })}
                    <label className={`fld ${tried && errs.date ? 'err' : ''}`}>
                      <span>Дата и время</span>
                      <input type="datetime-local" value={form.date} min={toLocalInput(new Date())} aria-invalid={tried && errs.date}
                        onChange={(e) => setForm({ date: e.target.value })} />
                      {tried && errs.date && <em>Эта дата уже прошла</em>}
                      {when === 'soon' && <small className="fld-hint">Меньше суток до получения — заказ подтвердится, если успею приготовить</small>}
                    </label>
                    <label className="fld">
                      <span>Гостей</span>
                      <input type="number" min={1} max={500} inputMode="numeric" value={form.guests}
                        onChange={(e) => setForm({ guests: e.target.value.replace(/\D/g, '').slice(0, 3) })} placeholder="например, 12" />
                    </label>
                  </div>
                  <div className="seg" role="radiogroup" aria-label="Способ получения">
                    {(['pickup', 'delivery'] as const).map((m) => (
                      <button type="button" key={m} role="radio" aria-checked={form.method === m} className={form.method === m ? 'on' : ''} onClick={() => setForm({ method: m })}>
                        {form.method === m && <motion.span className="chip-bg" layoutId="seg-bg" />}
                        <span>{m === 'pickup' ? <>Самовывоз<small>{SITE.address}</small></> : <>Доставка<small>условия уточню</small></>}</span>
                      </button>
                    ))}
                  </div>
                  <AnimatePresence initial={false}>
                    {form.method === 'delivery' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        {field('address', 'Адрес доставки *', { autoComplete: 'street-address', placeholder: 'Улица, дом, подъезд' })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <label className="fld">
                    <span>Комментарий</span>
                    <textarea rows={3} maxLength={1000} value={form.note} onChange={(e) => setForm({ note: e.target.value })} placeholder="Пожелания, аллергии, повод праздника" />
                  </label>
                  <label className={`agree ${tried && errs.agree ? 'err' : ''}`}>
                    <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} aria-invalid={tried && errs.agree} />
                    <span>
                      Согласен(на) на <Link to="/privacy" target="_blank">обработку персональных данных</Link> и
                      с <Link to="/terms" target="_blank">условиями заказа</Link> *
                    </span>
                  </label>
                  <div className="co-nav">
                    <button type="button" className="btn btn-ghost" onClick={() => go(0)}><IBack /> Назад</button>
                    <button type="submit" className="btn btn-primary">Проверить заказ <IArrow /></button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="co-card">
                  <h2>Отправьте заказ Оксане</h2>
                  <p className="muted">Сообщение уже готово — выберите, куда отправить. Оксана ответит и подтвердит время и сумму.</p>
                  <motion.pre className="msg" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}>{text}</motion.pre>
                  <div className="send">
                    <input type="text" name="ov_hp_check" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: '-9999px', opacity: 0 }} />
                    <button className="btn btn-primary" onClick={sendSite} disabled={sending}>{sending ? 'Отправляю…' : 'Отправить заказ'}</button>
                    <button className="btn send-wa" onClick={sendWa}><IWa /> Отправить в WhatsApp</button>
                    <button className="btn send-vk" onClick={sendVk}><IVk /> Написать ВКонтакте</button>
                    <a className="btn btn-ghost" href={SITE.phoneHref}><IPhone /> Позвонить: {SITE.phone}</a>
                  </div>
                  <div className="co-nav">
                    <button className="btn btn-ghost" onClick={() => go(1)}><IBack /> Изменить данные</button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <aside className="co-side">
          <Platter compact lines={lines} />
          <div className="co-tot">
            <div><span>Позиций</span><b>{count}</b></div>
            <div className="big"><span>Итого</span><b>{hasFrom && <small>от </small>}<Counter value={total} format={rub} /></b></div>
            {hasFrom && <p className="fine">В заказе есть блюда с ценой «от» — точную сумму подтвержу.</p>}
            <p className="fine">Оплата — после подтверждения заказа.</p>
          </div>
        </aside>
      </section>
    </Page>
  );
}
