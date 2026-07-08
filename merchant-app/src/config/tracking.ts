// Live-tracking contract — must match the backend bridge, driver, and customer
// apps. The merchant subscribes (read-only) to watch the assigned rider
// approach the store to collect.
// LAN IP of the dev machine so a physical phone can reach the broker/bridge.
// (Local dev pointer — revert to 'localhost' for the simulator.)
export const BROKER_WS_HOST = '192.168.0.193'
export const BROKER_WS_PORT = 9001
export const BRIDGE_URL = 'http://192.168.0.193:4000'

export const tripTopic = (ref: string) => `trips/${ref}/location`
export const DEMO_TOPIC = 'trips/demo/location'

// The store's own location (pickup point) — Amanzi Restaurant, Highlands.
export const STORE_COORD = { lat: -17.7900, lng: 31.1000 }
export const FALLBACK_CENTER = { lat: -17.7840, lng: 31.0534 }
