/**
 * SkyUp WhatsApp Bot — Master Conversation Engine
 *
 * Flow: UNDERSTAND → EXPLAIN → QUALIFY → ASSIST → CAPTURE → CONNECT
 *
 * States:
 *   IDLE → LANG_PICKER_SENT → MAIN_MENU
 *   MAIN_MENU → CATEGORY_SENT → SERVICE_INTRO_SENT
 *   SERVICE_INTRO_SENT → [COLLECTING_REQ | DEMO_NAME | QUOTATION_PENDING | HANDOFF]
 *   COLLECTING_REQ → AWAITING_NAME → AWAITING_PHONE → AWAITING_CONTACT_TIME → DONE
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
const { validateName, validatePhone } = require('../lib/parse');
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
const MAX_STRIKES    = 3;

// ──────────────────────────────────────────────────────────────────
// HELPERS — send wrappers
// ──────────────────────────────────────────────────────────────────

function sendLangPicker(waId, c) {
  return sendList(waId, {
    header: 'SkyUp Digital Solutions',
    body:   '👋 Welcome! Please select your preferred language.',
    footer: 'Type MENU anytime to restart',
    button: 'Choose Language',
    sections: buildLanguageSections(),
  });
}

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
  // 1. Pitch text
  await sendText(waId, service.pitch);

  // 2. Portfolio PDF — resolved by category (ai / software / growth).
  //    Non-fatal if env var not set or URL broken.
  const catId  = categoryId || service._categoryId;
  const pdfUrl = getPortfolioPdf(catId);
  if (pdfUrl && pdfUrl.startsWith('http')) {
    try {
      const filename = getPortfolioFilename(catId);
      await sendDocument(waId, pdfUrl, filename, c.pdfCaption(service.title));
      console.log(`[intro] portfolio PDF sent (${catId}) for ${service.id}`);
    } catch (err) {
      console.error('[intro] portfolio PDF failed for', service.id, ':', err.message);
    }
  }

  // 3. Action buttons (Quotation / Demo / Team)
  await sendButtons(waId, {
    body:    c.serviceActions.body,
    footer:  c.serviceActions.footer,
    buttons: serviceActionButtons(service),
  });
}

async function sendRequirementQuestion(waId, service, step, c) {
  const questions = service.requirementQuestions || [];
  if (step < questions.length) {
    await sendText(waId, questions[step]);
  }
}

// ──────────────────────────────────────────────────────────────────
// HELPERS — session utilities
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

/** Build a human-readable lead summary for the confirmation message */
function buildLeadSummary(session, c) {
  const lines = [c.confirmSummary.header];
  if (session.name)         lines.push(`*${c.confirmSummary.name}:* ${session.name}`);
  if (session.businessName) lines.push(`*${c.confirmSummary.business}:* ${session.businessName}`);
  if (session.serviceTitle) lines.push(`*${c.confirmSummary.service}:* ${session.serviceTitle}`);
  if (session.subServiceTitle) lines.push(`*${c.confirmSummary.subService}:* ${session.subServiceTitle}`);
  if (session.purpose)      lines.push(`*${c.confirmSummary.requirement}:* ${session.purpose}`);
  if (session.phone)        lines.push(`*${c.confirmSummary.phone}:* ${session.phone}`);
  if (session.preferredContactDate || session.preferredContactTime) {
    const ct = [session.preferredContactDate, session.preferredContactTime].filter(Boolean).join(', ');
    lines.push(`*${c.confirmSummary.preferredTime}:* ${ct}`);
  }
  if (session.quotationRequested) lines.push(`*${c.confirmSummary.quotation}:* ${c.confirmSummary.requested}`);
  if (session.demoRequested)      lines.push(`*${c.confirmSummary.demo}:* ${c.confirmSummary.requested}`);
  lines.push('');
  lines.push(c.confirmSummary.footer);
  return lines.join('\n');
}

