# WhatsApp Support Dashboard — Setup

A real-time, two-way WhatsApp support desk for Spotly agents. Customers message
the business WhatsApp number; Twilio forwards each message to a webhook; agents
reply from a three-column dashboard. Everything is logged to SQLite and mirrored
to connected dashboards over Socket.io — no refresh, ever.

> **API keys are intentionally deferred.** The server boots and works fully in
> dev **without** Twilio credentials (messages log to console, sends are bypassed).
> Fill in the env vars below when you're ready to go live.

---

## Architecture

```
 Customer's WhatsApp
        │  (inbound)
        ▼
   Twilio Cloud ──POST──►  /api/webhooks/whatsapp   ┐
        ▲                                            │  backend/bridge/whatsapp-chat.js
        │  (outbound via SDK)                         ├─ writes to SQLite (conversations, messages)
   POST /api/support/reply ◄────── Agent Dashboard    └─ emits Socket.io events ──► dashboards
                                   (React + Tailwind, support-dashboard/)
```

| Piece | File |
|---|---|
| DB schema (`conversations`, `messages`) | `backend/bridge/db.js` |
| Webhook + reply + 24h check + Socket.io | `backend/bridge/whatsapp-chat.js` |
| Socket.io server + route mount | `backend/bridge/api.js` |
| Dashboard UI | `support-dashboard/src/` |

### Data model

**`conversations`** — one row per customer thread
`id, phone (E.164, unique), name, status (open|pending|closed), assigned_agent_id,
last_message_at, last_message_preview, last_customer_msg_at, unread, created_at`

**`messages`** — append-only log
`id, conversation_id, direction (inbound|outbound), sender, body, media_url,
status (received|queued|sent|delivered|read|failed), provider_sid, created_at`

`last_customer_msg_at` is the anchor for **Meta's rolling 24-hour window** — the
one field the whole template rule depends on.

---

## 1. Install dependencies

The backend uses lazy `require()` for both packages, so it runs without them —
but you need them for live sending and real-time updates:

```bash
cd backend/bridge
npm install socket.io twilio
```

Dashboard:

```bash
cd support-dashboard
npm install          # after scaffolding — see §5
```

---

## 2. Environment variables (backend)

Add to `backend/bridge/.env` (or your process env):

| Variable | Required | Purpose |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | to send | Twilio Account SID (`AC…`) |
| `TWILIO_AUTH_TOKEN` | to send | Twilio Auth Token — **keep secret** |
| `TWILIO_WHATSAPP_FROM` | to send | Your WhatsApp sender, e.g. `whatsapp:+14155238886` |
| `PUBLIC_BASE_URL` | recommended | Public HTTPS base, e.g. `https://api.spotly.app` — used for delivery status callbacks + signature validation |
| `SUPPORT_API_KEY` | recommended | Shared secret protecting `/api/support/*`. If unset, those routes are open (dev only) |
| `TWILIO_VALIDATE_WEBHOOK` | production | Set to `1` to enforce `X-Twilio-Signature` validation on the webhook |

**Behaviour without credentials (dev):** inbound webhooks still parse + persist +
broadcast; agent replies persist and broadcast but log `[whatsapp-chat] DEV — would
send…` instead of calling Twilio.

---

## 3. Twilio Console setup

1. Create an account at <https://twilio.com> and open **Messaging → Try it out →
   Send a WhatsApp message** to activate the **WhatsApp Sandbox** (for dev), or
   register a WhatsApp Sender (for production).
2. Copy **Account SID** + **Auth Token** from the Console home into your env.
3. Set the **inbound message webhook**:
   - Sandbox: **Messaging → Try it out → WhatsApp Sandbox Settings**
   - Production: **Messaging → Senders → your WhatsApp number**
   - **"When a message comes in"** →
     ```
     https://<PUBLIC_BASE_URL>/api/webhooks/whatsapp        Method: POST
     ```
4. *(Optional)* Set the **status callback URL** to capture delivery receipts:
   ```
   https://<PUBLIC_BASE_URL>/api/webhooks/whatsapp/status    Method: POST
   ```
   (The reply endpoint also attaches this automatically when `PUBLIC_BASE_URL` is set.)

> **Local testing:** expose your machine with a tunnel and use its HTTPS URL as
> `PUBLIC_BASE_URL` + the webhook host:
> ```bash
> ngrok http 4001
> # → https://abc123.ngrok.io/api/webhooks/whatsapp
> ```

---

## 4. The Meta 24-hour rule

WhatsApp only permits **free-form** business messages within **24 hours** of the
customer's last inbound message. After that, only **pre-approved templates** are
allowed. The reply endpoint enforces this server-side:

```
POST /api/support/reply   { conversationId, body }
→ 409  { error: "SESSION_EXPIRED", message: "The 24-hour customer service window has closed…" }
```

The dashboard reflects the same state: a live countdown ring, and a locked
composer with a template reminder once the window closes. To send a template
after expiry, call with `force: true` and a templated payload (wire up your
approved template content there).

---

## 5. Running the dashboard

The dashboard lives in `support-dashboard/src/` as drop-in React + Tailwind
files. Scaffold a Vite + Tailwind app and copy them in:

```bash
npm create vite@latest support-dashboard -- --template react-ts
cd support-dashboard
npm install socket.io-client
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
# copy the provided src/ files, then render <SupportDashboard /> from main.tsx
```

Dashboard env (`support-dashboard/.env`):

```
VITE_API_BASE=http://localhost:4001      # the Spotly REST/Socket.io host
VITE_SUPPORT_KEY=                         # must match backend SUPPORT_API_KEY (blank in dev)
```

Start everything:

```bash
# terminal 1 — backend (broker + REST + Socket.io on :4001)
cd backend/bridge && npm run dev

# terminal 2 — dashboard
cd support-dashboard && npm run dev
```

---

## API reference

| Method | Route | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/webhooks/whatsapp` | Twilio signature | Inbound customer message |
| `POST` | `/api/webhooks/whatsapp/status` | Twilio signature | Delivery receipt |
| `GET` | `/api/support/conversations` | support key | Sidebar thread list |
| `GET` | `/api/support/conversations/:id/messages` | support key | History + clears unread |
| `POST` | `/api/support/conversations/:id/status` | support key | `{ status?, agentId? }` |
| `POST` | `/api/support/reply` | support key | `{ conversationId, body, mediaUrl?, agentId?, force? }` |

**Socket.io events** (room `support`): `new_whatsapp_message`, `message_sent`,
`message_status`, `conversation_updated`.
