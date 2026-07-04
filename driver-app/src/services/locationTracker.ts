import * as Location from 'expo-location'
import Constants from 'expo-constants'
import { MqttConnection, MqttStatus } from './mqttClient'
import { LOCATION_TASK_NAME, setLocationTaskHandler } from './locationTask'
import {
  ACTIVE_DISTANCE_M, ACTIVE_INTERVAL_MS, BRIDGE_URL, DRIVER_ID, driverTopic,
  SIMULATE_GPS, SIM_STEP_MS, SIM_STEPS_PER_LEG,
} from '../config/tracking'

export interface LocalFix {
  lat: number
  lng: number
  heading: number
  speed: number
  ts: number
}

interface Coord { lat: number; lng: number }
export interface RouteHint { pickup: Coord; dropoff: Coord; stops?: Coord[] }

// Build a dense list of points along pickup → stops → dropoff so the simulated
// driver glides rather than teleporting between waypoints.
function densifyRoute(waypoints: Coord[], perLeg: number): Coord[] {
  const pts: Coord[] = []
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1]
    for (let s = 0; s < perLeg; s++) {
      const t = s / perLeg
      pts.push({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t })
    }
  }
  pts.push(waypoints[waypoints.length - 1])
  return pts
}

function bearing(a: Coord, b: Coord): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const y = Math.sin(toRad(b.lng - a.lng)) * Math.cos(toRad(b.lat))
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) -
    Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(toRad(b.lng - a.lng))
  return (Math.atan2(y, x) * 180) / Math.PI
}

class LocationTracker {
  private mqtt = new MqttConnection()
  private watchSub: Location.LocationSubscription | null = null
  private tripRef: string | null = null
  private fixListeners = new Set<(fix: LocalFix) => void>()
  private lastFix: LocalFix | null = null
  private simTimer: ReturnType<typeof setInterval> | null = null

  onStatus(cb: (s: MqttStatus) => void): () => void {
    return this.mqtt.onStatus(cb)
  }

  // Local mirror of what's being broadcast — drives the driver's own map so
  // it always shows exactly what the customer sees.
  onFix(cb: (fix: LocalFix) => void): () => void {
    this.fixListeners.add(cb)
    if (this.lastFix) cb(this.lastFix)
    return () => this.fixListeners.delete(cb)
  }

  async start(tripRef: string, route?: RouteHint) {
    try {
      this.tripRef = tripRef

      // Fire-and-forget trip assignment — the backend may not be running.
      try {
        fetch(`${BRIDGE_URL}/trips/${encodeURIComponent(tripRef)}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ driverId: DRIVER_ID }),
        }).catch(() => {})
      } catch (e) {
        // ignore — assignment is best-effort in dev
      }

      this.mqtt.connect()

      // Demo path: no reliable GPS on the simulator, so glide along the route.
      if (SIMULATE_GPS && route) {
        this.startSimulation(route)
        return
      }

      const fg = await Location.requestForegroundPermissionsAsync()
      if (fg.status !== 'granted') {
        console.warn('[tracker] foreground location permission denied — not tracking')
        return
      }

      setLocationTaskHandler(locations => locations.forEach(fix => this.publishFix(fix)))

      // Background updates need a dev/standalone build — Expo Go can't run
      // the foreground service / always-on permission, so degrade gracefully.
      if (Constants.appOwnership !== 'expo') {
        try {
          const bg = await Location.requestBackgroundPermissionsAsync()
          if (bg.status === 'granted') {
            await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
              accuracy: Location.Accuracy.High,
              timeInterval: ACTIVE_INTERVAL_MS,
              distanceInterval: ACTIVE_DISTANCE_M,
              showsBackgroundLocationIndicator: true,
              pausesUpdatesAutomatically: false,
              activityType: Location.ActivityType.AutomotiveNavigation,
              foregroundService: {
                notificationTitle: 'Spotly Driver — trip in progress',
                notificationBody: 'Sharing your live location with the customer',
                notificationColor: '#16A34A',
              },
            })
            return
          }
        } catch (e) {
          console.warn('[tracker] background updates unavailable, falling back to foreground watch', e)
        }
      }

      // Expo Go / no background permission: foreground-only watch.
      this.watchSub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: ACTIVE_INTERVAL_MS,
          distanceInterval: ACTIVE_DISTANCE_M,
        },
        fix => this.publishFix(fix),
      )
    } catch (e) {
      console.warn('[tracker] start failed', e)
    }
  }

  // Glide a simulated position along the trip route, publishing exactly like a
  // real GPS fix so the customer app tracks it live.
  private startSimulation(route: RouteHint) {
    const waypoints: Coord[] = [route.pickup, ...(route.stops ?? []), route.dropoff]
    const pts = densifyRoute(waypoints, SIM_STEPS_PER_LEG)
    let i = 0
    if (this.simTimer) clearInterval(this.simTimer)
    this.simTimer = setInterval(() => {
      if (!this.tripRef) return
      if (i >= pts.length) { if (this.simTimer) clearInterval(this.simTimer); this.simTimer = null; return }
      const p = pts[i]
      const prev = pts[Math.max(0, i - 1)]
      this.emit({ lat: p.lat, lng: p.lng, heading: bearing(prev, p), speed: 8, ts: Date.now() })
      i++
    }, SIM_STEP_MS)
  }

  async stop() {
    try {
      this.tripRef = null
      if (this.simTimer) { clearInterval(this.simTimer); this.simTimer = null }
      setLocationTaskHandler(null)
      if (this.watchSub) {
        this.watchSub.remove()
        this.watchSub = null
      }
      try {
        const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME)
        if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME)
      } catch (e) {
        // task never registered / not running — nothing to stop
      }
      this.mqtt.disconnect()
    } catch (e) {
      console.warn('[tracker] stop failed', e)
    }
  }

  private publishFix(fix: Location.LocationObject) {
    const { coords } = fix
    this.emit({
      lat: coords.latitude,
      lng: coords.longitude,
      heading: coords.heading ?? 0,
      speed: coords.speed ?? 0,
      ts: fix.timestamp ?? Date.now(),
    }, coords.accuracy ?? 0)
  }

  // Single broadcast path: mirror to local listeners (the driver's own map) and
  // publish to the bus (drivers/{id}/location → bridge → trips/{ref}/location).
  private emit(local: LocalFix, accuracy = 0) {
    const tripRef = this.tripRef
    if (!tripRef) return
    this.lastFix = local
    this.fixListeners.forEach(cb => cb(local))
    this.mqtt.publish(driverTopic(DRIVER_ID), { ...local, accuracy, tripRef }, 1)
  }
}

export const locationTracker = new LocationTracker()
