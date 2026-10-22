import { AnimatePresence } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Shell } from './components/Layout';
import { hit } from './lib/analytics';
import About from './pages/About';
import Boxes from './pages/Boxes';
import Cart from './pages/Cart';
import Constructor from './pages/Constructor';
import Contacts from './pages/Contacts';
import Delivery from './pages/Delivery';
import Home from './pages/Home';
import { Privacy, Terms } from './pages/Legal';
import Menu from './pages/Menu';
import NotFound from './pages/NotFound';
import ProductPage from './pages/Product';
import Thanks from './pages/Thanks';

export default function App() {
  const loc = useLocation();
  // Внутри /menu категории переключаются без смены страницы — анимируется только сетка
  const seg = loc.pathname.split('/')[1] || 'home';
  const key = seg === 'product' ? loc.pathname : seg;
  useEffect(() => hit(loc.pathname + loc.search), [loc.pathname, loc.search]);
  return (
    <Shell>
      <ErrorBoundary resetKey={loc.pathname}>
        <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
          <Routes location={loc} key={key}>
            <Route path="/" element={<Home />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/menu/:cat" element={<Menu />} />
            <Route path="/product/:slug" element={<ProductPage />} />
            <Route path="/boxes" element={<Boxes />} />
            <Route path="/constructor" element={<Constructor />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/thanks" element={<Thanks />} />
            <Route path="/about" element={<About />} />
            <Route path="/delivery" element={<Delivery />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </ErrorBoundary>
    </Shell>
  );
}
