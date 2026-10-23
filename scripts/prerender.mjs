// Предрендер: кладёт в dist готовый HTML каждой страницы с её title, description и canonical,
// плюс sitemap.xml. Запускается после `vite build` и `vite build --ssr` (см. npm run build).
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

const root = process.cwd();
const dist = join(root, 'dist');
const ssrDir = join(root, 'dist-ssr');
const env = { ...loadEnv('production', root, 'VITE_'), ...process.env };
const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');

const { render, ROUTES } = await import(pathToFileURL(join(ssrDir, 'entry-server.js')).href);
const template = await readFile(join(dist, 'index.html'), 'utf8');

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// framer-motion пишет начальные стили анимаций прямо в разметку (opacity:0, translateY(110%)).
// Убираем их, чтобы текст был виден без JS; браузер с JS прячет предрендер до своего рендера (см. main.tsx)
const visible = (html) => html.replace(/ style="[^"]*(?:opacity:0|translateY\(110%\))[^"]*"/g, '');

const NOINDEX = '  <meta name="robots" content="noindex" />\n';
// Функции-замены: «$» в текстах не интерпретируется как шаблон
const set = (re, value) => (s) => s.replace(re, (_, p1) => p1 + attr(value));

function page(url, { html, head }, { noindex = false } = {}) {
  let out = template
    .replace('<div id="root"></div>', () => (html ? `<div id="root" data-ssr>${visible(html)}</div>` : '<div id="root"></div>'))
    .replace(/<title>.*?<\/title>/s, () => `<title>${attr(head.title)}</title>`);
  out = set(/(<meta property="og:title" content=")[^"]*/, head.title)(out);
  if (head.description) {
    out = set(/(<meta name="description" content=")[^"]*/, head.description)(out);
    out = set(/(<meta property="og:description" content=")[^"]*/, head.description)(out);
  }
  if (siteUrl && !noindex) {
    out = set(/(<link rel="canonical" href=")[^"]*/, siteUrl + url)(out);
    out = set(/(<meta property="og:url" content=")[^"]*/, siteUrl + url)(out);
  } else {
    out = out.replace(/\s*<link rel="canonical"[^>]*>/, '').replace(/\s*<meta property="og:url"[^>]*>/, '');
  }
  return out.replace('</head>', () => `${noindex ? NOINDEX : ''}</head>`);
}

if (!siteUrl && process.env.DEPLOY === '1') {
  console.error('\n✖ VITE_SITE_URL не задан для продакшен-сборки (файл .env на сервере).\n');
  process.exit(1);
}

// Оболочка без контента — для /cart и /thanks (рендерятся только в браузере)
await writeFile(join(dist, 'spa.html'), page('/', { html: '', head: { title: 'Оксана Вдовина — фуршеты и десерты' } }, { noindex: true }));

for (const url of ROUTES) {
  const file = url === '/' ? 'index.html' : `${url.slice(1)}.html`;
  const target = join(dist, file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, page(url, render(url)));
}

await writeFile(join(dist, '404.html'), page('/404', render('/404'), { noindex: true }));

if (siteUrl) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ROUTES.map((u) => `  <url><loc>${siteUrl}${u === '/' ? '/' : u}</loc><lastmod>${today}</lastmod></url>`).join('\n');
  await writeFile(join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  const robots = await readFile(join(dist, 'robots.txt'), 'utf8');
  await writeFile(join(dist, 'robots.txt'), `${robots.trimEnd()}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
} else {
  console.warn('\n⚠ VITE_SITE_URL не задан: canonical, og:url и sitemap.xml не созданы.\n');
}

await rm(ssrDir, { recursive: true, force: true });
console.log(`prerender: ${ROUTES.length} страниц + 404 + spa.html`);
