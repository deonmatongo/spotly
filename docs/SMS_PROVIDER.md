# SMS Provider Setup

The OTP auth system logs codes to console in dev mode (`NODE_ENV !== 'production'`).  
In production, plug in one of the SMS providers below.

## Recommended: Africa's Talking

Popular in Zimbabwe/East Africa, has a Zimbabwe number pool.

**Steps:**
1. Create an account at https://africastalking.com
2. Get an API key from the dashboard
3. Set environment variables:
   ```
   AT_API_KEY=<your-api-key>
   AT_USERNAME=<your-sandbox-or-prod-username>
   AT_SENDER_ID=SPOTLY        # optional short-code
   ```
4. Install the SDK: `npm install africastalking`
5. In `backend/bridge/auth.js`, replace the `// TODO: Africa's Talking SMS` comment:
   ```javascript
   const AfricasTalking = require('africastalking')
   const at = AfricasTalking({ apiKey: process.env.AT_API_KEY, username: process.env.AT_USERNAME })
   const sms = at.SMS
   await sms.send({ to: [normalised], message: `Your Spotly code: ${code}. Valid for 10 minutes.`, from: process.env.AT_SENDER_ID })
   ```

## Twilio Verify (WhatsApp + SMS OTP) — recommended for production

`backend/bridge/twilio-verify.js` is fully implemented and wired into api.js at
`POST /api/auth/send-otp` and `POST /api/auth/verify-otp`.

Twilio Verify manages the code lifecycle (generation, delivery, expiry, rate-limiting)
and supports **WhatsApp as a first-class channel** — important for the Zimbabwe market where
WhatsApp penetration far exceeds traditional SMS.

**Setup steps:**
1. Create account at https://twilio.com
2. Console → Verify → Services → Create a new service (name it "Spotly")
3. Copy the **Service SID** (starts with `VA`)
4. From the Twilio Console home copy **Account SID** and **Auth Token**
5. Install the SDK:
   ```
   cd backend && npm install twilio
   ```
6. Add to your `.env`:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here_KEEP_SECRET
   TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
7. In the Verify Service settings, enable the **WhatsApp** channel and link your
   WhatsApp Sender (use the Twilio Sandbox during development).

**In development** the router skips Twilio entirely when `TWILIO_VERIFY_SERVICE_SID`
is absent — it logs to console and returns `{ ok: true, dev: true }` so you can test
the full auth flow locally without credentials.

**API shape:**
```
POST /api/auth/send-otp
Body: { phone: "+263771234567", channel: "whatsapp" }  // channel defaults to "whatsapp"
200: { ok: true, status: "pending", channel: "whatsapp" }
400: { error: "..." }   // invalid number, bad channel
429: { error: "..." }   // rate-limited by Twilio

POST /api/auth/verify-otp
Body: { phone: "+263771234567", code: "847291", role: "customer", name: "Tendi" }
200: { accessToken, refreshToken, expiresIn: 900, user: { id, phone, name, role } }
401: { error: "Invalid or expired code." }
400: { error: "Verification session has expired." }  // Twilio 20404
```

## Twilio SMS (classic messages — if not using Verify)

Global, reliable, higher cost per SMS in Africa.

**Steps:**
1. Create an account at https://twilio.com
2. Get Account SID, Auth Token, and a phone number
3. Set environment variables:
   ```
   TWILIO_ACCOUNT_SID=<your-sid>
   TWILIO_AUTH_TOKEN=<your-auth-token>
   TWILIO_FROM=+1234567890
   ```
4. Install: `npm install twilio`
5. In `backend/bridge/auth.js` (for the legacy OTP flow):
   ```javascript
   const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
   await twilio.messages.create({ body: `Your Spotly code: ${code}`, from: process.env.TWILIO_FROM, to: normalised })
   ```

## Other providers to evaluate

- **Vonage (Nexmo)** — good Africa coverage
- **Termii** — Nigeria/Africa-focused, competitive pricing
- **BulkSMS Zimbabwe** — local, direct Zimbabwe routes

## Environment variables summary

| Variable | Purpose |
|---|---|
| `JWT_SECRET` | Secret for signing JWTs — **must be set in production** |
| `NODE_ENV` | Set to `production` to disable `dev_otp` in responses |
| `AT_API_KEY` | Africa's Talking API key |
| `AT_USERNAME` | Africa's Talking account username |
| `AT_SENDER_ID` | Sender ID shown on SMS (optional) |

Generate a strong JWT secret: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
