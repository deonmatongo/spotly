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
const mqtt     = require('mqtt')
const { router: authRouter, requireAuth } = require('./auth')
const { router: paymentsRouter } = require('./payments')
const { router: pushRouter, sendPush } = require('./push')

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
} = require('./db')
const { seedCatalog, rowToListing } = require('./catalog')

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
  const app = express()
  app.use(cors())
  app.use(express.json())

  // Auth
  app.use('/auth', authRouter)

  // Payments + payouts
  app.use('/payments', paymentsRouter)

  // Push notifications
  app.use('/push', pushRouter)

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
    const user = getUserById.get(req.user.id)
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
    const rows   = getByDriver.all(req.params.id).map(rowToOrder)
    const delivered = rows.filter(o => o.status === 'delivered')
    // Driver payout = base ($3.50) + delivery fee per trip
    const BASE_PAYOUT = 3.5
    const gross  = delivered.reduce((s, o) => s + BASE_PAYOUT + (o.deliveryFee || 0), 0)
    res.json({
      driverId:    req.params.id,
      deliveries:  delivered.length,
      allAssigned: rows.length,
      grossEarnings: Number(gross.toFixed(2)),
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

  app.listen(API_PORT, () => {
    console.log(`[api] REST on :${API_PORT} · DB: ${DB_PATH}`)
    seedCatalog(db)
  })
}

module.exports = { startApi }
