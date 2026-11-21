/* ============================================================
   Сборка: модули + стили + логотипы → dist/index.html (один файл)
   плюс dist/robots.txt, dist/sitemap.xml и ролики в dist/assets/videos
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync, unlinkSync } from 'node:fs';
import { join, dirname, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
/* Маршруты и адреса берём из тех же модулей, что и сайт: sitemap.xml
   совпадает с canonical/hreflang по построению. */
import { LANGS as LANG_LIST, DEFAULT_LANG, SITE_URL, SERVICES, DOCTORS } from './src/data/clinic.js';
import { PAGES, routePath } from './src/lib/core.js';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');
const kb = (n) => (n / 1024).toFixed(1) + ' KB';

/* ---- Порядок модулей (зависимости идут первыми) ---- */
const STYLES = [
  'src/styles/01-tokens.css',
  'src/styles/02-motion.css',
  'src/styles/03-shell.css',
  'src/styles/04-sections.css',
  'src/styles/05-forms.css'
];

const LOCALES = ['ru', 'uz', 'en', 'es', 'fr', 'de'];

const MODULES = [
  'src/lib/assets.js',
  'src/data/clinic.js',
  ...LOCALES.map((l) => `src/i18n/${l}.js`),
  'src/i18n/index.js',
  'src/lib/icons.js',
  'src/lib/core.js',
  'src/lib/motion.js',
  'src/components/ui.js',
  'src/components/layout.js',
  'src/components/booking.js',
  /* Секции — независимые блоки, из которых собираются страницы */
  'src/sections/hero.js',
  'src/sections/trust.js',
  'src/sections/about-band.js',
  'src/sections/services-grid.js',
  'src/sections/technology.js',
  'src/sections/why.js',
  'src/sections/process.js',
  'src/sections/prices-teaser.js',
  'src/sections/doctors-stage.js',
  'src/sections/reviews-strip.js',
  'src/sections/booking-panel.js',
  'src/sections/contacts-panel.js',
  /* Страницы */
  'src/pages/home.js',
  'src/pages/about.js',
  'src/pages/services.js',
  'src/pages/prices.js',
  'src/pages/doctors.js',
  'src/pages/reviews.js',
  'src/pages/patients.js',
  'src/pages/contacts.js',
  'src/pages/legal.js',
  'src/app.js'
];

/* ---- Превращаем ES-модуль в кусок общего скоупа ---- */
function strip(src, file) {
  let s = src;
  s = s.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?[ \t]*$/gm, '');
  s = s.replace(/^import\s+['"][^'"]+['"];?[ \t]*$/gm, '');
  s = s.replace(/^export\s*\{[^}]*\}\s*;?[ \t]*$/gm, '');

  const loc = file.match(/src\/i18n\/(\w{2})\.js$/);
  if (loc) s = s.replace(/export\s+default\s*\{/, `const ${loc[1]} = {`);

  s = s.replace(/^export\s+default\s+(function|class)\s+/gm, '$1 ');
  s = s.replace(/^export\s+default\s+([A-Za-z_$][\w$]*)\s*;?[ \t]*$/gm, '');
  s = s.replace(/^export\s+(const|let|var|function|class|async)\s+/gm, '$1 ');
  return `\n/* ==== ${file} ==== */\n${s.trim()}\n`;
}

/* ---- Логотипы в base64 ---- */
const dataUri = (p) => `data:image/png;base64,${readFileSync(join(root, p)).toString('base64')}`;
const LOGO_MARK = dataUri('src/assets/logo-mark.png');
const LOGO_FULL = dataUri('src/assets/logo-full.png');

/* ============================================================
   Фотографии клиники: src/assets/photos/<ключ>.<ext> → data-URI.
   Имя файла = ключ слота из PHOTOS (или slug врача).
   Картинка ужимается до PHOTO_MAX_WIDTH и переводится в WebP,
   чтобы один HTML-файл не раздувался мегабайтами.
   ============================================================ */
