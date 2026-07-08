import { getApiUrl } from './config'

export type PaymentMethod = 'ecocash' | 'card' | 'cash' | 'innbucks' | 'points'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type PayoutMethod  = 'ecocash' | 'bank' | 'innbucks'
export type PayoutStatus  = 'pending' | 'processing' | 'paid' | 'failed'

export interface Payment {
  id: string
  orderRef: string
  amount: number
  currency: string
  method: PaymentMethod
  status: PaymentStatus
  providerRef?: string
  phone?: string
  createdAt: number
  updatedAt: number
}

export interface PayoutRecord {
  id: string
  driverId: string
  amount: number
  method: PayoutMethod
  account: string
  status: PayoutStatus
  note?: string
  requestedAt: number
  paidAt?: number
}

async function post(path: string, body: object) {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Request failed ${res.status}`)
  return data
}

// Initiate (and in dev: auto-confirm) payment for an order.
// Returns paymentId + status ('completed' in dev, 'pending' in prod).
// Throws on gateway error so the caller can surface it to the user.
export async function chargeOrder(
  orderRef: string,
  amount: number,
  method: PaymentMethod,
  phone?: string,
): Promise<{ paymentId: string; status: PaymentStatus; redirectUrl?: string; devNote?: string }> {
  return post('/payments/charge', { orderRef, amount, method, phone })
}

// Fetch the payment record for an order (null if not found or unreachable).
export async function getPaymentForOrder(orderRef: string): Promise<Payment | null> {
  try {
    const res = await fetch(`${getApiUrl()}/payments/order/${encodeURIComponent(orderRef)}`)
    if (!res.ok) return null
    return res.json() as Promise<Payment>
  } catch { return null }
}

// Request an instant payout to EcoCash / bank.
// `entityId` is either a driverId or merchantId — both use the same route.
export async function requestPayout(
  entityId: string,
  amount: number,
  method: PayoutMethod,
  account: string,
): Promise<{ payoutId: string; status: PayoutStatus; devNote?: string }> {
  return post(`/payments/drivers/${encodeURIComponent(entityId)}/payouts/request`, { amount, method, account })
}

// Full payout history for a driver or merchant.
export async function getPayouts(entityId: string): Promise<PayoutRecord[]> {
  try {
    const res = await fetch(`${getApiUrl()}/payments/drivers/${encodeURIComponent(entityId)}/payouts`)
    if (!res.ok) return []
    return res.json() as Promise<PayoutRecord[]>
  } catch { return [] }
}
