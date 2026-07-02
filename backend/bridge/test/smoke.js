// End-to-end smoke test against a running dev stack (`npm run dev`).
// Simulates a driver publishing fixes over WebSocket (same transport the
// React Native apps use), then verifies:
//   1. the bridge re-published to trips/{ref}/location (subscriber receives it)
//   2. the retained message arrives instantly for a late subscriber
//   3. the REST fallback returns the last fix
//   4. rate limiting drops rapid-fire messages

const mqtt = require('mqtt')

const WS = 'ws://localhost:9001'
const REST = 'http://localhost:4000'
const DRIVER = 'tatenda-moyo'
const TRIP = 'SPT-TEST-1'

const fix = (lat, lng) => JSON.stringify({ lat, lng, heading: 90, speed: 8.3, accuracy: 5, ts: Date.now(), tripRef: TRIP })

// Both clients dial in parallel — 'connect' may fire before we attach a
// listener, so check .connected first to avoid awaiting a past event.
const ready = c => (c.connected ? Promise.resolve() : new Promise(r => c.once('connect', r)))

async function main() {
  // Assign trip -> driver via REST (what the driver app does on job accept)
  const assign = await fetch(`${REST}/trips/${TRIP}/assign`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ driverId: DRIVER }),
  })
  console.log('assign:', assign.status, await assign.json())

  const driver = mqtt.connect(WS, { clientId: `driver-${DRIVER}-smoke` })
  const rider = mqtt.connect(WS, { clientId: 'rider-smoke' })

  const received = []
  rider.on('message', (topic, buf) => {
    received.push({ topic, msg: JSON.parse(buf.toString()) })
    console.log('rider got:', topic, buf.toString().slice(0, 90))
  })

  await ready(rider)
  rider.subscribe(`trips/${TRIP}/location`, { qos: 1 })

  await ready(driver)
  console.log('driver connected — publishing 3 fixes 1.2s apart + 3 rapid-fire (should be rate-limited)')

  const points = [[-17.7840, 31.0534], [-17.7801, 31.0651], [-17.7712, 31.0902]]
  for (const [lat, lng] of points) {
    driver.publish(`drivers/${DRIVER}/location`, fix(lat, lng), { qos: 1 })
    await new Promise(r => setTimeout(r, 1200))
  }
  // Flood: only ~1 of these should be accepted
  for (let i = 0; i < 3; i++) driver.publish(`drivers/${DRIVER}/location`, fix(-17.7700 - i * 0.0001, 31.0910), { qos: 1 })
  await new Promise(r => setTimeout(r, 800))

  // Late subscriber should get the retained last fix immediately
  const late = mqtt.connect(WS, { clientId: 'rider-late-smoke' })
  const retained = await new Promise(resolve => {
    ready(late).then(() => late.subscribe(`trips/${TRIP}/location`, { qos: 1 }))
    late.on('message', (_t, buf) => resolve(JSON.parse(buf.toString())))
    setTimeout(() => resolve(null), 3000)
  })
  console.log('late subscriber retained fix:', retained ? `${retained.lat},${retained.lng}` : 'NONE')

  const rest = await fetch(`${REST}/trips/${TRIP}/last-location`)
  console.log('REST last-location:', rest.status, JSON.stringify(await rest.json()))
  const health = await (await fetch(`${REST}/health`)).json()
  console.log('health:', JSON.stringify(health))

  const pass = received.length >= 3 && received.length <= 5 && retained && rest.status === 200 && health.dropped >= 1
  console.log(pass ? '\nSMOKE PASS ✅' : '\nSMOKE FAIL ❌')
  driver.end(); rider.end(); late.end()
  process.exit(pass ? 0 : 1)
}

main().catch(e => { console.error(e); process.exit(1) })
