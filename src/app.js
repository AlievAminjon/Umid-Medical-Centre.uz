/* ============================================================
   UMID Medical Centre — точка входа
   ============================================================ */
import { $, $$, on, state, detectLang, isLang, parseRoute, usePaths, toHref, hrefLang, applySeo, safeSet, safeRemove } from './lib/core.js';
import { runPageMotion, initScrollState, hideLoader, prefersReducedMotion } from './lib/motion.js';
import { header, mobileMenu, footer, bottomBar, floaters } from './components/layout.js';
import { bookingModal, bookingForm, validate, submitBooking, successView } from './components/booking.js';
import { bookingCardInner } from './sections/booking-panel.js';
import { initHeroVideo } from './sections/hero.js';

import homePage from './pages/home.js';
import aboutPage from './pages/about.js';
import { servicesPage, servicePage } from './pages/services.js';
import pricesPage from './pages/prices.js';
import { doctorsPage, doctorPage } from './pages/doctors.js';
import reviewsPage from './pages/reviews.js';
import patientsPage from './pages/patients.js';
import contactsPage from './pages/contacts.js';
import { legalPage, notFoundPage } from './pages/legal.js';

/* ---------------- Рендер страницы ---------------- */
function renderView(route) {
  switch (route.page) {
    case 'home': return homePage();
    case 'about': return aboutPage();
    case 'services': return route.slug ? servicePage(route.slug) : servicesPage();
    case 'prices': return pricesPage();
    case 'doctors': return route.slug ? doctorPage(route.slug) : doctorsPage();
    case 'reviews': return reviewsPage();
    case 'patients': return patientsPage();
    case 'contacts': return contactsPage();
    case 'privacy': return legalPage('privacy');
    case 'terms': return legalPage('terms');
    default: return notFoundPage();
  }
}

let painted = false;

function paint(route, opts = {}) {
  painted = true;
  state.route = route;
  $('#header-slot').innerHTML = header(route);
  $('#mmenu-slot').innerHTML = mobileMenu(route);
  $('#view').innerHTML = renderView(route);
  $('#footer-slot').innerHTML = footer();
  $('#bottom-slot').innerHTML = bottomBar();
  $('#float-slot').innerHTML = floaters();
  applySeo(route);
  syncAccordions();
  runPageMotion();
  initHeroVideo();
  closeMenu();
  if (!opts.keepScroll) window.scrollTo({ top: 0, behavior: 'auto' });
}

/**
 * Мягкий переход между страницами.
 * Там, где браузер умеет View Transitions, — плавное перекрытие;
 * везде остальное отрисовка синхронная, поведение не меняется.
 */
function render(route, opts = {}) {
  const vt = document.startViewTransition;
  if (typeof vt === 'function' && !prefersReducedMotion()) {
    try { vt.call(document, () => paint(route, opts)); return; }
    catch { /* если что-то пошло не так — рисуем обычным способом */ }
  }
  paint(route, opts);
}

/* ---------------- Роутинг ----------------
   По http(s): адрес — путь (/ru/services), переходы через History API.
   С диска (file://): адрес — хеш (#/ru/services), как раньше.
   Правила выбора режима — usePaths() в lib/core.js. */
const currentAddress = () => (usePaths() ? location.pathname : location.hash);

/** Хеш вида #/ru/services — маршрут. Хеш вида #view — обычный якорь. */
const isRouteHash = (h) => /^#\//.test(h);

/**
 * Старые ссылки /#/ru/services (сайт раньше работал только на хешах)
 * переводим на путь /ru/services. Сервер хеш не видит, поэтому это
 * делается здесь, через replaceState — без лишней записи в истории.
 */
