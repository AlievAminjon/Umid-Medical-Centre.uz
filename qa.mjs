/* ============================================================
   QA: прогоняем все маршруты на всех шести языках в jsdom
   ============================================================ */
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';

const html = readFileSync(new URL('./dist/index.html', import.meta.url), 'utf8');
const LANGS = ['ru', 'uz', 'en', 'es', 'fr', 'de'];
const SERVICES = ['therapy', 'implantation', 'prosthetics', 'orthodontics', 'pediatric', 'hygiene', 'surgery', 'whitening'];
const PAGES = ['', 'about', 'services', 'prices', 'doctors', 'reviews', 'patients', 'contacts', 'privacy', 'terms'];

const errors = [];
const vc = new VirtualConsole();
/* jsdom не реализует scrollTo/matchMedia — это ограничение среды, не сайта */
vc.on('jsdomError', (e) => { if (!/Not implemented/.test(e.message)) errors.push('jsdomError: ' + e.message); });
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));
vc.on('warn', (...a) => { if (/i18n/.test(a.join(' '))) errors.push('i18n: ' + a.join(' ')); });

/* jsdom не реализует matchMedia — подставляем минимальный полифил */
const shim = `window.matchMedia = window.matchMedia || function(q){return{matches:false,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}};`;
const dom = new JSDOM(html.replace('<script>', '<script>' + shim), { runScripts: 'dangerously', url: 'https://umid-medical.uz/', virtualConsole: vc, pretendToBeVisual: true });
const { window } = dom;
await new Promise((r) => window.addEventListener('load', r, { once: true }));

const wait = () => new Promise((r) => setTimeout(r, 30));
const stats = [];

async function visit(hash) {
  window.location.hash = hash;
  await wait();
  const doc = window.document;
  const view = doc.getElementById('view');
  const len = view.textContent.trim().length;
  if (len < 300) errors.push(`EMPTY VIEW at ${hash} (${len} chars)`);
  if (!doc.title || doc.title.length < 10) errors.push(`NO TITLE at ${hash}`);
  const desc = doc.querySelector('meta[name="description"]')?.content || '';
  if (desc.length < 40) errors.push(`SHORT DESCRIPTION at ${hash}`);
  if (doc.querySelectorAll('link[rel="alternate"]').length !== 7) errors.push(`HREFLANG COUNT at ${hash}`);
  if (!doc.querySelector('script[data-jsonld]')) errors.push(`NO JSON-LD at ${hash}`);
  /* data-URI логотипа исключаем: base64 даёт ложные срабатывания */
  const bodyHtml = doc.body.innerHTML
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/data:image\/[a-z]+;base64,[A-Za-z0-9+/=]+/g, 'DATAURI');
  if (/undefined|\[object Object\]|NaN|Lorem ipsum/.test(bodyHtml)) {
    const m = bodyHtml.match(/.{60}(undefined|\[object Object\]|NaN|Lorem ipsum).{60}/);
    errors.push(`BAD TOKEN at ${hash}: ${m ? m[0].replace(/\s+/g, ' ') : ''}`);
  }
  doc.querySelectorAll('a[href]').forEach((a) => {
    const h = a.getAttribute('href');
    if (h === '#' || h === '' || h === 'undefined' || /\/undefined/.test(h)) errors.push(`BAD LINK at ${hash}: ${h}`);
  });
  doc.querySelectorAll('img').forEach((img) => {
    if (!img.getAttribute('src')) errors.push(`IMG WITHOUT SRC at ${hash}`);
    if (!img.hasAttribute('alt')) errors.push(`IMG WITHOUT ALT at ${hash}`);
  });
  doc.querySelectorAll('button').forEach((b) => {
    if (!b.textContent.trim() && !b.getAttribute('aria-label')) errors.push(`BUTTON WITHOUT LABEL at ${hash}`);
  });
  stats.push({ hash, chars: len, lang: doc.documentElement.lang, title: doc.title.slice(0, 46) });
  return doc;
}

