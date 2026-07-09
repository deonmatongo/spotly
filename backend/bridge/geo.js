// Spotly — geocoding + routing/ETAs.
//
// Provider-abstracted so production keys drop in without touching call sites.
// Zero-key dev fallback: a small Zimbabwe/Poland gazetteer for geocoding and a
// haversine + assumed-speed estimate for ETAs, so the feature works offline and
// in CI. Results are cached in-process to spare the rate-limited demo servers.
//
//   GEO_PROVIDER   'osrm' (default) | 'google' | 'mapbox'
//   GOOGLE_MAPS_API_KEY / MAPBOX_TOKEN   required for those providers (deferred)
//
// Routes (mounted at /api/geo):
//   GET /api/geo/geocode?q=<address>
//   GET /api/geo/route?from=<lat,lng>&to=<lat,lng>

const express = require('express')

const PROVIDER = process.env.GEO_PROVIDER || 'osrm'
const OSRM_BASE = process.env.OSRM_BASE || 'https://router.project-osrm.org'
const AVG_SPEED_KMH = Number(process.env.GEO_AVG_SPEED_KMH || 28) // urban driving

// ── Pure geometry (unit-tested) ──────────────────────────────────────────────
const R_EARTH_M = 6_371_000
const toRad = d => (d * Math.PI) / 180

/** Great-circle distance between two {lat,lng} points, in metres. */
function haversineMeters(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_EARTH_M * Math.asin(Math.min(1, Math.sqrt(s)))
}

/**
 * Estimate travel time (seconds) for a distance, allowing for the fact that road
 * distance exceeds straight-line. `winding` inflates crow-flies distance (~1.3×
 * in a typical street grid). Adds a fixed pickup/handover buffer.
 */
function estimateEtaSeconds(distanceM, { speedKmh = AVG_SPEED_KMH, winding = 1.3, bufferSec = 120 } = {}) {
  const roadM = distanceM * winding
  const speedMs = (speedKmh * 1000) / 3600
  return Math.round(roadM / speedMs + bufferSec)
}

function fmtEta(seconds) {
  const m = Math.max(1, Math.round(seconds / 60))
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}

// ── Zero-key geocoding gazetteer (launch-market coverage) ────────────────────
const GAZETTEER = {
  // Zimbabwe
  harare:      { lat: -17.8292, lng: 31.0522 },
  borrowdale:  { lat: -17.7590, lng: 31.0870 },
  'mount pleasant': { lat: -17.7620, lng: 31.0500 },
  avondale:    { lat: -17.7960, lng: 31.0380 },
  bulawayo:    { lat: -20.1594, lng: 28.5886 },
  mutare:      { lat: -18.9707, lng: 32.6709 },
  gweru:       { lat: -19.4500, lng: 29.8167 },
  // Poland
  warsaw:      { lat: 52.2297, lng: 21.0122 },
  warszawa:    { lat: 52.2297, lng: 21.0122 },
  krakow:      { lat: 50.0647, lng: 19.9450 },
  'mount pleasant harare': { lat: -17.7620, lng: 31.0500 },
}

function gazetteerLookup(q) {
  const key = String(q || '').trim().toLowerCase()
  if (GAZETTEER[key]) return { ...GAZETTEER[key], source: 'gazetteer', query: q }
  for (const [name, coord] of Object.entries(GAZETTEER)) {
    if (key.includes(name)) return { ...coord, source: 'gazetteer', query: q }
  }
  return null
}

// ── Small TTL cache ──────────────────────────────────────────────────────────
function makeCache(ttlMs) {
  const m = new Map()
  return {
    get(k) { const e = m.get(k); if (e && Date.now() < e.exp) return e.v; m.delete(k); return null },
    set(k, v) { m.set(k, { v, exp: Date.now() + ttlMs }) },
  }
}
const geocodeCache = makeCache(24 * 60 * 60 * 1000)
const routeCache   = makeCache(10 * 60 * 1000)

// ── Providers ────────────────────────────────────────────────────────────────
async function geocode(query) {
  if (!query) return null
  const cached = geocodeCache.get(query)
  if (cached) return cached

  // Try the configured provider; fall back to the gazetteer so we never hard-fail.
  let result = null
  try {
    if (PROVIDER === 'google' && process.env.GOOGLE_MAPS_API_KEY) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      const r = await fetch(url).then(x => x.json())
      const loc = r.results?.[0]?.geometry?.location
      if (loc) result = { lat: loc.lat, lng: loc.lng, source: 'google', query }
    } else if (PROVIDER === 'mapbox' && process.env.MAPBOX_TOKEN) {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.MAPBOX_TOKEN}&limit=1`
      const r = await fetch(url).then(x => x.json())
      const c = r.features?.[0]?.center
      if (c) result = { lat: c[1], lng: c[0], source: 'mapbox', query }
    }
  } catch (e) {
    console.warn('[geo] geocode provider error, using gazetteer:', e.message)
  }
  result = result || gazetteerLookup(query)
  if (result) geocodeCache.set(query, result)
  return result
}

async function route(from, to) {
  const key = `${from.lat},${from.lng}->${to.lat},${to.lng}`
  const cached = routeCache.get(key)
  if (cached) return cached

  let result = null
  try {
    if (PROVIDER === 'google' && process.env.GOOGLE_MAPS_API_KEY) {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${from.lat},${from.lng}&destination=${to.lat},${to.lng}&key=${process.env.GOOGLE_MAPS_API_KEY}`
      const r = await fetch(url).then(x => x.json())
      const leg = r.routes?.[0]?.legs?.[0]
      if (leg) result = { distanceM: leg.distance.value, durationS: leg.duration.value, source: 'google' }
    } else {
      // OSRM (demo by default; point OSRM_BASE at a self-hosted instance for prod)
      const url = `${OSRM_BASE}/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`
      const r = await fetch(url).then(x => x.json())
      const rt = r.routes?.[0]
      if (rt) result = { distanceM: Math.round(rt.distance), durationS: Math.round(rt.duration), source: 'osrm' }
    }
  } catch (e) {
    console.warn('[geo] routing provider error, using estimate:', e.message)
  }

  // Fallback: haversine + speed model. Always returns something usable.
  if (!result) {
    const distanceM = Math.round(haversineMeters(from, to))
    result = { distanceM, durationS: estimateEtaSeconds(distanceM), source: 'estimate' }
  }
  result.eta = fmtEta(result.durationS)
  routeCache.set(key, result)
  return result
}

// ── Routes ────────────────────────────────────────────────────────────────────
function parseCoord(s) {
  const [lat, lng] = String(s || '').split(',').map(Number)
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null
}

const router = express.Router()

router.get('/geocode', async (req, res) => {
  const q = req.query.q
  if (!q) return res.status(400).json({ error: 'q (address) is required.' })
  const hit = await geocode(String(q))
  if (!hit) return res.status(404).json({ error: 'Could not geocode that address.', provider: PROVIDER })
  res.json(hit)
})

router.get('/route', async (req, res) => {
  const from = parseCoord(req.query.from)
  const to   = parseCoord(req.query.to)
  if (!from || !to) return res.status(400).json({ error: 'from and to must be "lat,lng".' })
  res.json(await route(from, to))
})

module.exports = { router, geocode, route, haversineMeters, estimateEtaSeconds, fmtEta, PROVIDER }
