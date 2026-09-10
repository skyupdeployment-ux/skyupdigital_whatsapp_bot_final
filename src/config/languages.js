/**
 * languages.js — Multilingual copy for SkyUp WhatsApp Bot.
 *
 * Supports 13 Indian languages + English.
 * Each language block MUST include all keys from the English master.
 * Keys not translated default to English automatically via getCopy().
 *
 * Language codes: en hi mr gu bn ta te kn ml pa or as ur
 */

const BRAND = 'SkyUp Digital Solutions';

// ─────────────────────────────────────────── Language registry

const LANGUAGES = [
  { code: 'en', label: 'English',   nativeLabel: 'English',    script: /[a-z]/i },
  { code: 'hi', label: 'Hindi',     nativeLabel: 'हिन्दी',     script: /[\u0900-\u097F]/ },
  { code: 'mr', label: 'Marathi',   nativeLabel: 'मराठी',      script: /[\u0900-\u097F]/ },
  { code: 'gu', label: 'Gujarati',  nativeLabel: 'ગુજરાતી',    script: /[\u0A80-\u0AFF]/ },
  { code: 'bn', label: 'Bengali',   nativeLabel: 'বাংলা',      script: /[\u0980-\u09FF]/ },
  { code: 'ta', label: 'Tamil',     nativeLabel: 'தமிழ்',       script: /[\u0B80-\u0BFF]/ },
  { code: 'te', label: 'Telugu',    nativeLabel: 'తెలుగు',     script: /[\u0C00-\u0C7F]/ },
  { code: 'kn', label: 'Kannada',   nativeLabel: 'ಕನ್ನಡ',      script: /[\u0C80-\u0CFF]/ },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം',    script: /[\u0D00-\u0D7F]/ },
  { code: 'pa', label: 'Punjabi',   nativeLabel: 'ਪੰਜਾਬੀ',     script: /[\u0A00-\u0A7F]/ },
  { code: 'or', label: 'Odia',      nativeLabel: 'ଓଡ଼ିଆ',      script: /[\u0B00-\u0B7F]/ },
  { code: 'as', label: 'Assamese',  nativeLabel: 'অসমীয়া',    script: /[\u0980-\u09FF]/ },
  { code: 'ur', label: 'Urdu',      nativeLabel: 'اردو',       script: /[\u0600-\u06FF]/ },
];

const UNAMBIGUOUS = ['gu', 'ta', 'te', 'kn', 'ml', 'pa', 'or', 'ur'];

