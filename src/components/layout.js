/* ============================================================
   Каркас страницы: topline, header, language switcher,
   mobile menu, bottom bar, floating actions, footer
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, href, hrefLang, state, langMeta } from '../lib/core.js';
import { CLINIC, LANGS, SERVICES, DOCUMENTS } from '../data/clinic.js';
import { LOGO_MARK, LOGO_FULL } from '../lib/assets.js';
import { btn, bookBtn } from './ui.js';

const NAV = ['about', 'services', 'prices', 'doctors', 'reviews', 'patients', 'contacts'];

/* ---------- Language switcher ---------- */
function langMenu(cls = '') {
  return LANGS.map((l, i) => `
    <button class="${cls}" data-lang="${l.code}" style="--rd:${i * 34}ms" aria-current="${l.code === state.lang ? 'true' : 'false'}" lang="${l.htmlLang}">
      <span class="lang__flag">${l.label}</span>
      <span class="lang__native">${esc(l.native)}<small>${esc(l.en)}</small></span>
    </button>`).join('');
}

export function langSwitcher() {
  const cur = langMeta(state.lang);
  return `<div class="lang" data-lang-switcher data-open="false">
    <button class="lang__toggle" aria-haspopup="true" aria-expanded="false" aria-label="${esc(t('common.chooseLanguage'))}">
      ${icon('globe')}<span class="lang__code">${cur.label}</span>${icon('chevronDown', 'chev')}
    </button>
    <div class="lang__menu" role="menu" aria-label="${esc(t('common.language'))}">
      ${langMenu('lang__item')}
    </div>
  </div>`;
}

/* ---------- Header ---------- */
export function header(route) {
  const isCur = (p) => (route.page === p ? 'aria-current="page"' : '');
  return `<header class="header">
    <div class="topline">
      <div class="container">
        <div class="row">
          <span>${icon('pin')} ${esc(t('common.addressFull'))}</span>
        </div>
        <div class="row">
          <span>${icon('clock')} ${esc(t('common.hours'))}</span>
          <i class="topline__sep"></i>
          <a href="${CLINIC.phoneHref}">${esc(CLINIC.phone)}</a>
        </div>
      </div>
    </div>

    <div class="header__bar">
      <div class="container container--wide header__inner">
        <a class="brand" href="${href('home')}" aria-label="${esc(CLINIC.name)}">
          <img class="brand__mark" src="${LOGO_MARK}" alt="" width="44" height="38">
          <span class="brand__text">
            <span class="brand__name">UMID</span>
            <span class="brand__sub">${esc(t('common.brandSub'))}</span>
          </span>
        </a>

        <nav class="nav" aria-label="${esc(t('common.menu'))}">
          ${NAV.map((p) => `<a class="nav__link" href="${href(p)}" ${isCur(p)}>${esc(t('nav.' + p))}</a>`).join('')}
        </nav>

        <div class="header__actions">
          <a class="header__phone" href="${CLINIC.phoneHref}">
            <b>${esc(CLINIC.phone)}</b>
            <span><span class="dot-live"></span>${esc(t('common.hoursShort'))}</span>
          </a>
          <a class="icon-btn icon-btn--tg" href="${CLINIC.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${icon('telegram')}</a>
          <a class="icon-btn icon-btn--wa" href="${CLINIC.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
          ${langSwitcher()}
          ${bookBtn({ label: t('common.book'), size: 'sm', icon: null })}
          <button class="icon-btn burger" data-menu-toggle aria-label="${esc(t('common.menu'))}" aria-expanded="false" aria-controls="mmenu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </div>
  </header>`;
}

/* ---------- Mobile menu — premium fullscreen ---------- */
export function mobileMenu(route) {
  const isCur = (p) => (route.page === p ? 'aria-current="page"' : '');
  const links = ['home', ...NAV];
  return `<div class="mmenu" id="mmenu" aria-hidden="true">
    <div class="mmenu__inner">
      <nav class="mmenu__nav" aria-label="${esc(t('common.menu'))}">
        ${links.map((p, i) => `
          <a class="mmenu__link" href="${href(p === 'home' ? 'home' : p)}" ${isCur(p)} style="--rd:${40 + i * 42}ms">
            <span>${esc(t('nav.' + p))}</span>
            <span class="mmenu__num">${String(i + 1).padStart(2, '0')}</span>
            ${icon('chevronRight')}
          </a>`).join('')}
      </nav>

      <div>
        <div class="mmenu__label">${esc(t('common.language'))}</div>
        <div class="mmenu__langs">${langMenu('mmenu__lang')}</div>
      </div>

      <div>
        <div class="mmenu__label">${esc(t('common.book'))}</div>
        <div class="mmenu__contact">
          ${bookBtn({ block: true, size: 'lg' })}
          ${btn({ variant: 'tg', label: 'Telegram', icon: 'telegram', href: CLINIC.telegram, target: '_blank', block: true })}
          ${btn({ variant: 'wa', label: 'WhatsApp', icon: 'whatsapp', href: CLINIC.whatsapp, target: '_blank', block: true })}
          ${btn({ variant: 'ghost', label: CLINIC.phone, icon: 'phone', href: CLINIC.phoneHref, block: true })}
        </div>
      </div>

      <div class="mmenu__foot">
        ${icon('pin')}
        <span>${esc(t('common.addressFull'))}<br>${esc(t('common.hours'))}</span>
      </div>
    </div>
  </div>`;
}

