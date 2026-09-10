# SkyUp WhatsApp Bot — 24/7 Edition

Lead-capture bot for SkyUp Digital Solutions. Captures **name, requirement, phone**
against a chosen service, then writes to **MongoDB + Google Sheet + SkyUp CRM**.

## What's new in v1.1 (24/7 edition)

| Feature | File | What it does |
|---|---|---|
| **Self-ping keepalive** | `src/lib/keepalive.js` | Pings `/health` every 10 min — prevents free-tier hosts (Render, Railway) spinning down |
| **PM2 process manager** | `ecosystem.config.js` | Auto-restarts on crash, memory limit (512 MB), graceful shutdown, log rotation |
| **Graceful shutdown** | `src/index.js` | `SIGINT`/`SIGTERM` drain in-flight requests before exiting — no lost webhook ACKs |
| **Mongo reconnect** | `src/index.js` | Survives transient Atlas blips without crashing |
| **Session cleanup cron** | `src/lib/cleanup.js` | Resets stale half-filled sessions nightly; auto-retries failed Sheets/CRM sinks every 15 min |
| **`/health` endpoint** | `src/index.js` | Lightweight liveness probe for load-balancers and the keepalive ping |
| **Unhandled rejection guard** | `src/index.js` | Logs & lets PM2 restart instead of silently dying |

---

## ⚠️ Host requirement — read first

This runs on **Node** (Render, Railway, EC2, VPS). It will **not** run on
Cloudflare Workers as-is: Workers can't open raw TCP to MongoDB Atlas, so
`mongoose` fails there regardless of the `nodejs_compat` flag.

---

## Setup

```bash
npm install
cp .env.example .env    # fill in your secrets
npm run check:menu      # validates the menu against WhatsApp's hard limits
npm start               # plain Node (dev / VPS)
```

### Running 24/7 with PM2 (recommended for VPS / EC2)

```bash
npm install -g pm2          # one-time global install
npm run pm2:start           # start in production mode
npm run pm2:save            # follow the printed command to survive reboots
```

Useful PM2 commands:

```bash
npm run pm2:status          # health overview
npm run pm2:logs            # tail live logs
npm run pm2:restart         # rolling restart (zero downtime)
npm run pm2:stop            # stop gracefully
```

### Running on Render / Railway free tier

1. Deploy normally (they run `npm start`).
2. Set `SELF_URL=https://your-app.onrender.com` in the dashboard env vars.
3. The bot will ping itself every 10 min — no external cron service needed.

---

## Environment variables

See `.env.example` for the full list with comments. Required:

```
MONGO_URI
MSG91_AUTH_KEY
MSG91_WHATSAPP_NUMBER
```

New in v1.1:

```
SELF_URL          # your deployed URL (enables keepalive ping)
SESSION_TTL_DAYS  # default 7 — days before a stale session is reset
ARCHIVE_TTL_DAYS  # default 30 — days before DONE sessions are deleted
```

---

## MSG91 webhook

```
URL:    https://<your-host>/webhook/whatsapp
Event:  On Inbound Request Received
Status: Enabled   ← verify this every single time
```

The pencil/edit view is the only place the Enabled toggle shows. The list view
doesn't. A run of 404s from a dead URL auto-pauses it silently.

---

## Health & liveness endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `GET /` | GET | Full status JSON (mongo state, uptime, version) |
| `GET /health` | GET | Lightweight liveness probe — returns `503` if Mongo is down |
| `POST /admin/replay-failed` | POST | Retry failed Sheets/CRM pushes (requires `x-admin-key` header) |

---

## Conversation flow

```
IDLE → MENU_SENT → AWAITING_NAME → AWAITING_PURPOSE → AWAITING_PHONE → DONE
                                                    ↘ AWAITING_ALT_PHONE ↗
```

Off-topic input re-asks the current question — it does not reset to the menu.
Only `menu`, `restart`, `hi`, `hello`, `start`, `reset` go back to the top.

Three consecutive invalid inputs in one state → `HANDOFF` with your support number.

---

## Editing the menu

`src/config/services.js`. You are at **10/10 rows**, WhatsApp's hard cap across
all sections. Adding a service means merging two rows or building a two-level
menu. `npm run check:menu` fails the build if you go over.

## Editing message copy

`src/config/copy.js`. Nothing else needs touching.

---

## Lead delivery

Mongo is the source of truth and is written **first**. Sheets and CRM fire after,
fire-and-forget, so their latency never blocks the user's confirmation. Each
lead tracks per-sink status:

```js
delivery: { sheets: {status,error,at}, crm: {status,error,at} }
```

The cleanup cron retries failed sinks every 15 minutes automatically.
You can also trigger a manual retry:

```bash
curl -X POST https://<host>/admin/replay-failed -H "x-admin-key: $ADMIN_KEY"
```

---

## Google Sheet

Create a sheet with a `Leads` tab, headers:

```
Timestamp | Name | Service | Requirement | Phone | WhatsApp ID | Source | Needs Human
```

Share it with your `GOOGLE_SERVICE_ACCOUNT_EMAIL` as **Editor**.

---

## SkyUp CRM

Set `SKYUP_CRM_LEAD_URL` to an endpoint accepting `POST` with:

```json
{
  "name": "...", "phone": "...", "whatsapp_number": "...",
  "service": "...", "service_id": "...", "requirement": "...",
  "source": "whatsapp_bot", "needs_human": false, "captured_at": "ISO"
}
```

Sent with `Authorization: Bearer $SKYUP_CRM_API_KEY`.

---

## Indian Language Support (v1.2)

The bot supports **13 languages**:

| Code | Language | Script |
|------|----------|--------|
| `en` | English | Latin |
| `hi` | Hindi — हिन्दी | Devanagari |
| `mr` | Marathi — मराठी | Devanagari |
| `gu` | Gujarati — ગુજરાતી | Gujarati |
| `bn` | Bengali — বাংলা | Bengali |
| `ta` | Tamil — தமிழ் | Tamil |
| `te` | Telugu — తెలుగు | Telugu |
| `kn` | Kannada — ಕನ್ನಡ | Kannada |
| `ml` | Malayalam — മലയാളം | Malayalam |
| `pa` | Punjabi — ਪੰਜਾਬੀ | Gurmukhi |
| `or` | Odia — ଓଡ଼ିଆ | Odia |
| `as` | Assamese — অসমীয়া | Bengali |
| `ur` | Urdu — اردو | Arabic/Nastaliq |

**How it works:**
1. User sends any first message → bot detects the Unicode script automatically.
2. Unambiguous scripts (Gujarati, Tamil, Telugu, Kannada, Malayalam, Punjabi, Odia, Urdu) → direct to menu in that language.
3. Devanagari → checks for Marathi-specific words, else Hindi.
4. Bengali script → checks for Assamese-specific characters, else Bengali.
5. Latin → English.
6. Ambiguous/unknown → shows a WhatsApp interactive-list language picker.

**Every string is translated:** welcome, menu, name/purpose/phone questions, confirmations, errors, handoff, and reset words all work in the user's language.

**Language stored on session** — if user types MENU and comes back, they stay in their language. The `lang` field is also saved on each Lead document and pushed to Google Sheets (column I) and the CRM payload.

**To add a new language:** add an entry to `LANGUAGES` and a full copy block in `COPY` in `src/config/languages.js`. No other file needs changing.
