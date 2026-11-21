/* ============================================================
   Ядро: утилиты, i18n, роутинг, SEO
   ============================================================ */
import { LANGS, DEFAULT_LANG, SITE_URL, CLINIC, SERVICES, DOCTORS, mapLinks } from '../data/clinic.js';
import { DICT } from '../i18n/index.js';

/* ---------------- DOM utils ---------------- */
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const on = (ev, sel, fn, root = document) => root.addEventListener(ev, (e) => {
  const el = e.target.closest(sel);
  if (el && root.contains(el)) fn(e, el);
});

/* ---------------- i18n ---------------- */
export const state = { lang: DEFAULT_LANG, route: { page: 'home', slug: null } };

export const langCodes = LANGS.map((l) => l.code);
export const isLang = (c) => langCodes.includes(c);

export function detectLang() {
  const saved = safeGet('umid.lang');
  if (isLang(saved)) return saved;
  const nav = (navigator.languages || [navigator.language || '']).map((l) => String(l).slice(0, 2).toLowerCase());
  const hit = nav.find((l) => isLang(l));
  return hit || DEFAULT_LANG;
}

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
export function safeSet(k, v) { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } }
export function safeRemove(k) { try { localStorage.removeItem(k); } catch { /* приватный режим */ } }

/** t('home.hero.title') — достаёт строку из словаря активного языка.
 *  Если ключа нет — падает на русский (язык по умолчанию), а не на пустоту. */
export function t(path, vars) {
  const read = (lang) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), DICT[lang]);
  let val = read(state.lang);
  if (val === undefined) val = read(DEFAULT_LANG);
  if (val === undefined) { if (typeof console !== 'undefined') console.warn('[i18n] missing key:', path, state.lang); return ''; }
  if (typeof val === 'string' && vars) {
    return val.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? vars[k] : `{${k}}`));
  }
  return val;
}
/** Массивы/объекты из словаря */
export const tl = (path) => { const v = t(path); return Array.isArray(v) ? v : []; };

export const langMeta = (code) => LANGS.find((l) => l.code === code) || LANGS[0];

