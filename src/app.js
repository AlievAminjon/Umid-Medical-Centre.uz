/* ============================================================
   UMID Medical Centre — точка входа
   ============================================================ */
import { $, $$, on, state, t, detectLang, isLang, parseHash, href, hrefLang, applySeo, safeSet, toast } from './lib/core.js';
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

function paint(route, opts = {}) {
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

/* ---------------- Роутинг ---------------- */
function route() {
  const parsed = parseHash(location.hash);
  /* Язык всегда присутствует в адресе — так ссылкой можно поделиться. */
  if (!parsed.lang) {
    const lang = detectLang();
    state.lang = lang;
    location.replace(`#/${lang}/${parsed.page === 'home' ? '' : parsed.page + (parsed.slug ? '/' + parsed.slug : '')}`);
    return;
  }
  if (parsed.lang !== state.lang) {
    state.lang = parsed.lang;
    safeSet('umid.lang', parsed.lang);
  }
  render({ page: parsed.page, slug: parsed.slug });
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
    lang: state.lang
  };
  const inline = form.id !== 'booking-form';
  try {
    await submitBooking(data);
    if (inline) {
      const card = form.closest('.bookcard');
      if (card) card.innerHTML = successView(data, { inline: true });
    } else {
      $('#booking-content').innerHTML = successView(data);
      $('#booking .modal__box').scrollTop = 0;
    }
  } catch (err) {
    submitBtn.classList.remove('btn--loading');
    toast(t('booking.errors.phone'));
    console.error(err);
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
  const first = parseHash(location.hash);
  state.lang = isLang(first.lang) ? first.lang : detectLang();
  $('#modal-slot').innerHTML = bookingModal();

  window.addEventListener('hashchange', route);
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
    location.hash = hrefLang(code, state.route).replace(/^#/, '');
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
