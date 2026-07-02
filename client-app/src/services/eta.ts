type Coord = { lat: number; lng: number }

const OSRM_TIMEOUT_MS = 4000
const FALLBACK_SPEED_KMH = 28

// NOTE for callers: the OSRM demo server is rate-limited — re-compute the
// ETA at most every 20 seconds (the tracking screen throttles to this).

function haversineKm(from: Coord, to: Coord): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(to.lat - from.lat)
  const dLng = toRad(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

function fallbackEtaMinutes(from: Coord, to: Coord): number {
  const km = haversineKm(from, to)
  return Math.max(1, Math.ceil((km / FALLBACK_SPEED_KMH) * 60))
}

export async function getEtaMinutes(from: Coord, to: Coord): Promise<number | null> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=false`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OSRM_TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`OSRM ${res.status}`)
    const data = await res.json()
    const duration = data?.routes?.[0]?.duration
    if (typeof duration !== 'number') throw new Error('OSRM: no route')
    return Math.max(1, Math.ceil(duration / 60))
  } catch {
    return fallbackEtaMinutes(from, to)
  } finally {
    clearTimeout(timer)
  }
}
