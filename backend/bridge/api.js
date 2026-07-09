// Spotly REST API — source-of-truth persistence layer.
//
// Connects to the same MQTT broker as the bridge/dispatch, subscribes to
// all state-bearing topics, and writes every change to SQLite.
// Mobile apps query this on startup to restore state that survived a
// broker restart or device power-cycle.
//
// Port: 4001  (bridge keeps 4000 so nothing breaks)
//
// Routes
//   GET  /api/health
//   GET  /api/orders?merchantId=X        merchant history (all statuses)
//   GET  /api/orders?driverId=X          driver delivery history
//   GET  /api/orders/mine                customer's own orders (auth required)
//   GET  /api/orders/:ref                single order + audit trail
//   POST /api/orders                     create + publish to bus
//   PATCH /api/orders/:ref/status        advance status + publish to bus
//   GET  /api/merchants/:id/menu         latest menu from DB
//   PUT  /api/merchants/:id/menu         update menu + publish to bus
//   GET  /api/merchants/:id/analytics    revenue, demand, top items (derived)
//   GET  /api/drivers/:id/earnings       earnings derived from delivered orders
//   GET  /api/listings                   catalog listings (?category, ?q, ?popular)
//   GET  /api/listings/:id               single listing (with live menu if available)
//   GET  /api/tickets                    all tickets (admin)
//   GET  /api/tickets/:code              single ticket

const express  = require('express')
const cors     = require('cors')
const http     = require('http')
const mqtt     = require('mqtt')
const { router: authRouter, requireAuth } = require('./auth')
const twilioVerifyRouter = require('./twilio-verify')
const { router: paymentsRouter } = require('./payments')
const { router: pushRouter, sendPush } = require('./push')
const { createWhatsAppChat } = require('./whatsapp-chat')
const { createAdmin } = require('./admin')
const { router: complianceRouter } = require('./compliance')
const { createOrdersOps } = require('./orders-ops')
const { createMerchantOnboard } = require('./merchant-onboard')
const { router: geoRouter } = require('./geo')
const { securityHeaders, rateLimit } = require('./security')
const { requestLogger, errorHandler, initSentry, metricsSnapshot, markStart } = require('./observability')
const { startBackups } = require('./backup')

const {
  DB_PATH, db,
  upsertFullOrder, upsertOrderStatus, insertEvent,
  getOrder, getByMerchant, getByDriver, getByCustomerPhone, getEventsByRef,
  countOrders, countEvents,
  upsertMenu, getMenu, countMenus,
  upsertTicket, getTicket, getTicketsByEvent, getAllTickets, countTickets,
  countPayments, countPayouts,
  rowToOrder, orderToRow,
  getUserByPhone, getUserById,
  getListing, listListings,
  insertBooking, getBookingsByUser, getBookingById, updateBookingStatus, patchBooking,
  insertFavorite, deleteFavorite, getFavoritesByUser,
  insertNotification, getNotifsByUser, markNotifRead, markAllNotifsRead, deleteUserNotifs,
  insertOffer, getAllOffers,
  upsertMerchantSettings, getMerchantSettings,
  insertReview, getReviewsByListing, getAllReviews,
  insertPurchasedTicket, getPurchasedTicketsByUser,
  getPayoutsByDriver,
} = require('./db')
const { seedCatalog, rowToListing } = require('./catalog')

const OFFER_SEED = [
  { id: 'o1', code: 'FRESH20',   title: '20% off groceries',   blurb: 'First grocery delivery',         detail: '20% off your first grocery order. Max discount $15.',               category: 'groceries',   discount_type: 'percent', amount: 20, min_spend: 0,  expires: 'Ends Sun, 29 Jun', colors: JSON.stringify(['#0D1B2A','#166534']), icon: 'bag-handle' },
  { id: 'o2', code: 'SPOTLY10',  title: '$10 off any booking', blurb: 'Restaurants & experiences',      detail: '$10 off when you spend $40 or more on dining or experiences.',      category: 'all',         discount_type: 'flat',    amount: 10, min_spend: 40, expires: 'Ends 5 Jul',       colors: JSON.stringify(['#15803D','#16A34A']), icon: 'restaurant' },
  { id: 'o3', code: 'FREERIDE',  title: 'Free delivery',       blurb: 'No minimum spend',               detail: 'Free delivery on your next 3 food or grocery orders.',              category: 'food',        discount_type: 'shipping', amount: 0, min_spend: 0,  expires: 'Ends 12 Jul',      colors: JSON.stringify(['#1D4ED8','#2563EB']), icon: 'bicycle' },
  { id: 'o4', code: 'LIVE15',    title: '15% off live events', blurb: 'Concerts & festivals',           detail: '15% off event tickets. Excludes VIP tiers. Max discount $25.',     category: 'events',      discount_type: 'percent', amount: 15, min_spend: 0,  expires: 'Ends 1 Aug',       colors: JSON.stringify(['#6D28D9','#7C3AED']), icon: 'ticket' },
  { id: 'o5', code: 'WELLNESS25',title: '$25 off wellness',    blurb: 'Spa & retreats',                 detail: '$25 off any experience over $80. Treat yourself.',                  category: 'experiences', discount_type: 'flat',    amount: 25, min_spend: 80, expires: 'Ends 20 Jul',      colors: JSON.stringify(['#0E7490','#0EA5E9']), icon: 'sparkles' },
]

