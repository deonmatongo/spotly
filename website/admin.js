/* ══════════════════════════════════════════════════════════════════
   SPOTLY — ADMIN / OPS CONSOLE
   Subscribes to every MQTT topic, seeds mock data for the demo,
   and exposes operator actions: force-advance orders, assign drivers,
   redeem/void tickets, resolve disputes, manage users, view bridge health.
   ══════════════════════════════════════════════════════════════════ */

/* ── 1. Constants ── */
var ADMIN_EMAIL = 'admin@spotly.app'
var ADMIN_PASS  = 'spotlyops'

var ADMIN_NAV = [
  { id: 'overview',  label: 'Overview',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { id: 'orders',    label: 'Orders',    icon: 'M6 2l1.5 3h9L18 2M3 6h18l-1.5 12a2 2 0 01-2 2H6.5a2 2 0 01-2-2z' },
  { id: 'drivers',   label: 'Drivers',   icon: 'M14 16H9m10 0h1.5a1.5 1.5 0 001.5-1.5V11l-3-4h-4M3 16V6a1 1 0 011-1h10v11M6.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM16.5 19a2.5 2.5 0 100-5 2.5 2.5 0 000 5z' },
  { id: 'tickets',   label: 'Tickets',   icon: 'M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4M4 6v12a2 2 0 002 2h14v-4' },
  { id: 'disputes',  label: 'Disputes',  icon: 'M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01' },
  { id: 'users',     label: 'Users',     icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75' },
  { id: 'platform',  label: 'Platform',  icon: 'M2 13.5V19a2 2 0 002 2h16a2 2 0 002-2v-5.5M22 10.5V5a2 2 0 00-2-2H4a2 2 0 00-2 2v5.5M12 2v13M8 6l4-4 4 4' },
]

var ORDER_FLOW = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'en_route', 'delivered']
var TERMINAL   = ['delivered', 'declined', 'cancelled']
var DISPUTE_TYPES = { missing_item: 'Missing item', late_delivery: 'Late delivery', quality_issue: 'Quality issue', wrong_order: 'Wrong order', other: 'Other' }

/* ── 2. State ── */
var now = Date.now()
var ADMIN = {
  section: 'overview',
  connection: 'offline',
  orderFilter: 'all',
  userFilter: 'all',
  expandedOrder: null,
  activity: [
    { type: 'order',  text: 'SPT-1004 delivered to Rudo Chikwanda via Blessing Zhou',  ts: now - 7100000 },
    { type: 'order',  text: 'SPT-1001 picked up · driver en route to 14 Hillside Rd',  ts: now - 600000  },
    { type: 'driver', text: 'Tatenda Moyo came online',                                ts: now - 920000  },
    { type: 'order',  text: 'New order SPT-1003 from Munashe Dube at Harvest Basket',  ts: now - 60000   },
    { type: 'ticket', text: 'TKT-A002 scanned & redeemed · Harare Jazz & Soul Festival', ts: now - 3500000 },
    { type: 'order',  text: 'SPT-1005 cancelled by customer Joseph Mhuri',             ts: now - 3600000 },
    { type: 'driver', text: 'Rudo Chikwanda came online',                              ts: now - 870000  },
    { type: 'system', text: 'Dispatch engine assigned sim-rudo to SPT-0998',           ts: now - 9000000 },
  ],

  orders: {},   // ref → order object (seeded below, live-updated from MQTT)
  drivers: {},  // driverId → presence object
  tickets: {},  // code → ticket object
  jobs: {},     // ref → job object

  disputes: [
    { id: 'D001', ref: 'SPT-0987', type: 'missing_item', customerName: 'Tendai K.', merchantName: 'Harvest Basket', amount: 8.50, status: 'open', created: now - 3600000, note: 'Customer reports 3 items missing from groceries order.' },
    { id: 'D002', ref: 'SPT-0956', type: 'late_delivery', customerName: 'Farai M.', merchantName: 'Amanzi Restaurant', amount: 0, status: 'open', created: now - 7200000, note: 'Delivery took over 2 hours. Customer requesting compensation credit.' },
    { id: 'D003', ref: 'SPT-0923', type: 'quality_issue', customerName: 'Chipo B.', merchantName: 'Amanzi Restaurant', amount: 32.00, status: 'escalated', created: now - 86400000, note: 'Food arrived cold and did not match menu description. Customer escalated after no merchant response.' },
    { id: 'D004', ref: 'SPT-0901', type: 'wrong_order', customerName: 'Joseph S.', merchantName: 'Harvest Basket', amount: 15.00, status: 'resolved', created: now - 172800000, note: 'Wrong order delivered. Full refund of $15.00 processed.' },
    { id: 'D005', ref: 'SPT-0888', type: 'missing_item', customerName: 'Grace Z.', merchantName: 'Amanzi Restaurant', amount: 12.00, status: 'resolved', created: now - 259200000, note: 'Missing dessert item. Merchant issued store credit voucher.' },
  ],

  users: [
    { id: 'u1', name: 'Farai Ncube',        email: 'farai@example.com',    role: 'customer', status: 'active',    joined: 'Mar 2025', orders: 12,   spent: 980  },
    { id: 'u2', name: 'Chiedza Mhuri',      email: 'chiedza@example.com',  role: 'customer', status: 'active',    joined: 'Apr 2025', orders: 8,    spent: 640  },
    { id: 'u3', name: 'Munashe Dube',       email: 'munashe@example.com',  role: 'customer', status: 'suspended', joined: 'May 2025', orders: 5,    spent: 410  },
    { id: 'u4', name: 'Amanzi Restaurant',  email: 'amanzi@spotly.app',    role: 'merchant', status: 'verified',  joined: 'Jan 2025', orders: 3842, spent: 0    },
    { id: 'u5', name: 'Harvest Basket',     email: 'harvest@spotly.app',   role: 'merchant', status: 'verified',  joined: 'Feb 2025', orders: 1256, spent: 0    },
    { id: 'u6', name: 'Tatenda Moyo',       email: 'tatenda@spotly.app',   role: 'driver',   status: 'verified',  joined: 'Dec 2024', orders: 1284, spent: 0    },
    { id: 'u7', name: 'Rudo Chikwanda',     email: 'rudo@spotly.app',      role: 'driver',   status: 'active',    joined: 'Feb 2025', orders: 876,  spent: 0    },
    { id: 'u8', name: 'Blessing Zhou',      email: 'blessing@spotly.app',  role: 'driver',   status: 'active',    joined: 'Mar 2025', orders: 543,  spent: 0    },
  ],

  health: null,
  healthFetched: 0,
}

/* Seed orders */
;(function () {
  var seed = [
    { ref: 'SPT-1001', merchantId: 'amanzi-restaurant',  merchantName: 'Amanzi Restaurant', customerName: 'Farai Ncube',    customerPhone: '+263 77 555 0123', status: 'en_route',  total: 28.50, deliveryFee: 3.00, subtotal: 25.50, items: [{name:'Grilled Bream',qty:1,unitPrice:18},{name:'Sadza',qty:1,unitPrice:5.50},{name:'Mazondo',qty:1,unitPrice:2}], placedAt: now - 900000, address: '14 Hillside Rd, Hillside', driverId: 'tatenda-moyo', driverName: 'Tatenda Moyo' },
    { ref: 'SPT-1002', merchantId: 'amanzi-restaurant',  merchantName: 'Amanzi Restaurant', customerName: 'Chiedza Mhuri',  customerPhone: '+263 77 555 0456', status: 'preparing', total: 45.00, deliveryFee: 2.50, subtotal: 42.50, items: [{name:"Chef's Tasting Menu",qty:2,unitPrice:21.25}], placedAt: now - 300000, address: '8 Argyle Rd, Avondale', driverId: '', driverName: '' },
    { ref: 'SPT-1003', merchantId: 'harvest-basket',     merchantName: 'Harvest Basket',    customerName: 'Munashe Dube',   customerPhone: '+263 77 555 0789', status: 'placed',    total: 18.75, deliveryFee: 2.00, subtotal: 16.75, items: [{name:'Avocados x4',qty:1,unitPrice:4},{name:'Full Cream Milk',qty:2,unitPrice:3.50},{name:'Brown Bread',qty:1,unitPrice:2.25},{name:'Chicken Thighs',qty:1,unitPrice:6}], placedAt: now - 60000, address: '22 Baines Ave, CBD' },
    { ref: 'SPT-1004', merchantId: 'amanzi-restaurant',  merchantName: 'Amanzi Restaurant', customerName: 'Rudo Chikwanda', customerPhone: '+263 77 555 0321', status: 'delivered', total: 33.00, deliveryFee: 3.50, subtotal: 29.50, items: [{name:'Nyama Choma',qty:1,unitPrice:22},{name:'Coleslaw',qty:1,unitPrice:4},{name:'Maheu',qty:2,unitPrice:1.75}], placedAt: now - 7200000, address: '5 Harare Drive, Borrowdale', driverId: 'blessing-zhou', driverName: 'Blessing Zhou' },
    { ref: 'SPT-1005', merchantId: 'harvest-basket',     merchantName: 'Harvest Basket',    customerName: 'Joseph Mhuri',   customerPhone: '+263 77 555 0654', status: 'cancelled', total: 22.00, deliveryFee: 2.50, subtotal: 19.50, items: [{name:'Rice 2kg',qty:1,unitPrice:5},{name:'Cooking Oil 2L',qty:1,unitPrice:8},{name:'Tomatoes',qty:1,unitPrice:3.50},{name:'Onions',qty:1,unitPrice:3}], placedAt: now - 3600000, address: '18 Selous Ave, Avondale' },
  ]
  seed.forEach(function (o) { ADMIN.orders[o.ref] = o })
})()

/* Seed drivers */
;(function () {
  var seed = [
    { driverId: 'tatenda-moyo',  name: 'Tatenda Moyo',     online: true,  busy: true,  trips: 1284, rating: 4.9, vehicle: 'Toyota Vitz · AEK 4521',  currentRef: 'SPT-1001' },
    { driverId: 'rudo-chikwanda',name: 'Rudo Chikwanda',   online: true,  busy: false, trips: 876,  rating: 4.8, vehicle: 'Honda CG125 · ADV 1234'  },
    { driverId: 'blessing-zhou', name: 'Blessing Zhou',    online: false, busy: false, trips: 543,  rating: 4.7, vehicle: 'Yamaha FZ · BCL 7890'    },
    { driverId: 'sim-rudo',      name: 'Sim Rudo (Bot)',   online: true,  busy: false, trips: 2100, rating: 5.0, vehicle: 'Simulation'               },
    { driverId: 'sim-blessing',  name: 'Sim Blessing (Bot)',online: true, busy: false, trips: 1850, rating: 5.0, vehicle: 'Simulation'               },
  ]
  seed.forEach(function (d) { ADMIN.drivers[d.driverId] = d })
})()

/* Seed tickets */
;(function () {
  var seed = [
    { code: 'TKT-A001', eventName: 'Harare Jazz & Soul Festival',  tierName: 'VIP',              quantity: 2, holder: 'Farai Ncube',    status: 'valid',    issuedAt: now - 3600000 },
    { code: 'TKT-A002', eventName: 'Harare Jazz & Soul Festival',  tierName: 'General Admission',quantity: 1, holder: 'Chiedza Mhuri',  status: 'redeemed', issuedAt: now - 7200000, redeemedAt: now - 3500000 },
    { code: 'TKT-A003', eventName: 'Zimbabwe Comedy Night',        tierName: 'Standard',         quantity: 3, holder: 'Munashe Dube',   status: 'valid',    issuedAt: now - 1800000 },
    { code: 'TKT-A004', eventName: 'Harare Jazz & Soul Festival',  tierName: 'Early Bird',       quantity: 1, holder: 'Tatenda Sibanda',status: 'redeemed', issuedAt: now - 86400000, redeemedAt: now - 3600000 },
    { code: 'TKT-A005', eventName: 'Zimbabwe Comedy Night',        tierName: 'Standard',         quantity: 2, holder: 'Rudo Banda',     status: 'valid',    issuedAt: now - 900000  },
    { code: 'TKT-A006', eventName: 'Victoria Falls Marathon 2026', tierName: 'Full Race',        quantity: 1, holder: 'Joseph Mhuri',   status: 'valid',    issuedAt: now - 500000  },
  ]
  seed.forEach(function (t) { ADMIN.tickets[t.code] = t })
})()

/* ── 3. Auth ── */
function isAdminLoggedIn() { return localStorage.getItem('spotly_admin_auth') === '1' }

function adminLoginUser() {
  localStorage.setItem('spotly_admin_auth', '1')
  document.getElementById('view-admin-login').hidden = true
  document.getElementById('view-admin').hidden = false
  connectAdminBus()
  renderAdmin()
}

function adminLogout() {
  localStorage.removeItem('spotly_admin_auth')
  if (adminBus) { adminBus.disconnect(); adminBus = null }
  document.getElementById('view-admin').hidden = true
  document.getElementById('view-admin-login').hidden = false
}

function setupAdminLogin() {
  var form = document.getElementById('adminLoginForm')
  var err  = document.getElementById('adminLoginError')
  var eye  = document.getElementById('adminEyeBtn')
  var pwd  = document.getElementById('adminPwd')
  if (!form) return
  if (eye) eye.addEventListener('click', function () { pwd.type = pwd.type === 'password' ? 'text' : 'password' })
  document.getElementById('adminEmail').value = ADMIN_EMAIL
  form.addEventListener('submit', function (e) {
    e.preventDefault()
    var email = document.getElementById('adminEmail').value.trim().toLowerCase()
    var pass  = pwd.value
    if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
      err.hidden = true
      adminLoginUser()
    } else {
      err.hidden = false
      form.querySelectorAll('.input-wrap input').forEach(function (i) { i.style.borderColor = '#EF4444' })
      setTimeout(function () { form.querySelectorAll('.input-wrap input').forEach(function (i) { i.style.borderColor = '' }) }, 2000)
    }
  })
}