const PHOTO_DIR = 'src/assets/photos';
const PHOTO_MAX_WIDTH = 1600;
const PHOTO_QUALITY = 78;
const PHOTO_EXT = /\.(png|jpe?g|webp|avif)$/i;
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif' };

/* sharp — только для сборки. Если его нет, картинка ляжет как есть. */
let sharp = null;
try { sharp = (await import('sharp')).default; }
catch { console.warn('  ! sharp не установлен — фотографии встраиваются без сжатия (npm i -D sharp)'); }

async function collectPhotos() {
  const dir = join(root, PHOTO_DIR);
  if (!existsSync(dir)) return { map: {}, report: [] };
  const files = readdirSync(dir).filter((f) => PHOTO_EXT.test(f));
  const map = {};
  const report = [];
  for (const file of files.sort()) {
    const key = file.replace(PHOTO_EXT, '');
    const raw = readFileSync(join(dir, file));
    let uri, note;
    if (sharp) {
      const out = await sharp(raw)
        .rotate()                                        /* учитываем EXIF-поворот с телефона */
        .resize({ width: PHOTO_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: PHOTO_QUALITY })
        .toBuffer();
      uri = `data:image/webp;base64,${out.toString('base64')}`;
      note = `${kb(raw.length)} → ${kb(out.length)} webp`;
    } else {
      const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
      uri = `data:${MIME[ext] || 'image/png'};base64,${raw.toString('base64')}`;
      note = `${kb(raw.length)} без сжатия`;
    }
    map[key] = uri;
    report.push(`  photo ${key}: ${note}`);
  }
  return { map, report };
}

/* ============================================================
   Видео клиники: src/assets/videos/*.mp4 → assets/videos/ рядом с HTML.
   Ролики намеренно НЕ кодируются в base64 — иначе один HTML-файл
   вырос бы на десятки мегабайт и перестал открываться. В бандл
   попадает только манифест: путь assets/videos/<файл> и постер.
   На сайте путь превращается в /assets/videos/… (от корня), а при
   открытии файла с диска остаётся относительным — см. assetUrl().

   video-1.mobile.mp4 рядом с video-1.mp4 — облегчённая версия того же
   ролика для телефонов и миниатюр. Отдельным роликом она не считается.

   В имя копии добавляется хеш содержимого (video-1.3f9a1c2e.mp4):
   ролики отдаются с Cache-Control immutable на год, и без хеша
   заменённый файл посетители увидели бы только через год.
   ============================================================ */
const VIDEO_DIR = 'src/assets/videos';
const VIDEO_OUT = 'assets/videos';                 /* относительно каждого HTML */
const VIDEO_EXT = /\.(mp4|webm|m4v)$/i;
const MOBILE_RE = /\.mobile\.(mp4|webm|m4v)$/i;
const POSTER_EXT = /\.(png|jpe?g|webp|avif)$/i;
const VIDEO_MIME = { '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm' };
const POSTER_MAX_WIDTH = 900;
const VIDEO_WARN_SIZE = 8 * 1024 * 1024;

