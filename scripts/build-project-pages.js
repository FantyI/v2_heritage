/* =====================================================================
   Генератор статических страниц проектов.
   Для каждого дома из js/houses-data.js создаёт файл proekty/<id>.html
   с уникальным URL, <title>, мета-описанием и OG-тегами — чтобы на
   каждый проект можно было ставить цели в аналитике.

   Запуск:  node scripts/build-project-pages.js
   (повторно запускать после правок project.html или houses-data.js)
   ===================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'proekty');

/* Если появится боевой домен — впишите его сюда (например
   'https://nasledie-domain.ru'), тогда og:url/og:image станут абсолютными. */
const SITE = '';

/* ---- читаем данные домов ---- */
const dataSrc = fs.readFileSync(path.join(ROOT, 'js', 'houses-data.js'), 'utf8');
const HOUSES = new Function(dataSrc + '\nreturn HOUSES;')();

/* ---- читаем шаблон ---- */
let template = fs.readFileSync(path.join(ROOT, 'project.html'), 'utf8');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildPage(h) {
  const name = h.name || '';
  const style = (h.style || '').trim();
  const url = `${SITE}/proekty/${h.id}.html`;
  const img = h.images && h.images[0] ? `${SITE}/${h.images[0]}` : `${SITE}/img/ui/logo.svg`;

  const title = `${name} — проект дома из газобетона под ключ | Наследие`;
  const specs = [h.area, h.floors && h.floors + ' эт.', h.rooms && h.rooms + ' комн.']
    .filter(Boolean).join(', ');
  const descParts =
    `Проект дома «${name}»${style ? ' (' + style.toLowerCase() + ')' : ''} из газобетона под ключ` +
    (specs ? ': ' + specs : '') +
    `. Стоимость ${h.price || 'по запросу'}. Характеристики, комплектация, фото и видео-визитка.`;

  let out = template;

  /* id для project.js + базовый href, чтобы относительные пути работали из /proekty/ */
  out = out.replace('<html lang="ru">', `<html lang="ru" data-project-id="${esc(h.id)}">`);
  out = out.replace('<meta charset="UTF-8" />', '<meta charset="UTF-8" />\n    <base href="/" />');

  /* title */
  out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);

  /* description + canonical + OG (вставляем вместо текущего meta description) */
  const head = [
    `<meta name="description" content="${esc(descParts)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(descParts)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`
  ].join('\n    ');
  out = out.replace(/<meta\s+name="description"[\s\S]*?\/>/, head);

  /* лёгкий пред-рендер видимых полей карточки (JS всё равно их перезапишет) */
  out = out.replace(/(<h1 class="buy-card__name">)[\s\S]*?(<\/h1>)/, `$1${esc(name)}$2`);
  out = out.replace(/(<span class="buy-card__type">)[\s\S]*?(<\/span>)/, `$1${esc(style.toUpperCase())}$2`);
  out = out.replace(/(<span class="buy-card__price">)[\s\S]*?(<\/span>)/, `$1${esc(h.price || '')}$2`);
  out = out.replace(/(<span class="buy-card__id">)[\s\S]*?(<\/span>)/, `$1ID объекта: ${esc(h.objectId)}$2`);
  out = out.replace(/(<span class="specs__map-badge">)[\s\S]*?(<\/span>)/, `$1${esc(style)}$2`);

  return out;
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

let count = 0;
HOUSES.forEach(function (h) {
  if (!h || !h.id) return;
  const file = path.join(OUT_DIR, h.id + '.html');
  fs.writeFileSync(file, buildPage(h), 'utf8');
  count++;
  console.log('  ✓ proekty/' + h.id + '.html  — ' + h.name);
});

console.log('\nГотово: сгенерировано ' + count + ' страниц проектов в /proekty/');
