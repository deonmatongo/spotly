// Spotly — age / ID compliance.
//
// Zimbabwe & Poland both require age 18+ for alcohol and for many licensed
// events. This module holds the self-declared age gate + a reusable guard that
// restricted purchase routes (alcohol, 18+ events) can mount.
//
//   POST /api/compliance/age      (auth) { dob:"YYYY-MM-DD" } → verify 18+
//   GET  /api/compliance/status   (auth) → { ageVerified, idStatus, backgroundCheck }
//
// Self-declaration is the baseline. For high-risk sales, escalate id_status to a
// real document check (Onfido / Veriff / Smile ID) via the admin console — see
// docs/COMPLIANCE.md. Driver background_check is set the same way after a vetting run.

const express = require('express')
const { requireAuth } = require('./auth')
const { validate } = require('./security')
const { getUserById, setUserAge } = require('./db')

const MIN_AGE = Number(process.env.MIN_AGE || 18)

/** Whole years between an ISO date and now. */
function ageFromDob(dob) {
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getUTCFullYear() - d.getUTCFullYear()
  const m = now.getUTCMonth() - d.getUTCMonth()
  if (m < 0 || (m === 0 && now.getUTCDate() < d.getUTCDate())) age--
  return age
}

/**
 * Guard for age-restricted purchases (alcohol, 18+ events).
 * Mount before the handler: router.post('/checkout', requireAgeVerified, ...).
 * 403 with a machine code the client can branch on to launch the age gate.
 */
function requireAgeVerified(req, res, next) {
  const user = getUserById.get(req.user?.sub)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })
  if (!user.age_verified) {
    return res.status(403).json({
      error: 'AGE_VERIFICATION_REQUIRED',
      message: `You must confirm you are ${MIN_AGE}+ before purchasing age-restricted items.`,
    })
  }
  next()
}

const router = express.Router()

router.get('/status', requireAuth(), (req, res) => {
  const user = getUserById.get(req.user.sub)
  if (!user) return res.status(404).json({ error: 'User not found.' })
  res.json({
    ageVerified: !!user.age_verified,
    idStatus: user.id_status,
    backgroundCheck: user.background_check,
    minAge: MIN_AGE,
  })
})

router.post('/age', requireAuth(),
  validate({ dob: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}$/ } }),
  (req, res) => {
    const age = ageFromDob(req.valid.dob)
    if (age === null) return res.status(400).json({ error: 'Invalid date of birth.' })
    if (age > 120) return res.status(400).json({ error: 'Please enter a valid date of birth.' })

    const eligible = age >= MIN_AGE
    setUserAge.run({ id: req.user.sub, dob: req.valid.dob, age_verified: eligible ? 1 : 0 })
    if (!eligible) {
      return res.status(403).json({ error: 'UNDERAGE', message: `You must be ${MIN_AGE} or older.`, ageVerified: false })
    }
    res.json({ ok: true, ageVerified: true })
  })

module.exports = { router, requireAgeVerified, ageFromDob, MIN_AGE }
