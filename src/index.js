require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');

const { handleMessage } = require('./flow/machine');
const { parseInbound } = require('./lib/parse');
const { assertCatalogueValid } = require('./config/services');
const { replayFailed } = require('./sinks');
const { startKeepAlive, stopKeepAlive } = require('./lib/keepalive');
const { startCleanupJobs, stopCleanupJobs } = require('./lib/cleanup');

const app = express();
app.use(express.json({ limit: '1mb' }));

// ---------------------------------------------------------------- dedupe
// MSG91 retries webhooks it thinks failed. Without this, a slow
// response gets the user two menus.
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

// Second dedup layer: same person + same content within a short window.
// Catches MSG91 firing the same message with DIFFERENT message IDs.
const recentContent = new Map();
const CONTENT_WINDOW_MS = 10 * 1000;

function isDuplicateContent(waId, text, replyId) {
  const key = `${waId}:${replyId || text || ''}`;
  const now = Date.now();
  for (const [k, ts] of recentContent) {
    if (now - ts > CONTENT_WINDOW_MS) recentContent.delete(k);
  }
  if (recentContent.has(key)) return true;
  recentContent.set(key, now);
  return false;
}

// ---------------------------------------------------------------- routes

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SkyUp WhatsApp Bot',
    version: '1.1.0',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime_seconds: Math.floor(process.uptime()),
    time: new Date().toISOString(),
  });
});

// Lightweight liveness probe used by load-balancers and the keepalive cron.
app.get('/health', (_req, res) => {
  const mongoOk = mongoose.connection.readyState === 1;
  const status = mongoOk ? 200 : 503;
  res.status(status).json({ ok: mongoOk, uptime: Math.floor(process.uptime()) });
});

app.post('/webhook/whatsapp', async (req, res) => {
  // ACK immediately. MSG91 retries on slow responses, and every downstream
  // call (Mongo, Sheets, CRM) is slower than its patience.
  res.status(200).json({ received: true });

  try {
    console.debug('[webhook] inbound payload', JSON.stringify(req.body));

    const inbound = parseInbound(req.body);

    if (!inbound) {
      console.log('[webhook] no message in payload', JSON.stringify(req.body).slice(0, 4000));
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

    if (isDuplicateContent(inbound.waId, inbound.text, inbound.replyId)) {
      console.log(`[webhook] duplicate content from ${inbound.waId}, skipping`);
      return;
    }

    console.log(
      `[webhook] ${inbound.waId} kind=${inbound.kind} replyId=${inbound.replyId} text="${inbound.text}"`
    );
    await handleMessage(inbound);
  } catch (err) {
    console.error('[webhook] handler error:', err.stack || err.message);
  }
});

// Manual retry for leads whose Sheets/CRM push failed.
app.post('/admin/replay-failed', async (req, res) => {
  if (req.get('x-admin-key') !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const count = await replayFailed();
  res.json({ retried: count });
});

// ---------------------------------------------------------------- boot

async function start() {
  assertCatalogueValid();

  const required = ['MONGO_URI', 'MSG91_AUTH_KEY', 'MSG91_WHATSAPP_NUMBER'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }

  // Mongoose reconnect options — survive transient Atlas blips without crashing.
  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10_000,
    heartbeatFrequencyMS: 30_000,
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 20_000,
    connectTimeoutMS: 10_000,
  });
  console.log('[boot] mongo connected');

  mongoose.connection.on('disconnected', () =>
    console.warn('[mongo] disconnected — attempting reconnect...')
  );
  mongoose.connection.on('reconnected', () =>
    console.log('[mongo] reconnected')
  );
  mongoose.connection.on('error', (err) =>
    console.error('[mongo] connection error:', err.message)
  );

  const port = process.env.PORT || 3000;
  const server = app.listen(port, () =>
    console.log(`[boot] SkyUp bot listening on :${port}`)
  );

  // 24/7: start background jobs AFTER the server is up.
  startKeepAlive();
  startCleanupJobs();

  // ---------------------------------------------------------------- graceful shutdown
  // PM2 sends SIGINT for a graceful stop; SIGTERM for a force-kill with kill_timeout.
  // Both paths drain in-flight requests before exiting so no webhook ACK is lost.
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

    // Hard-kill fallback: if HTTP drain takes > 9 s, exit anyway.
    setTimeout(() => {
      console.error('[shutdown] drain timeout — forcing exit');
      process.exit(1);
    }, 9_000).unref();
  }

  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  // Catch unhandled promise rejections so PM2 can log them before restarting.
  process.on('unhandledRejection', (reason) => {
    console.error('[process] unhandledRejection:', reason);
  });
  process.on('uncaughtException', (err) => {
    console.error('[process] uncaughtException:', err.stack || err.message);
    // Let PM2 restart us rather than running in an unknown state.
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('[boot] failed:', err.message);
  process.exit(1);
});

module.exports = app;
