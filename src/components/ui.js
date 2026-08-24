/* ============================================================
   UMID SIGNATURE — дизайн-система: переиспользуемые примитивы
   ============================================================ */
import { icon, iconFilled } from '../lib/icons.js';
import { esc, t, href, initials, priceFrom } from '../lib/core.js';
import { CLINIC, PHOTOS, SERVICES } from '../data/clinic.js';
import { LOGO_MARK, PHOTO_FILES } from '../lib/assets.js';

/* ---------- Text mask reveal ----------
   Каждая строка «выезжает» из-под маски. Строки задаются явно —
   так заголовок ломается предсказуемо на всех шести языках. */
export const maskLine = (html) => `<span class="mask"><span class="mask__i">${html}</span></span>`;
export const maskLines = (lines) => lines.filter((l) => l !== '' && l != null).map((l) => maskLine(l)).join('');

/* ---------- Button ---------- */
export function btn(o = {}) {
  const cls = ['btn', o.variant ? `btn--${o.variant}` : '', o.size ? `btn--${o.size}` : '', o.block ? 'btn--block' : '', o.cls || ''].filter(Boolean).join(' ');
  const ic = o.icon ? icon(o.icon) : '';
  const inner = `${o.iconAfter ? '' : ic}<span>${esc(o.label)}</span>${o.iconAfter ? icon(o.iconAfter) : ''}`;
  const attrs = [
    o.aria ? `aria-label="${esc(o.aria)}"` : '',
    o.data || '',
    o.target ? `target="${o.target}" rel="noopener"` : ''
  ].filter(Boolean).join(' ');
  if (o.href) return `<a class="${cls}" href="${o.href}" ${attrs}>${inner}</a>`;
  return `<button type="${o.type || 'button'}" class="${cls}" ${attrs}>${inner}</button>`;
}

/** Кнопка «Записаться» — открывает модальное окно */
export const bookBtn = (o = {}) => btn({ variant: 'primary', label: o.label || t('common.bookLong'), icon: o.icon === null ? null : 'calendar', data: `data-book${o.service ? `="${o.service}"` : ''}`, ...o });
export const tgBtn = (o = {}) => btn({ variant: 'tg', label: o.label || t('common.telegram'), icon: 'telegram', href: CLINIC.telegram, target: '_blank', ...o });
export const waBtn = (o = {}) => btn({ variant: 'wa', label: o.label || t('common.whatsapp'), icon: 'whatsapp', href: CLINIC.whatsapp, target: '_blank', ...o });
export const callBtn = (o = {}) => btn({ variant: 'ghost', label: o.label || CLINIC.phone, icon: 'phone', href: CLINIC.phoneHref, ...o });

/* ---------- Section heading ---------- */
export function secHead({ eyebrow, title, titleLines, lead, right, cls = '', center = false }) {
  const heading = titleLines ? maskLines(titleLines) : esc(title);
  return `<div class="sec-head ${right ? 'sec-head--split' : ''} ${center ? 'sec-head--center' : ''} ${cls}" data-reveal="up">
    <div>
      ${eyebrow ? `<div class="eyebrow">${esc(eyebrow)}</div>` : ''}
      <h2>${heading}</h2>
      ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
    </div>
    ${right ? `<div>${right}</div>` : ''}
  </div>`;
}

/* ---------- Photo frame ----------
   Пока фотографии не загружены, показывается премиальная заглушка.
   Как только в PHOTOS появится src — на этом же месте отрисуется фото
   с тем же кадрированием и той же анимацией проявления. */
