// Spotly — WhatsApp Support Chat router (Twilio + Socket.io).
//
// Real-time two-way support desk. Customers message the business WhatsApp
// number; Twilio POSTs each inbound message to our webhook; agents reply from
// the dashboard. Every message is logged to SQLite and mirrored to connected
// dashboards over Socket.io so no refresh is ever needed.
//
// Mounted in api.js:
//   POST /api/webhooks/whatsapp         ← Twilio inbound messages   (public, signed)
//   POST /api/webhooks/whatsapp/status  ← Twilio delivery callbacks  (public, signed)
//   GET  /api/support/conversations             list threads
//   GET  /api/support/conversations/:id/messages full history + marks read
//   POST /api/support/conversations/:id/status   open|pending|closed
//   POST /api/support/reply                      agent → customer
//
// Socket.io events emitted to the `support` room:
//   new_whatsapp_message   { conversation, message }   inbound arrived
//   message_sent           { conversation, message }   agent reply persisted+sent
//   message_status         { id, provider_sid, status } delivery update
//   conversation_updated   { conversation }            status/assignment change
//
// Required env vars (see docs/WHATSAPP_SUPPORT.md):
//   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886)
// Optional:
//   SUPPORT_API_KEY          protect the /api/support/* routes (skipped if unset)
//   TWILIO_VALIDATE_WEBHOOK  '1' to enforce X-Twilio-Signature validation
//   PUBLIC_BASE_URL          used to reconstruct the signed URL behind a proxy

const express = require('express')
const crypto  = require('crypto')

const {
  insertConversation, getConversationByPhone, getConversationById, listConversations,
  touchConversation, setConversationStatus, assignConversation, clearConversationUnread,
  insertMessage, getMessagesByConversation, updateMessageStatusBySid,
} = require('./db')

// Meta's rolling customer-service window. Free-form (non-template) messages are
// only permitted within 24h of the customer's most recent inbound message.
const SESSION_WINDOW_MS = 24 * 60 * 60 * 1000

const IS_DEV = process.env.NODE_ENV !== 'production'

// ── Twilio client — lazily initialised so the server boots without credentials ─

let _twilio = null
function getTwilio() {
  if (_twilio) return _twilio
  const sid   = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!sid || !token) {
    throw Object.assign(new Error('Twilio is not configured'), { code: 'TWILIO_NOT_CONFIGURED' })
  }
  _twilio = require('twilio')(sid, token)
  return _twilio
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUSES = new Set(['open', 'pending', 'closed'])

// Twilio prefixes WhatsApp addresses with "whatsapp:"; strip to bare E.164.
const stripWa = n => String(n || '').replace(/^whatsapp:/, '').trim()
const toWa    = n => (n.startsWith('whatsapp:') ? n : `whatsapp:${n}`)

/** ms remaining in the 24h window; 0 (or negative) means the window is closed. */
function sessionRemainingMs(conversation, now = Date.now()) {
  if (!conversation?.last_customer_msg_at) return 0
  return conversation.last_customer_msg_at + SESSION_WINDOW_MS - now
}

/** Shape a DB row for the wire (camelCase + derived session fields). */
function toWireConversation(c, now = Date.now()) {
  const remaining = sessionRemainingMs(c, now)
  return {
    id:               c.id,
    phone:            c.phone,
    name:             c.name,
    status:           c.status,
    assignedAgentId:  c.assigned_agent_id || null,
    lastMessageAt:    c.last_message_at,
    lastMessagePreview: c.last_message_preview,
    lastCustomerMsgAt: c.last_customer_msg_at,
    unread:           c.unread,
    createdAt:        c.created_at,
    sessionOpen:      remaining > 0,
    sessionRemainingMs: Math.max(0, remaining),
  }
}

function toWireMessage(m) {
  return {
    id:             m.id,
    conversationId: m.conversation_id,
    direction:      m.direction,
    sender:         m.sender,
    body:           m.body,
    mediaUrl:       m.media_url || null,
    status:         m.status,
    providerSid:    m.provider_sid || null,
    createdAt:      m.created_at,
  }
}

/** Find the thread for a phone or create it. Returns the fresh DB row. */
function upsertConversation(phone, name, now) {
  let convo = getConversationByPhone.get(phone)
  if (!convo) {
    insertConversation.run({
      id: crypto.randomUUID(),
      phone,
      name: name || '',
      status: 'open',
      assigned_agent_id: '',
      last_message_at: now,
      last_message_preview: '',
      last_customer_msg_at: 0,
      unread: 0,
      created_at: now,
    })
    convo = getConversationByPhone.get(phone)
  }
  return convo
}

