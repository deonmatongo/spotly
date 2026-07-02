import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { availableJobs as initialJobs, offerPool, DeliveryJob, JobStatus, JobType } from '../data/mock'
import { locationTracker } from '../services/locationTracker'

const PROGRESSION: JobStatus[] = ['accepted', 'picked_up', 'en_route', 'delivered']

export type TypeFilters = Record<JobType, boolean>

interface JobsContextType {
  availableJobs: DeliveryJob[]
  visibleJobs: DeliveryJob[]
  typeFilters: TypeFilters
  toggleTypeFilter: (t: JobType) => void
  activeJob: DeliveryJob | null
  completedJobs: DeliveryJob[]
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

  const visibleJobs = availableJobs.filter(j => typeFilters[j.type])

  // Live tracking: start broadcasting when a job becomes active, stop when it ends.
  // Track the last started ref so status advances don't restart the tracker.
  const trackedRef = useRef<string | null>(null)
  useEffect(() => {
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
  }

  const declineJob = (id: string) => {
    setAvailableJobs(prev => prev.filter(j => j.id !== id))
  }

  const advanceActiveJob = () => {
    setActiveJob(prev => {
      if (!prev) return prev
      const idx = PROGRESSION.indexOf(prev.status)
      const next = PROGRESSION[Math.min(idx + 1, PROGRESSION.length - 1)]
      return { ...prev, status: next }
    })
  }

  const finishActiveJob = () => {
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
      activeJob, completedJobs, acceptJob, declineJob, advanceActiveJob, finishActiveJob,
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
