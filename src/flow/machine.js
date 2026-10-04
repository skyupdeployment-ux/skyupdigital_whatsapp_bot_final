/**
 * SkyUp WhatsApp Bot — Master Conversation Engine
 *
 * Demo flow:
 *   Book a Demo → Name → Business Name → Bot sends calendar link →
 *   Customer picks date+time in browser → Lead saved → Confirmation sent back
 *
 * NO date picker in WhatsApp. Real calendar served at /book on Railway.
 * Phone auto-set from waId. Only 2 action buttons: Book a Demo + Talk to Team.
 */

const { STATES, Session, Lead } = require('../models');
const { sendText, sendDocument, sendList, sendButtons } = require('../lib/msg91');
const { saveLead } = require('../sinks');
const {
  CATEGORIES,
  findCategoryById,
  findServiceById,
  findServiceByText,
  findCategoryByText,
  buildCategoryListSections,
  buildServiceListSections,
  serviceActionButtons,
  isActionId,
  getPortfolioPdf,
  getPortfolioFilename,
  getGeneralBrochure,
} = require('../config/services');
const { validateName } = require('../lib/parse');
const {
  getCopy,
  detectLanguage,
  buildLanguageSections,
  isLanguageReply,
  codeFromReplyId,
  isValidLanguageCode,
} = require('../config/languages');

const SUPPORT_PHONE  = process.env.SUPPORT_PHONE  || '+91 00000 00000';
const SUPPORT_WA     = process.env.SUPPORT_WA      || SUPPORT_PHONE;
const PORTFOLIO_URL  = process.env.PORTFOLIO_URL   || 'https://skyupdigital.in';
const BASE_URL       = process.env.SELF_URL        || 'https://skyupdigitalwhatsappbotfinal-production.up.railway.app';
const MAX_STRIKES    = 3;

// ════════════════════════════════════════════════════════════════════
// IN-WHATSAPP DEMO DATE & TIME PICKER  (self-contained — no extra files)
// ════════════════════════════════════════════════════════════════════
const DEMO_TZ        = 'Asia/Kolkata';
const DEMO_PAGE_SIZE = 7;    // dates shown per page
const DEMO_MAX_DAYS  = 28;   // how far ahead a customer may book

// Continuous back-to-back time windows, e.g. 9:00–9:10, 9:10–9:20, …
// Edit the working-hours window and the gap to taste.
const DEMO_DAY_START    = '09:00';  // first slot starts here (24h)
const DEMO_DAY_END      = '18:00';  // last slot ends by here (24h)
const DEMO_SLOT_GAP_MIN = 10;       // window length in minutes
const DEMO_TIME_PAGE    = 7;        // time slots shown per page

function demoFmt12(h, m) {
  const ampm = h < 12 ? 'AM' : 'PM';
  let hr = h % 12; if (hr === 0) hr = 12;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
}

function demoHM2Min(s) { const [a, b] = s.split(':').map(Number); return a * 60 + b; }

// All possible slots for a day (built once).
const DEMO_TIME_SLOTS = (() => {
  const out = [];
  const start = demoHM2Min(DEMO_DAY_START);
  const end   = demoHM2Min(DEMO_DAY_END);
  for (let t = start; t + DEMO_SLOT_GAP_MIN <= end; t += DEMO_SLOT_GAP_MIN) {
    const sh = Math.floor(t / 60), sm = t % 60;
    const e  = t + DEMO_SLOT_GAP_MIN, eh = Math.floor(e / 60), em = e % 60;
    const key = String(sh).padStart(2, '0') + String(sm).padStart(2, '0'); // "0900"
    out.push({ key, label: `${demoFmt12(sh, sm)} – ${demoFmt12(eh, em)}` });
  }
  return out;
})();

// Which slot labels are already booked for a given date (across all clients).
async function demoBookedLabels(ymd) {
  try {
    const leads = await Lead.find({ preferredContactDate: ymd, demoRequested: true })
      .select('preferredContactTime').lean();
    return new Set(leads.map((l) => l.preferredContactTime).filter(Boolean));
  } catch (err) {
    console.error('[demo] booked lookup failed:', err.message);
    return new Set();
  }
}

function demoIstTodayYMD() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DEMO_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}