export function frame(key, o = {}) {
  const photo = PHOTOS[key] || {};
  /* Приоритет: явный src в PHOTOS → файл src/assets/photos/<key>.* → заглушка */
  const src = photo.src || PHOTO_FILES[key] || null;
  const ratio = o.ratio || photo.ratio || '4/3';
  const cls = `frame reveal-img ${o.shape ? `frame--${o.shape}` : ''} ${o.tint ? 'frame--tint' : ''} ${o.cls || ''}`;
  const style = o.fill ? '' : `style="aspect-ratio:${ratio}"`;
  const tag = o.tag ? `<span class="ph__tag">${esc(o.tag)}</span>` : '';
  if (src) {
    return `<div class="${cls}" ${style}>${tag}<img src="${src}" alt="${esc(o.title || '')}" loading="${o.eager ? 'eager' : 'lazy'}" decoding="async"></div>`;
  }
  /* quiet — заглушка без подписей: используется там, где название
     услуги уже написано поверх изображения. */
  const inner = o.quiet
    ? `<span class="ph ph--quiet"><img class="ph__mark" src="${LOGO_MARK}" alt="" aria-hidden="true"></span>`
    : `<span class="ph ${o.small ? 'ph--sm' : ''}">
        <img class="ph__mark" src="${LOGO_MARK}" alt="" aria-hidden="true">
        <span class="ph__title">${esc(o.title || '')}</span>
        ${o.hint ? `<span class="ph__hint">${esc(o.hint)}</span>` : ''}
      </span>`;
  return `<div class="${cls}" ${style} role="img" aria-label="${esc(o.title || t('about.galleryTitle'))}">
    ${tag}
    <span class="ph-inner">${inner}</span>
  </div>`;
}

/* ---------- Chips / badges ---------- */
export const chip = (ic, text, cls = '') => `<span class="chip ${cls}">${ic ? icon(ic) : ''}${esc(text)}</span>`;
export const badge = (text, cls = '') => `<span class="badge ${cls}">${esc(text)}</span>`;
export const liveChip = (text) => `<span class="chip chip--live"><span class="dot-live"></span>${esc(text)}</span>`;

/* ---------- Декоративный объект «орбита» ----------
   Собственная графика: три кольца, световое ядро и знак клиники.
   Не сток-иллюстрация и не тяжёлая 3D-сцена. */
export function orbit(centerIcon = 'tooth') {
  return `<div class="why__orbit-wrap" data-reveal="scale">
    <div class="orbit" aria-hidden="true">
      <span class="orbit__glow"></span>
      <span class="orbit__ring orbit__ring--1"></span>
      <span class="orbit__ring orbit__ring--2"></span>
      <span class="orbit__ring orbit__ring--3"></span>
      <span class="orbit__core parallax" style="--depth:.5">${icon(centerIcon)}</span>
    </div>
  </div>`;
}

/* ---------- Accordion ---------- */
export function accordion(items, o = {}) {
  return `<div class="acc-group" data-stagger="60">${items.map((it, i) => `
    <div class="acc" data-acc data-open="${o.openFirst && i === 0 ? 'true' : 'false'}" data-reveal="up-sm">
      <button class="acc__btn" aria-expanded="${o.openFirst && i === 0 ? 'true' : 'false'}">
        <span>${esc(it.q)}</span>
        <span class="acc__ico">${icon('chevronDown')}</span>
      </button>
      <div class="acc__panel"><div class="acc__inner">${esc(it.a)}</div></div>
    </div>`).join('')}</div>`;
}

/* ---------- Tabs ---------- */
export const tabs = (items, active = 0) =>
  `<div class="tabs" role="tablist">${items.map((it, i) =>
    `<button class="tab" role="tab" data-tab="${it.id}" aria-selected="${i === active ? 'true' : 'false'}">${esc(it.label)}</button>`).join('')}</div>`;

/* ---------- Breadcrumbs ---------- */
export function crumbs(items) {
  return `<nav class="crumbs" aria-label="breadcrumb">
    ${items.map((it, i) => i === items.length - 1
      ? `<span aria-current="page">${esc(it.label)}</span>`
      : `<a href="${it.href}">${esc(it.label)}</a>${icon('chevronRight')}`).join('')}
  </nav>`;
}

/* ---------- Avatar & rating ---------- */
export const avatar = (name) => name
  ? `<span class="avatar">${esc(initials(name))}</span>`
  : `<span class="avatar avatar--ph" aria-hidden="true"></span>`;
export const stars = (n = 0, max = 5) =>
  `<span class="stars ${n ? '' : 'stars--empty'}" aria-hidden="true">${Array.from({ length: max }, () => iconFilled('star')).join('')}</span>`;

/* ---------- Service card ----------
   Раскладка задаётся данными (span/вариант), а не вёрсткой:
   editorial-сетка перестраивается изменением одного массива. */