/* ---------- Mobile bottom bar ---------- */
export function bottomBar() {
  return `<nav class="bottombar" aria-label="${esc(t('common.bookLong'))}">
    <div class="bottombar__grid">
      <a class="bottombar__item" href="${CLINIC.phoneHref}">${icon('phone')}<span>${esc(t('common.call'))}</span></a>
      <a class="bottombar__item bottombar__item--tg" href="${CLINIC.telegram}" target="_blank" rel="noopener">${icon('telegram')}<span>Telegram</span></a>
      <a class="bottombar__item bottombar__item--wa" href="${CLINIC.whatsapp}" target="_blank" rel="noopener">${icon('whatsapp')}<span>WhatsApp</span></a>
      <button class="bottombar__item bottombar__item--cta" data-book>${icon('calendar')}<span>${esc(t('common.book'))}</span></button>
    </div>
  </nav>`;
}

/* ---------- Desktop floating actions ----------
   Минималистичные кнопки; подпись раскрывается при наведении. */
function floater(cls, inner, label, o = {}) {
  const attrs = o.href
    ? `href="${o.href}" ${o.target ? `target="${o.target}" rel="noopener"` : ''}`
    : `type="button" ${o.data || ''}`;
  const tag = o.href ? 'a' : 'button';
  return `<${tag} class="floater ${cls}" ${attrs} aria-label="${esc(label)}" style="--w:${o.w || 172}px">
    <span class="floater__label" aria-hidden="true">${esc(label)}</span>${inner}
  </${tag}>`;
}

export function floaters() {
  return `<div class="floaters">
    ${floater('floater--tg', icon('telegram'), 'Telegram', { href: CLINIC.telegram, target: '_blank', w: 158 })}
    ${floater('floater--wa', icon('whatsapp'), 'WhatsApp', { href: CLINIC.whatsapp, target: '_blank', w: 166 })}
    ${floater('floater--call', icon('phone'), CLINIC.phone, { href: CLINIC.phoneHref, w: 216 })}
    ${floater('floater--top', icon('arrowUp'), t('common.toTop'), { data: 'data-scroll-top', w: 150 })}
  </div>`;
}

/* ---------- Footer ---------- */
export function footer() {
  const docs = DOCUMENTS.filter((d) => d.route);
  return `<footer class="footer">
    <div class="container container--wide">
      <div class="footer__top">
        <div class="footer__slogan">${esc(t('footer.slogan'))}</div>
        <div class="row" style="gap:11px">
          ${bookBtn({ variant: 'onink', size: 'lg' })}
          ${btn({ variant: 'outline-ink', label: CLINIC.phone, icon: 'phone', href: CLINIC.phoneHref, size: 'lg' })}
        </div>
      </div>

      <div class="footer__grid">
        <div>
          <img class="footer__logo" src="${LOGO_FULL}" alt="${esc(CLINIC.name)}" width="140" height="54" loading="lazy">
          <p style="max-width:340px;font-size:.93rem">${esc(t('footer.about'))}</p>
          <div class="footer__social">
            <a class="icon-btn" href="${CLINIC.telegram}" target="_blank" rel="noopener" aria-label="Telegram">${icon('telegram')}</a>
            <a class="icon-btn" href="${CLINIC.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
            <a class="icon-btn" href="${CLINIC.phoneHref}" aria-label="${esc(t('common.call'))}">${icon('phone')}</a>
          </div>
        </div>

        <div>
          <h4>${esc(t('footer.navTitle'))}</h4>
          <div class="footer__links">
            ${['about', 'prices', 'doctors', 'reviews', 'patients', 'contacts'].map((p) => `<a href="${href(p)}">${esc(t('nav.' + p))}</a>`).join('')}
          </div>
        </div>

        <div>
          <h4>${esc(t('footer.servicesTitle'))}</h4>
          <div class="footer__links">
            ${SERVICES.slice(0, 6).map((s) => `<a href="${href('services', s.slug)}">${esc(t(`services.items.${s.slug}.name`))}</a>`).join('')}
            <a href="${href('services')}">${esc(t('common.all'))}</a>
          </div>
        </div>

        <div>
          <h4>${esc(t('footer.contactsTitle'))}</h4>
          <div class="footer__contact">
            <div class="footer__item">${icon('pin')}<span>${esc(t('common.addressFull'))}</span></div>
            <div class="footer__item">${icon('phone')}<a href="${CLINIC.phoneHref}">${esc(CLINIC.phone)}</a></div>
            <div class="footer__item">${icon('clock')}<span>${esc(t('common.hours'))}</span></div>
          </div>
          <h4 class="mt-4">${esc(t('footer.docsTitle'))}</h4>
          <div class="footer__links">
            ${docs.map((d) => `<a href="${href(d.route)}">${esc(t(`patients.documents.${d.id}.t`))}</a>`).join('')}
          </div>
        </div>
      </div>

      <p class="footer__disclaimer">${esc(t('footer.disclaimer'))}</p>

      <div class="footer__bottom">
        <span>© ${new Date().getFullYear()} ${esc(CLINIC.name)}. ${esc(t('footer.rights'))}</span>
        <span class="row" style="gap:16px">
          <a href="${href('privacy')}">${esc(t('nav.privacy'))}</a>
          <a href="${href('terms')}">${esc(t('nav.terms'))}</a>
        </span>
        <span class="row" style="gap:9px">
          ${icon('language')}
          ${LANGS.map((l) => `<a href="${hrefLang(l.code)}" data-lang="${l.code}" style="${l.code === state.lang ? 'color:#fff;font-weight:700' : ''}">${l.label}</a>`).join('')}
        </span>
      </div>
    </div>
  </footer>`;
}
