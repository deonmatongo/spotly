// Dispatch / matching engine.
//
// Watches ready jobs the merchant hands off (jobs/{ref}), gives an online human
// driver first dibs, and — if no one accepts within the window — auto-matches
// the job to an available driver. Handles the no-driver-available case and
// frees drivers when a delivery completes. Runs alongside the bridge.
//
// This is the operational layer that replaces "any driver can grab anything":
// presence-aware, timed offers, reassignment, and a clear result signal.

const mqtt = require('mqtt')

// Backup drivers the engine can auto-assign to when no human takes the job.
const ROSTER = [
  { id: 'sim-rudo', name: 'Rudo Chikwanda' },
  { id: 'sim-blessing', name: 'Blessing Mutasa' },
]
const OFFER_TIMEOUT_MS = Number(process.env.DISPATCH_TIMEOUT_MS || 12000)

function safe(s) { try { return s ? JSON.parse(s) : null } catch { return null } }

function startDispatch(url, opts = {}) {
  const client = mqtt.connect(url, {
    clientId: 'spotly-dispatcher',
    username: opts.username,
    password: opts.password,
    reconnectPeriod: 2000,
  })
  const log = (...a) => console.log('[dispatch]', ...a)

  const presence = new Map()   // driverId -> { online, busy, name }
  const backupBusy = new Set()  // sim driver ids currently on a delivery
  const pending = new Map()     // ref -> { timer, job, extended }
  const done = new Set()        // refs already claimed / resolved / terminal

  client.on('connect', () => {
    client.subscribe(['jobs/+', 'orders/+/status', 'drivers/+/presence'], { qos: 1 })
    log(`online — first-dibs window ${OFFER_TIMEOUT_MS / 1000}s`)
  })

  client.on('message', (topic, buf) => {
    const raw = buf.toString()

    if (topic.startsWith('drivers/') && topic.endsWith('/presence')) {
      const p = safe(raw)
      if (p && p.driverId) presence.set(p.driverId, p)
      return
    }

    const statusM = topic.match(/^orders\/(.+)\/status$/)
    if (statusM) {
      const ref = statusM[1]
      const evt = safe(raw)
      if (!evt) return
      if (evt.driverName) { cancel(ref); done.add(ref) }           // claimed
      if (['delivered', 'declined', 'cancelled'].includes(evt.status)) {
        cancel(ref); done.add(ref)
        if (evt.driverId && backupBusy.has(evt.driverId)) backupBusy.delete(evt.driverId)
      }
      return
    }

    const jobM = topic.match(/^jobs\/(.+)$/)
    if (jobM) {
      const ref = jobM[1]
      if (!raw) { cancel(ref); return }                            // cleared → claimed
      if (done.has(ref) || pending.has(ref)) return
      const job = safe(raw)
      if (!job) return
      const timer = setTimeout(() => escalate(ref, job), OFFER_TIMEOUT_MS)
      pending.set(ref, { timer, job, extended: false })
      log(`job ${ref} (${job.vendorName || 'order'}) queued — waiting for a driver`)
    }
  })

  function cancel(ref) {
    const p = pending.get(ref)
    if (p) { clearTimeout(p.timer); pending.delete(ref) }
  }

  // First timeout: if a real driver is online and idle, give them one more
  // window before the engine steps in; otherwise auto-match now.
  function escalate(ref, job) {
    const p = pending.get(ref)
    pending.delete(ref)
    if (done.has(ref)) return
    const humanFree = [...presence.values()].some(
      d => d.online && !d.busy && !ROSTER.some(r => r.id === d.driverId)
    )
    if (humanFree && !(p && p.extended)) {
      log(`job ${ref} still open — a driver is online, extending`)
      const timer = setTimeout(() => forceAssign(ref, job), OFFER_TIMEOUT_MS)
      pending.set(ref, { timer, job, extended: true })
      return
    }
    forceAssign(ref, job)
  }

  function forceAssign(ref, job) {
    pending.delete(ref)
    if (done.has(ref)) return
    const backup = ROSTER.find(r => !backupBusy.has(r.id))
    if (!backup) {
      log(`job ${ref} — NO DRIVER AVAILABLE`)
      client.publish(`dispatch/${ref}/result`, JSON.stringify({ status: 'no_driver', ts: Date.now() }), { qos: 1, retain: true })
      return
    }
    backupBusy.add(backup.id)
    done.add(ref)
    // Claim on the bus: pull the job from the queue + attach the driver.
    client.publish(`jobs/${ref}`, '', { qos: 1, retain: true })
    client.publish(`orders/${ref}/status`, JSON.stringify({ ref, status: 'ready', ts: Date.now(), driverId: backup.id, driverName: backup.name }), { qos: 1, retain: true })
    client.publish(`dispatch/${ref}/result`, JSON.stringify({ status: 'assigned', driverName: backup.name, ts: Date.now() }), { qos: 1, retain: true })
    log(`job ${ref} auto-assigned to ${backup.name}`)
  }

  return client
}

module.exports = { startDispatch, ROSTER }
