/* ============================================================
   QA: прогоняем все маршруты на всех шести языках в jsdom,
   проверяем роутинг (пути, старые хеш-ссылки, file://),
   ленивую загрузку видео, форму записи и функцию api/booking.js
   ============================================================ */
import { readFileSync } from 'node:fs';
import { Readable } from 'node:stream';
import { JSDOM, VirtualConsole } from 'jsdom';
import bookingHandler from './api/booking.js';

const html = readFileSync(new URL('./dist/index.html', import.meta.url), 'utf8');
const sitemap = readFileSync(new URL('./dist/sitemap.xml', import.meta.url), 'utf8');
const robots = readFileSync(new URL('./dist/robots.txt', import.meta.url), 'utf8');
const SITE = 'https://umid-medical.uz';
const LANGS = ['ru', 'uz', 'en', 'es', 'fr', 'de'];

const errors = [];
const fail = (msg) => errors.push(msg);
const wait = (ms = 30) => new Promise((r) => setTimeout(r, ms));

/* ---------- Запуск сайта в jsdom ----------
   jsdom не реализует matchMedia — подставляем минимальный полифил.
   media: { '(prefers-reduced-motion: reduce)': true, ... } — какие запросы «срабатывают». */
async function boot(url, { media = {}, saveData = false, before } = {}) {
  const vc = new VirtualConsole();
  /* jsdom не реализует scrollTo/play/load у видео — это ограничение среды, не сайта */
  vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) fail(`jsdomError at ${url}: ${e.message}`); });
  vc.on('error', (...a) => fail(`console.error at ${url}: ${a.join(' ')}`));
  vc.on('warn', (...a) => { if (/i18n/.test(a.join(' '))) fail('i18n: ' + a.join(' ')); });
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', url, virtualConsole: vc, pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = (q) => ({ matches: !!media[q], media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
      if (saveData) Object.defineProperty(window.navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } });
      if (before) before(window);
    }
  });
  const { window } = dom;
  await new Promise((r) => (window.document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true })));
  await wait();
  return window;
}

/* ---------- Проверки одной страницы ---------- */
const stats = [];

