import React, { createContext, useContext, useState, ReactNode } from 'react'
import { currentStore } from '../data/mock'

interface StoreContextType {
  store: typeof currentStore
  isOpen: boolean
  setOpen: (v: boolean) => void
  toggleOpen: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(true)
  const toggleOpen = () => setOpen(v => !v)

  return (
    <StoreContext.Provider value={{ store: currentStore, isOpen, setOpen, toggleOpen }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
