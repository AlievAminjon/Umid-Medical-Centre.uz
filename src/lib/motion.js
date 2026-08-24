/* ============================================================
   UMID SIGNATURE — Motion engine
   Единая точка входа для всех анимаций: reveal-сценарии,
   каскад (stagger), параллакс, прогресс-линии, лоадер.
   Всё уважает prefers-reduced-motion и работает без JS-ошибок,
   если браузер не поддерживает IntersectionObserver.
   ============================================================ */

/** Системная настройка «уменьшить движение» — единственный источник правды. */
export const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const canHover = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/* ---------------- Reveal ---------------- */
let revealObserver = null;
let revealTimer = null;

/** Показать элемент немедленно (без наблюдателя). */
function showNow(el) {
  el.classList.add('in');
  if (revealObserver) revealObserver.unobserve(el);
}

/** Раздаём задержки каскада внутри группы [data-stagger]. */
function applyStagger(root) {
  const groups = Array.from(root.querySelectorAll('[data-stagger]'));
  if (root.matches && root.matches('[data-stagger]')) groups.unshift(root);
  groups.forEach((group) => {
    const step = Number(group.dataset.stagger) || 80;
    const base = Number(group.dataset.staggerFrom) || 0;
    Array.from(group.children).forEach((child, i) => {
      const target = child.hasAttribute('data-reveal') ? child : child.querySelector('[data-reveal]');
      if (target) target.style.setProperty('--rd', `${base + i * step}ms`);
    });
  });
  /* Строки текстовой маски внутри одного блока идут друг за другом */
  Array.from(root.querySelectorAll('[data-reveal]')).forEach((el) => {
    const lines = Array.from(el.querySelectorAll('.mask__i'));
    if (lines.length < 2) return;
    const own = parseFloat(el.style.getPropertyValue('--rd')) || 0;
    lines.forEach((line, i) => line.style.setProperty('--rd', `${own + i * 90}ms`));
  });
}

/** Совместимость со старой разметкой: data-reveal-delay="1..7" → каскад. */
function applyLegacyDelays(root) {
  Array.from(root.querySelectorAll('[data-reveal-delay]')).forEach((el) => {
    if (el.style.getPropertyValue('--rd')) return;
    const n = Number(el.dataset.revealDelay) || 0;
    el.style.setProperty('--rd', `${n * 75}ms`);
  });
}

/**
 * Запускает reveal-сценарии внутри root.
 * Вызывается после каждой отрисовки страницы.
 */
export function initMotion(root = document) {
  const items = Array.from(root.querySelectorAll('[data-reveal]'));
  if (prefersReducedMotion()) { items.forEach((n) => n.classList.add('in')); return; }

  document.documentElement.classList.add('js-motion');
  applyStagger(root);
  applyLegacyDelays(root);

  if (!('IntersectionObserver' in window)) { items.forEach((n) => n.classList.add('in')); return; }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) showNow(en.target); });
    }, { rootMargin: '0px 0px -9% 0px', threshold: 0.06 });
  }

  const vh = window.innerHeight || 800;
  items.forEach((el) => {
    /* Первый экран не должен ждать скролла */
    if (el.getBoundingClientRect().top < vh * 0.92) showNow(el);
    else revealObserver.observe(el);
  });

  /* Страховка: если наблюдатель почему-то не сработал, контент всё равно появится */
  clearTimeout(revealTimer);
  revealTimer = setTimeout(() => {
    items.forEach((el) => { if (el.getBoundingClientRect().top < (window.innerHeight || 800)) showNow(el); });
  }, 1400);
}

/**
 * Подстраховка к наблюдателю: проходит по ещё не показанным элементам
 * и раскрывает те, что уже попали в кадр. Вызывается на скролле —
 * дешевле, чем кажется: множество сокращается по мере появления блоков.
 */
export function sweepReveal() {
  if (prefersReducedMotion()) return;
  const rest = document.querySelectorAll('[data-reveal]:not(.in)');
  if (!rest.length) return;
  const vh = window.innerHeight || 800;
  rest.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < vh * 0.94 && r.bottom > 0) showNow(el);
  });
}

/* ---------------- Прогресс-линии (timeline) ---------------- */
let railObserver = null;

