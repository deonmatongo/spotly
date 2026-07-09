// Spotly — observability: structured logging, error tracking, metrics.
//
//   - requestLogger    one structured line per request (method, path, status, ms)
//   - initSentry()     lazy, env-gated Sentry init (no-op without SENTRY_DSN)
//   - captureError()   report to Sentry if configured, else console
//   - errorHandler     terminal Express error middleware (must be mounted last)
//   - metrics          in-process counters exposed at GET /api/metrics
//
// @sentry/node is loaded lazily and guarded — the server runs fine without it
// installed or configured. Install: npm install @sentry/node ; set SENTRY_DSN.

let Sentry = null
let sentryOn = false

function initSentry() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return false
  try {
    Sentry = require('@sentry/node')
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE || 0.1),
    })
    sentryOn = true
    console.log('[observability] Sentry error tracking enabled')
  } catch {
    console.warn('[observability] SENTRY_DSN set but @sentry/node not installed — run: npm install @sentry/node')
  }
  return sentryOn
}

function captureError(err, context = {}) {
  if (sentryOn && Sentry) {
    Sentry.withScope(scope => {
      for (const [k, v] of Object.entries(context)) scope.setExtra(k, v)
      Sentry.captureException(err)
    })
  } else {
    console.error('[error]', err?.message || err, Object.keys(context).length ? context : '')
  }
}

// ── Metrics (lightweight in-process counters) ──────────────────────────────────
const metrics = {
  startedAt: 0,          // stamped by markStart() — avoids Date.now() at module load
  requests: 0,
  errors: 0,
  byStatus: {},          // '2xx' | '4xx' | '5xx' → count
  byRoute: {},           // 'METHOD /path' → count
  slowRequests: 0,       // > 1000ms
}
function markStart(ts) { metrics.startedAt = ts }

function bucketFor(status) {
  if (status >= 500) return '5xx'
  if (status >= 400) return '4xx'
  if (status >= 300) return '3xx'
  return '2xx'
}

// ── Request logger + metrics collector ─────────────────────────────────────────
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint()
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6
    metrics.requests++
    const bucket = bucketFor(res.statusCode)
    metrics.byStatus[bucket] = (metrics.byStatus[bucket] || 0) + 1
    if (res.statusCode >= 500) metrics.errors++
    if (ms > 1000) metrics.slowRequests++
    // Collapse noisy param values so routes group cleanly.
    const routeKey = `${req.method} ${req.path.replace(/\/[0-9a-f-]{8,}/gi, '/:id')}`
    metrics.byRoute[routeKey] = (metrics.byRoute[routeKey] || 0) + 1

    const line = {
      t: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Math.round(ms),
    }
    // Skip health-check spam at info level; log everything else + all errors.
    if (req.path === '/api/health' && res.statusCode < 400) return
    if (res.statusCode >= 500) console.error('[req]', JSON.stringify(line))
    else console.log('[req]', JSON.stringify(line))
  })
  next()
}

function metricsSnapshot(now) {
  return {
    uptimeSec: metrics.startedAt ? Math.round((now - metrics.startedAt) / 1000) : 0,
    requests: metrics.requests,
    errors: metrics.errors,
    slowRequests: metrics.slowRequests,
    byStatus: metrics.byStatus,
    topRoutes: Object.entries(metrics.byRoute)
      .sort((a, b) => b[1] - a[1]).slice(0, 15)
      .map(([route, count]) => ({ route, count })),
    memoryMB: Math.round(process.memoryUsage().rss / 1048576),
    sentry: sentryOn,
  }
}

// ── Terminal error handler (mount LAST, after all routes) ──────────────────────
function errorHandler(err, req, res, _next) {
  captureError(err, { path: req.path, method: req.method })
  if (res.headersSent) return
  const status = err.status || 500
  res.status(status).json({
    error: status === 500 ? 'Something went wrong. Our team has been notified.' : err.message,
  })
}

module.exports = {
  initSentry, captureError, requestLogger, errorHandler,
  metricsSnapshot, markStart,
}
