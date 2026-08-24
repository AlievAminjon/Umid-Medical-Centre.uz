/* ============================================================
   Сборка: модули + стили + логотипы → dist/index.html (один файл)
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, copyFileSync, statSync } from 'node:fs';
import { join, dirname, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

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
   попадает только манифест с относительными путями и постерами.
   ============================================================ */
const VIDEO_DIR = 'src/assets/videos';
const VIDEO_OUT = 'assets/videos';                 /* относительно каждого HTML */
const VIDEO_EXT = /\.(mp4|webm|m4v)$/i;
const POSTER_EXT = /\.(png|jpe?g|webp|avif)$/i;
const VIDEO_MIME = { '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm' };
const POSTER_MAX_WIDTH = 900;
const VIDEO_WARN_SIZE = 24 * 1024 * 1024;

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
  const clips = files.filter((f) => VIDEO_EXT.test(f)).sort();
  const list = [];
  const report = [];
  for (const file of clips) {
    const key = file.replace(VIDEO_EXT, '');
    const size = statSync(join(dir, file)).size;
    const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
    list.push({
      key,
      file,
      src: `${VIDEO_OUT}/${file}`,
      type: VIDEO_MIME[ext] || 'video/mp4',
      poster: await posterFor(dir, files, key)
    });
    report.push(`  video ${key}: ${kb(size)}${size > VIDEO_WARN_SIZE ? '  ← тяжёлый файл, стоит пережать' : ''}`);
  }
  if (!clips.length) report.push('  videos: пока нет — положите mp4 в ' + VIDEO_DIR);
  return { list, report };
}

/** Копируем ролики рядом с каждой копией сайта — иначе они не проиграются. */
function copyVideos(videos, outputs) {
  if (!videos.length) return [];
  const done = [];
  const dirs = [...new Set(outputs.map((out) => join(dirname(resolve(root, out)), VIDEO_OUT)))];
  for (const outDir of dirs) {
    mkdirSync(outDir, { recursive: true });
    let copied = 0;
    for (const v of videos) {
      const from = join(root, VIDEO_DIR, v.file);
      const to = join(outDir, v.file);
      const src = statSync(from);
      /* Не переписываем файл, если он уже такой же — сборка остаётся быстрой */
      if (existsSync(to)) {
        const dst = statSync(to);
        if (dst.size === src.size && dst.mtimeMs >= src.mtimeMs) continue;
      }
      copyFileSync(from, to);
      copied++;
    }
    done.push(`  videos → ${outDir.split(sep).join('/')} (${copied ? copied + ' обновлено' : 'без изменений'})`);
  }
  return done;
}

/* ---- Сборка ---- */
const photos = await collectPhotos();
const videos = await collectVideos();
const videoEntries = videos.list
  .map((v) => `{key:${JSON.stringify(v.key)},src:${JSON.stringify(v.src)},type:${JSON.stringify(v.type)},poster:${JSON.stringify(v.poster)}}`)
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
   Копий сайта три, и они должны быть одинаковыми. Иначе легко
   пересобрать проект и открыть старый файл, не увидев изменений. */
const OUTPUTS = [
  'dist/index.html',                 /* результат сборки */
  'index.html',                      /* рядом с исходниками, чтобы открыть двойным кликом */
  '../../umid-website.html'          /* копия в корне проекта */
];

mkdirSync(join(root, 'dist'), { recursive: true });
for (const out of OUTPUTS) writeFileSync(join(root, out), html, 'utf8');
const videoLog = copyVideos(videos.list, OUTPUTS);

console.log('Собрано:', kb(Buffer.byteLength(html)));
console.log('  css:', kb(Buffer.byteLength(css)), '| js:', kb(Buffer.byteLength(bundle)), '| logos:', kb(LOGO_MARK.length + LOGO_FULL.length));
photos.report.forEach((l) => console.log(l));
if (!photos.report.length) console.log('  photos: пока нет — положите файлы в', PHOTO_DIR);
videos.report.forEach((l) => console.log(l));
videoLog.forEach((l) => console.log(l));
console.log('Обновлены файлы:');
OUTPUTS.forEach((out) => console.log('  ' + join(root, out).split(sep).join('/')));
