/* ============================================================
   Локальный просмотр dist/ так, как его раздаёт Vercel:
   правила rewrites, trailingSlash и headers берутся из vercel.json,
   /api/<имя> выполняет api/<имя>.js. Без зависимостей.

     npm run dev                       → http://localhost:3000
     PORT=8080 npm run dev
     TELEGRAM_BOT_TOKEN=… TELEGRAM_CHAT_ID=… npm run dev   — с отправкой заявок

   Без переменных Telegram форма записи показывает демо-сценарий
   (функция отвечает 503) — как на Vercel до настройки.
   ============================================================ */
import { createServer } from 'node:http';
import { createReadStream, readFileSync, statSync, existsSync } from 'node:fs';
import { join, extname, normalize, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const config = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
const publicDir = join(root, config.outputDirectory || 'dist');
const PORT = Number(process.env.PORT) || 3000;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4', '.m4v': 'video/mp4', '.webm': 'video/webm',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};

/** Шаблон пути Vercel (/:lang(ru|en)/:path*, /assets/(.*)) → RegExp. Хватает для правил этого проекта. */
function toRegExp(source) {
  let re = '';
  for (let i = 0; i < source.length;) {
    const rest = source.slice(i);
    const param = rest.match(/^\/:(\w+)(\([^)]*\))?([*+?])?/);
    if (param) {
      const [all, , group, mod] = param;
      const part = group ? group.slice(1, -1) : '[^/]+';
      if (mod === '*') re += `(?:/${part}(?:/${part})*)?`;
      else if (mod === '+') re += `/${part}(?:/${part})*`;
      else if (mod === '?') re += `(?:/${part})?`;
      else re += `/(?:${part})`;
      i += all.length;
    } else if (rest.startsWith('(')) {
      const close = rest.indexOf(')');
      re += rest.slice(0, close + 1);
      i += close + 1;
    } else {
      re += source[i].replace(/[.+?^${}|[\]\\]/g, '\\$&');
      i += 1;
    }
  }
  return new RegExp(`^${re}$`);
}

const rewrites = (config.rewrites || []).map((r) => ({ re: toRegExp(r.source), to: r.destination }));
const headerRules = (config.headers || []).map((h) => ({ re: toRegExp(h.source), headers: h.headers }));

/** Файл внутри dist/ (без выхода за его пределы) или null */
function fileFor(pathname) {
  const p = normalize(join(publicDir, decodeURIComponent(pathname)));
  if (!p.startsWith(publicDir + sep) && p !== publicDir) return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return null;
}

function sendFile(req, res, file) {
  const { size } = statSync(file);
  res.setHeader('Content-Type', TYPES[extname(file).toLowerCase()] || 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');
  /* Range нужен браузеру, чтобы проигрывать и перематывать видео */
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : size - 1;
    start = Math.max(0, start); end = Math.min(end, size - 1);
    if (start > end) { res.statusCode = 416; res.setHeader('Content-Range', `bytes */${size}`); return res.end(); }
    res.statusCode = 206;
    res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
    res.setHeader('Content-Length', end - start + 1);
    if (req.method === 'HEAD') return res.end();
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.setHeader('Content-Length', size);
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

async function runFunction(req, res, name) {
  const file = join(root, 'api', name + '.js');
  if (!/^[\w-]+$/.test(name) || !existsSync(file)) { res.statusCode = 404; return res.end('Not Found'); }
  const mod = await import(pathToFileURL(file).href);
  await mod.default(req, res);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    let pathname = url.pathname;
    for (const rule of headerRules) if (rule.re.test(pathname)) rule.headers.forEach((h) => res.setHeader(h.key, h.value));

    /* trailingSlash: false → /ru/ отвечает 308 на /ru, как на Vercel */
    if (config.trailingSlash === false && pathname.length > 1 && pathname.endsWith('/')) {
      res.statusCode = 308;
      res.setHeader('Location', pathname.replace(/\/+$/, '') + url.search);
      return res.end();
    }
    if (pathname.startsWith('/api/')) return await runFunction(req, res, pathname.slice(5));

    /* Как на Vercel: сначала настоящие файлы, потом rewrites */
    let file = fileFor(pathname);
    if (!file) {
      const rule = rewrites.find((r) => r.re.test(pathname));
      if (rule) file = fileFor(rule.to);
    }
    if (!file || !['GET', 'HEAD'].includes(req.method)) {
      res.statusCode = file ? 405 : 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.end(file ? 'Method Not Allowed' : 'Not Found');
    }
    sendFile(req, res, file);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) { res.statusCode = 500; res.end('Internal Server Error'); }
  }
});

server.listen(PORT, () => {
  console.log(`dist/ с правилами vercel.json: http://localhost:${PORT}`);
  console.log(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
    ? 'Заявки с формы уходят в Telegram.'
    : 'TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID не заданы — форма работает в демо-режиме (503).');
});
