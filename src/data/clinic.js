/* ============================================================
   UMID Medical Centre — единый источник правды по данным клиники.
   Всё, что меняет администратор клиники, живёт здесь.
   ============================================================ */

export const CLINIC = {
  name: 'UMID Medical Centre',
  phone: '+998 95 604 70 10',
  phoneHref: 'tel:+998956047010',
  /* Telegram: заменить на @username клиники, когда он будет создан */
  telegram: 'https://t.me/+998956047010',
  whatsapp: 'https://wa.me/998956047010',
  /* Instagram появится после подключения профиля: укажите ссылку строкой */
  instagram: null,
  mapSearch: 'UMID Medical Centre, Bukhara ave 21A, Kogon, Bukhara region, Uzbekistan',
  /* Точная точка на карте появится после подтверждения координат клиникой */
  coords: null,
  /* Куда отправлять заявку с формы. null → форма работает в демо-режиме
     и предлагает продублировать заявку в Telegram/WhatsApp. */
  bookingEndpoint: null,
  currency: 'UZS'
};

export const mapLinks = {
  google: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CLINIC.mapSearch),
  yandex: 'https://yandex.com/maps/?text=' + encodeURIComponent(CLINIC.mapSearch)
};

/* ---------------- Услуги ----------------
   price: null → цена ещё не подтверждена клиникой, показывается «по запросу».
   Как только прайс утверждён — впишите число в сумах, всё остальное подтянется. */
export const SERVICES = [
  { slug: 'therapy',      icon: 'tooth',    price: null, featured: true },
  { slug: 'implantation', icon: 'implant',  price: null, featured: true },
  { slug: 'prosthetics',  icon: 'crown',    price: null, featured: true },
  { slug: 'orthodontics', icon: 'braces',   price: null, featured: true },
  { slug: 'pediatric',    icon: 'kid',      price: null, featured: true },
  { slug: 'hygiene',      icon: 'sparkle',  price: null, featured: true },
  { slug: 'surgery',      icon: 'scalpel',  price: null, featured: true },
  { slug: 'whitening',    icon: 'shine',    price: null, featured: true }
];

/* Связанные услуги для перелинковки */
export const RELATED = {
  therapy: ['hygiene', 'surgery', 'prosthetics'],
  implantation: ['surgery', 'prosthetics', 'therapy'],
  prosthetics: ['implantation', 'therapy', 'whitening'],
  orthodontics: ['hygiene', 'pediatric', 'whitening'],
  pediatric: ['hygiene', 'therapy', 'orthodontics'],
  hygiene: ['whitening', 'therapy', 'pediatric'],
  surgery: ['implantation', 'therapy', 'prosthetics'],
  whitening: ['hygiene', 'prosthetics', 'therapy']
};

/* ---------------- Прайс ----------------
   Структура категорий и позиций. Названия — в файлах локализации,
   чтобы прайс был одинаковым на всех шести языках. */
export const PRICE_CATEGORIES = [
  { id: 'consult',     icon: 'stethoscope', items: ['examination', 'xrayTarget', 'xrayPano', 'plan'] },
  { id: 'therapy',     icon: 'tooth',       items: ['caries', 'pulpitis1', 'pulpitisMulti', 'restoration'] },
  { id: 'surgery',     icon: 'scalpel',     items: ['extractionSimple', 'extractionComplex', 'wisdom'] },
  { id: 'implant',     icon: 'implant',     items: ['implantPlan', 'implantPlacement', 'implantCrown'] },
  { id: 'prosthetics', icon: 'crown',       items: ['crownCeramic', 'crownZirconia', 'veneer', 'denture'] },
  { id: 'ortho',       icon: 'braces',      items: ['orthoConsult', 'bracesMetal', 'bracesCeramic', 'aligners'] },
  { id: 'kids',        icon: 'kid',         items: ['kidsConsult', 'kidsCaries', 'sealing'] },
  { id: 'hygiene',     icon: 'sparkle',     items: ['hygieneComplex', 'airflow', 'whiteningOffice'] }
];

/* Цены в сумах. Пусто = «уточняется». Пример заполнения: { caries: 250000 } */
export const PRICES = {};

