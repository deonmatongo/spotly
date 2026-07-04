import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { MerchantOrder, OrderStatus, seedOrders, currentStore } from '../data/mock'
import {
  SpotlyClient, Order, DeliveryJob, canonicalToMerchant, merchantToCanonical,
  DEMO_MERCHANT_ID, DEMO_MERCHANT_NAME, MERCHANT_COORD, FALLBACK_DROPOFF, MqttStatus,
} from '@spotly/shared'

// The merchant UI speaks new/preparing/ready/done/declined; canonicalToMerchant
// and merchantToCanonical (from @spotly/shared) bridge to the bus vocabulary.
function sharedOrderToMerchant(o: Order): MerchantOrder {
  return {
    id: o.ref,
    ref: o.ref,
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    items: o.items,
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    status: canonicalToMerchant(o.status),
    placedAt: 'Just now',
    prepMinutes: o.prepMinutes ?? 20,
    driverName: o.driverName,
    address: o.address,
  }
}

function buildJob(order: MerchantOrder): DeliveryJob {
  const itemsSummary = order.items.map(i => `${i.qty}× ${i.name}`).join(', ')
  return {
    ref: order.ref,
    merchantId: DEMO_MERCHANT_ID,
    vendorName: currentStore.name,
    pickup: currentStore.address,
    pickupCoord: MERCHANT_COORD,
    dropoff: order.address,
    dropoffCoord: FALLBACK_DROPOFF,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    itemsSummary,
    distance: '5.0 km',
    estMinutes: order.prepMinutes ?? 18,
    // Simple demo payout: base + the delivery fee the customer paid.
    payout: Number((3.5 + order.deliveryFee).toFixed(2)),
    tip: 0,
    dispatchedAt: Date.now(),
  }
}

interface OrdersContextType {
  orders: MerchantOrder[]
  newOrders: MerchantOrder[]
  preparingOrders: MerchantOrder[]
  readyOrders: MerchantOrder[]
  doneOrders: MerchantOrder[]
  connection: MqttStatus
  acceptOrder: (id: string) => void
  markPreparing: (id: string) => void
  markReady: (id: string) => void
  markDone: (id: string) => void
  declineOrder: (id: string) => void
  getOrder: (id: string) => MerchantOrder | undefined
}

const OrdersContext = createContext<OrdersContextType | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<MerchantOrder[]>(seedOrders)
  const [connection, setConnection] = useState<MqttStatus>('offline')
  const clientRef = useRef<SpotlyClient | null>(null)

  useEffect(() => {
    const spotly = new SpotlyClient('merchant')
    clientRef.current = spotly
    const offStatus = spotly.onStatus(setConnection)

    // Live inbox: new customer orders arrive here (and retained ones on connect).
    const offInbox = spotly.watchInbox(
      DEMO_MERCHANT_ID,
      (order) => {
        setOrders(prev => {
          const incoming = sharedOrderToMerchant(order)
          const existing = prev.find(o => o.ref === incoming.ref)
          if (existing) {
            // Merge status/driver updates without clobbering local edits.
            return prev.map(o => o.ref === incoming.ref
              ? { ...o, status: incoming.status, driverName: incoming.driverName ?? o.driverName }
              : o)
          }
          return [incoming, ...prev]
        })
      },
      (ref) => setOrders(prev => prev.filter(o => o.ref !== ref)),
    )

    spotly.connect()
    return () => { offStatus(); offInbox(); spotly.disconnect() }
  }, [])

  const transition = (id: string, next: OrderStatus) => {
    const order = orders.find(o => o.id === id)
    if (!order) return
    const updated: MerchantOrder = { ...order, status: next }
    const spotly = clientRef.current
    if (spotly) {
      // Publish the canonical status to the customer/driver.
      spotly.setOrderStatus({ ref: order.ref, status: merchantToCanonical(next), ts: Date.now() })
      // Pull finished/declined orders off the retained inbox queue.
      if (next === 'declined' || next === 'done') {
        spotly.clearInboxOrder(DEMO_MERCHANT_ID, order.ref)
      }
      // Dispatch a delivery job to drivers the moment the order is ready.
      if (next === 'ready') {
        spotly.dispatchJob(buildJob(updated))
      }
    }
    setOrders(prev => prev.map(o => o.id === id ? updated : o))
  }

  const newOrders = orders.filter(o => o.status === 'new')
  const preparingOrders = orders.filter(o => o.status === 'preparing')
  const readyOrders = orders.filter(o => o.status === 'ready')
  const doneOrders = orders.filter(o => o.status === 'done')

  return (
    <OrdersContext.Provider value={{
      orders,
      newOrders,
      preparingOrders,
      readyOrders,
      doneOrders,
      connection,
      acceptOrder: (id) => transition(id, 'preparing'),
      markPreparing: (id) => transition(id, 'preparing'),
      markReady: (id) => transition(id, 'ready'),
      markDone: (id) => transition(id, 'done'),
      declineOrder: (id) => transition(id, 'declined'),
      getOrder: (id) => orders.find(o => o.id === id),
    }}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}
