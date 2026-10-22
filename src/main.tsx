import { MotionConfig } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './store/cart';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
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
