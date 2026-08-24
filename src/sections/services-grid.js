/* ============================================================
   SERVICES — editorial grid: карточки разного размера и тона
   ============================================================ */
import { esc, t, href } from '../lib/core.js';
import { SERVICES } from '../data/clinic.js';
import { btn, secHead, servicesGrid } from '../components/ui.js';

export function servicesSection() {
  return `<section class="section section--sky" id="services">
    <div class="gridlines"></div>
    <div class="container container--wide" style="position:relative;z-index:1">
      ${secHead({
        eyebrow: t('home.services.eyebrow'),
        titleLines: [esc(t('home.services.title'))],
        lead: t('home.services.lead'),
        right: btn({ variant: 'ghost', label: t('home.services.cta'), iconAfter: 'arrowUpRight', href: href('services') })
      })}
      ${servicesGrid(SERVICES.map((s) => s.slug))}
    </div>
  </section>`;
}