function demoYmdToUTC(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function demoDateOption(dayIndex) {
  const base = demoYmdToUTC(demoIstTodayYMD());
  const dt   = new Date(base.getTime() + dayIndex * 86400000);
  const ymd  = dt.toISOString().slice(0, 10);
  const wkS  = dt.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
  const wkL  = dt.toLocaleDateString('en-US', { weekday: 'long',  timeZone: 'UTC' });
  const dM   = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
  let prefix = '';
  if (dayIndex === 0) prefix = 'Today · ';
  else if (dayIndex === 1) prefix = 'Tomorrow · ';
  return { id: `demo_date_${ymd}`, ymd, title: `${prefix}${wkS} ${dM}`.slice(0, 24), desc: wkL };
}

function demoBuildDateSections(offset = 0) {
  const start = Math.max(0, Math.min(offset, DEMO_MAX_DAYS - 1));
  const rows = [];
  for (let i = 0; i < DEMO_PAGE_SIZE; i++) {
    const idx = start + i;
    if (idx >= DEMO_MAX_DAYS) break;
    const o = demoDateOption(idx);
    rows.push({ id: o.id, title: o.title, description: o.desc });
  }
  const nav = [];
  if (start > 0) nav.push({ id: `demo_back_${Math.max(0, start - DEMO_PAGE_SIZE)}`, title: '⬅️ Earlier dates' });
  if (start + DEMO_PAGE_SIZE < DEMO_MAX_DAYS) nav.push({ id: `demo_more_${start + DEMO_PAGE_SIZE}`, title: '➡️ Next 7 days' });
  const sections = [{ title: 'Available dates', rows }];
  if (nav.length) sections.push({ title: 'More', rows: nav });
  return sections;
}

// Build time sections from the AVAILABLE slots (booked ones already removed),
// paginated so the WhatsApp list never exceeds its 10-row limit.
function demoBuildTimeSections(available, offset = 0) {
  const start = Math.max(0, Math.min(offset, Math.max(0, available.length - 1)));
  const page  = available.slice(start, start + DEMO_TIME_PAGE);
  const rows  = page.map((s) => ({ id: `demo_time_${s.key}`, title: s.label }));

  const nav = [];
  if (start > 0) nav.push({ id: `demo_tback_${Math.max(0, start - DEMO_TIME_PAGE)}`, title: '⬅️ Earlier times' });
  if (start + DEMO_TIME_PAGE < available.length) nav.push({ id: `demo_tmore_${start + DEMO_TIME_PAGE}`, title: '➡️ More times' });
  nav.push({ id: 'demo_change_date', title: '📅 Change date' });

  return [
    { title: 'Available time slots', rows },
    { title: 'More', rows: nav },
  ];
}

function demoHumanDate(ymd) {
  try {
    const dt = demoYmdToUTC(ymd);
    const wkL = dt.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const dM  = dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
    return `${wkL}, ${dM}`;
  } catch { return ymd; }
}


// ──────────────────────────────────────────────────────────────────
// HELPERS — send wrappers
// ──────────────────────────────────────────────────────────────────

function sendMainMenu(waId, c) {
  return sendList(waId, {
    header: 'SkyUp Digital Solutions',
    body:   c.mainMenu.body,
    footer: c.mainMenu.footer,
    button: c.mainMenu.button,
    sections: buildCategoryListSections(),
  });
}

function sendCategoryMenu(waId, categoryId, c) {
  const cat = findCategoryById(categoryId);
  return sendList(waId, {
    header: cat ? (cat.icon + ' ' + cat.title) : 'Services',
    body:   c.categoryMenu.body,
    footer: c.categoryMenu.footer,
    button: c.categoryMenu.button,
    sections: buildServiceListSections(categoryId),
  });
}

async function sendServiceIntro(waId, service, c, categoryId) {
  await sendText(waId, service.pitch);
  const catId  = categoryId || service._categoryId;
  const pdfUrl = getPortfolioPdf(catId);
  if (pdfUrl && pdfUrl.startsWith('http')) {
    try {
      const filename = getPortfolioFilename(catId);
      await sendDocument(waId, pdfUrl, filename, c.pdfCaption(service.title));
    } catch (err) {
      console.error('[intro] portfolio PDF failed for', service.id, ':', err.message);
    }
  }
  await sendButtons(waId, {
    body:    c.serviceActions.body,
    footer:  c.serviceActions.footer,
    buttons: serviceActionButtons(service),
  });
}

// ── Build booking calendar URL ─────────────────────────────────────
function buildBookingUrl(session) {
  const p = new URLSearchParams({
    waid:  session.waId,
    name:  session.name  || '',
    biz:   session.businessName || '',
    svc:   session.serviceTitle || 'SkyUp Demo',
    phone: session.phone || session.waId,
  });
  return `${BASE_URL}/book?${p.toString()}`;
}

// ── In-WhatsApp demo date picker (replaces web calendar) ────────────
function sendDatePicker(session, _c, offset = 0) {
  return sendList(session.waId, {
    header:   '📅 Pick a Date',
    body:     `Hi ${session.name || 'there'}! What date would you like for your demo?`,
    footer:   'Tap "Next 7 days" to see more',
    button:   'Pick a date',
    sections: demoBuildDateSections(offset),
  });
}

// ── In-WhatsApp time-slot picker ────────────────────────────────────
async function sendTimePicker(session, _c, offset = 0) {
  const dateLabel = demoHumanDate(session.preferredContactDate);
  const booked    = await demoBookedLabels(session.preferredContactDate);
  const available = DEMO_TIME_SLOTS.filter((s) => !booked.has(s.label));

  if (!available.length) {
    await sendText(session.waId,
      `😕 All slots on *${dateLabel}* are booked.\n\nPlease choose another date.`);
    session.state = STATES.DEMO_DATE;
    await session.save();
    return sendDatePicker(session, _c, 0);
  }

  return sendList(session.waId, {
    header:   '⏰ Pick a Time',
    body:     `Great — *${dateLabel}*.\n\nWhat time works for you? (IST)`,
    footer:   'All times are in IST',
    button:   'Pick a time',
    sections: demoBuildTimeSections(available, offset),
  });
}

// ── Finalise the demo booking ───────────────────────────────────────
async function confirmDemo(session, _c) {
  session.demoRequested = true;
  session.phone      = session.phone || session.waId;
  session.leadStatus = 'DEMO_REQUESTED';
  session.state      = STATES.DONE;
  session.strikes    = 0;
  await session.save();
  await saveLeadFromSession(session);

  const dateLabel = demoHumanDate(session.preferredContactDate);
  const timeLabel = session.preferredContactTime;
  const business  = session.businessName ? `🏢 *Business:* ${session.businessName}\n` : '';
  return sendText(session.waId,
    `✅ *Demo Booked!*\n\n` +
    `👤 *Name:* ${session.name || ''}\n` +
    business +
    `🎯 *Service:* ${session.serviceTitle || 'SkyUp Demo'}\n` +
    `📅 *Date:* ${dateLabel}\n` +
    `⏰ *Time:* ${timeLabel} (IST)\n\n` +
    `Our team will reach you on WhatsApp to confirm and share the meeting link.\n\n` +
    `📞 *Call / WhatsApp:* ${SUPPORT_PHONE}\n\n` +
    `Type MENU to explore more services.`
  );
}

// ──────────────────────────────────────────────────────────────────
// SESSION HELPERS
// ──────────────────────────────────────────────────────────────────

async function advance(session, patch, nextState) {
  Object.assign(session, patch);
  session.state   = nextState;
  session.strikes = 0;
  await session.save();
}

async function reject(session, c, reasonKey) {
  session.strikes += 1;
  if (session.strikes >= MAX_STRIKES) {
    session.state    = STATES.HANDOFF;
    session.needsHuman = true;
    await session.save();
    return sendText(session.waId, c.handoff(SUPPORT_PHONE));
  }
  await session.save();
  const msg = reasonKey ? (c.errors && c.errors[reasonKey]) : null;
  return sendText(session.waId, msg || c.offTopic);
}

async function saveLeadFromSession(session) {
  return saveLead({
    waId:                 session.waId,
    name:                 session.name || '',
    businessName:         session.businessName,
    phone:                session.phone || session.waId,
    lang:                 session.lang,
    categoryId:           session.categoryId,
    categoryTitle:        session.categoryTitle,
    serviceId:            session.serviceId,
    serviceTitle:         session.serviceTitle,
    subServiceId:         session.subServiceId,
    subServiceTitle:      session.subServiceTitle,
    purpose:              session.purpose,
    currentProcess:       session.currentProcess,
    existingSystem:       session.existingSystem,
    preferredContactDate: session.preferredContactDate,
    preferredContactTime: session.preferredContactTime,
    quotationRequested:   session.quotationRequested,
    demoRequested:        session.demoRequested,
    documentsUploaded:    session.documentsUploaded,
    needsHuman:           session.needsHuman,
    leadStatus:           session.leadStatus || 'NEW',
  });
}

// ──────────────────────────────────────────────────────────────────
// INTENT DETECTION
// ──────────────────────────────────────────────────────────────────

function detectIntent(text) {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  if (/\b(demo|demonstration|show me|trial|beku|chahiye demo|demo book)\b/.test(t)) return 'demo';
  if (/\b(human|person|agent|team|talk|speak|call me|connect|support|help me)\b/.test(t)) return 'team';
  if (/\b(portfolio|work|projects|case study|clients|examples)\b/.test(t)) return 'portfolio';
  if (/\b(not sure|don't know|what do i|suggest|recommend|which service|help me choose)\b/.test(t)) return 'recommend';
  return null;
}

// ──────────────────────────────────────────────────────────────────
// RESET DETECTION
// ──────────────────────────────────────────────────────────────────

const RESET_WORDS = new Set([
  'menu', 'restart', 'start', 'hi', 'hello', 'hey', 'reset', 'start over',
  'main menu', 'home', 'back', '🏠',
  'मेनू', 'शुरू', 'नमस्ते', 'प्रारंभ',
  'ಮೆನು', 'ಪ್ರಾರಂಭ', 'ನಮಸ್ಕಾರ',
  'மெனு', 'தொடங்கு', 'வணக்கம்',
  'మెనూ', 'ప్రారంభం', 'నమస్కారం',
  'মেনু', 'শুরু', 'নমস্কার',
  'ਮੀਨੂ', 'ਸ਼ੁਰੂ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
  'مینو', 'شروع', 'سلام',
]);

function isReset(text) {
  if (!text) return false;
  return RESET_WORDS.has(String(text).trim().toLowerCase().replace(/[!.?]+$/, ''));
}

// ──────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ──────────────────────────────────────────────────────────────────

async function handleMessage(inbound) {
  const { waId, kind, text, replyId } = inbound;

  let session = await Session.findOne({ waId });
  if (!session) session = new Session({ waId, state: STATES.IDLE, lang: 'en' });

  session.lastMessageAt = new Date();
  let c = getCopy(session.lang);

  if (kind === 'text' && isReset(text) && session.state !== STATES.IDLE) {
    resetSession(session);
    await session.save();
    return sendMainMenu(waId, c);
  }

  switch (session.state) {

    case STATES.IDLE: {
      session.lang = 'en';
      c = getCopy('en');
      await advance(session, { lang: 'en' }, STATES.MAIN_MENU);
      return sendMainMenu(waId, c);
    }

    case STATES.LANG_PICKER_SENT: {
      if (kind === 'list_reply' && isLanguageReply(replyId)) {
        const code = codeFromReplyId(replyId);
        if (isValidLanguageCode(code)) {
          session.lang = code;
          c = getCopy(code);
          await advance(session, { lang: code }, STATES.MAIN_MENU);
          return sendMainMenu(waId, c);
        }
      }
      if (kind === 'text') {
        const det = detectLanguage(text);
        if (det) {
          session.lang = det;
          c = getCopy(det);
          await advance(session, { lang: det }, STATES.MAIN_MENU);
          return sendMainMenu(waId, c);
        }
      }
      return sendMainMenu(waId, c);
    }

    case STATES.MAIN_MENU: {
      const cat = (kind === 'list_reply' && findCategoryById(replyId))
                || (kind === 'text'      && findCategoryByText(text));
      if (cat) {
        await advance(session, { categoryId: cat.id, categoryTitle: cat.title }, STATES.CATEGORY_SENT);
        return sendCategoryMenu(waId, cat.id, c);
      }
      const actionId = kind === 'list_reply' ? replyId : null;
      if (actionId === 'action_demo')      return startDemoFlow(session, c);
      if (actionId === 'action_team')      return startHandoff(session, c);
      if (actionId === 'action_lang')      return sendMainMenu(waId, c);
      if (actionId === 'action_portfolio') return sendText(waId, c.portfolio(PORTFOLIO_URL));
      if (actionId === 'action_about')     return sendText(waId, c.aboutSkyUp);
      const intent = detectIntent(text);
      if (intent === 'recommend') return sendText(waId, c.recommendHelper);
      if (intent === 'demo')      return startDemoFlow(session, c);
      if (intent === 'team')      return startHandoff(session, c);
      if (intent === 'portfolio') return sendText(waId, c.portfolio(PORTFOLIO_URL));
      const directSvc = kind === 'text' && findServiceByText(text);
      if (directSvc) {
        await advance(session, { serviceId: directSvc.id, serviceTitle: directSvc.title }, STATES.SERVICE_INTRO_SENT);
        return sendServiceIntro(waId, directSvc, c, session.categoryId);
      }
      return sendMainMenu(waId, c);
    }

    case STATES.CATEGORY_SENT: {
      if (replyId === 'action_main_menu' || text === '🏠') {
        resetSession(session);
        await session.save();
        return sendMainMenu(waId, c);
      }
      const svc = (kind === 'list_reply' && findServiceById(replyId))
               || (kind === 'text'       && findServiceByText(text));
      if (svc) {
        await advance(session, { serviceId: svc.id, serviceTitle: svc.title }, STATES.SERVICE_INTRO_SENT);
        return sendServiceIntro(waId, svc, c, session.categoryId);
      }
      return sendCategoryMenu(waId, session.categoryId, c);
    }

    case STATES.SERVICE_INTRO_SENT: {
      const action = kind === 'button_reply' ? replyId
                   : kind === 'list_reply'   ? replyId
                   : detectIntent(text);
      if (action === 'action_demo' || action === 'demo') {
        session.demoRequested = true;
        session.leadStatus = 'DEMO_REQUESTED';
        await session.save();
        return startDemoFlow(session, c);
      }
      if (action === 'action_team' || action === 'team') {
        return startHandoff(session, c);
      }
      if (/\bpdf\b/i.test(text || '')) {
        const pdfUrl = getPortfolioPdf(session.categoryId);
        if (pdfUrl) {
          const svc = findServiceById(session.serviceId);
          const filename = getPortfolioFilename(session.categoryId);
          return sendDocument(waId, pdfUrl, filename, c.pdfCaption(svc ? svc.title : session.serviceTitle));
        }
        return sendText(waId, c.pdfNotAvailable);
      }
      if (kind === 'text' && text && text.length > 5) {
        session.purpose = text;
        session.demoRequested = true;
        await advance(session, { purpose: text, demoRequested: true }, STATES.DEMO_NAME);
        return sendText(waId, c.demoAskName);
      }
      return sendServiceIntro(waId, findServiceById(session.serviceId) || {}, c, session.categoryId);
    }

    // ── Demo Name ────────────────────────────────────────────────────
    case STATES.DEMO_NAME: {
      if (kind !== 'text' || !text) return reject(session, c);
      const r = validateName(text);
      if (!r.ok) return reject(session, c, r.reason);
      await advance(session, { name: r.value }, STATES.DEMO_BUSINESS);
      return sendText(waId, c.askBusinessName);
    }

    // ── Demo Business → show in-chat date picker ─────────────────────
    case STATES.DEMO_BUSINESS: {
      if (kind !== 'text' || !text) return reject(session, c);
      session.phone = session.phone || waId;
      await advance(session, {
        businessName:  text,
        phone:         session.phone,
        demoRequested: true,
        leadStatus:    'DEMO_REQUESTED',
      }, STATES.DEMO_DATE);
      return sendDatePicker(session, c, 0);
    }

    // ── Demo Date → pick date, or page through more dates ─────────────
    case STATES.DEMO_DATE: {
      const id = kind === 'list_reply' ? replyId : null;

      if (id && id.startsWith('demo_date_')) {
        const ymd = id.slice('demo_date_'.length);
        await advance(session, { preferredContactDate: ymd }, STATES.DEMO_TIMESLOT);
        return sendTimePicker(session, c);
      }
      if (id && id.startsWith('demo_more_')) {
        const offset = parseInt(id.slice('demo_more_'.length), 10) || 0;
        return sendDatePicker(session, c, offset);
      }
      if (id && id.startsWith('demo_back_')) {
        const offset = parseInt(id.slice('demo_back_'.length), 10) || 0;
        return sendDatePicker(session, c, offset);
      }
      // Anything else — re-show the first page of dates.
      return sendDatePicker(session, c, 0);
    }

    // ── Demo Time slot → confirm, page, or go back to dates ───────────
    case STATES.DEMO_TIMESLOT: {
      const id = kind === 'list_reply' ? replyId : null;

      if (id === 'demo_change_date') {
        session.state = STATES.DEMO_DATE;
        await session.save();
        return sendDatePicker(session, c, 0);
      }
      if (id && id.startsWith('demo_tmore_')) {
        return sendTimePicker(session, c, parseInt(id.slice('demo_tmore_'.length), 10) || 0);
      }
      if (id && id.startsWith('demo_tback_')) {
        return sendTimePicker(session, c, parseInt(id.slice('demo_tback_'.length), 10) || 0);
      }
      if (id && id.startsWith('demo_time_')) {
        const key  = id.slice('demo_time_'.length);
        const slot = DEMO_TIME_SLOTS.find((s) => s.key === key);
        if (!slot) return sendTimePicker(session, c, 0);

        // Double-booking guard — someone may have taken it meanwhile.
        const booked = await demoBookedLabels(session.preferredContactDate);
        if (booked.has(slot.label)) {
          await sendText(waId, `😕 Sorry, *${slot.label}* was just booked. Please pick another slot.`);
          return sendTimePicker(session, c, 0);
        }
        session.preferredContactTime = slot.label;
        return confirmDemo(session, c);
      }
      // Anything else — re-show the time slots.
      return sendTimePicker(session, c, 0);
    }

    case STATES.HANDOFF:
      return sendText(waId, c.handoffRepeat(SUPPORT_WA));

    case STATES.DONE: {
      const intent = detectIntent(text);
      if (intent === 'demo') return startDemoFlow(session, c);
      return sendText(waId, c.alreadyDone);
    }

    default:
      resetSession(session);
      await session.save();
      return sendMainMenu(waId, c);
  }
}

// ──────────────────────────────────────────────────────────────────
// FLOW STARTERS
// ──────────────────────────────────────────────────────────────────

async function startDemoFlow(session, c) {
  session.demoRequested = true;
  if (!session.name) {
    await advance(session, { demoRequested: true }, STATES.DEMO_NAME);
    return sendText(session.waId, c.demoAskName);
  }
  if (!session.businessName) {
    await advance(session, { demoRequested: true }, STATES.DEMO_BUSINESS);
    return sendText(session.waId, c.askBusinessName);
  }
  session.phone = session.phone || session.waId;
  await advance(session, { phone: session.phone, leadStatus: 'DEMO_REQUESTED' }, STATES.DEMO_DATE);
  return sendDatePicker(session, c, 0);
}

async function startHandoff(session, c) {
  session.needsHuman = true;
  session.state      = STATES.HANDOFF;
  session.leadStatus = 'TEAM_REVIEW';
  session.phone      = session.phone || session.waId;
  await session.save();
  await saveLeadFromSession(session);
  return sendText(session.waId, c.handoff(SUPPORT_PHONE));
}

// ──────────────────────────────────────────────────────────────────
// SESSION RESET
// ──────────────────────────────────────────────────────────────────

function resetSession(session) {
  session.state             = STATES.MAIN_MENU;
  session.categoryId        = undefined;
  session.categoryTitle     = undefined;
  session.serviceId         = undefined;
  session.serviceTitle      = undefined;
  session.subServiceId      = undefined;
  session.subServiceTitle   = undefined;
  session.name              = undefined;
  session.businessName      = undefined;
  session.purpose           = undefined;
  session.currentProcess    = undefined;
  session.existingSystem    = undefined;
  session.phone             = undefined;
  session.preferredContactDate = undefined;
  session.preferredContactTime = undefined;
  session.quotationRequested = false;
  session.demoRequested      = false;
  session.documentsUploaded  = false;
  session.needsHuman         = false;
  session.leadStatus         = 'NEW';
  session.pendingAction      = undefined;
  session.reqStep            = 0;
  session.strikes            = 0;
}

module.exports = { handleMessage, sendMainMenu, saveLeadFromSession };