export function svcCard(slug, opts = {}) {
  const o = typeof opts === 'number' ? { } : opts;
  const s = SERVICES.find((x) => x.slug === slug);
  const price = priceFrom(s?.price);
  const variant = o.variant || 'plain';
  const cls = ['svc', variant !== 'plain' ? `svc--${variant}` : ''].filter(Boolean).join(' ');
  const media = variant === 'feature'
    ? `<div class="svc__media">${frame(o.photo || 'cabinet', { fill: true, quiet: true, title: t(`services.items.${slug}.name`) })}</div>`
    : '';
  return `<a class="${cls}" href="${href('services', slug)}" style="--span:${o.span || 4}" data-reveal="${o.reveal || 'rise'}">
    ${media}
    <span class="icon-tile">${icon(s?.icon || 'tooth')}</span>
    <span class="svc__title">${esc(t(`services.items.${slug}.name`))}</span>
    <span class="svc__desc">${esc(t(`services.items.${slug}.short`))}</span>
    <span class="svc__foot">
      <span class="svc__price">${esc(price || t('common.askPrice'))}</span>
      <span class="svc__arrow">${icon('arrowUpRight')}</span>
    </span>
  </a>`;
}

/** Editorial-раскладка восьми направлений: разные размеры, тона и фото. */
export const SERVICE_LAYOUT = [
  { span: 5, variant: 'feature', photo: 'cabinet' },
  { span: 4, variant: 'plain' },
  { span: 3, variant: 'soft' },
  { span: 4, variant: 'plain' },
  { span: 4, variant: 'soft' },
  { span: 4, variant: 'plain' },
  { span: 7, variant: 'dark' },
  { span: 5, variant: 'feature', photo: 'equipment' }
];

export function servicesGrid(slugs, layout = SERVICE_LAYOUT) {
  return `<div class="services" data-stagger="70">
    ${slugs.map((slug, i) => svcCard(slug, layout[i % layout.length])).join('')}
  </div>`;
}

/* ---------- Note ---------- */
export const note = (text, kind = '') =>
  `<div class="note ${kind === 'info' ? 'note--info' : ''}" data-reveal="up-sm">${icon(kind === 'info' ? 'info' : 'alert')}<div>${esc(text)}</div></div>`;

/* ---------- CTA band ---------- */
export function ctaBand() {
  return `<section class="section section--tight"><div class="container">
    <div class="ctaband" data-reveal="rise">
      <div class="ctaband__inner">
        <div>
          <h2>${maskLines([esc(t('home.cta.title'))])}</h2>
          <p>${esc(t('home.cta.lead'))}</p>
          <div class="row mt-3">
            <span class="chip chip--ink">${icon('clock')}${esc(t('home.cta.note'))}</span>
          </div>
        </div>
        <div class="ctaband__actions">
          ${bookBtn({ variant: 'onink', block: true, size: 'lg' })}
          <div class="row">
            ${btn({ variant: 'outline-ink', label: t('common.telegram'), icon: 'telegram', href: CLINIC.telegram, target: '_blank' })}
            ${btn({ variant: 'outline-ink', label: t('common.whatsapp'), icon: 'whatsapp', href: CLINIC.whatsapp, target: '_blank' })}
          </div>
          ${btn({ variant: 'outline-ink', label: CLINIC.phone, icon: 'phone', href: CLINIC.phoneHref, block: true })}
        </div>
      </div>
    </div>
  </div></section>`;
}

/* ---------- Page hero ---------- */
export function pageHero({ title, lead, crumbItems, meta, badgeIcon }) {
  return `<section class="phero">
    <div class="aurora"></div>
    <div class="dotgrid"></div>
    <div class="container">
      <div class="phero__inner">
        ${crumbItems ? crumbs(crumbItems) : ''}
        ${badgeIcon ? `<div class="mb-3" data-reveal="scale"><span class="icon-tile icon-tile--ink">${icon(badgeIcon)}</span></div>` : ''}
        <h1 data-reveal="fade">${maskLines([esc(title)])}</h1>
        ${lead ? `<p class="lead mt-3" data-reveal="up" data-reveal-delay="2">${esc(lead)}</p>` : ''}
        ${meta ? `<div class="phero__meta" data-reveal="up" data-reveal-delay="3">${meta}</div>` : ''}
      </div>
    </div>
  </section>`;
}
