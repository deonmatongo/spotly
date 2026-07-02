import * as TaskManager from 'expo-task-manager'
import type { LocationObject } from 'expo-location'

export const LOCATION_TASK_NAME = 'spotly-driver-location'

type LocationTaskHandler = (locations: LocationObject[]) => void

// The background task fires outside React — locationTracker registers a
// module-level callback here to receive fixes.
let handler: LocationTaskHandler | null = null

export function setLocationTaskHandler(cb: LocationTaskHandler | null) {
  handler = cb
}

// Must be defined at module top level (imported once, for side effects, from App.tsx).
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.warn('[locationTask] background task error', error)
    return
  }
  const locations = (data as { locations?: LocationObject[] } | undefined)?.locations
  if (locations?.length && handler) handler(locations)
})
