import { useEffect, useRef, useState } from 'react'
import { MqttConnection } from '../services/mqttClient'
import { BRIDGE_URL, DEMO_TOPIC, tripTopic } from '../config/tracking'

export type DriverFix = {
  lat: number
  lng: number
  heading: number
  speed: number
  ts: number
}

export type TrackingStatus = 'connecting' | 'live' | 'reconnecting' | 'offline'

const MAX_PATH_POINTS = 60
const REST_TIMEOUT_MS = 3000

// Subscribes to the trip's live-location topic (plus the dev demo mirror)
// and seeds from the REST bridge so the map has a position before MQTT
// connects. Dedupes by ts so double-delivery doesn't duplicate path points.
export default function useDriverLocation(tripRef: string) {
  const [fix, setFix] = useState<DriverFix | null>(null)
  const [path, setPath] = useState<DriverFix[]>([])
  const [status, setStatus] = useState<TrackingStatus>('connecting')
  const lastTsRef = useRef<number | null>(null)

  useEffect(() => {
    let mounted = true

    const applyFix = (next: DriverFix) => {
      if (!mounted) return
      if (lastTsRef.current !== null && next.ts <= lastTsRef.current) return
      lastTsRef.current = next.ts
      setFix(next)
      setPath(prev => [...prev, next].slice(-MAX_PATH_POINTS))
    }

    const onMessage = (payload: string) => {
      try {
        const msg = JSON.parse(payload)
        if (typeof msg?.lat !== 'number' || typeof msg?.lng !== 'number') return
        applyFix({
          lat: msg.lat,
          lng: msg.lng,
          heading: typeof msg.heading === 'number' ? msg.heading : 0,
          speed: typeof msg.speed === 'number' ? msg.speed : 0,
          ts: typeof msg.ts === 'number' ? msg.ts : Date.now(),
        })
      } catch {}
    }

    // Seed from the REST bridge so the map has a position immediately.
    const seed = async () => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REST_TIMEOUT_MS)
      try {
        const res = await fetch(`${BRIDGE_URL}/trips/${tripRef}/last-location`, { signal: controller.signal })
        if (!res.ok) return
        const data = await res.json()
        const loc = data?.location
        if (typeof loc?.lat !== 'number' || typeof loc?.lng !== 'number') return
        applyFix({
          lat: loc.lat,
          lng: loc.lng,
          heading: typeof loc.heading === 'number' ? loc.heading : 0,
          speed: typeof loc.speed === 'number' ? loc.speed : 0,
          ts: typeof loc.ts === 'number' ? loc.ts : Date.now(),
        })
      } catch {} finally {
        clearTimeout(timer)
      }
    }
    seed()

    const conn = new MqttConnection()
    const offStatus = conn.onStatus(s => {
      if (mounted) setStatus(s === 'connected' ? 'live' : s)
    })
    conn.subscribe(tripTopic(tripRef), onMessage)
    conn.subscribe(DEMO_TOPIC, onMessage)
    conn.connect()

    return () => {
      mounted = false
      offStatus()
      conn.unsubscribe(tripTopic(tripRef))
      conn.unsubscribe(DEMO_TOPIC)
      conn.disconnect()
    }
  }, [tripRef])

  return { fix, path, status }
}