/* Все страницы на всех языках */
for (const l of LANGS) {
  for (const p of PAGES) await visit(`#/${l}/${p}`);
  for (const s of SERVICES) await visit(`#/${l}/services/${s}`);
  for (let i = 1; i <= 4; i++) await visit(`#/${l}/doctors/doctor-${i}`);
}
/* Несуществующие маршруты → 404 */
await visit('#/ru/nonexistent');
await visit('#/ru/services/unknown-service');

/* --- Интерактив --- */
const doc = await visit('#/ru/');
const click = (el) => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));

/* Модалка записи */
click(doc.querySelector('[data-book]'));
await wait();
if (doc.getElementById('booking').dataset.open !== 'true') errors.push('MODAL DID NOT OPEN');
if (!doc.getElementById('booking-form')) errors.push('NO BOOKING FORM');

/* Валидация: пустая форма не должна отправляться */
const form = doc.getElementById('booking-form');
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await wait();
if (doc.querySelectorAll('#booking-form .field[data-invalid="true"]').length !== 3) errors.push('VALIDATION DID NOT FIRE');

/* Валидная отправка */
form.elements.name.value = 'Тест';
form.elements.phone.value = '+998 90 123 45 67';
form.elements.consent.checked = true;
form.dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true }));
await new Promise((r) => setTimeout(r, 1000));
if (!doc.querySelector('.success')) errors.push('NO SUCCESS STATE');
click(doc.querySelector('.success [data-close-modal]'));
await wait();
if (doc.getElementById('booking').dataset.open !== 'false') errors.push('MODAL DID NOT CLOSE');

/* Аккордеон */
const accBtn = doc.querySelector('.acc__btn');
click(accBtn);
await wait();
if (doc.querySelector('.acc').dataset.open !== 'false') errors.push('ACCORDION TOGGLE FAILED');

/* Смена языка через переключатель */
click(doc.querySelector('.lang__item[data-lang="de"]'));
await wait();
if (!/#\/de\//.test(window.location.hash)) errors.push('LANG SWITCH FAILED: ' + window.location.hash);
if (doc.documentElement.lang !== 'de') errors.push('HTML LANG NOT UPDATED');

/* Фильтр и поиск в прайсе */
await visit('#/ru/prices');
const d2 = window.document;
const search = d2.getElementById('price-search');
search.value = 'кариес';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
await wait();
const visibleRows = [...d2.querySelectorAll('[data-price-row]')].filter((r) => !r.hidden);
if (!visibleRows.length) errors.push('PRICE SEARCH FOUND NOTHING');
if (visibleRows.some((r) => !r.dataset.name.includes('кариес'))) errors.push('PRICE SEARCH WRONG RESULTS');
search.value = '';
search.dispatchEvent(new window.Event('input', { bubbles: true }));
click(d2.querySelector('.pill[data-cat="implant"]'));
await wait();
const blocks = [...d2.querySelectorAll('[data-cat-block]')].filter((b) => !b.hidden);
if (blocks.length !== 1 || blocks[0].dataset.catBlock !== 'implant') errors.push('PRICE FILTER FAILED');

/* Табы «Пациентам» */
await visit('#/ru/patients');
const d3 = window.document;
click(d3.querySelector('.tab[data-tab="faq"]'));
await wait();
if (d3.querySelector('[data-panel="faq"]').hidden) errors.push('TAB SWITCH FAILED');

/* Мобильное меню */
click(d3.querySelector('[data-menu-toggle]'));
await wait();
if (!window.document.body.classList.contains('menu-open')) errors.push('MOBILE MENU DID NOT OPEN');
click(d3.querySelector('[data-menu-toggle]'));
await wait();
if (window.document.body.classList.contains('menu-open')) errors.push('MOBILE MENU DID NOT CLOSE');

/* ---- Отчёт ---- */
console.log(`Проверено маршрутов: ${stats.length}`);
console.log('Средний объём текста на странице:', Math.round(stats.reduce((a, s) => a + s.chars, 0) / stats.length), 'символов');
console.log('Минимальный:', Math.min(...stats.map((s) => s.chars)));
if (errors.length) {
  console.log(`\n❌ ОШИБОК: ${errors.length}`);
  [...new Set(errors)].slice(0, 40).forEach((e) => console.log(' -', e));
  process.exit(1);
} else {
  console.log('\n✅ Все проверки пройдены');
}
