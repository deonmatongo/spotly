// Spotly auth — phone OTP + JWT.
//
// Flow:
//   1. POST /auth/otp/request  { phone }
//      → generates a 6-digit code, stores it (10 min TTL)
//      → dev mode: returns { dev_otp } so you can test without SMS
//      → prod: send via Africa's Talking (see docs/SMS_PROVIDER.md)
//   2. POST /auth/otp/verify   { phone, code, role?, name? }
//      → validates code, creates/fetches user, issues JWT + refresh token
//   3. POST /auth/token/refresh { refreshToken }
//      → returns a fresh access token (15 min)
//   4. POST /auth/logout        { refreshToken }
//      → revokes the session
//   5. GET  /auth/me            Authorization: Bearer <access>
//      → returns the current user profile
//   6. PATCH /auth/me           { name }

const express = require('express')
const jwt     = require('jsonwebtoken')
const crypto  = require('crypto')

const {
  db,
  insertUser, getUserByPhone, getUserById, updateUser,
  createOtp, expireOtps, getLatestOtp, markOtpUsed,
  createSession, getSession, deleteSession, pruneExpiredSessions,
} = require('./db')

const router = express.Router()

const JWT_SECRET       = process.env.JWT_SECRET || 'spotly-dev-secret-CHANGE-IN-PRODUCTION'
const ACCESS_TTL       = '15m'
const REFRESH_TTL_MS   = 30 * 24 * 60 * 60 * 1000  // 30 days
const OTP_TTL_MS       = 10 * 60 * 1000             // 10 minutes
const IS_DEV           = process.env.NODE_ENV !== 'production'
// Dev-only universal demo code: any phone + this code logs in without SMS.
// Never accepted in production (guarded by IS_DEV at the verify step).
const DEMO_OTP         = '000000'

// ── Helpers ──────────────────────────────────────────────────────────────────

function genOtp() {
  // Cryptographically random 6-digit code, no bias
  const n = crypto.randomBytes(4).readUInt32BE(0) % 900000
  return String(100000 + n)
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function issueAccessToken(user) {
  return jwt.sign(
    { sub: user.id, phone: user.phone, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL },
  )
}

function userPublic(user) {
  return { id: user.id, phone: user.phone, name: user.name, role: user.role }
}

// ── Middleware ────────────────────────────────────────────────────────────────

function requireAuth(roles) {
  return (req, res, next) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' })
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET)
      if (roles && !roles.includes(payload.role)) return res.status(403).json({ error: 'Forbidden' })
      req.user = payload
      next()
    } catch {
      res.status(401).json({ error: 'Invalid or expired token' })
    }
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Step 1: request an OTP for a phone number.
router.post('/otp/request', (req, res) => {
  const raw = (req.body.phone || '').replace(/\s/g, '')
  if (!raw || !/^\+?\d{7,15}$/.test(raw)) {
    return res.status(400).json({ error: 'Valid phone number required (e.g. +263712345678)' })
  }
  const code      = genOtp()
  const expiresAt = Date.now() + OTP_TTL_MS

  expireOtps.run(raw)
  createOtp.run({ phone: raw, code, expires_at: expiresAt })

  if (IS_DEV) {
    console.log(`[auth] OTP for ${raw}: ${code}`)
    return res.json({ ok: true, dev_otp: code })
  }

  // Production: integrate SMS here (see docs/SMS_PROVIDER.md)
  res.json({ ok: true })
})

// Step 2: verify OTP and return tokens + user.
router.post('/otp/verify', (req, res) => {
  const { code, role = 'customer', name } = req.body
  const raw = (req.body.phone || '').replace(/\s/g, '')
  if (!raw || !code) return res.status(400).json({ error: 'phone and code required' })

  const now = Date.now()
  const isDemo = IS_DEV && String(code) === DEMO_OTP
  if (!isDemo) {
    const otp = getLatestOtp.get(raw)
    if (!otp || otp.code !== String(code) || otp.expires_at < now) {
      return res.status(401).json({ error: 'Invalid or expired code' })
    }
    markOtpUsed.run(otp.id)
  }

  let user = getUserByPhone.get(raw)
  if (!user) {
    const id = crypto.randomUUID()
    insertUser.run({ id, phone: raw, name: name || '', role, status: 'active', created_at: now })
    user = getUserByPhone.get(raw)
  } else if (name && !user.name) {
    updateUser.run({ name, status: user.status, id: user.id })
    user = getUserById.get(user.id)
  }

  if (user.status !== 'active') return res.status(403).json({ error: 'Account suspended' })

  const accessToken  = issueAccessToken(user)
  const refreshToken = crypto.randomBytes(40).toString('hex')
  pruneExpiredSessions.run(now)
  createSession.run({
    id:         crypto.randomUUID(),
    user_id:    user.id,
    token_hash: hashToken(refreshToken),
    expires_at: now + REFRESH_TTL_MS,
    created_at: now,
  })

  res.json({ accessToken, refreshToken, expiresIn: 900, user: userPublic(user) })
})

// Exchange a refresh token for a fresh access token.
router.post('/token/refresh', (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken required' })

  const session = getSession.get(hashToken(refreshToken))
  if (!session || session.expires_at < Date.now()) {
    return res.status(401).json({ error: 'Session expired — please log in again' })
  }

  const user = getUserById.get(session.user_id)
  if (!user || user.status !== 'active') return res.status(401).json({ error: 'Account suspended' })

  res.json({ accessToken: issueAccessToken(user), expiresIn: 900 })
})

// Revoke a refresh token (logout).
router.post('/logout', (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) deleteSession.run(hashToken(refreshToken))
  res.json({ ok: true })
})

// Current user profile.
router.get('/me', requireAuth(), (req, res) => {
  const user = getUserById.get(req.user.sub)
  if (!user) return res.status(404).json({ error: 'User not found' })
  res.json(userPublic(user))
})

// Update display name.
router.patch('/me', requireAuth(), (req, res) => {
  const { name } = req.body
  if (typeof name === 'string') {
    updateUser.run({ name, status: 'active', id: req.user.sub })
  }
  res.json({ ok: true })
})

// Admin: list users (guarded to admin role — or remove for now).
router.get('/users', requireAuth(['admin']), (req, res) => {
  const rows = db.prepare('SELECT id,phone,name,role,status,created_at FROM users ORDER BY created_at DESC LIMIT 500').all()
  res.json(rows)
})

module.exports = { router, requireAuth }