// ── Factory ─────────────────────────────────────────────────────────────────
// Returns an Express router. `io` may be null (Socket.io not installed yet);
// emits become no-ops and the REST surface keeps working.

function createWhatsAppChat(io) {
  const router = express.Router()
  const emit = (event, payload) => { try { io?.to('support').emit(event, payload) } catch {} }

  // ── Optional support-console guard ──────────────────────────────────────────
  function supportGuard(req, res, next) {
    const key = process.env.SUPPORT_API_KEY
    if (!key) return next() // dev / unprotected
    const provided = req.get('x-support-key') || (req.get('authorization') || '').replace(/^Bearer\s+/i, '')
    if (provided === key) return next()
    return res.status(401).json({ error: 'Unauthorized support client.' })
  }

  // ── Optional Twilio webhook signature validation ────────────────────────────
  function verifyTwilioSignature(req) {
    if (process.env.TWILIO_VALIDATE_WEBHOOK !== '1') return true
    const token = process.env.TWILIO_AUTH_TOKEN
    if (!token) return false
    const signature = req.get('x-twilio-signature') || ''
    const base = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get('host')}`
    const url  = base.replace(/\/$/, '') + req.originalUrl
    try {
      return require('twilio').validateRequest(token, signature, url, req.body || {})
    } catch {
      return false
    }
  }

  // Twilio posts application/x-www-form-urlencoded — parse only on webhook routes.
  const twilioBody = express.urlencoded({ extended: false })

  // ── Inbound: customer → us ──────────────────────────────────────────────────
  router.post('/webhooks/whatsapp', twilioBody, (req, res) => {
    if (!verifyTwilioSignature(req)) {
      return res.status(403).type('text/xml').send('<Response></Response>')
    }

    const body = req.body || {}
    const phone   = stripWa(body.From)
    const name    = body.ProfileName || ''
    const text    = body.Body || ''
    const numMedia = parseInt(body.NumMedia || '0', 10) || 0
    const mediaUrl = numMedia > 0 ? (body.MediaUrl0 || '') : ''
    const sid      = body.MessageSid || body.SmsSid || ''

    if (!phone) {
      // Nothing actionable — ack so Twilio doesn't retry.
      return res.type('text/xml').send('<Response></Response>')
    }

    const now = Date.now()
    const convo = upsertConversation(phone, name, now)

    const message = {
      id: crypto.randomUUID(),
      conversation_id: convo.id,
      direction: 'inbound',
      sender: 'customer',
      body: text,
      media_url: mediaUrl,
      status: 'received',
      provider_sid: sid,
      created_at: now,
    }
    insertMessage.run(message)
    touchConversation.run({
      id: convo.id,
      name,
      ts: now,
      preview: text || (mediaUrl ? '📎 Attachment' : ''),
      is_customer: 1,
    })

    const fresh = getConversationById.get(convo.id)
    emit('new_whatsapp_message', {
      conversation: toWireConversation(fresh, now),
      message: toWireMessage(message),
    })

    // Empty TwiML — we reply out-of-band from the dashboard, not inline.
    res.type('text/xml').send('<Response></Response>')
  })

  // ── Delivery status callbacks (sent/delivered/read/failed) ──────────────────
  router.post('/webhooks/whatsapp/status', twilioBody, (req, res) => {
    if (!verifyTwilioSignature(req)) return res.sendStatus(403)
    const sid    = req.body?.MessageSid || req.body?.SmsSid || ''
    const status = req.body?.MessageStatus || req.body?.SmsStatus || ''
    if (sid && status) {
      updateMessageStatusBySid.run({ provider_sid: sid, status })
      emit('message_status', { providerSid: sid, status })
    }
    res.sendStatus(204)
  })

  // ── List conversations (sidebar) ────────────────────────────────────────────
  router.get('/support/conversations', supportGuard, (_req, res) => {
    const now = Date.now()
    res.json(listConversations.all().map(c => toWireConversation(c, now)))
  })

  // ── Message history for one thread (also clears unread) ─────────────────────
  router.get('/support/conversations/:id/messages', supportGuard, (req, res) => {
    const convo = getConversationById.get(req.params.id)
    if (!convo) return res.status(404).json({ error: 'Conversation not found.' })
    clearConversationUnread.run(convo.id)
    const fresh = getConversationById.get(convo.id)
    emit('conversation_updated', { conversation: toWireConversation(fresh) })
    res.json({
      conversation: toWireConversation(fresh),
      messages: getMessagesByConversation.all(convo.id).map(toWireMessage),
    })
  })

  // ── Change ticket status / assignment ───────────────────────────────────────
  router.post('/support/conversations/:id/status', supportGuard, (req, res) => {
    const convo = getConversationById.get(req.params.id)
    if (!convo) return res.status(404).json({ error: 'Conversation not found.' })

    const { status, agentId } = req.body || {}
    if (status !== undefined) {
      if (!STATUSES.has(status)) {
        return res.status(400).json({ error: 'status must be open, pending or closed.' })
      }
      setConversationStatus.run({ id: convo.id, status })
    }
    if (agentId !== undefined) {
      assignConversation.run({ id: convo.id, agent_id: agentId || '' })
    }

    const fresh = getConversationById.get(convo.id)
    const wire  = toWireConversation(fresh)
    emit('conversation_updated', { conversation: wire })
    res.json(wire)
  })

  // ── Outbound: agent → customer ──────────────────────────────────────────────
  router.post('/support/reply', supportGuard, async (req, res) => {
    const { conversationId, body, mediaUrl, agentId, force } = req.body || {}
    const text = (body || '').trim()

    if (!conversationId) return res.status(400).json({ error: 'conversationId is required.' })
    if (!text && !mediaUrl) return res.status(400).json({ error: 'A message body or mediaUrl is required.' })

    const convo = getConversationById.get(conversationId)
    if (!convo) return res.status(404).json({ error: 'Conversation not found.' })

    // Meta 24-hour rule: outside the window, free-form text is rejected by Meta.
    // Block early with a clear, actionable error unless the caller opts into a
    // pre-approved template send (force + a real templated payload).
    const now = Date.now()
    const remaining = sessionRemainingMs(convo, now)
    if (remaining <= 0 && !force) {
      return res.status(409).json({
        error: 'SESSION_EXPIRED',
        message:
          "The 24-hour customer service window has closed. Meta only allows a " +
          "pre-approved message template now — free-form replies will be rejected.",
        lastCustomerMsgAt: convo.last_customer_msg_at,
      })
    }

    // Persist first (status 'queued') so the dashboard shows the bubble instantly,
    // then attempt delivery and reconcile the status.
    const message = {
      id: crypto.randomUUID(),
      conversation_id: convo.id,
      direction: 'outbound',
      sender: agentId || 'agent',
      body: text,
      media_url: mediaUrl || '',
      status: 'queued',
      provider_sid: '',
      created_at: now,
    }
    insertMessage.run(message)
    touchConversation.run({
      id: convo.id,
      name: '',
      ts: now,
      preview: text || '📎 Attachment',
      is_customer: 0,
    })

    // Send via Twilio (dev bypass when not configured).
    let providerSid = ''
    let sendStatus = 'sent'
    try {
      if (IS_DEV && (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_WHATSAPP_FROM)) {
        console.log(`[whatsapp-chat] DEV — would send to ${convo.phone}: ${text}`)
      } else {
        const twilio = getTwilio()
        const sent = await twilio.messages.create({
          from: toWa(process.env.TWILIO_WHATSAPP_FROM),
          to:   toWa(convo.phone),
          body: text || undefined,
          ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
          ...(process.env.PUBLIC_BASE_URL
            ? { statusCallback: `${process.env.PUBLIC_BASE_URL.replace(/\/$/, '')}/api/webhooks/whatsapp/status` }
            : {}),
        })
        providerSid = sent.sid
        sendStatus  = sent.status || 'sent'
      }
    } catch (err) {
      console.error('[whatsapp-chat] send failed:', err.code, err.message)
      updateMessageStatusBySid.run({ provider_sid: message.provider_sid, status: 'failed' })
      const failed = { ...toWireMessage(message), status: 'failed' }
      emit('message_status', { id: message.id, providerSid: '', status: 'failed' })
      const detail = err.code === 'TWILIO_NOT_CONFIGURED'
        ? 'WhatsApp sending is not configured on the server.'
        : 'Could not deliver the message to WhatsApp.'
      return res.status(502).json({ error: detail, message: failed })
    }

    // Reconcile persisted row with the provider result.
    if (providerSid) {
      require('./db').db
        .prepare('UPDATE messages SET provider_sid = ?, status = ? WHERE id = ?')
        .run(providerSid, sendStatus, message.id)
    } else {
      require('./db').db
        .prepare('UPDATE messages SET status = ? WHERE id = ?')
        .run(sendStatus, message.id)
    }

    const wireMessage = { ...toWireMessage(message), providerSid: providerSid || null, status: sendStatus }
    const fresh = getConversationById.get(convo.id)
    emit('message_sent', {
      conversation: toWireConversation(fresh, now),
      message: wireMessage,
    })
    res.json({ ok: true, message: wireMessage })
  })

  return router
}

module.exports = { createWhatsAppChat, SESSION_WINDOW_MS, sessionRemainingMs }
