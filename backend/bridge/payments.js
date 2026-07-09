// Spotly payments + payouts — stub provider in dev, real provider in prod.
//
// Routes (all mounted under /payments in api.js):
//   POST /payments/charge                     create & (in dev) auto-confirm a payment
//   GET  /payments/order/:ref                 get payment for an order
//   POST /payments/:id/refund                 refund a completed payment (admin)
//   GET  /payments/drivers/:driverId/payouts  driver payout history
//   POST /payments/drivers/:driverId/payouts/request  request a payout
//
// Dev mode (NODE_ENV !== 'production'):
//   All payments auto-complete, all payouts auto-process.
//   See docs/PAYMENT_PROVIDER.md for plugging in Paynow / EcoCash / Stripe.

const express = require('express')
const crypto  = require('crypto')
const {
  db,
  getOrder,
  insertPayment, getPaymentById, getPaymentByOrderRef, updatePaymentStatus, getPaymentsByStatus,
  insertPayout, getPayoutsByDriver, updatePayoutStatus,
} = require('./db')

const router = express.Router()
const IS_DEV = process.env.NODE_ENV !== 'production'

function rowToPayment(r) {
  return {
    id: r.id, orderRef: r.order_ref, amount: r.amount, currency: r.currency,
    method: r.method, status: r.status,
    providerRef: r.provider_ref || undefined,
    phone: r.phone || undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
  }
}

function rowToPayout(r) {
  return {
    id: r.id, driverId: r.driver_id, amount: r.amount,
    method: r.method, account: r.account, status: r.status,
    note: r.note || undefined,
    requestedAt: r.requested_at,
    paidAt: r.paid_at || undefined,
  }
}

// ── Customer payments ────────────────────────────────────────────────────────

// Initiate (and in dev: auto-confirm) a payment for an order.
router.post('/charge', (req, res) => {
  const { orderRef, amount, method = 'ecocash', phone, currency = 'USD' } = req.body
  if (!orderRef || !amount || amount <= 0) {
    return res.status(400).json({ error: 'orderRef and a positive amount are required' })
  }

  // Idempotency: return existing completed payment if one exists.
  const existing = getPaymentByOrderRef.get(orderRef)
  if (existing && existing.status === 'completed') {
    return res.json({ ok: true, paymentId: existing.id, status: 'completed' })
  }

  const now = Date.now()
  const id  = crypto.randomUUID()
  // Dev: mark completed immediately so the checkout flow never blocks on a real gateway.
  const status = IS_DEV ? 'completed' : 'pending'

  insertPayment.run({
    id, order_ref: orderRef, amount: Number(amount), currency,
    method, status, provider_ref: null, phone: phone || null,
    created_at: now, updated_at: now,
  })

  if (IS_DEV) {
    console.log(`[payments] DEV auto-confirmed ${method} $${amount} for ${orderRef}`)
    return res.json({ ok: true, paymentId: id, status: 'completed', devNote: `${method} auto-confirmed in dev` })
  }

  // Production: integrate payment provider here. See docs/PAYMENT_PROVIDER.md.
  // Paynow flow returns a redirect_url; EcoCash B2C returns a poll_url.
  res.json({ ok: true, paymentId: id, status: 'pending' })
})

// Get the payment record for an order.
router.get('/order/:ref', (req, res) => {
  const row = getPaymentByOrderRef.get(req.params.ref)
  if (!row) return res.status(404).json({ error: 'Payment not found' })
  res.json(rowToPayment(row))
})

// Refund a completed payment (admin action).
router.post('/:id/refund', (req, res) => {
  const row = getPaymentById.get(req.params.id)
  if (!row) return res.status(404).json({ error: 'Payment not found' })
  if (row.status !== 'completed') return res.status(400).json({ error: 'Only completed payments can be refunded' })
  updatePaymentStatus.run({ status: 'refunded', provider_ref: null, updated_at: Date.now(), id: row.id })
  if (!IS_DEV) {
    // Production: initiate provider refund here. See docs/PAYMENT_PROVIDER.md.
    console.log(`[payments] TODO: initiate provider refund for ${row.id}`)
  }
  res.json({ ok: true })
})

// ── Driver payouts ───────────────────────────────────────────────────────────

// All payouts for a driver.
router.get('/drivers/:id/payouts', (req, res) => {
  res.json(getPayoutsByDriver.all(req.params.id).map(rowToPayout))
})

// Request a payout (instant cash-out or scheduled).
router.post('/drivers/:id/payouts/request', (req, res) => {
  const { amount, method = 'ecocash', account, note = '' } = req.body
  if (!amount || amount <= 0) return res.status(400).json({ error: 'Positive amount required' })
  if (!account) return res.status(400).json({ error: 'Payout account (phone / IBAN) required' })

  const now    = Date.now()
  const id     = crypto.randomUUID()
  const status = IS_DEV ? 'paid' : 'pending'
  const paidAt = IS_DEV ? now : null

  insertPayout.run({ id, driver_id: req.params.id, amount: Number(amount), method, account, status, note, requested_at: now, paid_at: paidAt })

  if (IS_DEV) {
    console.log(`[payments] DEV auto-paid ${method} $${amount} → ${account} for driver ${req.params.id}`)
    return res.json({ ok: true, payoutId: id, status: 'paid', devNote: `${method} payout auto-processed in dev` })
  }

  // Production: initiate EcoCash B2C or ZIPIT transfer here. See docs/PAYMENT_PROVIDER.md.
  res.json({ ok: true, payoutId: id, status: 'pending' })
})

module.exports = { router }
