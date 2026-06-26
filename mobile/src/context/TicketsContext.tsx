import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface PurchasedTicket {
  id: string
  eventId: number
  eventName: string
  eventImage: string
  eventDate: string
  eventTime: string
  venue: string
  tierName: string
  tierColor: string
  quantity: number
  totalPrice: number
  confirmationCode: string
  email: string
  purchasedAt: string
  status: 'upcoming' | 'past'
}

interface TicketsContextType {
  tickets: PurchasedTicket[]
  addTicket: (ticket: PurchasedTicket) => void
}

const TicketsContext = createContext<TicketsContextType | null>(null)

export function TicketsProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<PurchasedTicket[]>([])

  const addTicket = (ticket: PurchasedTicket) => {
    setTickets(prev => [ticket, ...prev])
  }

  return (
    <TicketsContext.Provider value={{ tickets, addTicket }}>
      {children}
    </TicketsContext.Provider>
  )
}

export function useTickets() {
  const ctx = useContext(TicketsContext)
  if (!ctx) throw new Error('useTickets must be used within TicketsProvider')
  return ctx
}
