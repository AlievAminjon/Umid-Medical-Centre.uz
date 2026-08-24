import { icon } from '../lib/icons.js';
import { esc, t, tl, href } from '../lib/core.js';
import { DOCUMENTS } from '../data/clinic.js';
import { secHead, tabs, accordion, pageHero, ctaBand, note, badge } from '../components/ui.js';
import { processSteps } from '../sections/process.js';

const PATIENT_TABS = ['visit', 'prepare', 'faq', 'payment', 'docs'];

function panelVisit() {
  return `<div>
    ${secHead({ titleLines: [esc(t('patients.visitTitle'))], lead: t('patients.visitLead') })}
    ${processSteps()}
    <div class="mt-5">${note(t('prices.note'))}</div>
  </div>`;
}

function panelPrepare() {
  const items = tl('patients.prepare');
  const icons = ['doc', 'microscope', 'heart', 'clock', 'gift', 'chat'];
  return `<div>
    ${secHead({ titleLines: [esc(t('patients.prepareTitle'))], lead: t('patients.prepareLead') })}
    <div class="grid g-3" data-stagger="90">
      ${items.map((it, i) => `<div class="card card--hover" data-reveal="rise">
        <span class="icon-tile icon-tile--sm">${icon(icons[i])}</span>
        <h4 class="mt-3">${esc(it.t)}</h4>
        <p class="small muted mt-2">${esc(it.d)}</p>
      </div>`).join('')}
    </div>
  </div>`;
}

function panelFaq() {
  return `<div class="container--narrow" style="padding:0">
    ${secHead({ titleLines: [esc(t('patients.faqTitle'))] })}
    ${accordion(tl('patients.faq'), { openFirst: true })}
  </div>`;
}

function panelPayment() {
  const items = tl('patients.payment');
  return `<div>
    ${secHead({ titleLines: [esc(t('patients.paymentTitle'))], lead: t('patients.paymentLead') })}
    <div class="grid g-3" data-stagger="90">
      ${items.map((it, i) => `<div class="card card--hover" data-reveal="rise">
        <span class="icon-tile icon-tile--sm">${icon(['check', 'wallet', 'card'][i])}</span>
        <h4 class="mt-3">${esc(it.t)}</h4>
        <p class="small muted mt-2">${esc(it.d)}</p>
      </div>`).join('')}
    </div>
    <div class="mt-5">${note(t('prices.note'))}</div>
  </div>`;
}

function panelDocs() {
  return `<div>
    ${secHead({ titleLines: [esc(t('patients.docsTitle'))], lead: t('patients.docsLead') })}
    <div class="doclist" data-stagger="70">
      ${DOCUMENTS.map((d) => {
        const title = t(`patients.documents.${d.id}.t`);
        const sub = t(`patients.documents.${d.id}.d`);
        const inner = `<span class="icon-tile icon-tile--sm">${icon('doc')}</span>
          <span><b>${esc(title)}</b><small>${esc(sub)}</small></span>
          ${d.route || d.file ? `<span class="badge">${esc(t('patients.open'))}</span>` : badge(t('common.soon'), 'badge--soon')}`;
        if (d.route) return `<a class="docitem" href="${href(d.route)}" data-reveal="up-sm">${inner}</a>`;
        if (d.file) return `<a class="docitem" href="${d.file}" target="_blank" rel="noopener" data-reveal="up-sm">${inner}</a>`;
        return `<div class="docitem" data-reveal="up-sm">${inner}</div>`;
      }).join('')}
    </div>
  </div>`;
}

const PATIENT_PANELS = { visit: panelVisit, prepare: panelPrepare, faq: panelFaq, payment: panelPayment, docs: panelDocs };

export default function patientsPage() {
  return pageHero({
    title: t('patients.title'),
    lead: t('patients.lead'),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t('nav.patients') }],
    badgeIcon: 'heart'
  }) + `
  <section class="section">
    <div class="container container--wide">
      <div data-reveal="up">${tabs(PATIENT_TABS.map((id) => ({ id, label: t('patients.tabs.' + id) })))}</div>
      <div class="mt-5" id="patients-panels">
        ${PATIENT_TABS.map((id, i) => `<div data-panel="${id}" ${i ? 'hidden' : ''}>${PATIENT_PANELS[id]()}</div>`).join('')}
      </div>
    </div>
  </section>` + ctaBand();
}
