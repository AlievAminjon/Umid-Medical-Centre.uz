import { esc, t, href } from '../lib/core.js';
import { CLINIC } from '../data/clinic.js';
import { btn, bookBtn, pageHero, ctaBand, note, chip, liveChip } from '../components/ui.js';
import { mapBlock, contactInfo } from '../sections/contacts-panel.js';
import { bookingSection } from '../sections/booking-panel.js';

export default function contactsPage() {
  return pageHero({
    title: t('contacts.title'),
    lead: t('contacts.lead'),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t('nav.contacts') }],
    meta: `${liveChip(t('common.open24'))}${chip('phone', CLINIC.phone)}${chip('pin', t('common.addressShort'))}`
  }) + `
  <section class="section">
    <div class="container container--wide">
      <div class="contact-grid">
        <div>
          ${contactInfo()}
          <div class="mt-4">${bookBtn({ block: true, size: 'lg' })}</div>
        </div>

        <div>
          ${mapBlock()}
          <div class="mt-3">${note(t('contacts.mapNote'), 'info')}</div>

          <div class="card mt-4" data-reveal="up">
            <h3>${esc(t('contacts.formTitle'))}</h3>
            <p class="muted mt-2 small">${esc(t('contacts.formLead'))}</p>
            <div class="mt-3 row">
              ${bookBtn({ label: t('contacts.formTitle') })}
              ${btn({ variant: 'ghost', label: CLINIC.phone, icon: 'phone', href: CLINIC.phoneHref })}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  ` + bookingSection() + ctaBand();
}
