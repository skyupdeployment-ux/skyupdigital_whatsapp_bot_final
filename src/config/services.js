/**
 * SkyUp Digital Solutions — Full Service Catalogue
 *
 * Structured as: CATEGORIES → SERVICES → SUB-SERVICES
 *
 * WhatsApp list limits (enforced hard):
 *   - 10 rows MAX across ALL sections
 *   - row title      <= 24 chars
 *   - row description<= 72 chars
 *   - section title  <= 24 chars
 *
 * The top-level CATEGORY menu fits within 10 rows (5 categories + 5 utility).
 * Each category opens its own service list (also ≤10 rows).
 * Each service with sub-services opens a sub-list (also ≤10 rows).
 *
 * PDF STRATEGY — 3 portfolio PDFs shared based on service category:
 *
 *   PORTFOLIO_PDF_AI        → AI & Automation services + Business Strategy
 *   PORTFOLIO_PDF_SOFTWARE  → Software & Technology services
 *   PORTFOLIO_PDF_GROWTH    → Digital Growth + Creative & Design services
 *
 *   BROCHURE_PDF            → General SkyUp brochure sent to EVERY new user
 *                             on first contact, before the main menu.
 *
 * Set these 4 env vars in .env. Individual service PDF vars are removed.
 */

// ─────────────────────────────────────────── CATEGORIES

const CATEGORIES = [
  {
    id: 'cat_software',
    title: 'Software & Technology',
    icon: '💻',
    description: 'Custom software, CRM, ERP, web & mobile apps',
  },
  {
    id: 'cat_ai',
    title: 'AI & Automation',
    icon: '🤖',
    description: 'Voice agents, chatbots, workflow & document AI',
  },
  {
    id: 'cat_growth',
    title: 'Digital Growth',
    icon: '📈',
    description: 'SEO, PPC, social media, email, eCommerce',
  },
  {
    id: 'cat_creative',
    title: 'Creative & Design',
    icon: '🎨',
    description: 'Branding, graphic, UI/UX, video, website design',
  },
  {
    id: 'cat_strategy',
    title: 'Business Strategy',
    icon: '🚀',
    description: 'Growth systems, automation strategy, consulting',
  },
];

// ─────────────────────────────────────────── SERVICES per category

