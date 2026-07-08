import React, { createContext, useContext, useState, ReactNode } from 'react'

export type DriverNotifType = 'order' | 'payout' | 'system' | 'promo'

export interface DriverNotification {
  id: string
  type: DriverNotifType
  title: string
  body: string
  time: string
  read: boolean
}

interface NotificationsContextType {
  notifications: DriverNotification[]
  unreadCount: number
  addNotification: (n: Omit<DriverNotification, 'id' | 'time' | 'read'> & { time?: string }) => void
  markAllRead: () => void
  markRead: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

const SEED: DriverNotification[] = [
  { id: 'd1', type: 'order', title: 'New job nearby', body: 'Amanzi Restaurant · 5.0 km · $8.50 payout', time: '5m ago', read: false },
  { id: 'd2', type: 'promo', title: 'Peak hours active 🔥', body: '1.4× surge now in Borrowdale. Go online to earn more.', time: '1h ago', read: false },
  { id: 'd3', type: 'payout', title: 'Cash-out confirmed', body: 'EcoCash received $47.20. Check your balance.', time: '3h ago', read: true },
  { id: 'd4', type: 'system', title: 'Great week!', body: 'You completed 18 deliveries this week. Top 10% in your area.', time: 'Yesterday', read: true },
]

let seq = 0

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<DriverNotification[]>(SEED)

  const addNotification: NotificationsContextType['addNotification'] = (n) => {
    seq += 1
    setNotifications(prev => [
      { id: `dn-${seq}`, time: n.time ?? 'Just now', read: false, type: n.type, title: n.title, body: n.body },
      ...prev,
    ])
  }

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
