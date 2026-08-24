import { icon } from '../lib/icons.js';
import { esc, t, tl, href, priceFrom } from '../lib/core.js';
import { SERVICES, RELATED, CLINIC } from '../data/clinic.js';
import { btn, bookBtn, secHead, frame, servicesGrid, accordion, pageHero, ctaBand, note, chip, crumbs, maskLines } from '../components/ui.js';

export function servicesPage() {
  return pageHero({
    title: t('services.title'),
    lead: t('services.lead'),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t('nav.services') }],
    meta: `${chip('clock', t('common.hours'))}${chip('pin', t('common.addressShort'))}`
  }) + `
  <section class="section">
    <div class="container container--wide">
      ${servicesGrid(SERVICES.map((s) => s.slug))}
      <div class="mt-5">${note(t('prices.note'))}</div>
    </div>
  </section>` + ctaBand();
}

export function servicePage(slug) {
  const s = SERVICES.find((x) => x.slug === slug);
  const base = `services.items.${slug}`;
  const name = t(`${base}.name`);
  const when = tl(`${base}.when`);
  const stages = tl(`${base}.stages`);
  const factors = tl(`${base}.factors`);
  const faq = tl(`${base}.faq`);
  const price = priceFrom(s?.price);
  const related = (RELATED[slug] || []).slice(0, 3);

  return `
  <section class="phero">
    <div class="aurora"></div>
    <div class="dotgrid"></div>
    <div class="container">
      <div class="phero__inner">
        ${crumbs([
          { label: t('nav.home'), href: href('home') },
          { label: t('nav.services'), href: href('services') },
          { label: name }
        ])}
        <div class="mb-3" data-reveal="scale"><span class="icon-tile icon-tile--ink icon-tile--lg">${icon(s?.icon || 'tooth')}</span></div>
        <h1 data-reveal="fade">${maskLines([esc(name)])}</h1>
        <p class="lead mt-3" data-reveal="up" data-reveal-delay="2">${esc(t(`${base}.short`))}</p>
        <div class="phero__meta" data-reveal="up" data-reveal-delay="3">
          ${chip('wallet', price || t('common.askPrice'))}
          ${chip('clock', t('common.hoursShort'))}
          ${chip('pin', t('common.city'))}
        </div>
        <div class="row mt-4" data-reveal="up" data-reveal-delay="4">
          ${bookBtn({ service: slug, size: 'lg' })}
          ${btn({ variant: 'tg', label: t('common.telegram'), icon: 'telegram', href: CLINIC.telegram, target: '_blank', size: 'lg' })}
          ${btn({ variant: 'ghost', label: t('common.call'), icon: 'phone', href: CLINIC.phoneHref, size: 'lg' })}
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container container--wide">
      <div class="split split--wide">
        <div>
          <div class="eyebrow" data-reveal="fade">${esc(t('services.labels.about'))}</div>
          <h2 data-reveal="fade">${maskLines([esc(name)])}</h2>
          <p class="lead mt-3" data-reveal="up" data-reveal-delay="3">${esc(t(`${base}.intro`))}</p>
          <h3 class="mt-5" data-reveal="up">${esc(t('services.labels.when'))}</h3>
          <ul class="checklist mt-3" data-stagger="80">
            ${when.map((w) => `<li data-reveal="up-sm">${icon('check')}<div><span style="color:var(--graphite)">${esc(w)}</span></div></li>`).join('')}
          </ul>
        </div>
        <div data-reveal="clip">
          ${frame('cabinet', { ratio: '4/4.4', tag: 'service', title: name, hint: t('about.galleryLead') })}
        </div>
      </div>
    </div>
  </section>

  <section class="section section--sky">
    <div class="gridlines"></div>
    <div class="container container--wide" style="position:relative;z-index:1">
      ${secHead({ eyebrow: t('services.labels.how'), titleLines: [esc(t('services.labels.stages'))] })}
      <div class="grid g-4" data-stagger="100">
        ${stages.map((st, i) => `<div class="card card--hover" data-reveal="rise">
          <div class="step__num" style="margin:0 0 18px">${String(i + 1).padStart(2, '0')}</div>
          <h4>${esc(st.t)}</h4>
          <p class="small muted mt-2">${esc(st.d)}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container container--wide">
      <div class="split split--wide">
        <div>
          <div class="eyebrow" data-reveal="fade">${esc(t('services.labels.priceLabel'))}</div>
          <h2 data-reveal="fade">${maskLines([esc(t('services.labels.factors'))])}</h2>
          <ul class="checklist mt-4" data-stagger="80">
            ${factors.map((f) => `<li data-reveal="up-sm">${icon('checkCircle')}<div><span style="color:var(--graphite)">${esc(f)}</span></div></li>`).join('')}
          </ul>
          <div class="mt-4">${note(t('prices.note'))}</div>
          <div class="row mt-4" data-reveal="up">
            ${btn({ variant: 'ghost', label: t('services.labels.seePrices'), iconAfter: 'arrowUpRight', href: href('prices') })}
          </div>
        </div>
        <div data-stagger="110">
          <div class="card card--tint" data-reveal="rise">
            <span class="icon-tile icon-tile--ink">${icon('stethoscope')}</span>
            <h3 class="mt-3">${esc(t('services.labels.who'))}</h3>
            <p class="muted mt-2">${esc(t('services.labels.whoText'))}</p>
            <div class="mt-3">${btn({ variant: 'ghost', label: t('nav.doctors'), iconAfter: 'arrowUpRight', href: href('doctors'), size: 'sm' })}</div>
          </div>
          <div class="card mt-3" data-reveal="rise">
            <span class="icon-tile icon-tile--sm">${icon('wallet')}</span>
            <h4 class="mt-3">${esc(t('services.labels.priceLabel'))}</h4>
            <p class="small muted mt-2">${esc(t('services.labels.priceText'))}</p>
            <div class="mt-3">${bookBtn({ service: slug, size: 'sm', block: true })}</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--stone">
    <div class="container container--narrow">
      ${secHead({ eyebrow: t('services.labels.faq'), titleLines: [esc(t('services.labels.faq'))], center: true })}
      ${accordion(faq, { openFirst: true })}
    </div>
  </section>

  <section class="section">
    <div class="container container--wide">
      ${secHead({ titleLines: [esc(t('services.labels.related'))] })}
      ${servicesGrid(related, [{ span: 5, variant: 'soft' }, { span: 4 }, { span: 3, variant: 'soft' }])}
    </div>
  </section>
  ` + ctaBand();
}
