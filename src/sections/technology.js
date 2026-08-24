/* ============================================================
   TECHNOLOGY — тёмная секция «Технологии, которым доверяют»
   Конкретные модели оборудования не указываем: клиника ещё
   не подтвердила перечень. В вёрстке для него готово место.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, tl, href } from '../lib/core.js';
import { btn, frame, note, maskLines } from '../components/ui.js';

export function technologySection() {
  const items = tl('home.tech.items');
  return `<section class="section section--dark">
    <div class="aurora aurora--ink"></div>
    <div class="gridlines"></div>
    <div class="container container--wide">
      <div class="tech">

        <div class="tech__visual" data-reveal="clip">
          ${frame('equipment', { ratio: '4/4.6', tint: true, tag: 'equipment', title: t('about.techTitle'), hint: t('about.galleryLead') })}
          <div class="tech__badge parallax" style="--depth:.8">
            <span class="icon-tile icon-tile--glass icon-tile--sm">${icon('scan')}</span>
            <span>
              <b>${esc(t('home.tech.badge.b'))}</b>
              <span>${esc(t('home.tech.badge.s'))}</span>
            </span>
          </div>
        </div>

        <div>
          <div class="eyebrow" data-reveal="fade">${esc(t('home.tech.eyebrow'))}</div>
          <h2 data-reveal="fade">${maskLines([esc(t('home.tech.title'))])}</h2>
          <p class="lead mt-3" data-reveal="up" data-reveal-delay="3">${esc(t('home.tech.lead'))}</p>

          <div class="tech__list" data-stagger="90">
            ${items.map((it, i) => `<div class="tech__item" data-reveal="up">
              <i>${String(i + 1).padStart(2, '0')}</i>
              <b>${esc(it.t)}</b>
              <span>${esc(it.d)}</span>
            </div>`).join('')}
          </div>

          <div class="mt-4">${note(t('about.techNote'))}</div>

          <div class="row mt-4" data-reveal="up">
            ${btn({ variant: 'onink', label: t('nav.about'), iconAfter: 'arrowUpRight', href: href('about') })}
            ${btn({ variant: 'outline-ink', label: t('nav.services'), iconAfter: 'arrowUpRight', href: href('services') })}
          </div>
        </div>

      </div>
    </div>
  </section>`;
}
