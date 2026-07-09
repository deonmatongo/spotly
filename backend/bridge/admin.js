// Spotly — Admin / ops console API.
//
// Every route requires the `admin` role and is rate-limited + audited. Mounted
// at /api/admin in api.js. Privileged mutations write to the immutable audit_log.
//
//   GET  /admin/overview                     ops dashboard metrics
//   GET  /admin/users?q=                     list / search users
//   POST /admin/users/:id/suspend  {reason}  suspend an account
//   POST /admin/users/:id/activate           lift a suspension
//   POST /admin/users/:id/role     {role}    change role
//   POST /admin/users/:id/compliance {...}   set ID / age / background-check state
//   GET  /admin/orders?active=1              live order monitor
//   POST /admin/orders/:ref/refund {reason}  refund + cancel an order
//   GET  /admin/disputes?status=             dispute queue
//   POST /admin/disputes           {...}     open a dispute
//   POST /admin/disputes/:id/resolve {...}   resolve / reject a dispute
//   GET  /admin/audit                        recent privileged actions

const express = require('express')
const crypto  = require('crypto')
const { requireAuth } = require('./auth')
const { rateLimit, validate, clientIp } = require('./security')

const {
  db,
  listUsers, searchUsers, setUserStatus, setUserRole, setUserCompliance,
  countUsers, countUsersByRole,
  insertDispute, listDisputes, listDisputesByStatus, getDispute, resolveDispute, countOpenDisputes,
  insertAudit, listAudit,
  listRecentOrders, listActiveOrders,
  getPaymentByOrderRef, updatePaymentStatus, getUserById,
  rowToOrder,
} = require('./db')

const VALID_ROLES        = ['customer', 'driver', 'merchant', 'admin']
const VALID_ID_STATUS    = ['unverified', 'pending', 'verified', 'rejected']
const VALID_BG_CHECK     = ['none', 'pending', 'clear', 'flagged']
const VALID_DISPUTE_END  = ['resolved', 'rejected', 'investigating']

