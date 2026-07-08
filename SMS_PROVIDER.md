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

## Alternative: Twilio

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
5. In `backend/bridge/auth.js`:
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
