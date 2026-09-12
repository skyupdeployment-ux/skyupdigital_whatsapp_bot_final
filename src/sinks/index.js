const { google } = require('googleapis');
const axios = require('axios');
const { Lead } = require('../models');

// ─────────────────────────────────────────────── Google Sheet

let sheetsClient = null;

function getSheets() {
  if (sheetsClient) return sheetsClient;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key   = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!email || !key) return null;

  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  sheetsClient = google.sheets({ version: 'v4', auth });
  return sheetsClient;
}

async function pushToSheet(lead) {
  const sheets  = getSheets();
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheets || !sheetId) throw new Error('Google Sheets not configured');

  await sheets.spreadsheets.values.append({
    spreadsheetId:   sheetId,
    range:           process.env.GOOGLE_SHEET_RANGE || 'Leads!A:I',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        new Date().toISOString(),
        lead.name,
        lead.serviceTitle,
        lead.purpose,
        lead.phone,
        lead.waId,
        lead.source,
        lead.lang || 'en',          // NEW: language column
        lead.needsHuman ? 'YES' : '',
      ]],
    },
  });
}

// ─────────────────────────────────────────────── SkyUp CRM

async function pushToCrm(lead) {
  const url    = process.env.SKYUP_CRM_LEAD_URL;
  const apiKey = process.env.SKYUP_CRM_API_KEY;
  if (!url) throw new Error('SKYUP_CRM_LEAD_URL not configured');

  await axios.post(
    url,
    {
      name:             lead.name,
      phone:            lead.phone,
      whatsapp_number:  lead.waId,
      service:          lead.serviceTitle,
      service_id:       lead.serviceId,
      requirement:      lead.purpose,
      language:         lead.lang || 'en',   // NEW: language field
      source:           'whatsapp_bot',
      needs_human:      lead.needsHuman,
      captured_at:      new Date().toISOString(),
    },
    {
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    }
  );
}

// ─────────────────────────────────────────────── Dispatcher

async function runSink(lead, key, fn) {
  try {
    await fn(lead);
    await Lead.updateOne(
      { _id: lead._id },
      { $set: { [`delivery.${key}.status`]: 'sent', [`delivery.${key}.at`]: new Date() } }
    );
    console.log(`[sink:${key}] ok lead=${lead._id}`);
  } catch (err) {
    const message = err.response?.data
      ? JSON.stringify(err.response.data).slice(0, 500)
      : err.message;
    await Lead.updateOne(
      { _id: lead._id },
      {
        $set: {
          [`delivery.${key}.status`]: 'failed',
          [`delivery.${key}.error`]:  message,
          [`delivery.${key}.at`]:     new Date(),
        },
      }
    );
    console.error(`[sink:${key}] FAILED lead=${lead._id}: ${message}`);
  }
}

async function saveLead(data) {
  const lead = await Lead.create(data);
  console.log(`[lead] saved ${lead._id} ${lead.name} / ${lead.serviceTitle} lang=${lead.lang}`);
  const sinks = [];
  // Only push to Google Sheets if it's configured
  if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
    sinks.push(runSink(lead, 'sheets', pushToSheet));
  }
  // Only push to CRM if it's configured
  if (process.env.SKYUP_CRM_LEAD_URL) {
    sinks.push(runSink(lead, 'crm', pushToCrm));
  }
  if (sinks.length) Promise.allSettled(sinks);
  return lead;
}

async function replayFailed() {
  const stuck = await Lead.find({
    $or: [{ 'delivery.sheets.status': 'failed' }, { 'delivery.crm.status': 'failed' }],
  }).limit(200);

  console.log(`[replay] ${stuck.length} lead(s) to retry`);
  for (const lead of stuck) {
    if (lead.delivery?.sheets?.status === 'failed') await runSink(lead, 'sheets', pushToSheet);
    if (lead.delivery?.crm?.status   === 'failed') await runSink(lead, 'crm',    pushToCrm);
  }
  return stuck.length;
}

module.exports = { saveLead, replayFailed };
