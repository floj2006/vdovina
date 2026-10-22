import '@fontsource/cormorant-garamond/500.css';
import '@fontsource/cormorant-garamond/600.css';
import '@fontsource/cormorant-garamond/700.css';
import '@fontsource/cormorant-garamond/500-italic.css';
import '@fontsource/cormorant-garamond/600-italic.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import { MotionConfig } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { initAnalytics } from './lib/analytics';
import { CartProvider } from './store/cart';
import './styles/global.css';

initAnalytics();

// Предрендеренная разметка (для поисковиков и без JS) заменяется клиентским рендером:
// корзина и форма зависят от localStorage, гидрация дала бы расхождения
const root = document.getElementById('root')!;
root.removeAttribute('data-ssr');
createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
      </CartProvider>
    </BrowserRouter>
  </StrictMode>,
);
