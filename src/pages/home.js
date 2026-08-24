/* ============================================================
   Главная — визуальный ритм из независимых секций.
   Порядок и состав меняются здесь, не трогая сами секции.
   ============================================================ */
import { heroSection } from '../sections/hero.js';
import { trustSection } from '../sections/trust.js';
import { aboutBand } from '../sections/about-band.js';
import { servicesSection } from '../sections/services-grid.js';
import { technologySection } from '../sections/technology.js';
import { whySection } from '../sections/why.js';
import { processSection } from '../sections/process.js';
import { pricesTeaser, faqSection } from '../sections/prices-teaser.js';
import { doctorsSection } from '../sections/doctors-stage.js';
import { reviewsSection } from '../sections/reviews-strip.js';
import { bookingSection } from '../sections/booking-panel.js';
import { contactsSection } from '../sections/contacts-panel.js';

export default function homePage() {
  return [
    heroSection(),        /* 1. Первый экран */
    trustSection(),       /* 2. Полоса доверия */
    aboutBand(),          /* 3. Клиника изнутри */
    servicesSection(),    /* 4. Услуги — editorial grid */
    technologySection(),  /* 5. Технологии (тёмная секция) */
    whySection(),         /* 6. Почему UMID */
    processSection(),     /* 7. План лечения */
    pricesTeaser(),       /* 8. Цены */
    doctorsSection(),     /* 9. Врачи */
    reviewsSection(),     /* 10. Отзывы */
    faqSection(),         /* 11. Частые вопросы */
    bookingSection(),     /* 12. Удобная запись */
    contactsSection()     /* 13. Контакты и карта */
  ].join('');
}
