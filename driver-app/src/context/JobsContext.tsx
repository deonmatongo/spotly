import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { availableJobs as initialJobs, offerPool, DeliveryJob, JobStatus, JobType } from '../data/mock'
import { locationTracker } from '../services/locationTracker'
import {
  SpotlyClient, DeliveryJob as BusJob, OrderStatus as CanonicalStatus,
  DEMO_DRIVER_ID, DEMO_DRIVER_NAME, MERCHANT_COORD, FALLBACK_DROPOFF, MqttStatus,
} from '@spotly/shared'

const PROGRESSION: JobStatus[] = ['accepted', 'picked_up', 'en_route', 'delivered']

export type TypeFilters = Record<JobType, boolean>

// A job dispatched over the bus arrives in the canonical shape; expand it into
// the richer local DeliveryJob the driver UI renders. Missing details get
// sensible defaults.
function busJobToLocal(j: BusJob): DeliveryJob {
  return {
    id: `bus-${j.ref}`,
    type: 'food',
    ref: j.ref,
    vendorName: j.vendorName,
    pickup: j.pickup,
    pickupDetail: 'Order ready — quote the order code',
    dropoff: j.dropoff,
    dropoffDetail: '',
    customerName: j.customerName,
    customerPhone: j.customerPhone,
    itemsSummary: j.itemsSummary,
    distance: j.distance,
    estMinutes: j.estMinutes,
    payout: j.payout,
    tip: j.tip,
    status: 'available',
    requestedAt: 'Just now',
    orderCode: j.ref,
    dropoffMode: 'meet_at_door',
    pickupCoord: j.pickupCoord ?? MERCHANT_COORD,
    dropoffCoord: j.dropoffCoord ?? FALLBACK_DROPOFF,
  }
}

interface JobsContextType {
  availableJobs: DeliveryJob[]
  visibleJobs: DeliveryJob[]
  typeFilters: TypeFilters
  toggleTypeFilter: (t: JobType) => void
  activeJob: DeliveryJob | null
  completedJobs: DeliveryJob[]
  connection: MqttStatus
  acceptJob: (id: string) => void
  declineJob: (id: string) => void
  advanceActiveJob: () => void
  finishActiveJob: () => void
  // Live offer that pops while browsing (with a countdown in the UI)
  incomingOffer: DeliveryJob | null
  spawnIncomingOffer: () => void
  acceptIncomingOffer: () => void
  declineIncomingOffer: () => void
  // Back-to-back: pinged near the end of the active trip, queued for after
  queuedOffer: DeliveryJob | null
  queuedJob: DeliveryJob | null
  spawnQueuedOffer: () => void
  acceptQueuedOffer: () => void
  dismissQueuedOffer: () => void
}

const JobsContext = createContext<JobsContextType | null>(null)

