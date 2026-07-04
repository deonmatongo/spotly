import { describe, it, expect } from 'vitest'
import {
  ORDER_STATUS_FLOW, TERMINAL_STATUSES, isTerminal, statusIndex, OrderStatus,
  newOrderRef, configureBroker, getBrokerHost, getBrokerPort, getBridgeUrl,
  DEMO_MERCHANT_ID, DEMO_DRIVER_ID,
  merchantOrderTopic, merchantInboxWildcard, orderStatusTopic, jobTopic, jobsWildcard, refFromTopic,
  statusToStage, canonicalToMerchant, merchantToCanonical, MerchantOrderStatus,
} from '../index'

describe('order status model', () => {
  it('defines the lifecycle in the correct order', () => {
    expect(ORDER_STATUS_FLOW).toEqual([
      'placed', 'accepted', 'preparing', 'ready', 'picked_up', 'en_route', 'delivered',
    ])
  })

  it('statusIndex reflects progression and is monotonic', () => {
    expect(statusIndex('placed')).toBe(0)
    expect(statusIndex('delivered')).toBe(6)
    expect(statusIndex('ready')).toBeGreaterThan(statusIndex('preparing'))
    expect(statusIndex('en_route')).toBeGreaterThan(statusIndex('picked_up'))
  })

  it('unknown status falls back to 0 rather than -1', () => {
    expect(statusIndex('bogus' as OrderStatus)).toBe(0)
  })

  it('marks only terminal statuses as terminal', () => {
    expect(TERMINAL_STATUSES).toEqual(['delivered', 'declined', 'cancelled'])
    for (const s of ['delivered', 'declined', 'cancelled'] as OrderStatus[]) {
      expect(isTerminal(s)).toBe(true)
    }
    for (const s of ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'en_route'] as OrderStatus[]) {
      expect(isTerminal(s)).toBe(false)
    }
  })
})

describe('order refs', () => {
  it('generates SPT-#### refs', () => {
    for (let i = 0; i < 50; i++) {
      expect(newOrderRef()).toMatch(/^SPT-\d{4}$/)
    }
  })
})

describe('broker config', () => {
  it('defaults to localhost:9001 with the :4000 bridge', () => {
    expect(getBrokerHost()).toBe('localhost')
    expect(getBrokerPort()).toBe(9001)
    expect(getBridgeUrl()).toBe('http://localhost:4000')
  })

  it('configureBroker({host}) rewrites host + bridge URL together', () => {
    configureBroker({ host: '192.168.1.50' })
    expect(getBrokerHost()).toBe('192.168.1.50')
    expect(getBridgeUrl()).toBe('http://192.168.1.50:4000')
    configureBroker({ host: 'localhost' }) // restore for other tests in this file
    expect(getBridgeUrl()).toBe('http://localhost:4000')
  })
})

describe('topic contract', () => {
  const ref = 'SPT-1234'

  it('builds the merchant inbox topics and matching wildcard', () => {
    expect(merchantOrderTopic(DEMO_MERCHANT_ID, ref)).toBe(`merchants/${DEMO_MERCHANT_ID}/orders/${ref}`)
    expect(merchantInboxWildcard(DEMO_MERCHANT_ID)).toBe(`merchants/${DEMO_MERCHANT_ID}/orders/+`)
  })

  it('builds status and job topics', () => {
    expect(orderStatusTopic(ref)).toBe(`orders/${ref}/status`)
    expect(jobTopic(ref)).toBe(`jobs/${ref}`)
    expect(jobsWildcard()).toBe('jobs/+')
  })

  it('extracts the ref back out of queue topics', () => {
    expect(refFromTopic(merchantOrderTopic(DEMO_MERCHANT_ID, ref))).toBe(ref)
    expect(refFromTopic(jobTopic(ref))).toBe(ref)
    expect(refFromTopic('orders/SPT-1234/status')).toBeNull() // last segment is 'status', not a ref
    expect(refFromTopic('jobs/not-a-ref')).toBeNull()
  })

  it('has distinct demo identities for merchant and driver', () => {
    expect(DEMO_MERCHANT_ID).toBe('amanzi-restaurant')
    expect(DEMO_DRIVER_ID).toBe('tatenda-moyo')
  })
})

describe('status adapters (shipped app glue)', () => {
  it('maps canonical status to the customer 4-stage timeline', () => {
    expect(statusToStage('placed')).toBe(0)
    expect(statusToStage('accepted')).toBe(0)
    expect(statusToStage('preparing')).toBe(1)
    expect(statusToStage('ready')).toBe(1)
    expect(statusToStage('picked_up')).toBe(2)
    expect(statusToStage('en_route')).toBe(2)
    expect(statusToStage('delivered')).toBe(3)
  })

  it('the timeline never moves backwards along the happy path', () => {
    const path: OrderStatus[] = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'en_route', 'delivered']
    const stages = path.map(statusToStage)
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i]).toBeGreaterThanOrEqual(stages[i - 1])
    }
  })

  it('maps canonical status to the merchant vocabulary', () => {
    expect(canonicalToMerchant('placed')).toBe('new')
    expect(canonicalToMerchant('preparing')).toBe('preparing')
    expect(canonicalToMerchant('ready')).toBe('ready')
    expect(canonicalToMerchant('picked_up')).toBe('done')
    expect(canonicalToMerchant('en_route')).toBe('done')
    expect(canonicalToMerchant('delivered')).toBe('done')
    expect(canonicalToMerchant('declined')).toBe('declined')
    expect(canonicalToMerchant('cancelled')).toBe('declined')
  })

  it('merchant actions round-trip back to sensible canonical statuses', () => {
    const merchantStates: MerchantOrderStatus[] = ['new', 'preparing', 'ready', 'done', 'declined']
    for (const m of merchantStates) {
      const canonical = merchantToCanonical(m)
      // round-tripping a merchant state through canonical returns the same merchant state
      expect(canonicalToMerchant(canonical)).toBe(m)
    }
  })
})
