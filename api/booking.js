/* ============================================================
   POST /api/booking — заявка с формы записи → Telegram клиники.
   Vercel Function (Node.js), без зависимостей.

   Нужны две переменные окружения (Vercel → Project → Settings →
   Environment Variables):
     TELEGRAM_BOT_TOKEN   токен бота от @BotFather
     TELEGRAM_CHAT_ID     id чата или группы, куда бот пишет заявки
   Пока они не заданы, функция отвечает 503, а сайт показывает
   демо-сценарий: просит продублировать заявку в Telegram/WhatsApp.

   Ответы: 200 — заявка доставлена; 400 — не прошла проверку;
   403 — чужой сайт; 405/413/415 — неверный запрос; 502 — Telegram
   не принял сообщение; 503 — функция не настроена.
   Персональные данные нигде не сохраняются и не пишутся в логи.
   ============================================================ */

const LANGS = ['ru', 'uz', 'en', 'es', 'fr', 'de'];

/* Названия для администратора — как в src/i18n/ru.js */
const SERVICES = {
  therapy: 'Терапия',
  implantation: 'Имплантация',
  prosthetics: 'Протезирование',
  orthodontics: 'Ортодонтия',
  pediatric: 'Детская стоматология',
  hygiene: 'Гигиена',
  surgery: 'Хирургия',
  whitening: 'Отбеливание'
};
const TIMES = {
  morning: 'Утро (08:00–12:00)',
  day: 'День (12:00–17:00)',
  evening: 'Вечер (17:00–21:00)',
  night: 'Ночь (21:00–08:00)'
};

/* То же правило, что и в форме на сайте (src/components/booking.js) */
const PHONE_RE = /^[+\d][\d\s()\-]{8,19}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_BODY = 8 * 1024;
const TELEGRAM_TIMEOUT = 8000;

/* ---------- Ответ ---------- */
function send(res, status, payload, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  res.end(JSON.stringify(payload));
}

/* ---------- Тело запроса ----------
   На Vercel req.body уже разобран (геттер бросает ошибку на битом JSON).
   Без этих помощников читаем поток сами — так функцию можно гонять и локально. */
async function readBody(req) {
  let body;
  try { body = req.body; } catch { throw new Error('bad_json'); }
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_BODY) throw new Error('too_large');
      chunks.push(chunk);
    }
    body = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > MAX_BODY) throw new Error('too_large');
    try { body = body ? JSON.parse(body) : {}; } catch { throw new Error('bad_json'); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('bad_json');
  return body;
}

/* ---------- Проверка полей ---------- */
/** Строка без управляющих символов и лишних пробелов. Многострочность — только для комментария. */
function clean(v, { multiline = false } = {}) {
  if (typeof v !== 'string') return '';
  let s = v.replace(/\r\n?/g, '\n');
  s = multiline
    ? s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n')
    : s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ');
  return s.trim();
}

function isRealDate(s) {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export function validateBooking(input) {
  const errors = [];
  const name = clean(input.name);
  const phone = clean(input.phone);
  const service = clean(input.service);
  const date = clean(input.date);
  const time = clean(input.time);
  const comment = clean(input.comment, { multiline: true });
  const lang = LANGS.includes(input.lang) ? input.lang : 'ru';

  if (name.length < 2 || name.length > 80) errors.push('name');
  if (!PHONE_RE.test(phone)) errors.push('phone');
  if (service && !Object.prototype.hasOwnProperty.call(SERVICES, service)) errors.push('service');
  if (date && !isRealDate(date)) errors.push('date');
  if (time && !Object.prototype.hasOwnProperty.call(TIMES, time)) errors.push('time');
  if (comment.length > 1000) errors.push('comment');
  if (input.consent !== true) errors.push('consent');

  return { errors, data: { name, phone, service, date, time, comment, lang } };
}

/* ---------- Сообщение для Telegram ---------- */
const escHtml = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export function formatMessage(d) {
  const when = [d.date, d.time ? TIMES[d.time] : 'любое время'].filter(Boolean).join(' · ');
  return [
    '<b>Новая заявка с сайта</b>',
    '',
    `Имя: <b>${escHtml(d.name)}</b>`,
    `Телефон: ${escHtml(d.phone)}`,
    `Услуга: ${d.service ? SERVICES[d.service] : 'не выбрана'}`,
    `Когда: ${escHtml(when)}`,
    d.comment ? `Комментарий: ${escHtml(d.comment)}` : '',
    `Язык сайта: ${d.lang.toUpperCase()}`
  ].filter((l, i) => l || i === 1).join('\n');
}

async function sendToTelegram(token, chatId, text) {
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT)
  });
  const j = await r.json().catch(() => null);
  if (!r.ok || !j || j.ok !== true) {
    /* В лог — только код и описание ошибки Telegram, без токена и данных пациента */
    throw new Error(`telegram ${r.status}: ${(j && j.description) || 'no description'}`);
  }
}

/** Запрос пришёл с этого же сайта? Без заголовка Origin (не браузер) — не мешаем. */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try { return new URL(origin).host === host; } catch { return false; }
}

/* ---------- Обработчик ---------- */
export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { ok: false, error: 'method_not_allowed' }, { Allow: 'POST' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return send(res, 503, { ok: false, error: 'not_configured' });

  if (!sameOrigin(req)) return send(res, 403, { ok: false, error: 'forbidden' });
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) return send(res, 415, { ok: false, error: 'unsupported_media_type' });
  if (Number(req.headers['content-length'] || 0) > MAX_BODY) return send(res, 413, { ok: false, error: 'too_large' });

  let input;
  try { input = await readBody(req); }
  catch (e) { return send(res, e.message === 'too_large' ? 413 : 400, { ok: false, error: e.message }); }

  /* Ловушка заполнена — это бот. Отвечаем «успехом», чтобы он не пробовал снова. */
  if (typeof input.website === 'string' && input.website.trim() !== '') return send(res, 200, { ok: true });

  const { errors, data } = validateBooking(input);
  if (errors.length) return send(res, 400, { ok: false, error: 'invalid', fields: errors });

  try {
    await sendToTelegram(token, chatId, formatMessage(data));
  } catch (e) {
    console.error('[booking] не удалось отправить в Telegram:', e.message);
    return send(res, 502, { ok: false, error: 'delivery_failed' });
  }
  return send(res, 200, { ok: true });
}
