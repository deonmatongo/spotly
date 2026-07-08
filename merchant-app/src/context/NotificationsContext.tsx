import React, { createContext, useContext, useState, ReactNode } from 'react'

export type MerchantNotifType = 'order' | 'review' | 'payout' | 'system'

export interface MerchantNotification {
  id: string
  type: MerchantNotifType
  title: string
  body: string
  time: string
  read: boolean
}

interface NotificationsContextType {
  notifications: MerchantNotification[]
  unreadCount: number
  addNotification: (n: Omit<MerchantNotification, 'id' | 'time' | 'read'> & { time?: string }) => void
  markAllRead: () => void
  markRead: (id: string) => void
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

let seq = 0

const SEED: MerchantNotification[] = [
  { id: 's1', type: 'payout', title: 'Payout processed', body: 'Your weekly payout of $1,042.30 has been sent to EcoCash.', time: '2h ago', read: false },
  { id: 's2', type: 'review', title: 'New 5-star review', body: '"Food was amazing and delivery was super fast!" — Chido M.', time: '4h ago', read: false },
  { id: 's3', type: 'system', title: 'Menu auto-saved', body: 'Your menu changes were saved and published to customers.', time: 'Yesterday', read: true },
]

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<MerchantNotification[]>(SEED)

  const addNotification: NotificationsContextType['addNotification'] = (n) => {
    seq += 1
    setNotifications(prev => [
      { id: `mn-${seq}`, time: n.time ?? 'Just now', read: false, type: n.type, title: n.title, body: n.body },
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
