/**
 * keepalive.js — prevents free-tier hosts (Render, Railway, Fly) from
 * spinning down the process when it's idle.
 *
 * Render free tier sleeps after 15 minutes of no inbound HTTP traffic.
 * This module pings our own health endpoint every 10 minutes so the
 * dyno is never considered idle.
 *
 * Set SELF_URL in .env to enable (e.g. https://skyup-bot.onrender.com).
 * Leave it unset on paid hosts — unnecessary there.
 */

const axios = require('axios');
const cron = require('node-cron');

let keepAliveTask = null;

function startKeepAlive() {
  const selfUrl = process.env.SELF_URL;

  if (!selfUrl) {
    console.log('[keepalive] SELF_URL not set — skipping self-ping (fine on paid hosts)');
    return;
  }

  // Ping every 10 minutes — well inside the 15-minute sleep window.
  keepAliveTask = cron.schedule('*/10 * * * *', async () => {
    try {
      const { data } = await axios.get(`${selfUrl}/`, { timeout: 10000 });
      console.log(`[keepalive] ping ok — mongo=${data.mongo}`);
    } catch (err) {
      console.warn(`[keepalive] ping failed: ${err.message}`);
    }
  });

  console.log(`[keepalive] self-ping active → ${selfUrl} every 10 min`);
}

function stopKeepAlive() {
  if (keepAliveTask) {
    keepAliveTask.stop();
    keepAliveTask = null;
    console.log('[keepalive] stopped');
  }
}

module.exports = { startKeepAlive, stopKeepAlive };
