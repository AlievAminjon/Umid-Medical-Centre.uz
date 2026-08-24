/* ============================================================
   TRUST STRIP — минималистичная полоса доверия под Hero
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, tl } from '../lib/core.js';

const TRUST_ICONS = ['clock', 'microscope', 'users', 'shield'];

export function trustSection() {
  const items = tl('home.trust');
  return `<section class="section section--tight section--flush-top">
    <div class="container container--wide">
      <div class="trust" data-reveal="up" data-stagger="90">
        ${items.map((it, i) => `<div class="trust__item" data-reveal="up-sm">
          <span class="icon-tile icon-tile--sm">${icon(TRUST_ICONS[i] || 'check')}</span>
          <div><b>${esc(it.t)}</b><span>${esc(it.d)}</span></div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}
