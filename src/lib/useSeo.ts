import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE } from '../data/site';

const BASE = 'Оксана Вдовина — фуршеты и десерты';

/** При предрендере сюда попадают заголовок и описание отрисованной страницы */
export const ssrHead: { title: string; description?: string } = { title: BASE };

const fullTitle = (title: string) => (title ? `${title} · ${BASE}` : BASE);

/** Заголовок, описание и canonical страницы для поисковиков и соцсетей */
export function useSeo(title: string, description?: string) {
  const { pathname } = useLocation();
  if (import.meta.env.SSR) {
    ssrHead.title = fullTitle(title);
    ssrHead.description = description;
  }
  useEffect(() => {
    document.title = fullTitle(title);
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    }
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
    if (SITE.url) {
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', SITE.url + pathname);
      document.querySelector('meta[property="og:url"]')?.setAttribute('content', SITE.url + pathname);
    }
  }, [title, description, pathname]);
}
