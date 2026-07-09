import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { MerchantOrder, OrderStatus, currentStore } from '../data/mock'
import {
  SpotlyClient, Order, DeliveryJob, canonicalToMerchant, merchantToCanonical,
  DEMO_MERCHANT_ID, DEMO_MERCHANT_NAME, MERCHANT_COORD, FALLBACK_DROPOFF, MqttStatus,
} from '@spotly/shared'
import { notify } from '../services/notify'
import { useNotifications } from './NotificationsContext'

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
    placedTs: o.placedAt || Date.now(),
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
  incomingOrder: MerchantOrder | null
  dismissIncoming: () => void
  acceptOrder: (id: string) => void
  markPreparing: (id: string) => void
  markReady: (id: string) => void
  markDone: (id: string) => void
  declineOrder: (id: string) => void
  getOrder: (id: string) => MerchantOrder | undefined
}

const OrdersContext = createContext<OrdersContextType | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const { addNotification } = useNotifications()
  const [orders, setOrders] = useState<MerchantOrder[]>([])
  const [connection, setConnection] = useState<MqttStatus>('offline')
  const [incomingOrder, setIncomingOrder] = useState<MerchantOrder | null>(null)
  const clientRef = useRef<SpotlyClient | null>(null)
  // Retained orders arrive in a burst on connect; only ring for orders that
  // land after this window so we don't alert for the whole backlog.
  const alertsReady = useRef(false)
  const seenRefs = useRef<Set<string>>(new Set())

  useEffect(() => {
    const spotly = new SpotlyClient('merchant')
    clientRef.current = spotly
    const offStatus = spotly.onStatus(setConnection)
    const readyTimer = setTimeout(() => { alertsReady.current = true }, 1800)

    // Restore persisted order history from the REST API (survives broker restarts).
    spotly.getOrderHistory(DEMO_MERCHANT_ID).then(apiOrders => {
      if (!apiOrders.length) return
      setOrders(prev => {
        const existingRefs = new Set(prev.map(o => o.ref))
        const restored = apiOrders
          .filter(o => !existingRefs.has(o.ref))
          .map(sharedOrderToMerchant)
        return restored.length ? [...prev, ...restored] : prev
      })
      apiOrders.forEach(o => seenRefs.current.add(o.ref))
    })

    // Live inbox: new customer orders arrive here (and retained ones on connect).
    const offInbox = spotly.watchInbox(
      DEMO_MERCHANT_ID,
      (order) => {
        const incoming = sharedOrderToMerchant(order)
        const isBrandNew = !seenRefs.current.has(incoming.ref)
        seenRefs.current.add(incoming.ref)
        // Ring the alert only for genuinely-new orders that arrive live.
        if (isBrandNew && alertsReady.current && incoming.status === 'new') {
          setIncomingOrder(incoming)
          const notifBody = `${incoming.customerName} · $${incoming.total.toFixed(2)} · ${incoming.items.length} items`
          notify('New order 🛎️', notifBody)
          addNotification({ type: 'order', title: `New order — ${incoming.ref}`, body: notifBody })
        }
        setOrders(prev => {
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
    return () => { clearTimeout(readyTimer); offStatus(); offInbox(); spotly.disconnect() }
  }, [])

  const dismissIncoming = () => setIncomingOrder(null)

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
      incomingOrder,
      dismissIncoming,
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