export function JobsProvider({ children }: { children: ReactNode }) {
  const [availableJobs, setAvailableJobs] = useState<DeliveryJob[]>(initialJobs)
  const [activeJob, setActiveJob] = useState<DeliveryJob | null>(null)
  const [completedJobs, setCompletedJobs] = useState<DeliveryJob[]>([])
  const [typeFilters, setTypeFilters] = useState<TypeFilters>({ courier: true, food: true, groceries: true })
  const [incomingOffer, setIncomingOffer] = useState<DeliveryJob | null>(null)
  const [queuedOffer, setQueuedOffer] = useState<DeliveryJob | null>(null)
  const [queuedJob, setQueuedJob] = useState<DeliveryJob | null>(null)
  const [usedOfferIds, setUsedOfferIds] = useState<string[]>([])
  const [connection, setConnection] = useState<MqttStatus>('offline')
  const clientRef = useRef<SpotlyClient | null>(null)

  // Refs that are no longer available to pick up (claimed by us, completed, or
  // active) — used to filter incoming dispatches.
  const activeRef = useRef<string | null>(null)
  const claimedRefs = useRef<Set<string>>(new Set())

  const visibleJobs = availableJobs.filter(j => typeFilters[j.type])

  // Connect to the dispatch bus: real jobs the merchant marks "ready" land here
  // live, alongside the local demo seed jobs.
  useEffect(() => {
    const spotly = new SpotlyClient('driver')
    clientRef.current = spotly
    const offStatus = spotly.onStatus(setConnection)
    const offJobs = spotly.watchJobs(
      (job) => {
        if (claimedRefs.current.has(job.ref) || activeRef.current === job.ref) return
        setAvailableJobs(prev => prev.some(j => j.ref === job.ref) ? prev : [busJobToLocal(job), ...prev])
      },
      (ref) => {
        // Cleared from the queue (claimed by some driver) — drop it unless it's
        // the one we're actively delivering.
        if (activeRef.current === ref) return
        setAvailableJobs(prev => prev.filter(j => j.ref !== ref))
      },
    )
    spotly.connect()
    return () => { offStatus(); offJobs(); spotly.disconnect() }
  }, [])

  // Live tracking: start broadcasting when a job becomes active, stop when it ends.
  // Track the last started ref so status advances don't restart the tracker.
  const trackedRef = useRef<string | null>(null)
  useEffect(() => {
    activeRef.current = activeJob?.ref ?? null
    if (activeJob) {
      if (trackedRef.current !== activeJob.ref) {
        trackedRef.current = activeJob.ref
        locationTracker.start(activeJob.ref)
      }
    } else if (trackedRef.current) {
      trackedRef.current = null
      locationTracker.stop()
    }
  }, [activeJob])

  const toggleTypeFilter = (t: JobType) => setTypeFilters(prev => ({ ...prev, [t]: !prev[t] }))

  const acceptJob = (id: string) => {
    const job = availableJobs.find(j => j.id === id)
    if (!job) return
    setAvailableJobs(prev => prev.filter(j => j.id !== id))
    setActiveJob({ ...job, status: 'accepted' })
    // Claim on the bus: removes it from other drivers' queues and tells the
    // customer + merchant a driver is assigned.
    claimedRefs.current.add(job.ref)
    clientRef.current?.claimJob(job.ref, DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
  }

  const declineJob = (id: string) => {
    setAvailableJobs(prev => prev.filter(j => j.id !== id))
  }

  const advanceActiveJob = () => {
    if (!activeJob) return
    const idx = PROGRESSION.indexOf(activeJob.status)
    const next = PROGRESSION[Math.min(idx + 1, PROGRESSION.length - 1)]
    setActiveJob({ ...activeJob, status: next })
    // Driver-side statuses (picked_up, en_route, delivered) are already the
    // canonical vocabulary, so they publish straight through to the customer.
    clientRef.current?.advanceOrder(activeJob.ref, next as CanonicalStatus, DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
  }

  const finishActiveJob = () => {
    if (activeJob) {
      clientRef.current?.advanceOrder(activeJob.ref, 'delivered', DEMO_DRIVER_ID, DEMO_DRIVER_NAME)
    }
    setActiveJob(prev => {
      if (!prev) return prev
      setCompletedJobs(list => [{ ...prev, status: 'delivered' }, ...list])
      return null
    })
    // Back-to-back: an accepted queued job rolls straight into the active slot.
    setQueuedJob(q => {
      if (q) setActiveJob({ ...q, status: 'accepted' })
      return null
    })
    setQueuedOffer(null)
  }

  const nextFromPool = () => offerPool.find(o => !usedOfferIds.includes(o.id) && typeFilters[o.type]) ?? null

  const spawnIncomingOffer = () => {
    if (incomingOffer) return
    const offer = nextFromPool()
    if (!offer) return
    setUsedOfferIds(prev => [...prev, offer.id])
    setIncomingOffer(offer)
  }

  const acceptIncomingOffer = () => {
    setIncomingOffer(offer => {
      if (offer) setActiveJob({ ...offer, status: 'accepted' })
      return null
    })
  }

  const declineIncomingOffer = () => setIncomingOffer(null)

  const spawnQueuedOffer = () => {
    if (queuedOffer || queuedJob) return
    const offer = nextFromPool()
    if (!offer) return
    setUsedOfferIds(prev => [...prev, offer.id])
    setQueuedOffer(offer)
  }

  const acceptQueuedOffer = () => {
    setQueuedOffer(offer => {
      if (offer) setQueuedJob(offer)
      return null
    })
  }

  const dismissQueuedOffer = () => setQueuedOffer(null)

  return (
    <JobsContext.Provider value={{
      availableJobs, visibleJobs, typeFilters, toggleTypeFilter,
      activeJob, completedJobs, connection, acceptJob, declineJob, advanceActiveJob, finishActiveJob,
      incomingOffer, spawnIncomingOffer, acceptIncomingOffer, declineIncomingOffer,
      queuedOffer, queuedJob, spawnQueuedOffer, acceptQueuedOffer, dismissQueuedOffer,
    }}>
      {children}
    </JobsContext.Provider>
  )
}

export function useJobs() {
  const ctx = useContext(JobsContext)
  if (!ctx) throw new Error('useJobs must be used within JobsProvider')
  return ctx
}
