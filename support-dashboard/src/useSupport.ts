// useSupport — all data + real-time state for the support dashboard.
//
// Owns the conversation list, the active thread's messages, and the Socket.io
// connection. Inbound webhook messages and outbound confirmations arrive as
// socket events and are folded into state so the UI never needs a manual refresh.

import { useCallback, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { Conversation, Message, TicketStatus } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4001'
const SUPPORT_KEY = import.meta.env.VITE_SUPPORT_KEY ?? '' // matches server SUPPORT_API_KEY

const headers: HeadersInit = {
  'Content-Type': 'application/json',
  ...(SUPPORT_KEY ? { 'x-support-key': SUPPORT_KEY } : {}),
}

export function useSupport() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [connected, setConnected] = useState(false)
  const [sending, setSending] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const activeIdRef = useRef<string | null>(null)
  activeIdRef.current = activeId

  const active = conversations.find(c => c.id === activeId) ?? null

  // Upsert a conversation into the list, keeping it sorted by most-recent.
  const upsertConversation = useCallback((c: Conversation) => {
    setConversations(prev => {
      const next = prev.filter(x => x.id !== c.id)
      next.push(c)
      return next.sort((a, b) => b.lastMessageAt - a.lastMessageAt)
    })
  }, [])

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE}/api/support/conversations`, { headers })
      .then(r => (r.ok ? r.json() : []))
      .then((list: Conversation[]) => {
        setConversations(list)
        if (list.length && !activeIdRef.current) setActiveId(list[0].id)
      })
      .catch(() => {})
  }, [])

  // ── Socket.io real-time wiring ────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(API_BASE, { transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    // Inbound customer message (from the Twilio webhook)
    socket.on('new_whatsapp_message', ({ conversation, message }: { conversation: Conversation; message: Message }) => {
      upsertConversation(conversation)
      if (message.conversationId === activeIdRef.current) {
        setMessages(prev => [...prev, message])
      }
    })

    // Our own outbound reply was persisted + dispatched
    socket.on('message_sent', ({ conversation, message }: { conversation: Conversation; message: Message }) => {
      upsertConversation(conversation)
      if (message.conversationId === activeIdRef.current) {
        setMessages(prev =>
          prev.some(m => m.id === message.id) ? prev.map(m => (m.id === message.id ? message : m)) : [...prev, message],
        )
      }
    })

    // Delivery receipt update (sent → delivered → read / failed)
    socket.on('message_status', ({ providerSid, status }: { providerSid: string; status: Message['status'] }) => {
      setMessages(prev => prev.map(m => (m.providerSid && m.providerSid === providerSid ? { ...m, status } : m)))
    })

    // Status / assignment change (possibly from another agent)
    socket.on('conversation_updated', ({ conversation }: { conversation: Conversation }) => {
      upsertConversation(conversation)
    })

    return () => { socket.disconnect(); socketRef.current = null }
  }, [upsertConversation])

  // ── Open a thread → load its history (server also clears unread) ──────────────
  const openConversation = useCallback((id: string) => {
    setActiveId(id)
    setMessages([])
    fetch(`${API_BASE}/api/support/conversations/${id}/messages`, { headers })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return
        setMessages(data.messages)
        upsertConversation(data.conversation)
      })
      .catch(() => {})
  }, [upsertConversation])

  // ── Send an agent reply ───────────────────────────────────────────────────────
  // Returns { ok } or { error, expired } so the UI can surface the 24h block.
  const sendReply = useCallback(
    async (body: string, agentId = 'agent'): Promise<{ ok: boolean; expired?: boolean; error?: string }> => {
      if (!activeIdRef.current || !body.trim()) return { ok: false }
      setSending(true)
      try {
        const res = await fetch(`${API_BASE}/api/support/reply`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ conversationId: activeIdRef.current, body, agentId }),
        })
        if (res.status === 409) {
          const data = await res.json()
          return { ok: false, expired: true, error: data.message }
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          return { ok: false, error: data.error ?? 'Failed to send.' }
        }
        // The socket 'message_sent' event appends the bubble — nothing to do here.
        return { ok: true }
      } catch {
        return { ok: false, error: 'Network error.' }
      } finally {
        setSending(false)
      }
    },
    [],
  )

  // ── Change ticket status ──────────────────────────────────────────────────────
  const setStatus = useCallback(async (id: string, status: TicketStatus) => {
    // optimistic
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, status } : c)))
    await fetch(`${API_BASE}/api/support/conversations/${id}/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }, [])

  return {
    conversations, active, activeId, messages, connected, sending,
    openConversation, sendReply, setStatus,
  }
}
