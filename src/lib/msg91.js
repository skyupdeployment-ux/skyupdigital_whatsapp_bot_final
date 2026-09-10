const axios = require('axios');

const MSG91_URL =
  process.env.MSG91_BASE_URL ||
  'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/';

const AUTH_KEY          = process.env.MSG91_AUTH_KEY;
const INTEGRATED_NUMBER = process.env.MSG91_WHATSAPP_NUMBER;

const client = axios.create({
  baseURL: MSG91_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
    accept: 'application/json',
    authkey: AUTH_KEY,
  },
});

/**
 * Core send — builds the MSG91 flat body and retries once on 5xx / network
 * error (MSG91 blips are common; a dropped reply looks like a dead bot).
 */
async function send(to, payload, { attempt = 1 } = {}) {
  const body = {
    recipient_number: normalizeTo(to),
    integrated_number: INTEGRATED_NUMBER,
    content_type: payload.type === 'text' ? 'text' : 'interactive',
    ...(payload.type === 'text'
      ? { text: payload.text }
      : { interactive: payload.interactive }),
  };

  // Document messages use a different content_type and shape.
  if (payload.type === 'document') {
    body.content_type = 'document';
    body.document     = payload.document;
    delete body.text;
    delete body.interactive;
  }

  try {
    const { data } = await client.post('', body);
    console.log(`[msg91] sent type=${payload.type} to=${to}`);
    return data;
  } catch (err) {
    const status  = err.response?.status;
    const detail  = err.response?.data || err.message;
    const retryable = !status || status >= 500;

    if (retryable && attempt === 1) {
      console.warn(`[msg91] retrying after failure (${status || 'network'})`);
      await new Promise((r) => setTimeout(r, 300));
      return send(to, payload, { attempt: 2 });
    }

    console.error(`[msg91] send failed status=${status}`, JSON.stringify(detail));
    throw err;
  }
}

/** MSG91 expects the number with country code, no plus sign. */
function normalizeTo(waId) {
  const digits = String(waId).replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

function sendText(to, text) {
  return send(to, { type: 'text', text: { body: text } });
}

/**
 * Send a PDF document via WhatsApp.
 *
 * @param {string} to        - recipient waId
 * @param {string} url       - public HTTPS URL of the PDF
 * @param {string} filename  - shown as the document name in WhatsApp (e.g. "SkyUp_Social_Media.pdf")
 * @param {string} [caption] - optional caption shown below the file
 *
 * MSG91 document payload shape:
 *   { link, filename, caption? }
 * WhatsApp displays the file as a downloadable attachment with the filename
 * and an optional text caption underneath.
 */
function sendDocument(to, url, filename, caption) {
  return send(to, {
    type: 'document',
    document: {
      link:     url,
      filename: filename,
      ...(caption ? { caption } : {}),
    },
  });
}

/**
 * @param {object} opts
 * @param {string} opts.header    <= 60 chars
 * @param {string} opts.body      <= 1024 chars
 * @param {string} [opts.footer]  <= 60 chars
 * @param {string} opts.button    <= 20 chars
 * @param {Array}  opts.sections  10 rows max across all sections
 */
function sendList(to, { header, body, footer, button, sections }) {
  return send(to, {
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: header },
      body:   { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: { button, sections },
    },
  });
}

/** Reply buttons: max 3, title <= 20 chars each. */
function sendButtons(to, { body, buttons, header, footer }) {
  return send(to, {
    type: 'interactive',
    interactive: {
      type: 'button',
      ...(header ? { header: { type: 'text', text: header } } : {}),
      body: { text: body },
      ...(footer ? { footer: { text: footer } } : {}),
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type:  'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) },
        })),
      },
    },
  });
}

module.exports = { sendText, sendDocument, sendList, sendButtons, normalizeTo };
