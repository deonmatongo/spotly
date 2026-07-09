import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { listings as mockListings, Listing } from '../data/mock'
import { getApiUrl } from '@spotly/shared'

interface ListingsContextType {
  listings: Listing[]
  loading: boolean
}

const ListingsContext = createContext<ListingsContextType>({
  listings: mockListings,
  loading: false,
})

export function ListingsProvider({ children }: { children: ReactNode }) {
  const [listings, setListings] = useState<Listing[]>(mockListings)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/listings`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setListings(data)
      })
      .catch(() => {/* keep mock fallback */})
      .finally(() => setLoading(false))
  }, [])

  return (
    <ListingsContext.Provider value={{ listings, loading }}>
      {children}
    </ListingsContext.Provider>
  )
}

export function useListings() {
  return useContext(ListingsContext)
}
