// Shared wire types — mirror the shapes returned by backend/bridge/whatsapp-chat.js

export type TicketStatus = 'open' | 'pending' | 'closed'
export type MsgDirection = 'inbound' | 'outbound'
export type MsgStatus = 'received' | 'queued' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Conversation {
  id: string
  phone: string
  name: string
  status: TicketStatus
  assignedAgentId: string | null
  lastMessageAt: number
  lastMessagePreview: string
  lastCustomerMsgAt: number
  unread: number
  createdAt: number
  sessionOpen: boolean
  sessionRemainingMs: number
}

export interface Message {
  id: string
  conversationId: string
  direction: MsgDirection
  sender: string
  body: string
  mediaUrl: string | null
  status: MsgStatus
  providerSid: string | null
  createdAt: number
}
