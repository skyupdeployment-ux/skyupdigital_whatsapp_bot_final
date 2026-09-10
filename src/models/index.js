const mongoose = require('mongoose');

/**
 * Conversation states.
 *
 * The master prompt defines a full service-discovery + qualification +
 * demo/quotation flow. States are expanded accordingly.
 */
const STATES = {
  // Entry
  IDLE:               'IDLE',
  LANG_PICKER_SENT:   'LANG_PICKER_SENT',

  // Top-level navigation
  MAIN_MENU:          'MAIN_MENU',

  // Service discovery
  CATEGORY_SENT:      'CATEGORY_SENT',       // user picked a category, sub-menu shown
  SERVICE_INTRO_SENT: 'SERVICE_INTRO_SENT',  // service explained, actions offered
  SUB_SERVICE_SENT:   'SUB_SERVICE_SENT',    // sub-service list shown

  // Requirement analysis
  COLLECTING_REQ:     'COLLECTING_REQ',      // bot asking requirement questions
  AWAITING_DOCS:      'AWAITING_DOCS',       // asked for document upload

  // Quotation flow
  QUOTATION_PENDING:  'QUOTATION_PENDING',

  // Demo flow
  DEMO_NAME:          'DEMO_NAME',
  DEMO_BUSINESS:      'DEMO_BUSINESS',
  DEMO_TIME:          'DEMO_TIME',
  DEMO_CONFIRMED:     'DEMO_CONFIRMED',

  // Lead capture
  AWAITING_NAME:      'AWAITING_NAME',
  AWAITING_PURPOSE:   'AWAITING_PURPOSE',
  AWAITING_PHONE:     'AWAITING_PHONE',
  AWAITING_ALT_PHONE: 'AWAITING_ALT_PHONE',
  AWAITING_CONTACT_TIME: 'AWAITING_CONTACT_TIME',

  // Terminal
  HANDOFF:            'HANDOFF',
  DONE:               'DONE',
};

const LEAD_STATUSES = [
  'NEW', 'QUALIFYING', 'QUALIFIED', 'DOCUMENTS_RECEIVED',
  'TEAM_REVIEW', 'QUOTATION_REQUESTED', 'DEMO_REQUESTED',
  'CONTACT_PENDING', 'CONTACTED', 'CONVERTED', 'CLOSED',
];

const sessionSchema = new mongoose.Schema(
  {
    waId:  { type: String, required: true, unique: true, index: true },
    state: { type: String, enum: Object.values(STATES), default: STATES.IDLE },

    // Language chosen by the user (ISO 639-1 code).
    lang: { type: String, default: 'en' },

    // ── Service context ─────────────────────────────────────────────
    categoryId:      String,   // e.g. 'cat_software'
    categoryTitle:   String,
    serviceId:       String,   // e.g. 'svc_custom_crm'
    serviceTitle:    String,
    subServiceId:    String,
    subServiceTitle: String,

    // ── Lead data ───────────────────────────────────────────────────
    name:            String,
    businessName:    String,
    purpose:         String,   // requirement description
    currentProcess:  String,   // how they manage things now
    existingSystem:  String,   // existing tools/software
    phone:           String,
    preferredContactDate: String,
    preferredContactTime: String,

    // ── Flags ────────────────────────────────────────────────────────
    quotationRequested: { type: Boolean, default: false },
    demoRequested:      { type: Boolean, default: false },
    documentsUploaded:  { type: Boolean, default: false },
    needsHuman:         { type: Boolean, default: false },
    leadStatus:         { type: String, enum: LEAD_STATUSES, default: 'NEW' },

    // Pending action to execute after collecting a missing field.
    pendingAction: String,  // 'quotation' | 'demo' | 'team' | 'contact_time'

    // Requirement Q&A step counter (for multi-question flows).
    reqStep: { type: Number, default: 0 },

    // Consecutive invalid inputs in the current state.
    strikes: { type: Number, default: 0 },

    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const leadSchema = new mongoose.Schema(
  {
    waId:            { type: String, required: true, index: true },
    name:            String,
    businessName:    String,
    phone:           String,
    lang:            { type: String, default: 'en' },
    categoryId:      String,
    categoryTitle:   String,
    serviceId:       String,
    serviceTitle:    String,
    subServiceId:    String,
    subServiceTitle: String,
    purpose:         String,
    currentProcess:  String,
    existingSystem:  String,
    preferredContactDate: String,
    preferredContactTime: String,
    quotationRequested: Boolean,
    demoRequested:   Boolean,
    documentsUploaded: Boolean,
    needsHuman:      Boolean,
    leadStatus:      { type: String, enum: LEAD_STATUSES, default: 'NEW' },
    conversationSummary: String,
    source:          { type: String, default: 'whatsapp' },
    delivery: {
      sheets: {
        status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
        error: String, at: Date,
      },
      crm: {
        status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
        error: String, at: Date,
      },
    },
  },
  { timestamps: true }
);

const Session = mongoose.model('Session', sessionSchema);
const Lead    = mongoose.model('Lead', leadSchema);

module.exports = { STATES, LEAD_STATUSES, Session, Lead };
