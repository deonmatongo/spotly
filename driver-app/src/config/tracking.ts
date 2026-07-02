// Shared live-tracking contract (must match backend + rider app)
export const BROKER_WS_HOST = 'localhost'
export const BROKER_WS_PORT = 9001
export const BRIDGE_URL = 'http://localhost:4000'
export const DRIVER_ID = 'tatenda-moyo'

export const ACTIVE_INTERVAL_MS = 4000
export const ACTIVE_DISTANCE_M = 5

export const driverTopic = (driverId: string) => `drivers/${driverId}/location`