/* ── 4. MQTT bus ── */
var adminBus = null

function connectAdminBus() {
  if (adminBus || !window.SpotlyBus) return
  var S = window.SpotlyBus
  adminBus = new S.Bus('admin')
  adminBus.onStatus(function (s) {
    ADMIN.connection = s
    if (s === 'connected') pushActivity('system', 'Admin console connected to broker', Date.now())
    if (document.getElementById('view-admin') && !document.getElementById('view-admin').hidden) renderAdmin()
  })

  /* All order statuses */
  adminBus.subscribe('orders/+/status', function (payload, topic) {
    var evt = safeParse(payload); if (!evt || !evt.ref) return
    var o = ADMIN.orders[evt.ref]
    if (o) {
      o.status = evt.status
      if (evt.driverName) { o.driverName = evt.driverName; o.driverId = evt.driverId || '' }
    } else {
      ADMIN.orders[evt.ref] = { ref: evt.ref, status: evt.status, customerName: '—', merchantName: '—', total: 0, deliveryFee: 0, placedAt: evt.ts, items: [], address: '—', driverName: evt.driverName || '' }
    }
    pushActivity('order', evt.ref + ' → ' + evt.status + (evt.driverName ? ' · ' + evt.driverName : ''), evt.ts)
    reRender()
  })

  /* Merchant inbox (for full order payloads) */
  adminBus.subscribe('merchants/+/orders/+', function (payload, topic) {
    var order = safeParse(payload); if (!order || !order.ref) return
    var existing = ADMIN.orders[order.ref]
    if (!existing) {
      ADMIN.orders[order.ref] = { ref: order.ref, merchantId: order.merchantId || '', merchantName: order.merchantName || '—', customerName: order.customerName || '—', customerPhone: order.customerPhone || '', status: order.status || 'placed', total: order.total || 0, deliveryFee: order.deliveryFee || 0, subtotal: order.subtotal || 0, items: order.items || [], placedAt: order.placedAt || Date.now(), address: order.address || '—', driverName: order.driverName || '' }
      pushActivity('order', 'New order ' + order.ref + ' from ' + (order.customerName || '?') + ' at ' + (order.merchantName || '?'), order.placedAt || Date.now())
      reRender()
    } else {
      if (!existing.items.length && order.items) { existing.items = order.items }
      if (!existing.customerPhone && order.customerPhone) existing.customerPhone = order.customerPhone
    }
  })

  /* Driver presence */
  adminBus.subscribe('drivers/+/presence', function (payload, topic) {
    var p = safeParse(payload); if (!p) return
    var id = topic.split('/')[1]; if (!id) return
    var existing = ADMIN.drivers[id] || {}
    ADMIN.drivers[id] = Object.assign({}, existing, { driverId: id, name: p.name || existing.name || id, online: !!p.online, busy: !!p.busy })
    if (p.online !== existing.online) pushActivity('driver', (p.name || id) + ' is now ' + (p.online ? 'online' : 'offline'), Date.now())
    reRender()
  })

  /* Ticket events */
  adminBus.subscribe('tickets/+', function (payload, topic) {
    var t = safeParse(payload); if (!t || !t.code) return
    ADMIN.tickets[t.code] = t
    if (t.status === 'redeemed') pushActivity('ticket', t.code + ' redeemed · ' + t.eventName, t.redeemedAt || Date.now())
    reRender()
  })

  /* Jobs (dispatch queue) */
  adminBus.subscribe('jobs/+', function (payload, topic) {
    var ref = topic.split('/')[1]; if (!ref) return
    var job = safeParse(payload)
    if (job) ADMIN.jobs[ref] = job
    else delete ADMIN.jobs[ref]
    reRender()
  })

  /* Dispatch results */
  adminBus.subscribe('dispatch/+/result', function (payload, topic) {
    var r = safeParse(payload); if (!r) return
    var ref = topic.split('/')[1]
    if (r.status === 'no_driver') pushActivity('system', 'No driver available for ' + ref, Date.now())
    else if (r.driverName) pushActivity('system', ref + ' force-assigned to ' + r.driverName, Date.now())
    reRender()
  })

  adminBus.connect()
}

