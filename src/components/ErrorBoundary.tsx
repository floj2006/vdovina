import { Component, type ErrorInfo, type ReactNode } from 'react';
import { SITE } from '../data/site';

/** Если что-то упало при рендере — показываем контакты вместо белого экрана */
// key на границе не подходит: перемонтирование ломает анимацию ухода страницы в AnimatePresence
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  /** Переход на другую страницу снимает экран ошибки */
  componentDidUpdate(prev: { resetKey: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page nf-page">
        <section className="nf wrap">
          <h1>Что-то пошло не так</h1>
          <p>Обновите страницу. Если не помогло — закажите по телефону <a href={SITE.phoneHref}>{SITE.phone}</a> или в <a href={SITE.wa} target="_blank" rel="noopener">WhatsApp</a>.</p>
          <div className="row center">
            <button className="btn btn-primary" onClick={() => location.reload()}>Обновить</button>
          </div>
        </section>
      </main>
    );
  }
}