/* ---------------- Money ---------------- */
const LOCALE_MAP = { ru: 'ru-RU', uz: 'uz-UZ', en: 'en-US', es: 'es-ES', fr: 'fr-FR', de: 'de-DE' };
export function money(v) {
  if (v == null) return null;
  try { return new Intl.NumberFormat(LOCALE_MAP[state.lang] || 'ru-RU').format(v); }
  catch { return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
}
/** «от 250 000 сум» либо null, если цена ещё не утверждена клиникой */
export function priceFrom(v) {
  const n = money(v);
  return n ? `${t('common.from')} ${n} ${t('common.currency')}` : null;
}

/* ---------------- Router ----------------
   Адрес страницы — настоящий путь: /ru, /ru/services, /ru/services/therapy.
   Без завершающего слеша — так же, как его отдаёт сервер (trailingSlash: false
   в vercel.json). По http(s) переходы идут через History API.

   Запасной вариант — хеш (#/ru/services). Он включается, когда сайт открыт
   с диска двойным кликом (file://) или лежит не в корне домена: там
   серверных путей нет, и обычные ссылки вели бы в никуда. */
export const PAGES = ['home', 'about', 'services', 'prices', 'doctors', 'reviews', 'patients', 'contacts', 'privacy', 'terms'];

/** Путь маршрута без домена: /ru, /ru/services/therapy. Один источник
 *  для ссылок, canonical, hreflang и sitemap.xml. */
export function routePath(lang, page, slug) {
  if (!page || page === 'home') return `/${lang}`;
  return `/${lang}/${page}${slug ? '/' + slug : ''}`;
}

/** Путь текущего маршрута на нужном языке. Для 404 сохраняется исходный адрес. */
const pathFor = (lang, route) => (route.page === '404' && route.rest
  ? `/${lang}/${route.rest}`
  : routePath(lang, route.page, route.slug));

/** Полный адрес страницы для canonical, hreflang, og:url и sitemap. */
export const absUrl = (lang, route) => SITE_URL + pathFor(lang, route);

let pathMode = null;
/** true — роутинг по путям (History API), false — хеш-режим. Решается один раз. */
export function usePaths() {
  if (pathMode === null) {
    const { protocol, pathname } = window.location;
    const first = pathname.split('/').filter(Boolean)[0] || '';
    pathMode = /^https?:$/.test(protocol) && (first === '' || first === 'index.html' || isLang(first));
  }
  return pathMode;
}

/** Путь → значение для href: в хеш-режиме перед ним ставится «#». */
export const toHref = (path) => (usePaths() ? path : '#' + path);

/** Ссылка на страницу на текущем языке: /ru/services/therapy */
export const href = (page, slug) => toHref(routePath(state.lang, page, slug));
/** Та же страница на другом языке */
export const hrefLang = (code, route = state.route) => toHref(pathFor(code, route));

/** Файл из dist/assets: от корня сайта в режиме путей, иначе относительно HTML. */
export const assetUrl = (p) => {
  const rel = String(p).replace(/^\/+/, '');
  return usePaths() ? '/' + rel : rel;
};

/**
 * Разбор адреса. Принимает и путь (/ru/services), и хеш (#/ru/services) —
 * второй нужен для хеш-режима и для старых ссылок вида /#/ru/services.
 * rest — всё, что идёт после языка: по нему достраивается адрес без языка.
 */
export function parseRoute(input) {
  const raw = String(input || '').replace(/^#/, '').split(/[?#]/)[0];
  const parts = raw.split('/').filter(Boolean);
  if (parts[parts.length - 1] === 'index.html') parts.pop();
  let lang = null, page = 'home', slug = null;
  if (parts.length && isLang(parts[0])) { lang = parts[0]; parts.shift(); }
  const rest = parts.join('/');
  if (parts.length) page = parts[0];
  if (parts.length > 1) slug = parts[1];
  if (!PAGES.includes(page) || parts.length > 2) page = '404';
  if (page === 'services' && slug && !SERVICES.some((s) => s.slug === slug)) page = '404';
  if (page === 'doctors' && slug && !DOCTORS.some((d) => d.slug === slug)) page = '404';
  if (slug && !['services', 'doctors'].includes(page)) page = '404';
  return { lang, page, slug, rest };
}

/* ---------------- SEO ---------------- */
function meta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', content);
}
function link(rel, url, extra = {}) {
  const sel = `link[rel="${rel}"]${extra.hreflang ? `[hreflang="${extra.hreflang}"]` : ''}`;
  let el = document.head.querySelector(sel);
  if (!el) { el = document.createElement('link'); el.rel = rel; Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v)); document.head.appendChild(el); }
  el.href = url;
}

export function seoFor(route) {
  const { page, slug } = route;
  let title, desc;
  if (page === 'services' && slug) {
    title = t('seo.serviceTitle', { name: t(`services.items.${slug}.name`) });
    /* Описание собираем из короткого текста услуги + локальных сигналов для гео-SEO */
    desc = `${t(`services.items.${slug}.short`)} ${CLINIC.name}, ${t('common.city')}, ${t('common.region')}. ${t('common.hours')}. ${CLINIC.phone}`;
  } else if (page === 'doctors' && slug) {
    title = t('seo.doctorTitle');
    desc = `${t('doctors.placeholderLead')} ${CLINIC.name}, ${t('common.city')}.`;
  } else if (page === '404') {
    title = t('notFound.title') + ' — ' + CLINIC.name;
    desc = t('notFound.lead');
  } else {
    title = t(`seo.pages.${page}.title`);
    desc = t(`seo.pages.${page}.description`);
  }
  return { title, desc };
}

