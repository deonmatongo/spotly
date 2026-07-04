// Shared live-tracking contract (must match backend + rider app)
export const BROKER_WS_HOST = 'localhost'
export const BROKER_WS_PORT = 9001
export const BRIDGE_URL = 'http://localhost:4000'
export const DRIVER_ID = 'tatenda-moyo'

export const ACTIVE_INTERVAL_MS = 4000
export const ACTIVE_DISTANCE_M = 5

// Demo/dev: when the device has no usable GPS (iOS Simulator, Expo Go without a
// set location), drive a simulated position along the trip route so the map
// visibly moves and the customer sees live tracking end-to-end. Set false to
// rely solely on real device GPS in a production build.
export const SIMULATE_GPS = true
export const SIM_STEP_MS = 2500       // one simulated fix every 2.5s (> bridge 1/s limit)
export const SIM_STEPS_PER_LEG = 8    // interpolation points between waypoints

export const driverTopic = (driverId: string) => `drivers/${driverId}/location`
