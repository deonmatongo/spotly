import React, { createContext, useContext, useState, ReactNode } from 'react'
import { upcomingBookings, pastBookings, Booking } from '../data/mock'

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
  addBooking: (b: NewBookingInput) => Booking
  cancelBooking: (id: string) => void
  modifyBooking: (id: string, changes: Partial<Pick<Booking, 'date' | 'time' | 'partySize'>>) => void
  markReviewed: (id: string) => void
}

const BookingsContext = createContext<BookingsContextType | null>(null)

let seq = 0
const genCode = () => `SPT-${Math.floor(1000 + Math.random() * 9000)}`

export function BookingsProvider({ children }: { children: ReactNode }) {
  const [upcoming, setUpcoming] = useState<Booking[]>(upcomingBookings)
  const [past, setPast] = useState<Booking[]>(pastBookings)

  const addBooking = (b: NewBookingInput): Booking => {
    seq += 1
    const booking: Booking = {
      id: `new-${seq}`,
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
    setUpcoming(prev => [booking, ...prev])
    return booking
  }

  const cancelBooking = (id: string) => setUpcoming(prev => prev.filter(b => b.id !== id))

  const modifyBooking = (id: string, changes: Partial<Pick<Booking, 'date' | 'time' | 'partySize'>>) =>
    setUpcoming(prev => prev.map(b => (b.id === id ? { ...b, ...changes } : b)))

  const markReviewed = (id: string) =>
    setPast(prev => prev.map(b => (b.id === id ? { ...b, canReview: false } : b)))

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