const SERVICES_BY_CATEGORY = {

  // ── Software & Technology ───────────────────────────────────────────
  cat_software: [
    {
      id: 'svc_custom_software',
      title: 'Custom Software Dev',
      description: 'Bespoke web, mobile or desktop software',
      pitch:
        `SkyUp builds custom software around your exact business process — ` +
        `from internal tools and customer-facing apps to industry platforms.\n\n` +
        `We work across Web, Mobile and Desktop. If your current process runs ` +
        `on Excel, paper or multiple disconnected tools, we can unify it. 💻`,
      requirementQuestions: [
        'What type of business do you operate?',
        'What problem should the software solve?',
        'How are you currently managing this process? (Excel / paper / another software)',
        'Do you need Web, Mobile, Desktop or all three?',
        'Who will use the system — your team, your customers or both?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_custom_crm',
      title: 'Custom CRM Development',
      description: 'CRM built around your exact sales process',
      pitch:
        `A Custom CRM designed around your actual sales, lead and follow-up ` +
        `workflow — not a generic template.\n\n` +
        `Possible features include lead management, pipeline, follow-ups, ` +
        `WhatsApp integration, team management, dashboards and automation. ` +
        `We only build what you actually need. 🗂️`,
      requirementQuestions: [
        'What does your current sales/lead management process look like?',
        'How many leads do you handle per month?',
        'Do you currently use any CRM or sales tool?',
        'Which features matter most — pipeline, follow-ups, WhatsApp, reports?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_erp',
      title: 'ERP Solutions',
      description: 'Integrated business platform for operations',
      pitch:
        `An ERP connects your business operations into one platform — ` +
        `Finance, HR, Inventory, Procurement, Sales, Production and more.\n\n` +
        `SkyUp designs ERP solutions around your actual departments and ` +
        `workflows. We don't assume your modules — we map them first. 🏢`,
      requirementQuestions: [
        'Which departments do you want to manage? (Finance / HR / Inventory / Production / Sales)',
        'How many employees will use the system?',
        'Do you currently use any ERP or accounting software?',
        'What is your biggest operational bottleneck right now?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_skyup_crm',
      title: 'SkyUp CRM',
      description: 'Ready-to-use AI-powered lead & sales CRM',
      pitch:
        `SkyUp CRM is our ready-built AI-powered platform for managing leads, ` +
        `follow-ups, sales pipeline and performance.\n\n` +
        `Key features: lead pipeline, source attribution, Hot/Warm/Cold scoring, ` +
        `interaction history, WhatsApp nurture, AI lead intelligence, call logging, ` +
        `live dashboards and reporting. Built for Indian sales teams. 📊`,
      demoAvailable: true,
    },
    {
      id: 'svc_school_erp',
      title: 'School ERP',
      description: 'Complete school management platform',
      pitch:
        `SkyUp School ERP manages the full school lifecycle — student profiles, ` +
        `attendance, exams, marks, report cards, fee management, timetable, ` +
        `homework, teacher profiles and role-based access.\n\n` +
        `Built for schools that need clarity, not complexity. 🎓`,
      demoAvailable: true,
    },
    {
      id: 'svc_project_mgmt',
      title: 'Project Management App',
      description: 'Task tracking, attendance & productivity',
      pitch:
        `SkyUp's Project Management Application gives managers and teams ` +
        `role-based dashboards, task assignment, daily reports, attendance ` +
        `tracking and productivity visibility — all in one place. 📋`,
      demoAvailable: true,
    },
    {
      id: 'svc_transport_erp',
      title: 'Transport & Fleet ERP',
      description: 'Fleet, dispatch, drivers & billing',
      pitch:
        `A transport/fleet ERP covering booking, dispatch, fleet management, ` +
        `driver records, vehicle tracking, routes, operations, billing and ` +
        `customer management — built around your transport workflow. 🚚`,
      requirementQuestions: [
        'What type of transport business do you operate?',
        'How many vehicles/drivers do you manage?',
        'What is your biggest operational challenge right now?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_web_app',
      title: 'Web Applications',
      description: 'Custom web apps & dashboards',
      pitch:
        `SkyUp builds custom web applications — from internal dashboards and ` +
        `portals to customer-facing platforms, booking systems and data tools.\n\n` +
        `Built for performance, scalability and your exact workflow. 🌐`,
      demoAvailable: false,
    },
    {
      id: 'svc_mobile_app',
      title: 'Mobile Applications',
      description: 'iOS & Android apps for your business',
      pitch:
        `SkyUp develops iOS and Android mobile apps — whether you need a ` +
        `customer app, a team operations app, a delivery app or something ` +
        `entirely unique to your business. 📱`,
      demoAvailable: false,
    },
  ],

  // ── AI & Automation ────────────────────────────────────────────────
  cat_ai: [
    {
      id: 'svc_saanvi',
      title: 'AI Voice Agent — Saanvi',
      description: 'AI that answers & makes calls in your language',
      pitch:
        `Saanvi is SkyUp's AI Voice Agent that handles inbound and outbound calls ` +
        `in 20+ Indian languages — auto-detecting and locking the caller's language.\n\n` +
        `Saanvi can answer enquiries, qualify leads, pitch your services, ` +
        `capture conversation data, generate transcripts, score leads and ` +
        `continue the journey over WhatsApp. 📞`,
      requirementQuestions: [
        'What do you want Saanvi to handle — inbound calls, outbound calls or both?',
        'What should Saanvi say when a customer calls?',
        'What languages do your customers speak?',
        'How many calls do you receive per day?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_whatsapp_auto',
      title: 'WhatsApp Automation',
      description: 'Stateful multi-step WhatsApp journeys',
      pitch:
        `SkyUp builds stateful WhatsApp automation — not just canned replies, ` +
        `but full multi-step journeys with session persistence, CRM integration, ` +
        `lead-linked conversations, nurture sequences and human handoff.\n\n` +
        `Use cases: enquiry handling, lead qualification, booking, follow-up, ` +
        `customer support, payment workflows and sales nurture. 💬`,
      requirementQuestions: [
        'What process do you want to automate on WhatsApp?',
        'Do you need it connected to a CRM or database?',
        'How many messages do you send/receive per day?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_ai_chatbot',
      title: 'AI Chatbots',
      description: 'Multilingual chatbots for web & WhatsApp',
      pitch:
        `SkyUp creates multilingual AI chatbots for customer enquiries, lead ` +
        `qualification, appointment booking, customer support and custom ` +
        `business workflows — on your website, WhatsApp or both. 🤖`,
      demoAvailable: true,
    },
    {
      id: 'svc_ai_automation',
      title: 'AI Business Automation',
      description: 'Automate repetitive business processes with AI',
      pitch:
        `SkyUp uses AI to eliminate repetitive work — data entry, lead follow-up, ` +
        `customer support, reporting, approvals, document processing, notifications, ` +
        `sales workflows and operations.\n\n` +
        `Tell us what your team does manually every day and we'll show you ` +
        `how to automate it. ⚡`,
      requirementQuestions: [
        'What repetitive task consumes the most of your team\'s time?',
        'How many people are currently doing this task?',
        'What tools/systems are currently involved?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_ai_lead_intel',
      title: 'AI Lead Intelligence',
      description: 'AI scoring, summaries & next-best-action',
      pitch:
        `AI Lead Intelligence gives your sales team clarity on a large lead pool — ` +
        `AI summaries, next best action, sentiment analysis, Hot/Warm/Cold ` +
        `classification, call summaries and qualification scoring.\n\n` +
        `Stop guessing which lead to call next. Let AI decide. 🎯`,
      demoAvailable: true,
    },
    {
      id: 'svc_doc_ai',
      title: 'Document AI & OCR',
      description: 'Extract data from any document at scale',
      pitch:
        `SkyUp's Document AI can capture, extract and export structured data ` +
        `from any document type — marksheets, invoices, ledgers, forms and ` +
        `handwritten documents — with AI-powered OCR and bulk processing. 📄`,
      requirementQuestions: [
        'What type of documents do you need to process?',
        'How many documents do you process per day/month?',
        'What data fields do you need to extract?',
        'Where should the extracted data go? (Excel / CRM / database)',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_rocky',
      title: 'Rocky Mktg Automation',
      description: 'AI marketing command center & automation',
      pitch:
        `Rocky is SkyUp's AI marketing automation command center — strategy ` +
        `support, campaign building, audience targeting, Meta/Google workflows, ` +
        `SEO/social visibility, lead and spend overview, marketing performance ` +
        `monitoring and an AI copilot for marketing decisions. 🚀`,
      demoAvailable: true,
    },
    {
      id: 'svc_bi_analytics',
      title: 'Business Intelligence',
      description: 'Predictive analytics & live dashboards',
      pitch:
        `SkyUp's BI & Predictive Analytics turns your raw data into actionable ` +
        `intelligence — live dashboards, forecasting, churn prediction, demand ` +
        `analysis and custom reporting for leadership decisions. 📊`,
      demoAvailable: true,
    },
  ],

  // ── Digital Growth ─────────────────────────────────────────────────
  cat_growth: [
    {
      id: 'svc_smm',
      title: 'Social Media Marketing',
      description: 'Content, community & paid social',
      pitch:
        `SkyUp's Social Media Marketing team creates scroll-stopping content, ` +
        `builds engaged communities and runs data-driven paid campaigns across ` +
        `Instagram, Facebook, LinkedIn and YouTube.\n\n` +
        `We handle strategy, creatives, posting, community management and ` +
        `performance reporting. 📱`,
      requirementQuestions: [
        'Which platforms are you currently active on?',
        'What is your main goal — brand awareness, leads or sales?',
        'Do you have an existing content library or starting from scratch?',
      ],
      demoAvailable: false,
    },
    {
      id: 'svc_ppc',
      title: 'PPC — Meta & Google Ads',
      description: 'Performance ads optimised for revenue',
      pitch:
        `SkyUp runs high-ROI ad campaigns on Google and Meta — keyword ` +
        `strategy, audience targeting, creative production, A/B testing and ` +
        `conversion optimisation.\n\n` +
        `Note: SkyUp's management fee is separate from your platform/media spend. ` +
        `We never guarantee specific lead volumes, ROAS or revenue. 🎯`,
      requirementQuestions: [
        'Are you advertising on Google, Meta or both?',
        'What product or service do you want to promote?',
        'What is your approximate monthly advertising budget?',
        'Are you currently running any campaigns?',
      ],
      demoAvailable: false,
    },
    {
      id: 'svc_seo',
      title: 'SEO',
      description: 'Organic search visibility & rankings',
      pitch:
        `SkyUp's SEO service improves your organic search visibility through ` +
        `technical SEO, on-page optimization, content strategy and link building.\n\n` +
        `We never guarantee specific rankings or traffic — but we do give you ` +
        `a strategy built on your actual business and audience. 🔍`,
      requirementQuestions: [
        'Do you have an existing website? Please share the URL.',
        'What is your target location or region?',
        'What keywords or topics matter most to your business?',
        'Have you done any SEO work before?',
      ],
      demoAvailable: false,
    },
    {
      id: 'svc_email_mktg',
      title: 'Email Marketing',
      description: 'Campaigns, automation & drip sequences',
      pitch:
        `SkyUp designs and manages email campaigns that get opened — welcome ` +
        `sequences, drip automations, newsletters and re-engagement flows.\n\n` +
        `Full pipeline: list management, templates, automation setup and analytics. ` +
        `No deliverability guarantees, but best-practice execution every time. 📧`,
      demoAvailable: false,
    },
    {
      id: 'svc_ecommer',
      title: 'eCommerce Growth',
      description: 'End-to-end eCommerce strategy & execution',
      pitch:
        `SkyUp's eCommerce Growth service covers store optimisation, product ` +
        `listings, ads, email/WhatsApp nurture, conversion optimisation and ` +
        `performance analytics — across Shopify, WooCommerce and custom stores. 🛒`,
      demoAvailable: false,
    },
    {
      id: 'svc_gbp',
      title: 'Google Business Profile',
      description: 'Local search & Google Maps visibility',
      pitch:
        `SkyUp optimises your Google Business Profile for maximum local search ` +
        `and Google Maps visibility — profile setup, reviews strategy, posts, ` +
        `categories, photos and local SEO alignment. 📍`,
      demoAvailable: false,
    },
  ],

  // ── Creative & Design ──────────────────────────────────────────────
  cat_creative: [
    {
      id: 'svc_branding',
      title: 'Branding',
      description: 'Brand strategy, logo, identity & voice',
      pitch:
        `SkyUp's branding system covers brand strategy, logo design and ` +
        `variations, logo grid, clear-space rules, colour palette, typography, ` +
        `taglines, brand voice and brand applications.\n\n` +
        `We build brands that are consistent, professional and built for scale. 🎨`,
      demoAvailable: false,
    },
    {
      id: 'svc_graphic',
      title: 'Graphic Design',
      description: 'Social creatives, marketing & print design',
      pitch:
        `SkyUp's graphic design team creates social media creatives, ad ` +
        `banners, marketing materials, business materials, packaging design ` +
        `and pitch decks — crafted for visual impact and brand consistency. ✏️`,
      requirementQuestions: [
        'What type of design do you need? (social creatives / marketing / business materials / print)',
        'How many pieces do you need per month?',
        'Do you have existing brand guidelines or a logo?',
      ],
      demoAvailable: false,
    },
    {
      id: 'svc_ui_ux',
      title: 'UI / UX Design',
      description: 'Research, wireframes, UI design & prototypes',
      pitch:
        `SkyUp's UI/UX team delivers research-backed designs that users love — ` +
        `user research, wireframes, high-fidelity Figma prototypes and design ` +
        `systems for web and mobile.\n\n` +
        `Great design isn't just beautiful — it converts and retains. 🖥️`,
      requirementQuestions: [
        'What product are you designing? (web / mobile / desktop)',
        'Do you have existing screens or starting fresh?',
        'Do you need UX research as part of the project?',
        'Do you have brand guidelines?',
      ],
      demoAvailable: true,
    },
    {
      id: 'svc_web_design',
      title: 'Website Design & Dev',
      description: 'Fast, modern websites & landing pages',
      pitch:
        `SkyUp builds fast, modern websites — marketing sites, landing pages, ` +
        `e-commerce stores, portfolios and lead-generation pages.\n\n` +
        `Mobile-first, SEO-ready and built to convert visitors into enquiries. 🌐`,
      requirementQuestions: [
        'What is the purpose of your website? (leads / sales / information / booking)',
        'Do you have an existing website?',
        'How many pages do you need?',
        'Do you need any special features? (booking / payment / forms / blog)',
      ],
      demoAvailable: false,
    },
    {
      id: 'svc_video',
      title: 'Video Editing',
      description: 'Short-form & long-form video production',
      pitch:
        `SkyUp's video team handles editing for social media reels, YouTube ` +
        `content, product demos, explainer videos, ads and corporate videos.\n\n` +
        `Tell us what you need — we'll handle the rest. 🎬`,
      requirementQuestions: [
        'What type of videos do you need? (reels / YouTube / ads / corporate)',
        'Do you have raw footage or need full production?',
        'How many videos per month?',
        'Short-form (<60s) or long-form or both?',
      ],
      demoAvailable: false,
    },
  ],

  // ── Business Strategy ──────────────────────────────────────────────
  cat_strategy: [
    {
      id: 'svc_lead_to_sale',
      title: 'Lead-to-Sale System',
      description: 'End-to-end lead capture to conversion',
      pitch:
        `SkyUp's Lead-to-Sale Growth System connects your lead generation, ` +
        `CRM, follow-up automation, WhatsApp nurture and sales reporting into ` +
        `one integrated growth engine.\n\n` +
        `Build → Automate → Grow → Optimize. 🚀`,
      demoAvailable: true,
    },
    {
      id: 'svc_sales_auto',
      title: 'Sales Automation System',
      description: 'Automate your full sales process',
      pitch:
        `SkyUp's Sales Automation System eliminates manual sales tasks — ` +
        `automated lead assignment, follow-up sequences, WhatsApp nurture, ` +
        `pipeline updates, reminders and performance reporting. 📈`,
      demoAvailable: true,
    },
    {
      id: 'svc_strategy_consult',
      title: 'Digital Strategy',
      description: 'Expert review of your digital operations',
      pitch:
        `Not sure where to start? SkyUp's strategy consulting helps you map ` +
        `your current digital operations, identify gaps and build a clear ` +
        `roadmap for growth, automation and optimization.\n\n` +
        `We understand your problem first — then recommend the right solution. 💡`,
      requirementQuestions: [
        'What is your main business challenge right now?',
        'What does your current digital setup look like?',
        'What result are you trying to achieve in the next 6 months?',
      ],
      demoAvailable: false,
    },
  ],
};

// Flatten all services for quick lookup
const ALL_SERVICES = Object.values(SERVICES_BY_CATEGORY).flat();

/** Get all services for a category */
function getServicesByCategory(categoryId) {
  return SERVICES_BY_CATEGORY[categoryId] || [];
}

/** Find a category by id */
function findCategoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}

/** Find a service by id (searches all categories) */
function findServiceById(id) {
  return ALL_SERVICES.find((s) => s.id === id);
}

/** Find a service by typed text (fuzzy match) */
function findServiceByText(text) {
  if (!text) return null;
  const clean = String(text).trim().toLowerCase().replace(/[\s/]+/g, ' ');
  return ALL_SERVICES.find((s) => {
    const title = s.title.toLowerCase().replace(/[\s/]+/g, ' ');
    return title === clean || (title.startsWith(clean) && clean.length >= 4);
  });
}

/** Find a category by typed text */
function findCategoryByText(text) {
  if (!text) return null;
  const clean = String(text).trim().toLowerCase();
  return CATEGORIES.find((c) => {
    const title = c.title.toLowerCase();
    return title === clean || title.includes(clean) && clean.length >= 4;
  });
}

/**
 * Build WhatsApp interactive list sections for a CATEGORY menu.
 * Shows the 5 categories + 5 utility actions in one list.
 */
function buildCategoryListSections() {
  return [
    {
      title: 'Our Services',
      rows: CATEGORIES.map((cat) => ({
        id: cat.id,
        title: cat.icon + ' ' + cat.title.slice(0, 22),
        description: cat.description.slice(0, 72),
      })),
    },
    {
      title: 'Quick Actions',
      rows: [
        { id: 'action_portfolio', title: '📂 Our Portfolio',      description: 'View our work and case studies' },
        { id: 'action_demo',      title: '📅 Book a Demo',        description: 'Schedule a product demonstration' },
        { id: 'action_team',      title: '👨‍💼 Talk to Our Team',  description: 'Speak with a SkyUp expert' },
        { id: 'action_lang',      title: '🌐 Change Language',    description: 'Switch to your preferred language' },
        { id: 'action_about',     title: '📄 About SkyUp',        description: 'Company and contact information' },
      ],
    },
  ];
}

/**
 * Build WhatsApp interactive list sections for a SERVICES-IN-CATEGORY menu.
 * Must stay ≤10 rows total.
 */
function buildServiceListSections(categoryId) {
  const services = getServicesByCategory(categoryId);
  const cat = findCategoryById(categoryId);
  return [
    {
      title: cat ? cat.title.slice(0, 24) : 'Services',
      rows: services.slice(0, 9).map((s) => ({
        id: s.id,
        title: s.title.slice(0, 24),
        description: (s.description || '').slice(0, 72),
      })),
    },
    {
      title: 'Navigation',
      rows: [{ id: 'action_main_menu', title: '🏠 Main Menu', description: 'Back to all service categories' }],
    },
  ];
}

/**
 * Build the action buttons shown after a service intro.
 * These are sent as WhatsApp reply buttons (max 3).
 * The 4th and 5th actions are sent as a follow-up list.
 */
function serviceActionButtons(service) {
  // Only Book a Demo + Talk to Team + More Services (no quotation)
  return [
    { id: 'action_demo',      title: '📅 Book a Demo' },
    { id: 'action_team',      title: '👨‍💼 Talk to Team' },
    { id: 'action_back_cat',  title: '🔙 More Services' },
  ];
}

/** Check if an id belongs to a utility action */
function isActionId(id) {
  return typeof id === 'string' && id.startsWith('action_');
}

/** Validate the catalogue – called on boot */
function assertCatalogueValid() {
  const errors = [];
  for (const [catId, services] of Object.entries(SERVICES_BY_CATEGORY)) {
    const listRows = services.length + 1; // +1 for "Main Menu" nav row
    if (listRows > 10) {
      errors.push(`Category ${catId} has ${listRows} list rows (max 10)`);
    }
    for (const s of services) {
      if (s.title.length > 24) errors.push(`Service title too long: "${s.title}"`);
      if (s.description && s.description.length > 72) errors.push(`Service description too long: "${s.title}"`);
    }
  }
  // Category list: 5 cats + 5 actions = 10, exactly at limit
  if (CATEGORIES.length > 5) errors.push('Too many categories for a single list (max 5 + 5 actions = 10 rows)');
  if (errors.length) throw new Error('Invalid service catalogue:\n  - ' + errors.join('\n  - '));
}


// ─────────────────────────────────────────── PORTFOLIO PDF MAPPING

/**
 * 3 portfolio PDFs — set these in .env:
 *   PORTFOLIO_PDF_AI        AI & Automation portfolio
 *   PORTFOLIO_PDF_SOFTWARE  Custom Software portfolio
 *   PORTFOLIO_PDF_GROWTH    Digital Growth portfolio
 *   BROCHURE_PDF            General SkyUp brochure (sent on first contact)
 */
const PORTFOLIO_MAP = {
  cat_software: 'PORTFOLIO_PDF_SOFTWARE',
  cat_ai:       'PORTFOLIO_PDF_AI',
  cat_growth:   'PORTFOLIO_PDF_GROWTH',
  cat_creative: 'PORTFOLIO_PDF_GROWTH',   // Creative/Design → Digital Growth portfolio
  cat_strategy: 'PORTFOLIO_PDF_AI',       // Strategy → AI portfolio
};

/**
 * Return the correct portfolio PDF URL for a service's category.
 * Returns null if the env var is not set (PDF step is silently skipped).
 */
function getPortfolioPdf(categoryId) {
  const envKey = PORTFOLIO_MAP[categoryId] || 'PORTFOLIO_PDF_SOFTWARE';
  return process.env[envKey] || null;
}

/**
 * Filename shown in WhatsApp for each portfolio.
 */
function getPortfolioFilename(categoryId) {
  const envKey = PORTFOLIO_MAP[categoryId] || 'PORTFOLIO_PDF_SOFTWARE';
  const names = {
    PORTFOLIO_PDF_AI:       'SkyUp_AI_Automation_Portfolio.pdf',
    PORTFOLIO_PDF_SOFTWARE: 'SkyUp_Custom_Software_Portfolio.pdf',
    PORTFOLIO_PDF_GROWTH:   'SkyUp_Digital_Growth_Portfolio.pdf',
  };
  return names[envKey] || 'SkyUp_Portfolio.pdf';
}

/** General brochure sent on first contact */
function getGeneralBrochure() {
  return process.env.BROCHURE_PDF || null;
}

module.exports = {
  CATEGORIES,
  SERVICES_BY_CATEGORY,
  ALL_SERVICES,
  getServicesByCategory,
  findCategoryById,
  findServiceById,
  findServiceByText,
  findCategoryByText,
  buildCategoryListSections,
  buildServiceListSections,
  serviceActionButtons,
  isActionId,
  assertCatalogueValid,
  getPortfolioPdf,
  getPortfolioFilename,
  getGeneralBrochure,
  PORTFOLIO_MAP,
};
