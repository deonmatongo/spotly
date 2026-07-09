import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { upcomingBookings, pastBookings, Booking } from '../data/mock'
import { getApiUrl } from '@spotly/shared'
import { useAuth } from './AuthContext'

export interface NewBookingInput {
  listingId: number
  listingName: string
  listingImage: string
  date: string
  time: string
  partySize: number
  points: number
  type: string
}

interface BookingsContextType {
  upcoming: Booking[]
  past: Booking[]
  addBooking: (b: NewBookingInput) => Promise<Booking>
  cancelBooking: (id: string) => Promise<void>
  modifyBooking: (id: string, changes: Partial<Pick<Booking, 'date' | 'time' | 'partySize'>>) => Promise<void>
  markReviewed: (id: string) => void
}

const BookingsContext = createContext<BookingsContextType | null>(null)

const genCode = () => `SPT-${Math.floor(1000 + Math.random() * 9000)}`
let localSeq = 0

export function BookingsProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const [upcoming, setUpcoming] = useState<Booking[]>(upcomingBookings)
  const [past, setPast]         = useState<Booking[]>(pastBookings)

  // Fetch real bookings on auth
  useEffect(() => {
    if (!user || !accessToken) return
    fetch(`${getApiUrl()}/api/bookings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setUpcoming(data.upcoming ?? [])
        setPast(data.past ?? [])
      })
      .catch(() => {/* keep mock fallback */})
  }, [user?.id, accessToken])

  const addBooking = useCallback(async (b: NewBookingInput): Promise<Booking> => {
    // Optimistic local booking first so the UI responds immediately
    localSeq += 1
    const localBooking: Booking = {
      id: `local-${localSeq}`,
      listingId: b.listingId,
      listingName: b.listingName,
      listingImage: b.listingImage,
      date: b.date,
      time: b.time,
      partySize: b.partySize,
      confirmationCode: genCode(),
      points: b.points,
      status: 'confirmed',
      type: b.type,
    }

    if (!accessToken) {
      setUpcoming(prev => [localBooking, ...prev])
      return localBooking
    }

    try {
      const res = await fetch(`${getApiUrl()}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(b),
      })
      if (res.ok) {
        const saved: Booking = await res.json()
        setUpcoming(prev => [saved, ...prev])
        return saved
      }
    } catch {}

    // API unreachable — keep local booking
    setUpcoming(prev => [localBooking, ...prev])
    return localBooking
  }, [accessToken])

  const cancelBooking = useCallback(async (id: string) => {
    // Optimistic remove
    setUpcoming(prev => prev.filter(b => b.id !== id))
    if (!accessToken) return
    try {
      await fetch(`${getApiUrl()}/api/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
    } catch {}
  }, [accessToken])

  const modifyBooking = useCallback(async (id: string, changes: Partial<Pick<Booking, 'date' | 'time' | 'partySize'>>) => {
    // Optimistic update
    setUpcoming(prev => prev.map(b => (b.id === id ? { ...b, ...changes } : b)))
    if (!accessToken) return
    try {
      await fetch(`${getApiUrl()}/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(changes),
      })
    } catch {}
  }, [accessToken])

  const markReviewed = useCallback((id: string) =>
    setPast(prev => prev.map(b => (b.id === id ? { ...b, canReview: false } : b))),
  [])

  return (
    <BookingsContext.Provider value={{ upcoming, past, addBooking, cancelBooking, modifyBooking, markReviewed }}>
      {children}
    </BookingsContext.Provider>
  )
}

export function useBookings() {
  const ctx = useContext(BookingsContext)
  if (!ctx) throw new Error('useBookings must be used within BookingsProvider')
  return ctx
}
