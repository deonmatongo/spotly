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
//   GET  /api/orders/:ref                single order + audit trail
//   POST /api/orders                     create + publish to bus
//   PATCH /api/orders/:ref/status        advance status + publish to bus
//   GET  /api/merchants/:id/menu         latest menu from DB
//   PUT  /api/merchants/:id/menu         update menu + publish to bus
//   GET  /api/drivers/:id/earnings       earnings derived from delivered orders
//   GET  /api/tickets                    all tickets (admin)
//   GET  /api/tickets/:code              single ticket

const express  = require('express')
const cors     = require('cors')
const mqtt     = require('mqtt')
const { router: authRouter, requireAuth } = require('./auth')
const { router: paymentsRouter } = require('./payments')
const { router: pushRouter, sendPush } = require('./push')

const {
  DB_PATH,
  upsertFullOrder, upsertOrderStatus, insertEvent,
  getOrder, getByMerchant, getByDriver, getEventsByRef,
  countOrders, countEvents,
  upsertMenu, getMenu, countMenus,
  upsertTicket, getTicket, getTicketsByEvent, getAllTickets, countTickets,
  countPayments, countPayouts,
  rowToOrder, orderToRow,
  getUserByPhone,
} = require('./db')

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

  app.listen(API_PORT, () => {
    console.log(`[api] REST on :${API_PORT} · DB: ${DB_PATH}`)
  })
}

module.exports = { startApi }
