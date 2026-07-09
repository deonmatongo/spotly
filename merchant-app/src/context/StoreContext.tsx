import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { currentStore } from '../data/mock'
import { getApiUrl } from '@spotly/shared'
import { useAuth } from './AuthContext'

interface StoreContextType {
  store: typeof currentStore
  isOpen: boolean
  setOpen: (v: boolean) => void
  toggleOpen: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const [isOpen, setOpenState] = useState(true)

  // Load persisted open/closed state on auth
  useEffect(() => {
    if (!user || !accessToken) return
    fetch(`${getApiUrl()}/api/merchant/settings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && typeof data.isOpen === 'boolean') setOpenState(data.isOpen) })
      .catch(() => {})
  }, [user?.id, accessToken])

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v)
    if (accessToken) {
      fetch(`${getApiUrl()}/api/merchant/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ isOpen: v }),
      }).catch(() => {})
    }
  }, [accessToken])

  const toggleOpen = useCallback(() => setOpen(!isOpen), [isOpen, setOpen])

  const store = {
    ...currentStore,
    name: user?.name ?? currentStore.name,
    phone: user?.phone ?? currentStore.phone,
  }

  return (
    <StoreContext.Provider value={{ store, isOpen, setOpen, toggleOpen }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
