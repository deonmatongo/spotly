import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'

export type NotifType = 'booking' | 'ticket' | 'offer' | 'order' | 'review' | 'reminder' | 'system'

export interface AppNotification {
  id: string
  type: NotifType
  title: string
  body: string
  time: string // human label, e.g. "Just now", "2h ago"
  read: boolean
}

const ICONS: Record<NotifType, keyof typeof Ionicons.glyphMap> = {
  booking: 'calendar',
  ticket: 'ticket',
  offer: 'pricetag',
  order: 'bicycle',
  review: 'star',
  reminder: 'alarm',
  system: 'notifications',
}

const TINT: Record<NotifType, string> = {
  booking: '#15803D',
  ticket: '#7C3AED',
  offer: '#D97706',
  order: '#2563EB',
  review: '#F59E0B',
  reminder: '#0EA5E9',
  system: '#6B7280',
}

export const notifIcon = (t: NotifType) => ICONS[t]
export const notifTint = (t: NotifType) => TINT[t]

interface NotificationsContextType {
  notifications: AppNotification[]
  unreadCount: number
  addNotification: (n: Omit<AppNotification, 'id' | 'time' | 'read'> & { time?: string }) => void
  markAllRead: () => void
  markRead: (id: string) => void
  clearAll: () => void
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

const SEED: AppNotification[] = [
  { id: 'n1', type: 'booking', title: 'Reservation confirmed', body: 'Your table at Amanzi Restaurant is set for Sat, 12 Jul at 7:30 PM.', time: '2h ago', read: false },
  { id: 'n2', type: 'offer', title: '20% off your first grocery order', body: 'Use code FRESH20 at checkout. Ends Sunday.', time: '5h ago', read: false },
  { id: 'n3', type: 'ticket', title: 'Winky D Live — tickets selling fast', body: 'Premium Lounge is almost sold out. Grab yours before they go.', time: 'Yesterday', read: true },
  { id: 'n4', type: 'reminder', title: 'Leave a review', body: 'How was The Braai Deck? Share your experience and earn 25 points.', time: '2d ago', read: true },
]

let seq = 0

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED)

  const addNotification: NotificationsContextType['addNotification'] = (n) => {
    seq += 1
    setNotifications(prev => [
      { id: `nx-${seq}`, time: n.time ?? 'Just now', read: false, type: n.type, title: n.title, body: n.body },
      ...prev,
    ])
  }

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  const markRead = (id: string) => setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  const clearAll = () => setNotifications([])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, markRead, clearAll }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}
