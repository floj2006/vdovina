import { useEffect } from 'react';

const BASE = 'Оксана Вдовина — фуршеты и десерты';

/** Заголовок и описание страницы для поисковиков и соцсетей */
export function useSeo(title: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : BASE;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute('content', description);
      document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
    }
    document.querySelector('meta[property="og:title"]')?.setAttribute('content', document.title);
  }, [title, description]);
}
