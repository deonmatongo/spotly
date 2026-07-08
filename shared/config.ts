// Shared connection config. Mirrors each app's src/config/tracking.ts values
// but lives in one place now so the order bus and the location pipeline agree.
//
// Host defaults to localhost for the simulator. On a physical device call
// configureBroker({ host: '192.168.x.x' }) at app startup with the dev
// machine's LAN IP (see LOCATION_TRACKING.md).

let brokerHost = 'localhost'
let brokerPort = 9001          // MQTT over WebSocket (paho in RN)
let bridgeUrl = 'http://localhost:4000'
let apiUrl    = 'http://localhost:4001'  // REST persistence API

export function configureBroker(opts: { host?: string; port?: number; bridgeUrl?: string; apiUrl?: string }) {
  if (opts.host) {
    brokerHost = opts.host
    bridgeUrl  = `http://${opts.host}:4000`
    apiUrl     = `http://${opts.host}:4001`
  }
  if (opts.port)      brokerPort = opts.port
  if (opts.bridgeUrl) bridgeUrl  = opts.bridgeUrl
  if (opts.apiUrl)    apiUrl     = opts.apiUrl
}

export const getBrokerHost = () => brokerHost
export const getBrokerPort = () => brokerPort
export const getBridgeUrl  = () => bridgeUrl
export const getApiUrl     = () => apiUrl

// The single demo merchant. The customer app's prototype pickup point is
// already hard-wired to Amanzi Restaurant, so the whole demo flows through it.
export const DEMO_MERCHANT_ID = 'amanzi-restaurant'
export const DEMO_MERCHANT_NAME = 'Amanzi Restaurant'

// The demo driver — matches driver-app's DRIVER_ID and the broker ACL user.
export const DEMO_DRIVER_ID = 'tatenda-moyo'
export const DEMO_DRIVER_NAME = 'Tatenda Moyo'

// Harare demo coordinates (shared with the tracking prototype).
export const MERCHANT_COORD = { lat: -17.7900, lng: 31.1000 }  // Amanzi, Highlands
export const FALLBACK_DROPOFF = { lat: -17.7626, lng: 31.1076 }

// A short SPT-#### order ref. Generated customer-side at checkout and used as
// both the order key and the MQTT trip ref for the whole lifecycle.
export function newOrderRef(): string {
  // Math.random is fine here — refs only need to be unique within a demo run.
  return `SPT-${Math.floor(1000 + Math.random() * 9000)}`
}
