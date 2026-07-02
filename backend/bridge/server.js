// Spotly tracking bridge.
//
// Subscribes to raw driver topics (drivers/{driverId}/location), validates and
// rate-limits each fix, then re-publishes it scoped to the assigned trip
// (trips/{tripRef}/location, retained) so rider apps never subscribe to
// driver-level topics. Also exposes a REST fallback for last-known position.

const express = require('express')
const cors = require('cors')
const mqtt = require('mqtt')

const PORT = Number(process.env.PORT || 4000)
const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883'
const DEV_MIRROR = process.env.DEV_MIRROR === '1'
const MIN_INTERVAL_MS = 1000 // rate limit: max 1 accepted fix per driver per second
const MAX_PAYLOAD_BYTES = 2048

// tripRef -> driverId and the reverse; in production this would be fed by the
// dispatch service. Here it's populated via POST /trips/:ref/assign.
const tripByDriver = new Map()
const driverByTrip = new Map()

// tripRef -> last accepted location (REST fallback source)
const lastLocation = new Map()

// driverId -> ts of last accepted fix (rate limiting)
const lastAccepted = new Map()

const stats = { accepted: 0, dropped: 0, invalid: 0 }

function validateFix(raw) {
  if (!raw || typeof raw !== 'object') return null
  const { lat, lng, heading, speed, accuracy, ts } = raw
  if (typeof lat !== 'number' || !isFinite(lat) || lat < -90 || lat > 90) return null
  if (typeof lng !== 'number' || !isFinite(lng) || lng < -180 || lng > 180) return null
  const num = v => (typeof v === 'number' && isFinite(v) ? v : 0)
  const t = typeof ts === 'number' && isFinite(ts) ? ts : Date.now()
  return { lat, lng, heading: num(heading), speed: num(speed), accuracy: num(accuracy), ts: t }
}

function startBridge(client) {
  client.on('connect', () => {
    console.log(`[bridge] connected to broker ${MQTT_URL}`)
    client.subscribe('drivers/+/location', { qos: 1 })
  })

  client.on('message', (topic, buf) => {
    if (buf.length > MAX_PAYLOAD_BYTES) { stats.invalid++; return }
    const m = topic.match(/^drivers\/([^/]+)\/location$/)
    if (!m) return
    const driverId = m[1]

    let raw
    try { raw = JSON.parse(buf.toString()) } catch { stats.invalid++; return }
    const fix = validateFix(raw)
    if (!fix) { stats.invalid++; return }

    // Rate limit per driver
    const prev = lastAccepted.get(driverId) ?? 0
    const now = Date.now()
    if (now - prev < MIN_INTERVAL_MS) { stats.dropped++; return }
    lastAccepted.set(driverId, now)

    // Scope to the assigned trip; in dev, fall back to the tripRef the driver
    // claims in the payload so the demo works without a dispatch service.
    const tripRef = tripByDriver.get(driverId) ?? (typeof raw.tripRef === 'string' ? raw.tripRef : null)
    if (!tripRef) { stats.dropped++; return }

    stats.accepted++
    lastLocation.set(tripRef, fix)
    const out = JSON.stringify({ ...fix, tripRef })
    // Retained: a rider subscribing mid-trip immediately receives the last fix.
    client.publish(`trips/${tripRef}/location`, out, { qos: 1, retain: true })
    if (DEV_MIRROR) client.publish('trips/demo/location', out, { qos: 1, retain: true })
  })

  client.on('error', err => console.error('[bridge] mqtt error:', err.message))
}

function startRest() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '4kb' }))

  app.get('/health', (_req, res) => res.json({ ok: true, ...stats, trips: lastLocation.size }))

  app.get('/trips/:ref/last-location', (req, res) => {
    const loc = lastLocation.get(req.params.ref)
    if (!loc) return res.status(404).json({ error: 'no location yet for this trip' })
    res.json({ location: loc })
  })

  app.post('/trips/:ref/assign', (req, res) => {
    const driverId = req.body?.driverId
    if (typeof driverId !== 'string' || !driverId) return res.status(400).json({ error: 'driverId required' })
    const ref = req.params.ref
    tripByDriver.set(driverId, ref)
    driverByTrip.set(ref, driverId)
    console.log(`[bridge] assigned trip ${ref} -> driver ${driverId}`)
    res.json({ ok: true, tripRef: ref, driverId })
  })

  app.listen(PORT, () => console.log(`[bridge] REST listening on :${PORT}`))
}

function main() {
  const client = mqtt.connect(MQTT_URL, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    reconnectPeriod: 2000,
  })
  startBridge(client)
  startRest()
}

if (require.main === module) main()
module.exports = { startBridge, startRest, validateFix }