export function applySeo(route) {
  const { title, desc } = seoFor(route);
  const lm = langMeta(state.lang);
  document.title = title;
  document.documentElement.lang = lm.htmlLang;
  meta('name', 'description', desc);
  meta('name', 'robots', page404(route) ? 'noindex,follow' : 'index,follow');
  meta('property', 'og:title', title);
  meta('property', 'og:description', desc);
  meta('property', 'og:type', 'website');
  meta('property', 'og:site_name', CLINIC.name);
  meta('property', 'og:locale', lm.htmlLang);
  meta('property', 'og:url', absUrl(state.lang, route));
  meta('name', 'twitter:card', 'summary_large_image');
  meta('name', 'twitter:title', title);
  meta('name', 'twitter:description', desc);
  meta('name', 'theme-color', '#003882');
  link('canonical', absUrl(state.lang, route));
  /* hreflang для всех шести языков + x-default */
  $$('link[rel="alternate"]').forEach((n) => n.remove());
  [...LANGS.map((l) => [l.htmlLang, l.code]), ['x-default', DEFAULT_LANG]].forEach(([hl, code]) => {
    const el = document.createElement('link');
    el.rel = 'alternate'; el.setAttribute('hreflang', hl);
    el.href = absUrl(code, route);
    document.head.appendChild(el);
  });
  injectJsonLd(route);
}
const page404 = (r) => r.page === '404';

function injectJsonLd(route) {
  $$('script[data-jsonld]').forEach((n) => n.remove());
  const org = {
    '@context': 'https://schema.org',
    /* Клиника — одновременно Dentist, MedicalClinic и LocalBusiness:
       так локальный поиск понимает и профиль, и то, что это организация с адресом. */
    '@type': ['Dentist', 'MedicalClinic', 'LocalBusiness'],
    '@id': SITE_URL + '/#clinic',
    name: CLINIC.name,
    url: SITE_URL,
    telephone: CLINIC.phone,
    currenciesAccepted: CLINIC.currency,
    areaServed: [t('common.city'), t('common.region')].map((n) => ({ '@type': 'Place', name: n })),
    hasMap: mapLinks.google,
    description: t('seo.pages.home.description'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: t('common.street'),
      addressLocality: t('common.city'),
      addressRegion: t('common.region'),
      addressCountry: 'UZ'
    },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00', closes: '23:59'
    }],
    availableService: SERVICES.map((s) => ({ '@type': 'MedicalProcedure', name: t(`services.items.${s.slug}.name`) })),
    medicalSpecialty: 'Dentistry',
    availableLanguage: LANGS.map((l) => l.en),
    sameAs: [CLINIC.telegram, CLINIC.whatsapp, CLINIC.instagram].filter(Boolean)
  };
  /* Координаты добавляем только после подтверждения клиникой — не выдумываем точку. */
  if (CLINIC.coords) org.geo = { '@type': 'GeoCoordinates', latitude: CLINIC.coords[0], longitude: CLINIC.coords[1] };
  const nodes = [org];
  if (route.page !== 'home') {
    nodes.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('nav.home'), item: absUrl(state.lang, { page: 'home' }) },
        { '@type': 'ListItem', position: 2, name: route.page === '404' ? t('notFound.title') : t(`nav.${route.page}`), item: absUrl(state.lang, route) }
      ]
    });
  }
  if (route.page === 'patients' || route.page === 'home') {
    const faq = tl('patients.faq');
    if (faq.length) nodes.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faq.slice(0, 6).map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
    });
  }
  nodes.forEach((n) => {
    const s = document.createElement('script');
    s.type = 'application/ld+json'; s.dataset.jsonld = '1';
    s.textContent = JSON.stringify(n);
    document.head.appendChild(s);
  });
}

/* ---------------- Toast ---------------- */
let toastTimer;
export function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.dataset.show = 'true';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.dataset.show = 'false'; }, 3400);
}

/* ---------------- Misc ---------------- */
export const initials = (s = '') => s.trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase();
export const waLink = (text) => CLINIC.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
export const isTouch = () => typeof window.matchMedia === 'function' && window.matchMedia('(hover:none)').matches;
