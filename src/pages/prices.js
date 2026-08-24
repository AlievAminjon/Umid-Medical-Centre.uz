import { icon } from '../lib/icons.js';
import { esc, t, href, money } from '../lib/core.js';
import { PRICE_CATEGORIES, PRICES, CLINIC } from '../data/clinic.js';
import { btn, pageHero, ctaBand, note, chip, badge } from '../components/ui.js';

const pricesApproved = () => Object.keys(PRICES).length > 0;

/** Строка прайса. Пока цена не утверждена — вместо суммы живой контакт. */
function priceRow(catId, itemId) {
  const name = t(`prices.categories.${catId}.items.${itemId}`);
  const value = PRICES[itemId];
  const val = value != null
    ? `<span class="prow__val"><em>${esc(t('common.from'))}</em>${money(value)} ${esc(t('common.currency'))}</span>`
    : `<a class="prow__ask" href="${CLINIC.telegram}" target="_blank" rel="noopener">${icon('chat')}${esc(t('prices.ask'))}</a>`;
  return `<div class="prow" data-price-row data-name="${esc(name.toLowerCase())}">
    <span class="prow__name">${esc(name)}</span>
    ${val}
  </div>`;
}

export default function pricesPage() {
  return pageHero({
    title: t('prices.title'),
    lead: t('prices.lead'),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t('nav.prices') }],
    meta: `${chip('wallet', t('common.currency'))}${chip('clock', t('common.hours'))}`
  }) + `
  <section class="section">
    <div class="container container--wide">
      ${pricesApproved() ? '' : `<div class="mb-4">${note(t('prices.pendingText'), 'info')}</div>`}

      <div class="price-tools" data-reveal="up">
        <label class="search">
          <span class="sr-only">${esc(t('prices.search'))}</span>
          ${icon('search')}
          <input type="search" id="price-search" placeholder="${esc(t('prices.search'))}" autocomplete="off">
        </label>
        <div class="pills" role="group">
          <button class="pill" data-cat="all" aria-pressed="true">${esc(t('prices.all'))}</button>
          ${PRICE_CATEGORIES.map((c) => `<button class="pill" data-cat="${c.id}" aria-pressed="false">${esc(t(`prices.categories.${c.id}.name`))}</button>`).join('')}
        </div>
      </div>

      <div id="price-list" data-stagger="70">
        ${PRICE_CATEGORIES.map((c) => `
          <section class="pricecat" data-cat-block="${c.id}" data-reveal="up-sm">
            <div class="pricecat__head">
              <span class="icon-tile icon-tile--sm">${icon(c.icon)}</span>
              <h3>${esc(t(`prices.categories.${c.id}.name`))}</h3>
              ${pricesApproved() ? '' : badge(t('common.onRequest'), 'badge--soon')}
            </div>
            ${c.items.map((i) => priceRow(c.id, i)).join('')}
          </section>`).join('')}
      </div>

      <div class="empty mt-3" id="price-empty" hidden>
        <span class="icon-tile icon-tile--lg">${icon('search')}</span>
        <b>${esc(t('prices.empty'))}</b>
        <div class="row mt-2" style="justify-content:center">
          ${btn({ variant: 'tg', label: t('prices.ask'), icon: 'telegram', href: CLINIC.telegram, target: '_blank', size: 'sm' })}
        </div>
      </div>

      <div class="mt-5">${note(t('prices.note'))}</div>
    </div>
  </section>` + ctaBand();
}
