require('dotenv').config();

const express  = require('express');
const mongoose = require('mongoose');
const path     = require('path');

const { handleMessage, saveLeadFromSession } = require('./flow/machine');
const { parseInbound }        = require('./lib/parse');
const { assertCatalogueValid } = require('./config/services');
const { replayFailed }         = require('./sinks');
const { startKeepAlive, stopKeepAlive }     = require('./lib/keepalive');
const { startCleanupJobs, stopCleanupJobs } = require('./lib/cleanup');
const { Session, Lead, STATES }             = require('./models');
const { sendText }                          = require('./lib/msg91');

const app = express();
app.use(express.json({ limit: '1mb' }));

// ── Serve booking page ──────────────────────────────────────────────
// GET /book  → serves the calendar HTML page
app.get('/book', (_req, res) => {
  res.sendFile(path.join(__dirname, 'booking.html'));
});

// ── Booking API — called by the calendar web page ───────────────────
// POST /api/book  { waId, name, business, service, phone, date, time }
app.post('/api/book', async (req, res) => {
  try {
    const { waId, name, business, service, phone, date, time } = req.body;

    if (!waId || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 1. Update session
    let session = await Session.findOne({ waId });
    if (!session) session = new Session({ waId, lang: 'en' });

    session.name                = name  || session.name;
    session.businessName        = business || session.businessName;
    session.serviceTitle        = service  || session.serviceTitle;
    session.phone               = phone || waId;
    session.preferredContactDate = date;
    session.preferredContactTime = time;
    session.demoRequested        = true;
    session.leadStatus           = 'DEMO_REQUESTED';
    session.state                = STATES.DONE;
    session.lastMessageAt        = new Date();
    await session.save();

    // 2. Save lead to MongoDB
    const { saveLead } = require('./sinks');
    await saveLead({
      waId,
      name:                 session.name || '',
      businessName:         session.businessName,
      phone:                session.phone,
      lang:                 session.lang || 'en',
      categoryId:           session.categoryId,
      categoryTitle:        session.categoryTitle,
      serviceId:            session.serviceId,
      serviceTitle:         session.serviceTitle,
      preferredContactDate: date,
      preferredContactTime: time,
      demoRequested:        true,
      needsHuman:           false,
      leadStatus:           'DEMO_REQUESTED',
    });

    // 3. Send WhatsApp confirmation back to customer
    const msg =
      `✅ *Demo Confirmed!*\n\n` +
      `👤 *Name:* ${session.name || name}\n` +
      `🏢 *Business:* ${session.businessName || business}\n` +
      `🎯 *Service:* ${session.serviceTitle || service}\n` +
      `📅 *Date:* ${date}\n` +
      `⏰ *Time:* ${time}\n\n` +
      `Our team will reach you on WhatsApp to confirm the meeting link.\n\n` +
      `📞 *Call / WhatsApp:* ${process.env.SUPPORT_PHONE || '+91 88678 67775'}\n\n` +
      `Type MENU to explore more services.`;

    await sendText(waId, msg);

    res.json({ ok: true });
  } catch (err) {
    console.error('[api/book] error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ── Dedup ───────────────────────────────────────────────────────────
const seenMessages = new Map();
const DEDUPE_TTL_MS = 5 * 60 * 1000;

function normalizeNumber(num) {
  let digits = String(num || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0'))  digits = digits.slice(1);
  return digits;
}

function isDuplicate(messageId) {
  if (!messageId) return false;
  const now = Date.now();
  for (const [id, ts] of seenMessages) {
    if (now - ts > DEDUPE_TTL_MS) seenMessages.delete(id);
  }
  if (seenMessages.has(messageId)) return true;
  seenMessages.set(messageId, now);
  return false;
}

// ── Routes ──────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SkyUp WhatsApp Bot',
    version: '1.2.0',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime_seconds: Math.floor(process.uptime()),
    time: new Date().toISOString(),
  });
});

app.get('/health', (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  res.status(mongoOk ? 200 : 503).json({ ok: mongoOk, uptime: Math.floor(process.uptime()) });
});

app.post('/webhook/whatsapp', async (req, res) => {
  res.status(200).json({ received: true });
  try {
    console.debug('[webhook] inbound payload', JSON.stringify(req.body));
    const inbound = parseInbound(req.body);
    if (!inbound) {
      console.log('[webhook] no message in payload');
      return;
    }
    if (inbound.toNumber && process.env.MSG91_WHATSAPP_NUMBER) {
      const expected = normalizeNumber(process.env.MSG91_WHATSAPP_NUMBER);
      const actual   = normalizeNumber(inbound.toNumber);
      if (expected && actual && expected !== actual) {
        console.log(`[webhook] ignoring message for other number ${inbound.toNumber}`);
        return;
      }
    }
    if (isDuplicate(inbound.messageId)) {
      console.log(`[webhook] duplicate ${inbound.messageId}, skipping`);
      return;
    }
    console.log(`[webhook] ${inbound.waId} kind=${inbound.kind} replyId=${inbound.replyId} text="${inbound.text}"`);
    await handleMessage(inbound);
  } catch (err) {
    console.error('[webhook] handler error:', err.stack || err.message);
  }
});

app.post('/admin/replay-failed', async (req, res) => {
  if (req.get('x-admin-key') !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const count = await replayFailed();
  res.json({ retried: count });
});

// ── Boot ─────────────────────────────────────────────────────────────
async function start() {
  assertCatalogueValid();

  const required = ['MONGO_URI', 'MSG91_AUTH_KEY', 'MSG91_WHATSAPP_NUMBER'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(', ')}`);

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
    heartbeatFrequencyMS: 30_000,
  });
  console.log('[boot] mongo connected');

  mongoose.connection.on('disconnected', () => console.warn('[mongo] disconnected — attempting reconnect...'));
  mongoose.connection.on('reconnected',  () => console.log('[mongo] reconnected'));
  mongoose.connection.on('error',  (err) => console.error('[mongo] connection error:', err.message));

  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => console.log(`[boot] SkyUp bot listening on :${port}`));

  startKeepAlive();
  startCleanupJobs();

  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] ${signal} received — draining...`);
    stopKeepAlive();
    stopCleanupJobs();
    server.close(async () => {
      try {
        await mongoose.connection.close();
        console.log('[shutdown] mongo closed — bye');
      } catch (e) {
        console.error('[shutdown] mongo close error:', e.message);
      }
      process.exit(0);
    });
    setTimeout(() => { console.error('[shutdown] drain timeout — forcing exit'); process.exit(1); }, 9_000).unref();
  }

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => console.error('[process] unhandledRejection:', reason));
  process.on('uncaughtException',  (err)    => { console.error('[process] uncaughtException:', err.stack || err.message); process.exit(1); });
}

start().catch((err) => { console.error('[boot] failed:', err.message); process.exit(1); });

module.exports = app;
