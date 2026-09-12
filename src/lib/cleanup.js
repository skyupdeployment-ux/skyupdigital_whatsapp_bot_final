/**
 * cleanup.js — nightly cron jobs that keep the database lean.
 *
 * Stale sessions (idle > SESSION_TTL_DAYS, default 7) are reset to IDLE
 * so a user who returns after a week gets a fresh menu rather than a
 * half-filled form from a previous visit.
 *
 * Old DONE/HANDOFF sessions older than ARCHIVE_TTL_DAYS (default 30)
 * are deleted outright — leads are already in MongoDB's Lead collection,
 * Google Sheets, and CRM, so the session record has no further value.
 */

const cron = require('node-cron');
const { Session, STATES } = require('../models');

const SESSION_TTL_DAYS = parseInt(process.env.SESSION_TTL_DAYS || '7', 10);
const ARCHIVE_TTL_DAYS = parseInt(process.env.ARCHIVE_TTL_DAYS || '30', 10);

function daysAgo(n) {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

async function cleanupStaleSessions() {
  try {
    // 1. Reset abandoned in-progress sessions older than SESSION_TTL_DAYS.
    const abandonedStates = [
      STATES.MENU_SENT,
      STATES.AWAITING_NAME,
      STATES.AWAITING_PURPOSE,
      STATES.AWAITING_PHONE,
      STATES.AWAITING_ALT_PHONE,
    ];

    const resetResult = await Session.updateMany(
      {
        state: { $in: abandonedStates },
        lastMessageAt: { $lt: daysAgo(SESSION_TTL_DAYS) },
      },
      {
        $set: {
          state: STATES.IDLE,
          serviceId: undefined,
          serviceTitle: undefined,
          name: undefined,
          purpose: undefined,
          phone: undefined,
          strikes: 0,
        },
      }
    );
    console.log(`[cleanup] reset ${resetResult.modifiedCount} stale in-progress sessions`);

    // 2. Delete terminal sessions (DONE / HANDOFF) older than ARCHIVE_TTL_DAYS.
    const deleteResult = await Session.deleteMany({
      state: { $in: [STATES.DONE, STATES.HANDOFF] },
      lastMessageAt: { $lt: daysAgo(ARCHIVE_TTL_DAYS) },
    });
    console.log(`[cleanup] deleted ${deleteResult.deletedCount} archived terminal sessions`);
  } catch (err) {
    console.error('[cleanup] session cleanup error:', err.message);
  }
}

async function replayFailedLeads() {
  // Dynamic require avoids a circular dep with sinks → models → cleanup.
  const { replayFailed } = require('../sinks');
  try {
    const count = await replayFailed();
    if (count > 0) console.log(`[cleanup] replayed ${count} failed sink(s)`);
  } catch (err) {
    console.error('[cleanup] replay error:', err.message);
  }
}

let cleanupTask = null;
let replayTask = null;

function startCleanupJobs() {
  // Session cleanup: runs at 02:00 UTC every night.
  cleanupTask = cron.schedule('0 2 * * *', cleanupStaleSessions, { timezone: 'UTC' });

  // Sink retry: runs every 15 minutes so failed Sheets/CRM writes catch up fast.
  replayTask = cron.schedule('*/15 * * * *', replayFailedLeads);

  console.log('[cleanup] jobs scheduled — sessions @ 02:00 UTC, sink-replay every 15 min');
}

function stopCleanupJobs() {
  if (cleanupTask) { cleanupTask.stop(); cleanupTask = null; }
  if (replayTask) { replayTask.stop(); replayTask = null; }
  console.log('[cleanup] jobs stopped');
}

module.exports = { startCleanupJobs, stopCleanupJobs, cleanupStaleSessions, replayFailedLeads };