/** Кадр-постер рядом с роликом: video-1.mp4 → video-1.jpg */
async function posterFor(dir, files, key) {
  const file = files.find((f) => POSTER_EXT.test(f) && f.replace(POSTER_EXT, '') === key);
  if (!file) return null;
  const raw = readFileSync(join(dir, file));
  if (!sharp) return `data:${MIME[file.slice(file.lastIndexOf('.')).toLowerCase()] || 'image/jpeg'};base64,${raw.toString('base64')}`;
  const out = await sharp(raw).rotate().resize({ width: POSTER_MAX_WIDTH, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer();
  return `data:image/webp;base64,${out.toString('base64')}`;
}

async function collectVideos() {
  const dir = join(root, VIDEO_DIR);
  if (!existsSync(dir)) return { list: [], report: ['  videos: папки ' + VIDEO_DIR + ' нет — первый экран покажет фотографию'] };
  const files = readdirSync(dir);
  const clips = files.filter((f) => VIDEO_EXT.test(f) && !MOBILE_RE.test(f)).sort();
  const list = [];
  const report = [];
  const heavy = (n) => (n > VIDEO_WARN_SIZE ? '  ← тяжёлый файл, стоит пережать (см. src/assets/videos/README.md)' : '');
  /** video-1.mp4 → video-1.<хеш>.mp4 */
  const hashed = (file) => {
    const ext = file.slice(file.lastIndexOf('.'));
    const hash = createHash('sha1').update(readFileSync(join(dir, file))).digest('hex').slice(0, 8);
    return `${file.slice(0, -ext.length)}.${hash}${ext}`;
  };
  for (const file of clips) {
    const key = file.replace(VIDEO_EXT, '');
    const size = statSync(join(dir, file)).size;
    const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
    const mobileFile = files.find((f) => MOBILE_RE.test(f) && f.replace(MOBILE_RE, '') === key);
    const out = hashed(file);
    const mobileOut = mobileFile ? hashed(mobileFile) : null;
    list.push({
      key,
      copies: [[file, out], ...(mobileFile ? [[mobileFile, mobileOut]] : [])],
      src: `${VIDEO_OUT}/${out}`,
      type: VIDEO_MIME[ext] || 'video/mp4',
      poster: await posterFor(dir, files, key),
      mobile: mobileOut ? `${VIDEO_OUT}/${mobileOut}` : null
    });
    report.push(`  video ${key}: ${kb(size)}${heavy(size)}`);
    if (mobileFile) {
      const msize = statSync(join(dir, mobileFile)).size;
      report.push(`  video ${key} (mobile): ${kb(msize)}${heavy(msize)}`);
    }
  }
  if (!clips.length) report.push('  videos: пока нет — положите mp4 в ' + VIDEO_DIR);
  return { list, report };
}

/** Копируем ролики рядом с каждой копией сайта — иначе они не проиграются.
 *  Ролики, которых больше нет в src/assets/videos, удаляются из копий. */
function copyVideos(videos, outputs) {
  const done = [];
  const pairs = videos.flatMap((v) => v.copies);
  const names = pairs.map(([, out]) => out);
  const dirs = [...new Set(outputs.map((out) => join(dirname(resolve(root, out)), VIDEO_OUT)))];
  for (const outDir of dirs) {
    if (!names.length && !existsSync(outDir)) continue;
    mkdirSync(outDir, { recursive: true });
    let copied = 0, removed = 0;
    for (const [name, outName] of pairs) {
      const from = join(root, VIDEO_DIR, name);
      const to = join(outDir, outName);
      const src = statSync(from);
      /* Не переписываем файл, если он уже такой же — сборка остаётся быстрой */
      if (existsSync(to)) {
        const dst = statSync(to);
        if (dst.size === src.size && dst.mtimeMs >= src.mtimeMs) continue;
      }
      copyFileSync(from, to);
      copied++;
    }
    for (const stale of readdirSync(outDir).filter((f) => VIDEO_EXT.test(f) && !names.includes(f))) {
      unlinkSync(join(outDir, stale));
      removed++;
    }
    const parts = [copied && `${copied} обновлено`, removed && `${removed} удалено`].filter(Boolean);
    done.push(`  videos → ${outDir.split(sep).join('/')} (${parts.length ? parts.join(', ') : 'без изменений'})`);
  }
  return done;
}

/* ============================================================
   robots.txt и sitemap.xml: все страницы × 6 языков, у каждого
   адреса — альтернативы hreflang (как в <head> на сайте).
   Адреса строит routePath() из src/lib/core.js — тот же, что
   для canonical, поэтому расхождений быть не может.
   ============================================================ */
function siteRoutes() {
  return [
    ...PAGES.map((page) => ({ page, slug: null })),
    ...SERVICES.map((s) => ({ page: 'services', slug: s.slug })),
    ...DOCTORS.map((d) => ({ page: 'doctors', slug: d.slug }))
  ];
}

const xmlEsc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

function buildSitemap() {
  const url = (lang, r) => SITE_URL + routePath(lang, r.page, r.slug);
  const alternates = [...LANG_LIST.map((l) => [l.htmlLang, l.code]), ['x-default', DEFAULT_LANG]];
  const entries = [];
  for (const r of siteRoutes()) {
    for (const l of LANG_LIST) {
      entries.push([
        '  <url>',
        `    <loc>${xmlEsc(url(l.code, r))}</loc>`,
        ...alternates.map(([hl, code]) => `    <xhtml:link rel="alternate" hreflang="${hl}" href="${xmlEsc(url(code, r))}"/>`),
        '  </url>'
      ].join('\n'));
    }
  }
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...entries,
    '</urlset>',
    ''
  ].join('\n');
  return { xml, count: entries.length };
}

function buildRobots() {
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /api/',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ''
  ].join('\n');
}