/* ---------------- Врачи ----------------
   Реальные карточки появятся после того, как клиника предоставит данные и фотосъёмку.
   Структура готова: добавьте поля name/role/experience/education/langs — вёрстка не изменится. */
export const DOCTORS = [
  { slug: 'doctor-1', photo: null, specialty: 'therapy',      placeholder: true },
  { slug: 'doctor-2', photo: null, specialty: 'implantation', placeholder: true },
  { slug: 'doctor-3', photo: null, specialty: 'orthodontics', placeholder: true },
  { slug: 'doctor-4', photo: null, specialty: 'pediatric',    placeholder: true }
];

/* ---------------- Как проходит приём ---------------- */
export const PROCESS = ['booking', 'consult', 'diagnostics', 'plan', 'cost', 'treatment', 'aftercare'];

/* ---------------- Отзывы ----------------
   Реальные отзывы подключаются после сбора с площадок. Ничего не выдумываем. */
export const REVIEWS = [];
export const REVIEW_SOURCES = [
  { id: 'google',    url: null },
  { id: 'yandex',    url: null },
  { id: 'twogis',    url: null },
  { id: 'instagram', url: null }
];

/* ---------------- Документы ----------------
   file: null → документ ещё не загружен, показывается статус «готовится». */
export const DOCUMENTS = [
  { id: 'license',  file: null },
  { id: 'rules',    file: null },
  { id: 'privacy',  route: 'privacy' },
  { id: 'consent',  file: null },
  { id: 'terms',    route: 'terms' },
  { id: 'info',     file: null }
];

/* ---------------- Места под фотографии ----------------
   Как вставить фотографию (кода писать не нужно):

     1. Назовите файл ключом слота из списка ниже — например facade.png
     2. Положите его в  src/assets/photos/
     3. Пересоберите:  npm run build

   Сборка сама ужмёт картинку, переведёт в WebP и подставит вместо
   заглушки. Подходят png, jpg, webp, avif любого размера.

   Поле src нужно только в одном случае: если фотография лежит не в
   репозитории, а на внешнем адресе — тогда впишите сюда ссылку строкой,
   например  { src: 'https://cdn.example.com/facade.jpg', ratio: '4/3' }.
   Значение src имеет приоритет над файлом из папки.

   ratio — пропорции рамки. Фото кадрируется по центру (object-fit: cover),
   поэтому лучше подбирать ratio под реальный снимок.                        */
export const PHOTOS = {
  facade:        { src: null, ratio: '4/3' },    /* фасад и вход с улицы */
  reception:     { src: null, ratio: '4/3' },    /* ресепшен, встреча пациента */
  cabinet:       { src: null, ratio: '3/4' },    /* кабинет врача (вертикальное) */
  equipment:     { src: null, ratio: '4/3' },    /* оборудование, диагностика */
  sterilization: { src: null, ratio: '4/3' },    /* стерилизационная */
  team:          { src: null, ratio: '16/9' },   /* команда клиники */
  hero:          { src: null, ratio: '4/4.4' },  /* главный экран, арка (вертикальное) */
  entrance:      { src: null, ratio: '4/3' }     /* вход, навигация внутри здания */
};

/* Фотографии врачей подключаются так же: файл называется slug врача
   из DOCTORS — doctor-1.jpg, doctor-2.jpg и так далее. */

export const LANGS = [
  { code: 'ru', label: 'RU', native: 'Русский',  en: 'Russian',  htmlLang: 'ru' },
  { code: 'uz', label: 'UZ', native: "O‘zbekcha", en: 'Uzbek',   htmlLang: 'uz' },
  { code: 'en', label: 'EN', native: 'English',  en: 'English',  htmlLang: 'en' },
  { code: 'es', label: 'ES', native: 'Español',  en: 'Spanish',  htmlLang: 'es' },
  { code: 'fr', label: 'FR', native: 'Français', en: 'French',   htmlLang: 'fr' },
  { code: 'de', label: 'DE', native: 'Deutsch',  en: 'German',   htmlLang: 'de' }
];

export const DEFAULT_LANG = 'ru';
export const SITE_URL = 'https://umid-medical.uz'; /* заменить на реальный домен */