// createAdmin({ publish }) — `publish(topic, payloadObj)` lets refunds push an
// order-status change onto the MQTT bus. Optional; refunds still work without it.
function createAdmin({ publish } = {}) {
  const router = express.Router()

  // Admin surface: strict auth + a sensible rate cap on every route.
  router.use(requireAuth(['admin']))
  router.use(rateLimit({ windowMs: 60_000, max: 240, name: 'admin' }))

  // Write one audit row per privileged mutation.
  function audit(req, action, target, detail = {}) {
    try {
      insertAudit.run({
        actor_id:   req.user?.sub || '',
        actor_name: req.user?.name || '',
        action,
        target:     String(target || ''),
        detail:     JSON.stringify(detail),
        ip:         clientIp(req),
        created_at: Date.now(),
      })
    } catch (e) { console.warn('[admin] audit write failed:', e.message) }
  }

  // ── Overview / ops metrics ───────────────────────────────────────────────────
  router.get('/overview', (_req, res) => {
    const roles = countUsersByRole.all().reduce((m, r) => (m[r.role] = r.n, m), {})
    const active = listActiveOrders.all()
    const revenueToday = db.prepare(
      "SELECT COALESCE(SUM(total),0) AS s FROM orders WHERE status IN ('delivered','done') AND placed_at >= ?"
    ).get(Date.now() - 86400000).s
    const pendingRefunds = db.prepare("SELECT COUNT(*) AS n FROM payments WHERE status = 'refunded'").get().n
    res.json({
      users: { total: countUsers.get().n, byRole: roles },
      orders: {
        active: active.length,
        byStatus: active.reduce((m, o) => (m[o.status] = (m[o.status] || 0) + 1, m), {}),
      },
      disputes: { open: countOpenDisputes.get().n },
      revenue: { last24hUSD: Math.round(revenueToday * 100) / 100 },
      refunds: { total: pendingRefunds },
    })
  })

  // ── Users ─────────────────────────────────────────────────────────────────────
  router.get('/users', (req, res) => {
    const q = (req.query.q || '').toString().trim()
    if (q) return res.json(searchUsers.all({ q: `%${q}%`, exact: q }))
    res.json(listUsers.all())
  })

  router.post('/users/:id/suspend', validate({ reason: { type: 'string', maxLen: 500 } }), (req, res) => {
    const user = getUserById.get(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    if (user.role === 'admin') return res.status(403).json({ error: 'Admins cannot be suspended from here.' })
    setUserStatus.run({ id: user.id, status: 'suspended', reason: req.valid.reason || '', at: Date.now() })
    audit(req, 'user.suspend', user.id, { reason: req.valid.reason || '' })
    res.json({ ok: true, id: user.id, status: 'suspended' })
  })

  router.post('/users/:id/activate', (req, res) => {
    const user = getUserById.get(req.params.id)
    if (!user) return res.status(404).json({ error: 'User not found.' })
    setUserStatus.run({ id: user.id, status: 'active', reason: '', at: 0 })
    audit(req, 'user.activate', user.id)
    res.json({ ok: true, id: user.id, status: 'active' })
  })

  router.post('/users/:id/role',
    validate({ role: { type: 'string', required: true, enum: VALID_ROLES } }),
    (req, res) => {
      const user = getUserById.get(req.params.id)
      if (!user) return res.status(404).json({ error: 'User not found.' })
      setUserRole.run({ id: user.id, role: req.valid.role })
      audit(req, 'user.role', user.id, { from: user.role, to: req.valid.role })
      res.json({ ok: true, id: user.id, role: req.valid.role })
    })

  router.post('/users/:id/compliance',
    validate({
      idStatus:        { type: 'string', enum: VALID_ID_STATUS },
      ageVerified:     { type: 'boolean' },
      backgroundCheck: { type: 'string', enum: VALID_BG_CHECK },
    }),
    (req, res) => {
      const user = getUserById.get(req.params.id)
      if (!user) return res.status(404).json({ error: 'User not found.' })
      const next = {
        id: user.id,
        id_status:        req.valid.idStatus        ?? user.id_status,
        age_verified:     req.valid.ageVerified !== undefined ? (req.valid.ageVerified ? 1 : 0) : user.age_verified,
        background_check: req.valid.backgroundCheck ?? user.background_check,
      }
      setUserCompliance.run(next)
      audit(req, 'user.compliance', user.id, next)
      res.json({ ok: true, id: user.id, ...next })
    })

  // ── Live order monitor ──────────────────────────────────────────────────────
  router.get('/orders', (req, res) => {
    const rows = req.query.active === '1' ? listActiveOrders.all() : listRecentOrders.all()
    res.json(rows.map(rowToOrder))
  })

  // ── Refund + cancel an order ──────────────────────────────────────────────────
  router.post('/orders/:ref/refund', validate({ reason: { type: 'string', maxLen: 500 } }), (req, res) => {
    const ref = req.params.ref
    const payment = getPaymentByOrderRef.get(ref)
    if (!payment) return res.status(404).json({ error: 'No payment found for this order.' })
    if (payment.status === 'refunded') return res.status(409).json({ error: 'This order is already refunded.' })

    updatePaymentStatus.run({ status: 'refunded', provider_ref: null, updated_at: Date.now(), id: payment.id })
    // Push a cancellation onto the bus so every app reflects it live.
    try { publish?.(`orders/${ref}/status`, { ref, status: 'cancelled', ts: Date.now(), reason: 'refunded' }) } catch {}
    audit(req, 'order.refund', ref, { paymentId: payment.id, amount: payment.amount, reason: req.valid.reason || '' })
    res.json({ ok: true, ref, refundedAmount: payment.amount })
    // NB: in production, updatePaymentStatus should follow a confirmed provider
    // refund callback — see PAYMENT_PROVIDER.md. Here dev auto-confirms.
  })

  // ── Disputes ────────────────────────────────────────────────────────────────
  router.get('/disputes', (req, res) => {
    const status = (req.query.status || '').toString()
    res.json(status ? listDisputesByStatus.all(status) : listDisputes.all())
  })

  router.post('/disputes',
    validate({
      orderRef: { type: 'string', maxLen: 64 },
      against:  { type: 'string', enum: ['merchant', 'driver', 'customer'] },
      reason:   { type: 'string', required: true, maxLen: 200 },
      detail:   { type: 'string', maxLen: 2000 },
    }),
    (req, res) => {
      const id = crypto.randomUUID()
      insertDispute.run({
        id,
        order_ref:  req.valid.orderRef || '',
        raised_by:  req.user.sub,
        against:    req.valid.against || '',
        reason:     req.valid.reason,
        detail:     req.valid.detail || '',
        status:     'open',
        created_at: Date.now(),
      })
      audit(req, 'dispute.open', id, { orderRef: req.valid.orderRef, reason: req.valid.reason })
      res.status(201).json(getDispute.get(id))
    })

  router.post('/disputes/:id/resolve',
    validate({
      status:     { type: 'string', required: true, enum: VALID_DISPUTE_END },
      resolution: { type: 'string', maxLen: 2000 },
    }),
    (req, res) => {
      const dispute = getDispute.get(req.params.id)
      if (!dispute) return res.status(404).json({ error: 'Dispute not found.' })
      const terminal = req.valid.status !== 'investigating'
      resolveDispute.run({
        id: dispute.id,
        status: req.valid.status,
        resolution: req.valid.resolution || '',
        resolved_by: req.user.sub,
        resolved_at: terminal ? Date.now() : 0,
      })
      audit(req, 'dispute.resolve', dispute.id, { status: req.valid.status })
      res.json(getDispute.get(dispute.id))
    })

  // ── Audit log ──────────────────────────────────────────────────────────────
  router.get('/audit', (_req, res) => {
    res.json(listAudit.all().map(r => ({ ...r, detail: safeParse(r.detail) })))
  })

  return router
}

function safeParse(s) { try { return JSON.parse(s) } catch { return s } }

module.exports = { createAdmin }
