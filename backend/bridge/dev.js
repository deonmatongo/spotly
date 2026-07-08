// Dev mode: embedded MQTT broker (Aedes) + the bridge, one process, no Docker.
//
//   npm run dev
//
// Exposes the exact surface the apps expect:
//   - MQTT/TCP        on :1883  (bridge loopback, native clients)
//   - MQTT/WebSocket  on :9001  (React Native paho-mqtt clients)
//   - Bridge REST     on :4000
//
// Auth is intentionally open here; production uses Mosquitto with
// password + ACL files (see ../mosquitto/config and docker-compose.yml).

process.env.DEV_MIRROR = process.env.DEV_MIRROR ?? '1'

const aedes = require('aedes')()
const { createServer } = require('aedes-server-factory')

const TCP_PORT = 1883
const WS_PORT = 9001

const tcpServer = createServer(aedes)
tcpServer.listen(TCP_PORT, () => console.log(`[broker] MQTT/TCP on :${TCP_PORT}`))

const wsServer = createServer(aedes, { ws: true })
wsServer.listen(WS_PORT, () => console.log(`[broker] MQTT/WS on :${WS_PORT}`))

aedes.on('client', c => console.log(`[broker] client connected: ${c.id}`))
aedes.on('clientDisconnect', c => console.log(`[broker] client disconnected: ${c.id}`))

// Give the broker a beat to bind before the bridge dials in.
setTimeout(() => {
  const mqtt = require('mqtt')
  const { startBridge, startRest } = require('./server')
  const { startDispatch } = require('./dispatch')
  const { startApi } = require('./api')
  const client = mqtt.connect(`mqtt://localhost:${TCP_PORT}`, { reconnectPeriod: 2000 })
  startBridge(client)
  startRest()
  startDispatch(`mqtt://localhost:${TCP_PORT}`)
  startApi(`mqtt://localhost:${TCP_PORT}`)
}, 300)
