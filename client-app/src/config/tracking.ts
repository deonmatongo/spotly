// Dev endpoints for the live tracking prototype. These match the shared
// contract with the backend bridge and the driver app — change together.
export const BROKER_WS_HOST = 'localhost'
export const BROKER_WS_PORT = 9001
export const BRIDGE_URL = 'http://localhost:4000'

export const tripTopic = (ref: string) => `trips/${ref}/location`

// In dev the bridge mirrors every driver fix here so the demo works even
// when trip refs don't line up between the two apps.
export const DEMO_TOPIC = 'trips/demo/location'

// Harare demo coordinates: map fallback center and the drop-off used for
// ETA in the prototype.
export const FALLBACK_CENTER = { lat: -17.7840, lng: 31.0534 }
export const DEST_COORD = { lat: -17.7626, lng: 31.1076 }
// Merchant/pickup point for the prototype (Amanzi Restaurant, Highlands)
export const PICKUP_COORD = { lat: -17.7900, lng: 31.1000 }
