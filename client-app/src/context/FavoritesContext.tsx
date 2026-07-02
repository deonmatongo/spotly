import React, { createContext, useContext, useState, ReactNode, useMemo } from 'react'
import { listings, Listing } from '../data/mock'

interface FavoritesContextType {
  favorites: number[]
  isFavorite: (id: number) => boolean
  toggleFavorite: (id: number) => boolean // returns new state (true = now favorited)
  favoriteListings: Listing[]
  count: number
}

const FavoritesContext = createContext<FavoritesContextType | null>(null)

// Seed with a couple so the wishlist isn't empty during a demo
const SEED = [1, 10]

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>(SEED)

  const isFavorite = (id: number) => favorites.includes(id)

  const toggleFavorite = (id: number) => {
    let nowFav = false
    setFavorites(prev => {
      if (prev.includes(id)) return prev.filter(f => f !== id)
      nowFav = true
      return [id, ...prev]
    })
    return !favorites.includes(id)
  }

  const favoriteListings = useMemo(
    () => favorites.map(id => listings.find(l => l.id === id)).filter(Boolean) as Listing[],
    [favorites]
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
