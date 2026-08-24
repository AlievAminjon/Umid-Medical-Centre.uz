import { icon } from '../lib/icons.js';
import { esc, t, tl, href } from '../lib/core.js';
import { btn, pageHero, note, ctaBand, maskLines } from '../components/ui.js';

export function legalPage(kind) {
  const base = `legal.${kind}`;
  const blocks = tl(`${base}.blocks`);
  return pageHero({
    title: t(`${base}.title`),
    lead: t(`${base}.lead`),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t(`${base}.title`) }],
    badgeIcon: 'doc'
  }) + `
  <section class="section">
    <div class="container">
      <div class="prose" data-stagger="60">
        ${blocks.map((b) => `
          <div data-reveal="up-sm">
            <h2>${esc(b.h)}</h2>
            ${b.p ? `<p>${esc(b.p)}</p>` : ''}
            ${b.list ? `<ul>${b.list.map((li) => `<li>${esc(li)}</li>`).join('')}</ul>` : ''}
          </div>
        `).join('')}
      </div>
      <div class="mt-5" style="max-width:78ch">${note(t('legal.updated'), 'info')}</div>
      <div class="row mt-4" data-reveal="up">
        ${btn({ variant: 'ghost', label: t('nav.patients'), iconAfter: 'arrowUpRight', href: href('patients') })}
        ${btn({ variant: 'ghost', label: t('nav.contacts'), iconAfter: 'arrowUpRight', href: href('contacts') })}
      </div>
    </div>
  </section>`;
}

export function notFoundPage() {
  return `<section class="nf">
    <div class="aurora"></div>
    <div class="dotgrid"></div>
    <div class="container container--narrow" style="position:relative;z-index:1">
      <div class="nf__code" data-reveal="scale" aria-hidden="true">404</div>
      <div style="margin-top:-2vw">
        <h2 data-reveal="fade">${maskLines([esc(t('notFound.title'))])}</h2>
        <p class="lead mt-3 mx-auto" style="max-width:52ch" data-reveal="up" data-reveal-delay="2">${esc(t('notFound.lead'))}</p>
        <div class="row mt-4" style="justify-content:center" data-reveal="up" data-reveal-delay="3">
          ${btn({ variant: 'primary', label: t('notFound.cta'), iconAfter: 'arrowRight', href: href('home'), size: 'lg' })}
          ${btn({ variant: 'ghost', label: t('nav.services'), href: href('services') })}
          ${btn({ variant: 'ghost', label: t('nav.contacts'), href: href('contacts') })}
        </div>
        <div class="row mt-5" style="justify-content:center;gap:10px" data-reveal="up" data-reveal-delay="4">
          <span class="chip">${icon('phone')}${esc(t('common.call'))}</span>
          <span class="chip">${icon('clock')}${esc(t('common.hours'))}</span>
        </div>
      </div>
    </div>
  </section>` + ctaBand();
}
