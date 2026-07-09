import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react'
import { Listing } from '../data/mock'
import { getApiUrl } from '@spotly/shared'
import { useAuth } from './AuthContext'
import { useListings } from './ListingsContext'

interface FavoritesContextType {
  favorites: number[]
  isFavorite: (id: number) => boolean
  toggleFavorite: (id: number) => boolean  // returns new isFavorite state
  favoriteListings: Listing[]
  count: number
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

const SEED = [1, 10]

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const { listings } = useListings()
  const [favorites, setFavorites] = useState<number[]>(SEED)

  // Fetch real favorites on auth
  useEffect(() => {
    if (!user || !accessToken) return
    fetch(`${getApiUrl()}/api/favorites`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (Array.isArray(data)) setFavorites(data)
      })
      .catch(() => {/* keep seed fallback */})
  }, [user?.id, accessToken])

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites])

  const toggleFavorite = useCallback((id: number): boolean => {
    const nowFav = !favorites.includes(id)
    setFavorites(prev => nowFav ? [id, ...prev] : prev.filter(f => f !== id))

    if (accessToken) {
      const method = nowFav ? 'POST' : 'DELETE'
      fetch(`${getApiUrl()}/api/favorites/${id}`, {
        method,
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {})
    }

    return nowFav
  }, [favorites, accessToken])

  const favoriteListings = useMemo(
    () => favorites.map(id => listings.find(l => l.id === id)).filter(Boolean) as Listing[],
    [favorites, listings],
  )

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, favoriteListings, count: favorites.length }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}
