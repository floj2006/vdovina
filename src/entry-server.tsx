import { MotionConfig } from 'framer-motion';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import App from './App';
import { CATEGORIES, PRODUCTS } from './data/menu';
import { ssrHead } from './lib/useSeo';
import { CartProvider } from './store/cart';

/** Страницы для предрендера и sitemap. Корзина и «спасибо» не индексируются */
export const ROUTES = [
  '/', '/menu', '/boxes', '/constructor', '/about', '/delivery', '/contacts', '/privacy', '/terms',
  ...CATEGORIES.map((c) => `/menu/${c.slug}`),
  ...PRODUCTS.map((p) => `/product/${p.slug}`),
];

export function render(url: string) {
  const html = renderToString(
    <StaticRouter location={url}>
      <CartProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </CartProvider>
    </StaticRouter>,
  );
  return { html, head: { ...ssrHead } };
}
