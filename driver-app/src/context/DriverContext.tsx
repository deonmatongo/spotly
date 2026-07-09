import React, { createContext, useContext, useState, ReactNode } from 'react'
import { currentDriver, earningsSummary } from '../data/mock'
import { requestPayout } from '@spotly/shared'
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
  // Wallet: pending balance + instant cash-out (capped per day)
  pendingPayout: number
  cashOutsToday: number
  cashOut: () => void
  // Only receive jobs heading toward a set address
  destination: DestinationFilter
  toggleDestination: () => void
}

const DriverContext = createContext<DriverContextType | null>(null)

export function DriverProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const driver = {
    ...currentDriver,
    name: user?.name ?? currentDriver.name,
    phone: user?.phone ?? currentDriver.phone,
    initial: (user?.name ?? currentDriver.name).charAt(0).toUpperCase(),
  }
  const [isOnline, setOnline] = useState(false)
  const [pendingPayout, setPendingPayout] = useState(earningsSummary.pendingPayout)
  const [cashOutsToday, setCashOutsToday] = useState(0)
  const [destination, setDestination] = useState<DestinationFilter>({ active: false, address: 'Home · Borrowdale' })

  const toggleOnline = () => setOnline(v => !v)

  const cashOut = async () => {
    if (pendingPayout <= 0 || cashOutsToday >= earningsSummary.maxCashOutsPerDay) return
    const amount = pendingPayout
    // Optimistic UI update — update counters immediately so the driver sees $0 balance
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
