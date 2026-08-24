/* ============================================================
   PRICES TEASER — направления прайса и честная оговорка
   о том, что окончательная стоимость определяется после осмотра.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, tl, href } from '../lib/core.js';
import { PRICE_CATEGORIES, CLINIC } from '../data/clinic.js';
import { btn, note, accordion, secHead, maskLines } from '../components/ui.js';

export function pricesTeaser() {
  return `<section class="section">
    <div class="container container--wide">
      <div class="split split--rev">

        <div data-reveal="right">
          <div class="card card--tint">
            <div class="grid g-2" style="gap:8px">
              ${PRICE_CATEGORIES.map((c) => `<a class="row" href="${href('prices')}" style="gap:12px;padding:12px;border-radius:14px;flex-wrap:nowrap">
                <span class="icon-tile icon-tile--sm">${icon(c.icon)}</span>
                <span style="font-size:.9rem;font-weight:650;letter-spacing:-.015em">${esc(t(`prices.categories.${c.id}.name`))}</span>
              </a>`).join('')}
            </div>
          </div>
        </div>

        <div>
          <div class="eyebrow" data-reveal="fade">${esc(t('home.prices.eyebrow'))}</div>
          <h2 data-reveal="fade">${maskLines([esc(t('home.prices.title'))])}</h2>
          <p class="lead mt-3" data-reveal="up" data-reveal-delay="3">${esc(t('home.prices.lead'))}</p>
          <div class="mt-4">${note(t('prices.note'))}</div>
          <div class="row mt-4" data-reveal="up">
            ${btn({ variant: 'primary', label: t('home.prices.cta'), iconAfter: 'arrowUpRight', href: href('prices') })}
            ${btn({ variant: 'ghost', label: t('common.askPrice'), icon: 'chat', href: CLINIC.telegram, target: '_blank' })}
          </div>
        </div>

      </div>
    </div>
  </section>`;
}

export function faqSection() {
  const items = tl('patients.faq').slice(0, 5);
  return `<section class="section section--stone">
    <div class="container container--narrow">
      ${secHead({
        eyebrow: t('home.faq.eyebrow'),
        titleLines: [esc(t('home.faq.title'))],
        lead: t('home.faq.lead'),
        center: true
      })}
      ${accordion(items, { openFirst: true })}
      <div class="mt-4 tc" data-reveal="up">
        ${btn({ variant: 'ghost', label: t('home.faq.cta'), iconAfter: 'arrowUpRight', href: href('patients') })}
      </div>
    </div>
  </section>`;
}