/* ── 5. Admin actions ── */
function adminForceStatus(ref, status) {
  var o = ADMIN.orders[ref]; if (!o) return
  o.status = status
  if (adminBus) adminBus.publish('orders/' + ref + '/status', { ref: ref, status: status, ts: Date.now() }, { retained: true })
  pushActivity('order', 'Admin forced ' + ref + ' → ' + status, Date.now())
  ADMIN.expandedOrder = null
  reRender()
}

function adminCancelOrder(ref) {
  if (!confirm('Cancel order ' + ref + '? This cannot be undone.')) return
  adminForceStatus(ref, 'cancelled')
}

function adminRedeemTicket(code) {
  var t = ADMIN.tickets[code]; if (!t) return
  t.status = 'redeemed'; t.redeemedAt = Date.now()
  if (adminBus) adminBus.publish('tickets/' + code, t, { retained: true })
  pushActivity('ticket', 'Admin redeemed ticket ' + code + ' for ' + t.holder, Date.now())
  reRender()
}

function adminVoidTicket(code) {
  if (!confirm('Void ticket ' + code + '? The holder will lose access.')) return
  var t = ADMIN.tickets[code]; if (!t) return
  t.status = 'void'
  if (adminBus) adminBus.clearRetained('tickets/' + code)
  pushActivity('ticket', 'Admin voided ticket ' + code, Date.now())
  reRender()
}

