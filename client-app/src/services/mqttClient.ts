import { Client, Message } from 'paho-mqtt'
import { BROKER_WS_HOST, BROKER_WS_PORT } from '../config/tracking'

export type MqttStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline'
export type MessageCallback = (payload: string, topic: string) => void
export type StatusCallback = (s: MqttStatus) => void

const BACKOFF_BASE_MS = 1000
const BACKOFF_CAP_MS = 30000

// Thin wrapper over paho-mqtt: reconnects with jittered exponential backoff
// and replays subscriptions after every reconnect, so callers only subscribe
// once and forget about connection churn.
export class MqttConnection {
  private client: Client
  private subscriptions = new Map<string, Set<MessageCallback>>()
  private statusListeners = new Set<StatusCallback>()
  private status: MqttStatus = 'offline'
  private retryCount = 0
  private retryTimer: ReturnType<typeof setTimeout> | null = null
  private disposed = false

  constructor() {
    const clientId = `rider-${Math.random().toString(36).slice(2, 10)}`
    this.client = new Client(BROKER_WS_HOST, BROKER_WS_PORT, '/', clientId)
    this.client.onMessageArrived = (message: Message) => {
      const cbs = this.subscriptions.get(message.destinationName)
      if (cbs) cbs.forEach(cb => cb(message.payloadString, message.destinationName))
    }
    this.client.onConnectionLost = () => {
      if (this.disposed) return
      this.setStatus('reconnecting')
      this.scheduleReconnect()
    }
  }

  connect() {
    if (this.disposed || this.client.isConnected()) return
    this.setStatus(this.retryCount === 0 ? 'connecting' : 'reconnecting')
    try {
      this.client.connect({
        timeout: 5,
        keepAliveInterval: 30,
        onSuccess: () => {
          if (this.disposed) return
          this.retryCount = 0
          this.setStatus('connected')
          // Replay every recorded subscription after (re)connect.
          for (const topic of this.subscriptions.keys()) {
            this.client.subscribe(topic, { qos: 1 })
          }
        },
        onFailure: () => {
          if (this.disposed) return
          this.setStatus('reconnecting')
          this.scheduleReconnect()
        },
      })
    } catch {
      this.setStatus('reconnecting')
      this.scheduleReconnect()
    }
  }

  subscribe(topic: string, cb: MessageCallback) {
    let cbs = this.subscriptions.get(topic)
    if (!cbs) {
      cbs = new Set()
      this.subscriptions.set(topic, cbs)
      if (this.client.isConnected()) this.client.subscribe(topic, { qos: 1 })
    }
    cbs.add(cb)
  }

  unsubscribe(topic: string) {
    if (!this.subscriptions.has(topic)) return
    this.subscriptions.delete(topic)
    if (this.client.isConnected()) {
      try { this.client.unsubscribe(topic) } catch {}
    }
  }

  onStatus(cb: StatusCallback): () => void {
    this.statusListeners.add(cb)
    cb(this.status)
    return () => { this.statusListeners.delete(cb) }
  }

  disconnect() {
    this.disposed = true
    if (this.retryTimer) clearTimeout(this.retryTimer)
    this.retryTimer = null
    this.subscriptions.clear()
    try {
      if (this.client.isConnected()) this.client.disconnect()
    } catch {}
    this.setStatus('offline')
  }

  private scheduleReconnect() {
    if (this.disposed || this.retryTimer) return
    const backoff = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** this.retryCount)
    const delay = backoff / 2 + Math.random() * (backoff / 2)
    this.retryCount += 1
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      this.connect()
    }, delay)
  }

  private setStatus(s: MqttStatus) {
    if (this.status === s) return
    this.status = s
    this.statusListeners.forEach(cb => cb(s))
  }
}
