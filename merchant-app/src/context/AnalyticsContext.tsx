import React, { createContext, useContext, useEffect, useState } from 'react'
import { getApiUrl, DEMO_MERCHANT_ID } from '@spotly/shared'
import {
  weeklyRevenue as mockWeeklyRevenue,
  revenueSummary as mockRevenueSummary,
  orderDemand as mockOrderDemand,
  peakWindow as mockPeakWindow,
  topItems as mockTopItems,
  RevenueDay,
} from '../data/mock'

// Compute the nearest upcoming Monday as a display string e.g. "Mon, 13 Jul"
function nextMondayLabel(): string {
  const now = new Date()
  const day = now.getDay() // 0=Sun … 6=Sat
  const daysUntil = day === 1 ? 7 : (8 - day) % 7
  const next = new Date(now)
  next.setDate(now.getDate() + daysUntil)
  return next.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

interface AnalyticsContextType {
  weeklyRevenue: RevenueDay[]
  revenueSummary: typeof mockRevenueSummary
  orderDemand: { hour: string; level: number }[]
  peakWindow: string
  topItems: { name: string; sold: number; revenue: number }[]
  loading: boolean
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  weeklyRevenue: mockWeeklyRevenue,
  revenueSummary: mockRevenueSummary,
  orderDemand: mockOrderDemand,
  peakWindow: mockPeakWindow,
  topItems: mockTopItems,
  loading: true,
})

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [weeklyRevenue, setWeeklyRevenue] = useState<RevenueDay[]>(mockWeeklyRevenue)
  const [revenueSummary, setRevenueSummary] = useState<typeof mockRevenueSummary>(mockRevenueSummary)
  const [orderDemand, setOrderDemand] = useState<{ hour: string; level: number }[]>(mockOrderDemand)
  const [peakWindow, setPeakWindow] = useState<string>(mockPeakWindow)
  const [topItems, setTopItems] = useState<{ name: string; sold: number; revenue: number }[]>(mockTopItems)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `${getApiUrl()}/api/merchants/${encodeURIComponent(DEMO_MERCHANT_ID)}/analytics`,
        )
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        if (data.weeklyRevenue) setWeeklyRevenue(data.weeklyRevenue)
        if (data.orderDemand) setOrderDemand(data.orderDemand)
        if (data.peakWindow) setPeakWindow(data.peakWindow)
        if (data.topItems) setTopItems(data.topItems)
        if (data.revenueSummary) {
          setRevenueSummary({
            ...data.revenueSummary,
            nextPayoutDate: nextMondayLabel(),
            platformFeeRate:
              data.revenueSummary.platformFeeRate ?? mockRevenueSummary.platformFeeRate,
          })
        }
      } catch {
        // silently keep mock fallback data
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <AnalyticsContext.Provider
      value={{ weeklyRevenue, revenueSummary, orderDemand, peakWindow, topItems, loading }}
    >
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics(): AnalyticsContextType {
  return useContext(AnalyticsContext)
}
