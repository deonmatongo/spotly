// Spotly — security hardening primitives (zero external dependencies).
//
// Everything here is hand-rolled so the server hardens without new installs:
//   - rateLimit()        sliding-window, per-IP (or custom key) limiter
//   - securityHeaders    sensible default response headers (helmet-lite)
//   - validate()         declarative body validator → 400 on bad input
//   - verifyWebhookHmac() constant-time HMAC-SHA256 signature check
//   - clientIp()         proxy-aware client IP
//
// For very high scale, swap rateLimit's Map for Redis and securityHeaders for
// helmet — the call sites won't change.

const crypto = require('crypto')

// ── Client IP (trusts the first X-Forwarded-For hop behind a known proxy) ──────
function clientIp(req) {
  const xff = req.headers['x-forwarded-for']
  if (xff) return String(xff).split(',')[0].trim()
  return req.socket?.remoteAddress || req.ip || 'unknown'
}

// ── Rate limiting ──────────────────────────────────────────────────────────────
// In-memory sliding window. Buckets are pruned lazily on access + on a sweep.
function rateLimit({ windowMs = 60_000, max = 120, key, name = 'default' } = {}) {
  const hits = new Map() // key → number[] (timestamps within window)

  // periodic sweep so idle keys don't leak memory
  const sweep = setInterval(() => {
    const cutoff = Date.now() - windowMs
    for (const [k, arr] of hits) {
      const kept = arr.filter(t => t > cutoff)
      if (kept.length) hits.set(k, kept)
      else hits.delete(k)
    }
  }, windowMs)
  if (sweep.unref) sweep.unref() // don't keep the process alive

  return function rateLimiter(req, res, next) {
    const k = (key ? key(req) : clientIp(req)) + ':' + name
    const now = Date.now()
    const cutoff = now - windowMs
    const arr = (hits.get(k) || []).filter(t => t > cutoff)
    arr.push(now)
    hits.set(k, arr)

    const remaining = Math.max(0, max - arr.length)
    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', remaining)

    if (arr.length > max) {
      const retryMs = arr[0] + windowMs - now
      res.setHeader('Retry-After', Math.ceil(retryMs / 1000))
      return res.status(429).json({ error: 'Too many requests. Please slow down and try again shortly.' })
    }
    next()
  }
}

// ── Security headers (helmet-lite) ──────────────────────────────────────────────
function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-DNS-Prefetch-Control', 'off')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.setHeader('Permissions-Policy', 'geolocation=(self), camera=(self), microphone=()')
  // HSTS only makes sense over TLS; enable when terminating HTTPS (prod).
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  }
  res.removeHeader('X-Powered-By')
  next()
}

// ── Declarative body validation ─────────────────────────────────────────────────
// schema: { field: { type, required, min, max, pattern, enum, maxLen } }
// Returns 400 with the first violation; otherwise attaches req.valid = cleaned.
const TYPE_CHECK = {
  string: v => typeof v === 'string',
  number: v => typeof v === 'number' && Number.isFinite(v),
  boolean: v => typeof v === 'boolean',
  array: v => Array.isArray(v),
}
function validate(schema) {
  return (req, res, next) => {
    const body = req.body || {}
    const cleaned = {}
    for (const [field, rule] of Object.entries(schema)) {
      const val = body[field]
      const present = val !== undefined && val !== null && val !== ''
      if (!present) {
        if (rule.required) return res.status(400).json({ error: `"${field}" is required.` })
        continue
      }
      if (rule.type && !TYPE_CHECK[rule.type]?.(val)) {
        return res.status(400).json({ error: `"${field}" must be a ${rule.type}.` })
      }
      if (rule.type === 'string') {
        if (rule.maxLen && val.length > rule.maxLen) return res.status(400).json({ error: `"${field}" is too long (max ${rule.maxLen}).` })
        if (rule.pattern && !rule.pattern.test(val)) return res.status(400).json({ error: `"${field}" is not in the expected format.` })
      }
      if (rule.type === 'number') {
        if (rule.min !== undefined && val < rule.min) return res.status(400).json({ error: `"${field}" must be ≥ ${rule.min}.` })
        if (rule.max !== undefined && val > rule.max) return res.status(400).json({ error: `"${field}" must be ≤ ${rule.max}.` })
      }
      if (rule.enum && !rule.enum.includes(val)) {
        return res.status(400).json({ error: `"${field}" must be one of: ${rule.enum.join(', ')}.` })
      }
      cleaned[field] = val
    }
    req.valid = cleaned
    next()
  }
}

// ── Webhook signature verification (constant-time) ──────────────────────────────
// For payment providers that sign callbacks with an HMAC-SHA256 of the raw body.
// Requires the raw body — mount express.raw() on the webhook route, not json().
function verifyWebhookHmac(rawBody, signature, secret) {
  if (!signature || !secret) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(String(signature))
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

module.exports = { rateLimit, securityHeaders, validate, verifyWebhookHmac, clientIp }
