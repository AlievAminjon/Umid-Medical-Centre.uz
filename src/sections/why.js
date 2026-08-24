/* ============================================================
   WHY UMID — горизонтальная композиция вокруг декоративного
   объекта: три принципа слева, три справа, «орбита» в центре.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, tl } from '../lib/core.js';
import { secHead, orbit } from '../components/ui.js';

const WHY_ICONS = ['microscope', 'wallet', 'shield', 'users', 'language', 'clock'];

function whyItem(v, i) {
  return `<div class="why__item" data-reveal="${i % 2 ? 'up' : 'up-sm'}">
    <span class="icon-tile icon-tile--sm">${icon(WHY_ICONS[i] || 'check')}</span>
    <div><b>${esc(v.t)}</b><span>${esc(v.d)}</span></div>
  </div>`;
}

export function whySection() {
  const values = tl('about.values');
  const left = values.slice(0, 3);
  const right = values.slice(3, 6);
  return `<section class="section" data-parallax-scene>
    <div class="aurora"></div>
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('home.why.eyebrow'),
        titleLines: [esc(t('home.why.title'))],
        lead: t('home.why.lead'),
        center: true,
        cls: 'mx-auto'
      })}

      <div class="why">
        <div class="why__col why__col--l" data-stagger="110">
          ${left.map((v, i) => whyItem(v, i)).join('')}
        </div>
        ${orbit('tooth')}
        <div class="why__col why__col--r" data-stagger="110" data-stagger-from="140">
          ${right.map((v, i) => whyItem(v, i + 3)).join('')}
        </div>
      </div>
    </div>
  </section>`;
}
