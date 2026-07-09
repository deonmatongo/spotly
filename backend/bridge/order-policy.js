// Spotly — order edge-case policy (pure functions, no I/O → fully unit-tested).
//
// Encodes the rules the routes in api.js enforce for cancellation, refunds, and
// out-of-stock handling, so the decisions are testable in isolation.

// Statuses at which each actor may still cancel.
// Customers can back out only before the merchant starts cooking; merchants and
// admins can cancel later (declines, kitchen problems).
const CUSTOMER_CANCELLABLE = new Set(['placed', 'accepted'])
const STAFF_CANCELLABLE     = new Set(['placed', 'accepted', 'preparing', 'ready'])
const TERMINAL             = new Set(['delivered', 'declined', 'cancelled'])

/** Can `actor` ('customer' | 'merchant' | 'admin') cancel an order in `status`? */
function canCancel(status, actor) {
  if (TERMINAL.has(status)) return { ok: false, reason: 'Order is already complete or cancelled.' }
  if (actor === 'admin') return { ok: true }
  if (actor === 'merchant') {
    return STAFF_CANCELLABLE.has(status)
      ? { ok: true }
      : { ok: false, reason: 'Order is already out for delivery.' }
  }
  // customer
  return CUSTOMER_CANCELLABLE.has(status)
    ? { ok: true }
    : { ok: false, reason: "The kitchen has started your order — contact support to cancel." }
}

/**
 * Compute the result of a refund request against a payment.
 * `requested` undefined ⇒ refund the full remaining balance.
 * Returns { ok, amount, newRefundedTotal, newStatus } or { ok:false, reason }.
 */
function computeRefund(payment, requested) {
  if (!payment) return { ok: false, reason: 'No payment found for this order.' }
  if (payment.status !== 'completed' && payment.status !== 'partially_refunded') {
    return { ok: false, reason: `A ${payment.status} payment cannot be refunded.` }
  }
  const alreadyRefunded = payment.refunded_amount || 0
  const remaining = round2(payment.amount - alreadyRefunded)
  if (remaining <= 0) return { ok: false, reason: 'This payment is already fully refunded.' }

  let amount = requested === undefined || requested === null ? remaining : round2(Number(requested))
  if (!(amount > 0)) return { ok: false, reason: 'Refund amount must be positive.' }
  if (amount > remaining + 1e-9) {
    return { ok: false, reason: `Refund exceeds the remaining balance ($${remaining.toFixed(2)}).` }
  }

  const newRefundedTotal = round2(alreadyRefunded + amount)
  const fullyRefunded = newRefundedTotal >= payment.amount - 1e-9
  return {
    ok: true,
    amount,
    newRefundedTotal,
    newStatus: fullyRefunded ? 'refunded' : 'partially_refunded',
  }
}

/**
 * Decide the next state when a payment attempt can be retried.
 * Only failed/pending payments are retryable; completed ones are a no-op.
 */
function canRetryPayment(payment) {
  if (!payment) return { ok: true, reason: 'no prior payment — first attempt' }
  if (payment.status === 'completed') return { ok: false, reason: 'Payment already completed.' }
  if (payment.status === 'refunded') return { ok: false, reason: 'Payment was refunded.' }
  return { ok: true }
}

const OOS_RESOLUTIONS = new Set(['refund_item', 'substitute', 'cancel'])

/**
 * Resolve an out-of-stock item mid-order. Returns the action to take:
 *   refund_item → partial refund of the item's line total (order continues)
 *   substitute  → record a substitution note (order continues, no refund)
 *   cancel      → cancel the whole order + full refund
 */
function resolveOutOfStock({ resolution, lineTotal }) {
  if (!OOS_RESOLUTIONS.has(resolution)) {
    return { ok: false, reason: 'resolution must be refund_item, substitute or cancel.' }
  }
  if (resolution === 'refund_item') {
    if (!(lineTotal > 0)) return { ok: false, reason: 'A positive item line total is required to refund it.' }
    return { ok: true, action: 'partial_refund', amount: round2(lineTotal), cancel: false }
  }
  if (resolution === 'substitute') return { ok: true, action: 'note', cancel: false }
  return { ok: true, action: 'full_refund', cancel: true } // cancel
}

function round2(n) { return Math.round(n * 100) / 100 }

module.exports = {
  canCancel, computeRefund, canRetryPayment, resolveOutOfStock, round2,
  CUSTOMER_CANCELLABLE, STAFF_CANCELLABLE, TERMINAL, OOS_RESOLUTIONS,
}