function upgradeLegacyHash() {
  if (!usePaths() || !isRouteHash(location.hash)) return false;
  const parts = location.hash.slice(1).split(/[?#]/)[0].split('/').filter(Boolean);
  history.replaceState(null, '', '/' + parts.join('/') + location.search);
  return true;
}

function route() {
  upgradeLegacyHash();
  /* В хеш-режиме якорь вроде #view (ссылка «к содержимому») — не маршрут:
     страницу не трогаем, а если открыли сразу с ним — показываем главную. */
  const anchorOnly = !usePaths() && location.hash && !isRouteHash(location.hash);
  if (anchorOnly && painted) return;
  const parsed = parseRoute(anchorOnly ? '' : currentAddress());
  /* Язык всегда присутствует в адресе — так ссылкой можно поделиться. */
  if (!parsed.lang) {
    const lang = detectLang();
    state.lang = lang;
    const target = `/${lang}${parsed.rest ? '/' + parsed.rest : ''}`;
    if (usePaths()) history.replaceState(null, '', target + location.search);
    else { location.replace(toHref(target)); return; }
    route();
    return;
  }
  if (parsed.lang !== state.lang) {
    state.lang = parsed.lang;
    safeSet('umid.lang', parsed.lang);
  }
  render({ page: parsed.page, slug: parsed.slug, rest: parsed.rest });
}

/** Переход на адрес из href(): путь в режиме History API, хеш — иначе. */
function navigate(url) {
  if (!usePaths()) { location.hash = url.replace(/^#/, ''); return; }
  if (url === location.pathname) { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
  history.pushState(null, '', url);
  route();
}

/** Клики по внутренним ссылкам (/ru/...) обрабатываем без перезагрузки страницы. */
function interceptLinks(e) {
  if (!usePaths() || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = e.target.closest && e.target.closest('a[href]');
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
  const url = a.getAttribute('href');
  if (!/^\/(?!\/)/.test(url) || !parseRoute(url).lang) return;
  e.preventDefault();
  navigate(url.split('#')[0]);
}

/* ---------------- Мобильное меню ---------------- */
function openMenu() {
  document.body.classList.add('menu-open', 'is-locked');
  const btn = $('[data-menu-toggle]'); if (btn) btn.setAttribute('aria-expanded', 'true');
  const m = $('#mmenu'); if (m) m.setAttribute('aria-hidden', 'false');
}
function closeMenu() {
  document.body.classList.remove('menu-open');
  if (!isModalOpen()) document.body.classList.remove('is-locked');
  const btn = $('[data-menu-toggle]'); if (btn) btn.setAttribute('aria-expanded', 'false');
  const m = $('#mmenu'); if (m) m.setAttribute('aria-hidden', 'true');
}

/* ---------------- Модальное окно записи ---------------- */
let lastFocused = null;
const isModalOpen = () => $('#booking')?.dataset.open === 'true';

function openBooking(service = '') {
  const modal = $('#booking');
  lastFocused = document.activeElement;
  $('#booking-content').innerHTML = bookingForm(service);
  modal.dataset.open = 'true';
  document.body.classList.add('is-locked');
  closeMenu();
  setTimeout(() => $('#bf-name')?.focus(), 60);
}

function closeBooking() {
  const modal = $('#booking');
  if (!modal || modal.dataset.open !== 'true') return;
  modal.dataset.open = 'false';
  document.body.classList.remove('is-locked');
  if (lastFocused && lastFocused.focus) lastFocused.focus();
}

function trapFocus(e) {
  if (!isModalOpen() || e.key !== 'Tab') return;
  const box = $('#booking .modal__box');
  const f = $$('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])', box)
    .filter((el) => el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------------- Отправка заявки ----------------
   Одна и та же логика для модального окна и встроенной секции. */
async function handleSubmit(e, form) {
  e.preventDefault();
  if (!validate(form)) {
    form.querySelector('[data-invalid="true"] input, [data-invalid="true"] select')?.focus();
    return;
  }
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.classList.add('btn--loading');
  const f = form.elements;
  const data = {
    name: f.name.value.trim(),
    phone: f.phone.value.trim(),
    service: f.service.value,
    date: f.date.value,
    time: f.time.value,
    comment: f.comment.value.trim(),
    consent: f.consent.checked,
    website: f.website ? f.website.value : '',   /* ловушка для ботов, у людей пустая */
    lang: state.lang
  };
  const inline = form.id !== 'booking-form';
  /* Не доставили (функция не настроена или недоступна) — показываем
     демо-сценарий: экран успеха с просьбой продублировать заявку в мессенджер. */
  const { delivered } = await submitBooking(data);
  if (inline) {
    const card = form.closest('.bookcard');
    if (card) card.innerHTML = successView(data, { inline: true, delivered });
  } else {
    $('#booking-content').innerHTML = successView(data, { delivered });
    $('#booking .modal__box').scrollTop = 0;
  }
}

/* ---------------- Аккордеон ---------------- */
/** Блоки, открытые по умолчанию, получают реальную высоту панели. */
function syncAccordions() {
  $$('[data-acc][data-open="true"] .acc__panel').forEach((panel) => {
    panel.style.maxHeight = panel.scrollHeight + 'px';
  });
}

function toggleAcc(el) {
  const acc = el.closest('[data-acc]');
  const open = acc.dataset.open === 'true';
  acc.dataset.open = open ? 'false' : 'true';
  acc.querySelector('.acc__btn').setAttribute('aria-expanded', open ? 'false' : 'true');
  const panel = acc.querySelector('.acc__panel');
  panel.style.maxHeight = open ? '0px' : panel.scrollHeight + 'px';
}

/* ---------------- Табы ---------------- */
function selectTab(btn) {
  const id = btn.dataset.tab;
  $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
  $$('#patients-panels [data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== id; });
  runPageMotion($('#patients-panels'));
}

/* ---------------- Фильтр прайса ---------------- */
function filterPrices() {
  const q = ($('#price-search')?.value || '').trim().toLowerCase();
  const cat = $('.pill[aria-pressed="true"]')?.dataset.cat || 'all';
  let visible = 0;
  $$('[data-cat-block]').forEach((block) => {
    const inCat = cat === 'all' || block.dataset.catBlock === cat;
    let rows = 0;
    $$('[data-price-row]', block).forEach((r) => {
      const match = inCat && (!q || r.dataset.name.includes(q));
      r.hidden = !match;
      if (match) rows++;
    });
    block.hidden = rows === 0;
    visible += rows;
  });
  const empty = $('#price-empty');
  if (empty) empty.hidden = visible !== 0;
}

/* ---------------- Инициализация ---------------- */
function init() {
  upgradeLegacyHash();
  const first = parseRoute(currentAddress());
  state.lang = isLang(first.lang) ? first.lang : detectLang();
  $('#modal-slot').innerHTML = bookingModal();
  /* Прежняя версия формы складывала заявки (имя и телефон) в localStorage.
     Больше этого не делаем — и убираем то, что могло остаться. */
  safeRemove('umid.requests');

  /* hashchange нужен и в режиме путей: так ловим вставленную старую ссылку #/ru/... */
  window.addEventListener('hashchange', () => { if (usePaths() && !isRouteHash(location.hash)) return; route(); });
  window.addEventListener('popstate', () => { if (usePaths()) route(); });
  route();
  hideLoader();
  initScrollState();

  /* --- Делегирование событий --- */
  on('click', '[data-book]', (e, el) => { e.preventDefault(); openBooking(el.dataset.book || ''); });
  on('click', '[data-close-modal]', (e, el) => { if (!el.matches('a[href]')) e.preventDefault(); closeBooking(); });
  on('click', '[data-booking-reset]', (e, el) => {
    e.preventDefault();
    const card = el.closest('.bookcard');
    if (card) { card.innerHTML = bookingCardInner(); runPageMotion(card); }
  });
  on('click', '[data-menu-toggle]', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
  on('click', '.mmenu__link', () => closeMenu());
  on('click', '[data-scroll-top]', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  on('click', '.acc__btn', (e, el) => toggleAcc(el));
  on('click', '.tab', (e, el) => selectTab(el));
  on('click', '.pill', (e, el) => {
    $$('.pill').forEach((p) => p.setAttribute('aria-pressed', String(p === el)));
    filterPrices();
  });
  on('input', '#price-search', () => filterPrices());

  /* Переключение языка */
  on('click', '[data-lang]', (e, el) => {
    e.preventDefault();
    const code = el.dataset.lang;
    if (!isLang(code) || code === state.lang) { closeLangMenus(); return; }
    safeSet('umid.lang', code);
    closeLangMenus();
    navigate(hrefLang(code, state.route));
  });

  /* Выпадающий список языков */
  on('click', '.lang__toggle', (e, el) => {
    e.stopPropagation();
    const box = el.closest('.lang');
    const open = box.dataset.open === 'true';
    closeLangMenus();
    box.dataset.open = open ? 'false' : 'true';
    el.setAttribute('aria-expanded', open ? 'false' : 'true');
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.lang')) closeLangMenus(); });

  /* Форма записи — и в модальном окне, и на странице */
  document.addEventListener('submit', (e) => {
    const form = e.target;
    if (form && form.matches && form.matches('[data-booking-form]')) handleSubmit(e, form);
  });
  document.addEventListener('input', (e) => {
    const field = e.target.closest?.('.field');
    if (field && field.dataset.invalid === 'true') field.dataset.invalid = 'false';
  });

  /* Внутренние ссылки — последним обработчиком кликов: data-lang, data-book
     и прочие уже успели отменить переход, если он им не нужен. */
  document.addEventListener('click', interceptLinks);

  /* Клавиатура */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (isModalOpen()) closeBooking();
      else if (document.body.classList.contains('menu-open')) closeMenu();
      else closeLangMenus();
    }
    trapFocus(e);
  });
}

function closeLangMenus() {
  $$('.lang').forEach((l) => { l.dataset.open = 'false'; l.querySelector('.lang__toggle')?.setAttribute('aria-expanded', 'false'); });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