/** Persist a lead document from session data */
async function saveLeadFromSession(session) {
  return saveLead({
    waId:                 session.waId,
    name:                 session.name || '',
    businessName:         session.businessName,
    phone:                session.phone || '',
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
// INTENT DETECTION — natural language shortcuts
// ──────────────────────────────────────────────────────────────────

/**
 * Detect high-level intent from free text so users don't need to
 * use exact button labels. Returns an action string or null.
 */
function detectIntent(text) {
  if (!text) return null;
  const t = text.trim().toLowerCase();

  // Price / quotation
  if (/\b(price|cost|rate|quote|quotation|package|how much|budget|pricing|kitna|padega|daam|enu bele|vilai)\b/.test(t)) return 'quotation';

  // Demo
  if (/\b(demo|demonstration|show me|trial|beku|chahiye demo|demo book)\b/.test(t)) return 'demo';

  // Human / team
  if (/\b(human|person|agent|team|talk|speak|call me|connect|support|help me)\b/.test(t)) return 'team';

  // Portfolio
  if (/\b(portfolio|work|projects|case study|clients|examples)\b/.test(t)) return 'portfolio';

  // "I don't know" / help me choose
  if (/\b(not sure|don't know|what do i|suggest|recommend|which service|help me choose)\b/.test(t)) return 'recommend';

  return null;
}

// ──────────────────────────────────────────────────────────────────
// GLOBAL RESET / LANG CHANGE DETECTION
// ──────────────────────────────────────────────────────────────────

const RESET_WORDS = new Set([
  'menu', 'restart', 'start', 'hi', 'hello', 'hey', 'reset', 'start over',
  'main menu', 'home', 'back', '🏠',
  // Indian language resets
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


// ── Calendar helpers for demo booking ────────────────────────────
function buildDateSlots() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rows = [];
  const today = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const label = `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
    const id = `demodate_${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    rows.push({ id, title: label, description: 'Tap to pick this day' });
  }
  return [{ title: 'Select a date', rows }];
}

function demoTimeButtons() {
  return [
    { id: 'demotime_morning',   title: '🌅 Morning' },
    { id: 'demotime_afternoon', title: '☀️ Afternoon' },
    { id: 'demotime_evening',   title: '🌆 Evening' },
  ];
}

const TIME_LABELS = {
  demotime_morning:   'Morning (9am–12pm)',
  demotime_afternoon: 'Afternoon (12pm–4pm)',
  demotime_evening:   'Evening (4pm–7pm)',
};


async function handleMessage(inbound) {
  const { waId, kind, text, replyId } = inbound;

  let session = await Session.findOne({ waId });
  if (!session) session = new Session({ waId, state: STATES.IDLE, lang: 'en' });

  session.lastMessageAt = new Date();
  let c = getCopy(session.lang);

  // ── Global reset ─────────────────────────────────────────────────
  // Skip reset for IDLE — new users must see language picker first!
  if (kind === 'text' && isReset(text) && session.state !== STATES.IDLE) {
    resetSession(session);
    await session.save();
    return sendMainMenu(waId, c);
  }

  // ── State machine ────────────────────────────────────────────────
  switch (session.state) {

    // ── 1. First contact — go straight to main menu (English only) ───
    case STATES.IDLE: {
      session.lang = 'en';
      c = getCopy('en');
      await advance(session, { lang: 'en' }, STATES.MAIN_MENU);
      return sendMainMenu(waId, c);
    }

    // ── 2. Language picker ───────────────────────────────────────────
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

    // ── 3. Main menu (category picker) ──────────────────────────────
    case STATES.MAIN_MENU: {
      // Category tap
      const cat = (kind === 'list_reply' && findCategoryById(replyId))
                || (kind === 'text'      && findCategoryByText(text));

      if (cat) {
        await advance(session, { categoryId: cat.id, categoryTitle: cat.title }, STATES.CATEGORY_SENT);
        return sendCategoryMenu(waId, cat.id, c);
      }

      // Utility actions
      const actionId = kind === 'list_reply' ? replyId : null;
      if (actionId === 'action_demo')      return startDemoFlow(session, c);
      if (actionId === 'action_team')      return startHandoff(session, c);
      if (actionId === 'action_lang')      return sendMainMenu(waId, c);
      if (actionId === 'action_portfolio') return sendText(waId, c.portfolio(PORTFOLIO_URL));
      if (actionId === 'action_about')     return sendText(waId, c.aboutSkyUp);

      // Intent from free text
      const intent = detectIntent(text);
      if (intent === 'recommend') return sendText(waId, c.recommendHelper);
      if (intent === 'demo')      return startDemoFlow(session, c);
      if (intent === 'team')      return startHandoff(session, c);
      if (intent === 'portfolio') return sendText(waId, c.portfolio(PORTFOLIO_URL));

      // Try to match a service directly by name
      const directSvc = kind === 'text' && findServiceByText(text);
      if (directSvc) {
        await advance(session, { serviceId: directSvc.id, serviceTitle: directSvc.title }, STATES.SERVICE_INTRO_SENT);
        return sendServiceIntro(waId, directSvc, c, session.categoryId);
      }

      // Fallback
      return sendMainMenu(waId, c);
    }

    // ── 4. Category shown — user picks a service ─────────────────────
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

      // Re-show category menu
      return sendCategoryMenu(waId, session.categoryId, c);
    }

    // ── 5. Service intro shown — user picks an action ────────────────
    case STATES.SERVICE_INTRO_SENT: {
      const action = kind === 'button_reply' ? replyId
                   : kind === 'list_reply'   ? replyId
                   : detectIntent(text);

      if (action === 'action_quotation' || action === 'quotation') {
        session.quotationRequested = true;
        session.leadStatus = 'QUOTATION_REQUESTED';
        await session.save();
        return startQuotationFlow(session, c);
      }

      if (action === 'action_demo' || action === 'demo') {
        session.demoRequested = true;
        session.leadStatus = 'DEMO_REQUESTED';
        await session.save();
        return startDemoFlow(session, c);
      }

      if (action === 'action_team' || action === 'team') {
        return startHandoff(session, c);
      }

      if (action === 'action_back_cat' && session.categoryId) {
        await advance(session, {}, STATES.CATEGORY_SENT);
        return sendCategoryMenu(waId, session.categoryId, c);
      }

      // PDF request — re-send the portfolio PDF for this service's category
      if (/\bpdf\b/i.test(text || '')) {
        const pdfUrl = getPortfolioPdf(session.categoryId);
        if (pdfUrl) {
          const svc = findServiceById(session.serviceId);
          const filename = getPortfolioFilename(session.categoryId);
          return sendDocument(waId, pdfUrl, filename, c.pdfCaption(svc ? svc.title : session.serviceTitle));
        }
        return sendText(waId, c.pdfNotAvailable);
      }

      // Free-text requirement — start collecting
      if (kind === 'text' && text && text.length > 5) {
        session.purpose = text;
        session.leadStatus = 'QUALIFYING';
        await advance(session, { purpose: text }, STATES.COLLECTING_REQ);
        return continueReqCollection(session, c);
      }

      return sendServiceIntro(waId, findServiceById(session.serviceId) || {}, c);
    }

    // ── 6. Requirement collection ────────────────────────────────────
    case STATES.COLLECTING_REQ: {
      const svc = findServiceById(session.serviceId);
      const questions = (svc && svc.requirementQuestions) || [];
      const step = session.reqStep || 0;

      // Save the answer to this step's question
      if (kind === 'text' && text) {
        storeReqAnswer(session, step, text, questions);
        session.reqStep = step + 1;
        await session.save();
      }

      // More questions to ask?
      if (session.reqStep < questions.length) {
        await sendText(waId, questions[session.reqStep]);
        return;
      }

      // All questions answered — move to lead capture
      session.leadStatus = 'QUALIFIED';
      if (!session.name) {
        await advance(session, {}, STATES.AWAITING_NAME);
        return sendText(waId, c.askName(''));
      }
      if (!session.phone) {
        await advance(session, {}, STATES.AWAITING_PHONE);
        return sendButtons(waId, { body: c.askPhone(waId), buttons: c.phoneButtons });
      }
      await advance(session, {}, STATES.AWAITING_CONTACT_TIME);
      return sendText(waId, c.askContactTime);
    }

    // ── 7. Quotation pending ─────────────────────────────────────────
    case STATES.QUOTATION_PENDING: {
      if (kind === 'text' && text) {
        // Treat free text as requirement detail
        session.purpose = (session.purpose ? session.purpose + ' | ' : '') + text;
        await session.save();
      }
      if (!session.name) {
        await advance(session, {}, STATES.AWAITING_NAME);
        return sendText(waId, c.askName(''));
      }
      if (!session.phone) {
        await advance(session, {}, STATES.AWAITING_PHONE);
        return sendButtons(waId, { body: c.askPhone(waId), buttons: c.phoneButtons });
      }
      await advance(session, {}, STATES.AWAITING_CONTACT_TIME);
      return sendText(waId, c.askContactTime);
    }

    // ── 8. Demo flow ─────────────────────────────────────────────────
    case STATES.DEMO_NAME: {
      if (kind !== 'text' || !text) return reject(session, c);
      const r = validateName(text);
      if (!r.ok) return reject(session, c, r.reason);
      await advance(session, { name: r.value }, STATES.DEMO_BUSINESS);
      return sendText(waId, c.askBusinessName);
    }

    case STATES.DEMO_BUSINESS: {
      if (kind !== 'text' || !text) return reject(session, c);
      await advance(session, { businessName: text }, STATES.AWAITING_PHONE);
      return sendButtons(waId, { body: c.askPhone(waId), buttons: c.phoneButtons });
    }

    case STATES.DEMO_TIME: {
      if (kind !== 'text' || !text) return reject(session, c);
      const [date, ...timeParts] = text.split(' ');
      await advance(session, {
        preferredContactDate: date,
        preferredContactTime: timeParts.join(' ') || date,
      }, STATES.DONE);
      return finishDemoBooking(session, c);
    }

    // ── 9. Lead name ─────────────────────────────────────────────────
    case STATES.AWAITING_NAME: {
      if (kind !== 'text' || !text) return reject(session, c);
      const r = validateName(text);
      if (!r.ok) return reject(session, c, r.reason);
      await advance(session, { name: r.value }, STATES.AWAITING_PHONE);
      return sendButtons(waId, { body: c.askPhone(waId), buttons: c.phoneButtons });
    }

    // ── 10. Phone ────────────────────────────────────────────────────
    case STATES.AWAITING_PHONE: {
      if (kind === 'button_reply' && replyId === 'phone_use_wa') {
        session.phone = waId;
        if (session.demoRequested) {
          await advance(session, { phone: waId }, STATES.DEMO_DATE);
          return sendList(waId, { header: 'Book a Demo', body: 'Great! Please pick your preferred date for the demo:', footer: 'Our team will confirm the slot', button: 'Select Date', sections: buildDateSlots() });
        }
        await advance(session, { phone: waId }, STATES.AWAITING_CONTACT_TIME);
        return sendText(waId, c.askContactTime);
      }
      if (kind === 'button_reply' && replyId === 'phone_other') {
        await advance(session, {}, STATES.AWAITING_ALT_PHONE);
        return sendText(waId, c.askAltPhone);
      }
      if (kind === 'text') {
        const r = validatePhone(text);
        if (r.ok) {
          if (session.demoRequested) {
            await advance(session, { phone: r.value }, STATES.DEMO_DATE);
            return sendList(waId, { header: 'Book a Demo', body: 'Great! Please pick your preferred date for the demo:', footer: 'Our team will confirm the slot', button: 'Select Date', sections: buildDateSlots() });
          }
          await advance(session, { phone: r.value }, STATES.AWAITING_CONTACT_TIME);
          return sendText(waId, c.askContactTime);
        }
      }
      return reject(session, c, 'badPhone');
    }

    case STATES.AWAITING_ALT_PHONE: {
      if (kind !== 'text') return reject(session, c);
      const r = validatePhone(text);
      if (!r.ok) return reject(session, c, 'badPhone');
      if (session.demoRequested) {
        await advance(session, { phone: r.value }, STATES.DEMO_DATE);
        return sendList(waId, { header: 'Book a Demo', body: 'Great! Please pick your preferred date for the demo:', footer: 'Our team will confirm the slot', button: 'Select Date', sections: buildDateSlots() });
      }
      await advance(session, { phone: r.value }, STATES.AWAITING_CONTACT_TIME);
      return sendText(waId, c.askContactTime);
    }

    case STATES.DEMO_DATE: {
      if (kind === 'list_reply' && replyId && replyId.startsWith('demodate_')) {
        const dateStr = replyId.replace('demodate_', '');
        await advance(session, { preferredContactDate: dateStr }, STATES.DEMO_TIMESLOT);
        return sendButtons(waId, { body: 'Perfect! What time works best for you?', buttons: demoTimeButtons() });
      }
      return sendList(waId, { header: 'Book a Demo', body: 'Please pick a date from the list:', footer: 'Tap Select Date', button: 'Select Date', sections: buildDateSlots() });
    }

    case STATES.DEMO_TIMESLOT: {
      if (kind === 'button_reply' && TIME_LABELS[replyId]) {
        await advance(session, { preferredContactTime: TIME_LABELS[replyId] }, STATES.DONE);
        return finishDemoBooking(session, c);
      }
      return sendButtons(waId, { body: 'Please pick a time slot:', buttons: demoTimeButtons() });
    }

    // ── 11. Preferred contact time ───────────────────────────────────
    case STATES.AWAITING_CONTACT_TIME: {
      const timeInput = (kind === 'text' && text) ? text : 'As soon as possible';
      await advance(session, {
        preferredContactDate: timeInput.split(' ')[0],
        preferredContactTime: timeInput,
        leadStatus: 'CONTACT_PENDING',
      }, STATES.DONE);
      return finishLead(session, c);
    }

    // ── 12. Terminal states ──────────────────────────────────────────
    case STATES.HANDOFF:
      return sendText(waId, c.handoffRepeat(SUPPORT_WA));

    case STATES.DONE: {
      // If they come back, offer main menu
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

async function startQuotationFlow(session, c) {
  console.log('[quotation] START — waId=' + session.waId + ' name=' + session.name + ' phone=' + session.phone);
  // Collect name first if not already collected
  if (!session.name) {
    session.quotationRequested = true;
    await advance(session, {}, STATES.QUOTATION_PENDING);
    console.log('[quotation] asking requirement (no name yet)');
    const msg = c.quotationAskReq || 'Please describe your requirement briefly.';
    return sendText(session.waId, msg);
  }

  const svc = findServiceById(session.serviceId);
  const questions = (svc && svc.requirementQuestions) || [];

  // Send quotation intro
  await sendText(session.waId, c.quotationIntro);

  if (questions.length > 0) {
    session.reqStep = 0;
    await advance(session, {}, STATES.COLLECTING_REQ);
    return sendText(session.waId, questions[0]);
  }

  // No predefined questions — ask for requirement freeform
  await advance(session, {}, STATES.QUOTATION_PENDING);
  return sendText(session.waId, c.quotationAskReq || 'Please describe your requirement.');
}

async function startDemoFlow(session, c) {
  session.demoRequested = true;
  if (!session.name) {
    await advance(session, {}, STATES.DEMO_NAME);
    return sendText(session.waId, c.demoAskName);
  }
  if (!session.businessName) {
    await advance(session, {}, STATES.DEMO_BUSINESS);
    return sendText(session.waId, c.askBusinessName);
  }
  if (!session.phone) {
    await advance(session, {}, STATES.AWAITING_PHONE);
    return sendButtons(session.waId, { body: c.askPhone(session.waId), buttons: c.phoneButtons });
  }
  await advance(session, {}, STATES.DEMO_TIME);
  return sendText(session.waId, c.demoAskTime);
}

async function startHandoff(session, c) {
  session.needsHuman = true;
  session.state      = STATES.HANDOFF;
  session.leadStatus = 'TEAM_REVIEW';
  await session.save();
  await saveLeadFromSession(session);
  return sendText(session.waId, c.handoff(SUPPORT_PHONE));
}

// ──────────────────────────────────────────────────────────────────
// REQUIREMENT COLLECTION HELPERS
// ──────────────────────────────────────────────────────────────────

function storeReqAnswer(session, step, answer, questions) {
  // Map step index to meaningful session field where possible
  const q = (questions[step] || '').toLowerCase();
  if (step === 0) session.purpose      = answer;
  else if (q.includes('current') || q.includes('manage') || q.includes('process'))
    session.currentProcess = answer;
  else if (q.includes('existing') || q.includes('software') || q.includes('tool') || q.includes('system'))
    session.existingSystem = answer;
  else
    session.purpose = (session.purpose || '') + ' | ' + answer;
}

async function continueReqCollection(session, c) {
  const svc = findServiceById(session.serviceId);
  const questions = (svc && svc.requirementQuestions) || [];
  const step = session.reqStep || 0;
  if (step < questions.length) {
    return sendText(session.waId, questions[step]);
  }
  // Done collecting — go to name capture
  session.leadStatus = 'QUALIFIED';
  await advance(session, {}, STATES.AWAITING_NAME);
  return sendText(session.waId, c.askName(''));
}

// ──────────────────────────────────────────────────────────────────
// FINISH HELPERS
// ──────────────────────────────────────────────────────────────────

async function finishLead(session, c) {
  await saveLeadFromSession(session);
  return sendText(session.waId, buildLeadSummary(session, c));
}

async function finishDemoBooking(session, c) {
  session.leadStatus = 'DEMO_REQUESTED';
  await saveLeadFromSession(session);
  const dateStr = session.preferredContactDate || 'preferred date';
  const timeStr = session.preferredContactTime || 'preferred time';
  const msg =
    `Demo booked ✅\n\n` +
    `👤 *Name:* ${session.name}\n` +
    `🎯 *Service:* ${session.serviceTitle || 'your selected service'}\n` +
    `📅 *Date:* ${dateStr}\n` +
    `⏰ *Time:* ${timeStr}\n` +
    `📞 *Phone:* ${session.phone}\n\n` +
    `Our team will confirm your demo slot and reach you on WhatsApp shortly.\n\n` +
    `Type MENU to explore more services.`;
  return sendText(session.waId, msg);
}

// ──────────────────────────────────────────────────────────────────
// LANGUAGE CHANGE DETECTION
// ──────────────────────────────────────────────────────────────────

const LANG_TRIGGERS = {
  en: ['english', 'in english', 'english please'],
  hi: ['hindi', 'हिंदी', 'हिंदी में', 'hindi mein', 'hindi me'],
  kn: ['kannada', 'ಕನ್ನಡ', 'kannada beku', 'kannada please'],
  ta: ['tamil', 'தமிழ்', 'tamil please', 'தமிழில்'],
  te: ['telugu', 'తెలుగు', 'telugu lo', 'telugulo'],
  ml: ['malayalam', 'മലയാളം'],
  mr: ['marathi', 'मराठी'],
  bn: ['bengali', 'বাংলা'],
  gu: ['gujarati', 'ગુજરાતી'],
  pa: ['punjabi', 'ਪੰਜਾਬੀ'],
  or: ['odia', 'ଓଡ଼ିଆ'],
  as: ['assamese', 'অসমীয়া'],
  ur: ['urdu', 'اردو'],
};

function detectLanguageChangeRequest(text) {
  if (!text) return null;
  const t = text.trim().toLowerCase();
  for (const [code, triggers] of Object.entries(LANG_TRIGGERS)) {
    if (triggers.some((trig) => t.includes(trig))) return code;
  }
  return null;
}

async function resendCurrentContext(session, c) {
  switch (session.state) {
    case STATES.MAIN_MENU:         return sendMainMenu(session.waId, c);
    case STATES.CATEGORY_SENT:     return sendCategoryMenu(session.waId, session.categoryId, c);
    case STATES.SERVICE_INTRO_SENT: {
      const svc = findServiceById(session.serviceId);
      if (svc) return sendServiceIntro(session.waId, svc, c);
      return sendMainMenu(session.waId, c);
    }
    case STATES.AWAITING_NAME:     return sendText(session.waId, c.askName(''));
    case STATES.DEMO_NAME:         return sendText(session.waId, c.demoAskName);
    case STATES.AWAITING_PHONE:    return sendButtons(session.waId, { body: c.askPhone(session.waId), buttons: c.phoneButtons });
    case STATES.AWAITING_CONTACT_TIME: return sendText(session.waId, c.askContactTime);
    default:                       return sendMainMenu(session.waId, c);
  }
}

// ──────────────────────────────────────────────────────────────────
// SESSION RESET
// ──────────────────────────────────────────────────────────────────

function resetSession(session) {
  // Keep lang — user shouldn't have to re-select language on every menu reset
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

module.exports = { handleMessage, sendMainMenu };
