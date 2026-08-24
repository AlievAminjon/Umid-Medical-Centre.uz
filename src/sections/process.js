/* ============================================================
   TREATMENT PROCESS — понятный план лечения.
   Desktop: горизонтальный таймлайн с линией, которая «чертится».
   Mobile: вертикальный таймлайн.
   ============================================================ */
import { esc, t } from '../lib/core.js';
import { PROCESS } from '../data/clinic.js';
import { secHead } from '../components/ui.js';

/** Переиспользуется на главной, в «О клинике» и «Пациентам». */
export function processSteps() {
  return `<div class="plan">
    <div class="steps" style="--cols:${PROCESS.length}" data-stagger="110">
      <div class="steps__rail" data-rail aria-hidden="true"></div>
      ${PROCESS.map((id, i) => `<div class="step" data-reveal="up">
        <div class="step__num">${String(i + 1).padStart(2, '0')}</div>
        <div><b>${esc(t(`process.${id}.t`))}</b><span>${esc(t(`process.${id}.d`))}</span></div>
      </div>`).join('')}
    </div>
  </div>`;
}

export function processSection() {
  return `<section class="section section--stone">
    <div class="container container--wide">
      ${secHead({
        eyebrow: t('home.process.eyebrow'),
        titleLines: [esc(t('home.process.title'))],
        lead: t('home.process.lead')
      })}
      ${processSteps()}
    </div>
  </section>`;
}
