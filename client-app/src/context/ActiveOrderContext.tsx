import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { orderBus } from '../services/orderBus'
import { notify } from '../services/notify'
import { OrderStatus, SpotlyClient } from '@spotly/shared'

// The customer's current in-progress order — the "live activity" that powers
// the Home banner and lets tracking survive navigation. Populated at checkout,
// kept in sync with the order bus, and cleared once delivered-and-rated or
// cancelled.
export interface ActiveOrder {
  ref: string
  merchantName: string
  total: number
  items: number
  address: string
  placedAt: number
  status: OrderStatus
  driverName?: string
}

interface ActiveOrderContextType {
  activeOrder: ActiveOrder | null
  startTracking: (order: Omit<ActiveOrder, 'status'> & { status?: OrderStatus }) => void
  restoreOrder: (ref: string, partial: Omit<ActiveOrder, 'status' | 'ref'>) => Promise<void>
  clearActiveOrder: () => void
}

const ActiveOrderContext = createContext<ActiveOrderContextType | null>(null)

// Lightweight REST client to look up a single order by ref (no MQTT needed).
const apiClient = new SpotlyClient('customer')

export function ActiveOrderProvider({ children }: { children: ReactNode }) {
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null)
  const offRef = useRef<(() => void) | null>(null)

  // Subscribe to the current order's live status whenever the ref changes.
  const ref = activeOrder?.ref
  useEffect(() => {
    if (!ref) return
    const off = orderBus.trackOrder(ref, evt => {
      setActiveOrder(prev => {
        if (!prev || prev.ref !== evt.ref) return prev
        // Notify on a genuine status change (skip the initial 'placed' echo).
        if (evt.status !== prev.status && evt.status !== 'placed') {
          const c = STATUS_COPY[evt.status]
          notify(`Order ${evt.ref} · ${c.label}`, evt.driverName ? `${evt.driverName} · ${c.sub}` : c.sub)
        }
        return { ...prev, status: evt.status, driverName: evt.driverName ?? prev.driverName }
      })
    })
    offRef.current = off
    return () => { off(); offRef.current = null }
  }, [ref])

  const startTracking: ActiveOrderContextType['startTracking'] = (order) => {
    setActiveOrder({ status: 'placed', ...order })
  }

  // Restore an in-flight order after an app restart — look it up by ref in the
  // persistent API so the customer doesn't lose their tracking screen.
  const restoreOrder = async (ref: string, partial: Omit<ActiveOrder, 'status' | 'ref'>) => {
    const persisted = await apiClient.getOrder(ref)
    const status = (persisted?.status ?? 'placed') as OrderStatus
    if (status === 'delivered' || status === 'cancelled' || status === 'declined') return
    setActiveOrder({ ref, status, ...partial })
  }

  const clearActiveOrder = () => {
    if (offRef.current) { offRef.current(); offRef.current = null }
    setActiveOrder(null)
  }

  return (
    <ActiveOrderContext.Provider value={{ activeOrder, startTracking, restoreOrder, clearActiveOrder }}>
      {children}
    </ActiveOrderContext.Provider>
  )
}

export function useActiveOrder() {
  const ctx = useContext(ActiveOrderContext)
  if (!ctx) throw new Error('useActiveOrder must be used within ActiveOrderProvider')
  return ctx
}

// Shared helpers so the banner and tracking screen describe status identically.
export const STATUS_COPY: Record<OrderStatus, { label: string; sub: string; icon: string }> = {
  placed: { label: 'Order placed', sub: 'Waiting for the restaurant to accept', icon: 'receipt-outline' },
  accepted: { label: 'Order accepted', sub: 'The restaurant is starting your order', icon: 'checkmark-circle-outline' },
  preparing: { label: 'Preparing your order', sub: 'The kitchen is on it', icon: 'restaurant-outline' },
  ready: { label: 'Ready — finding a rider', sub: 'Your order is packed and waiting', icon: 'bag-check-outline' },
  picked_up: { label: 'Rider picked up', sub: 'Your order is on the move', icon: 'bicycle-outline' },
  en_route: { label: 'On the way', sub: 'Your rider is heading to you', icon: 'navigate-outline' },
  delivered: { label: 'Delivered', sub: 'Enjoy! 🎉', icon: 'home-outline' },
  declined: { label: 'Order declined', sub: 'The restaurant could not take this order', icon: 'close-circle-outline' },
  cancelled: { label: 'Order cancelled', sub: 'This order was cancelled', icon: 'close-circle-outline' },
}
