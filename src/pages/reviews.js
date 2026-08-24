import { icon } from '../lib/icons.js';
import { esc, t, href } from '../lib/core.js';
import { CLINIC, REVIEWS } from '../data/clinic.js';
import { btn, secHead, pageHero, ctaBand, stars, badge, maskLines } from '../components/ui.js';
import { reviewsEmpty, reviewSources } from '../sections/reviews-strip.js';

export default function reviewsPage() {
  return pageHero({
    title: t('reviews.title'),
    lead: t('reviews.lead'),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t('nav.reviews') }],
    badgeIcon: 'quote'
  }) + `
  <section class="section">
    <div class="container container--wide">
      <div class="rating-hero" data-reveal="up">
        <div>
          <div class="rating-hero__score">—</div>
          <div class="small muted mt-2">${esc(t('reviews.ratingLabel'))}</div>
        </div>
        <div>
          ${stars(0)}
          <div class="small muted mt-2">${REVIEWS.length} ${esc(t('reviews.countLabel'))}</div>
        </div>
        <div style="margin-left:auto">${badge(t('reviews.pending'), 'badge--soon')}</div>
      </div>

      <div class="mt-4">${reviewsEmpty()}</div>

      <div class="mt-6">
        ${secHead({ titleLines: [esc(t('reviews.sourcesTitle'))], lead: t('reviews.sourcesLead') })}
        ${reviewSources()}
      </div>
    </div>
  </section>

  <section class="section section--stone">
    <div class="container container--narrow tc">
      <div data-reveal="up">
        <span class="icon-tile icon-tile--ink mx-auto">${icon('chat')}</span>
        <h2 class="mt-3">${maskLines([esc(t('reviews.leaveTitle'))])}</h2>
        <p class="lead mt-3 mx-auto" style="max-width:56ch">${esc(t('reviews.leaveLead'))}</p>
      </div>
      <div class="row mt-4" style="justify-content:center" data-reveal="up">
        ${btn({ variant: 'tg', label: t('reviews.leaveCta'), icon: 'telegram', href: CLINIC.telegram, target: '_blank', size: 'lg' })}
        ${btn({ variant: 'ghost', label: t('common.call'), icon: 'phone', href: CLINIC.phoneHref, size: 'lg' })}
      </div>
    </div>
  </section>` + ctaBand();
}
