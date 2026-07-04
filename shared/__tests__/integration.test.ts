import { describe, it, expect } from 'vitest'
import {
  SpotlyClient, Order, DeliveryJob,
  DEMO_MERCHANT_ID, DEMO_MERCHANT_NAME, DEMO_DRIVER_ID, DEMO_DRIVER_NAME,
  MERCHANT_COORD, FALLBACK_DROPOFF, newOrderRef,
} from '../index'

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

function connected(c: SpotlyClient, timeoutMs = 3000): Promise<boolean> {
  return new Promise(resolve => {
    let settled = false
    const done = (v: boolean) => { if (!settled) { settled = true; resolve(v) } }
    const off = c.onStatus(s => { if (s === 'connected') { off(); done(true) } })
    c.connect()
    setTimeout(() => done(false), timeoutMs)
  })
}

function makeOrder(ref: string): Order {
  return {
    ref, merchantId: DEMO_MERCHANT_ID, merchantName: DEMO_MERCHANT_NAME,
    customerName: 'Test Customer', customerPhone: '+263 77 000 0000',
    items: [{ id: 'm1', name: 'Grilled Tilapia', qty: 1, unitPrice: 12.5 }],
    subtotal: 12.5, deliveryFee: 2.9, total: 15.4, status: 'placed', placedAt: 1_700_000_000_000,
    address: '8 Cambridge Ave, Newlands', pickupCoord: MERCHANT_COORD, dropoffCoord: FALLBACK_DROPOFF, prepMinutes: 20,
  }
}
function makeJob(ref: string): DeliveryJob {
  return {
    ref, merchantId: DEMO_MERCHANT_ID, vendorName: DEMO_MERCHANT_NAME,
    pickup: '225 Enterprise Road', pickupCoord: MERCHANT_COORD,
    dropoff: '8 Cambridge Ave', dropoffCoord: FALLBACK_DROPOFF,
    customerName: 'Test Customer', customerPhone: '+263 77 000 0000',
    itemsSummary: '1× Grilled Tilapia', distance: '5.0 km', estMinutes: 18,
    payout: 6.4, tip: 0, dispatchedAt: 1_700_000_000_000,
  }
}

// Probe once: if the dev broker isn't up, skip the live suite rather than fail.
const probe = new SpotlyClient('probe')
const brokerUp = await connected(probe, 3000)
try { probe.disconnect() } catch { /* noop */ }
if (!brokerUp) {
  console.warn('\n[integration] broker not reachable on ws://localhost:9001 — skipping live bus tests.\n  Start it: cd backend/bridge && node dev.js\n')
}

describe.skipIf(!brokerUp)('order bus — three apps over the live broker', () => {
  it('runs the full customer → merchant → driver → customer lifecycle', async () => {
    const customer = new SpotlyClient('customer')
    const merchant = new SpotlyClient('merchant')
    const driver = new SpotlyClient('driver')
    const ref = newOrderRef()

    const merchantSeen: string[] = []
    const driverJobs: string[] = []
    const customerStatuses: string[] = []

    merchant.watchInbox(DEMO_MERCHANT_ID, o => merchantSeen.push(o.ref))
    driver.watchJobs(j => driverJobs.push(j.ref))
    customer.trackOrder(ref, e => customerStatuses.push(e.status))

    await Promise.all([connected(customer), connected(merchant), connected(driver)])
    await wait(300)

    // 1. Customer checks out
    customer.placeOrder(makeOrder(ref))
    await wait(500)
    expect(merchantSeen, 'merchant receives the order live').toContain(ref)

    // 2. Merchant accepts → preparing → ready + dispatch
    merchant.setOrderStatus({ ref, status: 'preparing', ts: Date.now() })
    await wait(150)
    merchant.setOrderStatus({ ref, status: 'ready', ts: Date.now() })
    merchant.dispatchJob(makeJob(ref))
    await wait(500)
    expect(customerStatuses).toContain('preparing')
    expect(customerStatuses).toContain('ready')
    expect(driverJobs, 'driver receives the dispatched job live').toContain(ref)

    // 3. Driver claims + delivers
    driver.claimJob(ref, DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
    await wait(150)
    driver.advanceOrder(ref, 'picked_up', DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
    driver.advanceOrder(ref, 'en_route', DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
    driver.advanceOrder(ref, 'delivered', DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
    await wait(500)
    expect(customerStatuses).toContain('picked_up')
    expect(customerStatuses).toContain('en_route')
    expect(customerStatuses).toContain('delivered')

    // The customer's status stream is monotonic and ends delivered
    expect(customerStatuses[customerStatuses.length - 1]).toBe('delivered')

    merchant.clearInboxOrder(DEMO_MERCHANT_ID, ref) // test hygiene
    await wait(100)
    ;[customer, merchant, driver].forEach(c => c.disconnect())
  })

  it('gives a customer opening the tracking screen late the retained current status', async () => {
    const publisher = new SpotlyClient('driver')
    const ref = newOrderRef()
    await connected(publisher)
    publisher.setOrderStatus({ ref, status: 'en_route', ts: Date.now(), driverName: DEMO_DRIVER_NAME })
    await wait(400)

    // A brand-new subscriber joins AFTER the status was set
    const late = new SpotlyClient('customer')
    const seen: string[] = []
    late.trackOrder(ref, e => seen.push(e.status))
    await connected(late)
    await wait(500)

    expect(seen[seen.length - 1]).toBe('en_route')
    ;[publisher, late].forEach(c => c.disconnect())
  })

  it('clears a claimed job from the queue so later drivers do not see it', async () => {
    const merchant = new SpotlyClient('merchant')
    const driverA = new SpotlyClient('driver')
    const ref = newOrderRef()
    await Promise.all([connected(merchant), connected(driverA)])

    merchant.dispatchJob(makeJob(ref))
    await wait(400)
    const aJobs: string[] = []
    driverA.watchJobs(j => aJobs.push(j.ref))
    await wait(300)
    expect(aJobs, 'first driver sees the open job').toContain(ref)

    // Driver A claims it (clears the retained job topic)
    driverA.claimJob(ref, DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
    await wait(400)

    // Driver B connects fresh — the claimed job must not be in their queue
    const driverB = new SpotlyClient('driver')
    const bJobs: string[] = []
    driverB.watchJobs(j => bJobs.push(j.ref))
    await connected(driverB)
    await wait(500)
    expect(bJobs, 'a later driver does not see the claimed job').not.toContain(ref)

    merchant.clearInboxOrder(DEMO_MERCHANT_ID, ref)
    ;[merchant, driverA, driverB].forEach(c => c.disconnect())
  })
})
