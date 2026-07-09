import { describe, it, expect } from 'vitest'
import { Cache, OfflineQueue, MemoryStorage } from '../index'

describe('Cache', () => {
  it('stores and retrieves values', async () => {
    const c = new Cache(new MemoryStorage(), { namespace: 'menus' })
    await c.set('m1', { items: [1, 2, 3] })
    expect(await c.get<{ items: number[] }>('m1')).toEqual({ items: [1, 2, 3] })
  })

  it('returns null for a missing key', async () => {
    const c = new Cache(new MemoryStorage())
    expect(await c.get('nope')).toBeNull()
  })

  it('expires entries past TTL (with an injected clock)', async () => {
    let t = 1000
    const c = new Cache(new MemoryStorage(), { ttlMs: 500, now: () => t })
    await c.set('k', 'v')
    t = 1400
    expect(await c.get('k')).toBe('v')     // still fresh
    t = 1600
    expect(await c.get('k')).toBeNull()    // expired + purged
  })

  it('wrap() caches the fetcher result', async () => {
    const c = new Cache(new MemoryStorage())
    let calls = 0
    const fetch = async () => { calls++; return 'fresh' }
    expect(await c.wrap('k', fetch)).toBe('fresh')
    expect(await c.wrap('k', fetch)).toBe('fresh')
    expect(calls).toBe(1)                  // second read served from cache
  })

  it('wrap() serves stale data when the fetcher fails offline', async () => {
    let t = 0
    const c = new Cache(new MemoryStorage(), { ttlMs: 100, now: () => t })
    await c.wrap('k', async () => 'v1')
    t = 500                                 // now expired
    const boom = async () => { throw new Error('offline') }
    expect(await c.wrap('k', boom)).toBe('v1') // graceful degradation
  })

  it('wrap() returns null when nothing is cached and fetch fails', async () => {
    const c = new Cache(new MemoryStorage())
    expect(await c.wrap('k', async () => { throw new Error('offline') })).toBeNull()
  })
})

describe('OfflineQueue', () => {
  const opts = (over = {}) => ({ now: () => 1, genId: (() => { let n = 0; return () => `id${++n}` })(), ...over })

  it('enqueues and reports size', async () => {
    const q = new OfflineQueue(new MemoryStorage(), opts())
    await q.enqueue('order.ready', { ref: 'A' })
    await q.enqueue('order.ready', { ref: 'B' })
    expect(await q.size()).toBe(2)
  })

  it('flushes all actions in FIFO order when the handler succeeds', async () => {
    const q = new OfflineQueue(new MemoryStorage(), opts())
    await q.enqueue('t', { n: 1 })
    await q.enqueue('t', { n: 2 })
    const seen: number[] = []
    const res = await q.flush(async a => { seen.push((a.payload as { n: number }).n) })
    expect(seen).toEqual([1, 2])
    expect(res.sent).toBe(2)
    expect(res.remaining).toBe(0)
  })

  it('stops at a failing action and preserves order', async () => {
    const q = new OfflineQueue(new MemoryStorage(), opts())
    await q.enqueue('t', { n: 1 })
    await q.enqueue('t', { n: 2 })
    let attempt = 0
    const res = await q.flush(async a => {
      if ((a.payload as { n: number }).n === 1 && attempt++ === 0) throw new Error('net')
    })
    expect(res.sent).toBe(0)
    expect(res.remaining).toBe(2)          // nothing lost, order intact
  })

  it('drops a poison action after maxAttempts and keeps draining', async () => {
    const q = new OfflineQueue(new MemoryStorage(), opts({ maxAttempts: 2 }))
    await q.enqueue('bad', {})
    await q.enqueue('good', {})
    // attempt 1 → fails, stops
    await q.flush(async a => { if (a.type === 'bad') throw new Error('x') })
    // attempt 2 → hits maxAttempts, drops 'bad', then processes 'good'
    const res = await q.flush(async a => { if (a.type === 'bad') throw new Error('x') })
    expect(res.dead.map(d => d.type)).toEqual(['bad'])
    expect(res.sent).toBe(1)               // 'good' went through
    expect(await q.size()).toBe(0)
  })
})
