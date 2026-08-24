/* ============================================================
   CONTACTS — финальный контактный блок: адрес, режим, телефон,
   мессенджеры и карта. Точка на карте появится после того, как
   клиника подтвердит координаты; пока — стилизованная схема
   со ссылками на Google и Яндекс.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t } from '../lib/core.js';
import { CLINIC, mapLinks } from '../data/clinic.js';
import { btn, bookBtn, secHead, note, maskLines } from '../components/ui.js';

export function mapBlock() {
  return `<div class="map" data-reveal="scale" role="img" aria-label="${esc(t('common.addressFull'))}">
    <div class="map__pin">
      <span class="map__dot"></span>
      <div class="map__card">
        <b>${esc(CLINIC.name)}</b>
        <span>${esc(t('common.addressFull'))}</span>
      </div>
    </div>
    <div class="map__actions">
      ${btn({ variant: 'glass', label: t('contacts.openGoogle'), icon: 'mapPlus', href: mapLinks.google, target: '_blank', size: 'sm' })}
      ${btn({ variant: 'glass', label: t('contacts.openYandex'), icon: 'route', href: mapLinks.yandex, target: '_blank', size: 'sm' })}
    </div>
  </div>`;
}

/** Список контактных данных — используется на главной и в «Контактах». */
export function contactInfo() {
  const item = (ic, label, body, sub) => `<div class="cinfo__item" data-reveal="up-sm">
    <span class="icon-tile icon-tile--sm">${icon(ic)}</span>
    <div>
      <b>${esc(label)}</b>
      ${body}
      ${sub ? `<small>${esc(sub)}</small>` : ''}
    </div>
  </div>`;

  return `<div class="cinfo" data-stagger="80">
    ${item('pin', t('contacts.labels.address'), `<p>${esc(t('common.addressFull'))}</p>`)}
    ${item('phone', t('contacts.labels.phone'), `<p><a href="${CLINIC.phoneHref}">${esc(CLINIC.phone)}</a></p>`)}
    ${item('clock', t('contacts.labels.hours'), `<p>${esc(t('common.hours'))}</p>`, t('contacts.hoursNote'))}
    ${item('chat', t('contacts.labels.messengers'), `<div class="row mt-1">
      ${btn({ variant: 'tg', label: 'Telegram', icon: 'telegram', href: CLINIC.telegram, target: '_blank', size: 'sm' })}
      ${btn({ variant: 'wa', label: 'WhatsApp', icon: 'whatsapp', href: CLINIC.whatsapp, target: '_blank', size: 'sm' })}
    </div>`)}
    ${item('route', t('contacts.landmarksTitle'), '', t('contacts.landmarksText'))}
  </div>`;
}

export function contactsSection() {
  return `<section class="section section--stone">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('home.contacts.eyebrow'),
        titleLines: [esc(t('home.contacts.title'))],
        lead: t('home.contacts.lead'),
        right: bookBtn({ size: 'lg' })
      })}
      <div class="contact-grid">
        <div>
          ${contactInfo()}
        </div>
        <div>
          ${mapBlock()}
          <div class="mt-3">${note(t('contacts.mapNote'), 'info')}</div>
        </div>
      </div>
    </div>
  </section>`;
}
