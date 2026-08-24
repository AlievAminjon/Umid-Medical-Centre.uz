/* ============================================================
   DOCTORS — крупный портрет + дополнительные карточки.
   Реальные данные клиника ещё не передала: карточки честно
   помечены как заготовки, структура готова под ФИО, стаж,
   образование, языки и фотографию.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, href } from '../lib/core.js';
import { DOCTORS } from '../data/clinic.js';
import { LOGO_MARK, PHOTO_FILES } from '../lib/assets.js';
import { btn, secHead, note } from '../components/ui.js';

/** Карточка врача. o.lead — крупный «главный» портрет. */
export function doctorCard(d, i = 0, o = {}) {
  const name = d.name || t('doctors.placeholderName');
  const role = d.role || t(`services.items.${d.specialty}.name`);
  const exp = d.experience || t('doctors.pending');
  const edu = d.education || t('doctors.pending');
  const langs = d.langs || t('doctors.langsValue');

  /* Фото врача: поле photo в DOCTORS либо файл src/assets/photos/<slug>.* */
  const src = d.photo || PHOTO_FILES[d.slug] || null;
  const photo = src
    ? `<img src="${src}" alt="${esc(name)}" loading="lazy" decoding="async">`
    : `<span class="ph ph--sm"><img class="ph__mark" src="${LOGO_MARK}" alt="" aria-hidden="true"><span class="ph__title">${esc(t('doctors.photoNote'))}</span></span>`;

  const mod = [o.lead ? 'doc--lead' : '', o.compact ? 'doc--compact' : ''].filter(Boolean).join(' ');
  return `<article class="doc ${mod}" data-reveal="${o.lead ? 'clip' : 'rise'}" data-reveal-delay="${i}">
    <div class="doc__photo">
      ${photo}
      <div class="doc__hover">
        <b>${esc(name)}</b>
        <i>${esc(role)}</i>
        <ul>
          <li>${icon('award')}<span>${esc(t('doctors.card.experience'))}: ${esc(exp)}</span></li>
          <li>${icon('doc')}<span>${esc(t('doctors.card.education'))}: ${esc(edu)}</span></li>
          <li>${icon('language')}<span>${esc(langs)}</span></li>
        </ul>
      </div>
    </div>
    <div class="doc__body">
      <div>
        <div class="doc__name">${esc(name)}</div>
        <div class="doc__role">${esc(role)}</div>
      </div>
      <div class="doc__meta">
        <div>${icon('award')}<span>${esc(t('doctors.card.experience'))}: ${esc(exp)}</span></div>
        <div>${icon('language')}<span>${esc(langs)}</span></div>
      </div>
      <a class="link-arrow" href="${href('doctors', d.slug)}">${esc(t('common.more'))}${icon('arrowUpRight')}</a>
    </div>
  </article>`;
}

/** Композиция: один крупный портрет и колонка меньших. */
export function doctorsStage() {
  const [lead, ...rest] = DOCTORS;
  if (!lead) return '';
  return `<div class="docstage" data-stagger="110">
    ${doctorCard(lead, 0, { lead: true })}
    <div class="docstage__side">
      ${rest.map((d, i) => doctorCard(d, i + 1, { compact: true })).join('')}
    </div>
  </div>`;
}

export function doctorsSection() {
  return `<section class="section">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('home.doctors.eyebrow'),
        titleLines: [esc(t('home.doctors.title'))],
        lead: t('home.doctors.lead'),
        right: btn({ variant: 'ghost', label: t('home.doctors.cta'), iconAfter: 'arrowUpRight', href: href('doctors') })
      })}
      ${doctorsStage()}
      <div class="mt-4">${note(t('doctors.placeholderLead'), 'info')}</div>
    </div>
  </section>`;
}
