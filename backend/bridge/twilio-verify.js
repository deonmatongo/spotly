// Spotly — Twilio Verify router (WhatsApp + SMS OTP).
//
// Mounts at /api/auth in api.js:
//   POST /api/auth/send-otp    { phone, channel? }  → request a code via WhatsApp (default) or SMS
//   POST /api/auth/verify-otp  { phone, code, role?, name? } → check code → issue JWT + refresh
//
// Required env vars (see SMS_PROVIDER.md §Twilio Verify):
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_VERIFY_SERVICE_SID
//
// Install: npm install twilio   (already documented in SMS_PROVIDER.md)

const express = require('express')
const crypto  = require('crypto')
const jwt     = require('jsonwebtoken')

const {
  getUserByPhone, getUserById, insertUser, updateUser,
  createSession, pruneExpiredSessions,
} = require('./db')

const router = express.Router()

// ── Constants (mirror auth.js so both routers issue identical tokens) ─────────

const JWT_SECRET     = process.env.JWT_SECRET || 'spotly-dev-secret-CHANGE-IN-PRODUCTION'
const ACCESS_TTL     = '15m'
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000   // 30 days
const IS_DEV         = process.env.NODE_ENV !== 'production'

// ── Twilio client — lazily initialised so the server boots without credentials ─

let _verifyService = null

function getVerifyService() {
  if (_verifyService) return _verifyService

  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const vsid  = process.env.TWILIO_VERIFY_SERVICE_SID

  if (!sid || !token || !vsid) {
    throw Object.assign(new Error('Twilio Verify is not configured'), { code: 'TWILIO_NOT_CONFIGURED' })
  }

  const twilio = require('twilio')
  _verifyService = twilio(sid, token).verify.v2.services(vsid)
  return _verifyService
}

// ── Validation ────────────────────────────────────────────────────────────────

// E.164: + followed by 8–15 digits. Zimbabwe (+263) and Poland (+48) are the
// primary regions for Spotly's launch markets; any valid E.164 is accepted.
const E164 = /^\+[1-9]\d{7,14}$/

const VALID_CHANNELS = new Set(['whatsapp', 'sms'])

// ── Twilio error → HTTP response map ─────────────────────────────────────────
// Full list: https://www.twilio.com/docs/api/errors

const TWILIO_ERRORS = {
  60200: { status: 400, message: 'Invalid or unsupported phone number.' },
  60203: { status: 429, message: 'Max send attempts reached — please wait a few minutes before retrying.' },
  60205: { status: 400, message: 'This number cannot receive WhatsApp messages.' },
  60212: { status: 429, message: 'Too many requests. Please wait before trying again.' },
  21211: { status: 400, message: 'Phone number is not in a valid format.' },
  21614: { status: 400, message: 'This number is not reachable for WhatsApp messages.' },
}

function twilioError(err, res) {
  const known = TWILIO_ERRORS[err.code]
  if (known) return res.status(known.status).json({ error: known.message })
  console.error('[twilio-verify] unexpected error:', err.code, err.message)
  res.status(502).json({ error: 'Could not send verification code. Please try again.' })
}

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────

router.post('/send-otp', async (req, res) => {
  const { channel = 'whatsapp' } = req.body
  const phone = (req.body.phone || '').replace(/\s/g, '')

  if (!phone || !E164.test(phone)) {
    return res.status(400).json({
      error: 'A valid E.164 phone number is required (e.g. +263771234567 or +48601234567).',
    })
  }

  if (!VALID_CHANNELS.has(channel)) {
    return res.status(400).json({ error: 'channel must be "whatsapp" or "sms".' })
  }

  // Dev mode: skip Twilio and log the code (auth.js behaviour preserved)
  if (IS_DEV && !process.env.TWILIO_VERIFY_SERVICE_SID) {
    console.log(`[twilio-verify] DEV — would send OTP to ${phone} via ${channel}`)
    return res.json({ ok: true, channel, dev: true })
  }

  try {
    const svc          = getVerifyService()
    const verification = await svc.verifications.create({ to: phone, channel })
    res.json({ ok: true, status: verification.status, channel: verification.channel })
  } catch (err) {
    if (err.code === 'TWILIO_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'OTP service is not yet configured. Contact support.' })
    }
    twilioError(err, res)
  }
})

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────

router.post('/verify-otp', async (req, res) => {
  const { role = 'customer', name } = req.body
  const phone = (req.body.phone || '').replace(/\s/g, '')
  const code  = String(req.body.code || '').trim()

  if (!phone || !E164.test(phone)) {
    return res.status(400).json({ error: 'A valid E.164 phone number is required.' })
  }

  if (!/^\d{6}$/.test(code)) {
    return res.status(400).json({ error: 'The verification code must be exactly 6 digits.' })
  }

  // Dev bypass when Twilio is not wired up
  if (IS_DEV && !process.env.TWILIO_VERIFY_SERVICE_SID) {
    console.log(`[twilio-verify] DEV — bypassing check for ${phone}`)
  } else {
    try {
      const svc   = getVerifyService()
      const check = await svc.verificationChecks.create({ to: phone, code })

      if (check.status !== 'approved') {
        return res.status(401).json({ error: 'Invalid or expired code. Please try again.' })
      }
    } catch (err) {
      // 20404 = no active verification for this number (expired or already used)
      if (err.code === 20404) {
        return res.status(400).json({ error: 'Verification session has expired. Please request a new code.' })
      }
      if (err.code === 'TWILIO_NOT_CONFIGURED') {
        return res.status(503).json({ error: 'OTP service is not yet configured. Contact support.' })
      }
      twilioError(err, res)
      return
    }
  }

  // ── Code approved — create or fetch user, issue tokens ──────────────────────

  const now = Date.now()

  let user = getUserByPhone.get(phone)
  if (!user) {
    const id = crypto.randomUUID()
    insertUser.run({ id, phone, name: name || '', role, status: 'active', created_at: now })
    user = getUserByPhone.get(phone)
  } else if (name && !user.name) {
    updateUser.run({ name, status: user.status, id: user.id })
    user = getUserById.get(user.id)
  }

  if (user.status !== 'active') {
    return res.status(403).json({ error: 'This account has been suspended.' })
  }

  const accessToken  = jwt.sign(
    { sub: user.id, phone: user.phone, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL },
  )
  const refreshToken = crypto.randomBytes(40).toString('hex')
  const tokenHash    = crypto.createHash('sha256').update(refreshToken).digest('hex')

  pruneExpiredSessions.run(now)
  createSession.run({
    id:         crypto.randomUUID(),
    user_id:    user.id,
    token_hash: tokenHash,
    expires_at: now + REFRESH_TTL_MS,
    created_at: now,
  })

  res.json({
    accessToken,
    refreshToken,
    expiresIn: 900,
    user: { id: user.id, phone: user.phone, name: user.name, role: user.role },
  })
})

module.exports = router
