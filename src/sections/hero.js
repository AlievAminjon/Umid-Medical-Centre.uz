/* ============================================================
   HERO — первый экран: копирайт слева, видео-сцена справа.
   Главный ролик меняется местами с выбранной миниатюрой,
   вся сцена живёт в лёгком 3D-параллаксе от курсора.
   ============================================================ */
import { icon, iconFilled } from '../lib/icons.js';
import { esc, t, tl } from '../lib/core.js';
import { CLINIC } from '../data/clinic.js';
import { VIDEOS } from '../lib/assets.js';
import { btn, bookBtn, frame, liveChip, maskLine } from '../components/ui.js';

const HERO_FACT_ICONS = ['clock', 'pin', 'phone'];
const MAX_THUMBS = 3;

/** Плавающая карточка поверх видео. Данные — из словаря, а не из вёрстки. */
function heroFloat(key, ic, mod, depth) {
  return `<div class="hero__float hero__float--${mod} parallax" style="--depth:${depth}">
    <div class="hero__float-in">
      <span class="icon-tile icon-tile--sm">${icon(ic)}</span>
      <span>
        <b>${esc(t(`home.hero.${key}.b`))}</b>
        <span>${esc(t(`home.hero.${key}.s`))}</span>
      </span>
    </div>
  </div>`;
}

/* ---------------- Видео первого экрана ---------------- */

/** Ролики, доступные сборке. Пусто → первый экран покажет фотографию. */
const clips = () => (Array.isArray(VIDEOS) ? VIDEOS : []);

/** Один слот проигрывателя. Их два — чтобы смена шла перекрытием, без вспышки. */
function videoSlot(clip, i) {
  return `<video class="vplayer__video${i === 0 ? ' is-active' : ''}" data-vslot="${i}"
    ${clip ? `src="${esc(clip.src)}"` : ''} ${clip && clip.poster ? `poster="${clip.poster}"` : ''}
    muted loop playsinline preload="${i === 0 ? 'auto' : 'none'}"
    tabindex="-1" aria-hidden="true"></video>`;
}

function videoThumb(clip, i, label) {
  return `<button class="vthumb" type="button" data-vthumb="${i}" aria-label="${esc(label)}">
    <span class="vthumb__media">
      <video muted loop playsinline preload="metadata" src="${esc(clip.src)}"
        ${clip.poster ? `poster="${clip.poster}"` : ''} tabindex="-1" aria-hidden="true"></video>
      <span class="vthumb__veil"></span>
    </span>
    <span class="vthumb__play">${iconFilled('playSolid')}</span>
  </button>`;
}

/** Главный проигрыватель. Без роликов — прежняя фотография первого экрана. */
function videoMain() {
  const list = clips();
  if (!list.length) {
    return `<div class="hero__player hero__player--photo parallax parallax--tilt" style="--depth:.45">
      ${frame('hero', { fill: true, tint: true, eager: true, tag: 'UMID', title: t('about.gallery.0.t'), hint: t('about.galleryLead') })}
    </div>`;
  }
  return `<div class="hero__player parallax parallax--tilt" style="--depth:.45">
    <div class="vplayer" data-vplayer data-state="paused">
      <div class="vplayer__frame">
        ${videoSlot(list[0], 0)}
        ${videoSlot(null, 1)}
        <span class="vplayer__veil" aria-hidden="true"></span>
        <span class="vplayer__shine" aria-hidden="true"></span>
        <span class="vplayer__tag">${esc(t('home.hero.videoLabel'))}</span>
        <button class="vplayer__toggle" type="button" data-video-toggle
          aria-label="${esc(t('common.play'))}" aria-pressed="false">
          <span class="vplayer__ico vplayer__ico--play">${iconFilled('playSolid')}</span>
          <span class="vplayer__ico vplayer__ico--pause">${iconFilled('pauseSolid')}</span>
        </button>
      </div>
    </div>
  </div>`;
}

/** Ряд миниатюр под главным роликом. */
function videoThumbs() {
  const list = clips().slice(1, 1 + MAX_THUMBS);
  if (!list.length) return '';
  const label = t('home.hero.videoLabel');
  return `<div class="vthumbs" data-vthumbs data-reveal="up" data-reveal-delay="6">
    ${list.map((c, i) => videoThumb(c, i, `${label} ${i + 2}`)).join('')}
  </div>`;
}

/* ---------------- Разметка секции ---------------- */

