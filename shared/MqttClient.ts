// Bidirectional MQTT client over WebSockets (paho-mqtt), shared by all three
// apps. It merges the two one-directional clients that previously lived in the
// customer and driver apps:
//   - publish() with an offline FIFO queue (from the driver's publisher)
//   - subscribe()/unsubscribe() with subscription replay (from the customer's
//     subscriber)
// plus retained publishes and retained-clear, which the order bus needs.
//
// paho resolves from each app's own node_modules, so this file stays
// transport-only and carries no app-specific config.
import { Client, Message } from 'paho-mqtt'
import { getBrokerHost, getBrokerPort } from './config'

export type MqttStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline'
export type MessageCallback = (payload: string, topic: string) => void
type StatusCallback = (s: MqttStatus) => void

// paho persists QoS>0 messages to localStorage, which RN lacks. Provide a
// minimal in-memory shim once, before any Client is constructed.
const g: any = globalThis as any
if (typeof g.localStorage === 'undefined') {
  const store: Record<string, string> = {}
  g.localStorage = {
    setItem: (k: string, v: string) => { store[k] = v },
    getItem: (k: string) => (k in store ? store[k] : null),
    removeItem: (k: string) => { delete store[k] },
    clear: () => { for (const k of Object.keys(store)) delete store[k] },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length },
  }
}

const BACKOFF_START_MS = 1000
const BACKOFF_CAP_MS = 30000
const QUEUE_CAP = 500

interface QueuedMessage {
  topic: string
  payload: string
  qos: number
  retained: boolean
}

export class MqttClient {
  private client: Client | null = null
  private clientId: string
  private status: MqttStatus = 'offline'
  private statusCbs = new Set<StatusCallback>()
  private subscriptions = new Map<string, Set<MessageCallback>>()
  private queue: QueuedMessage[] = []
  private shouldRun = false
  private disposed = false
  private backoff = BACKOFF_START_MS
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(clientPrefix: string) {
    // Random suffix keeps client ids unique so the broker doesn't kick an
    // earlier session with the same id.
    this.clientId = `${clientPrefix}-${Math.random().toString(16).slice(2, 10)}`
  }

  connect() {
    if (this.disposed) return
    this.shouldRun = true
    if (this.client && this.client.isConnected()) return
    this.open()
  }

  disconnect() {
    this.shouldRun = false
    this.disposed = true
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null }
    try { this.client?.disconnect() } catch { /* already down */ }
    this.client = null
    this.setStatus('offline')
  }

  getStatus() { return this.status }

  onStatus(cb: StatusCallback): () => void {
    this.statusCbs.add(cb)
    cb(this.status)
    return () => this.statusCbs.delete(cb)
  }

  subscribe(topic: string, cb: MessageCallback): () => void {
    let set = this.subscriptions.get(topic)
    if (!set) {
      set = new Set()
      this.subscriptions.set(topic, set)
      if (this.client && this.client.isConnected()) {
        try { this.client.subscribe(topic, { qos: 1 }) } catch { /* replays on reconnect */ }
      }
    }
    set.add(cb)
    return () => this.unsubscribeCb(topic, cb)
  }

  private unsubscribeCb(topic: string, cb: MessageCallback) {
    const set = this.subscriptions.get(topic)
    if (!set) return
    set.delete(cb)
    if (set.size === 0) {
      this.subscriptions.delete(topic)
      if (this.client && this.client.isConnected()) {
        try { this.client.unsubscribe(topic) } catch { /* noop */ }
      }
    }
  }

  publish(topic: string, payload: unknown, opts: { qos?: number; retained?: boolean } = {}) {
    const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const msg: QueuedMessage = { topic, payload: body, qos: opts.qos ?? 1, retained: opts.retained ?? false }
    if (this.client && this.client.isConnected()) {
      this.send(msg)
    } else {
      if (this.queue.length >= QUEUE_CAP) this.queue.shift()
      this.queue.push(msg)
      this.connect()
    }
  }

  // Remove a retained message from a topic (empty retained payload). Used to
  // pull an order off the merchant inbox or a claimed job off the queue.
  clearRetained(topic: string) {
    this.publish(topic, '', { qos: 1, retained: true })
  }

  private send(m: QueuedMessage) {
    try {
      const message = new Message(m.payload)
      message.destinationName = m.topic
      message.qos = m.qos
      message.retained = m.retained
      this.client!.send(message)
    } catch {
      if (this.queue.length < QUEUE_CAP) this.queue.push(m)
    }
  }

  private open() {
    this.setStatus(this.backoff === BACKOFF_START_MS ? 'connecting' : 'reconnecting')
    const client = new Client(getBrokerHost(), getBrokerPort(), '/', this.clientId)

    client.onConnectionLost = () => {
      if (!this.shouldRun) return
      this.setStatus('reconnecting')
      this.scheduleReconnect()
    }
    client.onMessageArrived = (message: Message) => {
      const topic = message.destinationName
      const payload = message.payloadString
      // Match against exact topics and single-level (+) wildcards.
      for (const [sub, cbs] of this.subscriptions) {
        if (topicMatches(sub, topic)) {
          for (const cb of cbs) cb(payload, topic)
        }
      }
    }

    try {
      client.connect({
        useSSL: false,
        timeout: 8,
        cleanSession: true,
        keepAliveInterval: 30,
        onSuccess: () => {
          this.client = client
          this.backoff = BACKOFF_START_MS
          this.setStatus('connected')
          // Replay every subscription so callers subscribe once, ever.
          for (const topic of this.subscriptions.keys()) {
            try { client.subscribe(topic, { qos: 1 }) } catch { /* noop */ }
          }
          this.flushQueue()
        },
        onFailure: () => {
          if (!this.shouldRun) return
          this.setStatus('reconnecting')
          this.scheduleReconnect()
        },
      })
    } catch {
      this.scheduleReconnect()
    }
  }

  private flushQueue() {
    if (!this.client || !this.client.isConnected()) return
    const pending = this.queue
    this.queue = []
    for (const m of pending) this.send(m)
  }

  private scheduleReconnect() {
    if (!this.shouldRun || this.disposed) return
    if (this.reconnectTimer) return
    const jitter = Math.floor(Math.random() * 400)
    const delay = Math.min(this.backoff, BACKOFF_CAP_MS) + jitter
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.backoff = Math.min(this.backoff * 2, BACKOFF_CAP_MS)
      this.open()
    }, delay)
  }

  private setStatus(s: MqttStatus) {
    if (this.status === s) return
    this.status = s
    for (const cb of this.statusCbs) cb(s)
  }
}

// True if a subscription filter (which may contain + / # wildcards) matches a
// concrete topic. Enough MQTT semantics for our contract.
function topicMatches(filter: string, topic: string): boolean {
  if (filter === topic) return true
  const f = filter.split('/')
  const t = topic.split('/')
  for (let i = 0; i < f.length; i++) {
    if (f[i] === '#') return true
    if (f[i] === '+') { if (t[i] === undefined) return false; continue }
    if (f[i] !== t[i]) return false
  }
  return f.length === t.length
}
