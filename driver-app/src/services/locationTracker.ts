import * as Location from 'expo-location'
import Constants from 'expo-constants'
import { MqttConnection, MqttStatus } from './mqttClient'
import { LOCATION_TASK_NAME, setLocationTaskHandler } from './locationTask'
import { ACTIVE_DISTANCE_M, ACTIVE_INTERVAL_MS, BRIDGE_URL, DRIVER_ID, driverTopic } from '../config/tracking'

export interface LocalFix {
  lat: number
  lng: number
  heading: number
  speed: number
  ts: number
}

class LocationTracker {
  private mqtt = new MqttConnection()
  private watchSub: Location.LocationSubscription | null = null
  private tripRef: string | null = null
  private fixListeners = new Set<(fix: LocalFix) => void>()
  private lastFix: LocalFix | null = null

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

  async start(tripRef: string) {
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

  async stop() {
    try {
      this.tripRef = null
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
    const tripRef = this.tripRef
    if (!tripRef) return
    const { coords } = fix
    const local: LocalFix = {
      lat: coords.latitude,
      lng: coords.longitude,
      heading: coords.heading ?? 0,
      speed: coords.speed ?? 0,
      ts: fix.timestamp ?? Date.now(),
    }
    this.lastFix = local
    this.fixListeners.forEach(cb => cb(local))
    this.mqtt.publish(driverTopic(DRIVER_ID), {
      ...local,
      accuracy: coords.accuracy ?? 0,
      tripRef,
    }, 1)
  }
}

export const locationTracker = new LocationTracker()
