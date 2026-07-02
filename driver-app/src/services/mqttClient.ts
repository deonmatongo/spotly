import { Client, Message } from 'paho-mqtt'
import { BROKER_WS_HOST, BROKER_WS_PORT, DRIVER_ID } from '../config/tracking'

export type MqttStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline'

// paho-mqtt persists in-flight QoS>0 messages via window.localStorage, which
// doesn't exist in React Native — provide a tiny in-memory shim before any
// Client is constructed.
const g = globalThis as any
if (typeof g.localStorage === 'undefined') {
  const store: Record<string, string> = {}
  g.localStorage = {
    setItem: (key: string, value: string) => { store[key] = String(value) },
    getItem: (key: string) => (key in store ? store[key] : null),
    removeItem: (key: string) => { delete store[key] },
    clear: () => { Object.keys(store).forEach(k => delete store[k]) },
  }
}

const QUEUE_CAP = 500
const BACKOFF_START_MS = 1000
const BACKOFF_CAP_MS = 30000

interface QueuedMessage {
  topic: string
  body: string
  qos: number
}

export class MqttConnection {
  private client: Client | null = null
  private status: MqttStatus = 'offline'
  private listeners = new Set<(s: MqttStatus) => void>()
  private queue: QueuedMessage[] = []
  private backoffMs = BACKOFF_START_MS
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private shouldRun = false

  connect() {
    if (this.shouldRun && (this.status === 'connected' || this.status === 'connecting')) return
    this.shouldRun = true
    this.backoffMs = BACKOFF_START_MS
    this.open('connecting')
  }

  disconnect() {
    this.shouldRun = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    const client = this.client
    this.client = null
    if (client) {
      try {
        if (client.isConnected()) client.disconnect()
      } catch (e) {
        // already disconnected — nothing to do
      }
    }
    this.setStatus('offline')
  }

  publish(topic: string, payload: object, qos = 1) {
    const body = JSON.stringify(payload)
    const client = this.client
    if (client && client.isConnected()) {
      try {
        this.send(client, { topic, body, qos })
        return
      } catch (e) {
        console.warn('[mqtt] publish failed, queueing', e)
      }
    }
    this.enqueue({ topic, body, qos })
  }

  onStatus(cb: (s: MqttStatus) => void): () => void {
    this.listeners.add(cb)
    cb(this.status)
    return () => { this.listeners.delete(cb) }
  }

  getStatus(): MqttStatus {
    return this.status
  }

  private open(phase: 'connecting' | 'reconnecting') {
    if (!this.shouldRun) return
    this.setStatus(phase)
    try {
      const clientId = `driver-${DRIVER_ID}-${Math.random().toString(36).slice(2, 10)}`
      const client = new Client(BROKER_WS_HOST, BROKER_WS_PORT, '/', clientId)
      client.onConnectionLost = () => {
        if (!this.shouldRun) return
        this.scheduleReconnect()
      }
      client.onMessageArrived = () => {}
      this.client = client
      client.connect({
        timeout: 8,
        keepAliveInterval: 30,
        cleanSession: true,
        useSSL: false,
        onSuccess: () => {
          if (!this.shouldRun) return
          this.backoffMs = BACKOFF_START_MS
          this.setStatus('connected')
          this.flushQueue()
        },
        onFailure: () => {
          if (!this.shouldRun) return
          this.scheduleReconnect()
        },
      })
    } catch (e) {
      console.warn('[mqtt] connect error', e)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (!this.shouldRun || this.reconnectTimer) return
    this.setStatus('reconnecting')
    const jitter = Math.random() * 300
    const delay = Math.min(this.backoffMs, BACKOFF_CAP_MS) + jitter
    this.backoffMs = Math.min(this.backoffMs * 2, BACKOFF_CAP_MS)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.open('reconnecting')
    }, delay)
  }

  // Flush queued fixes in order before anything else, so the rider sees a
  // smooth path after a dead zone instead of a jump.
  private flushQueue() {
    const client = this.client
    if (!client) return
    while (this.queue.length > 0) {
      if (!client.isConnected()) return
      const next = this.queue[0]
      try {
        this.send(client, next)
        this.queue.shift()
      } catch (e) {
        console.warn('[mqtt] flush interrupted, will retry on reconnect', e)
        return
      }
    }
  }

  private send(client: Client, msg: QueuedMessage) {
    const message = new Message(msg.body)
    message.destinationName = msg.topic
    message.qos = msg.qos
    message.retained = false
    client.send(message)
  }

  private enqueue(msg: QueuedMessage) {
    this.queue.push(msg)
    while (this.queue.length > QUEUE_CAP) this.queue.shift()
  }

  private setStatus(s: MqttStatus) {
    if (this.status === s) return
    this.status = s
    this.listeners.forEach(cb => {
      try { cb(s) } catch (e) { console.warn('[mqtt] status listener error', e) }
    })
  }
}
