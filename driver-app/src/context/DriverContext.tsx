import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { currentDriver, earningsSummary } from '../data/mock'
import { requestPayout, getApiUrl } from '@spotly/shared'
import { useAuth } from './AuthContext'

interface DestinationFilter {
  active: boolean
  address: string
}

interface DriverContextType {
  driver: typeof currentDriver
  isOnline: boolean
  setOnline: (v: boolean) => void
  toggleOnline: () => void
  pendingPayout: number
  cashOutsToday: number
  cashOut: () => void
  destination: DestinationFilter
  toggleDestination: () => void
}

const DriverContext = createContext<DriverContextType | null>(null)

export function DriverProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const driver = {
    ...currentDriver,
    name: user?.name ?? currentDriver.name,
    phone: user?.phone ?? currentDriver.phone,
    initial: (user?.name ?? currentDriver.name).charAt(0).toUpperCase(),
  }
  const [isOnline, setOnline] = useState(false)
  const [pendingPayout, setPendingPayout] = useState(0)
  const [cashOutsToday, setCashOutsToday] = useState(0)
  const [destination, setDestination] = useState<DestinationFilter>({ active: false, address: 'Home · Borrowdale' })

  useEffect(() => {
    if (!user?.id || !accessToken) return
    fetch(`${getApiUrl()}/api/drivers/${user.id}/earnings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.grossEarnings > 0) setPendingPayout(Number(data.grossEarnings.toFixed(2)))
      })
      .catch(() => {})
  }, [user?.id, accessToken])

  const toggleOnline = () => setOnline(v => !v)

  const cashOut = async () => {
    if (pendingPayout <= 0 || cashOutsToday >= earningsSummary.maxCashOutsPerDay) return
    const amount = pendingPayout
    setPendingPayout(0)
    setCashOutsToday(n => n + 1)
    try {
      await requestPayout(user?.id ?? 'demo-driver', amount, 'ecocash', user?.phone ?? '')
    } catch {
      // Backend unreachable in dev — keep the optimistic update
    }
  }

  const toggleDestination = () => setDestination(d => ({ ...d, active: !d.active }))

  return (
    <DriverContext.Provider value={{
      driver, isOnline, setOnline, toggleOnline,
      pendingPayout, cashOutsToday, cashOut,
      destination, toggleDestination,
    }}>
      {children}
    </DriverContext.Provider>
  )
}

export function useDriver() {
  const ctx = useContext(DriverContext)
  if (!ctx) throw new Error('useDriver must be used within DriverProvider')
  return ctx
}
