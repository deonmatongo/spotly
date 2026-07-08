// High-level SDK over the MQTT event bus. Each app talks to this, never to
// paho or raw topics directly, so when the real backend lands we can swap the
// transport (REST + WebSocket) behind these same method signatures without
// touching any screen.
import { MqttClient, MqttStatus } from './MqttClient'
import {
  merchantOrderTopic, merchantInboxWildcard, orderStatusTopic,
  jobTopic, jobsWildcard, ticketTopic, ticketsWildcard, merchantMenuTopic,
  presenceTopic, dispatchResultTopic,
} from './topics'
import { Order, OrderStatus, OrderStatusEvent, DeliveryJob, IssuedTicket, MenuItemPublic, MerchantMenu } from './types'
import { getApiUrl } from './config'

export interface EarningsSummary {
  driverId: string
  deliveries: number
  allAssigned: number
  grossEarnings: number
  recentDeliveries: Order[]
}

export type { MqttStatus }

type Role = 'customer' | 'merchant' | 'driver'

function safeParse<T>(payload: string): T | null {
  if (!payload) return null // empty retained payload = a cleared topic
  try { return JSON.parse(payload) as T } catch { return null }
}

export class SpotlyClient {
  private mqtt: MqttClient

  constructor(role: Role) {
    this.mqtt = new MqttClient(role)
  }

  connect() { this.mqtt.connect() }
  disconnect() { this.mqtt.disconnect() }
  onStatus(cb: (s: MqttStatus) => void) { return this.mqtt.onStatus(cb) }

  // --- Customer ------------------------------------------------------------

  // Place an order: drop it into the merchant's inbox (retained so the merchant
  // sees it whenever they open) and seed the status stream at 'placed'.
  placeOrder(order: Order) {
    this.mqtt.publish(merchantOrderTopic(order.merchantId, order.ref), order, { retained: true })
    this.setOrderStatus({ ref: order.ref, status: 'placed', ts: order.placedAt })
  }

  // Track one order's status. Fires immediately with the retained current
  // value, then on every change. Returns an unsubscribe.
  trackOrder(ref: string, cb: (evt: OrderStatusEvent) => void): () => void {
    return this.mqtt.subscribe(orderStatusTopic(ref), payload => {
      const evt = safeParse<OrderStatusEvent>(payload)
      if (evt) cb(evt)
    })
  }

  cancelOrder(ref: string) {
    this.setOrderStatus({ ref, status: 'cancelled', ts: Date.now() })
  }

  // --- Merchant ------------------------------------------------------------

  // Watch the merchant inbox. `onOrder` fires for each open order (on connect
  // for retained ones, then live); `onClear` fires when an order is pulled from
  // the queue so the UI can drop it.
  watchInbox(
    merchantId: string,
    onOrder: (order: Order) => void,
    onClear?: (ref: string) => void,
  ): () => void {
    return this.mqtt.subscribe(merchantInboxWildcard(merchantId), (payload, topic) => {
      const order = safeParse<Order>(payload)
      if (order) onOrder(order)
      else if (onClear) {
        const ref = topic.split('/').pop()
        if (ref) onClear(ref)
      }
    })
  }

  // Advance an order and (optionally) refresh the retained inbox snapshot so a
  // merchant reopening the app sees the current status on the card.
  setOrderStatus(evt: OrderStatusEvent) {
    this.mqtt.publish(orderStatusTopic(evt.ref), evt, { retained: true })
  }

  updateInboxOrder(order: Order) {
    this.mqtt.publish(merchantOrderTopic(order.merchantId, order.ref), order, { retained: true })
  }

  // Pull a finished/declined order off the merchant inbox queue.
  clearInboxOrder(merchantId: string, ref: string) {
    this.mqtt.clearRetained(merchantOrderTopic(merchantId, ref))
  }

  // Dispatch a delivery job to drivers (retained until a driver claims it).
  dispatchJob(job: DeliveryJob) {
    this.mqtt.publish(jobTopic(job.ref), job, { retained: true })
  }

  // Publish the merchant's live menu (retained) so customers see the current
  // items, prices, and availability.
  publishMenu(merchantId: string, items: MenuItemPublic[]) {
    this.mqtt.publish(merchantMenuTopic(merchantId), { merchantId, items }, { retained: true })
  }

  // Customer: subscribe to a merchant's live menu.
  watchMenu(merchantId: string, cb: (menu: MerchantMenu) => void): () => void {
    return this.mqtt.subscribe(merchantMenuTopic(merchantId), payload => {
      const m = safeParse<MerchantMenu>(payload)
      if (m) cb(m)
    })
  }

  // --- Driver --------------------------------------------------------------

