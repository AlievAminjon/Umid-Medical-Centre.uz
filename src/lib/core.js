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

/* ---------------- Router ---------------- */
export const PAGES = ['home', 'about', 'services', 'prices', 'doctors', 'reviews', 'patients', 'contacts', 'privacy', 'terms'];

/** Ссылка вида #/ru/services/therapy */
export function href(page, slug) {
  const l = state.lang;
  if (page === 'home' || !page) return `#/${l}/`;
  return `#/${l}/${page}${slug ? '/' + slug : ''}`;
}
export function hrefLang(code, route = state.route) {
  if (route.page === 'home') return `#/${code}/`;
  return `#/${code}/${route.page}${route.slug ? '/' + route.slug : ''}`;
}

export function parseHash(hash) {
  const raw = String(hash || '').replace(/^#\/?/, '').replace(/\/+$/, '');
  const parts = raw.split('/').filter(Boolean);
  let lang = null, page = 'home', slug = null;
  if (parts.length && isLang(parts[0])) { lang = parts[0]; parts.shift(); }
  if (parts.length) page = parts[0];
  if (parts.length > 1) slug = parts[1];
  if (!PAGES.includes(page)) page = '404';
  if (page === 'services' && slug && !SERVICES.some((s) => s.slug === slug)) page = '404';
  if (page === 'doctors' && slug && !DOCTORS.some((d) => d.slug === slug)) page = '404';
  return { lang, page, slug };
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
  meta('property', 'og:url', SITE_URL + hrefLang(state.lang).replace('#', ''));
  meta('name', 'twitter:card', 'summary_large_image');
  meta('name', 'twitter:title', title);
  meta('name', 'twitter:description', desc);
  meta('name', 'theme-color', '#003882');
  link('canonical', SITE_URL + hrefLang(state.lang).replace('#', ''));
  /* hreflang для всех шести языков + x-default */
  $$('link[rel="alternate"]').forEach((n) => n.remove());
  [...LANGS.map((l) => [l.htmlLang, l.code]), ['x-default', DEFAULT_LANG]].forEach(([hl, code]) => {
    const el = document.createElement('link');
    el.rel = 'alternate'; el.setAttribute('hreflang', hl);
    el.href = SITE_URL + hrefLang(code, route).replace('#', '');
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
        { '@type': 'ListItem', position: 1, name: t('nav.home'), item: SITE_URL + `/${state.lang}/` },
        { '@type': 'ListItem', position: 2, name: route.page === '404' ? t('notFound.title') : t(`nav.${route.page}`), item: SITE_URL + hrefLang(state.lang, route).replace('#', '') }
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
