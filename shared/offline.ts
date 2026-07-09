// @spotly/shared — offline resilience.
//
// Two primitives for flaky-connectivity survival, both storage-agnostic so they
// run under AsyncStorage in the apps and MemoryStorage in tests:
//
//   Cache        — TTL'd read-through cache for server state (menus, listings,
//                  order history) so a cold start on no signal still shows data.
//   OfflineQueue — durably queues user actions (e.g. "mark ready", "accept job")
//                  and flushes them in order when connectivity returns.
//
// In an app:
//   import AsyncStorage from '@react-native-async-storage/async-storage'
//   const cache = new Cache(AsyncStorage, { namespace: 'menus', ttlMs: 3.6e6 })

export interface KVStorage {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

/** In-memory KVStorage — for tests and SSR; the apps pass AsyncStorage instead. */
export class MemoryStorage implements KVStorage {
  private m = new Map<string, string>()
  async getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null }
  async setItem(k: string, v: string) { this.m.set(k, v) }
  async removeItem(k: string) { this.m.delete(k) }
  get size() { return this.m.size }
}

type Now = () => number

interface CacheOpts {
  namespace?: string
  ttlMs?: number      // 0 / undefined = no expiry
  now?: Now           // injectable clock for tests
}

interface Entry<T> { v: T; exp: number } // exp=0 means never expires

export class Cache {
  private storage: KVStorage
  private ns: string
  private ttlMs: number
  private now: Now

  constructor(storage: KVStorage, opts: CacheOpts = {}) {
    this.storage = storage
    this.ns = opts.namespace ?? 'cache'
    this.ttlMs = opts.ttlMs ?? 0
    this.now = opts.now ?? Date.now
  }

  private k(key: string) { return `spotly:${this.ns}:${key}` }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    const ttl = ttlMs ?? this.ttlMs
    const entry: Entry<T> = { v: value, exp: ttl ? this.now() + ttl : 0 }
    await this.storage.setItem(this.k(key), JSON.stringify(entry))
  }

  /** Returns the cached value, or null if missing or expired (expired is purged). */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.storage.getItem(this.k(key))
    if (!raw) return null
    try {
      const entry = JSON.parse(raw) as Entry<T>
      if (entry.exp && this.now() > entry.exp) {
        await this.storage.removeItem(this.k(key))
        return null
      }
      return entry.v
    } catch {
      return null
    }
  }

  /**
   * Read-through: return fresh cache if present, else call `fetcher`, cache the
   * result, and return it. On fetch failure, fall back to any stale value so the
   * UI degrades gracefully offline (returns null only if nothing is cached).
   */
  async wrap<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T | null> {
    // Read raw once so we can still serve the value as *stale* if a refetch fails —
    // note we must not purge here (get() would), or the offline fallback is lost.
    const raw = await this.storage.getItem(this.k(key))
    let stale: T | null = null
    if (raw) {
      try {
        const entry = JSON.parse(raw) as Entry<T>
        stale = entry.v
        if (!entry.exp || this.now() <= entry.exp) return entry.v   // fresh hit
      } catch { /* fall through to refetch */ }
    }
    try {
      const fresh = await fetcher()
      await this.set(key, fresh, ttlMs)
      return fresh
    } catch {
      // Network down: serve stale-past-TTL data rather than nothing.
      return stale
    }
  }

  async remove(key: string): Promise<void> { await this.storage.removeItem(this.k(key)) }
}

// ── Offline action queue ────────────────────────────────────────────────────────

export interface QueuedAction {
  id: string
  type: string
  payload: unknown
  createdAt: number
  attempts: number
}

interface QueueOpts {
  namespace?: string
  maxAttempts?: number
  now?: Now
  genId?: () => string
}

/**
 * Durable FIFO queue for actions taken while offline. `flush(handler)` runs each
 * action through `handler`; a handler that throws leaves the action queued
 * (incrementing attempts) and stops the flush so ordering is preserved. Actions
 * exceeding maxAttempts are dropped and returned as `dead`.
 */
export class OfflineQueue {
  private storage: KVStorage
  private key: string
  private maxAttempts: number
  private now: Now
  private genId: () => string
  private seq = 0

  constructor(storage: KVStorage, opts: QueueOpts = {}) {
    this.storage = storage
    this.key = `spotly:queue:${opts.namespace ?? 'default'}`
    this.maxAttempts = opts.maxAttempts ?? 5
    this.now = opts.now ?? Date.now
    this.genId = opts.genId ?? (() => `${this.now()}-${++this.seq}`)
  }

  private async read(): Promise<QueuedAction[]> {
    const raw = await this.storage.getItem(this.key)
    if (!raw) return []
    try { return JSON.parse(raw) as QueuedAction[] } catch { return [] }
  }
  private async write(items: QueuedAction[]): Promise<void> {
    await this.storage.setItem(this.key, JSON.stringify(items))
  }

  async enqueue(type: string, payload: unknown): Promise<QueuedAction> {
    const items = await this.read()
    const action: QueuedAction = { id: this.genId(), type, payload, createdAt: this.now(), attempts: 0 }
    items.push(action)
    await this.write(items)
    return action
  }

  async size(): Promise<number> { return (await this.read()).length }
  async peek(): Promise<QueuedAction[]> { return this.read() }

  /**
   * Flush pending actions in order. Returns counts of what happened.
   * Stops at the first still-failing action (keeps FIFO ordering intact).
   */
  async flush(handler: (a: QueuedAction) => Promise<void>): Promise<{ sent: number; dead: QueuedAction[]; remaining: number }> {
    let items = await this.read()
    let sent = 0
    const dead: QueuedAction[] = []

    while (items.length) {
      const action = items[0]
      try {
        await handler(action)
        items.shift()
        sent++
      } catch {
        action.attempts++
        if (action.attempts >= this.maxAttempts) {
          dead.push(action)
          items.shift()      // drop poison action, keep draining
          await this.write(items)
          continue
        }
        await this.write(items) // persist attempt bump, stop to preserve order
        break
      }
    }
    await this.write(items)
    return { sent, dead, remaining: items.length }
  }

  async clear(): Promise<void> { await this.storage.removeItem(this.key) }
}
