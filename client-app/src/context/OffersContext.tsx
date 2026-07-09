import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { offers as mockOffers, Offer } from '../data/mock'
import { getApiUrl } from '@spotly/shared'

interface OffersContextType {
  offers: Offer[]
}

const OffersContext = createContext<OffersContextType>({ offers: mockOffers })

export function OffersProvider({ children }: { children: ReactNode }) {
  const [offers, setOffers] = useState<Offer[]>(mockOffers)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/offers`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setOffers(data)
      })
      .catch(() => {})
  }, [])

  return <OffersContext.Provider value={{ offers }}>{children}</OffersContext.Provider>
}

export function useOffers() {
  return useContext(OffersContext)
}