function seedOffers(db) {
  try {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO offers (id, code, title, blurb, detail, category, discount_type, amount, min_spend, expires, colors, icon, active)
      VALUES (@id, @code, @title, @blurb, @detail, @category, @discount_type, @amount, @min_spend, @expires, @colors, @icon, 1)
    `)
    db.transaction(() => OFFER_SEED.forEach(o => stmt.run(o)))()
    console.log('[offers] seeded')
  } catch (err) {
    console.warn('[offers] seed error:', err.message)
  }
}

const API_PORT = Number(process.env.API_PORT || 4001)

function safe(s) {
  try { return s ? JSON.parse(s) : null } catch { return null }
}

function startApi(mqttUrl, opts = {}) {
  // ── MQTT write-through subscriber ──────────────────────────────────────────
  const client = mqtt.connect(mqttUrl, {
    clientId: `spotly-api-${Math.random().toString(16).slice(2, 8)}`,
    username:  opts.username,
    password:  opts.password,
    reconnectPeriod: 2000,
    clean: false,   // durable session: re-deliver retained messages on reconnect
  })

  client.on('connect', () => {
    console.log('[api] broker connected — subscribing to state topics')
    client.subscribe([
      'orders/+/status',          // every status event
      'merchants/+/orders/+',     // full order payloads
      'merchants/+/menu',         // live menu publications
      'tickets/+',                // ticket issuance + redemption
    ], { qos: 1 })
  })

  client.on('message', (topic, payload) => {
    const raw  = payload.toString()
    const data = safe(raw)
    const parts = topic.split('/')

    // orders/{ref}/status — status-only event
    if (parts[0] === 'orders' && parts[2] === 'status') {
      if (!data?.ref) return
      const now = Date.now()
      upsertOrderStatus.run({
        ref:         data.ref,
        status:      data.status || 'placed',
        driver_id:   data.driverId   || '',
        driver_name: data.driverName || '',
        updated_at:  now,
      })
      insertEvent.run({
        ref:         data.ref,
        status:      data.status,
        driver_id:   data.driverId   || null,
        driver_name: data.driverName || null,
        ts:          data.ts || now,
      })

      // Push the customer when their order status advances
      if (data.status && ['preparing', 'ready', 'picked_up', 'en_route', 'delivered', 'declined'].includes(data.status)) {
        const orderRow = getOrder.get(data.ref)
        if (orderRow?.customer_phone) {
          const customer = getUserByPhone.get(orderRow.customer_phone)
          if (customer) {
            const pushMsg = {
              preparing:  { title: 'Order confirmed 👨‍🍳', body: `${orderRow.merchant_name || 'Your merchant'} is preparing your order.` },
              ready:      { title: 'Order ready 📦', body: 'Your order is packed and waiting for your rider.' },
              picked_up:  { title: 'Rider picked up 🛵', body: 'Your order is on its way!' },
              en_route:   { title: 'Almost there 📍', body: 'Your rider is getting close.' },
              delivered:  { title: 'Delivered ✅', body: `Order ${data.ref} delivered. Enjoy!` },
              declined:   { title: 'Order declined', body: `Sorry, ${orderRow.merchant_name || 'the merchant'} couldn't accept your order.` },
            }[data.status]
            if (pushMsg) sendPush(customer.id, pushMsg.title, pushMsg.body, { ref: data.ref, status: data.status })
          }
        }
      }
    }

    // merchants/{id}/orders/{ref} — full order payload (retained)
    // Empty raw = order cleared from inbox (completed); keep the DB row.
    if (parts[0] === 'merchants' && parts[2] === 'orders' && parts[3]) {
      if (!data?.ref || !raw) return
      upsertFullOrder.run(orderToRow(data, Date.now()))

      // Push merchant on new orders
      if (data?.status === 'placed') {
        try {
          const merchants = require('./db').db.prepare("SELECT id FROM users WHERE role = 'merchant' LIMIT 5").all()
          const itemCount = (data.items || []).reduce((s, i) => s + (i.qty || 1), 0)
          for (const m of merchants) {
            sendPush(m.id, 'New order 🛎️', `${data.customerName || 'Customer'} · $${data.total?.toFixed(2) ?? '0.00'} · ${itemCount} item${itemCount !== 1 ? 's' : ''}`, { ref: data.ref, type: 'new_order' })
          }
        } catch {}
      }
    }

    // merchants/{id}/menu — full menu payload (retained)
    if (parts[0] === 'merchants' && parts[2] === 'menu') {
      if (!data) return
      upsertMenu.run({
        merchant_id: parts[1],
        items:       JSON.stringify(data.items || []),
        updated_at:  Date.now(),
      })
    }

    // tickets/{code} — ticket issuance or redemption (retained)
    if (parts[0] === 'tickets' && parts[1] && data) {
      upsertTicket.run({
        code:        data.code       || parts[1],
        event_name:  data.eventName  || '',
        tier_name:   data.tierName   || '',
        quantity:    data.quantity   || 1,
        holder:      data.holder     || '',
        status:      data.status     || 'valid',
        issued_at:   data.issuedAt   || Date.now(),
        redeemed_at: data.redeemedAt || null,
      })
    }
  })

  // ── Express REST ────────────────────────────────────────────────────────────
  initSentry()                          // no-op unless SENTRY_DSN is set
  const app = express()
  app.disable('x-powered-by')
  app.set('trust proxy', 1)             // honour X-Forwarded-For behind one proxy
  app.use(securityHeaders)
  app.use(requestLogger)
  app.use(cors())
  app.use(express.json({ limit: '1mb' }))

  // Global safety-net rate limit (generous; per-route limits are tighter).
  app.use('/api', rateLimit({ windowMs: 60_000, max: 600, name: 'global' }))

  // Auth — existing phone OTP flow. OTP endpoints are a brute-force target, so
  // cap them hard per IP (send + verify).
  const otpLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, name: 'otp' })
  app.use('/auth/otp', otpLimiter)
  app.use('/api/auth/send-otp', otpLimiter)
  app.use('/api/auth/verify-otp', otpLimiter)
  app.use('/auth', authRouter)
  // Twilio Verify WhatsApp/SMS OTP flow (new endpoints)
  app.use('/api/auth', twilioVerifyRouter)

  // Payments + payouts
  app.use('/payments', paymentsRouter)

  // Push notifications
  app.use('/push', pushRouter)

  // ── Socket.io — lazily required so the server boots without it installed ─────
  // Real-time fan-out to WhatsApp support dashboards. If socket.io isn't present
  // the chat REST surface still works; it just won't push live updates.
  const server = http.createServer(app)
  let io = null
  try {
    const { Server } = require('socket.io')
    io = new Server(server, { cors: { origin: '*' } })
    io.on('connection', socket => {
      socket.join('support')          // every dashboard subscribes to the support room
      socket.on('disconnect', () => {})
    })
    console.log('[api] socket.io ready — support dashboards will receive live updates')
  } catch (err) {
    console.warn('[api] socket.io not installed — WhatsApp dashboard live updates disabled. Run: npm install socket.io')
  }

  // WhatsApp support chat (webhooks + agent console)
  app.use('/api', createWhatsAppChat(io))

  // Admin / ops console — refunds publish a cancellation onto the bus.
  const publish = (topic, payload) => client.publish(topic, JSON.stringify(payload), { qos: 1 })
  app.use('/api/admin', createAdmin({ publish }))

  // Ops metrics (admin-only)
  app.get('/api/metrics', requireAuth(['admin']), (_req, res) => {
    res.json(metricsSnapshot(Date.now()))
  })

  // Age / ID compliance (age gate + status)
  app.use('/api/compliance', complianceRouter)

  // Order edge cases (cancel, partial/full refund, payment retry, out-of-stock).
  // notify() resolves a customer phone → user → push.
  const notify = (phone, title, body, data) => {
    try { const u = getUserByPhone.get(phone); if (u) sendPush(u.id, title, body, data) } catch {}
  }
  app.use('/api', createOrdersOps({ publish, notify }))

  // Merchant self-onboarding (signup → storefront → profile/hours/open → menu)
  app.use('/api/merchant', createMerchantOnboard({ publish }))

  // Geocoding + routing/ETAs
  app.use('/api/geo', geoRouter)

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({
      status:  'ok',
      broker:  client.connected ? 'connected' : 'disconnected',
      db:      DB_PATH,
      counts: {
        orders:   countOrders.get().n,
        events:   countEvents.get().n,
        menus:    countMenus.get().n,
        tickets:  countTickets.get().n,
        payments: countPayments.get().n,
        payouts:  countPayouts.get().n,
      },
    })
  })

  // Orders — authenticated customer's own order history
  app.get('/api/orders/mine', requireAuth(), (req, res) => {
    const user = getUserById.get(req.user.sub)
    if (!user?.phone) return res.json([])
    res.json(getByCustomerPhone.all(user.phone).map(rowToOrder))
  })

  // Orders — list
  app.get('/api/orders', (req, res) => {
    const { merchantId, driverId } = req.query
    if (merchantId) {
      return res.json(getByMerchant.all(String(merchantId)).map(rowToOrder))
    }
    if (driverId) {
      return res.json(getByDriver.all(String(driverId)).map(rowToOrder))
    }
    res.status(400).json({ error: 'merchantId or driverId query param required' })
  })

  // Orders — single with full event trail
  app.get('/api/orders/:ref', (req, res) => {
    const row = getOrder.get(req.params.ref)
    if (!row) return res.status(404).json({ error: 'not found' })
    const order = rowToOrder(row)
    order.events = getEventsByRef.all(req.params.ref)
    res.json(order)
  })

  // Orders — create (also fires onto the bus so all subscribers see it)
  app.post('/api/orders', (req, res) => {
    const o = req.body
    if (!o?.ref) return res.status(400).json({ error: 'ref required' })
    const now = Date.now()
    upsertFullOrder.run(orderToRow(o, now))
    insertEvent.run({ ref: o.ref, status: o.status || 'placed', driver_id: null, driver_name: null, ts: now })
    if (client.connected && o.merchantId) {
      const retain = { retain: true, qos: 1 }
      client.publish(`merchants/${o.merchantId}/orders/${o.ref}`, JSON.stringify(o), retain)
      client.publish(`orders/${o.ref}/status`, JSON.stringify({ ref: o.ref, status: o.status || 'placed', ts: now }), retain)
    }
    res.json({ ok: true })
  })

  // Orders — advance status (also fires onto the bus)
  app.patch('/api/orders/:ref/status', (req, res) => {
    const { status, driverId, driverName } = req.body
    if (!status) return res.status(400).json({ error: 'status required' })
    const now = Date.now()
    upsertOrderStatus.run({ ref: req.params.ref, status, driver_id: driverId || '', driver_name: driverName || '', updated_at: now })
    insertEvent.run({ ref: req.params.ref, status, driver_id: driverId || null, driver_name: driverName || null, ts: now })
    if (client.connected) {
      client.publish(
        `orders/${req.params.ref}/status`,
        JSON.stringify({ ref: req.params.ref, status, driverId, driverName, ts: now }),
        { retain: true, qos: 1 },
      )
    }
    res.json({ ok: true })
  })

  // Menu — read
  app.get('/api/merchants/:id/menu', (req, res) => {
    const row = getMenu.get(req.params.id)
    res.json({ merchantId: req.params.id, items: row ? JSON.parse(row.items || '[]') : [] })
  })

  // Menu — update (also publishes to bus so customers see it immediately)
  app.put('/api/merchants/:id/menu', (req, res) => {
    const { items } = req.body
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array' })
    const merchantId = req.params.id
    upsertMenu.run({ merchant_id: merchantId, items: JSON.stringify(items), updated_at: Date.now() })
    if (client.connected) {
      client.publish(`merchants/${merchantId}/menu`, JSON.stringify({ merchantId, items }), { retain: true, qos: 1 })
    }
    res.json({ ok: true })
  })

  // Driver earnings — derived from delivered orders assigned to this driver
  app.get('/api/drivers/:id/earnings', (req, res) => {
    const rows      = getByDriver.all(req.params.id).map(rowToOrder)
    const delivered = rows.filter(o => o.status === 'delivered')
    const BASE_PAYOUT = 3.5
    const gross = delivered.reduce((s, o) => s + BASE_PAYOUT + (o.deliveryFee || 0), 0)

    // Last 7 days per-day breakdown
    const now = Date.now()
    const DAY_MS = 86400000
    const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const weeklyEarnings = Array.from({ length: 7 }, (_, i) => {
      const dayStart = now - (now % DAY_MS) - (6 - i) * DAY_MS
      const dayEnd   = dayStart + DAY_MS
      const dayOrders = delivered.filter(o => o.placedAt >= dayStart && o.placedAt < dayEnd)
      const amount = dayOrders.reduce((s, o) => s + BASE_PAYOUT + (o.deliveryFee || 0), 0)
      return {
        label:  DAY_LABELS[new Date(dayStart).getDay()],
        amount: Math.round(amount * 100) / 100,
        trips:  dayOrders.length,
      }
    })

    res.json({
      driverId:         req.params.id,
      deliveries:       delivered.length,
      allAssigned:      rows.length,
      grossEarnings:    Number(gross.toFixed(2)),
      weeklyEarnings,
      recentDeliveries: delivered.slice(0, 50),
    })
  })

  // Tickets — all (admin)
  app.get('/api/tickets', (req, res) => {
    const { eventName } = req.query
    if (eventName) return res.json(getTicketsByEvent.all(String(eventName)))
    res.json(getAllTickets.all())
  })

  // Tickets — single
  app.get('/api/tickets/:code', (req, res) => {
    const row = getTicket.get(req.params.code)
    if (!row) return res.status(404).json({ error: 'not found' })
    res.json(row)
  })

  // Merchant analytics — derived from orders in SQLite
  app.get('/api/merchants/:id/analytics', (req, res) => {
    const merchantId = req.params.id
    const now = Date.now()
    const DAY_MS  = 86400000
    const WEEK_MS = 7 * DAY_MS

    const todayStartMs = now - (now % DAY_MS)
    const weekStartMs  = now - WEEK_MS
    const monthStartMs = now - 30 * DAY_MS

    const weekRows  = db.prepare('SELECT placed_at, total FROM orders WHERE merchant_id = ? AND status = ? AND placed_at >= ?').all(merchantId, 'done', weekStartMs)
    const todayRows = db.prepare('SELECT total FROM orders WHERE merchant_id = ? AND status = ? AND placed_at >= ?').all(merchantId, 'done', todayStartMs)

    // Group week orders by Mon–Sun label
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const dayMap = {}
    DAY_NAMES.forEach(d => { dayMap[d] = { label: d, amount: 0, orders: 0 } })
    weekRows.forEach(o => {
      const label = DAY_NAMES[new Date(o.placed_at).getDay()]
      dayMap[label].amount += o.total
      dayMap[label].orders++
    })
    const weeklyRevenue = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(l => ({
      label: l,
      amount: Math.round(dayMap[l].amount * 100) / 100,
      orders: dayMap[l].orders,
    }))

    const todayAmount = todayRows.reduce((s, o) => s + o.total, 0)
    const todayCount  = todayRows.length
    const weekAmount  = weekRows.reduce((s, o) => s + o.total, 0)
    const weekCount   = weekRows.length

    // Pending payout: last 30 days done revenue minus 12% platform fee
    const monthRows = db.prepare('SELECT total FROM orders WHERE merchant_id = ? AND status = ? AND placed_at >= ?').all(merchantId, 'done', monthStartMs)
    const pendingPayout = monthRows.reduce((s, o) => s + o.total, 0) * 0.88

    // Hourly demand (last 30 days) — normalize to 0–1
    const hourlyRows = db.prepare(`
      SELECT strftime('%H', datetime(placed_at / 1000, 'unixepoch')) AS hr, COUNT(*) AS n
      FROM orders WHERE merchant_id = ? AND placed_at >= ?
      GROUP BY hr ORDER BY hr
    `).all(merchantId, monthStartMs)

    const HOUR_LABELS = { '10':'10a','11':'11a','12':'12p','13':'1p','14':'2p','15':'3p','16':'4p','17':'5p','18':'6p','19':'7p','20':'8p' }
    const hourMap  = {}
    hourlyRows.forEach(h => { hourMap[h.hr] = h.n })
    const maxHour  = Math.max(...hourlyRows.map(h => h.n), 1)
    const orderDemand = Object.entries(HOUR_LABELS).map(([hr, label]) => ({
      hour: label,
      level: Math.round(((hourMap[hr] || 0) / maxHour) * 100) / 100,
    }))

    // Peak window from top-2 hours
    let peakWindow = '12:00 PM – 2:00 PM & 6:00 PM – 8:00 PM'
    if (hourlyRows.length >= 2) {
      const top = [...hourlyRows].sort((a, b) => b.n - a.n).slice(0, 2)
      const fmt = hr => {
        const n = parseInt(hr, 10)
        return n < 12 ? `${n}:00 AM` : n === 12 ? '12:00 PM' : `${n - 12}:00 PM`
      }
      peakWindow = `${fmt(top[0].hr)} & ${fmt(top[1].hr)}`
    }

    // Top items via json_each (SQLite 3.38+, ships with Node 18+)
    let topItems = []
    try {
      topItems = db.prepare(`
        SELECT json_extract(item.value, '$.name') AS name,
               SUM(CAST(json_extract(item.value, '$.qty') AS INTEGER)) AS sold,
               SUM(CAST(json_extract(item.value, '$.qty') AS INTEGER) * CAST(json_extract(item.value, '$.price') AS REAL)) AS revenue
        FROM orders, json_each(orders.items) AS item
        WHERE orders.merchant_id = ? AND orders.status = ? AND orders.placed_at >= ?
        GROUP BY name ORDER BY sold DESC LIMIT 8
      `).all(merchantId, 'done', monthStartMs)
        .map(r => ({ name: r.name, sold: r.sold, revenue: Math.round(r.revenue * 100) / 100 }))
    } catch { /* json_each unavailable or malformed items */ }

    res.json({
      weeklyRevenue,
      revenueSummary: {
        today: {
          amount: Math.round(todayAmount * 100) / 100,
          orders: todayCount,
          avgOrderValue: todayCount > 0 ? Math.round((todayAmount / todayCount) * 100) / 100 : 0,
        },
        week: {
          amount: Math.round(weekAmount * 100) / 100,
          orders: weekCount,
        },
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        platformFeeRate: 0.12,
      },
      orderDemand,
      peakWindow,
      topItems,
    })
  })

  // Listings catalog
  app.get('/api/listings', (req, res) => {
    const { category, q, popular } = req.query
    let sql = 'SELECT * FROM listings WHERE active = 1'
    const params = []
    if (category) { sql += ' AND category = ?'; params.push(String(category)) }
    if (popular === 'true') { sql += ' AND popular = 1' }
    if (q) {
      sql += ' AND (name LIKE ? OR cuisine LIKE ? OR tags LIKE ? OR description LIKE ?)'
      const like = `%${String(q)}%`
      params.push(like, like, like, like)
    }
    sql += ' ORDER BY popular DESC, rating DESC'
    res.json(db.prepare(sql).all(...params).map(rowToListing))
  })

  app.get('/api/listings/:id', (req, res) => {
    const row = getListing.get(Number(req.params.id))
    if (!row) return res.status(404).json({ error: 'not found' })
    const listing = rowToListing(row)
    // Inject the live menu if this listing has a connected merchant
    if (listing.merchantId) {
      const menuRow = getMenu.get(listing.merchantId)
      if (menuRow) {
        const liveItems = JSON.parse(menuRow.items || '[]')
        if (liveItems.length) listing.menu = liveItems
      }
    }
    res.json(listing)
  })

  // ── Bookings ────────────────────────────────────────────────────────────────

  const rowToBooking = r => ({
    id: r.id, listingId: r.listing_id, listingName: r.listing_name,
    listingImage: r.listing_image, date: r.date, time: r.time,
    partySize: r.party_size, confirmationCode: r.confirmation_code,
    points: r.points, status: r.status, type: r.type, canReview: !!r.can_review,
  })

  app.get('/api/bookings', requireAuth(), (req, res) => {
    const rows = getBookingsByUser.all(req.user.sub)
    res.json({
      upcoming: rows.filter(r => r.status === 'confirmed').map(rowToBooking),
      past:     rows.filter(r => r.status !== 'confirmed').map(rowToBooking),
    })
  })

  app.post('/api/bookings', requireAuth(), (req, res) => {
    const { listingId, listingName, listingImage, date, time, partySize, points, type } = req.body
    const id   = `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const code = `SPT-${Math.floor(1000 + Math.random() * 9000)}`
    insertBooking.run({
      id, user_id: req.user.sub,
      listing_id: listingId ?? 0, listing_name: listingName ?? '',
      listing_image: listingImage ?? '', date: date ?? '', time: time ?? '',
      party_size: partySize ?? 1, confirmation_code: code,
      points: points ?? 0, status: 'confirmed', type: type ?? '',
      can_review: 0, created_at: Date.now(),
    })
    res.status(201).json({
      id, listingId, listingName, listingImage, date, time,
      partySize, confirmationCode: code, points, status: 'confirmed', type, canReview: false,
    })
  })

  app.patch('/api/bookings/:id', requireAuth(), (req, res) => {
    const row = getBookingById.get(req.params.id)
    if (!row || row.user_id !== req.user.sub) return res.status(404).json({ error: 'not found' })
    const { date, time, partySize } = req.body
    patchBooking.run({
      date:       date       ?? row.date,
      time:       time       ?? row.time,
      party_size: partySize  ?? row.party_size,
      id:         req.params.id,
      user_id:    req.user.sub,
    })
    res.json(rowToBooking({ ...row, date: date ?? row.date, time: time ?? row.time, party_size: partySize ?? row.party_size }))
  })

  app.delete('/api/bookings/:id', requireAuth(), (req, res) => {
    updateBookingStatus.run('cancelled', req.params.id, req.user.sub)
    res.status(204).end()
  })

  // ── Favorites ───────────────────────────────────────────────────────────────

  app.get('/api/favorites', requireAuth(), (req, res) => {
    res.json(getFavoritesByUser.all(req.user.sub).map(r => r.listing_id))
  })

  app.post('/api/favorites/:listingId', requireAuth(), (req, res) => {
    insertFavorite.run(req.user.sub, Number(req.params.listingId), Date.now())
    res.status(201).end()
  })

  app.delete('/api/favorites/:listingId', requireAuth(), (req, res) => {
    deleteFavorite.run(req.user.sub, Number(req.params.listingId))
    res.status(204).end()
  })

  // ── Merchant settings ───────────────────────────────────────────────────────

  app.get('/api/merchant/settings', requireAuth(), (req, res) => {
    const row = getMerchantSettings.get(req.user.sub)
    res.json({ isOpen: row ? !!row.is_open : true })
  })

  app.patch('/api/merchant/settings', requireAuth(), (req, res) => {
    const isOpen = req.body.isOpen !== false
    upsertMerchantSettings.run({ user_id: req.user.sub, is_open: isOpen ? 1 : 0, updated_at: Date.now() })
    res.json({ isOpen })
  })

  // ── Notifications ───────────────────────────────────────────────────────────

  app.get('/api/notifications', requireAuth(), (req, res) => {
    res.json(getNotifsByUser.all(req.user.sub).map(r => ({
      id: r.id, type: r.type, title: r.title, body: r.body,
      read: !!r.read, createdAt: r.created_at,
    })))
  })

  app.post('/api/notifications', requireAuth(), (req, res) => {
    const { type, title, body } = req.body
    const id = `n-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    insertNotification.run({ id, user_id: req.user.sub, type: type ?? 'system', title: title ?? '', body: body ?? '', created_at: Date.now() })
    res.status(201).json({ id, type, title, body, read: false, createdAt: Date.now() })
  })

  // read-all must come before /:id to avoid route collision
  app.patch('/api/notifications/read-all', requireAuth(), (req, res) => {
    markAllNotifsRead.run(req.user.sub)
    res.status(204).end()
  })

  app.patch('/api/notifications/:id/read', requireAuth(), (req, res) => {
    markNotifRead.run(req.params.id, req.user.sub)
    res.status(204).end()
  })

  app.delete('/api/notifications', requireAuth(), (req, res) => {
    deleteUserNotifs.run(req.user.sub)
    res.status(204).end()
  })

  // ── Offers ──────────────────────────────────────────────────────────────────

  app.get('/api/offers', (req, res) => {
    res.json(getAllOffers.all().map(r => ({
      id: r.id, code: r.code, title: r.title, blurb: r.blurb, detail: r.detail,
      category: r.category, discountType: r.discount_type,
      amount: r.amount, minSpend: r.min_spend, expires: r.expires,
      colors: JSON.parse(r.colors || '[]'), icon: r.icon,
    })))
  })

  // ── Reviews ─────────────────────────────────────────────────────────────────

  app.get('/api/reviews', (req, res) => {
    const { listingId } = req.query
    const rows = listingId
      ? getReviewsByListing.all(Number(listingId))
      : getAllReviews.all()
    res.json(rows.map(r => ({
      id: r.id, listingId: r.listing_id, user: r.user_name,
      rating: r.rating, text: r.text, verified: !!r.verified,
      date: new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    })))
  })

  app.post('/api/reviews', requireAuth(), (req, res) => {
    const { listingId, rating, text } = req.body
    if (!listingId || !rating) return res.status(400).json({ error: 'listingId and rating required' })
    const user = getUserById.get(req.user.sub)
    const result = insertReview.run({
      listing_id: Number(listingId),
      user_id: req.user.sub,
      user_name: user?.name ?? 'Guest',
      rating: Number(rating),
      text: text ?? '',
      created_at: Date.now(),
    })
    res.status(201).json({
      id: result.lastInsertRowid,
      listingId: Number(listingId),
      user: user?.name ?? 'Guest',
      rating: Number(rating),
      text: text ?? '',
      verified: true,
      date: 'Just now',
    })
  })

  // ── Purchased tickets (customer) ─────────────────────────────────────────────

  app.get('/api/tickets/mine', requireAuth(), (req, res) => {
    res.json(getPurchasedTicketsByUser.all(req.user.sub).map(r => ({
      id: r.id, eventId: r.event_id, eventName: r.event_name, eventImage: r.event_image,
      eventDate: r.event_date, eventTime: r.event_time, venue: r.venue,
      tierName: r.tier_name, tierColor: r.tier_color, quantity: r.quantity,
      totalPrice: r.total_price, confirmationCode: r.confirmation_code,
      email: r.email, purchasedAt: r.purchased_at, status: r.status,
    })))
  })

  app.post('/api/tickets/mine', requireAuth(), (req, res) => {
    const t = req.body
    if (!t?.id) return res.status(400).json({ error: 'id required' })
    insertPurchasedTicket.run({
      id: t.id, user_id: req.user.sub,
      event_id: t.eventId ?? 0, event_name: t.eventName ?? '',
      event_image: t.eventImage ?? '', event_date: t.eventDate ?? '',
      event_time: t.eventTime ?? '', venue: t.venue ?? '',
      tier_name: t.tierName ?? '', tier_color: t.tierColor ?? '',
      quantity: t.quantity ?? 1, total_price: t.totalPrice ?? 0,
      confirmation_code: t.confirmationCode ?? '', email: t.email ?? '',
      purchased_at: t.purchasedAt ?? '', status: t.status ?? 'upcoming',
    })
    res.status(201).json({ ok: true })
  })

  // ── Merchant payout history ──────────────────────────────────────────────────

  // Returns computed weekly payout records derived from completed order history.
  app.get('/api/merchant/payouts', requireAuth(), (req, res) => {
    const merchantId = req.query.merchantId || 'amanzi-restaurant'
    const WEEK_MS = 7 * 86400000
    const now = Date.now()
    // Compute last 8 weeks
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const weekEnd   = now - i * WEEK_MS
      const weekStart = weekEnd - WEEK_MS
      return { weekStart, weekEnd, index: i }
    }).slice(1) // skip current (partial) week
    const records = weeks.map(({ weekStart, weekEnd, index }) => {
      const rows = db.prepare(
        'SELECT total FROM orders WHERE merchant_id = ? AND status = ? AND placed_at >= ? AND placed_at < ?'
      ).all(merchantId, 'done', weekStart, weekEnd)
      if (!rows.length) return null
      const gross = rows.reduce((s, r) => s + r.total, 0)
      const net   = Math.round(gross * 0.88 * 100) / 100
      const weekEndDate = new Date(weekEnd)
      const weekStartDate = new Date(weekStart)
      const fmt = d => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      return {
        id: `mpayout-${index}`,
        amount: net,
        date: `Mon, ${fmt(weekEndDate)}`,
        period: `${fmt(weekStartDate)}–${fmt(weekEndDate)}`,
        status: 'paid',
      }
    }).filter(Boolean)
    res.json(records)
  })

  // Terminal error handler — must be mounted AFTER every route.
  app.use(errorHandler)

  server.listen(API_PORT, () => {
    markStart(Date.now())
    console.log(`[api] REST on :${API_PORT} · DB: ${DB_PATH}`)
    seedCatalog(db)
    seedOffers(db)
    seedAdmin(db)
    if (process.env.BACKUPS !== 'off') startBackups()
  })
}

// Seed a bootstrap admin so the ops console is reachable on a fresh DB.
// Override the phone with ADMIN_PHONE; the account signs in via the normal
// OTP flow (no password) and can promote others from the console.
function seedAdmin(db) {
  try {
    const phone = process.env.ADMIN_PHONE || '+263770000000'
    const existing = db.prepare('SELECT id, role FROM users WHERE phone = ?').get(phone)
    if (!existing) {
      db.prepare('INSERT INTO users (id, phone, name, role, status, created_at) VALUES (?,?,?,?,?,?)')
        .run(require('crypto').randomUUID(), phone, 'Spotly Admin', 'admin', 'active', Date.now())
      console.log(`[admin] seeded bootstrap admin ${phone}`)
    } else if (existing.role !== 'admin') {
      db.prepare("UPDATE users SET role = 'admin' WHERE phone = ?").run(phone)
      console.log(`[admin] promoted ${phone} to admin`)
    }
  } catch (err) {
    console.warn('[admin] seed error:', err.message)
  }
}

module.exports = { startApi }