/* ---- Сборка ---- */
const photos = await collectPhotos();
const videos = await collectVideos();
const videoEntries = videos.list
  .map((v) => `{key:${JSON.stringify(v.key)},src:${JSON.stringify(v.src)},mobile:${JSON.stringify(v.mobile)},type:${JSON.stringify(v.type)},poster:${JSON.stringify(v.poster)}}`)
  .join(',');
const photoEntries = Object.entries(photos.map).map(([k, v]) => `${JSON.stringify(k)}:${JSON.stringify(v)}`).join(',');
const css = STYLES.map((f) => `/* ${f} */\n${read(f)}`).join('\n');
let js = MODULES.map((f) => strip(read(f), f)).join('\n');
/* Важно: подстановки только через функцию-замену — иначе `$$` в коде
   будет съеден правилами замены строк JavaScript. */
js = js.replace("'__LOGO_MARK__'", () => JSON.stringify(LOGO_MARK))
       .replace("'__LOGO_FULL__'", () => JSON.stringify(LOGO_FULL))
       .replace('/* __PHOTO_FILES__ */', () => photoEntries)
       .replace('/* __VIDEO_FILES__ */', () => videoEntries);

const bundle = `/* UMID Medical Centre — production bundle */\n(function(){\n'use strict';\n${js}\n})();`;

let html = read('src/index.template.html')
  .replace('/*__STYLES__*/', () => css)
  .replace('/*__APP__*/', () => bundle)
  .replaceAll('__FAVICON__', () => LOGO_MARK);

/* ---- Куда кладём результат ----
   Копий сайта две, и они одинаковые. Обе внутри репозитория:
   сборка ничего не пишет за его пределы. */
const OUTPUTS = [
  'dist/index.html',                 /* результат сборки — его раздаёт Vercel */
  'index.html'                       /* рядом с исходниками, чтобы открыть двойным кликом (в .gitignore) */
];

mkdirSync(join(root, 'dist'), { recursive: true });
for (const out of OUTPUTS) writeFileSync(join(root, out), html, 'utf8');
const videoLog = copyVideos(videos.list, OUTPUTS);

/* robots.txt и sitemap.xml нужны только на хостинге — кладём в dist/ */
const sitemap = buildSitemap();
writeFileSync(join(root, 'dist/sitemap.xml'), sitemap.xml, 'utf8');
writeFileSync(join(root, 'dist/robots.txt'), buildRobots(), 'utf8');

console.log('Собрано:', kb(Buffer.byteLength(html)));
console.log('  css:', kb(Buffer.byteLength(css)), '| js:', kb(Buffer.byteLength(bundle)), '| logos:', kb(LOGO_MARK.length + LOGO_FULL.length));
photos.report.forEach((l) => console.log(l));
if (!photos.report.length) console.log('  photos: пока нет — положите файлы в', PHOTO_DIR);
videos.report.forEach((l) => console.log(l));
videoLog.forEach((l) => console.log(l));
console.log(`  sitemap.xml: ${sitemap.count} адресов (${siteRoutes().length} страниц × ${LANG_LIST.length} языков)`);
console.log('Обновлены файлы:');
[...OUTPUTS, 'dist/robots.txt', 'dist/sitemap.xml'].forEach((out) => console.log('  ' + join(root, out).split(sep).join('/')));