function checkPage(window, label, { expectCanonical, pathMode = true } = {}) {
  const doc = window.document;
  const view = doc.getElementById('view');
  const len = view.textContent.trim().length;
  if (len < 300) fail(`EMPTY VIEW at ${label} (${len} chars)`);
  if (!doc.title || doc.title.length < 10) fail(`NO TITLE at ${label}`);
  const desc = doc.querySelector('meta[name="description"]')?.content || '';
  if (desc.length < 40) fail(`SHORT DESCRIPTION at ${label}`);
  if (!doc.querySelector('script[data-jsonld]')) fail(`NO JSON-LD at ${label}`);

  /* canonical / og:url / hreflang — настоящие пути без «#» и без слеша в конце */
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  if (expectCanonical && canonical !== expectCanonical) fail(`CANONICAL at ${label}: ${canonical} ≠ ${expectCanonical}`);
  const ogUrl = doc.querySelector('meta[property="og:url"]')?.getAttribute('content');
  if (ogUrl !== canonical) fail(`OG:URL at ${label}: ${ogUrl} ≠ ${canonical}`);
  const alts = [...doc.querySelectorAll('link[rel="alternate"]')];
  if (alts.length !== 7) fail(`HREFLANG COUNT at ${label}: ${alts.length}`);
  for (const u of [canonical, ...alts.map((a) => a.getAttribute('href'))]) {
    if (!u.startsWith(SITE + '/') || u.includes('#') || u.endsWith('/')) fail(`BAD SEO URL at ${label}: ${u}`);
  }
  doc.querySelectorAll('script[data-jsonld]').forEach((s) => {
    const data = JSON.parse(s.textContent);
    if (data['@type'] === 'BreadcrumbList') {
      data.itemListElement.forEach((it) => { if (it.item.includes('#') || it.item.endsWith('/')) fail(`BAD BREADCRUMB at ${label}: ${it.item}`); });
    }
  });

  /* data-URI логотипа исключаем: base64 даёт ложные срабатывания */
  const bodyHtml = doc.body.innerHTML
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, 'DATAURI');
  if (/undefined|\[object Object\]|NaN|Lorem ipsum/.test(bodyHtml)) {
    const m = bodyHtml.match(/.{60}(undefined|\[object Object\]|NaN|Lorem ipsum).{60}/);
    fail(`BAD TOKEN at ${label}: ${m ? m[0].replace(/\s+/g, ' ') : ''}`);
  }
  doc.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (h === '#' || h === '' || h === 'undefined' || /\/undefined/.test(h)) fail(`BAD LINK at ${label}: ${h}`);
    /* Внутренние ссылки: в режиме путей — /ru/..., в хеш-режиме — #/ru/... */
    if (pathMode && h.startsWith('#/')) fail(`HASH LINK IN PATH MODE at ${label}: ${h}`);
    if (!pathMode && /^\/(ru|uz|en|es|fr|de)\b/.test(h)) fail(`PATH LINK IN HASH MODE at ${label}: ${h}`);
    if (/^\/(ru|uz|en|es|fr|de)\/.*\/$/.test(h)) fail(`TRAILING SLASH LINK at ${label}: ${h}`);
  });
  doc.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('src')) fail(`IMG WITHOUT SRC at ${label}`);
    if (!img.hasAttribute('alt')) fail(`IMG WITHOUT ALT at ${label}`);
  });
  doc.querySelectorAll('button').forEach((b) => {
    if (!b.textContent.trim() && !b.getAttribute('aria-label')) fail(`BUTTON WITHOUT LABEL at ${label}`);
  });
  stats.push({ label, chars: len, lang: doc.documentElement.lang, title: doc.title.slice(0, 46) });
  return doc;
}

/** Переход внутри приложения: так же, как кнопки «назад/вперёд» браузера */
async function go(window, path) {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new window.PopStateEvent('popstate'));
  await wait();
  return window.document;
}

