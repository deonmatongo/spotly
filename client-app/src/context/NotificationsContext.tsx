import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { getApiUrl } from '@spotly/shared'
import { useAuth } from './AuthContext'

export type NotifType = 'booking' | 'ticket' | 'offer' | 'order' | 'review' | 'reminder' | 'system'

export interface AppNotification {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
}

const ICONS: Record<NotifType, keyof typeof Ionicons.glyphMap> = {
  booking: 'calendar', ticket: 'ticket', offer: 'pricetag', order: 'bicycle',
  review: 'star', reminder: 'alarm', system: 'notifications',
}
const TINT: Record<NotifType, string> = {
  booking: '#15803D', ticket: '#7C3AED', offer: '#D97706', order: '#2563EB',
  review: '#F59E0B', reminder: '#0EA5E9', system: '#6B7280',
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
  { id: 'n2', type: 'offer',   title: '20% off your first grocery order', body: 'Use code FRESH20 at checkout. Ends Sunday.', time: '5h ago', read: false },
  { id: 'n3', type: 'ticket',  title: 'Winky D Live — tickets selling fast', body: 'Premium Lounge is almost sold out. Grab yours before they go.', time: 'Yesterday', read: true },
  { id: 'n4', type: 'reminder', title: 'Leave a review', body: 'How was The Braai Deck? Share your experience and earn 25 points.', time: '2d ago', read: true },
]

function timeAgo(ms: number): string {
  const diff = Date.now() - ms
  const min  = Math.floor(diff / 60_000)
  const hr   = Math.floor(diff / 3_600_000)
  const day  = Math.floor(diff / 86_400_000)
  if (min < 1)  return 'Just now'
  if (hr  < 1)  return `${min}m ago`
  if (day < 1)  return `${hr}h ago`
  if (day === 1) return 'Yesterday'
  return `${day}d ago`
}

let localSeq = 0

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED)

  useEffect(() => {
    if (!user || !accessToken) return
    fetch(`${getApiUrl()}/api/notifications`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!Array.isArray(data)) return
        // Empty array means the user genuinely has no notifications yet — keep SEED for demo feel.
        if (data.length === 0) return
        setNotifications(data.map((n: any) => ({
          id: n.id, type: n.type as NotifType,
          title: n.title, body: n.body,
          time: timeAgo(n.createdAt),
          read: !!n.read,
        })))
      })
      .catch(() => {})
  }, [user?.id, accessToken])

  const addNotification = useCallback<NotificationsContextType['addNotification']>((n) => {
    localSeq += 1
    const id = `nx-${localSeq}-${Date.now()}`
    const notif: AppNotification = {
      id, type: n.type, title: n.title, body: n.body,
      time: n.time ?? 'Just now', read: false,
    }
    setNotifications(prev => [notif, ...prev])

    if (accessToken) {
      fetch(`${getApiUrl()}/api/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ type: n.type, title: n.title, body: n.body }),
      }).catch(() => {})
    }
  }, [accessToken])

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
    if (accessToken) {
      fetch(`${getApiUrl()}/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {})
    }
  }, [accessToken])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    if (accessToken) {
      fetch(`${getApiUrl()}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {})
    }
  }, [accessToken])

  const clearAll = useCallback(() => {
    setNotifications([])
    if (accessToken) {
      fetch(`${getApiUrl()}/api/notifications`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      }).catch(() => {})
    }
  }, [accessToken])

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
