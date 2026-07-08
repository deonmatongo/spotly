// Canonical Spotly domain model — the single source of truth shared by the
// customer, merchant, and driver apps. Each app keeps its own view models, but
// anything that crosses the wire (orders, jobs, status, location) is defined
// here so the three apps stay in lockstep without a backend to enforce it.

export interface Coord {
  lat: number
  lng: number
}

// One line on an order. `id` mirrors the merchant menu item id where known.
export interface OrderItem {
  id: string
  name: string
  qty: number
  unitPrice: number
  note?: string
}

// The order lifecycle spans all three apps. It is intentionally a superset of
// each app's local vocabulary; adapters map to/from these canonical values:
//
//   placed     customer checked out, waiting for the merchant        (client → merchant)
//   accepted   merchant accepted, not cooking yet                    (merchant)
//   preparing  merchant is preparing the order                       (merchant)
//   ready      ready for pickup — dispatched to drivers              (merchant → driver)
//   picked_up  driver collected from the merchant                    (driver)
//   en_route   driver is on the way to the customer                  (driver → client)
//   delivered  handed to the customer — terminal                     (driver)
//   declined   merchant rejected the order — terminal                (merchant)
//   cancelled  customer cancelled before fulfilment — terminal       (client)
export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'en_route'
  | 'delivered'
  | 'declined'
  | 'cancelled'

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'placed', 'accepted', 'preparing', 'ready', 'picked_up', 'en_route', 'delivered',
]

export const TERMINAL_STATUSES: OrderStatus[] = ['delivered', 'declined', 'cancelled']

export function isTerminal(status: OrderStatus): boolean {
  return TERMINAL_STATUSES.includes(status)
}

export function statusIndex(status: OrderStatus): number {
  const i = ORDER_STATUS_FLOW.indexOf(status)
  return i === -1 ? 0 : i
}

// The full order snapshot that travels from customer → merchant, and is the
// basis of the delivery job the merchant dispatches to drivers.
export interface Order {
  ref: string                 // SPT-#### — the correlation key across all apps and the MQTT trip ref
  merchantId: string          // which store fulfils this (e.g. 'amanzi-restaurant')
  merchantName: string
  customerName: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  status: OrderStatus
  placedAt: number            // epoch ms
  address: string             // dropoff
  addressNote?: string
  pickupCoord?: Coord
  dropoffCoord?: Coord
  driverId?: string
  driverName?: string
  prepMinutes?: number
}

// A lightweight status event — retained on orders/{ref}/status so any app that
// joins mid-flight immediately learns the current state.
export interface OrderStatusEvent {
  ref: string
  status: OrderStatus
  ts: number
  driverId?: string
  driverName?: string
}

// The delivery job the merchant dispatches once an order is ready. This is the
// shape the driver app renders in its available-jobs list.
export interface DeliveryJob {
  ref: string                 // same SPT-#### as the order
  merchantId: string
  vendorName: string
  pickup: string
  pickupCoord?: Coord
  dropoff: string
  dropoffCoord?: Coord
  customerName: string
  customerPhone: string
  itemsSummary: string
  distance: string
  estMinutes: number
  payout: number
  tip: number
  dispatchedAt: number        // epoch ms
}

// A menu item as published by the merchant for customers to browse/order.
export interface MenuItemPublic {
  id: string
  name: string
  category: string
  price: number
  description: string
  available: boolean
}

export interface MerchantMenu {
  merchantId: string
  items: MenuItemPublic[]
}

// An event ticket as it travels on the bus: issued by the customer at
// checkout (status 'valid'), redeemed by a door scanner (status 'redeemed').
export interface IssuedTicket {
  code: string            // the confirmation code encoded in the QR
  eventName: string
  tierName?: string
  quantity: number
  holder: string
  status: 'valid' | 'redeemed'
  issuedAt: number
  redeemedAt?: number
}

// Authenticated user returned by the auth API.
export interface SpotlyUser {
  id: string
  phone: string
  name: string
  role: 'customer' | 'merchant' | 'driver'
}

// Live GPS fix — the existing tracking contract (driver publishes,
// bridge re-scopes to trips/{ref}/location, customer subscribes). Re-exported
// here so all three apps agree on the shape.
export interface DriverFix {
  lat: number
  lng: number
  heading: number
  speed: number
  accuracy?: number
  ts: number
  tripRef?: string
}