const click = (window, el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

/* ============================================================
   1. sitemap.xml и robots.txt
   ============================================================ */
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (locs.length !== 132) fail(`SITEMAP: ожидалось 132 адреса (22 страницы × 6 языков), найдено ${locs.length}`);
if (new Set(locs).size !== locs.length) fail('SITEMAP: повторяющиеся адреса');
if ((sitemap.match(/<xhtml:link /g) || []).length !== locs.length * 7) fail('SITEMAP: у каждого адреса должно быть 7 hreflang');
for (const l of locs) if (!l.startsWith(SITE + '/') || l.endsWith('/') || l.includes('#')) fail(`SITEMAP: плохой адрес ${l}`);
if (!/Sitemap: https:\/\/umid-medical\.uz\/sitemap\.xml/.test(robots)) fail('ROBOTS: нет ссылки на sitemap');
if (!/Disallow: \/api\//.test(robots)) fail('ROBOTS: /api/ не закрыт');

/* ============================================================
   2. Все страницы × все языки: путь → страница, canonical = адрес из sitemap
   ============================================================ */
const win = await boot(SITE + '/ru');
if (win.location.pathname !== '/ru') fail(`BOOT /ru → ${win.location.pathname}`);
for (const loc of locs) {
  const path = loc.slice(SITE.length);
  const doc = await go(win, path);
  checkPage(win, path, { expectCanonical: loc });
  const lang = path.split('/')[1];
  if (doc.documentElement.lang !== lang) fail(`HTML LANG at ${path}: ${doc.documentElement.lang}`);
}

/* Несуществующие маршруты → страница 404 с noindex */
for (const path of ['/ru/nonexistent', '/ru/services/unknown-service', '/ru/about/extra', '/en/doctors/doctor-1/x']) {
  const doc = await go(win, path);
  checkPage(win, path, { expectCanonical: SITE + path });
  if (!/noindex/.test(doc.querySelector('meta[name="robots"]')?.content || '')) fail(`404 WITHOUT NOINDEX at ${path}`);
}

/* ============================================================
   3. Навигация в режиме путей: клик по ссылке, язык, «назад»
   ============================================================ */
{
  let doc = await go(win, '/ru');
  click(win, doc.querySelector('.nav__link[href="/ru/prices"]') || doc.querySelector('a[href="/ru/prices"]'));
  await wait();
  if (win.location.pathname !== '/ru/prices') fail(`LINK CLICK: ожидался /ru/prices, получили ${win.location.pathname}`);
  if (!win.document.getElementById('price-search')) fail('LINK CLICK: страница цен не отрисовалась');

  win.history.back();
  await wait(80);
  if (win.location.pathname !== '/ru') fail(`HISTORY BACK: ожидался /ru, получили ${win.location.pathname}`);
  if (win.document.getElementById('price-search')) fail('HISTORY BACK: осталась страница цен');

  /* Якорь «к содержимому» не должен ломать маршрут */
  doc = await go(win, '/ru/about');
  win.location.hash = '#view';
  await wait();
  if (win.location.pathname !== '/ru/about' || !win.document.querySelector('link[rel="canonical"]').href.endsWith('/ru/about')) fail('SKIP LINK #view сломал маршрут');
}

/* ============================================================
   4. Прямые заходы по адресу (как после rewrites на Vercel)
   ============================================================ */
{
  const w = await boot(SITE + '/de/services/therapy');
  checkPage(w, 'deep /de/services/therapy', { expectCanonical: SITE + '/de/services/therapy' });
  if (w.document.documentElement.lang !== 'de') fail('DEEP LINK: язык не de');
  w.close();
}
{
  /* Корень сайта → путь с языком (язык браузера jsdom — en) */
  const w = await boot(SITE + '/');
  if (!/^\/(ru|uz|en|es|fr|de)$/.test(w.location.pathname)) fail(`ROOT: ожидался /<язык>, получили ${w.location.pathname}`);
  w.close();
}
{
  const w = await boot(SITE + '/index.html');
  if (!/^\/(ru|uz|en|es|fr|de)$/.test(w.location.pathname)) fail(`/index.html: ожидался /<язык>, получили ${w.location.pathname}`);
  w.close();
}

/* ============================================================
   5. Старые хеш-ссылки /#/ru/... → путь
   ============================================================ */
for (const [from, to] of [['/#/en/prices', '/en/prices'], ['/#/fr/', '/fr'], ['/#/uz/services/therapy', '/uz/services/therapy'], ['/#/de/doctors/doctor-2/', '/de/doctors/doctor-2']]) {
  const w = await boot(SITE + from);
  if (w.location.pathname !== to || w.location.hash !== '') fail(`LEGACY ${from}: получили ${w.location.pathname}${w.location.hash}, ожидался ${to}`);
  checkPage(w, 'legacy ' + from, { expectCanonical: SITE + to });
  w.close();
}
{
  /* Старую ссылку вставили в адресную строку на уже открытом сайте */
  win.location.hash = '#/es/contacts';
  await wait(60);
  if (win.location.pathname !== '/es/contacts' || win.location.hash) fail(`LEGACY HASHCHANGE: ${win.location.pathname}${win.location.hash}`);
}

/* ============================================================
   6. Хеш-режим при открытии файла с диска (file://)
   ============================================================ */
{
  const w = await boot('file:///tmp/umid/index.html#/fr/contacts');
  if (w.location.hash !== '#/fr/contacts') fail(`FILE MODE: адрес изменился на ${w.location.href}`);
  checkPage(w, 'file #/fr/contacts', { expectCanonical: SITE + '/fr/contacts', pathMode: false });
  const link = w.document.querySelector('.nav__link');
  if (!link || !link.getAttribute('href').startsWith('#/fr')) fail(`FILE MODE: ссылки не хешевые (${link && link.getAttribute('href')})`);
  w.location.hash = '#/fr/prices';
  await wait();
  if (!w.document.getElementById('price-search')) fail('FILE MODE: переход по хешу не сработал');
  /* Якорь «к содержимому» в хеш-режиме не уводит со страницы */
  w.location.hash = '#view';
  await wait();
  if (!w.document.getElementById('price-search')) fail('FILE MODE: якорь #view сменил страницу');
  w.location.hash = '#/fr/';
  await wait(260);
  const v = w.document.querySelector('[data-vslot="0"]');
  if (v && v.getAttribute('src') && !/^assets\/videos\//.test(v.getAttribute('src'))) fail(`FILE MODE: путь к видео ${v.getAttribute('src')} должен быть относительным`);
  w.close();
}

{
  /* Файл открыт сразу с якорем — показываем главную, а не пустую страницу */
  const w = await boot('file:///tmp/umid/index.html#view');
  await wait(60);
  if (!/^#\/(ru|uz|en|es|fr|de)$/.test(w.location.hash)) fail(`FILE MODE #view: адрес ${w.location.hash}`);
  checkPage(w, 'file #view', { pathMode: false });
  w.close();
}

/* ============================================================
   7. Видео первого экрана: постер сразу, файл — после загрузки страницы
   ============================================================ */
{
  /* Сначала — сразу после отрисовки главной: у <video> ещё нет src */
  const doc = await go(win, '/ru');
  const v0 = doc.querySelector('[data-vslot="0"]');
  if (v0) {
    if (v0.getAttribute('src')) fail('VIDEO: src подключён сразу при отрисовке, а должен — позже');
    if (v0.getAttribute('preload') !== 'none') fail('VIDEO: preload должен быть none до подключения');
    if (!v0.getAttribute('poster')) fail('VIDEO: нет постера');
    await wait(300);
    const src = v0.getAttribute('src') || '';
    if (!/^\/assets\/videos\/video-1\.[0-9a-f]{8}\.mp4$/.test(src)) fail(`VIDEO: ожидался путь от корня /assets/videos/video-1.<хеш>.mp4, получили "${src}"`);
  } else fail('VIDEO: на главной нет проигрывателя');

  /* Телефон → облегчённая версия */
  const wm = await boot(SITE + '/ru', { media: { '(max-width: 767px)': true } });
  await wait(300);
  const vm = wm.document.querySelector('[data-vslot="0"]')?.getAttribute('src') || '';
  if (!/^\/assets\/videos\/video-1\.mobile\.[0-9a-f]{8}\.mp4$/.test(vm)) fail(`VIDEO MOBILE: получили "${vm}"`);
  wm.close();

  /* prefers-reduced-motion и Save-Data → только постер */
  for (const [label, opts] of [['reduced-motion', { media: { '(prefers-reduced-motion: reduce)': true } }], ['save-data', { saveData: true }]]) {
    const w = await boot(SITE + '/ru', opts);
    await wait(300);
    const v = w.document.querySelector('[data-vslot="0"]');
    if (!v || v.getAttribute('src')) fail(`VIDEO ${label}: ролик подключён, а должен остаться постер`);
    /* Явное нажатие Play всё-таки запускает ролик */
    click(w, w.document.querySelector('[data-video-toggle]'));
    await wait();
    if (!v || !v.getAttribute('src')) fail(`VIDEO ${label}: Play не подключил ролик`);
    w.close();
  }
}

/* ============================================================
   8. Форма записи
   ============================================================ */
const sent = [];
let fetchMode = 'unconfigured';
win.fetch = async (url, init) => {
  sent.push({ url, body: JSON.parse(init.body) });
  if (fetchMode === 'network') throw new TypeError('Failed to fetch');
  const status = fetchMode === 'ok' ? 200 : 503;
  return { ok: status === 200, status, json: async () => ({ ok: status === 200 }) };
};

async function submitValid(doc, form) {
  form.elements.name.value = 'Тест';
  form.elements.phone.value = '+998 90 123 45 67';
  form.elements.consent.checked = true;
  form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  await wait(120);
}

{
  let doc = await go(win, '/ru');
  click(win, doc.querySelector('[data-book]'));
  await wait();
  if (doc.getElementById('booking').dataset.open !== 'true') fail('MODAL DID NOT OPEN');
  const form = doc.getElementById('booking-form');
  if (!form) fail('NO BOOKING FORM');
  if (!form.elements.website) fail('NO HONEYPOT FIELD');

  /* Валидация: пустая форма не должна отправляться */
  form.dispatchEvent(new win.Event('submit', { bubbles: true, cancelable: true }));
  await wait();
  if (doc.querySelectorAll('#booking-form .field[data-invalid="true"]').length !== 3) fail('VALIDATION DID NOT FIRE');
  if (sent.length) fail('INVALID FORM WAS SENT');

  /* 503 (функция не настроена) → демо-сценарий */
  await submitValid(doc, form);
  const req = sent[0];
  if (!req || req.url !== '/api/booking') fail(`BOOKING: запрос ушёл не на /api/booking (${req && req.url})`);
  if (req && (req.body.name !== 'Тест' || req.body.consent !== true || req.body.website !== '' || req.body.lang !== 'ru')) fail('BOOKING: неверное тело запроса ' + JSON.stringify(req && req.body));
  if (!doc.querySelector('.success')) fail('NO SUCCESS STATE (503)');
  if (!doc.querySelector('.success [data-demo-note]')) fail('BOOKING 503: нет пометки о демо-режиме');
  click(win, doc.querySelector('.success [data-close-modal]'));
  await wait();
  if (doc.getElementById('booking').dataset.open !== 'false') fail('MODAL DID NOT CLOSE');

  /* 200 → обычный экран успеха, без демо-пометки */
  fetchMode = 'ok';
  click(win, doc.querySelector('[data-book]'));
  await wait();
  await submitValid(doc, doc.getElementById('booking-form'));
  if (!doc.querySelector('.success') || doc.querySelector('.success [data-demo-note]')) fail('BOOKING 200: должен быть успех без демо-пометки');
  click(win, doc.querySelector('.success [data-close-modal]'));
  await wait();

  /* Сеть недоступна → демо-сценарий; встроенная форма на странице «Контакты» */
  fetchMode = 'network';
  doc = await go(win, '/ru/contacts');
  const inline = doc.querySelector('.bookcard form[data-booking-form]');
  if (inline) {
    await submitValid(doc, inline);
    if (!doc.querySelector('.bookcard .success [data-demo-note]')) fail('BOOKING NETWORK ERROR: нет демо-сценария во встроенной форме');
  } else fail('NO INLINE BOOKING FORM on /ru/contacts');

  let stored = null;
  try { stored = win.localStorage.getItem('umid.requests'); } catch { /* нет хранилища */ }
  if (stored !== null) fail('BOOKING: заявки снова сохраняются в localStorage');
}
{
  /* Старые заявки, оставшиеся от прошлой версии, удаляются при загрузке */
  const w = await boot(SITE + '/ru', { before: (window) => window.localStorage.setItem('umid.requests', '[{"name":"x","phone":"1"}]') });
  if (w.localStorage.getItem('umid.requests') !== null) fail('BOOKING: старые заявки не удалены из localStorage');
  w.close();
}

/* ============================================================
   9. Остальной интерактив
   ============================================================ */
{
  const doc = await go(win, '/ru');
  /* Аккордеон */
  click(win, doc.querySelector('.acc__btn'));
  await wait();
  if (doc.querySelector('.acc').dataset.open !== 'false') fail('ACCORDION TOGGLE FAILED');

  /* Смена языка через переключатель */
  click(win, doc.querySelector('.lang__item[data-lang="de"]'));
  await wait();
  if (win.location.pathname !== '/de') fail('LANG SWITCH FAILED: ' + win.location.pathname);
  if (win.document.documentElement.lang !== 'de') fail('HTML LANG NOT UPDATED');

  /* Фильтр и поиск в прайсе */
  const d2 = await go(win, '/ru/prices');
  const search = d2.getElementById('price-search');
  search.value = 'кариес';
  search.dispatchEvent(new win.Event('input', { bubbles: true }));
  await wait();
  const visibleRows = [...d2.querySelectorAll('[data-price-row]')].filter((r) => !r.hidden);
  if (!visibleRows.length) fail('PRICE SEARCH FOUND NOTHING');
  if (visibleRows.some((r) => !r.dataset.name.includes('кариес'))) fail('PRICE SEARCH WRONG RESULTS');
  search.value = '';
  search.dispatchEvent(new win.Event('input', { bubbles: true }));
  click(win, d2.querySelector('.pill[data-cat="implant"]'));
  await wait();
  const blocks = [...d2.querySelectorAll('[data-cat-block]')].filter((b) => !b.hidden);
  if (blocks.length !== 1 || blocks[0].dataset.catBlock !== 'implant') fail('PRICE FILTER FAILED');

  /* Табы «Пациентам» */
  const d3 = await go(win, '/ru/patients');
  click(win, d3.querySelector('.tab[data-tab="faq"]'));
  await wait();
  if (d3.querySelector('[data-panel="faq"]').hidden) fail('TAB SWITCH FAILED');

  /* Мобильное меню */
  click(win, d3.querySelector('[data-menu-toggle]'));
  await wait();
  if (!win.document.body.classList.contains('menu-open')) fail('MOBILE MENU DID NOT OPEN');
  click(win, d3.querySelector('[data-menu-toggle]'));
  await wait();
  if (win.document.body.classList.contains('menu-open')) fail('MOBILE MENU DID NOT CLOSE');
}
win.close();

/* ============================================================
   10. Функция api/booking.js (без сети: fetch подменяется)
   ============================================================ */
function fakeReq({ method = 'POST', body, headers = {} } = {}) {
  const raw = body === undefined ? '' : (typeof body === 'string' ? body : JSON.stringify(body));
  const req = Readable.from(raw ? [Buffer.from(raw)] : []);
  req.method = method;
  req.headers = { host: 'umid-medical.uz', 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(raw)), ...headers };
  return req;
}
function fakeRes() {
  const res = { statusCode: 200, headers: {}, body: '' };
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.end = (b) => { res.body = b || ''; };
  return res;
}
async function call(opts) {
  const res = fakeRes();
  await bookingHandler(fakeReq(opts), res);
  let json = null;
  try { json = JSON.parse(res.body); } catch { /* не JSON */ }
  return { status: res.statusCode, json, headers: res.headers };
}

{
  const valid = { name: 'Тест <b>Пациент</b>', phone: '+998 90 123 45 67', service: 'therapy', date: '2026-12-01', time: 'morning', comment: 'Болит зуб & <script>', consent: true, website: '', lang: 'ru' };
  const realFetch = globalThis.fetch;
  const tg = [];
  let tgOk = true;
  globalThis.fetch = async (url, init) => {
    tg.push({ url, body: JSON.parse(init.body) });
    return { ok: tgOk, status: tgOk ? 200 : 400, json: async () => (tgOk ? { ok: true } : { ok: false, description: 'Bad Request: chat not found' }) };
  };
  const quiet = console.error;
  console.error = () => {};
  try {
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
    let r = await call({ body: valid });
    if (r.status !== 503) fail(`API без переменных: ожидался 503, получили ${r.status}`);
    r = await call({ method: 'GET' });
    if (r.status !== 405 || r.headers.allow !== 'POST') fail(`API GET: ожидался 405, получили ${r.status}`);

    process.env.TELEGRAM_BOT_TOKEN = 'test-token';
    process.env.TELEGRAM_CHAT_ID = '-100123';

    r = await call({ body: valid });
    if (r.status !== 200 || !r.json?.ok) fail(`API valid: ожидался 200, получили ${r.status} ${JSON.stringify(r.json)}`);
    const msg = tg[0];
    if (!msg || msg.url !== 'https://api.telegram.org/bottest-token/sendMessage' || msg.body.chat_id !== '-100123') fail('API: неверный запрос в Telegram');
    if (msg && (/<script>|<b>Пациент/.test(msg.body.text) || !/Терапия/.test(msg.body.text) || !/&lt;script&gt;/.test(msg.body.text))) fail('API: текст сообщения не экранирован или без услуги: ' + (msg && msg.body.text));
    if (r.headers['cache-control'] !== 'no-store') fail('API: нет Cache-Control: no-store');

    /* Тело уже разобрано (так делает Vercel) */
    const res = fakeRes();
    const pre = fakeReq({ body: valid });
    pre.body = valid;
    await bookingHandler(pre, res);
    if (res.statusCode !== 200) fail(`API с req.body: ожидался 200, получили ${res.statusCode}`);

    const before = tg.length;
    r = await call({ body: { ...valid, website: 'http://spam.example' } });
    if (r.status !== 200 || tg.length !== before) fail('API honeypot: бот не должен доходить до Telegram');

    r = await call({ body: { ...valid, name: 'A', phone: 'abc', service: 'magic', date: '2026-02-30', time: 'noon', consent: false } });
    if (r.status !== 400 || ['name', 'phone', 'service', 'date', 'time', 'consent'].some((f) => !r.json?.fields?.includes(f))) fail(`API invalid: ${r.status} ${JSON.stringify(r.json)}`);
    r = await call({ body: { ...valid, comment: 'x'.repeat(1001) } });
    if (r.status !== 400) fail(`API длинный комментарий: ожидался 400, получили ${r.status}`);
    r = await call({ body: '{not json' });
    if (r.status !== 400) fail(`API битый JSON: ожидался 400, получили ${r.status}`);
    r = await call({ body: valid, headers: { 'content-type': 'text/plain' } });
    if (r.status !== 415) fail(`API text/plain: ожидался 415, получили ${r.status}`);
    r = await call({ body: { ...valid, comment: 'x'.repeat(9000) } });
    if (r.status !== 413) fail(`API большое тело: ожидался 413, получили ${r.status}`);
    r = await call({ body: valid, headers: { origin: 'https://evil.example' } });
    if (r.status !== 403) fail(`API чужой Origin: ожидался 403, получили ${r.status}`);
    r = await call({ body: valid, headers: { origin: 'https://umid-medical.uz' } });
    if (r.status !== 200) fail(`API свой Origin: ожидался 200, получили ${r.status}`);

    tgOk = false;
    r = await call({ body: valid });
    if (r.status !== 502) fail(`API Telegram недоступен: ожидался 502, получили ${r.status}`);
  } finally {
    globalThis.fetch = realFetch;
    console.error = quiet;
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_CHAT_ID;
  }
}

/* ---- Отчёт ---- */
console.log(`Проверено маршрутов: ${stats.length} (из sitemap.xml: ${locs.length})`);
console.log('Средний объём текста на странице:', Math.round(stats.reduce((a, s) => a + s.chars, 0) / stats.length), 'символов');
console.log('Минимальный:', Math.min(...stats.map((s) => s.chars)));
if (errors.length) {
  console.log(`\n❌ ОШИБОК: ${errors.length}`);
  [...new Set(errors)].slice(0, 40).forEach((e) => console.log(' -', e));
  process.exit(1);
} else {
  console.log('\n✅ Все проверки пройдены');
}
