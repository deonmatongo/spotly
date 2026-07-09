import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getApiUrl } from '@spotly/shared'
import { useAuth } from './AuthContext'

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
  const { user, accessToken } = useAuth()
  const [tickets, setTickets] = useState<PurchasedTicket[]>([])

  useEffect(() => {
    if (!user || !accessToken) return
    fetch(`${getApiUrl()}/api/tickets/mine`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length) setTickets(data)
      })
      .catch(() => {})
  }, [user?.id, accessToken])

  const addTicket = (ticket: PurchasedTicket) => {
    setTickets(prev => [ticket, ...prev])
    if (accessToken) {
      fetch(`${getApiUrl()}/api/tickets/mine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(ticket),
      }).catch(() => {})
    }
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