/** Линия таймлайна «чертится», когда секция попадает в кадр. */
export function initRails(root = document) {
  const rails = Array.from(root.querySelectorAll('[data-rail]'));
  if (!rails.length) return;
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    rails.forEach((r) => r.style.setProperty('--p', '1'));
    return;
  }
  if (!railObserver) {
    railObserver = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.style.setProperty('--p', '1');
        railObserver.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.2 });
  }
  rails.forEach((r) => railObserver.observe(r));
}

/* ---------------- Параллакс от курсора ---------------- */
let parallaxCleanup = null;

/* Амплитуда сцены в пикселях. Слой умножает её на свой --depth:
   фон .14 → ~2px, декор .3 → ~4px, видео .45 → ~6px, карточки ~1 → 14px.
   Больше делать нельзя: эффект должен читаться как глубина, а не как езда. */
const PARALLAX_X = 14;
const PARALLAX_Y = 10;
const PARALLAX_EASE = 0.085;   /* насколько быстро сцена догоняет курсор */

/**
 * Мягкий 3D-параллакс от курсора. Один обработчик на сцену, одна
 * rAF-петля, значения догоняют цель — поэтому и уход мыши, и резкое
 * движение выглядят одинаково плавно. Слои читают --px/--py в CSS.
 */
export function initParallax(root = document) {
  if (parallaxCleanup) { parallaxCleanup(); parallaxCleanup = null; }
  const scene = root.querySelector('[data-parallax-scene]');
  if (!scene || prefersReducedMotion() || !canHover()) return;

  const layers = Array.from(scene.querySelectorAll('.parallax'));
  if (!layers.length) return;

  let raf = 0;
  let tx = 0, ty = 0;    /* цель — куда тянет курсор */
  let cx = 0, cy = 0;    /* текущее положение сцены */

  const write = () => layers.forEach((l) => {
    l.style.setProperty('--px', cx.toFixed(2));
    l.style.setProperty('--py', cy.toFixed(2));
  });

  const tick = () => {
    cx += (tx - cx) * PARALLAX_EASE;
    cy += (ty - cy) * PARALLAX_EASE;
    /* Достаточно близко к цели — останавливаем петлю, а не крутим её вечно */
    if (Math.abs(tx - cx) < 0.03 && Math.abs(ty - cy) < 0.03) {
      cx = tx; cy = ty; write();
      scene.classList.remove('is-parallax-live');
      raf = 0;
      return;
    }
    write();
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    scene.classList.add('is-parallax-live');
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const onMove = (e) => {
    const r = scene.getBoundingClientRect();
    if (!r.width || !r.height) return;
    /* -1…1 от центра сцены */
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * PARALLAX_X;
    ty = ((e.clientY - r.top) / r.height - 0.5) * 2 * PARALLAX_Y;
    start();
  };
  /* Ушли со сцены — та же петля плавно возвращает всё в ноль */
  const onLeave = () => { tx = 0; ty = 0; start(); };

  scene.addEventListener('pointermove', onMove, { passive: true });
  scene.addEventListener('pointerleave', onLeave);
  parallaxCleanup = () => {
    scene.removeEventListener('pointermove', onMove);
    scene.removeEventListener('pointerleave', onLeave);
    scene.classList.remove('is-parallax-live');
    if (raf) cancelAnimationFrame(raf);
  };
}

/* ---------------- Скролл: состояние шапки и прогресс ---------------- */
export function initScrollState() {
  const bar = document.getElementById('progress');
  let ticking = false;
  const apply = () => {
    const y = window.scrollY || window.pageYOffset || 0;
    document.body.classList.toggle('is-scrolled', y > 40);
    sweepReveal();
    if (bar) {
      const h = (document.documentElement.scrollHeight - window.innerHeight) || 1;
      bar.style.setProperty('--p', Math.min(1, Math.max(0, y / h)).toFixed(4));
    }
    ticking = false;
  };
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply);
    else apply();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  apply();
}

/* ---------------- Лоадер ---------------- */
export function hideLoader() {
  const el = document.getElementById('loader');
  if (!el || el.dataset.done === 'true') return;
  el.dataset.done = 'true';
  setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 700);
}

/* ---------------- Полный запуск после рендера страницы ---------------- */
export function runPageMotion(root = document) {
  initMotion(root);
  initRails(root);
  initParallax(root);
}
