// Spotly — order edge-case routes (cancellation, refunds, retries, out-of-stock).
//
// Mounted at /api in api.js. Decisions come from the pure order-policy module;
// this layer does the I/O (DB writes, bus publish, push) and HTTP.
//
//   POST /api/orders/:ref/cancel            { actor?, reason? }
//   POST /api/orders/:ref/refund            { amount?, reason? }   (partial or full)
//   POST /api/orders/:ref/retry-payment     { method?, phone? }
//   POST /api/orders/:ref/items/unavailable { item, resolution, lineTotal? }

const express = require('express')
const crypto  = require('crypto')
const { validate } = require('./security')
const {
  canCancel, computeRefund, canRetryPayment, resolveOutOfStock, round2,
} = require('./order-policy')
const {
  getOrder, upsertOrderStatus, insertEvent,
  getPaymentByOrderRef, applyRefund, insertPayment, updatePaymentStatus,
} = require('./db')

const IS_DEV = process.env.NODE_ENV !== 'production'

// createOrdersOps({ publish, notify }) — publish(topic,obj) fires MQTT status;
// notify(phone,title,body,data) optionally pushes the customer. Both optional.
function createOrdersOps({ publish, notify } = {}) {
  const router = express.Router()

  const pushStatus = (ref, status, extra = {}) => {
    const now = Date.now()
    upsertOrderStatus.run({ ref, status, driver_id: '', driver_name: '', updated_at: now })
    insertEvent.run({ ref, status, driver_id: null, driver_name: null, ts: now })
    try { publish?.(`orders/${ref}/status`, { ref, status, ts: now, ...extra }) } catch {}
  }

  const doRefund = (payment, amount, newStatus) => {
    applyRefund.run({
      id: payment.id,
      status: newStatus,
      refunded_amount: amount,       // cumulative total (computed by caller)
      updated_at: Date.now(),
    })
    if (!IS_DEV) console.log(`[orders-ops] TODO: provider refund ${payment.id} → ${amount}`)
  }

  const notifyCustomer = (order, title, body) => {
    try { if (order?.customer_phone && notify) notify(order.customer_phone, title, body, { ref: order.ref }) } catch {}
  }

  // ── Cancel ────────────────────────────────────────────────────────────────
  router.post('/orders/:ref/cancel',
    validate({ actor: { type: 'string', enum: ['customer', 'merchant', 'admin'] }, reason: { type: 'string', maxLen: 500 } }),
    (req, res) => {
      const order = getOrder.get(req.params.ref)
      if (!order) return res.status(404).json({ error: 'Order not found.' })

      const actor = req.valid.actor || 'customer'
      const verdict = canCancel(order.status, actor)
      if (!verdict.ok) return res.status(409).json({ error: verdict.reason })

      pushStatus(order.ref, 'cancelled', { reason: req.valid.reason || '', by: actor })

      // Auto-refund any captured payment on cancellation.
      let refunded = 0
      const payment = getPaymentByOrderRef.get(order.ref)
      const refund = computeRefund(payment) // full remaining
      if (refund.ok) { doRefund(payment, refund.newRefundedTotal, refund.newStatus); refunded = refund.amount }

      notifyCustomer(order, 'Order cancelled', `Order ${order.ref} was cancelled${refunded ? ` and $${refunded.toFixed(2)} refunded` : ''}.`)
      res.json({ ok: true, ref: order.ref, status: 'cancelled', refunded })
    })

  // ── Refund (partial or full) ────────────────────────────────────────────────
  router.post('/orders/:ref/refund',
    validate({ amount: { type: 'number', min: 0 }, reason: { type: 'string', maxLen: 500 } }),
    (req, res) => {
      const order = getOrder.get(req.params.ref)
      if (!order) return res.status(404).json({ error: 'Order not found.' })
      const payment = getPaymentByOrderRef.get(order.ref)

      const refund = computeRefund(payment, req.valid.amount)
      if (!refund.ok) return res.status(409).json({ error: refund.reason })

      doRefund(payment, refund.newRefundedTotal, refund.newStatus)
      notifyCustomer(order, 'Refund issued', `We've refunded $${refund.amount.toFixed(2)} for order ${order.ref}.`)
      res.json({
        ok: true, ref: order.ref, refunded: refund.amount,
        totalRefunded: refund.newRefundedTotal, paymentStatus: refund.newStatus,
      })
    })

  // ── Retry a failed/pending payment ────────────────────────────────────────────
  router.post('/orders/:ref/retry-payment',
    validate({ method: { type: 'string', maxLen: 40 }, phone: { type: 'string', maxLen: 32 } }),
    (req, res) => {
      const order = getOrder.get(req.params.ref)
      if (!order) return res.status(404).json({ error: 'Order not found.' })

      const existing = getPaymentByOrderRef.get(order.ref)
      const verdict = canRetryPayment(existing)
      if (!verdict.ok) return res.status(409).json({ error: verdict.reason })

      const now = Date.now()
      const method = req.valid.method || existing?.method || 'ecocash'
      const amount = existing?.amount || order.total || 0
      if (!(amount > 0)) return res.status(400).json({ error: 'Order has no payable amount.' })

      const status = IS_DEV ? 'completed' : 'pending'
      if (existing) {
        updatePaymentStatus.run({ status, provider_ref: null, updated_at: now, id: existing.id })
      } else {
        insertPayment.run({
          id: crypto.randomUUID(), order_ref: order.ref, amount, currency: 'USD',
          method, status, provider_ref: null, phone: req.valid.phone || null,
          created_at: now, updated_at: now,
        })
      }
      res.json({ ok: true, ref: order.ref, paymentStatus: status, method, amount: round2(amount) })
    })

  // ── Out-of-stock item mid-order ────────────────────────────────────────────
  router.post('/orders/:ref/items/unavailable',
    validate({
      item:       { type: 'string', required: true, maxLen: 120 },
      resolution: { type: 'string', required: true, enum: ['refund_item', 'substitute', 'cancel'] },
      lineTotal:  { type: 'number', min: 0 },
      substitute: { type: 'string', maxLen: 120 },
    }),
    (req, res) => {
      const order = getOrder.get(req.params.ref)
      if (!order) return res.status(404).json({ error: 'Order not found.' })

      const plan = resolveOutOfStock({ resolution: req.valid.resolution, lineTotal: req.valid.lineTotal })
      if (!plan.ok) return res.status(400).json({ error: plan.reason })

      // Audit the stock event on the order timeline.
      insertEvent.run({ ref: order.ref, status: `item_unavailable:${req.valid.item}`, driver_id: null, driver_name: null, ts: Date.now() })

      const payment = getPaymentByOrderRef.get(order.ref)
      let refunded = 0

      if (plan.action === 'partial_refund') {
        const refund = computeRefund(payment, plan.amount)
        if (refund.ok) { doRefund(payment, refund.newRefundedTotal, refund.newStatus); refunded = refund.amount }
        notifyCustomer(order, 'Item unavailable', `"${req.valid.item}" is out of stock — we've refunded $${refunded.toFixed(2)}.`)
      } else if (plan.action === 'full_refund') {
        pushStatus(order.ref, 'cancelled', { reason: `out_of_stock:${req.valid.item}` })
        const refund = computeRefund(payment)
        if (refund.ok) { doRefund(payment, refund.newRefundedTotal, refund.newStatus); refunded = refund.amount }
        notifyCustomer(order, 'Order cancelled', `"${req.valid.item}" is unavailable, so we've cancelled and refunded order ${order.ref}.`)
      } else {
        // substitute
        notifyCustomer(order, 'Item substituted', `"${req.valid.item}" was swapped for "${req.valid.substitute || 'a similar item'}".`)
      }

      res.json({ ok: true, ref: order.ref, resolution: req.valid.resolution, refunded, cancelled: plan.cancel })
    })

  return router
}

module.exports = { createOrdersOps }