function adminForceAssign(ref, driverId) {
  var driver = ADMIN.drivers[driverId]; if (!driver) return
  var driverName = driver.name || driverId
  var o = ADMIN.orders[ref]; if (!o) return
  o.driverId = driverId; o.driverName = driverName; o.status = 'ready'
  driver.busy = true; driver.currentRef = ref
  if (adminBus) {
    adminBus.publish('orders/' + ref + '/status', { ref: ref, status: 'ready', ts: Date.now(), driverId: driverId, driverName: driverName }, { retained: true })
    /* assign in bridge for live GPS forwarding */
    fetch('http://localhost:4000/trips/' + ref + '/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ driverId: driverId }) }).catch(function () {})
  }
  pushActivity('system', 'Admin assigned ' + driverName + ' to ' + ref, Date.now())
  reRender()
}

function adminResolveDispute(id, resolution) {
  var d = ADMIN.disputes.find(function (x) { return x.id === id }); if (!d) return
  d.status = resolution
  pushActivity('dispute', 'Dispute ' + d.ref + ' marked ' + resolution + (d.amount ? ' · $' + d.amount.toFixed(2) + ' considered' : ''), Date.now())
  reRender()
}

function adminSuspendUser(id) {
  var u = ADMIN.users.find(function (x) { return x.id === id }); if (!u) return
  u.status = u.status === 'suspended' ? 'active' : 'suspended'
  reRender()
}

function adminVerifyUser(id) {
  var u = ADMIN.users.find(function (x) { return x.id === id }); if (!u) return
  u.status = 'verified'
  reRender()
}

function adminToggleOrder(ref) {
  ADMIN.expandedOrder = ADMIN.expandedOrder === ref ? null : ref
  reRender()
}

function adminSetOrderFilter(f) { ADMIN.orderFilter = f; reRender() }
function adminSetUserFilter(f)  { ADMIN.userFilter = f;  reRender() }
function adminGo(section) { ADMIN.section = section; ADMIN.expandedOrder = null; reRender() }

/* ── 6. Health API ── */
function fetchHealth() {
  fetch('http://localhost:4000/health')
    .then(function (r) { return r.json() })
    .then(function (data) { ADMIN.health = data; ADMIN.healthFetched = Date.now(); reRender() })
    .catch(function () { ADMIN.health = null })
}

/* ── 7. Render shell ── */
function reRender() {
  var el = document.getElementById('view-admin')
  if (!el || el.hidden) return
  renderAdmin()
}

function renderAdmin() {
  var el = document.getElementById('view-admin')
  var section = ADMIN_NAV.find(function (n) { return n.id === ADMIN.section }) || ADMIN_NAV[0]
  var openDisputeCount = ADMIN.disputes.filter(function (d) { return d.status === 'open' || d.status === 'escalated' }).length
  el.innerHTML = '\
    <div class="dash-shell">\
      ' + adminSidebar(section, openDisputeCount) + '\
      <main class="dash-main">\
        <header class="dash-top">\
          <div>\
            <div class="dash-h1">' + section.label + '</div>\
            <div class="dash-sub">Spotly Ops · ' + (ADMIN.connection === 'connected' ? 'live event stream' : 'demo mode — start the backend to go live') + '</div>\
          </div>\
          <div class="dash-top-right">\
            ' + liveBadge(ADMIN.connection) + '\
            <span style="font-size:12px;color:var(--s400);">' + fmtDate() + '</span>\
          </div>\
        </header>\
        <div class="dash-content">' + adminSection() + '</div>\
      </main>\
    </div>'
}

function adminSidebar(activeSection, badgeCount) {
  var orderVals = Object.values(ADMIN.orders)
  var activeOrderCount = orderVals.filter(function (o) { return !TERMINAL.includes(o.status) }).length
  return '\
    <aside class="dash-sidebar">\
      <div class="dash-logo">\
        <div class="app-logo-icon app-logo-sm"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#fff"/></svg></div>\
        <span>spotly</span>\
      </div>\
      <div class="portal-tag admin-tag">Admin · Ops</div>\
      <nav class="dash-nav">\
        ' + ADMIN_NAV.map(function (n) {
          var badge = ''
          if (n.id === 'orders' && activeOrderCount > 0) badge = '<span style="margin-left:auto;background:var(--orange);color:#fff;font-size:10px;font-weight:800;border-radius:10px;padding:1px 7px;">' + activeOrderCount + '</span>'
          if (n.id === 'disputes' && badgeCount > 0) badge = '<span style="margin-left:auto;background:var(--red);color:#fff;font-size:10px;font-weight:800;border-radius:10px;padding:1px 7px;">' + badgeCount + '</span>'
          return '<a class="dash-item ' + (n.id === ADMIN.section ? 'active' : '') + '" onclick="adminGo(\'' + n.id + '\')">\
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="' + n.icon + '"/></svg>' + n.label + badge + '</a>'
        }).join('') + '\
      </nav>\
      <div class="dash-userbox">\
        <div class="dash-avatar" style="background:var(--red-pale);color:var(--red);">A</div>\
        <div class="dash-uinfo"><div class="dash-uname">Admin</div><div class="dash-usub">admin@spotly.app</div></div>\
        <button class="dash-logout" onclick="adminLogout()" title="Sign out">\
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>\
        </button>\
      </div>\
    </aside>'
}

function adminSection() {
  switch (ADMIN.section) {
    case 'overview':  return adminOverview()
    case 'orders':    return adminOrders()
    case 'drivers':   return adminDrivers()
    case 'tickets':   return adminTickets()
    case 'disputes':  return adminDisputes()
    case 'users':     return adminUsers()
    case 'platform':  return adminPlatform()
    default:          return adminOverview()
  }
}

/* ── 8. Overview ── */
function adminOverview() {
  var orders   = Object.values(ADMIN.orders)
  var drivers  = Object.values(ADMIN.drivers)
  var gmv      = orders.filter(function (o) { return o.status === 'delivered' }).reduce(function (s, o) { return s + (o.total || 0) }, 0)
  var active   = orders.filter(function (o) { return !TERMINAL.includes(o.status) }).length
  var online   = drivers.filter(function (d) { return d.online }).length
  var openDisp = ADMIN.disputes.filter(function (d) { return d.status === 'open' || d.status === 'escalated' }).length

  var weekBars = [42, 68, 55, 80, 91, 74, gmv > 0 ? Math.min(100, Math.round(gmv / 5)) : 60]
  var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return '\
    <div class="kpi-row">\
      ' + kpi('Active orders', active, active === 0 ? 'All quiet' : 'In progress right now') + '\
      ' + kpi('Drivers online', online + ' / ' + drivers.length, drivers.filter(function (d) { return d.online && !d.busy }).length + ' available') + '\
      ' + kpi('GMV (delivered)', '$' + gmv.toFixed(2), orders.filter(function (o) { return o.status === 'delivered' }).length + ' completed orders') + '\
      ' + kpi('Open disputes', openDisp, openDisp === 0 ? 'All resolved' : 'Needs attention') + '\
    </div>\
    <div class="admin-grid-2">\
      <div>\
        <div class="dash-card">\
          <div class="dash-card-title">Weekly GMV (USD)</div>\
          <div class="bar-chart">\
            ' + weekBars.map(function (h, i) { return '<div class="bar-col"><div class="bar" style="height:' + h + '%"></div><span>' + days[i] + '</span></div>' }).join('') + '\
          </div>\
        </div>\
        <div class="dash-card">\
          <div class="dash-card-title">Live orders</div>\
          ' + (orders.filter(function (o) { return !TERMINAL.includes(o.status) }).slice(0, 4).map(function (o) { return '\
            <div class="activity-row" style="cursor:pointer" onclick="adminGo(\'orders\')">\
              <div class="activity-dot ' + statusDotClass(o.status) + '"></div>\
              <div style="flex:1"><div class="activity-main">' + o.ref + ' · ' + o.customerName + '</div>\
              <div class="activity-sub">' + o.merchantName + ' · ' + fmtStatus(o.status) + '</div></div>\
              <span class="status-chip ' + o.status + '">' + fmtStatus(o.status) + '</span>\
            </div>' }).join('') || '<div class="empty-note">No active orders.</div>') + '\
        </div>\
      </div>\
      <div>\
        <div class="dash-card">\
          <div class="dash-card-title">Drivers</div>\
          ' + drivers.slice(0, 5).map(function (d) { return '\
            <div class="activity-row">\
              <div class="dash-avatar" style="width:28px;height:28px;font-size:11px;' + (d.online ? '' : 'opacity:.5') + '">' + (d.name || '?').charAt(0) + '</div>\
              <div style="flex:1"><div class="activity-main">' + (d.name || d.driverId) + '</div>\
              <div class="activity-sub">' + (d.vehicle || '') + '</div></div>\
              ' + driverOnlinePill(d) + '\
            </div>' }).join('') + '\
        </div>\
        <div class="dash-card">\
          <div class="dash-card-title">Activity feed</div>\
          <div class="activity-feed">\
            ' + ADMIN.activity.slice(0, 6).map(function (a) { return '\
              <div class="af-item">\
                <div class="af-icon ' + a.type + '">' + afIcon(a.type) + '</div>\
                <div class="af-text">' + a.text + '</div>\
                <div class="af-time">' + relTime(a.ts) + '</div>\
              </div>' }).join('') + '\
          </div>\
        </div>\
      </div>\
    </div>'
}

/* ── 9. Orders ── */
function adminOrders() {
  var all    = Object.values(ADMIN.orders).sort(function (a, b) { return b.placedAt - a.placedAt })
  var filter = ADMIN.orderFilter
  var filtered = all.filter(function (o) {
    if (filter === 'active')    return !TERMINAL.includes(o.status)
    if (filter === 'completed') return o.status === 'delivered'
    if (filter === 'cancelled') return o.status === 'cancelled' || o.status === 'declined'
    return true
  })
  return '\
    <div class="filter-pills">\
      ' + ['all', 'active', 'completed', 'cancelled'].map(function (f) {
        var label = f.charAt(0).toUpperCase() + f.slice(1)
        var count = all.filter(function (o) {
          if (f === 'active')    return !TERMINAL.includes(o.status)
          if (f === 'completed') return o.status === 'delivered'
          if (f === 'cancelled') return o.status === 'cancelled' || o.status === 'declined'
          return true
        }).length
        return '<button class="filter-pill ' + (filter === f ? 'active' : '') + '" onclick="adminSetOrderFilter(\'' + f + '\')">' + label + ' (' + count + ')</button>'
      }).join('') + '\
    </div>\
    ' + (filtered.length ? filtered.map(adminOrderCard).join('') : '<div class="empty-note">No orders in this category.</div>'
  )
}

function adminOrderCard(o) {
  var isExpanded = ADMIN.expandedOrder === o.ref
  var nextStatus = statusNext(o.status)
  var isTerminal = TERMINAL.includes(o.status)
  var items = (o.items || []).map(function (i) { return i.qty + '× ' + i.name }).join(', ')

  var actionRow = ''
  if (!isTerminal) {
    actionRow = '\
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">\
        ' + (nextStatus ? '\
          <select class="admin-select" onchange="adminForceStatus(\'' + o.ref + '\',this.value)" onclick="event.stopPropagation()">\
            <option value="">Force advance…</option>\
            ' + ORDER_FLOW.filter(function (s) { return s !== o.status && ORDER_FLOW.indexOf(s) > ORDER_FLOW.indexOf(o.status) }).map(function (s) { return '<option value="' + s + '">' + fmtStatus(s) + '</option>' }).join('') + '\
          </select>' : '') + '\
        <button class="dbtn dbtn-red" onclick="event.stopPropagation();adminCancelOrder(\'' + o.ref + '\')">Cancel</button>\
      </div>'
  }

  var assignRow = ''
  if (!isTerminal && !o.driverName) {
    var avail = Object.values(ADMIN.drivers).filter(function (d) { return d.online && !d.busy })
    if (avail.length) {
      assignRow = '\
        <div style="margin-top:8px">\
          <select class="admin-select" onchange="adminForceAssign(\'' + o.ref + '\',this.value)" onclick="event.stopPropagation()">\
            <option value="">Assign driver…</option>\
            ' + avail.map(function (d) { return '<option value="' + d.driverId + '">' + d.name + '</option>' }).join('') + '\
          </select>\
        </div>'
    }
  }

  var detail = ''
  if (isExpanded) {
    detail = '\
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">\
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px;margin-bottom:12px">\
          <div><span style="color:var(--s500)">Customer: </span>' + o.customerName + '</div>\
          <div><span style="color:var(--s500)">Phone: </span>' + (o.customerPhone || '—') + '</div>\
          <div><span style="color:var(--s500)">Merchant: </span>' + o.merchantName + '</div>\
          <div><span style="color:var(--s500)">Driver: </span>' + (o.driverName || 'Not assigned') + '</div>\
          <div><span style="color:var(--s500)">Placed: </span>' + relTime(o.placedAt) + '</div>\
          <div><span style="color:var(--s500)">Delivery fee: </span>$' + (o.deliveryFee || 0).toFixed(2) + '</div>\
        </div>\
        <div style="font-size:13px;color:var(--s500);margin-bottom:8px">Items: <span style="color:var(--s900)">' + (items || '—') + '</span></div>\
        <div style="font-size:13px;color:var(--s500)">Drop-off: <span style="color:var(--s900)">' + o.address + '</span></div>\
        ' + assignRow + '\
        <div style="margin-top:12px">' + actionRow + '</div>\
      </div>'
  }

  return '\
    <div class="book-card order-card ' + (o.status === 'placed' || o.status === 'accepted' ? 'is-new' : '') + '" style="flex-direction:column;cursor:pointer" onclick="adminToggleOrder(\'' + o.ref + '\')">\
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">\
        <div class="book-info">\
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">\
            <span class="status-chip ' + o.status + '">' + fmtStatus(o.status) + '</span>\
            <span class="book-src">' + o.ref + ' · ' + relTime(o.placedAt) + '</span>\
          </div>\
          <div class="book-name">' + o.customerName + '</div>\
          <div class="book-meta" style="font-size:12px">' + o.merchantName + (o.driverName ? ' · 🛵 ' + o.driverName : '') + '</div>\
        </div>\
        <div style="text-align:right;flex-shrink:0">\
          <div class="book-name" style="font-family:var(--font-head)">$' + (o.total || 0).toFixed(2) + '</div>\
          <div style="font-size:11px;color:var(--s400);margin-top:2px">' + (isExpanded ? '▲ collapse' : '▼ expand') + '</div>\
        </div>\
      </div>\
      ' + detail + '\
    </div>'
}

/* ── 10. Drivers ── */
function adminDrivers() {
  var drivers = Object.values(ADMIN.drivers)
  var onlineList  = drivers.filter(function (d) { return d.online })
  var offlineList = drivers.filter(function (d) { return !d.online })
  return '\
    <div class="kpi-row">\
      ' + kpi('Total drivers', drivers.length, '') + '\
      ' + kpi('Online', onlineList.length, onlineList.filter(function (d) { return !d.busy }).length + ' available') + '\
      ' + kpi('On delivery', drivers.filter(function (d) { return d.busy }).length, '') + '\
      ' + kpi('Offline', offlineList.length, '') + '\
    </div>\
    ' + (onlineList.length ? '<div class="sec-h">Online</div>' + onlineList.map(adminDriverCard).join('') : '') + '\
    ' + (offlineList.length ? '<div class="sec-h" style="margin-top:16px">Offline</div>' + offlineList.map(adminDriverCard).join('') : '')
}

function adminDriverCard(d) {
  var pendingOrders = Object.values(ADMIN.orders).filter(function (o) { return !TERMINAL.includes(o.status) && !o.driverName })
  var canAssign = d.online && !d.busy && pendingOrders.length > 0
  return '\
    <div class="book-card" style="margin-bottom:10px">\
      <div class="book-info">\
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">\
          ' + driverOnlinePill(d) + '\
          <span style="font-size:11px;color:var(--s400)">' + (d.driverId || '') + '</span>\
        </div>\
        <div class="book-name">' + (d.name || d.driverId) + '</div>\
        <div class="book-meta">' + (d.vehicle || 'Unknown vehicle') + '</div>\
        ' + (d.currentRef ? '<div class="book-src">Active: ' + d.currentRef + '</div>' : '') + '\
      </div>\
      <div class="book-actions">\
        ' + (d.trips != null ? '<span style="font-size:13px;color:var(--s700);font-weight:600">★ ' + (d.rating || '—') + '</span>' : '') + '\
        ' + (d.trips != null ? '<div class="list-sub">' + d.trips + ' trips</div>' : '') + '\
        ' + (canAssign ? '\
          <select class="admin-select" onchange="adminForceAssign(this.value,\'' + d.driverId + '\')" style="margin-top:8px">\
            <option value="">Assign to order…</option>\
            ' + pendingOrders.map(function (o) { return '<option value="' + o.ref + '">' + o.ref + ' · ' + o.customerName + '</option>' }).join('') + '\
          </select>' : '') + '\
      </div>\
    </div>'
}

/* ── 11. Tickets ── */
function adminTickets() {
  var tickets = Object.values(ADMIN.tickets).sort(function (a, b) { return b.issuedAt - a.issuedAt })
  var validCount    = tickets.filter(function (t) { return t.status === 'valid' }).length
  var redeemedCount = tickets.filter(function (t) { return t.status === 'redeemed' }).length
  var voidCount     = tickets.filter(function (t) { return t.status === 'void' }).length
  return '\
    <div class="kpi-row">\
      ' + kpi('Total tickets', tickets.length, '') + '\
      ' + kpi('Valid', validCount, 'Not yet used') + '\
      ' + kpi('Redeemed', redeemedCount, 'Scanned at door') + '\
      ' + kpi('Voided', voidCount, 'Cancelled') + '\
    </div>\
    <div class="sec-h">All tickets</div>\
    ' + (tickets.length ? tickets.map(function (t) { return '\
      <div class="book-card" style="margin-bottom:10px">\
        <div class="book-info">\
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">\
            <span class="status-chip ' + t.status + '">' + t.status + '</span>\
            <span class="book-src">' + t.code + '</span>\
          </div>\
          <div class="book-name">' + t.eventName + '</div>\
          <div class="book-meta">' + (t.tierName || 'General') + ' · Qty: ' + t.quantity + '</div>\
          <div class="book-src">Holder: ' + t.holder + ' · Issued ' + relTime(t.issuedAt) + (t.redeemedAt ? ' · Redeemed ' + relTime(t.redeemedAt) : '') + '</div>\
        </div>\
        <div class="book-actions">\
          ' + (t.status === 'valid' ? '\
            <button class="dbtn dbtn-green" style="font-size:12px;padding:7px 12px" onclick="adminRedeemTicket(\'' + t.code + '\')">Mark redeemed</button>\
            <button class="dbtn dbtn-red" style="font-size:12px;padding:7px 12px" onclick="adminVoidTicket(\'' + t.code + '\')">Void</button>' : '') + '\
          ' + (t.status === 'redeemed' ? '<span style="font-size:12px;color:var(--s500)">✓ Used</span>' : '') + '\
          ' + (t.status === 'void' ? '<span style="font-size:12px;color:var(--red)">Voided</span>' : '') + '\
        </div>\
      </div>' }).join('') : '<div class="empty-note">No tickets issued yet.</div>'
  )
}

/* ── 12. Disputes ── */
function adminDisputes() {
  var open     = ADMIN.disputes.filter(function (d) { return d.status === 'open' })
  var escalated= ADMIN.disputes.filter(function (d) { return d.status === 'escalated' })
  var resolved = ADMIN.disputes.filter(function (d) { return d.status === 'resolved' })
  return '\
    <div class="kpi-row">\
      ' + kpi('Open', open.length, 'Needs action') + '\
      ' + kpi('Escalated', escalated.length, 'Priority review') + '\
      ' + kpi('Resolved', resolved.length, 'All time') + '\
      ' + kpi('Total', ADMIN.disputes.length, '') + '\
    </div>\
    ' + (open.concat(escalated).length ? '<div class="sec-h">Open / escalated</div>' + open.concat(escalated).map(adminDisputeCard).join('') : '<div class="empty-note">No open disputes.</div>') + '\
    ' + (resolved.length ? '<div class="sec-h" style="margin-top:16px">Resolved</div>' + resolved.map(adminDisputeCard).join('') : '')
}

function adminDisputeCard(d) {
  return '\
    <div class="book-card" style="flex-direction:column;margin-bottom:10px">\
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">\
        <div class="book-info">\
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">\
            <span class="status-chip ' + d.status + '">' + d.status + '</span>\
            <span class="book-src">' + d.ref + ' · ' + relTime(d.created) + '</span>\
          </div>\
          <div class="dispute-type">' + (DISPUTE_TYPES[d.type] || d.type) + '</div>\
          <div class="book-name">' + d.customerName + ' vs ' + d.merchantName + '</div>\
          <div class="book-meta">' + (d.amount > 0 ? 'Disputed amount: $' + d.amount.toFixed(2) : 'No financial claim') + '</div>\
          <div class="book-src" style="margin-top:6px;font-style:italic">"' + d.note + '"</div>\
        </div>\
        ' + (d.status !== 'resolved' ? '\
          <div class="book-actions">\
            <button class="dbtn dbtn-green" style="font-size:12px;padding:7px 12px" onclick="adminResolveDispute(\'' + d.id + '\',\'resolved\')">Resolve</button>\
            ' + (d.status === 'open' ? '<button class="dbtn dbtn-red" style="font-size:12px;padding:7px 12px" onclick="adminResolveDispute(\'' + d.id + '\',\'escalated\')">Escalate</button>' : '') + '\
          </div>' : '<div style="font-size:12px;color:var(--s400);padding:4px">✓ Resolved</div>') + '\
      </div>\
    </div>'
}

/* ── 13. Users ── */
function adminUsers() {
  var filter = ADMIN.userFilter
  var filtered = ADMIN.users.filter(function (u) { return filter === 'all' || u.role === filter })
  return '\
    <div class="filter-pills">\
      ' + ['all', 'customer', 'merchant', 'driver'].map(function (f) {
        var count = f === 'all' ? ADMIN.users.length : ADMIN.users.filter(function (u) { return u.role === f }).length
        var label = f.charAt(0).toUpperCase() + f.slice(1) + 's'
        if (f === 'all') label = 'All'
        return '<button class="filter-pill ' + (filter === f ? 'active' : '') + '" onclick="adminSetUserFilter(\'' + f + '\')">' + label + ' (' + count + ')</button>'
      }).join('') + '\
    </div>\
    ' + filtered.map(function (u) { return '\
      <div class="list-row">\
        <div class="cust">\
          <div class="dash-avatar" style="width:34px;height:34px;font-size:13px">' + u.name.charAt(0) + '</div>\
          <div>\
            <div class="list-name">' + u.name + '\
              <span class="role-chip ' + u.role + '" style="margin-left:8px">' + u.role + '</span>\
            </div>\
            <div class="list-sub">' + u.email + ' · since ' + u.joined + ' · ' + (u.role === 'customer' ? u.orders + ' orders' : u.role === 'driver' ? u.orders + ' trips' : u.orders + ' orders handled') + '</div>\
          </div>\
        </div>\
        <div style="display:flex;align-items:center;gap:8px">\
          <span class="status-chip ' + u.status + '">' + u.status + '</span>\
          ' + (u.status === 'suspended' ? '<button class="dbtn dbtn-green" style="font-size:12px;padding:6px 12px" onclick="adminSuspendUser(\'' + u.id + '\')">Reinstate</button>' : '') + '\
          ' + (u.status === 'active' ? '<button class="dbtn dbtn-red" style="font-size:12px;padding:6px 12px" onclick="adminSuspendUser(\'' + u.id + '\')">Suspend</button>' : '') + '\
          ' + (u.status === 'active' ? '<button class="dbtn dbtn-ghost" style="font-size:12px;padding:6px 12px" onclick="adminVerifyUser(\'' + u.id + '\')">Verify</button>' : '') + '\
        </div>\
      </div>'
    }).join('')
}

/* ── 14. Platform ── */
function adminPlatform() {
  var needsFetch = !ADMIN.health || (Date.now() - ADMIN.healthFetched > 15000)
  if (needsFetch) setTimeout(fetchHealth, 100)

  var h = ADMIN.health
  var S = window.SpotlyBus ? window.SpotlyBus.config : {}

  return '\
    <div class="sec-h">Bridge health</div>\
    <div class="dash-card">\
      ' + (h ? '\
        <div class="health-grid">\
          <div class="health-stat health-ok"><div class="health-stat-val">' + (h.accepted || 0) + '</div><div class="health-stat-lbl">GPS fixes accepted</div></div>\
          <div class="health-stat"><div class="health-stat-val">' + (h.dropped || 0) + '</div><div class="health-stat-lbl">Dropped (rate-limited)</div></div>\
          <div class="health-stat ' + ((h.invalid || 0) > 0 ? 'health-err' : '') + '"><div class="health-stat-val">' + (h.invalid || 0) + '</div><div class="health-stat-lbl">Invalid payloads</div></div>\
          <div class="health-stat"><div class="health-stat-val">' + (h.trips || 0) + '</div><div class="health-stat-lbl">Active trips tracked</div></div>\
          <div class="health-stat health-ok"><div class="health-stat-val">✓</div><div class="health-stat-lbl">Bridge reachable</div></div>\
          <div class="health-stat"><div class="health-stat-val">' + (h.uptime ? Math.floor(h.uptime / 60) + 'm' : '—') + '</div><div class="health-stat-lbl">Uptime</div></div>\
        </div>' : '\
        <div style="display:flex;align-items:center;gap:12px;padding:8px 0">\
          <div class="health-stat health-err" style="flex:none;padding:10px 16px"><div class="health-stat-val" style="font-size:16px">✕</div></div>\
          <div>\
            <div style="font-size:14px;font-weight:600;color:var(--s900)">Bridge offline</div>\
            <div style="font-size:13px;color:var(--s500);margin-top:3px">Start the backend: <code style="background:var(--d900);padding:2px 6px;border-radius:4px;font-size:12px">cd backend && node bridge/dev.js</code></div>\
          </div>\
          <button class="dbtn dbtn-ghost" style="margin-left:auto;font-size:12px" onclick="fetchHealth()">Retry</button>\
        </div>') + '\
    </div>\
    <div class="sec-h">MQTT broker config</div>\
    <div class="dash-card">\
      <div class="config-row"><span class="config-key">Host</span><span class="config-val">' + (S.getHost ? S.getHost() : 'localhost') + '</span></div>\
      <div class="config-row"><span class="config-key">WebSocket port</span><span class="config-val">9001</span></div>\
      <div class="config-row"><span class="config-key">TCP port</span><span class="config-val">1883</span></div>\
      <div class="config-row"><span class="config-key">TLS</span><span class="config-val">dev — none (prod: wss://)</span></div>\
      <div class="config-row"><span class="config-key">Auth</span><span class="config-val">dev — open (prod: ACLs + passwords)</span></div>\
      <div class="config-row"><span class="config-key">Admin bus status</span><span class="config-val">' + ADMIN.connection + '</span></div>\
    </div>\
    <div class="sec-h">Admin subscriptions</div>\
    <div class="dash-card">\
      ' + ['orders/+/status', 'merchants/+/orders/+', 'drivers/+/presence', 'tickets/+', 'jobs/+', 'dispatch/+/result'].map(function (t) { return '\
        <div class="config-row">\
          <span class="config-val">' + t + '</span>\
          <span class="status-chip ' + (ADMIN.connection === 'connected' ? 'active' : 'cancelled') + '">' + (ADMIN.connection === 'connected' ? 'live' : 'offline') + '</span>\
        </div>' }).join('') + '\
    </div>\
    <div class="sec-h">Events in memory</div>\
    <div class="kpi-row">\
      ' + kpi('Orders seen', Object.keys(ADMIN.orders).length, 'Since page load') + '\
      ' + kpi('Drivers seen', Object.keys(ADMIN.drivers).length, '') + '\
      ' + kpi('Tickets', Object.keys(ADMIN.tickets).length, '') + '\
      ' + kpi('Activity events', ADMIN.activity.length, '') + '\
    </div>'
}

/* ── 15. Helpers ── */
function safeParse(payload) {
  if (!payload) return null
  try { return JSON.parse(payload) } catch (e) { return null }
}

function pushActivity(type, text, ts) {
  ADMIN.activity.unshift({ type: type, text: text, ts: ts || Date.now() })
  if (ADMIN.activity.length > 50) ADMIN.activity.pop()
}

function relTime(ts) {
  if (!ts) return '—'
  var diff = Date.now() - ts
  if (diff < 60000) return Math.floor(diff / 1000) + 's ago'
  if (diff < 3600000) return Math.floor(diff / 60000) + 'min ago'
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago'
  return Math.floor(diff / 86400000) + 'd ago'
}

function fmtDate() {
  return new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtStatus(s) {
  return ({ placed: 'Placed', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', picked_up: 'Picked up', en_route: 'En route', delivered: 'Delivered', declined: 'Declined', cancelled: 'Cancelled' })[s] || s
}

function statusNext(current) {
  var idx = ORDER_FLOW.indexOf(current)
  return idx >= 0 && idx < ORDER_FLOW.length - 1 ? ORDER_FLOW[idx + 1] : null
}

function statusDotClass(s) {
  if (s === 'placed' || s === 'accepted') return 'pending'
  if (s === 'preparing' || s === 'ready') return 'confirmed'
  if (s === 'en_route' || s === 'picked_up') return 'confirmed'
  if (s === 'delivered') return 'confirmed'
  return 'declined'
}

function driverOnlinePill(d) {
  var cls = !d.online ? '' : d.busy ? 'is-busy' : 'is-on'
  var label = !d.online ? 'Offline' : d.busy ? 'On delivery' : 'Available'
  return '<div class="driver-online ' + cls + '"><span class="d-dot"></span>' + label + '</div>'
}

function afIcon(type) {
  if (type === 'order')  return '📦'
  if (type === 'driver') return '🛵'
  if (type === 'ticket') return '🎫'
  if (type === 'dispute')return '⚠️'
  return '⚙️'
}

function kpi(label, value, sub) {
  return '<div class="kpi"><div class="kpi-label">' + label + '</div><div class="kpi-value">' + value + '</div>' + (sub ? '<div class="kpi-sub">' + sub + '</div>' : '') + '</div>'
}

function liveBadge(status) {
  var on = status === 'connected'
  return '<span class="live-badge ' + (on ? 'on' : '') + '"><span class="live-dot"></span>' + (on ? 'Live' : (status === 'connecting' || status === 'reconnecting' ? 'Connecting…' : 'Demo')) + '</span>'
}

/* ── 16. Boot ── */
document.addEventListener('DOMContentLoaded', function () {
  setupAdminLogin()
  if (isAdminLoggedIn()) {
    document.getElementById('view-admin-login').hidden = true
    document.getElementById('view-admin').hidden = false
    connectAdminBus()
    renderAdmin()
    setInterval(reRender, 30000)  // refresh relative timestamps every 30s
  }
})
