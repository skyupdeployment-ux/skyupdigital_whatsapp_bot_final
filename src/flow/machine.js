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

const { STATES, Session } = require('../models');
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

    // ── Demo Business → send calendar link ───────────────────────────
    case STATES.DEMO_BUSINESS: {
      if (kind !== 'text' || !text) return reject(session, c);
      session.phone = session.phone || waId;
      await advance(session, {
        businessName:  text,
        phone:         session.phone,
        demoRequested: true,
        leadStatus:    'DEMO_REQUESTED',
      }, STATES.DEMO_TIME);
      const bookingUrl = buildBookingUrl(session);
      return sendText(waId,
        `🗓️ *Pick Your Demo Slot*\n\n` +
        `Hi ${session.name}! Open the link below to choose your preferred date and time:\n\n` +
        `👉 ${bookingUrl}\n\n` +
        `_Takes less than 30 seconds. Our team will confirm your slot on WhatsApp._`
      );
    }

    // ── Waiting for web calendar submission ──────────────────────────
    case STATES.DEMO_TIME: {
      const bookingUrl = buildBookingUrl(session);
      return sendText(waId,
        `📅 Please open the link below to pick your demo date and time:\n\n` +
        `👉 ${bookingUrl}\n\n` +
        `_Type MENU to start over._`
      );
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
  await advance(session, { phone: session.phone, leadStatus: 'DEMO_REQUESTED' }, STATES.DEMO_TIME);
  const bookingUrl = buildBookingUrl(session);
  return sendText(session.waId,
    `🗓️ *Pick Your Demo Slot*\n\n` +
    `Open the link below to choose your preferred date and time:\n\n` +
    `👉 ${bookingUrl}\n\n` +
    `_Takes less than 30 seconds. Our team will confirm on WhatsApp._`
  );
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
