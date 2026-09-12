/**
 * Master copy — English base strings for the full SkyUp bot.
 * All other languages extend this via languages.js.
 */

const BRAND = 'SkyUp Digital Solutions';

module.exports = {
  BRAND,

  // ── Main menu ──────────────────────────────────────────────────────
  mainMenu: {
    body:
      `Welcome to *${BRAND}* 👋\n\n` +
      `We *Build. Automate. Grow. Optimize.*\n\n` +
      `How can we help your business today?`,
    footer: 'Type MENU anytime to restart',
    button: 'Explore SkyUp',
  },

  // ── Category / service menus ───────────────────────────────────────
  categoryMenu: {
    body:   'Select a service to learn more:',
    footer: 'Type MENU to go back to the start',
    button: 'View Services',
  },

  // ── Service actions (shown after pitch) ────────────────────────────
  serviceActions: {
    body:   'What would you like to do next?',
    footer: 'Our team is ready to help',
  },

  // ── PDF ────────────────────────────────────────────────────────────
  pdfCaption:    (service) => `Here is our *${service}* brochure — download it to learn more.`,
  pdfNotAvailable: `The PDF for this service is not available yet. Our team can share details directly — tap Talk to Team.`,

  // ── Language changed ───────────────────────────────────────────────
  langChanged: `Language updated. Continuing in English.`,

  // ── Quotation flow ─────────────────────────────────────────────────
  quotationIntro:
    `To prepare an accurate quotation, our team needs to understand your requirement and current process.\n\n` +
    `I will ask you a few quick questions.`,
  quotationAskReq:
    `Please briefly describe what you need — what problem should we solve and how are you currently managing it?`,

  // ── Demo flow ──────────────────────────────────────────────────────
  demoAskName:  `To book a demo, may I have your name please?`,
  askBusinessName: `What is the name of your business?`,
  demoAskTime:
    `What is your preferred date and time for the demo?\n\n` +
    `Example: Tomorrow 11am  |  15 Oct 3pm  |  Monday morning`,
  demoConfirm: ({ name, service, time }) =>
    `Demo request received ✅\n\n` +
    `*Name:* ${name}\n` +
    `*Service:* ${service}\n` +
    `*Preferred Time:* ${time}\n\n` +
    `Our team will confirm the slot and reach you on WhatsApp.\n\n` +
    `_Note: This is a preferred time, not a confirmed booking. Our team will contact you to confirm._`,

  // ── Lead capture ───────────────────────────────────────────────────
  askName:    (_service) => `May I have your name please?`,
  askNameAfterIntro: (_service) => `May I know your name so we can get started? 😊`,
  askPurpose: (name, service) => `Thanks ${name}! Briefly, what do you need help with in *${service}*?`,
  askPhone:   (waNumber)      => `Is *${waNumber}* the best number to reach you?`,
  phoneButtons: [
    { id: 'phone_use_wa', title: '✅ Yes, use this' },
    { id: 'phone_other',  title: '📱 Different number' },
  ],
  askAltPhone:    `Please type the 10-digit mobile number our team should use.`,
  askContactTime:
    `What is the best time for our team to contact you?\n\n` +
    `Example: Today 3pm  |  Tomorrow 11am  |  Anytime this week`,

  // ── Confirmation summary ───────────────────────────────────────────
  confirmSummary: {
    header:      `Thank you! ✅\n\nYour request has been recorded:`,
    name:        'Name',
    business:    'Business',
    service:     'Service',
    subService:  'Sub-service',
    requirement: 'Requirement',
    phone:       'Phone',
    preferredTime: 'Preferred contact time',
    quotation:   'Quotation',
    demo:        'Demo',
    requested:   'Requested',
    footer:
      `Our team will review your requirement and contact you.\n\n` +
      `Is there anything else you would like to explore? Type MENU.`,
  },

  // ── Handoff ────────────────────────────────────────────────────────
  handoff: (phone) =>
    `Let me connect you with our team directly.\n\n` +
    `📞 *Call / WhatsApp:* ${phone}\n\n` +
    `Or type MENU to start over.`,
  handoffRepeat: (wa) =>
    `Our team will reach out to you shortly on WhatsApp.\n\n` +
    `You can also contact us directly: ${wa}\n\n` +
    `Type MENU to explore services.`,

  // ── Already done ───────────────────────────────────────────────────
  alreadyDone:
    `Our team already has your details and will reach out soon ✅\n\n` +
    `Need something else? Type MENU.`,

  // ── Portfolio ──────────────────────────────────────────────────────
  portfolio: (url) =>
    `You can view SkyUp's work and case studies here:\n\n` +
    `🔗 ${url}\n\n` +
    `Our team can also walk you through specific projects. Type *Talk to Team* or tap the button.`,

  // ── About SkyUp ───────────────────────────────────────────────────
  aboutSkyUp:
    `*SkyUp Digital Solutions LLP*\n\n` +
    `We are a Software, AI & Digital Growth partner.\n\n` +
    `Our operating model: *Build → Automate → Grow → Optimize*\n\n` +
    `We build custom systems around your workflow, use AI and automation to remove repetitive work, ` +
    `use marketing and growth systems to generate demand, and use analytics to optimize results.\n\n` +
    `Type MENU to explore what we can do for your business.`,

  // ── Recommendation helper ──────────────────────────────────────────
  recommendHelper:
    `No problem — I can help you find the right solution.\n\n` +
    `Tell me about your business:\n` +
    `1️⃣ What type of business do you run?\n` +
    `2️⃣ What is your biggest challenge right now?\n` +
    `3️⃣ What result are you trying to achieve?\n\n` +
    `Share as much or as little as you like — I'll recommend the best SkyUp service for you.`,

  // ── Off-topic / errors ────────────────────────────────────────────
  offTopic: `Sorry, I could not understand that. Please use the menu or type MENU to restart.`,
  errors: {
    nameTooShort:    `That looks a bit short — please share your full name.`,
    nameLooksWrong:  `That doesn't look like a name. Please type your full name.`,
    purposeTooShort: `Could you tell me a little more about what you need?`,
    badPhone:        `That doesn't look like a valid 10-digit mobile number. Please try again.`,
    generic:         `Something went wrong on our side 😔 Please try again in a moment.`,
  },

  // ── Reset words (English) ─────────────────────────────────────────
  resetWords: ['menu', 'restart', 'start', 'hi', 'hello', 'hey', 'reset', 'start over', 'main menu', 'home', 'back'],
};
