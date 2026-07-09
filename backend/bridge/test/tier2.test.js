// Tier-2 unit tests — order edge-case policy + geo math. Run: npm run test:unit
const { test } = require('node:test')
const assert = require('node:assert/strict')

const {
  canCancel, computeRefund, canRetryPayment, resolveOutOfStock,
} = require('../order-policy')
const { haversineMeters, estimateEtaSeconds, fmtEta } = require('../geo')
const { slugify } = require('../merchant-onboard')

// ── canCancel ──
test('customer may cancel only before preparing', () => {
  assert.equal(canCancel('placed', 'customer').ok, true)
  assert.equal(canCancel('accepted', 'customer').ok, true)
  assert.equal(canCancel('preparing', 'customer').ok, false)
  assert.equal(canCancel('en_route', 'customer').ok, false)
})
test('merchant may cancel through ready but not once out for delivery', () => {
  assert.equal(canCancel('preparing', 'merchant').ok, true)
  assert.equal(canCancel('ready', 'merchant').ok, true)
  assert.equal(canCancel('picked_up', 'merchant').ok, false)
})
test('admin may cancel any non-terminal order', () => {
  assert.equal(canCancel('en_route', 'admin').ok, true)
  assert.equal(canCancel('delivered', 'admin').ok, false)  // terminal
})

// ── computeRefund ──
const paid = (over = {}) => ({ id: 'p', amount: 20, status: 'completed', refunded_amount: 0, ...over })

test('full refund when no amount is given', () => {
  const r = computeRefund(paid())
  assert.equal(r.ok, true); assert.equal(r.amount, 20); assert.equal(r.newStatus, 'refunded')
})
test('partial refund sets partially_refunded and tracks the running total', () => {
  const r = computeRefund(paid(), 5)
  assert.equal(r.amount, 5); assert.equal(r.newRefundedTotal, 5); assert.equal(r.newStatus, 'partially_refunded')
})
test('second partial refund that clears the balance becomes fully refunded', () => {
  const r = computeRefund(paid({ status: 'partially_refunded', refunded_amount: 15 }), 5)
  assert.equal(r.newStatus, 'refunded'); assert.equal(r.newRefundedTotal, 20)
})
test('refund cannot exceed the remaining balance', () => {
  assert.equal(computeRefund(paid({ refunded_amount: 18 }), 5).ok, false)
})
test('a pending or already-refunded payment cannot be refunded', () => {
  assert.equal(computeRefund(paid({ status: 'pending' })).ok, false)
  assert.equal(computeRefund(paid({ status: 'refunded', refunded_amount: 20 })).ok, false)
  assert.equal(computeRefund(null).ok, false)
})

// ── canRetryPayment ──
test('retry allowed for failed/pending/no-payment, blocked for completed/refunded', () => {
  assert.equal(canRetryPayment({ status: 'failed' }).ok, true)
  assert.equal(canRetryPayment({ status: 'pending' }).ok, true)
  assert.equal(canRetryPayment(null).ok, true)
  assert.equal(canRetryPayment({ status: 'completed' }).ok, false)
  assert.equal(canRetryPayment({ status: 'refunded' }).ok, false)
})

// ── resolveOutOfStock ──
test('refund_item plans a partial refund of the line total', () => {
  const r = resolveOutOfStock({ resolution: 'refund_item', lineTotal: 7.5 })
  assert.deepEqual([r.action, r.amount, r.cancel], ['partial_refund', 7.5, false])
})
test('cancel plans a full refund and cancels the order', () => {
  const r = resolveOutOfStock({ resolution: 'cancel' })
  assert.deepEqual([r.action, r.cancel], ['full_refund', true])
})
test('substitute is a note, no refund', () => {
  assert.equal(resolveOutOfStock({ resolution: 'substitute' }).action, 'note')
})
test('refund_item without a line total is rejected', () => {
  assert.equal(resolveOutOfStock({ resolution: 'refund_item' }).ok, false)
})

// ── geo math ──
test('haversine is ~0 for identical points and symmetric', () => {
  const a = { lat: -17.83, lng: 31.05 }, b = { lat: -17.76, lng: 31.09 }
  assert.ok(haversineMeters(a, a) < 1)
  assert.ok(Math.abs(haversineMeters(a, b) - haversineMeters(b, a)) < 1)
})
test('haversine matches a known Harare→Borrowdale distance (~8-9km)', () => {
  const d = haversineMeters({ lat: -17.8292, lng: 31.0522 }, { lat: -17.7590, lng: 31.0870 })
  assert.ok(d > 7000 && d < 10000, `got ${d}`)
})
test('ETA grows with distance and includes the pickup buffer', () => {
  const short = estimateEtaSeconds(1000)
  const long = estimateEtaSeconds(10000)
  assert.ok(long > short)
  assert.ok(estimateEtaSeconds(0) >= 120)   // buffer floor
})
test('fmtEta renders minutes and hours', () => {
  assert.match(fmtEta(600), /min/)
  assert.match(fmtEta(4200), /h/)
})

// ── slugify ──
test('slugify makes url-safe merchant ids', () => {
  assert.equal(slugify('Amanzi Restaurant & Bar'), 'amanzi-restaurant-bar')
  assert.equal(slugify('  Café  Nyama!! '), 'caf-nyama')
})
