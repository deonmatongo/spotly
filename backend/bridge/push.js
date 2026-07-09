// Spotly push notification service.
// Uses Expo's Push API — no API key needed for Expo managed workflow.
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/
//
// Routes (mounted at /push in api.js):
//   POST /push/token    — register device token (authenticated)
//   DELETE /push/token  — unregister on logout (authenticated)

const express = require('express')
const { requireAuth } = require('./auth')
const { upsertPushToken, getPushTokens, deletePushToken } = require('./db')

const router = express.Router()

// POST /push/token
router.post('/token', requireAuth(), (req, res) => {
  const { token } = req.body
  if (!token || !token.startsWith('ExponentPushToken[')) {
    return res.status(400).json({ error: 'valid Expo push token required' })
  }
  upsertPushToken.run({ user_id: req.user.sub, token, platform: 'expo', updated_at: Date.now() })
  console.log(`[push] registered token for ${req.user.sub}`)
  res.json({ ok: true })
})

// DELETE /push/token
router.delete('/token', requireAuth(), (req, res) => {
  const { token } = req.body
  if (token) deletePushToken.run(req.user.sub, token)
  res.json({ ok: true })
})

// Send a push notification to a user. Best-effort — never throws.
// Uses Expo's hosted push service (works for both Expo Go and standalone builds).
async function sendPush(userId, title, body, data = {}) {
  let rows
  try { rows = getPushTokens.all(userId) } catch { return }
  if (!rows.length) return

  const messages = rows.map(r => ({
    to: r.token,
    title,
    body,
    data,
    sound: 'default',
    priority: 'high',
    channelId: 'default',
  }))

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages.length === 1 ? messages[0] : messages),
    })
    if (!res.ok) {
      const err = await res.text()
      console.warn(`[push] Expo API error for ${userId}:`, err)
    } else {
      console.log(`[push] sent "${title}" → ${userId} (${rows.length} token(s))`)
    }
  } catch (err) {
    console.warn('[push] network error:', err.message)
  }
}

module.exports = { router, sendPush }
