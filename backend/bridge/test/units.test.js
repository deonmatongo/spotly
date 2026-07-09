// Backend unit tests — pure logic, no network/DB. Run: npm run test:unit
// Uses Node's built-in test runner (node:test) — zero extra dependencies.

const { test } = require('node:test')
const assert = require('node:assert/strict')

const { verifyWebhookHmac, validate, rateLimit, clientIp } = require('../security')
const { ageFromDob, MIN_AGE } = require('../compliance')
const { sessionRemainingMs, SESSION_WINDOW_MS } = require('../whatsapp-chat')

// ── Tiny req/res/next harness for middleware ──
function runMw(mw, req) {
  return new Promise(resolve => {
    let statusCode = 200, jsonBody, nexted = false
    const res = {
      statusCode,
      setHeader() {},
      status(c) { this.statusCode = c; return this },
      json(b) { jsonBody = b; resolve({ status: this.statusCode, body: jsonBody, nexted }) },
    }
    mw(req, res, () => { nexted = true; resolve({ status: 200, nexted }) })
  })
}

// ── security.verifyWebhookHmac ──
test('verifyWebhookHmac accepts a correct signature', () => {
  const crypto = require('crypto')
  const secret = 'sek', body = '{"amount":100}'
  const sig = crypto.createHmac('sha256', secret).update(body).digest('hex')
  assert.equal(verifyWebhookHmac(body, sig, secret), true)
})
test('verifyWebhookHmac rejects a wrong/empty signature', () => {
  assert.equal(verifyWebhookHmac('{}', 'deadbeef', 'sek'), false)
  assert.equal(verifyWebhookHmac('{}', '', 'sek'), false)
  assert.equal(verifyWebhookHmac('{}', 'abc', ''), false)
})

// ── security.validate ──
test('validate rejects a missing required field', async () => {
  const r = await runMw(validate({ name: { type: 'string', required: true } }), { body: {} })
  assert.equal(r.status, 400)
})
test('validate enforces enum + maxLen + type', async () => {
  assert.equal((await runMw(validate({ role: { type: 'string', enum: ['a', 'b'] } }), { body: { role: 'c' } })).status, 400)
  assert.equal((await runMw(validate({ s: { type: 'string', maxLen: 3 } }), { body: { s: 'toolong' } })).status, 400)
  assert.equal((await runMw(validate({ n: { type: 'number' } }), { body: { n: 'x' } })).status, 400)
})
test('validate passes clean input through to next()', async () => {
  const r = await runMw(validate({ role: { type: 'string', enum: ['admin'], required: true } }), { body: { role: 'admin' } })
  assert.equal(r.nexted, true)
})
test('validate treats empty string as absent for optional fields', async () => {
  const r = await runMw(validate({ note: { type: 'string' } }), { body: { note: '' } })
  assert.equal(r.nexted, true)
})

// ── security.rateLimit ──
test('rateLimit allows up to max then 429s', async () => {
  const mw = rateLimit({ windowMs: 10_000, max: 3, name: 't', key: () => 'fixed' })
  const req = { headers: {}, socket: {} }
  for (let i = 0; i < 3; i++) assert.equal((await runMw(mw, req)).nexted, true)
  assert.equal((await runMw(mw, req)).status, 429)
})
test('rateLimit isolates distinct keys', async () => {
  let ip = 'a'
  const mw = rateLimit({ windowMs: 10_000, max: 1, name: 't2', key: () => ip })
  assert.equal((await runMw(mw, {})).nexted, true)     // a #1 ok
  assert.equal((await runMw(mw, {})).status, 429)      // a #2 blocked
  ip = 'b'
  assert.equal((await runMw(mw, {})).nexted, true)     // b #1 ok
})

// ── security.clientIp ──
test('clientIp prefers the first X-Forwarded-For hop', () => {
  assert.equal(clientIp({ headers: { 'x-forwarded-for': '1.1.1.1, 2.2.2.2' }, socket: {} }), '1.1.1.1')
  assert.equal(clientIp({ headers: {}, socket: { remoteAddress: '9.9.9.9' } }), '9.9.9.9')
})

// ── compliance.ageFromDob ──
test('ageFromDob computes whole years', () => {
  const y = new Date().getUTCFullYear()
  assert.equal(ageFromDob(`${y - 30}-01-01`), 30)
  assert.equal(ageFromDob(`${y - 17}-01-01`) >= MIN_AGE, false)
})
test('ageFromDob returns null for a bad date', () => {
  assert.equal(ageFromDob('not-a-date'), null)
})
test('ageFromDob has not yet counted a birthday later this year', () => {
  const now = new Date()
  const future = new Date(now.getTime() + 30 * 86400000) // ~1 month ahead
  const dob = `${now.getUTCFullYear() - 20}-${String(future.getUTCMonth() + 1).padStart(2, '0')}-28`
  // born 20 years ago but birthday still ~a month away → 19
  assert.equal(ageFromDob(dob), 19)
})

// ── whatsapp.sessionRemainingMs (Meta 24h window) ──
test('sessionRemainingMs is full window right after an inbound message', () => {
  const now = 1_000_000_000
  const rem = sessionRemainingMs({ last_customer_msg_at: now }, now)
  assert.equal(rem, SESSION_WINDOW_MS)
})
test('sessionRemainingMs is <=0 once the 24h window lapses', () => {
  const now = 1_000_000_000
  const past = now - SESSION_WINDOW_MS - 1
  assert.ok(sessionRemainingMs({ last_customer_msg_at: past }, now) <= 0)
})
test('sessionRemainingMs is 0 when there was never an inbound message', () => {
  assert.equal(sessionRemainingMs({ last_customer_msg_at: 0 }, Date.now()), 0)
})