  // Watch the dispatch queue. `onJob` for each available job, `onClaimed` when
  // one is pulled (claimed by any driver, incl. this one).
  watchJobs(
    onJob: (job: DeliveryJob) => void,
    onClaimed?: (ref: string) => void,
  ): () => void {
    return this.mqtt.subscribe(jobsWildcard(), (payload, topic) => {
      const job = safeParse<DeliveryJob>(payload)
      if (job) onJob(job)
      else if (onClaimed) {
        const ref = topic.split('/').pop()
        if (ref) onClaimed(ref)
      }
    })
  }

  // Claim a job: remove it from the queue so other drivers stop seeing it and
  // attach the driver. Status stays 'ready' (food is ready, driver assigned and
  // heading to pickup) until the driver marks 'picked_up'.
  claimJob(ref: string, driverId: string, driverName: string) {
    this.mqtt.clearRetained(jobTopic(ref))
    this.setOrderStatus({ ref, status: 'ready', ts: Date.now(), driverId, driverName })
  }

  // Driver progressing the delivery (picked_up → en_route → delivered).
  advanceOrder(ref: string, status: OrderStatus, driverId?: string, driverName?: string) {
    this.setOrderStatus({ ref, status, ts: Date.now(), driverId, driverName })
  }

  // Driver: advertise availability to the dispatcher (retained).
  setPresence(driverId: string, online: boolean, busy: boolean, name?: string) {
    this.mqtt.publish(presenceTopic(driverId), { driverId, online, busy, name, ts: Date.now() }, { retained: true })
  }

  // Merchant: learn the dispatch outcome for an order (assigned / no driver).
  watchDispatch(ref: string, cb: (result: { status: string; driverName?: string }) => void): () => void {
    return this.mqtt.subscribe(dispatchResultTopic(ref), payload => {
      const r = safeParse<{ status: string; driverName?: string }>(payload)
      if (r) cb(r)
    })
  }

  // --- Event tickets -------------------------------------------------------

  // Customer: publish an issued ticket (retained) so a door scanner can find it.
  issueTicket(ticket: IssuedTicket) {
    this.mqtt.publish(ticketTopic(ticket.code), ticket, { retained: true })
  }

  // Door scanner: watch all issued/redeemed tickets (retained delivers the set
  // on connect, then live updates).
  watchTickets(cb: (ticket: IssuedTicket) => void): () => void {
    return this.mqtt.subscribe(ticketsWildcard(), payload => {
      const t = safeParse<IssuedTicket>(payload)
      if (t) cb(t)
    })
  }

  // Door scanner: mark a ticket redeemed (retained) so it can't be reused.
  redeemTicket(ticket: IssuedTicket) {
    this.mqtt.publish(ticketTopic(ticket.code), { ...ticket, status: 'redeemed', redeemedAt: Date.now() }, { retained: true })
  }

  // --- REST persistence API (Tier 1 backend) --------------------------------
  // These methods talk to the API server (:4001) which writes every MQTT event
  // to SQLite. Call them on app mount to restore state that survived a restart.
  // All methods resolve to an empty/null result if the API is unreachable so
  // screens degrade gracefully to MQTT-only mode.

  async getOrderHistory(merchantId: string): Promise<Order[]> {
    try {
      const res = await fetch(`${getApiUrl()}/api/orders?merchantId=${encodeURIComponent(merchantId)}`)
      if (!res.ok) return []
      return res.json()
    } catch { return [] }
  }

  async getDeliveryHistory(driverId: string): Promise<Order[]> {
    try {
      const res = await fetch(`${getApiUrl()}/api/orders?driverId=${encodeURIComponent(driverId)}`)
      if (!res.ok) return []
      return res.json()
    } catch { return [] }
  }

  async getEarnings(driverId: string): Promise<EarningsSummary | null> {
    try {
      const res = await fetch(`${getApiUrl()}/api/drivers/${encodeURIComponent(driverId)}/earnings`)
      if (!res.ok) return null
      return res.json()
    } catch { return null }
  }

  async getPersistedMenu(merchantId: string): Promise<MenuItemPublic[]> {
    try {
      const res = await fetch(`${getApiUrl()}/api/merchants/${encodeURIComponent(merchantId)}/menu`)
      if (!res.ok) return []
      const body = await res.json() as MerchantMenu
      return body.items ?? []
    } catch { return [] }
  }

  async getOrder(ref: string): Promise<Order | null> {
    try {
      const res = await fetch(`${getApiUrl()}/api/orders/${encodeURIComponent(ref)}`)
      if (!res.ok) return null
      return res.json()
    } catch { return null }
  }
}
