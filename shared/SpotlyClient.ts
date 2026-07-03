// High-level SDK over the MQTT event bus. Each app talks to this, never to
// paho or raw topics directly, so when the real backend lands we can swap the
// transport (REST + WebSocket) behind these same method signatures without
// touching any screen.
import { MqttClient, MqttStatus } from './MqttClient'
import {
  merchantOrderTopic, merchantInboxWildcard, orderStatusTopic,
  jobTopic, jobsWildcard,
} from './topics'
import { Order, OrderStatus, OrderStatusEvent, DeliveryJob } from './types'

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
}
