import { icon } from '../lib/icons.js';
import { esc, t, href } from '../lib/core.js';
import { CLINIC, DOCTORS } from '../data/clinic.js';
import { btn, bookBtn, frame, pageHero, ctaBand, note, chip, maskLines, secHead } from '../components/ui.js';
import { doctorCard, doctorsStage } from '../sections/doctors-stage.js';

export function doctorsPage() {
  return pageHero({
    title: t('doctors.title'),
    lead: t('doctors.lead'),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t('nav.doctors') }],
    meta: `${chip('users', t('doctors.specialtyLabel'))}${chip('language', t('doctors.langsValue'))}`
  }) + `
  <section class="section">
    <div class="container container--wide">
      ${doctorsStage()}
      <div class="mt-5">${note(t('doctors.placeholderLead'), 'info')}</div>
    </div>
  </section>

  <section class="section section--sky">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('doctors.specialtyLabel'),
        titleLines: [esc(t('doctors.ctaTitle'))],
        lead: t('doctors.ctaLead'),
        center: true
      })}
      <div class="row" style="justify-content:center" data-reveal="up">
        ${bookBtn({ size: 'lg' })}
        ${btn({ variant: 'ghost', label: CLINIC.phone, icon: 'phone', href: CLINIC.phoneHref, size: 'lg' })}
      </div>
    </div>
  </section>` + ctaBand();
}

export function doctorPage(slug) {
  const d = DOCTORS.find((x) => x.slug === slug);
  const name = d.name || t('doctors.placeholderName');
  const spec = d.role || t(`services.items.${d.specialty}.name`);
  const others = DOCTORS.filter((x) => x.slug !== slug).slice(0, 3);

  return pageHero({
    title: name,
    lead: spec,
    crumbItems: [
      { label: t('nav.home'), href: href('home') },
      { label: t('nav.doctors'), href: href('doctors') },
      { label: name }
    ],
    meta: `${chip('award', `${t('doctors.card.experience')}: ${d.experience || t('doctors.pending')}`)}
           ${chip('language', d.langs || t('doctors.langsValue'))}`
  }) + `
  <section class="section">
    <div class="container container--wide">
      <div class="split split--wide">
        <div data-reveal="clip">${frame('team', { ratio: '4/4.6', shape: 'soft', tag: 'doctor', title: t('doctors.photoNote'), hint: t('doctors.placeholderLead') })}</div>
        <div>
          <div class="eyebrow" data-reveal="fade">${esc(t('doctors.specialtyLabel'))}</div>
          <h2 data-reveal="fade">${maskLines([esc(t('doctors.profileTitle'))])}</h2>
          <p class="lead mt-3" data-reveal="up" data-reveal-delay="3">${esc(t('doctors.profileLead'))}</p>

          <div class="card card--flat mt-4" style="border-color:var(--sky-200)" data-reveal="up">
            <div class="grid" style="gap:16px">
              <div><b>${esc(t('doctors.specialtyLabel'))}</b><div class="muted">${esc(spec)}</div></div>
              <hr class="divider">
              <div><b>${esc(t('doctors.card.education'))}</b><div class="muted">${esc(d.education || t('doctors.pending'))}</div></div>
              <hr class="divider">
              <div><b>${esc(t('doctors.card.focus'))}</b><div class="muted">${esc(d.focus || t('doctors.pending'))}</div></div>
              <hr class="divider">
              <div><b>${esc(t('doctors.card.langs'))}</b><div class="muted">${esc(d.langs || t('doctors.langsValue'))}</div></div>
            </div>
          </div>

          <div class="row mt-4" data-reveal="up">
            ${bookBtn({ label: t('doctors.card.book'), service: d.specialty })}
            ${btn({ variant: 'ghost', label: t('nav.doctors'), iconAfter: 'arrowUpRight', href: href('doctors') })}
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--paper">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('nav.doctors'),
        titleLines: [esc(t('home.doctors.title'))],
        right: btn({ variant: 'ghost', label: t('home.doctors.cta'), iconAfter: 'arrowUpRight', href: href('doctors') })
      })}
      <div class="docs" data-stagger="90">
        ${others.map((x, i) => doctorCard(x, i)).join('')}
      </div>
      <div class="mt-5 card card--tint" data-reveal="up">
        <span class="icon-tile icon-tile--ink">${icon('handshake')}</span>
        <h3 class="mt-3">${esc(t('doctors.ctaTitle'))}</h3>
        <p class="muted mt-2">${esc(t('doctors.ctaLead'))}</p>
        <div class="row mt-3">
          ${bookBtn({ size: 'sm' })}
          ${btn({ variant: 'ghost', label: t('common.call'), icon: 'phone', href: CLINIC.phoneHref, size: 'sm' })}
        </div>
      </div>
    </div>
  </section>` + ctaBand();
}