export function heroSection() {
  const stats = tl('home.hero.stats');
  const facts = tl('home.hero.facts');
  return `<section class="hero" data-parallax-scene>
    <div class="hero__ambient parallax" style="--depth:.14" aria-hidden="true">
      <span class="hero__glow hero__glow--a"></span>
      <span class="hero__glow hero__glow--b"></span>
    </div>
    <div class="dotgrid"></div>

    <div class="container container--wide">
      <div class="hero__grid">

        <div class="hero__copy">
          <div data-reveal="fade">${liveChip(t('home.hero.badge'))}</div>

          <h1 class="hero__title" data-reveal="fade">
            ${maskLine(esc(t('home.hero.titleA')))}
            ${maskLine(`<span class="accent">${esc(t('home.hero.titleB'))}</span>`)}
            ${maskLine(esc(t('home.hero.titleC')))}
          </h1>

          <p class="hero__lead" data-reveal="up" data-reveal-delay="5">${esc(t('home.hero.lead'))}</p>

          <div class="hero__cta" data-reveal="up" data-reveal-delay="6">
            ${bookBtn({ size: 'lg' })}
            ${btn({ variant: 'tg', label: t('common.telegram'), icon: 'telegram', href: CLINIC.telegram, target: '_blank' })}
            ${btn({ variant: 'wa', label: t('common.whatsapp'), icon: 'whatsapp', href: CLINIC.whatsapp, target: '_blank' })}
          </div>

          <div class="hero__stats" data-reveal="up" data-reveal-delay="7" data-stagger="70">
            ${stats.map((s) => `<div class="hero__stat" data-reveal="up-sm">
              <b class="display-num">${esc(s.t)}</b>
              <span>${esc(s.d)}</span>
            </div>`).join('')}
          </div>
        </div>

        <div class="hero__stage" data-reveal="fade" data-reveal-delay="3">
          <div class="hero__media">
            <div class="hero__rings parallax" style="--depth:.3" aria-hidden="true">
              <span class="hero__ring hero__ring--1"></span>
              <span class="hero__ring hero__ring--2"></span>
              <span class="hero__spark hero__spark--1"></span>
              <span class="hero__spark hero__spark--2"></span>
              <span class="hero__spark hero__spark--3"></span>
            </div>
            ${videoMain()}
            <div class="hero__floats">
              ${heroFloat('floatA', 'clock', 'a', .95)}
              ${heroFloat('floatB', 'shield', 'b', -.8)}
              ${heroFloat('floatC', 'microscope', 'c', 1.05)}
            </div>
          </div>
          ${videoThumbs()}
        </div>

      </div>

      <div class="hero__band" data-reveal="up" data-reveal-delay="8">
        ${facts.map((f, i) => `<div class="hero__band-item">
          <span class="icon-tile icon-tile--sm">${icon(HERO_FACT_ICONS[i] || 'check')}</span>
          <div><b>${esc(f.t)}</b><span>${esc(f.d)}</span></div>
        </div>`).join('')}
      </div>
    </div>
  </section>`;
}

/* ============================================================
   Поведение проигрывателя.
   Модель состояния — порядок роликов: order[0] это главный,
   остальные идут по миниатюрам слева направо. Выбор миниатюры
   меняет местами именно её и главный ролик, позиции остальных
   не съезжают.
   ============================================================ */

let videoCleanup = null;

const reducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initHeroVideo(root = document) {
  if (videoCleanup) { videoCleanup(); videoCleanup = null; }

  const list = clips();
  const player = root.querySelector('[data-vplayer]');
  if (!player || !list.length) return;

  const slots = Array.from(player.querySelectorAll('[data-vslot]'));
  const toggle = player.querySelector('[data-video-toggle]');
  const thumbBox = root.querySelector('[data-vthumbs]');
  const thumbs = thumbBox ? Array.from(thumbBox.querySelectorAll('[data-vthumb]')) : [];
  if (slots.length < 2) return;

  /* order[0] — главный ролик, дальше по миниатюрам слева направо */
  const order = list.map((_, i) => i);
  let active = 0;              /* какой из двух слотов сейчас на экране */
  let wantPlay = !reducedMotion();
  let busy = false;
  let timers = [];

  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
  const current = () => slots[active];

  function setState(playing) {
    player.dataset.state = playing ? 'playing' : 'paused';
    if (!toggle) return;
    toggle.setAttribute('aria-pressed', String(playing));
    toggle.setAttribute('aria-label', t(playing ? 'common.pause' : 'common.play'));
  }

  /** Запуск с честной обработкой запрета автоплея: тогда просто первый кадр. */
  function tryPlay(video) {
    const p = video.play();
    if (p && typeof p.then === 'function') {
      p.then(() => setState(true)).catch(() => { wantPlay = false; setState(false); });
    } else setState(true);
  }

  /* --- Смена главного ролика перекрытием двух слотов --- */
  function activate(clipIndex) {
    const next = slots[active === 0 ? 1 : 0];
    const prev = current();
    const clip = list[clipIndex];
    busy = true;

    next.src = clip.src;
    if (clip.poster) next.setAttribute('poster', clip.poster); else next.removeAttribute('poster');
    next.currentTime = 0;
    next.preload = 'auto';
    next.load();

    const show = () => {
      if (!busy) return;
      busy = false;
      next.classList.add('is-active');
      prev.classList.remove('is-active');
      active = active === 0 ? 1 : 0;
      later(() => { prev.pause(); prev.removeAttribute('src'); prev.load(); }, 520);
      if (wantPlay) tryPlay(next); else setState(false);
    };

    next.addEventListener('loadeddata', show, { once: true });
    /* Страховка: если данные не пришли, всё равно показываем слот */
    later(show, 900);
  }

  /** Перерисовка миниатюр под текущий порядок — без перестановки самих кнопок. */
  function paintThumbs() {
    thumbs.forEach((btnEl, i) => {
      const clip = list[order[i + 1]];
      if (!clip) return;
      const v = btnEl.querySelector('video');
      if (!v || v.getAttribute('src') === clip.src) return;
      btnEl.classList.add('is-swapping');
      later(() => {
        v.setAttribute('src', clip.src);
        if (clip.poster) v.setAttribute('poster', clip.poster); else v.removeAttribute('poster');
        v.load();
        btnEl.classList.remove('is-swapping');
      }, 200);
    });
  }

  function selectThumb(i) {
    if (busy || order[i + 1] === undefined) return;
    const tmp = order[0];
    order[0] = order[i + 1];
    order[i + 1] = tmp;
    activate(order[0]);
    paintThumbs();
  }

  /* --- События --- */
  const onToggle = () => {
    const v = current();
    if (v.paused) { wantPlay = true; tryPlay(v); }
    else { wantPlay = false; v.pause(); setState(false); }
  };
  if (toggle) toggle.addEventListener('click', onToggle);

  const onThumb = (e) => {
    const el = e.target.closest('[data-vthumb]');
    if (!el) return;
    selectThumb(Number(el.dataset.vthumb));
  };
  if (thumbBox) thumbBox.addEventListener('click', onThumb);

  /* Наведение оживляет миниатюру — но только там, где есть настоящий курсор */
  const hoverable = typeof window.matchMedia === 'function'
    && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion();
  const hoverIn = (e) => { const v = e.currentTarget.querySelector('video'); if (v) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } };
  const hoverOut = (e) => { const v = e.currentTarget.querySelector('video'); if (v) { v.pause(); v.currentTime = 0; } };
  if (hoverable) thumbs.forEach((b) => { b.addEventListener('pointerenter', hoverIn); b.addEventListener('pointerleave', hoverOut); });

  /* Ушли со сцены — гасим воспроизведение, чтобы не греть страницу зря */
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        const v = current();
        if (en.isIntersecting) { if (wantPlay && v.paused) tryPlay(v); }
        else if (!v.paused) { v.pause(); setState(false); }
      });
    }, { threshold: 0.12 });
    io.observe(player);
  }

  /* Первый ролик стартует сам; если браузер не даст — останется первый кадр */
  const first = slots[0];
  if (wantPlay) tryPlay(first); else setState(false);
  first.addEventListener('play', () => setState(true));
  first.addEventListener('pause', () => { if (!busy) setState(false); });
  slots[1].addEventListener('play', () => setState(true));
  slots[1].addEventListener('pause', () => { if (!busy) setState(false); });

  videoCleanup = () => {
    timers.forEach(clearTimeout);
    timers = [];
    if (toggle) toggle.removeEventListener('click', onToggle);
    if (thumbBox) thumbBox.removeEventListener('click', onThumb);
    if (hoverable) thumbs.forEach((b) => { b.removeEventListener('pointerenter', hoverIn); b.removeEventListener('pointerleave', hoverOut); });
    if (io) io.disconnect();
    slots.forEach((v) => { try { v.pause(); } catch { /* элемент уже удалён */ } });
  };
}
