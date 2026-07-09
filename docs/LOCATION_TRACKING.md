# Live Location Tracking (MQTT)

Uber-style live tracking across the three pieces of this repo:

- **driver-app** publishes GPS fixes over MQTT while a trip is active (background-capable in dev builds).
- **backend** — MQTT broker + a Node "bridge" that validates, rate-limits, and re-publishes each fix scoped to the trip, plus a REST fallback.
- **client-app** subscribes to its trip channel and animates the driver marker on a native map, with live ETA.

Platform: **React Native (Expo SDK 54)** on both apps. MQTT client is `paho-mqtt`
over WebSockets (pure JS — safe in RN/Expo Go). For fully native builds you can swap in
HiveMQ Client (Android) / CocoaMQTT (iOS) behind the same topic contract.

---

## Topic & payload contract

| Topic | Who | Notes |
|---|---|---|
| `drivers/{driverId}/location` | driver **publishes**, QoS 1 | raw feed; riders can never subscribe to this (broker ACL) |
| `trips/{tripRef}/location` | bridge **re-publishes**, QoS 1 **retained** | riders subscribe only to their own trip; retained ⇒ instant last fix on subscribe |
| `trips/demo/location` | bridge (dev only, `DEV_MIRROR=1`) | mirrors every fix so demos work without ID plumbing |

Payload (JSON): `{ lat, lng, heading, speed, accuracy, ts, tripRef }` — `ts` is epoch ms.

REST (bridge, port 4000):
- `GET /trips/{tripRef}/last-location` → `{ location }` or 404 — fetched by the rider on screen load so the map has a position before MQTT connects.
- `POST /trips/{tripRef}/assign` `{ driverId }` — dispatch step (the driver app calls this on job accept in the prototype).
- `GET /health` → accepted/dropped/invalid counters.

QoS 1 everywhere (at-least-once). The rider dedupes by `ts`, so occasional re-delivery is harmless. Bridge drops: payloads > 2 KB, malformed/out-of-range coords, and anything faster than 1 fix/sec per driver (flood protection).

## Running it

**Dev (no Docker), what CI/this machine uses:**
```bash
cd backend/bridge && npm install && npm run dev   # broker :1883 + :9001(ws) + REST :4000
npm run smoke                                     # end-to-end check (assign → publish → subscribe → retained → REST)
```

**Production shape (Docker):** `cd backend && docker compose up -d` — Mosquitto with
username/password auth (`mosquitto_passwd`, see compose header comment) and ACLs
(`mosquitto/config/acl`): drivers can only write `drivers/{their-username}/location`,
riders can only read `trips/#`. The RN apps point at the broker via
`src/config/tracking.ts` in each app (dev default: `localhost` — the iOS simulator
reaches the host machine directly; on a device, change to your machine's LAN IP).

**Demo:** run the backend, launch both apps (driver Metro :8082, client :8081 — two
simulators for a simultaneous view). Driver signs in, goes online, accepts a job →
"LIVE" pill appears on the Active Delivery banner and fixes start flowing. Client
places an order → Track Order shows the native map; in dev the demo mirror means any
driver movement appears. Simulate motion on the iOS simulator with
**Features → Location → Freeway Drive**, or `xcrun simctl location booted start ...`.

## Where things live

| Piece | Path |
|---|---|
| Broker compose + Mosquitto conf/ACL | `backend/docker-compose.yml`, `backend/mosquitto/config/` |
| Bridge (validation, rate limit, fan-out, REST) | `backend/bridge/server.js` (`dev.js` = embedded Aedes broker for local dev) |
| Driver MQTT publisher (backoff + offline FIFO queue) | `driver-app/src/services/mqttClient.ts` |
| Driver location capture (fg watch + bg task) | `driver-app/src/services/locationTracker.ts`, `locationTask.ts` |
| Trip lifecycle hook (start/stop on job accept/finish) | `driver-app/src/context/JobsContext.tsx` |
| Rider MQTT subscriber (backoff + resubscribe) | `client-app/src/services/mqttClient.ts` |
| Rider hook (REST seed + live fixes + status) | `client-app/src/hooks/useDriverLocation.ts` |
| Animated map (AnimatedRegion, 1.5 s interpolation) | `client-app/src/components/TrackingMap.tsx` |
| ETA (OSRM, 20 s throttle, haversine fallback) | `client-app/src/services/eta.ts` |

Offline behaviour: the driver queues fixes in order while disconnected (tunnel/dead
zone) and flushes them on reconnect, so the rider sees the path fill in smoothly
rather than the marker teleporting. Both sides reconnect with exponential backoff
(1 s → 30 s cap, jittered); the rider map shows a "Reconnecting…" pill instead of freezing.

## Background location — build & store notes

**Expo Go can't do background location.** In Expo Go the driver app automatically
falls back to foreground-only `watchPositionAsync`. For real background tracking,
make a dev build (`eas build --profile development`) — all config below is already
in `driver-app/app.json`.

### iOS
- `UIBackgroundModes: ["location"]` (set), "Always" authorization requested during an
  active trip, `showsBackgroundLocationIndicator: true` (the blue pill — Apple requires
  visible indication), `pausesUpdatesAutomatically: false`, `activityType: AutomotiveNavigation`.
- When idle the tracker stops updates entirely (significant-change monitoring is the
  battery-friendly alternative if you need passive presence).
- **App Review justification** (paste into the Review Notes, and mirror it in the
  `NSLocationAlwaysAndWhenInUseUsageDescription` string):
  > Spotly Driver is a delivery-courier app. Continuous background location is
  > required only while the courier has an active delivery: the customer-facing app
  > shows the courier's live position and ETA, and dispatch uses it for safety
  > monitoring (RideCheck). Tracking starts when a delivery is accepted, is
  > accompanied by the system background-location indicator, and stops automatically
  > when the delivery is completed. Demo account: tatendamoyo / 123456 — accept any
  > job to observe tracking start and complete it to observe tracking stop.
- Apple rejects apps that track without an active task — the stop-on-completion
  behaviour in `JobsContext` is what makes this approvable. Don't remove it.

### Android
- Permissions (set): `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`,
  `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_LOCATION`.
- expo-location's background mode runs a **foreground service** with a persistent
  notification ("Spotly Driver — trip in progress") — configured in
  `locationTracker.ts`; Android 14+ requires the `FOREGROUND_SERVICE_LOCATION` type.
- **Play Console**: background location triggers a policy declaration + review video.
  Declare the same in-use-only rationale as iOS and show the notification in the video.
- **OEM battery killers** (Xiaomi/MIUI, Huawei/EMUI, Samsung): request an exemption via
  `Settings → Battery → Unrestricted` deep link and prompt drivers once at onboarding
  (https://dontkillmyapp.com has per-OEM steps). Without it, MIUI in particular will
  kill the service within minutes.

### Map SDK note
The rider map uses `react-native-maps` (Apple/Google native maps) because it works
inside Expo Go today. For MapLibre GL + OSM tiles (self-hosted, no Google
dependency), swap `TrackingMap.tsx` to `@maplibre/maplibre-react-native` in a dev
build — the component's props (`tripRef`, `onFix`) and the `useDriverLocation` hook
don't change.
