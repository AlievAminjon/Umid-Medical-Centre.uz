/* ============================================================
   Запись на приём: форма (модальная и встроенная), валидация,
   отправка и состояние успеха.
   Одна и та же форма используется в модальном окне и в секции
   «Удобная запись» на главной — различаются только id полей.
   ============================================================ */
import { icon } from '../lib/icons.js';
import { esc, t, href, waLink } from '../lib/core.js';
import { CLINIC, SERVICES } from '../data/clinic.js';
import { btn } from './ui.js';

const TIME_KEYS = ['morning', 'day', 'evening', 'night'];

export function bookingModal() {
  return `<div class="modal" id="booking" data-open="false" role="dialog" aria-modal="true" aria-labelledby="booking-title">
    <div class="modal__scrim" data-close-modal></div>
    <div class="modal__box" role="document">
      <button class="modal__close" data-close-modal aria-label="${esc(t('common.close'))}">${icon('close')}</button>
      <div id="booking-content"></div>
    </div>
  </div>`;
}

/**
 * Разметка формы. Пересобирается при открытии — так она всегда
 * на актуальном языке.
 * @param {string} preselect  slug предвыбранной услуги
 * @param {object} o          { id, p } — id формы и префикс id полей
 */
export function bookingFields(preselect = '', o = {}) {
  const p = o.p || 'bf';
  const today = new Date().toISOString().slice(0, 10);
  return `<form novalidate id="${o.id || 'booking-form'}" data-booking-form>
      <div class="form-grid">
        <div class="field">
          <label for="${p}-name">${esc(t('booking.fields.name'))} <span class="req">*</span></label>
          <input class="input" id="${p}-name" name="name" type="text" autocomplete="name" placeholder="${esc(t('booking.ph.name'))}" required>
          <span class="field__err">${icon('alert')}${esc(t('booking.errors.name'))}</span>
        </div>
        <div class="field">
          <label for="${p}-phone">${esc(t('booking.fields.phone'))} <span class="req">*</span></label>
          <input class="input" id="${p}-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="${esc(t('booking.ph.phone'))}" required>
          <span class="field__err">${icon('alert')}${esc(t('booking.errors.phone'))}</span>
        </div>
        <div class="field col-2">
          <label for="${p}-service">${esc(t('booking.fields.service'))}</label>
          <select class="select" id="${p}-service" name="service">
            <option value="">${esc(t('booking.selectService'))}</option>
            ${SERVICES.map((s) => `<option value="${s.slug}" ${s.slug === preselect ? 'selected' : ''}>${esc(t(`services.items.${s.slug}.name`))}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="${p}-date">${esc(t('booking.fields.date'))}</label>
          <input class="input" id="${p}-date" name="date" type="date" min="${today}">
        </div>
        <div class="field">
          <label for="${p}-time">${esc(t('booking.fields.time'))}</label>
          <select class="select" id="${p}-time" name="time">
            <option value="">${esc(t('booking.anyTime'))}</option>
            ${TIME_KEYS.map((k) => `<option value="${k}">${esc(t('booking.times.' + k))}</option>`).join('')}
          </select>
        </div>
        <div class="field col-2">
          <label for="${p}-comment">${esc(t('booking.fields.comment'))}</label>
          <textarea class="textarea" id="${p}-comment" name="comment" rows="3" placeholder="${esc(t('booking.ph.comment'))}"></textarea>
        </div>
      </div>

      <!-- Ловушка для ботов: человек это поле не видит и не заполняет -->
      <div class="hp" aria-hidden="true">
        <label for="${p}-website">Website</label>
        <input id="${p}-website" name="website" type="text" tabindex="-1" autocomplete="off">
      </div>

      <div class="field mt-3" data-consent>
        <label class="consent">
          <input type="checkbox" name="consent" id="${p}-consent">
          <span>${esc(t('booking.consent'))} <a href="${href('privacy')}" data-close-modal>${esc(t('booking.consentLink'))}</a></span>
        </label>
        <span class="field__err">${icon('alert')}${esc(t('booking.errors.consent'))}</span>
      </div>

      <div class="mt-3">${btn({ variant: 'primary', label: t('booking.submit'), icon: 'check', block: true, size: 'lg', type: 'submit' })}</div>
    </form>`;
}

/** Форма в модальном окне: заголовок + поля + альтернативные каналы. */
export function bookingForm(preselect = '') {
  return `
    <div class="modal__head">
      <h3 id="booking-title">${esc(t('booking.title'))}</h3>
      <p>${esc(t('booking.lead'))}</p>
    </div>
    ${bookingFields(preselect)}

    <div class="modal__alt">
      <p>${esc(t('booking.altText'))}</p>
      <div class="row">
        ${btn({ variant: 'tg', label: 'Telegram', icon: 'telegram', href: CLINIC.telegram, target: '_blank', size: 'sm' })}
        ${btn({ variant: 'wa', label: 'WhatsApp', icon: 'whatsapp', href: waLink(t('booking.waMessage')), target: '_blank', size: 'sm' })}
        ${btn({ variant: 'ghost', label: t('common.call'), icon: 'phone', href: CLINIC.phoneHref, size: 'sm' })}
      </div>
    </div>`;
}

/* ---------- Валидация ---------- */
const PHONE_RE = /^[+\d][\d\s()\-]{8,19}$/;

export function validate(form) {
  let ok = true;
  const setErr = (el, bad) => {
    const field = el.closest('.field');
    if (field) field.dataset.invalid = bad ? 'true' : 'false';
    if (bad) ok = false;
  };
  /* form.elements, а не form.name — у формы есть собственное свойство name. */
  const el = form.elements;
  const name = el.name, phone = el.phone, consent = el.consent;
  setErr(name, name.value.trim().length < 2);
  setErr(phone, !PHONE_RE.test(phone.value.trim().replace(/\s+/g, ' ')));
  setErr(consent, !consent.checked);
  return ok;
}

/* ---------- Отправка ----------
   Заявка уходит на CLINIC.bookingEndpoint (Vercel-функция api/booking.js,
   она пересылает её в Telegram клиники). Персональные данные в браузере
   не сохраняются.
   Возвращает { delivered }: false — функция не настроена (503), недоступна
   или ответила ошибкой. Тогда показывается демо-сценарий: экран успеха
   с просьбой продублировать заявку в Telegram/WhatsApp. */
const SUBMIT_TIMEOUT = 12000;

export async function submitBooking(data) {
  const endpoint = CLINIC.bookingEndpoint;
  /* С диска (file://) серверной функции нет — сразу демо-сценарий */
  const canSend = endpoint && typeof fetch === 'function' && /^https?:$/.test(window.location.protocol);
  if (!canSend) {
    await new Promise((r) => setTimeout(r, 500));
    return { delivered: false };
  }
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), SUBMIT_TIMEOUT) : null;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl ? ctrl.signal : undefined
    });
    return { delivered: res.ok, status: res.status };
  } catch (err) {
    return { delivered: false, error: err };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/* ---------- Экран успеха ---------- */
export function successView(data, o = {}) {
  const svc = data.service ? t(`services.items.${data.service}.name`) : t('booking.selectService');
  const when = [data.date, data.time ? t('booking.times.' + data.time) : t('booking.anyTime')].filter(Boolean).join(' · ');
  const message = [
    t('booking.waMessage'),
    `${t('booking.success.labels.name')}: ${data.name}`,
    `${t('booking.success.labels.phone')}: ${data.phone}`,
    `${t('booking.success.labels.service')}: ${svc}`,
    `${t('booking.success.labels.when')}: ${when}`,
    data.comment ? `— ${data.comment}` : ''
  ].filter(Boolean).join('\n');

  /* В модальном окне кнопка закрывает окно, во встроенной секции — возвращает к сайту. */
  const closeBtn = o.inline
    ? btn({ variant: 'ghost', label: t('booking.success.close'), block: true, data: 'data-booking-reset' })
    : btn({ variant: 'ghost', label: t('booking.success.close'), block: true, data: 'data-close-modal' });

  return `<div class="success">
    <div class="success__ico">${icon('checkCircle')}</div>
    <h3>${esc(t('booking.success.title'))}</h3>
    <p>${esc(t('booking.success.text'))}</p>
    <div class="success__summary">
      <div><span>${esc(t('booking.success.labels.name'))}</span><b>${esc(data.name)}</b></div>
      <div><span>${esc(t('booking.success.labels.phone'))}</span><b>${esc(data.phone)}</b></div>
      <div><span>${esc(t('booking.success.labels.service'))}</span><b>${esc(svc)}</b></div>
      <div><span>${esc(t('booking.success.labels.when'))}</span><b>${esc(when)}</b></div>
    </div>
    <div style="width:100%">
      <p class="small muted mb-2 tc"><b>${esc(t('booking.success.dupTitle'))}</b><br>${esc(t('booking.success.dupText'))}</p>
      <div class="row" style="justify-content:center">
        ${btn({ variant: 'tg', label: 'Telegram', icon: 'telegram', href: CLINIC.telegram, target: '_blank', size: 'sm' })}
        ${btn({ variant: 'wa', label: 'WhatsApp', icon: 'whatsapp', href: waLink(message), target: '_blank', size: 'sm' })}
      </div>
    </div>
    ${closeBtn}
    ${o.delivered ? '' : `<p class="small muted" style="font-size:.76rem" data-demo-note>${esc(t('booking.demoNote'))}</p>`}
  </div>`;
}
