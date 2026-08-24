/* ============================================================
   REVIEWS — отзывов пока нет, и мы их не придумываем.
   Как только в REVIEWS появятся реальные записи, на этом же
   месте отрисуются карточки — вёрстка не изменится.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, href } from '../lib/core.js';
import { REVIEWS, REVIEW_SOURCES } from '../data/clinic.js';
import { btn, secHead, stars, avatar, badge } from '../components/ui.js';

export function reviewsEmpty() {
  if (REVIEWS.length) {
    return `<div class="reviews" data-stagger="80">${REVIEWS.map((r) => `
      <article class="review" data-reveal="rise">
        ${stars(r.rating)}
        <p class="review__q">${esc(r.text)}</p>
        <div class="review__by">${avatar(r.author)}<div><b>${esc(r.author)}</b><div class="small muted">${esc(r.source || '')}</div></div></div>
      </article>`).join('')}</div>`;
  }
  return `<div class="empty" data-reveal="scale">
    <span class="icon-tile icon-tile--lg">${icon('quote')}</span>
    <b>${esc(t('reviews.emptyTitle'))}</b>
    <p>${esc(t('reviews.emptyText'))}</p>
  </div>`;
}

export function reviewSources() {
  return `<div class="sources" data-reveal="up">
    ${REVIEW_SOURCES.map((s) => s.url
      ? `<a class="source" href="${s.url}" target="_blank" rel="noopener">${icon('star')}${esc(t('reviews.sources.' + s.id))}</a>`
      : `<span class="source" data-disabled="true">${icon('star')}${esc(t('reviews.sources.' + s.id))} ${badge(t('common.soon'), 'badge--soon')}</span>`
    ).join('')}
  </div>`;
}

export function reviewsSection() {
  return `<section class="section section--paper">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('home.reviews.eyebrow'),
        titleLines: [esc(t('home.reviews.title'))],
        lead: t('home.reviews.lead'),
        right: btn({ variant: 'ghost', label: t('nav.reviews'), iconAfter: 'arrowUpRight', href: href('reviews') })
      })}
      ${reviewsEmpty()}
      <div class="mt-4">${reviewSources()}</div>
    </div>
  </section>`;
}
