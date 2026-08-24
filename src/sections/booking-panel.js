/* ============================================================
   BOOKING — «Удобная запись»: большая синяя панель,
   слева каналы связи, справа форма на белой карточке.
   Форма та же, что и в модальном окне, — отличаются только id.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t } from '../lib/core.js';
import { CLINIC } from '../data/clinic.js';
import { maskLines } from '../components/ui.js';
import { bookingFields } from '../components/booking.js';

function channel(ic, title, sub, url, target) {
  return `<a class="bookpanel__ch" href="${url}" ${target ? 'target="_blank" rel="noopener"' : ''} data-reveal="left">
    <span class="icon-tile icon-tile--glass">${icon(ic)}</span>
    <span><b>${esc(title)}</b><span>${esc(sub)}</span></span>
    ${icon('arrowUpRight')}
  </a>`;
}

/** Содержимое белой карточки с формой. Вынесено отдельно,
    чтобы после успешной отправки её можно было вернуть в исходное состояние. */
export function bookingCardInner() {
  return `<h3>${esc(t('booking.title'))}</h3>
    <p class="small muted">${esc(t('booking.lead'))}</p>
    <div class="mt-3">${bookingFields('', { id: 'home-booking-form', p: 'hb' })}</div>
    <p class="bookcard__note">${esc(t('home.booking.formNote'))}</p>`;
}

export function bookingSection() {
  return `<section class="section section--tight" id="booking-section">
    <div class="container container--wide">
      <div class="bookpanel" data-reveal="rise">
        <div class="bookpanel__grid">

          <div>
            <div class="eyebrow">${esc(t('home.booking.eyebrow'))}</div>
            <h2>${maskLines([esc(t('home.booking.title'))])}</h2>
            <p class="lead mt-3">${esc(t('home.booking.lead'))}</p>

            <div class="bookpanel__channels" data-stagger="80">
              ${channel('telegram', 'Telegram', t('home.booking.tgNote'), CLINIC.telegram, true)}
              ${channel('whatsapp', 'WhatsApp', t('home.booking.waNote'), CLINIC.whatsapp, true)}
              ${channel('phone', CLINIC.phone, t('common.hours'), CLINIC.phoneHref, false)}
            </div>
          </div>

          <div class="bookcard" id="home-booking-card">${bookingCardInner()}</div>

        </div>
      </div>
    </div>
  </section>`;
}
