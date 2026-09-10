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

async function send(to, payload, { attempt = 1 } = {}) {
  const body = {
    recipient_number: normalizeTo(to),
    integrated_number: INTEGRATED_NUMBER,
    content_type: payload.type === 'text' ? 'text' : 'interactive',
    ...(payload.type === 'text'
      ? { text: String(payload.text) }
      : { interactive: payload.interactive }),
  };

  if (payload.type === 'document') {
    body.content_type  = 'media';
    body.type          = 'document';
    body.attachment_url = payload.document.link;
    body.filename      = payload.document.filename;
    if (payload.document.caption) body.text = payload.document.caption;
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

function normalizeTo(waId) {
  const digits = String(waId).replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

// Plain text — sent as a top-level string (MSG91 flat format).
function sendText(to, text) {
  const str = typeof text === 'string' ? text : (text && text.body ? text.body : String(text));
  return send(to, { type: 'text', text: str });
}

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
