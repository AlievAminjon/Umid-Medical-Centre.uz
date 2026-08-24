import { icon } from '../lib/icons.js';
import { esc, t, tl, href } from '../lib/core.js';
import { btn, secHead, frame, pageHero, ctaBand, note, chip, orbit, maskLines } from '../components/ui.js';
import { processSteps } from '../sections/process.js';
import { technologySection } from '../sections/technology.js';

const ABOUT_VALUE_ICONS = ['microscope', 'wallet', 'shield', 'users', 'language', 'clock'];

export default function aboutPage() {
  const story = tl('about.story');
  const values = tl('about.values');
  const gallery = tl('about.gallery');
  const photoKeys = ['facade', 'reception', 'cabinet', 'equipment', 'sterilization', 'team'];

  return pageHero({
    title: t('about.title'),
    lead: t('about.lead'),
    crumbItems: [{ label: t('nav.home'), href: href('home') }, { label: t('nav.about') }],
    meta: `${chip('clock', t('common.hours'))}${chip('pin', t('common.addressFull'))}`
  }) + `

  <section class="section">
    <div class="container container--wide">
      <div class="split split--wide">
        <div>
          <div class="eyebrow" data-reveal="fade">${esc(t('about.storyTitle'))}</div>
          <h2 data-reveal="fade">${maskLines([esc(t('about.storyTitle'))])}</h2>
          <div data-stagger="90" class="mt-3">
            ${story.map((p) => `<p class="lead mt-3" data-reveal="up">${esc(p)}</p>`).join('')}
          </div>
        </div>
        <div class="mosaic" data-reveal="fade" data-stagger="120">
          <!-- В высокой левой ячейке — вертикальный кадр, справа горизонтальные -->
          ${frame('cabinet', { tag: '01', title: gallery[2]?.t, small: true, ratio: '3/4.75' })}
          ${frame('facade', { tag: '02', title: gallery[0]?.t, small: true })}
          ${frame('sterilization', { tag: '03', title: gallery[4]?.t, small: true })}
        </div>
      </div>
    </div>
  </section>

  <section class="section section--sky" data-parallax-scene>
    <div class="aurora"></div>
    <div class="container container--wide">
      ${secHead({ eyebrow: t('about.valuesTitle'), titleLines: [esc(t('about.valuesTitle'))], center: true })}
      <div class="why">
        <div class="why__col why__col--l" data-stagger="110">
          ${values.slice(0, 3).map((v, i) => `<div class="why__item" data-reveal="up-sm">
            <span class="icon-tile icon-tile--sm">${icon(ABOUT_VALUE_ICONS[i])}</span>
            <div><b>${esc(v.t)}</b><span>${esc(v.d)}</span></div>
          </div>`).join('')}
        </div>
        ${orbit('shield')}
        <div class="why__col why__col--r" data-stagger="110" data-stagger-from="140">
          ${values.slice(3, 6).map((v, i) => `<div class="why__item" data-reveal="up-sm">
            <span class="icon-tile icon-tile--sm">${icon(ABOUT_VALUE_ICONS[i + 3])}</span>
            <div><b>${esc(v.t)}</b><span>${esc(v.d)}</span></div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('about.galleryTitle'),
        titleLines: [esc(t('about.galleryTitle'))],
        lead: t('about.galleryLead')
      })}
      <div class="grid g-3" data-stagger="90">
        ${gallery.map((g, i) => `<div data-reveal="rise">
          ${frame(photoKeys[i], { ratio: i === 5 ? '16/9' : '4/3', tag: String(i + 1).padStart(2, '0'), title: g.t, hint: g.d, small: true, shape: 'soft' })}
        </div>`).join('')}
      </div>
    </div>
  </section>

  <section class="section section--stone">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('home.process.eyebrow'),
        titleLines: [esc(t('home.process.title'))],
        lead: t('home.process.lead')
      })}
      ${processSteps()}
    </div>
  </section>
  ` + technologySection() + ctaBand();
}