function detectLanguage(text) {
  if (!text) return null;
  const t = text.trim();
  for (const lang of LANGUAGES) {
    if (UNAMBIGUOUS.includes(lang.code) && lang.script.test(t)) return lang.code;
  }
  if (/[\u0900-\u097F]/.test(t)) {
    return /नमस्कार|माझं|आहे|मला|आपण|काय|कृपया/.test(t) ? 'mr' : 'hi';
  }
  if (/[\u0980-\u09FF]/.test(t)) {
    return /[\u09E1\u09F0\u09F1]/.test(t) ? 'as' : 'bn';
  }
  if (/^[a-z\s\d!?,.'"-]+$/i.test(t)) return 'en';
  return null;
}

function buildLanguageSections() {
  const group1 = LANGUAGES.slice(0, 6);
  const group2 = LANGUAGES.slice(6);
  return [
    {
      title: 'Select Language',
      rows: group1.map((l) => ({ id: `lang_${l.code}`, title: l.nativeLabel, description: l.label })),
    },
    {
      title: 'भाषा / மொழி / ভাষা',
      rows: group2.map((l) => ({ id: `lang_${l.code}`, title: l.nativeLabel, description: l.label })),
    },
  ];
}

function isLanguageReply(replyId) { return typeof replyId === 'string' && replyId.startsWith('lang_'); }
function codeFromReplyId(replyId) { return replyId.replace('lang_', ''); }
function isValidLanguageCode(code) { return LANGUAGES.some((l) => l.code === code); }

// ─────────────────────────────────────────── Master English copy

const EN = {
  mainMenu: {
    body:
      `Welcome to *${BRAND}* 👋\n\n` +
      `We *Build. Automate. Grow. Optimize.*\n\n` +
      `How can we help your business today?`,
    footer: 'Type MENU anytime to restart',
    button: 'Explore SkyUp',
  },
  categoryMenu: {
    body:   'Select a service to learn more:',
    footer: 'Type MENU to go back',
    button: 'View Services',
  },
  serviceActions: {
    body:   'What would you like to do next?',
    footer: 'Our team is ready to help',
  },
  pdfCaption:       (service) => `Here is our *${service}* brochure — download it to learn more.`,
  pdfNotAvailable:  `The PDF for this service is not yet available. Tap *Talk to Team* for details.`,
  generalBrochureCaption: `Here is the *SkyUp Digital Solutions* company brochure — get a full overview of everything we do.`,
  langChanged:      `Language updated. Continuing in English.`,
  quotationIntro:
    `To prepare an accurate quotation, our team needs to understand your requirement.\n\nI will ask you a few quick questions.`,
  quotationAskReq:
    `Please describe what you need — what problem should we solve and how are you currently managing it?`,
  demoAskName:      `To book a demo, may I have your name please?`,
  askBusinessName:  `What is the name of your business?`,
  demoAskTime:
    `What is your preferred date and time for the demo?\n\nExample: Tomorrow 11am  |  15 Oct 3pm  |  Monday morning`,
  demoConfirm: ({ name, service, time }) =>
    `Demo request received ✅\n\n*Name:* ${name}\n*Service:* ${service}\n*Preferred time:* ${time}\n\n` +
    `Our team will confirm the slot and reach you on WhatsApp.\n` +
    `_This is a preferred time, not a confirmed booking._`,
  askName:           (_s) => `May I have your name please?`,
  askNameAfterIntro: (_s) => `May I know your name so we can get started? 😊`,
  askPurpose:        (name, service) => `Thanks ${name}! What do you need help with in *${service}*?`,
  askPhone:          (waNumber) => `Is *${waNumber}* the best number to reach you?`,
  phoneButtons: [
    { id: 'phone_use_wa', title: '✅ Yes, use this' },
    { id: 'phone_other',  title: '📱 Different number' },
  ],
  askAltPhone:      `Please type the 10-digit mobile number our team should use.`,
  askContactTime:
    `What is the best time for our team to contact you?\n\nExample: Today 3pm  |  Tomorrow 11am  |  Anytime this week`,
  confirmSummary: {
    header:       `Thank you! ✅\n\nYour request has been recorded:`,
    name:         'Name',
    business:     'Business',
    service:      'Service',
    subService:   'Sub-service',
    requirement:  'Requirement',
    phone:        'Phone',
    preferredTime:'Preferred contact time',
    quotation:    'Quotation',
    demo:         'Demo',
    requested:    'Requested',
    footer:
      `Our team will review your requirement and contact you.\n\nType MENU to explore more services.`,
  },
  handoff: (phone) =>
    `Let me connect you with our team directly.\n\n📞 *Call / WhatsApp:* ${phone}\n\nOr type MENU to start over.`,
  handoffRepeat: (wa) =>
    `Our team will reach out shortly.\n\nYou can also contact us: ${wa}\n\nType MENU to explore services.`,
  alreadyDone:
    `Our team already has your details and will reach out soon ✅\n\nNeed something else? Type MENU.`,
  portfolio: (url) =>
    `View SkyUp's work and case studies:\n\n🔗 ${url}\n\nOr tap *Talk to Team* to discuss specific projects.`,
  aboutSkyUp:
    `*SkyUp Digital Solutions LLP*\n\n` +
    `Software, AI & Digital Growth partner.\n\n` +
    `*Build → Automate → Grow → Optimize*\n\n` +
    `Type MENU to explore our services.`,
  recommendHelper:
    `I can help you find the right solution.\n\n` +
    `Tell me:\n1️⃣ What type of business do you run?\n` +
    `2️⃣ What is your biggest challenge right now?\n` +
    `3️⃣ What result are you trying to achieve?\n\n` +
    `I will recommend the best SkyUp service for you.`,
  offTopic: `Sorry, I could not understand that. Please use the menu or type MENU to restart.`,
  errors: {
    nameTooShort:    `That looks a bit short — please share your full name.`,
    nameLooksWrong:  `That doesn't look like a name. Please type your full name.`,
    purposeTooShort: `Could you tell me a little more about what you need?`,
    badPhone:        `That doesn't look like a valid 10-digit mobile number. Please try again.`,
    generic:         `Something went wrong on our side 😔 Please try again in a moment.`,
  },
  resetWords: ['menu', 'restart', 'start', 'hi', 'hello', 'hey', 'reset', 'start over', 'main menu', 'home', 'back'],
};

// ─────────────────────────────────────────── Per-language overrides
// Only translate the user-facing strings. Function signatures must match EN.

const TRANSLATIONS = {

  hi: {
    mainMenu: {
      body:   `*${BRAND}* में आपका स्वागत है 👋\n\nहम *बनाते हैं। स्वचालित करते हैं। बढ़ाते हैं। अनुकूलित करते हैं।*\n\nआज हम आपके व्यवसाय के लिए क्या कर सकते हैं?`,
      footer: 'कभी भी MENU टाइप करें',
      button: 'SkyUp एक्सप्लोर करें',
    },
    categoryMenu: { body: 'अधिक जानने के लिए एक सेवा चुनें:', footer: 'वापस जाने के लिए MENU टाइप करें', button: 'सेवाएं देखें' },
    serviceActions: { body: 'आप आगे क्या करना चाहेंगे?', footer: 'हमारी टीम मदद के लिए तैयार है' },
    pdfCaption:       (s) => `यह हमारी *${s}* ब्रोशर है — अधिक जानने के लिए डाउनलोड करें।`,
    pdfNotAvailable:  `इस सेवा की PDF अभी उपलब्ध नहीं है। *हमारी टीम से बात करें* पर टैप करें।`,
    generalBrochureCaption: `यह *SkyUp Digital Solutions* की कंपनी ब्रोशर है — हम जो कुछ भी करते हैं उसका पूरा अवलोकन पाएं।`,
    langChanged:      `भाषा बदल दी गई। हिन्दी में जारी है।`,
    quotationIntro:   `सटीक उद्धरण तैयार करने के लिए हमारी टीम को आपकी आवश्यकता समझनी होगी।\n\nमैं कुछ त्वरित प्रश्न पूछूंगा।`,
    quotationAskReq:  `कृपया बताएं आपको क्या चाहिए — आप वर्तमान में इस प्रक्रिया को कैसे प्रबंधित करते हैं?`,
    demoAskName:      `डेमो बुक करने के लिए, कृपया आपका नाम बताएं?`,
    askBusinessName:  `आपके व्यवसाय का नाम क्या है?`,
    demoAskTime:      `डेमो के लिए आपका पसंदीदा दिनांक और समय क्या है?\n\nउदाहरण: कल सुबह 11 बजे | 15 अक्टूबर शाम 3 बजे`,
    demoConfirm: ({ name, service, time }) =>
      `डेमो अनुरोध प्राप्त हुआ ✅\n\n*नाम:* ${name}\n*सेवा:* ${service}\n*पसंदीदा समय:* ${time}\n\n` +
      `हमारी टीम आपसे WhatsApp पर संपर्क करके स्लॉट की पुष्टि करेगी।`,
    askName:           (_s) => `कृपया अपना नाम बताएं?`,
    askNameAfterIntro: (_s) => `शुरुआत के लिए कृपया अपना नाम बताएं? 😊`,
    askPurpose:        (name, service) => `धन्यवाद ${name}! *${service}* में आपको क्या मदद चाहिए?`,
    askPhone:          (n) => `क्या *${n}* आपसे संपर्क करने का सबसे अच्छा नंबर है?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ हाँ, यही नंबर' }, { id: 'phone_other', title: '📱 दूसरा नंबर' }],
    askAltPhone:       `कृपया वह 10 अंकों का मोबाइल नंबर टाइप करें जिस पर हमारी टीम संपर्क करे।`,
    askContactTime:    `हमारी टीम को आपसे संपर्क करने का सबसे अच्छा समय क्या है?\n\nउदाहरण: आज शाम 3 बजे | कल सुबह 11 बजे`,
    confirmSummary: {
      header: `धन्यवाद! ✅\n\nआपका अनुरोध दर्ज किया गया:`,
      name: 'नाम', business: 'व्यवसाय', service: 'सेवा', subService: 'उप-सेवा',
      requirement: 'आवश्यकता', phone: 'फ़ोन', preferredTime: 'पसंदीदा संपर्क समय',
      quotation: 'उद्धरण', demo: 'डेमो', requested: 'अनुरोधित',
      footer: `हमारी टीम आपकी आवश्यकता की समीक्षा करेगी और आपसे संपर्क करेगी।\n\nMENU टाइप करें।`,
    },
    handoff: (p) => `मैं आपको सीधे हमारी टीम से जोड़ता हूँ।\n\n📞 *कॉल / WhatsApp:* ${p}\n\nया MENU टाइप करें।`,
    handoffRepeat: (wa) => `हमारी टीम जल्द संपर्क करेगी।\n\nआप सीधे भी संपर्क कर सकते हैं: ${wa}`,
    alreadyDone:   `हमारी टीम के पास आपकी जानकारी है और जल्द संपर्क करेगी ✅\n\nMENU टाइप करें।`,
    portfolio: (url) => `SkyUp का काम देखें:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nसॉफ्टवेयर, AI और डिजिटल ग्रोथ पार्टनर।\n\n*बनाएं → स्वचालित करें → बढ़ाएं → अनुकूलित करें*`,
    recommendHelper:
      `मैं आपके लिए सही समाधान खोजने में मदद करूंगा।\n\n` +
      `बताएं:\n1️⃣ आपका व्यवसाय किस क्षेत्र में है?\n2️⃣ अभी सबसे बड़ी चुनौती क्या है?\n3️⃣ आप क्या परिणाम चाहते हैं?`,
    offTopic: `माफ़ करें, मैं यह नहीं समझ पाया। कृपया मेनू का उपयोग करें या MENU टाइप करें।`,
    errors: {
      nameTooShort: 'यह बहुत छोटा है — कृपया पूरा नाम लिखें।',
      nameLooksWrong: 'यह नाम जैसा नहीं लगता। कृपया अपना नाम टाइप करें।',
      purposeTooShort: 'कृपया थोड़ा और बताएं।',
      badPhone: 'यह 10 अंकों का वैध नंबर नहीं है। कृपया दोबारा कोशिश करें।',
      generic: 'कुछ गलत हो गया 😔 कृपया दोबारा कोशिश करें।',
    },
    resetWords: ['menu', 'मेनू', 'शुरू', 'नमस्ते', 'restart', 'start', 'home', 'back'],
  },

  kn: {
    mainMenu: {
      body:   `*${BRAND}*ಗೆ ಸ್ವಾಗತ 👋\n\nನಾವು *ನಿರ್ಮಿಸುತ್ತೇವೆ. ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸುತ್ತೇವೆ. ಬೆಳೆಸುತ್ತೇವೆ. ಅನುಕೂಲಿಸುತ್ತೇವೆ.*\n\nಇಂದು ನಿಮ್ಮ ವ್ಯವಸಾಯಕ್ಕೆ ನಾವು ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?`,
      footer: 'ಯಾವಾಗಲಾದರೂ MENU ಟೈಪ್ ಮಾಡಿ',
      button: 'SkyUp ಅನ್ವೇಷಿಸಿ',
    },
    categoryMenu: { body: 'ಹೆಚ್ಚು ತಿಳಿಯಲು ಒಂದು ಸೇವೆ ಆಯ್ಕೆ ಮಾಡಿ:', footer: 'ಹಿಂತಿರುಗಲು MENU ಟೈಪ್ ಮಾಡಿ', button: 'ಸೇವೆಗಳನ್ನು ನೋಡಿ' },
    serviceActions: { body: 'ಮುಂದೆ ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?', footer: 'ನಮ್ಮ ತಂಡ ಸಹಾಯ ಮಾಡಲು ಸಿದ್ಧ' },
    pdfCaption:       (s) => `ಇದು ನಮ್ಮ *${s}* ಬ್ರೋಷರ್ — ಹೆಚ್ಚು ತಿಳಿಯಲು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ।`,
    pdfNotAvailable:  `ಈ ಸೇವೆಯ PDF ಇನ್ನೂ ಲಭ್ಯವಿಲ್ಲ। *ತಂಡದೊಂದಿಗೆ ಮಾತನಾಡಿ* ಟ್ಯಾಪ್ ಮಾಡಿ।`,
    generalBrochureCaption: `ಇದು *SkyUp Digital Solutions* ಕಂಪನಿ ಬ್ರೋಷರ್ — ನಾವು ಮಾಡುವ ಎಲ್ಲದರ ಸಂಪೂರ್ಣ ಅವಲೋಕನ ಪಡೆಯಿರಿ।`,
    langChanged:      `ಭಾಷೆ ಬದಲಾಗಿದೆ। ಕನ್ನಡದಲ್ಲಿ ಮುಂದುವರಿಯಲಾಗುತ್ತಿದೆ।`,
    quotationIntro:   `ನಿಖರ ಉದ್ಧರಣ ತಯಾರಿಸಲು ನಮ್ಮ ತಂಡಕ್ಕೆ ನಿಮ್ಮ ಅಗತ್ಯ ಅರ್ಥ ಮಾಡಿಕೊಳ್ಳಬೇಕು।\n\nನಾನು ಕೆಲವು ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳುತ್ತೇನೆ।`,
    quotationAskReq:  `ನಿಮಗೆ ಏನು ಬೇಕು ಎಂದು ವಿವರಿಸಿ — ನೀವು ಈಗ ಈ ಪ್ರಕ್ರಿಯೆಯನ್ನು ಹೇಗೆ ನಿರ್ವಹಿಸುತ್ತೀರಿ?`,
    demoAskName:      `ಡೆಮೊ ಬುಕ್ ಮಾಡಲು, ನಿಮ್ಮ ಹೆಸರು ಹೇಳಿ?`,
    askBusinessName:  `ನಿಮ್ಮ ವ್ಯವಸಾಯದ ಹೆಸರು ಏನು?`,
    demoAskTime:      `ಡೆಮೊಗೆ ನಿಮ್ಮ ಆದ್ಯತೆಯ ದಿನಾಂಕ ಮತ್ತು ಸಮಯ ಯಾವುದು?`,
    demoConfirm: ({ name, service, time }) =>
      `ಡೆಮೊ ವಿನಂತಿ ಸ್ವೀಕರಿಸಲಾಗಿದೆ ✅\n\n*ಹೆಸರು:* ${name}\n*ಸೇವೆ:* ${service}\n*ಆದ್ಯತೆಯ ಸಮಯ:* ${time}\n\nನಮ್ಮ ತಂಡ ದೃಢೀಕರಿಸುತ್ತದೆ।`,
    askName:           (_s) => `ನಿಮ್ಮ ಹೆಸರು ಹೇಳುತ್ತೀರಾ?`,
    askNameAfterIntro: (_s) => `ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಹೆಸರು ಹೇಳಿ? 😊`,
    askPurpose:        (name, service) => `ಧನ್ಯವಾದ ${name}! *${service}*ನಲ್ಲಿ ನಿಮಗೆ ಏನು ಸಹಾಯ ಬೇಕು?`,
    askPhone:          (n) => `*${n}* ನಿಮ್ಮನ್ನು ತಲುಪಲು ಸರಿಯಾದ ಸಂಖ್ಯೆಯೇ?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ ಹೌದು, ಇದೇ' }, { id: 'phone_other', title: '📱 ಬೇರೆ ನಂಬರ್' }],
    askAltPhone:       `ನಮ್ಮ ತಂಡ ಬಳಸಬೇಕಾದ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ನಂಬರ್ ಟೈಪ್ ಮಾಡಿ।`,
    askContactTime:    `ನಮ್ಮ ತಂಡ ನಿಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಲು ಉತ್ತಮ ಸಮಯ ಯಾವುದು?`,
    confirmSummary: {
      header: `ಧನ್ಯವಾದ! ✅\n\nನಿಮ್ಮ ವಿನಂತಿ ದಾಖಲಾಗಿದೆ:`,
      name: 'ಹೆಸರು', business: 'ವ್ಯವಸಾಯ', service: 'ಸೇವೆ', subService: 'ಉಪ-ಸೇವೆ',
      requirement: 'ಅಗತ್ಯ', phone: 'ಫೋನ್', preferredTime: 'ಆದ್ಯತೆಯ ಸಮಯ',
      quotation: 'ಉದ್ಧರಣ', demo: 'ಡೆಮೊ', requested: 'ವಿನಂತಿಸಲಾಗಿದೆ',
      footer: `ನಮ್ಮ ತಂಡ ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುತ್ತದೆ।\n\nMENU ಟೈಪ್ ಮಾಡಿ।`,
    },
    handoff: (p) => `ನಿಮ್ಮನ್ನು ನಮ್ಮ ತಂಡದೊಂದಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸುತ್ತೇನೆ।\n\n📞 *ಕರೆ / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `ನಮ್ಮ ತಂಡ ಶೀಘ್ರದಲ್ಲೇ ಸಂಪರ್ಕಿಸುತ್ತದೆ।\n\nನೇರ ಸಂಪರ್ಕ: ${wa}`,
    alreadyDone:   `ನಮ್ಮ ತಂಡಕ್ಕೆ ನಿಮ್ಮ ವಿವರಗಳಿವೆ ✅\n\nMENU ಟೈಪ್ ಮಾಡಿ।`,
    portfolio: (url) => `SkyUp ಕೆಲಸ ನೋಡಿ:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nಸಾಫ್ಟ್‌ವೇರ್, AI ಮತ್ತು ಡಿಜಿಟಲ್ ಬೆಳವಣಿಗೆ ಪಾಲುದಾರ।`,
    recommendHelper: `ನಾನು ನಿಮಗೆ ಸರಿಯಾದ ಪರಿಹಾರ ಹುಡುಕಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ।\n\nಹೇಳಿ:\n1️⃣ ನೀವು ಯಾವ ಬ್ಯುಸಿನೆಸ್ ನಡೆಸುತ್ತೀರಿ?\n2️⃣ ಈಗ ಅತಿ ದೊಡ್ಡ ಸವಾಲು ಏನು?\n3️⃣ ನೀವು ಯಾವ ಫಲಿತಾಂಶ ಬಯಸುತ್ತೀರಿ?`,
    offTopic: `ಕ್ಷಮಿಸಿ, ನನಗೆ ಅರ್ಥವಾಗಲಿಲ್ಲ। ಮೆನು ಬಳಸಿ ಅಥವಾ MENU ಟೈಪ್ ಮಾಡಿ।`,
    errors: {
      nameTooShort: 'ಇದು ಸ್ವಲ್ಪ ಚಿಕ್ಕದಾಗಿದೆ — ಪೂರ್ಣ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ।',
      nameLooksWrong: 'ಇದು ಹೆಸರಿನಂತೆ ಕಾಣುತ್ತಿಲ್ಲ। ನಿಮ್ಮ ಹೆಸರು ಟೈಪ್ ಮಾಡಿ।',
      purposeTooShort: 'ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಹೇಳಿ।',
      badPhone: 'ಇದು ಮಾನ್ಯ 10 ಅಂಕಿಯ ನಂಬರ್ ಅಲ್ಲ। ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ।',
      generic: 'ಏನೋ ತಪ್ಪಾಯಿತು 😔 ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ।',
    },
    resetWords: ['menu', 'ಮೆನು', 'ಪ್ರಾರಂಭ', 'ನಮಸ್ಕಾರ', 'restart', 'start', 'home', 'back'],
  },

  ta: {
    mainMenu: {
      body:   `*${BRAND}*க்கு வரவேற்கிறோம் 👋\n\nநாங்கள் *கட்டுகிறோம். தானியங்குபடுத்துகிறோம். வளர்க்கிறோம். மேம்படுத்துகிறோம்.*\n\nஇன்று உங்கள் வணிகத்திற்கு எவ்வாறு உதவலாம்?`,
      footer: 'எப்போதும் MENU தட்டச்சு செய்யலாம்',
      button: 'SkyUp ஆராயுங்கள்',
    },
    categoryMenu: { body: 'மேலும் அறிய ஒரு சேவையை தேர்ந்தெடுக்கவும்:', footer: 'திரும்ப MENU தட்டச்சு செய்யவும்', button: 'சேவைகள் காண்க' },
    serviceActions: { body: 'அடுத்து என்ன செய்ய விரும்புகிறீர்கள்?', footer: 'எங்கள் குழு உதவ தயாராக உள்ளது' },
    pdfCaption:       (s) => `இது எங்கள் *${s}* சிற்றேடு — மேலும் அறிய பதிவிறக்கவும்।`,
    pdfNotAvailable:  `இந்த சேவைக்கான PDF இன்னும் கிடைக்கவில்லை। *குழுவிடம் பேசுங்கள்* தட்டவும்।`,
    generalBrochureCaption: `இது *SkyUp Digital Solutions* நிறுவன சிற்றேடு — நாங்கள் செய்வதன் முழு கண்ணோட்டம் பெறுங்கள்।`,
    langChanged:      `மொழி மாற்றப்பட்டது। தமிழில் தொடர்கிறோம்।`,
    quotationIntro:   `துல்லியமான விலைப்பட்டியல் தயாரிக்க, எங்கள் குழுவிற்கு உங்கள் தேவை புரிந்துகொள்ள வேண்டும்।\n\nசில கேள்விகள் கேட்கிறேன்।`,
    quotationAskReq:  `உங்களுக்கு என்ன தேவை என்று சொல்லுங்கள் — நீங்கள் இப்போது இதை எவ்வாறு நிர்வகிக்கிறீர்கள்?`,
    demoAskName:      `டெமோ பதிவு செய்ய, உங்கள் பெயர் சொல்லுங்கள்?`,
    askBusinessName:  `உங்கள் வணிகத்தின் பெயர் என்ன?`,
    demoAskTime:      `டெமோவுக்கான விருப்பமான தேதி மற்றும் நேரம் என்ன?`,
    demoConfirm: ({ name, service, time }) =>
      `டெமோ கோரிக்கை பெறப்பட்டது ✅\n\n*பெயர்:* ${name}\n*சேவை:* ${service}\n*விருப்பமான நேரம்:* ${time}\n\nகுழு உறுதிப்படுத்தும்।`,
    askName:           (_s) => `உங்கள் பெயர் சொல்லுங்கள்?`,
    askNameAfterIntro: (_s) => `தொடர உங்கள் பெயரை சொல்லுங்கள்? 😊`,
    askPurpose:        (name, service) => `நன்றி ${name}! *${service}*ல் என்ன உதவி வேண்டும்?`,
    askPhone:          (n) => `*${n}* உங்களை தொடர்பு கொள்ள சரியான எண்ணா?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ ஆம், இதே எண்' }, { id: 'phone_other', title: '📱 வேறு எண்' }],
    askAltPhone:       `10 இலக்க மொபைல் எண்ணை தட்டச்சு செய்யவும்।`,
    askContactTime:    `எங்கள் குழு தொடர்பு கொள்ள சிறந்த நேரம் என்ன?`,
    confirmSummary: {
      header: `நன்றி! ✅\n\nகோரிக்கை பதிவாகியது:`,
      name: 'பெயர்', business: 'வணிகம்', service: 'சேவை', subService: 'துணை-சேவை',
      requirement: 'தேவை', phone: 'தொலைபேசி', preferredTime: 'விருப்பமான தொடர்பு நேரம்',
      quotation: 'விலைப்பட்டியல்', demo: 'டெமோ', requested: 'கோரப்பட்டது',
      footer: `குழு தொடர்பு கொள்ளும்।\n\nMENU தட்டச்சு செய்யவும்।`,
    },
    handoff: (p) => `நேரடியாக எங்கள் குழுவுடன் இணைக்கிறேன்।\n\n📞 *அழைப்பு / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `குழு விரைவில் தொடர்பு கொள்ளும்।\n\nநேரடி தொடர்பு: ${wa}`,
    alreadyDone:   `குழுவிடம் விவரங்கள் உள்ளன ✅\n\nMENU தட்டச்சு செய்யவும்।`,
    portfolio: (url) => `SkyUp பணியை பாருங்கள்:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nமென்பொருள், AI மற்றும் டிஜிட்டல் வளர்ச்சி பங்காளி।`,
    recommendHelper: `நான் சரியான தீர்வு கண்டுபிடிக்க உதவுவேன்।\n\n1️⃣ எந்த வணிகம் நடத்துகிறீர்கள்?\n2️⃣ இப்போது மிகப்பெரிய சவால் என்ன?\n3️⃣ என்ன முடிவு விரும்புகிறீர்கள்?`,
    offTopic: `மன்னிக்கவும், புரியவில்லை। மெனு பயன்படுத்துங்கள் அல்லது MENU தட்டச்சு செய்யுங்கள்।`,
    errors: {
      nameTooShort: 'சற்று குறைவாக உள்ளது — முழு பெயரை தட்டச்சு செய்யவும்।',
      nameLooksWrong: 'பெயர் போல் தெரியவில்லை। உங்கள் பெயர் தட்டச்சு செய்யவும்।',
      purposeTooShort: 'கொஞ்சம் விவரமாக சொல்லுங்கள்।',
      badPhone: '10 இலக்க நம்பர் சரியில்லை। மீண்டும் முயற்சிக்கவும்।',
      generic: 'சிக்கல் ஏற்பட்டது 😔 மீண்டும் முயற்சிக்கவும்।',
    },
    resetWords: ['menu', 'மெனு', 'தொடங்கு', 'வணக்கம்', 'restart', 'start', 'home', 'back'],
  },

  te: {
    mainMenu: {
      body: `*${BRAND}*కు స్వాగతం 👋\n\nమేము *నిర్మిస్తాం. ఆటోమేట్ చేస్తాం. వృద్ధి చేస్తాం. ఆప్టిమైజ్ చేస్తాం.*\n\nఈరోజు మీ వ్యాపారానికి ఏ విధంగా సహాయపడగలం?`,
      footer: 'ఎప్పుడైనా MENU టైప్ చేయండి',
      button: 'SkyUp అన్వేషించండి',
    },
    categoryMenu: { body: 'మరింత తెలుసుకోవడానికి సేవను ఎంచుకోండి:', footer: 'తిరిగి వెళ్ళడానికి MENU టైప్ చేయండి', button: 'సేవలు చూడండి' },
    serviceActions: { body: 'తదుపరి ఏమి చేయాలనుకుంటున్నారు?', footer: 'మా బృందం సహాయం చేయడానికి సిద్ధంగా ఉంది' },
    pdfCaption:       (s) => `ఇది మా *${s}* బ్రోచర్ — మరింత తెలుసుకోవడానికి డౌన్‌లోడ్ చేయండి।`,
    pdfNotAvailable:  `ఈ సేవకు PDF ఇంకా అందుబాటులో లేదు। *బృందంతో మాట్లాడండి* నొక్కండి।`,
    generalBrochureCaption: `ఇది *SkyUp Digital Solutions* కంపెనీ బ్రోచర్ — మేము చేసే అన్నిటి పూర్తి అవలోకనం పొందండి।`,
    langChanged:      `భాష మార్చబడింది। తెలుగులో కొనసాగుతోంది।`,
    quotationIntro:   `ఖచ్చితమైన కోటేషన్ తయారు చేయడానికి మా బృందానికి మీ అవసరం అర్థం కావాలి।\n\nకొన్ని ప్రశ్నలు అడుగుతాను।`,
    quotationAskReq:  `మీకు ఏమి కావాలో వివరించండి — మీరు ఇప్పుడు దీన్ని ఎలా నిర్వహిస్తున్నారు?`,
    demoAskName:      `డెమో బుక్ చేయడానికి మీ పేరు చెప్పగలరా?`,
    askBusinessName:  `మీ వ్యాపారం పేరు ఏమిటి?`,
    demoAskTime:      `డెమో కోసం మీకు అనుకూలమైన తేదీ మరియు సమయం ఏమిటి?`,
    demoConfirm: ({ name, service, time }) =>
      `డెమో అభ్యర్థన స్వీకరించబడింది ✅\n\n*పేరు:* ${name}\n*సేవ:* ${service}\n*ఇష్టమైన సమయం:* ${time}\n\nమా బృందం నిర్ధారిస్తుంది।`,
    askName:           (_s) => `మీ పేరు చెప్పగలరా?`,
    askNameAfterIntro: (_s) => `ముందుకు వెళ్ళడానికి మీ పేరు చెప్పగలరా? 😊`,
    askPurpose:        (name, service) => `ధన్యవాదాలు ${name}! *${service}*లో మీకు ఏమి సహాయం కావాలి?`,
    askPhone:          (n) => `*${n}* మిమ్మల్ని చేరుకోవడానికి సరైన నంబరా?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ అవును, ఇదే' }, { id: 'phone_other', title: '📱 వేరే నంబర్' }],
    askAltPhone:       `మా బృందం వాడాల్సిన 10 అంకెల మొబైల్ నంబర్ టైప్ చేయండి।`,
    askContactTime:    `మా బృందం మిమ్మల్ని సంప్రదించడానికి ఉత్తమ సమయం ఏమిటి?`,
    confirmSummary: {
      header: `ధన్యవాదాలు! ✅\n\nమీ అభ్యర్థన నమోదు చేయబడింది:`,
      name: 'పేరు', business: 'వ్యాపారం', service: 'సేవ', subService: 'ఉప-సేవ',
      requirement: 'అవసరం', phone: 'ఫోన్', preferredTime: 'ఇష్టమైన సమయం',
      quotation: 'కోటేషన్', demo: 'డెమో', requested: 'అభ్యర్థించారు',
      footer: `మా బృందం మిమ్మల్ని సంప్రదిస్తుంది।\n\nMENU టైప్ చేయండి।`,
    },
    handoff: (p) => `మిమ్మల్ని మా బృందంతో నేరుగా అనుసంధానిస్తున్నాను।\n\n📞 *కాల్ / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `మా బృందం త్వరలో సంప్రదిస్తుంది।\n\nనేరు సంప్రదింపు: ${wa}`,
    alreadyDone:   `మా బృందానికి మీ వివరాలు ఉన్నాయి ✅\n\nMENU టైప్ చేయండి।`,
    portfolio: (url) => `SkyUp పని చూడండి:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nసాఫ్ట్‌వేర్, AI మరియు డిజిటల్ వృద్ధి భాగస్వామి।`,
    recommendHelper: `నేను మీకు సరైన పరిష్కారం కనుగొనడంలో సహాయం చేస్తాను।\n\n1️⃣ మీరు ఏ వ్యాపారం నడుపుతున్నారు?\n2️⃣ ఇప్పుడు అతిపెద్ద సవాలు ఏమిటి?\n3️⃣ ఏ ఫలితం కావాలి?`,
    offTopic: `క్షమించండి, అర్థం కాలేదు। మెనూ వాడండి లేదా MENU టైప్ చేయండి।`,
    errors: {
      nameTooShort: 'కొంచెం తక్కువగా ఉంది — పూర్తి పేరు టైప్ చేయండి।',
      nameLooksWrong: 'పేరులా కనిపించడం లేదు। మీ పేరు టైప్ చేయండి।',
      purposeTooShort: 'కొంచెం ఎక్కువ చెప్పండి।',
      badPhone: 'సరైన 10 అంకెల నంబర్ కాదు। మళ్ళీ ప్రయత్నించండి।',
      generic: 'తప్పు జరిగింది 😔 మళ్ళీ ప్రయత్నించండి।',
    },
    resetWords: ['menu', 'మెనూ', 'ప్రారంభం', 'నమస్కారం', 'restart', 'start', 'home', 'back'],
  },

  ml: {
    mainMenu: {
      body: `*${BRAND}*ലേക്ക് സ്വാഗതം 👋\n\nഞങ്ങൾ *നിർമ്മിക്കുന്നു. ഓട്ടോമേറ്റ് ചെയ്യുന്നു. വളർത്തുന്നു. ഒപ്റ്റിമൈസ് ചെയ്യുന്നു.*\n\nഇന്ന് നിങ്ങളുടെ ബിസിനസ്സിന് ഞങ്ങൾ എങ്ങനെ സഹായിക്കാം?`,
      footer: 'ഏപ്പോഴും MENU ടൈപ്പ് ചെയ്യൂ', button: 'SkyUp പര്യവേക്ഷണം',
    },
    categoryMenu: { body: 'കൂടുതൽ അറിയാൻ ഒരു സേവനം തിരഞ്ഞെടുക്കൂ:', footer: 'MENU ടൈപ്പ് ചെയ്ത് തിരിച്ചു പോകൂ', button: 'സേവനങ്ങൾ കാണൂ' },
    serviceActions: { body: 'അടുത്തതായി എന്ത് ചെയ്യണം?', footer: 'ഞങ്ങളുടെ ടീം സഹായിക്കാൻ തയ്യാർ' },
    pdfCaption:       (s) => `ഇത് ഞങ്ങളുടെ *${s}* ബ്രോഷർ — കൂടുതൽ അറിയാൻ ഡൗൺലോഡ് ചെയ്യൂ।`,
    pdfNotAvailable:  `ഈ സേവനത്തിനുള്ള PDF ഇതുവരെ ലഭ്യമല്ല। *ടീമിനോട് സംസാരിക്കൂ* ടാപ്പ് ചെയ്യൂ।`,
    generalBrochureCaption: `ഇത് *SkyUp Digital Solutions* കമ്പനി ബ്രോഷർ — ഞങ്ങൾ ചെയ്യുന്ന എല്ലാറ്റിന്റെയും പൂർണ്ണ അവലോകനം ലഭിക്കൂ।`,
    langChanged:      `ഭാഷ മാറ്റി. മലയാളത്തിൽ തുടരുന്നു।`,
    quotationIntro:   `കൃത്യമായ ഉദ്ധരണി തയ്യാറാക്കാൻ ടീം നിങ്ങളുടെ ആവശ്യം മനസ്സിലാക്കണം।\n\nചില ചോദ്യങ്ങൾ ചോദിക്കുന്നു।`,
    quotationAskReq:  `നിങ്ങൾക്ക് എന്ത് വേണം — ഇപ്പോൾ ഇത് എങ്ങനെ കൈകാര്യം ചെയ്യുന്നു?`,
    demoAskName:      `ഡെമോ ബുക്ക് ചെയ്യാൻ, നിങ്ങളുടെ പേര് പറയൂ?`,
    askBusinessName:  `നിങ്ങളുടെ ബിസിനസ്സിന്റെ പേര് എന്താണ്?`,
    demoAskTime:      `ഡെമോക്ക് ഇഷ്ടപ്പെട്ട തീയതിയും സമയവും?`,
    demoConfirm: ({ name, service, time }) =>
      `ഡെമോ അഭ്യർഥന ലഭിച്ചു ✅\n\n*പേര്:* ${name}\n*സേവനം:* ${service}\n*ഇഷ്ടമുള്ള സമയം:* ${time}\n\nടീം സ്ഥിരീകരിക്കും।`,
    askName:           (_s) => `നിങ്ങളുടെ പേര് പറയൂ?`,
    askNameAfterIntro: (_s) => `തുടരാൻ നിങ്ങളുടെ പേര് പറയൂ? 😊`,
    askPurpose:        (name, service) => `നന്ദി ${name}! *${service}*ൽ എന്ത് സഹായം വേണം?`,
    askPhone:          (n) => `*${n}* ആണോ ഏറ്റവും നല്ല നമ്പർ?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ അതെ, ഇതുതന്നെ' }, { id: 'phone_other', title: '📱 മറ്റൊരു നമ്പർ' }],
    askAltPhone:       `10 അക്ക മൊബൈൽ നമ്പർ ടൈപ്പ് ചെയ്യൂ।`,
    askContactTime:    `ടീം ബന്ധപ്പെടാൻ ഏറ്റവും നല്ല സമയം?`,
    confirmSummary: {
      header: `നന്ദി! ✅\n\nഅഭ്യർഥന രേഖപ്പെടുത്തി:`,
      name: 'പേര്', business: 'ബിസിനസ്', service: 'സേവനം', subService: 'ഉപ-സേവനം',
      requirement: 'ആവശ്യം', phone: 'ഫോൺ', preferredTime: 'ഇഷ്ടമുള്ള സമയം',
      quotation: 'ഉദ്ധരണി', demo: 'ഡെമോ', requested: 'അഭ്യർഥിച്ചു',
      footer: `ടീം ബന്ധപ്പെടും।\n\nMENU ടൈപ്പ് ചെയ്യൂ।`,
    },
    handoff: (p) => `ടീമിലേക്ക് നേരിട്ട് ബന്ധിപ്പിക്കുന്നു।\n\n📞 *കോൾ / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `ടീം ഉടൻ ബന്ധപ്പെടും।\n\nനേരിട്ടുള്ള ബന്ധം: ${wa}`,
    alreadyDone:   `ടീമിന് വിവരങ്ങൾ ഉണ്ട് ✅\n\nMENU ടൈപ്പ് ചെയ്യൂ।`,
    portfolio: (url) => `SkyUp പ്രവൃത്തി കാണൂ:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nസോഫ്‌റ്റ്‌വെയർ, AI, ഡിജിറ്റൽ ഗ്രോത്ത് പാർട്ണർ।`,
    recommendHelper: `ഞാൻ ശരിയായ പരിഹാരം കണ്ടെത്താൻ സഹായിക്കാം।\n\n1️⃣ ഏത് ബിസിനസ് നടത്തുന്നു?\n2️⃣ ഇപ്പോൾ ഏറ്റവും വലിയ വെല്ലുവിളി?\n3️⃣ എന്ത് ഫലം ആഗ്രഹിക്കുന്നു?`,
    offTopic: `ക്ഷമിക്കണം, മനസ്സിലായില്ല। മെനു ഉപയോഗിക്കൂ അല്ലെങ്കിൽ MENU ടൈപ്പ് ചെയ്യൂ।`,
    errors: {
      nameTooShort: 'അൽപ്പം ചെറുതാണ് — പൂർണ്ണ പേര് ടൈപ്പ് ചെയ്യൂ।',
      nameLooksWrong: 'ഇത് ഒരു പേരായി തോന്നുന്നില്ല। പേര് ടൈപ്പ് ചെയ്യൂ।',
      purposeTooShort: 'കൂടുതൽ വിവരിക്കൂ।',
      badPhone: 'സാധുവായ 10 അക്ക നമ്പർ അല്ല। വീണ്ടും ശ്രമിക്കൂ।',
      generic: 'തകരാർ സംഭവിച്ചു 😔 വീണ്ടും ശ്രമിക്കൂ।',
    },
    resetWords: ['menu', 'മെനു', 'തുടങ്ങൂ', 'നമസ്കാരം', 'restart', 'start', 'home', 'back'],
  },

  mr: {
    mainMenu: {
      body: `*${BRAND}*मध्ये स्वागत आहे 👋\n\nआम्ही *बनवतो. स्वयंचलित करतो. वाढवतो. अनुकूलित करतो.*\n\nआज आम्ही तुमच्या व्यवसायासाठी काय करू शकतो?`,
      footer: 'कधीही MENU टाइप करा', button: 'SkyUp एक्सप्लोर करा',
    },
    categoryMenu: { body: 'अधिक जाणून घेण्यासाठी सेवा निवडा:', footer: 'मागे जाण्यासाठी MENU टाइप करा', button: 'सेवा पाहा' },
    serviceActions: { body: 'पुढे काय करायचे आहे?', footer: 'आमची टीम मदतीसाठी तयार आहे' },
    pdfCaption:       (s) => `ही आमची *${s}* ब्रोशर आहे — अधिक जाणून घेण्यासाठी डाउनलोड करा।`,
    pdfNotAvailable:  `या सेवेसाठी PDF अजून उपलब्ध नाही। *टीमशी बोला* टॅप करा।`,
    generalBrochureCaption: `ही *SkyUp Digital Solutions* ची कंपनी ब्रोशर आहे — आम्ही काय करतो याचे संपूर्ण विहंगावलोकन मिळवा।`,
    langChanged:      `भाषा बदलली। मराठीत सुरू आहे।`,
    quotationIntro:   `अचूक कोटेशन तयार करण्यासाठी आमच्या टीमला तुमची गरज समजणे आवश्यक आहे।\n\nमी काही प्रश्न विचारतो।`,
    quotationAskReq:  `तुम्हाला काय हवे आहे ते सांगा — तुम्ही सध्या हे कसे व्यवस्थापित करता?`,
    demoAskName:      `डेमो बुक करण्यासाठी, कृपया तुमचे नाव सांगा?`,
    askBusinessName:  `तुमच्या व्यवसायाचे नाव काय आहे?`,
    demoAskTime:      `डेमोसाठी तुमची पसंतीची तारीख आणि वेळ काय आहे?`,
    demoConfirm: ({ name, service, time }) =>
      `डेमो विनंती प्राप्त झाली ✅\n\n*नाव:* ${name}\n*सेवा:* ${service}\n*पसंतीची वेळ:* ${time}\n\nआमची टीम पुष्टी करेल।`,
    askName:           (_s) => `कृपया तुमचे नाव सांगा?`,
    askNameAfterIntro: (_s) => `सुरू करण्यासाठी कृपया तुमचे नाव सांगा? 😊`,
    askPurpose:        (name, service) => `धन्यवाद ${name}! *${service}*मध्ये तुम्हाला काय मदत हवी?`,
    askPhone:          (n) => `*${n}* हा तुमच्याशी संपर्क करण्याचा उत्तम नंबर आहे का?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ होय, हाच नंबर' }, { id: 'phone_other', title: '📱 वेगळा नंबर' }],
    askAltPhone:       `कृपया 10 अंकी मोबाइल नंबर टाइप करा।`,
    askContactTime:    `आमच्या टीमने तुमच्याशी संपर्क करण्याची सर्वोत्तम वेळ कोणती?`,
    confirmSummary: {
      header: `धन्यवाद! ✅\n\nतुमची विनंती नोंदवली:`,
      name: 'नाव', business: 'व्यवसाय', service: 'सेवा', subService: 'उप-सेवा',
      requirement: 'गरज', phone: 'फोन', preferredTime: 'पसंतीची वेळ',
      quotation: 'कोटेशन', demo: 'डेमो', requested: 'विनंती केली',
      footer: `आमची टीम तुमच्याशी संपर्क करेल।\n\nMENU टाइप करा।`,
    },
    handoff: (p) => `तुम्हाला थेट आमच्या टीमशी जोडतो।\n\n📞 *कॉल / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `आमची टीम लवकरच संपर्क करेल।\n\nथेट संपर्क: ${wa}`,
    alreadyDone:   `आमच्या टीमकडे तुमचे तपशील आहेत ✅\n\nMENU टाइप करा।`,
    portfolio: (url) => `SkyUp काम पाहा:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nसॉफ्टवेअर, AI आणि डिजिटल ग्रोथ पार्टनर।`,
    recommendHelper: `मी तुमच्यासाठी योग्य उपाय शोधण्यात मदत करतो।\n\n1️⃣ तुम्ही कोणता व्यवसाय करता?\n2️⃣ सध्या सर्वात मोठे आव्हान काय?\n3️⃣ कोणता परिणाम हवा आहे?`,
    offTopic: `माफ करा, समजले नाही। कृपया मेनू वापरा किंवा MENU टाइप करा।`,
    errors: {
      nameTooShort: 'हे थोडे लहान आहे — पूर्ण नाव लिहा।',
      nameLooksWrong: 'हे नावासारखे वाटत नाही। नाव टाइप करा।',
      purposeTooShort: 'कृपया थोडे अधिक सांगा।',
      badPhone: 'वैध 10 अंकी नंबर नाही। पुन्हा प्रयत्न करा।',
      generic: 'काहीतरी चूक झाली 😔 पुन्हा प्रयत्न करा।',
    },
    resetWords: ['menu', 'मेनू', 'सुरू', 'नमस्कार', 'restart', 'start', 'home', 'back'],
  },

  gu: {
    mainMenu: {
      body: `*${BRAND}*માં સ્વાગત છે 👋\n\nઅમે *બનાવીએ છીએ. ઓટોમેટ કરીએ છીએ. વૃદ્ધિ કરીએ છીએ. ઓપ્ટિમાઇઝ કરીએ છીએ.*\n\nઆજે અમે તમારા વ્યવસાય માટે શું કરી શકીએ?`,
      footer: 'ગમે ત્યારે MENU ટાઇپ કરો', button: 'SkyUp ખોજો',
    },
    categoryMenu: { body: 'વધુ જાણવા સેવા પસંદ કરો:', footer: 'MENU ટાઇপ કરો', button: 'સેવા જુઓ' },
    serviceActions: { body: 'આગળ શું કરવા ઇચ્છો છો?', footer: 'અમારી ટીમ મદદ કરવા તૈyar છે' },
    pdfCaption:       (s) => `આ અमारी *${s}* બ્રોshar છे — ডাউnload કরো।`,
    pdfNotAvailable:  `PDF ઉপलब्ध नथी। *ટीम साथे बात करो* tap करो।`,
    generalBrochureCaption: `આ *SkyUp Digital Solutions* ની company brochure છે — અમે શું કરીએ છીએ તેનું overview મેળવો.`,
    langChanged:      `ભাшा बदली। gujarati मां चालु।`,
    quotationIntro:   `Quotation माटे team ने तমারी jarurat samajvi padse।\n\nहुं कетलाक saval puchis।`,
    quotationAskReq:  `तमने शु joie che — hu अत्यारे ए केवी रीते manage करो छो?`,
    demoAskName:      `Demo book karva tamaru naam?`,
    askBusinessName:  `तमारा business nu naam?`,
    demoAskTime:      `Demo माटे पसंदीदा date ane time?`,
    demoConfirm: ({ name, service, time }) =>
      `Demo विनंती मली ✅\n\n*नाम:* ${name}\n*सेवा:* ${service}\n*पसंदीदा समय:* ${time}\n\nTeam confirm करशे।`,
    askName:           (_s) => `तमारु naam?`,
    askNameAfterIntro: (_s) => `शरु करवा तमारु naam? 😊`,
    askPurpose:        (name, service) => `आभार ${name}! *${service}*मां शु मदद joie?`,
    askPhone:          (n) => `*${n}* सौथी best number छे?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ हा, आ j' }, { id: 'phone_other', title: '📱 बीजो number' }],
    askAltPhone:       `10 अंकनो mobile number type करो।`,
    askContactTime:    `Team संपर्क माटे best time?`,
    confirmSummary: {
      header: `आभार! ✅\n\nविनंती नोंध:`,
      name: 'नाम', business: 'व्यवसाय', service: 'सेवा', subService: 'उप-सेवा',
      requirement: 'जरूरियात', phone: 'फोन', preferredTime: 'पसंदीदा समय',
      quotation: 'Quotation', demo: 'Demo', requested: 'मांगवामां आव्यु',
      footer: `Team संपर्क करशे।\n\nMENU type करो।`,
    },
    handoff: (p) => `तमने team साथे जोडुं छुं।\n\n📞 *Call / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `Team जल्द संपर्क करशे।\n\n${wa}`,
    alreadyDone:   `Team पासे details छे ✅\n\nMENU type करो।`,
    portfolio: (url) => `SkyUp नु काम जुओ:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nSoftware, AI ane Digital Growth partner।`,
    recommendHelper: `हुं योग्य solution शोधवामां मदद करीश।\n\n1️⃣ केवो व्यवसाय?\n2️⃣ सौथी मोटो challenge?\n3️⃣ शुं परिणाम जोईए?`,
    offTopic: `माफ करशो, समजाणु नहीं। menu वापरो या MENU type करो।`,
    errors: {
      nameTooShort: 'थोडु टूंकु — पूरु naam लखो।',
      nameLooksWrong: 'naam जेवु लागतुं नथी। naam type करो।',
      purposeTooShort: 'थोडु वधारे कहो।',
      badPhone: '10 अंकनो valid number नथी।',
      generic: 'कंईक खोटुं थयु 😔 फरी try करो।',
    },
    resetWords: ['menu', 'मेनू', 'शरु', 'नमस्ते', 'restart', 'start', 'home', 'back'],
  },

  bn: {
    mainMenu: {
      body: `*${BRAND}*-এ স্বাগতম 👋\n\nআমরা *তৈরি করি। স্বয়ংক্রিয় করি। বৃদ্ধি করি। অপ্টিমাইজ করি।*\n\nআজ আমরা আপনার ব্যবসার জন্য কী করতে পারি?`,
      footer: 'যেকোনো সময় MENU টাইপ করুন', button: 'SkyUp অন্বেষণ',
    },
    categoryMenu: { body: 'আরও জানতে একটি সেবা বেছে নিন:', footer: 'ফিরে যেতে MENU টাইপ করুন', button: 'সেবা দেখুন' },
    serviceActions: { body: 'পরবর্তীতে কী করতে চান?', footer: 'আমাদের দল সাহায্য করতে প্রস্তুত' },
    pdfCaption:       (s) => `এটি আমাদের *${s}* ব্রোশার — আরও জানতে ডাউনলোড করুন।`,
    pdfNotAvailable:  `এই সেবার PDF এখনো পাওয়া যাচ্ছে না। *টিমের সাথে কথা বলুন* ট্যাপ করুন।`,
    generalBrochureCaption: `এটি *SkyUp Digital Solutions*-এর কোম্পানি ব্রোশার — আমরা যা করি তার সম্পূর্ণ বিবরণ পান।`,
    langChanged:      `ভাষা পরিবর্তিত হয়েছে। বাংলায় চলছে।`,
    quotationIntro:   `সঠিক কোটেশন তৈরি করতে টিমকে আপনার প্রয়োজন বুঝতে হবে।\n\nকিছু প্রশ্ন করব।`,
    quotationAskReq:  `আপনার কী দরকার বলুন — এখন এটি কীভাবে পরিচালনা করছেন?`,
    demoAskName:      `ডেমো বুক করতে আপনার নাম বলুন?`,
    askBusinessName:  `আপনার ব্যবসার নাম কী?`,
    demoAskTime:      `ডেমোর জন্য পছন্দের তারিখ ও সময়?`,
    demoConfirm: ({ name, service, time }) =>
      `ডেমো অনুরোধ পেয়েছি ✅\n\n*নাম:* ${name}\n*সেবা:* ${service}\n*পছন্দের সময়:* ${time}\n\nটিম নিশ্চিত করবে।`,
    askName:           (_s) => `আপনার নাম বলুন?`,
    askNameAfterIntro: (_s) => `শুরু করতে আপনার নাম বলুন? 😊`,
    askPurpose:        (name, service) => `ধন্যবাদ ${name}! *${service}*-এ কী সাহায্য দরকার?`,
    askPhone:          (n) => `*${n}* কি সেরা নম্বর?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ হ্যাঁ, এটাই' }, { id: 'phone_other', title: '📱 অন্য নম্বর' }],
    askAltPhone:       `১০ সংখ্যার মোবাইল নম্বর টাইপ করুন।`,
    askContactTime:    `টিমের সাথে যোগাযোগের সেরা সময়?`,
    confirmSummary: {
      header: `ধন্যবাদ! ✅\n\nঅনুরোধ নথিভুক্ত:`,
      name: 'নাম', business: 'ব্যবসা', service: 'সেবা', subService: 'উপ-সেবা',
      requirement: 'প্রয়োজন', phone: 'ফোন', preferredTime: 'পছন্দের সময়',
      quotation: 'কোটেশন', demo: 'ডেমো', requested: 'অনুরোধ করা হয়েছে',
      footer: `টিম যোগাযোগ করবে।\n\nMENU টাইপ করুন।`,
    },
    handoff: (p) => `আপনাকে সরাসরি টিমের সাথে সংযুক্ত করছি।\n\n📞 *কল / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `টিম শীঘ্রই যোগাযোগ করবে।\n\n${wa}`,
    alreadyDone:   `টিমের কাছে বিবরণ আছে ✅\n\nMENU টাইপ করুন।`,
    portfolio: (url) => `SkyUp কাজ দেখুন:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nসফটওয়্যার, AI ও ডিজিটাল গ্রোথ পার্টনার।`,
    recommendHelper: `আমি সঠিক সমাধান খুঁজে পেতে সাহায্য করব।\n\n1️⃣ কোন ব্যবসা?\n2️⃣ সবচেয়ে বড় চ্যালেঞ্জ?\n3️⃣ কী ফলাফল চাই?`,
    offTopic: `দুঃখিত, বুঝতে পারিনি। মেনু ব্যবহার করুন বা MENU টাইপ করুন।`,
    errors: {
      nameTooShort: 'একটু ছোট — পুরো নাম লিখুন।',
      nameLooksWrong: 'নামের মতো মনে হচ্ছে না। নাম টাইপ করুন।',
      purposeTooShort: 'আরেকটু বলুন।',
      badPhone: 'সঠিক ১০ সংখ্যার নম্বর নয়।',
      generic: 'কিছু সমস্যা হয়েছে 😔 আবার চেষ্টা করুন।',
    },
    resetWords: ['menu', 'মেনু', 'শুরু', 'নমস্কার', 'restart', 'start', 'home', 'back'],
  },

  pa: {
    mainMenu: {
      body: `*${BRAND}* ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ 👋\n\nਅਸੀਂ *ਬਣਾਉਂਦੇ ਹਾਂ। ਆਟੋਮੇਟ ਕਰਦੇ ਹਾਂ। ਵਧਾਉਂਦੇ ਹਾਂ। ਅਨੁਕੂਲ ਬਣਾਉਂਦੇ ਹਾਂ।*\n\nਅੱਜ ਅਸੀਂ ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਲਈ ਕੀ ਕਰ ਸਕਦੇ ਹਾਂ?`,
      footer: 'ਕਦੇ ਵੀ MENU ਟਾਈਪ ਕਰੋ', button: 'SkyUp ਖੋਜੋ',
    },
    categoryMenu: { body: 'ਹੋਰ ਜਾਣਨ ਲਈ ਸੇਵਾ ਚੁਣੋ:', footer: 'MENU ਟਾਈਪ ਕਰੋ', button: 'ਸੇਵਾਵਾਂ ਦੇਖੋ' },
    serviceActions: { body: 'ਅੱਗੇ ਕੀ ਕਰਨਾ ਚਾਹੁੰਦੇ ਹੋ?', footer: 'ਸਾਡੀ ਟੀਮ ਮਦਦ ਕਰਨ ਲਈ ਤਿਆਰ ਹੈ' },
    pdfCaption:       (s) => `ਇਹ ਸਾਡੀ *${s}* ਬਰੋਸ਼ਰ ਹੈ — ਹੋਰ ਜਾਣਨ ਲਈ ਡਾਊਨਲੋਡ ਕਰੋ।`,
    pdfNotAvailable:  `PDF ਉਪਲਬਧ ਨਹੀਂ। *ਟੀਮ ਨਾਲ ਗੱਲ ਕਰੋ* ਟੈਪ ਕਰੋ।`,
    generalBrochureCaption: `ਇਹ *SkyUp Digital Solutions* ਕੰਪਨੀ ਬਰੋਸ਼ਰ ਹੈ — ਅਸੀਂ ਜੋ ਕੁਝ ਕਰਦੇ ਹਾਂ ਉਸਦੀ ਪੂਰੀ ਜਾਣਕਾਰੀ ਲਓ।`,
    langChanged:      `ਭਾਸ਼ਾ ਬਦਲ ਗਈ। ਪੰਜਾਬੀ ਵਿੱਚ ਜਾਰੀ।`,
    quotationIntro:   `ਸਹੀ ਕੋਟੇਸ਼ਨ ਲਈ ਟੀਮ ਨੂੰ ਤੁਹਾਡੀ ਲੋੜ ਸਮਝਣੀ ਪਵੇਗੀ।`,
    quotationAskReq:  `ਤੁਹਾਨੂੰ ਕੀ ਚਾਹੀਦਾ ਹੈ ਦੱਸੋ।`,
    demoAskName:      `ਡੈਮੋ ਬੁੱਕ ਕਰਨ ਲਈ, ਤੁਹਾਡਾ ਨਾਮ?`,
    askBusinessName:  `ਤੁਹਾਡੇ ਕਾਰੋਬਾਰ ਦਾ ਨਾਮ?`,
    demoAskTime:      `ਡੈਮੋ ਲਈ ਤਰਜੀਹੀ ਮਿਤੀ ਅਤੇ ਸਮਾਂ?`,
    demoConfirm: ({ name, service, time }) =>
      `ਡੈਮੋ ਬੇਨਤੀ ਮਿਲੀ ✅\n\n*ਨਾਮ:* ${name}\n*ਸੇਵਾ:* ${service}\n*ਸਮਾਂ:* ${time}\n\nਟੀਮ ਪੁਸ਼ਟੀ ਕਰੇਗੀ।`,
    askName:           (_s) => `ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਨਾਮ ਦੱਸੋ?`,
    askNameAfterIntro: (_s) => `ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਆਪਣਾ ਨਾਮ ਦੱਸੋ? 😊`,
    askPurpose:        (name, service) => `ਸ਼ੁਕਰੀਆ ${name}! *${service}* ਵਿੱਚ ਕੀ ਮਦਦ ਚਾਹੀਦੀ?`,
    askPhone:          (n) => `*${n}* ਸਭ ਤੋਂ ਵਧੀਆ ਨੰਬਰ ਹੈ?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ ਹਾਂ, ਇਹੀ' }, { id: 'phone_other', title: '📱 ਦੂਜਾ ਨੰਬਰ' }],
    askAltPhone:       `10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਟਾਈਪ ਕਰੋ।`,
    askContactTime:    `ਟੀਮ ਨਾਲ ਸੰਪਰਕ ਦਾ ਸਭ ਤੋਂ ਵਧੀਆ ਸਮਾਂ?`,
    confirmSummary: {
      header: `ਸ਼ੁਕਰੀਆ! ✅\n\nਬੇਨਤੀ ਦਰਜ:`,
      name: 'ਨਾਮ', business: 'ਕਾਰੋਬਾਰ', service: 'ਸੇਵਾ', subService: 'ਉਪ-ਸੇਵਾ',
      requirement: 'ਲੋੜ', phone: 'ਫ਼ੋਨ', preferredTime: 'ਤਰਜੀਹੀ ਸਮਾਂ',
      quotation: 'ਕੋਟੇਸ਼ਨ', demo: 'ਡੈਮੋ', requested: 'ਬੇਨਤੀ ਕੀਤੀ',
      footer: `ਟੀਮ ਸੰਪਰਕ ਕਰੇਗੀ।\n\nMENU ਟਾਈਪ ਕਰੋ।`,
    },
    handoff: (p) => `ਟੀਮ ਨਾਲ ਜੋੜਦਾ ਹਾਂ।\n\n📞 *ਕਾਲ / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `ਟੀਮ ਜਲਦੀ ਸੰਪਰਕ ਕਰੇਗੀ।\n\n${wa}`,
    alreadyDone:   `ਟੀਮ ਕੋਲ ਵੇਰਵੇ ਹਨ ✅\n\nMENU ਟਾਈਪ ਕਰੋ।`,
    portfolio: (url) => `SkyUp ਦਾ ਕੰਮ ਦੇਖੋ:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nSoftware, AI ਅਤੇ Digital Growth Partner।`,
    recommendHelper: `ਮੈਂ ਸਹੀ ਹੱਲ ਲੱਭਣ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ।\n\n1️⃣ ਕਿਹੜਾ ਕਾਰੋਬਾਰ?\n2️⃣ ਸਭ ਤੋਂ ਵੱਡੀ ਚੁਣੌਤੀ?\n3️⃣ ਕੀ ਨਤੀਜਾ ਚਾਹੀਦਾ?`,
    offTopic: `ਮਾਫ਼ ਕਰਨਾ, ਸਮਝ ਨਹੀਂ ਆਇਆ। MENU ਟਾਈਪ ਕਰੋ।`,
    errors: {
      nameTooShort: 'ਥੋੜਾ ਛੋਟਾ ਹੈ — ਪੂਰਾ ਨਾਮ ਲਿਖੋ।',
      nameLooksWrong: 'ਨਾਮ ਵਰਗਾ ਨਹੀਂ ਲੱਗਦਾ।',
      purposeTooShort: 'ਥੋੜਾ ਹੋਰ ਦੱਸੋ।',
      badPhone: 'ਸਹੀ 10 ਅੰਕਾਂ ਦਾ ਨੰਬਰ ਨਹੀਂ।',
      generic: 'ਕੁਝ ਗਲਤ ਹੋ ਗਿਆ 😔 ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    },
    resetWords: ['menu', 'ਮੀਨੂ', 'ਸ਼ੁਰੂ', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'restart', 'start', 'home', 'back'],
  },

  or: {
    mainMenu: { body: `*${BRAND}*ରେ ସ୍ୱାଗତ 👋\n\nଆମେ ନିର୍ମାଣ ଓ ଅଟୋମେଟ୍ ଓ ବୃଦ୍ଧି ଓ ଅପ୍ଟିମାଇଜ୍ କରୁ।\n\nଆଜି ଆପଣଙ୍କ ବ୍ୟବସାୟ ପାଇଁ ଆମେ କ'ଣ ସାହାଯ୍ୟ କରିପାରିବୁ?`, footer: 'MENU ଟାଇପ୍ କରନ୍ତୁ', button: 'SkyUp ଦେଖନ୍ତୁ' },
    categoryMenu: { body: 'ଏକ ସେବା ବାଛନ୍ତୁ:', footer: 'MENU ଟାଇପ୍ ।', button: 'ସେବା ଦେଖନ୍ତୁ' },
    serviceActions: { body: 'ପରବର୍ତ୍ତୀ ପଦକ୍ଷେପ?', footer: 'ଆମ ଦଳ ସାହାଯ୍ୟ ପାଇଁ ପ୍ରସ୍ତୁତ' },
    pdfCaption: (s) => `ଏହା ଆମର *${s}* ବ୍ରୋଶର।`,
    pdfNotAvailable: `PDF ଉପଲବ୍ଧ ନୁହେଁ। ଦଳ ସହ ଯୋଗାଯୋଗ କରନ୍ତୁ।`,
    generalBrochureCaption: `ଏହା *SkyUp Digital Solutions* ର କଂପାନୀ ବ୍ରୋଶର — ଆମେ କ'ଣ କରୁ ଜାଣନ୍ତୁ।`,
    langChanged: `ଭାଷା ପରିବର୍ତ୍ତ ହୋଇଛି।`,
    quotationIntro: `Quotation ପାଇଁ ଆପଣଙ୍କ ଆବଶ୍ୟକତା ବୁଝିବୁ।`,
    quotationAskReq: `ଆପଣଙ୍କୁ କ'ଣ ଦରକାର?`,
    demoAskName: `ଡେମୋ ପାଇଁ ଆପଣଙ୍କ ନାମ?`,
    askBusinessName: `ଆପଣଙ୍କ ବ୍ୟବସାୟ ନାମ?`,
    demoAskTime: `ଡେମୋ ପାଇଁ ଦିନ ଓ ସମୟ?`,
    demoConfirm: ({ name, service, time }) => `ଡେମୋ ଅନୁରୋଧ ✅\n*ନାମ:* ${name}\n*ସେବା:* ${service}\n*ସମୟ:* ${time}`,
    askName: (_s) => `ଆପଣଙ୍କ ନାମ?`,
    askNameAfterIntro: (_s) => `ଆଗକୁ ଯିବାକୁ ଆପଣଙ୍କ ନାମ? 😊`,
    askPurpose: (name, service) => `ଧନ୍ୟବାଦ ${name}! *${service}*ରେ ସାହାଯ୍ୟ?`,
    askPhone: (n) => `*${n}* ସଠିକ ନମ୍ବର?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ ହଁ, ଏଇଟି' }, { id: 'phone_other', title: '📱 ଅନ୍ୟ' }],
    askAltPhone: `10 ଅଙ୍କ ନମ୍ବର ଟାଇପ୍।`,
    askContactTime: `ଯୋଗାଯୋଗ ପାଇଁ ଉତ୍ତମ ସମୟ?`,
    confirmSummary: { header: `ଧନ୍ୟବାଦ! ✅`, name: 'ନାମ', business: 'ବ୍ୟବସାୟ', service: 'ସେବା', subService: 'ଉପ-ସେବା', requirement: 'ଆବଶ୍ୟକ', phone: 'ଫୋନ', preferredTime: 'ସମୟ', quotation: 'ଉଦ୍ଧରଣ', demo: 'ଡେମୋ', requested: 'ଅନୁରୋଧ', footer: `ଦଳ ଯୋଗାଯୋଗ କରିବ।` },
    handoff: (p) => `ଦଳ ସହ ଯୋଡ଼ୁଛି।\n\n📞 ${p}`,
    handoffRepeat: (wa) => `ଦଳ ଶୀଘ୍ର ଯୋଗାଯୋଗ କରିବ।\n\n${wa}`,
    alreadyDone: `ଦଳ ପାଖେ ଆପଣଙ୍କ ବିବରଣ ଅଛି ✅`,
    portfolio: (url) => `SkyUp କାର୍ଯ୍ୟ:\n\n🔗 ${url}`,
    aboutSkyUp: `*SkyUp Digital Solutions LLP*`,
    recommendHelper: `ଠିକ ସମାଧାନ ଖୋଜିବୁ।\n\n1️⃣ ବ୍ୟବସାୟ?\n2️⃣ ଚ୍ୟାଲେଞ୍ଜ?\n3️⃣ ଫଳ?`,
    offTopic: `ବୁଝିଲି ନାହିଁ। MENU ଟାଇପ୍।`,
    errors: { nameTooShort: 'ଛୋଟ ଲାଗୁଛି।', nameLooksWrong: 'ନାମ ନୁହେଁ।', purposeTooShort: 'ଅଧିକ ଦିଅ।', badPhone: 'ସଠିକ ନୁହେଁ।', generic: 'ଭୁଲ ହୋଇଛି 😔' },
    resetWords: ['menu', 'ମେନୁ', 'ଆରମ୍ଭ', 'ନମସ୍କାର', 'restart', 'start'],
  },

  as: {
    mainMenu: { body: `*${BRAND}*লৈ স্বাগতম 👋\n\nআমি *নিৰ্মাণ কৰোঁ। স্বয়ংক্ৰিয় কৰোঁ। বৃদ্ধি কৰোঁ।*\n\nআজি আপোনাৰ ব্যৱসায়ৰ বাবে আমি কি কৰিব পাৰোঁ?`, footer: 'MENU টাইপ কৰক', button: 'SkyUp চাওক' },
    categoryMenu: { body: 'এটা সেৱা বাছক:', footer: 'MENU টাইপ', button: 'সেৱা চাওক' },
    serviceActions: { body: 'পৰৱৰ্তী পদক্ষেপ?', footer: 'আমাৰ দল সাহায্য কৰিবলৈ সাজু' },
    pdfCaption: (s) => `এইটো আমাৰ *${s}* ব্ৰোচাৰ।`,
    pdfNotAvailable: `PDF উপলব্ধ নহয়।`,
    generalBrochureCaption: `এইটো *SkyUp Digital Solutions*-ৰ কোম্পানি ব্ৰোচাৰ — আমি কি কৰো তাৰ সম্পূৰ্ণ বিৱৰণ পাওক।`,
    langChanged: `ভাষা সলনি হৈছে।`,
    quotationIntro: `Quotation ৰ বাবে আপোনাৰ প্ৰয়োজন বুজিম।`,
    quotationAskReq: `আপোনাৰ কি লাগে?`,
    demoAskName: `Demo ৰ বাবে নাম?`,
    askBusinessName: `ব্যৱসায়ৰ নাম?`,
    demoAskTime: `Demo ৰ তাৰিখ ও সময়?`,
    demoConfirm: ({ name, service, time }) => `Demo অনুৰোধ ✅\n*নাম:* ${name}\n*সেৱা:* ${service}\n*সময়:* ${time}`,
    askName: (_s) => `আপোনাৰ নাম?`,
    askNameAfterIntro: (_s) => `আগবাঢ়িবলৈ নাম? 😊`,
    askPurpose: (name, service) => `ধন্যবাদ ${name}! *${service}*ত সহায়?`,
    askPhone: (n) => `*${n}* সঠিক নম্বৰ?`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ হয়, এইটোৱেই' }, { id: 'phone_other', title: '📱 আন নম্বৰ' }],
    askAltPhone: `10 সংখ্যাৰ মোবাইল নম্বৰ।`,
    askContactTime: `যোগাযোগৰ উত্তম সময়?`,
    confirmSummary: { header: `ধন্যবাদ! ✅`, name: 'নাম', business: 'ব্যৱসায়', service: 'সেৱা', subService: 'উপ-সেৱা', requirement: 'প্ৰয়োজন', phone: 'ফোন', preferredTime: 'সময়', quotation: 'Quotation', demo: 'Demo', requested: 'অনুৰোধ', footer: `দল যোগাযোগ কৰিব।` },
    handoff: (p) => `দলৰ সৈতে যোগ দিছোঁ।\n\n📞 ${p}`,
    handoffRepeat: (wa) => `দল সোনকালেই যোগাযোগ কৰিব।\n\n${wa}`,
    alreadyDone: `দলৰ পাশ আপোনাৰ তথ্য আছে ✅`,
    portfolio: (url) => `SkyUp কাম:\n\n🔗 ${url}`,
    aboutSkyUp: `*SkyUp Digital Solutions LLP*`,
    recommendHelper: `সঠিক সমাধান বিচাৰিম।`,
    offTopic: `বুজা নগল। MENU টাইপ।`,
    errors: { nameTooShort: 'চুটি।', nameLooksWrong: 'নাম নহয়।', purposeTooShort: 'অধিক দিয়ক।', badPhone: 'সঠিক নহয়।', generic: 'ভুল হৈছে 😔' },
    resetWords: ['menu', 'মেনু', 'আৰম্ভ', 'নমস্কাৰ', 'restart', 'start'],
  },

  ur: {
    mainMenu: {
      body: `*${BRAND}* میں خوش آمدید 👋\n\nہم *بناتے ہیں۔ خودکار کرتے ہیں۔ بڑھاتے ہیں۔ بہتر بناتے ہیں۔*\n\nآج ہم آپ کے کاروبار کے لیے کیا کر سکتے ہیں؟`,
      footer: 'کسی بھی وقت MENU ٹائپ کریں', button: 'SkyUp دریافت کریں',
    },
    categoryMenu: { body: 'مزید جاننے کے لیے ایک سروس منتخب کریں:', footer: 'MENU ٹائپ کریں', button: 'سروسز دیکھیں' },
    serviceActions: { body: 'آگے کیا کرنا چاہتے ہیں؟', footer: 'ہماری ٹیم مدد کے لیے تیار ہے' },
    pdfCaption:       (s) => `یہ ہماری *${s}* بروشر ہے — مزید جاننے کے لیے ڈاؤن لوڈ کریں۔`,
    pdfNotAvailable:  `اس سروس کے لیے PDF ابھی دستیاب نہیں۔ *ٹیم سے بات کریں* ٹیپ کریں۔`,
    generalBrochureCaption: `یہ *SkyUp Digital Solutions* کی کمپنی بروشر ہے — ہم جو کچھ کرتے ہیں اس کا مکمل جائزہ لیں۔`,
    langChanged:      `زبان تبدیل ہو گئی۔ اردو میں جاری۔`,
    quotationIntro:   `درست حوالہ تیار کرنے کے لیے ٹیم کو آپ کی ضرورت سمجھنی ہوگی۔`,
    quotationAskReq:  `آپ کو کیا چاہیے — ابھی اسے کیسے مینیج کرتے ہیں؟`,
    demoAskName:      `ڈیمو بک کرنے کے لیے آپ کا نام؟`,
    askBusinessName:  `آپ کے کاروبار کا نام؟`,
    demoAskTime:      `ڈیمو کے لیے پسندیدہ تاریخ اور وقت؟`,
    demoConfirm: ({ name, service, time }) =>
      `ڈیمو درخواست موصول ✅\n\n*نام:* ${name}\n*سروس:* ${service}\n*وقت:* ${time}\n\nٹیم تصدیق کرے گی۔`,
    askName:           (_s) => `آپ کا نام؟`,
    askNameAfterIntro: (_s) => `شروع کرنے کے لیے آپ کا نام؟ 😊`,
    askPurpose:        (name, service) => `شکریہ ${name}! *${service}* میں کیا مدد چاہیے؟`,
    askPhone:          (n) => `*${n}* بہترین نمبر ہے؟`,
    phoneButtons: [{ id: 'phone_use_wa', title: '✅ ہاں، یہی' }, { id: 'phone_other', title: '📱 دوسرا نمبر' }],
    askAltPhone:       `10 ہندسوں کا موبائل نمبر ٹائپ کریں۔`,
    askContactTime:    `رابطے کا بہترین وقت؟`,
    confirmSummary: {
      header: `شکریہ! ✅\n\nدرخواست درج:`,
      name: 'نام', business: 'کاروبار', service: 'سروس', subService: 'ذیلی سروس',
      requirement: 'ضرورت', phone: 'فون', preferredTime: 'پسندیدہ وقت',
      quotation: 'حوالہ', demo: 'ڈیمو', requested: 'درخواست کی',
      footer: `ٹیم رابطہ کرے گی۔\n\nMENU ٹائپ کریں۔`,
    },
    handoff: (p) => `آپ کو ٹیم سے براہ راست جوڑتا ہوں۔\n\n📞 *کال / WhatsApp:* ${p}`,
    handoffRepeat: (wa) => `ٹیم جلد رابطہ کرے گی۔\n\n${wa}`,
    alreadyDone:   `ٹیم کے پاس تفصیلات ہیں ✅\n\nMENU ٹائپ کریں۔`,
    portfolio: (url) => `SkyUp کا کام دیکھیں:\n\n🔗 ${url}`,
    aboutSkyUp:    `*SkyUp Digital Solutions LLP*\n\nسافٹ ویئر، AI اور ڈیجیٹل گروتھ پارٹنر۔`,
    recommendHelper: `مناسب حل تلاش کرنے میں مدد کروں گا۔\n\n1️⃣ کون سا کاروبار؟\n2️⃣ سب سے بڑا چیلنج؟\n3️⃣ کیا نتیجہ چاہیے؟`,
    offTopic: `معذرت، سمجھ نہیں آیا۔ MENU ٹائپ کریں۔`,
    errors: {
      nameTooShort: 'تھوڑا مختصر — پورا نام لکھیں۔',
      nameLooksWrong: 'نام جیسا نہیں لگتا۔',
      purposeTooShort: 'تھوڑا اور بتائیں۔',
      badPhone: 'درست 10 ہندسوں کا نمبر نہیں۔',
      generic: 'کچھ غلطی ہوئی 😔 دوبارہ کوشش کریں۔',
    },
    resetWords: ['menu', 'مینو', 'شروع', 'سلام', 'restart', 'start', 'home', 'back'],
  },
};

// ─────────────────────────────────────────── getCopy

/**
 * Return the copy block for a language, falling back key-by-key to English.
 * This means partial translations automatically use English for missing keys.
 */
function getCopy(langCode) {
  const override = TRANSLATIONS[langCode];
  if (!override) return EN;
  return { ...EN, ...override };
}

module.exports = {
  LANGUAGES,
  getCopy,
  detectLanguage,
  buildLanguageSections,
  isLanguageReply,
  codeFromReplyId,
  isValidLanguageCode,
};
