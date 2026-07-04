// Status adapters between the canonical order lifecycle and each app's local
// vocabulary. Centralised here (rather than inline in each app) so the mapping
// is a single source of truth and unit-testable without a React Native runtime.
import { OrderStatus } from './types'

// --- Customer app: 4-stage tracking timeline --------------------------------
// 0 Confirmed · 1 Preparing · 2 On the way · 3 Delivered
export function statusToStage(s: OrderStatus): number {
  switch (s) {
    case 'placed':
    case 'accepted': return 0
    case 'preparing':
    case 'ready': return 1
    case 'picked_up':
    case 'en_route': return 2
    case 'delivered': return 3
    default: return 0
  }
}

// --- Merchant app: new/preparing/ready/done/declined ------------------------
export type MerchantOrderStatus = 'new' | 'preparing' | 'ready' | 'done' | 'declined'

export function canonicalToMerchant(s: OrderStatus): MerchantOrderStatus {
  switch (s) {
    case 'placed': return 'new'
    case 'accepted': return 'preparing'
    case 'preparing': return 'preparing'
    case 'ready': return 'ready'
    case 'picked_up':
    case 'en_route':
    case 'delivered': return 'done'
    case 'declined':
    case 'cancelled': return 'declined'
    default: return 'new'
  }
}

export function merchantToCanonical(s: MerchantOrderStatus): OrderStatus {
  switch (s) {
    case 'new': return 'placed'
    case 'preparing': return 'preparing'
    case 'ready': return 'ready'
    case 'done': return 'delivered'
    case 'declined': return 'declined'
    default: return 'placed'
  }
}
