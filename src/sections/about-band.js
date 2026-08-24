/* ============================================================
   ABOUT BAND — визуальный рассказ о клинике:
   асимметричная мозаика фотографий и принципы работы.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, tl, href } from '../lib/core.js';
import { btn, frame, maskLines } from '../components/ui.js';

export function aboutBand() {
  const points = tl('home.about.points');
  const gallery = tl('about.gallery');
  return `<section class="section">
    <div class="container container--wide">
      <div class="split split--wide">

        <div class="mosaic" data-reveal="fade" data-stagger="120">
          ${frame('reception', { tag: '01', title: gallery[1]?.t, small: true, cls: 'reveal-img', ratio: '3/4.75' })}
          ${frame('cabinet', { tag: '02', title: gallery[2]?.t, small: true })}
          ${frame('equipment', { tag: '03', title: gallery[3]?.t, small: true })}
        </div>

        <div>
          <div class="eyebrow" data-reveal="fade">${esc(t('home.about.eyebrow'))}</div>
          <h2 data-reveal="fade">${maskLines([esc(t('home.about.title'))])}</h2>
          <p class="lead mt-3" data-reveal="up" data-reveal-delay="3">${esc(t('home.about.lead'))}</p>

          <ul class="checklist mt-4" data-stagger="90">
            ${points.map((p) => `<li data-reveal="up-sm">${icon('checkCircle')}<div><b>${esc(p.t)}</b><span>${esc(p.d)}</span></div></li>`).join('')}
          </ul>

          <div class="mt-4" data-reveal="up">
            ${btn({ variant: 'ghost', label: t('home.about.cta'), iconAfter: 'arrowUpRight', href: href('about') })}
          </div>
        </div>

      </div>
    </div>
  </section>`;
}
