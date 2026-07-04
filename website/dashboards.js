/* ══════════════════════════════════════════
   SPOTLY — BUSINESS & DRIVER DEMO DASHBOARDS
   Mock data representing real customer activity
   coming from the Spotly customer mobile app.
   ══════════════════════════════════════════ */

/* ───────────────── BUSINESS ───────────────── */
const BIZ = {
  name: 'Amanzi Restaurant',
  type: 'Fine Dining · Highlands, Harare',
  verified: true,
  rating: 4.8,
  reviewCount: 642,
  section: 'overview',
  orders: [],            // live delivery orders from the customer app (via the bus)
  connection: 'offline', // bus connection status
  bookings: [
    { id: 'b1', customer: 'Farai Ncube',     party: 4, date: 'Today',      time: '7:30 PM', note: 'Window seat if possible', status: 'pending',   source: 'Mobile app' },
    { id: 'b2', customer: 'Chiedza Mhuri',    party: 2, date: 'Today',      time: '8:00 PM', note: 'Anniversary',            status: 'pending',   source: 'Mobile app' },
    { id: 'b3', customer: 'Tatenda Sibanda',  party: 6, date: 'Tomorrow',   time: '6:30 PM', note: '',                       status: 'confirmed', source: 'Mobile app' },
    { id: 'b4', customer: 'Rudo Chikwanda',   party: 2, date: 'Sat 28 Jun', time: '7:00 PM', note: 'Vegetarian',             status: 'confirmed', source: 'Mobile app' },
  ],
  services: [
    { id: 's1', name: 'Dinner Reservation', price: 0,  desc: 'Table booking · à la carte', active: true },
    { id: 's2', name: 'Chef\'s Tasting Menu', price: 65, desc: '7 courses · per person',    active: true },
    { id: 's3', name: 'Private Dining Room', price: 250, desc: 'Up to 12 guests',           active: true },
    { id: 's4', name: 'Lake-view Terrace',   price: 35, desc: 'Premium seating · per head', active: false },
  ],
  promos: [
    { id: 'p1', code: 'AMANZI20', desc: '20% off Sunday lunch', active: true },
    { id: 'p2', code: 'DATENIGHT', desc: 'Free dessert for two', active: true },
  ],
  customers: [
    { name: 'Farai Ncube',    visits: 12, spent: 980, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face' },
    { name: 'Chiedza Mhuri',  visits: 8,  spent: 640, avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=80&h=80&fit=crop&crop=face' },
    { name: 'Munashe Dube',   visits: 5,  spent: 410, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face' },
    { name: 'Tatenda Sibanda',visits: 3,  spent: 295, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face' },
  ],
  reviews: [
    { id: 'r1', user: 'Farai Ncube', rating: 5, date: 'Jun 2025', text: 'The bream was cooked to perfection and the terrace at sunset is something special.', reply: '' },
    { id: 'r2', user: 'Chiedza Mhuri', rating: 4, date: 'May 2025', text: 'Creative Zimbabwean fusion tasting menu, warm service.', reply: 'Thank you Chiedza — see you again soon!' },
  ],
  photos: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop',
  ],
  earnings: { today: 1240, week: 8650, month: 34200, pending: 2150 },
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  closedDays: { Mon: true },
}

const BIZ_NAV = [
  { id: 'overview',   label: 'Overview',    icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { id: 'orders',     label: 'Orders',      icon: 'M6 2l1.5 3h9L18 2M3 6h18l-1.5 12a2 2 0 01-2 2H6.5a2 2 0 01-2-2z' },
  { id: 'bookings',   label: 'Bookings',    icon: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18' },
  { id: 'services',   label: 'Services',    icon: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z' },
  { id: 'calendar',   label: 'Availability',icon: 'M3 4h18v18H3zM16 2v4M8 2v4M3 10h18' },
  { id: 'earnings',   label: 'Earnings',    icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id: 'customers',  label: 'Customers',   icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8z' },
  { id: 'promotions', label: 'Promotions',  icon: 'M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4M4 6v12a2 2 0 002 2h14v-4' },
  { id: 'reviews',    label: 'Reviews',     icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z' },
  { id: 'profile',    label: 'Profile',     icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
]

function showBusiness() {
  if (typeof hideAuthViews === 'function') hideAuthViews()
  document.getElementById('view-driver').hidden = true
  document.getElementById('view-business').hidden = false
  bizConnectBus()
  renderBiz()
}
function bizGo(section) { BIZ.section = section; renderBiz() }

/* ── Live order bus (mirrors merchant-app OrdersContext) ── */
var bizBus = null
function bizVisible() { return !document.getElementById('view-business').hidden }

function bizConnectBus() {
  if (bizBus || !window.SpotlyBus) return
  var S = window.SpotlyBus
  bizBus = new S.Bus('merchant')
  bizBus.onStatus(function (s) { BIZ.connection = s; if (bizVisible()) renderBiz() })
  bizBus.watchInbox(S.config.DEMO_MERCHANT_ID,
    function (order) { bizUpsertOrder(order); if (bizVisible()) renderBiz() },
    function (ref) { BIZ.orders = BIZ.orders.filter(function (o) { return o.ref !== ref }); if (bizVisible()) renderBiz() }
  )
  bizBus.connect()
}

// canonical order status -> merchant vocabulary (matches shared/adapters.ts)
function canonicalToMerchant(s) {
  switch (s) {
    case 'placed': return 'new'
    case 'accepted': case 'preparing': return 'preparing'
    case 'ready': return 'ready'
    case 'picked_up': case 'en_route': case 'delivered': return 'done'
    case 'declined': case 'cancelled': return 'declined'
    default: return 'new'
  }
}
function merchantToCanonical(s) {
  switch (s) {
    case 'new': return 'placed'
    case 'preparing': return 'preparing'
    case 'ready': return 'ready'
    case 'done': return 'delivered'
    case 'declined': return 'declined'
    default: return 'placed'
  }
}

function bizUpsertOrder(order) {
  var mStatus = canonicalToMerchant(order.status)
  var existing = BIZ.orders.find(function (o) { return o.ref === order.ref })
  if (existing) {
    existing.status = mStatus
    if (order.driverName) existing.driverName = order.driverName
  } else {
    BIZ.orders.unshift({
      ref: order.ref, customer: order.customerName, phone: order.customerPhone,
      items: order.items || [], total: order.total, subtotal: order.subtotal,
      deliveryFee: order.deliveryFee, address: order.address,
      prepMinutes: order.prepMinutes || 20, status: mStatus, driverName: order.driverName || '',
      fresh: true,
    })
  }
}

function bizOrderAction(ref, next) {
  var o = BIZ.orders.find(function (x) { return x.ref === ref }); if (!o) return
  o.status = next; o.fresh = false
  if (bizBus) {
    bizBus.setOrderStatus({ ref: ref, status: merchantToCanonical(next), ts: Date.now() })
    if (next === 'declined' || next === 'done') bizBus.clearInboxOrder(window.SpotlyBus.config.DEMO_MERCHANT_ID, ref)
    if (next === 'ready') bizBus.dispatchJob(bizBuildJob(o))
  }
  renderBiz()
}

function bizBuildJob(o) {
  var S = window.SpotlyBus.config
  return {
    ref: o.ref, merchantId: S.DEMO_MERCHANT_ID, vendorName: BIZ.name,
    pickup: '225 Enterprise Road, Highlands, Harare', pickupCoord: S.MERCHANT_COORD,
    dropoff: o.address, dropoffCoord: S.FALLBACK_DROPOFF,
    customerName: o.customer, customerPhone: o.phone,
    itemsSummary: (o.items || []).map(function (i) { return i.qty + '× ' + i.name }).join(', '),
    distance: '5.0 km', estMinutes: o.prepMinutes || 18,
    payout: Number((3.5 + (o.deliveryFee || 2.9)).toFixed(2)), tip: 0, dispatchedAt: Date.now(),
  }
}

function renderBiz() {
  const el = document.getElementById('view-business')
  el.innerHTML = `
    <div class="dash-shell">
      ${dashSidebar('Business', BIZ.name, BIZ.type, BIZ_NAV, BIZ.section, 'bizGo')}
      <main class="dash-main">
        <header class="dash-top">
          <div>
            <div class="dash-h1">${BIZ_NAV.find(n => n.id === BIZ.section).label}</div>
            <div class="dash-sub">${BIZ.name}${BIZ.verified ? ' · <span class="verified-pill">✓ Verified</span>' : ''}</div>
          </div>
          <div class="dash-top-right">
            ${liveBadge(BIZ.connection)}
            <span class="dash-rating">★ ${BIZ.rating} (${BIZ.reviewCount})</span>
          </div>
        </header>
        <div class="dash-content">${bizSection()}</div>
      </main>
    </div>`
}

function bizSection() {
  switch (BIZ.section) {
    case 'overview':   return bizOverview()
    case 'orders':     return bizOrders()
    case 'bookings':   return bizBookings()
    case 'services':   return bizServices()
    case 'calendar':   return bizCalendar()
    case 'earnings':   return bizEarnings()
    case 'customers':  return bizCustomers()
    case 'promotions': return bizPromotions()
    case 'reviews':    return bizReviews()
    case 'profile':    return bizProfile()
    default:           return bizOverview()
  }
}

function bizOverview() {
  const pending = BIZ.bookings.filter(b => b.status === 'pending').length
  const chart = [62, 48, 71, 55, 88, 96, 40]
  return `
    <div class="kpi-row">
      ${kpi('Live orders', BIZ.orders.filter(o=>o.status!=='done'&&o.status!=='declined').length, 'Active right now from the app')}
      ${kpi('Revenue today', '$' + BIZ.earnings.today.toLocaleString(), '+12% vs yesterday')}
      ${kpi('Pending bookings', pending, 'Awaiting your response')}
      ${kpi('Rating', BIZ.rating, BIZ.reviewCount + ' reviews')}
    </div>
    <div class="dash-grid-2">
      <div class="dash-card">
        <div class="dash-card-title">Bookings this week</div>
        <div class="bar-chart">
          ${chart.map((h,i)=>`<div class="bar-col"><div class="bar" style="height:${h}%"></div><span>${BIZ.days[i]}</span></div>`).join('')}
        </div>
      </div>
      <div class="dash-card">
        <div class="dash-card-title">Recent activity</div>
        ${BIZ.bookings.slice(0,4).map(b=>`
          <div class="activity-row">
            <div class="activity-dot ${b.status}"></div>
            <div><div class="activity-main">${b.customer} · ${b.party} guests</div>
            <div class="activity-sub">${b.date} ${b.time} · ${b.source}</div></div>
            <span class="status-chip ${b.status}">${b.status}</span>
          </div>`).join('')}
      </div>
    </div>`
}

function bizOrders() {
  if (!BIZ.orders.length) {
    return `<div class="empty-note">No live orders yet. Orders placed in the Spotly customer app land here the instant they're sent — try placing one, or they'll appear when the app is connected.</div>`
  }
  const active = BIZ.orders.filter(o => o.status !== 'done' && o.status !== 'declined')
  const past   = BIZ.orders.filter(o => o.status === 'done' || o.status === 'declined')
  return `
    ${active.length ? `<div class="sec-h">Live orders (${active.length})</div>${active.map(orderCard).join('')}` : '<div class="empty-note">No active orders right now 🎉</div>'}
    ${past.length ? `<div class="sec-h" style="margin-top:22px">Completed</div>${past.map(orderCard).join('')}` : ''}`
}

function orderCard(o) {
  const items = (o.items || []).map(i => `${i.qty}× ${i.name}`).join(', ')
  let actions = ''
  if (o.status === 'new') {
    actions = `
      <button class="dbtn dbtn-green" onclick="bizOrderAction('${o.ref}','preparing')">Accept</button>
      <button class="dbtn dbtn-ghost" onclick="bizOrderAction('${o.ref}','declined')">Decline</button>`
  } else if (o.status === 'preparing') {
    actions = `<button class="dbtn dbtn-green" onclick="bizOrderAction('${o.ref}','ready')">Mark ready · dispatch</button>`
  } else if (o.status === 'ready') {
    actions = `<span class="list-sub">${o.driverName ? '🛵 ' + o.driverName + ' assigned' : 'Awaiting driver…'}</span>
      <button class="dbtn dbtn-ghost" onclick="bizOrderAction('${o.ref}','done')">Mark collected</button>`
  }
  return `
    <div class="book-card order-card ${o.status === 'new' ? 'is-new' : ''} ${o.fresh ? 'fresh' : ''}">
      <div class="book-info">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
          <span class="status-chip ${o.status}">${o.status}</span>
          <span class="book-src">${o.ref}</span>
        </div>
        <div class="book-name">${o.customer}</div>
        <div class="book-meta">${items || '—'}</div>
        <div class="book-src">📍 ${o.address}</div>
      </div>
      <div class="book-actions">
        <div class="book-name" style="font-family:var(--font-head)">$${(o.total || 0).toFixed(2)}</div>
        ${actions}
      </div>
    </div>`
}

function bizBookings() {
  const row = b => `
    <div class="book-card">
      <div class="book-info">
        <div class="book-name">${b.customer}</div>
        <div class="book-meta">📅 ${b.date} · ${b.time} · 👥 ${b.party} guests</div>
        ${b.note ? `<div class="book-note">“${b.note}”</div>` : ''}
        <div class="book-src">From: ${b.source}</div>
      </div>
      <div class="book-actions">
        <span class="status-chip ${b.status}">${b.status}</span>
        ${b.status==='pending' ? `
          <button class="dbtn dbtn-green" onclick="bizSetBooking('${b.id}','confirmed')">Accept</button>
          <button class="dbtn dbtn-ghost" onclick="bizSetBooking('${b.id}','declined')">Decline</button>` : ''}
      </div>
    </div>`
  const pending = BIZ.bookings.filter(b=>b.status==='pending')
  const others  = BIZ.bookings.filter(b=>b.status!=='pending')
  return `
    ${pending.length ? `<div class="sec-h">New requests (${pending.length})</div>${pending.map(row).join('')}` : '<div class="empty-note">No pending requests 🎉</div>'}
    <div class="sec-h" style="margin-top:20px">All reservations</div>
    ${others.map(row).join('') || '<div class="empty-note">No reservations yet</div>'}`
}
function bizSetBooking(id, status) {
  const b = BIZ.bookings.find(x=>x.id===id); if (b) b.status = status; renderBiz()
}

function bizServices() {
  return `
    <div class="sec-h">Services & products · set pricing</div>
    ${BIZ.services.map(s=>`
      <div class="list-row">
        <div><div class="list-name">${s.name}</div><div class="list-sub">${s.desc}</div></div>
        <div class="list-right">
          <span class="price-tag">${s.price ? '$'+s.price : 'Free'}</span>
          <label class="switch"><input type="checkbox" ${s.active?'checked':''} onchange="bizToggleService('${s.id}')"><span class="slider"></span></label>
        </div>
      </div>`).join('')}
    <button class="dbtn dbtn-green wide" onclick="alert('Add service — demo')">+ Add service / product</button>`
}
function bizToggleService(id){ const s=BIZ.services.find(x=>x.id===id); if(s)s.active=!s.active; renderBiz() }

function bizCalendar() {
  const slots = ['12:00','13:00','18:00','19:00','20:00','21:00']
  return `
    <div class="sec-h">Set availability · tap to open/close a day</div>
    <div class="cal-grid">
      ${BIZ.days.map(d=>`
        <div class="cal-day ${BIZ.closedDays[d]?'closed':''}" onclick="bizToggleDay('${d}')">
          <div class="cal-dname">${d}</div>
          <div class="cal-state">${BIZ.closedDays[d]?'Closed':'Open'}</div>
        </div>`).join('')}
    </div>
    <div class="sec-h" style="margin-top:20px">Bookable time slots</div>
    <div class="slot-wrap">${slots.map(s=>`<span class="slot-chip">${s}</span>`).join('')}</div>`
}
function bizToggleDay(d){ BIZ.closedDays[d]=!BIZ.closedDays[d]; renderBiz() }

function bizEarnings() {
  return `
    <div class="kpi-row">
      ${kpi('Today', '$'+BIZ.earnings.today.toLocaleString(),'')}
      ${kpi('This week', '$'+BIZ.earnings.week.toLocaleString(),'')}
      ${kpi('This month', '$'+BIZ.earnings.month.toLocaleString(),'')}
      ${kpi('Pending payout', '$'+BIZ.earnings.pending.toLocaleString(),'Held until settlement')}
    </div>
    <div class="dash-card">
      <div class="dash-card-title">Payouts</div>
      <div class="list-row"><div>Next payout · Fri 27 Jun</div><span class="price-tag">$${BIZ.earnings.pending.toLocaleString()}</span></div>
      <div class="list-row"><div>Last payout · 20 Jun</div><span class="list-sub">Paid to EcoCash ••• 5678</span></div>
      <button class="dbtn dbtn-green wide" onclick="alert('Payout requested — demo')">Request payout now</button>
    </div>`
}

function bizCustomers() {
  return `
    <div class="sec-h">Customers (from the mobile app)</div>
    ${BIZ.customers.map(c=>`
      <div class="list-row">
        <div class="cust"><img src="${c.avatar}" class="cust-av"/><div><div class="list-name">${c.name}</div><div class="list-sub">${c.visits} visits</div></div></div>
        <span class="price-tag">$${c.spent} spent</span>
      </div>`).join('')}`
}

function bizPromotions() {
  return `
    <div class="sec-h">Create a promotion</div>
    <div class="dash-card">
      <div class="form-row"><input id="promoCode" class="dinput" placeholder="CODE e.g. WEEKEND15"/><input id="promoDesc" class="dinput" placeholder="Description"/></div>
      <button class="dbtn dbtn-green wide" onclick="bizAddPromo()">Create discount</button>
    </div>
    <div class="sec-h" style="margin-top:20px">Active promotions</div>
    ${BIZ.promos.map(p=>`
      <div class="list-row">
        <div><div class="list-name">${p.code}</div><div class="list-sub">${p.desc}</div></div>
        <label class="switch"><input type="checkbox" ${p.active?'checked':''} onchange="bizTogglePromo('${p.id}')"><span class="slider"></span></label>
      </div>`).join('')}`
}
function bizAddPromo(){
  const code=(document.getElementById('promoCode').value||'').trim().toUpperCase()
  const desc=(document.getElementById('promoDesc').value||'').trim()
  if(!code) return
  BIZ.promos.unshift({id:'p'+Date.now(),code,desc:desc||'Discount',active:true}); renderBiz()
}
function bizTogglePromo(id){ const p=BIZ.promos.find(x=>x.id===id); if(p)p.active=!p.active; renderBiz() }

function bizReviews() {
  return `
    <div class="sec-h">Reviews management</div>
    ${BIZ.reviews.map(r=>`
      <div class="dash-card">
        <div class="rev-top"><b>${r.user}</b><span class="dash-rating">${'★'.repeat(r.rating)}</span></div>
        <div class="rev-date">${r.date}</div>
        <div class="rev-text">${r.text}</div>
        ${r.reply ? `<div class="rev-reply"><b>Your reply:</b> ${r.reply}</div>`
          : `<button class="dbtn dbtn-ghost" onclick="bizReply('${r.id}')">Reply</button>`}
      </div>`).join('')}`
}
function bizReply(id){ const r=BIZ.reviews.find(x=>x.id===id); if(r){ const t=prompt('Reply to '+r.user); if(t){r.reply=t; renderBiz()} } }

function bizProfile() {
  return `
    <div class="sec-h">Business profile ${BIZ.verified?'<span class="verified-pill">✓ Verified</span>':''}</div>
    <div class="dash-card">
      <div class="form-row"><input class="dinput" value="${BIZ.name}"/><input class="dinput" value="Fine Dining"/></div>
      <input class="dinput" value="225 Enterprise Road, Highlands, Harare" style="width:100%;margin-top:10px"/>
      <textarea class="dinput" style="width:100%;margin-top:10px;min-height:70px">Award-winning fine dining celebrating Zimbabwe's finest ingredients.</textarea>
    </div>
    <div class="sec-h" style="margin-top:20px">Photos & videos</div>
    <div class="photo-grid">
      ${BIZ.photos.map(p=>`<div class="photo" style="background-image:url('${p}')"></div>`).join('')}
      <div class="photo photo-add" onclick="alert('Upload — demo')">+ Upload</div>
    </div>`
}

/* ───────────────── DRIVER ───────────────── */
const DRV = {
  name: 'Tendai Moyo',
  vehicle: 'Honda CG125 · ADV 1234',
  verified: true,
  online: true,
  rating: 4.9,
  trips: 1284,
  section: 'dashboard',
  connection: 'offline',
  available: [
    { id: 'd1', from: 'The Braai Deck, Borrowdale', to: '14 Hillside Rd, Hillside', customer: 'Rumbi K.', distance: '4.2 km', fee: 6.5 },
    { id: 'd2', from: 'Harvest Basket, Sam Levy\'s', to: '8 Argyle Rd, Avondale', customer: 'Joseph M.', distance: '6.8 km', fee: 8.0 },
  ],
  active: null,
  history: [
    { id: 'h1', date: 'Today 12:40', route: 'FreshMart → Mount Pleasant', fee: 5.5, rating: 5 },
    { id: 'h2', date: 'Today 11:15', route: 'Café Nush → Borrowdale', fee: 4.0, rating: 5 },
    { id: 'h3', date: 'Yesterday', route: 'The Butchery Co. → Arundel', fee: 7.5, rating: 4 },
  ],
  earnings: { today: 42.5, week: 318, balance: 318, trips: 7 },
}
const DRV_STAGES = ['accepted', 'pickedup', 'enroute', 'delivered']
const DRV_STAGE_LABEL = { accepted: 'Heading to pickup', pickedup: 'Picked up', enroute: 'On the way to customer', delivered: 'Delivered' }

const DRV_NAV = [
  { id: 'dashboard',   label: 'Dashboard',  icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z' },
  { id: 'deliveries',  label: 'Deliveries', icon: 'M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7' },
  { id: 'navigation',  label: 'Navigation', icon: 'M3 11l19-9-9 19-2-8-8-2z' },
  { id: 'history',     label: 'History',    icon: 'M12 8v4l3 3M3.05 11a9 9 0 119 10' },
  { id: 'earnings',    label: 'Earnings',   icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
  { id: 'withdrawals', label: 'Withdrawals',icon: 'M12 1v16m0 0l-5-5m5 5l5-5M3 21h18' },
  { id: 'profile',     label: 'Profile',    icon: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z' },
]

function showDriver() {
  if (typeof hideAuthViews === 'function') hideAuthViews()
  document.getElementById('view-business').hidden = true
  document.getElementById('view-driver').hidden = false
  drvConnectBus()
  renderDrv()
}
function drvGo(section){ DRV.section = section; renderDrv() }

/* ── Live job bus (mirrors driver-app JobsContext) ── */
var drvBus = null
var drvClaimed = {}   // refs this driver has claimed
function drvVisible() { return !document.getElementById('view-driver').hidden }
// local delivery stage -> canonical order status published to customer/merchant
var DRV_STAGE_CANON = { accepted: 'ready', pickedup: 'picked_up', enroute: 'en_route', delivered: 'delivered' }

function drvConnectBus() {
  if (drvBus || !window.SpotlyBus) return
  var S = window.SpotlyBus
  drvBus = new S.Bus('driver')
  drvBus.onStatus(function (s) { DRV.connection = s; if (drvVisible()) renderDrv() })
  drvBus.watchJobs(
    function (job) {
      if (drvClaimed[job.ref] || (DRV.active && DRV.active.ref === job.ref)) return
      if (DRV.available.some(function (d) { return d.ref === job.ref })) return
      DRV.available.unshift({
        id: 'bus-' + job.ref, ref: job.ref,
        from: job.vendorName, to: job.dropoff, customer: job.customerName,
        distance: job.distance || '—', fee: job.payout || 0, fresh: true,
      })
      if (drvVisible()) renderDrv()
    },
    function (ref) {
      if (DRV.active && DRV.active.ref === ref) return
      DRV.available = DRV.available.filter(function (d) { return d.ref !== ref })
      if (drvVisible()) renderDrv()
    }
  )
  drvBus.connect()
}

function renderDrv() {
  const el = document.getElementById('view-driver')
  el.innerHTML = `
    <div class="dash-shell">
      ${dashSidebar('Driver', DRV.name, DRV.vehicle, DRV_NAV, DRV.section, 'drvGo')}
      <main class="dash-main">
        <header class="dash-top">
          <div>
            <div class="dash-h1">${DRV_NAV.find(n=>n.id===DRV.section).label}</div>
            <div class="dash-sub">${DRV.name}${DRV.verified?' · <span class="verified-pill">✓ Verified</span>':''}</div>
          </div>
          <div class="dash-top-right">
            ${liveBadge(DRV.connection)}
            <label class="switch online"><input type="checkbox" ${DRV.online?'checked':''} onchange="drvToggleOnline()"><span class="slider"></span></label>
            <span class="online-label ${DRV.online?'on':''}">${DRV.online?'Online':'Offline'}</span>
          </div>
        </header>
        <div class="dash-content">${drvSection()}</div>
      </main>
    </div>`
}
function drvToggleOnline(){ DRV.online=!DRV.online; renderDrv() }

function drvSection() {
  switch (DRV.section) {
    case 'dashboard':   return drvDashboard()
    case 'deliveries':  return drvDeliveries()
    case 'navigation':  return drvNavigation()
    case 'history':     return drvHistory()
    case 'earnings':    return drvEarnings()
    case 'withdrawals': return drvWithdrawals()
    case 'profile':     return drvProfile()
    default:            return drvDashboard()
  }
}

function drvDashboard() {
  return `
    <div class="kpi-row">
      ${kpi('Earnings today', '$'+DRV.earnings.today.toFixed(2),'')}
      ${kpi('Trips today', DRV.earnings.trips,'')}
      ${kpi('Rating', DRV.rating, DRV.trips+' trips')}
      ${kpi('Status', DRV.online?'Online':'Offline', DRV.online?'Accepting jobs':'Not accepting')}
    </div>
    ${DRV.active ? drvActiveCard() : `
      <div class="dash-card">
        <div class="dash-card-title">No active delivery</div>
        <p class="empty-note">${DRV.online?'Waiting for new requests…':'Go online to receive delivery requests.'}</p>
        <button class="dbtn dbtn-green" onclick="drvGo('deliveries')">View available deliveries</button>
      </div>`}`
}

function drvActiveCard() {
  const a = DRV.active
  const idx = DRV_STAGES.indexOf(a.stage)
  return `
    <div class="dash-card active-card">
      <div class="dash-card-title">Active delivery · ${DRV_STAGE_LABEL[a.stage]}</div>
      <div class="route">
        <div class="route-pt"><span class="dot green"></span> ${a.from}</div>
        <div class="route-line"></div>
        <div class="route-pt"><span class="dot red"></span> ${a.to}</div>
      </div>
      <div class="progress-track">${DRV_STAGES.map((s,i)=>`<div class="progress-step ${i<=idx?'done':''}"></div>`).join('')}</div>
      <div class="active-row">
        <div>Customer: <b>${a.customer}</b></div>
        <button class="dbtn dbtn-ghost" onclick="alert('Calling ${a.customer}… (demo)')">📞 Contact</button>
      </div>
      ${a.stage!=='delivered'
        ? `<button class="dbtn dbtn-green wide" onclick="drvAdvance()">${idx===0?'Confirm pickup':idx===1?'Start trip':'Mark delivered'}</button>`
        : `<button class="dbtn dbtn-green wide" onclick="drvComplete()">Complete & collect $${a.fee.toFixed(2)}</button>`}
    </div>`
}

function drvDeliveries() {
  if (DRV.active) return drvActiveCard()
  if (!DRV.online) return `<div class="empty-note">You're offline. Toggle online to see requests.</div>`
  return `
    <div class="sec-h">Available deliveries</div>
    ${DRV.available.length ? DRV.available.map(d=>`
      <div class="book-card">
        <div class="book-info">
          <div class="book-name">$${d.fee.toFixed(2)} · ${d.distance}</div>
          <div class="route mini">
            <div class="route-pt"><span class="dot green"></span> ${d.from}</div>
            <div class="route-pt"><span class="dot red"></span> ${d.to}</div>
          </div>
          <div class="book-src">Customer: ${d.customer}</div>
        </div>
        <div class="book-actions">
          <button class="dbtn dbtn-green" onclick="drvAccept('${d.id}')">Accept</button>
          <button class="dbtn dbtn-ghost" onclick="drvReject('${d.id}')">Reject</button>
        </div>
      </div>`).join('') : '<div class="empty-note">No requests right now.</div>'}`
}
function drvAccept(id){
  const d=DRV.available.find(x=>x.id===id); if(!d) return
  DRV.active={...d, stage:'accepted'}; DRV.available=DRV.available.filter(x=>x.id!==id)
  DRV.section='dashboard'
  // Claim on the bus: removes the job from other drivers and tells the
  // customer + merchant a driver is assigned.
  if (drvBus && d.ref) {
    drvClaimed[d.ref] = true
    drvBus.claimJob(d.ref, window.SpotlyBus.config.DEMO_DRIVER_ID, window.SpotlyBus.config.DEMO_DRIVER_NAME)
  }
  renderDrv()
}
function drvReject(id){ DRV.available=DRV.available.filter(x=>x.id!==id); renderDrv() }
function drvAdvance(){
  if(!DRV.active) return
  const i=DRV_STAGES.indexOf(DRV.active.stage)
  if(i<DRV_STAGES.length-1) DRV.active.stage=DRV_STAGES[i+1]
  // Publish the canonical status so the customer's tracking + merchant update live.
  if (drvBus && DRV.active.ref) {
    drvBus.advanceOrder(DRV.active.ref, DRV_STAGE_CANON[DRV.active.stage],
      window.SpotlyBus.config.DEMO_DRIVER_ID, window.SpotlyBus.config.DEMO_DRIVER_NAME)
  }
  renderDrv()
}
function drvComplete(){
  const a=DRV.active; if(!a) return
  if (drvBus && a.ref) drvBus.advanceOrder(a.ref, 'delivered', window.SpotlyBus.config.DEMO_DRIVER_ID, window.SpotlyBus.config.DEMO_DRIVER_NAME)
  DRV.history.unshift({id:'h'+Date.now(),date:'Just now',route:a.from.split(',')[0]+' → '+a.to.split(',')[0],fee:a.fee,rating:5})
  DRV.earnings.today+=a.fee; DRV.earnings.week+=a.fee; DRV.earnings.balance+=a.fee; DRV.earnings.trips++
  DRV.active=null; DRV.section='dashboard'; renderDrv()
}

function drvNavigation() {
  const a = DRV.active
  return `
    <div class="map">
      <div class="map-grid"></div>
      <div class="map-route"></div>
      <div class="map-pin pin-a">A</div>
      <div class="map-pin pin-b">B</div>
      <div class="map-eta">${a?('ETA 9 min · '+a.to):'No active route'}</div>
    </div>
    ${a ? `<div class="dash-card"><div class="dash-card-title">Turn-by-turn</div>
      <div class="list-row"><div>↱ Turn right onto Enterprise Rd</div><span class="list-sub">400 m</span></div>
      <div class="list-row"><div>↰ Left onto Glenara Ave</div><span class="list-sub">1.2 km</span></div>
      <div class="list-row"><div>📍 Arrive at ${a.to}</div><span class="list-sub">9 min</span></div></div>`
      : `<div class="empty-note">Accept a delivery to start GPS navigation.</div>`}`
}

function drvHistory() {
  return `
    <div class="sec-h">Delivery history</div>
    ${DRV.history.map(h=>`
      <div class="list-row">
        <div><div class="list-name">${h.route}</div><div class="list-sub">${h.date} · ★ ${h.rating}</div></div>
        <span class="price-tag">+$${h.fee.toFixed(2)}</span>
      </div>`).join('')}`
}

function drvEarnings() {
  return `
    <div class="kpi-row">
      ${kpi('Today', '$'+DRV.earnings.today.toFixed(2),'')}
      ${kpi('This week', '$'+DRV.earnings.week.toFixed(2),'')}
      ${kpi('Trips (week)', DRV.earnings.trips,'')}
      ${kpi('Avg / trip', '$'+(DRV.earnings.week/Math.max(DRV.earnings.trips,1)).toFixed(2),'')}
    </div>
    <div class="dash-card">
      <div class="dash-card-title">Breakdown</div>
      <div class="list-row"><div>Delivery fees</div><span class="price-tag">$${(DRV.earnings.week*0.8).toFixed(2)}</span></div>
      <div class="list-row"><div>Tips</div><span class="price-tag">$${(DRV.earnings.week*0.15).toFixed(2)}</span></div>
      <div class="list-row"><div>Bonuses</div><span class="price-tag">$${(DRV.earnings.week*0.05).toFixed(2)}</span></div>
    </div>`
}

function drvWithdrawals() {
  return `
    <div class="dash-card balance-card">
      <div class="balance-label">Available balance</div>
      <div class="balance-amt">$${DRV.earnings.balance.toFixed(2)}</div>
      <button class="dbtn dbtn-white wide" onclick="drvWithdraw()">Withdraw to EcoCash</button>
    </div>
    <div class="sec-h" style="margin-top:20px">Recent withdrawals</div>
    <div class="list-row"><div>20 Jun · EcoCash ••• 5678</div><span class="price-tag">$210.00</span></div>
    <div class="list-row"><div>13 Jun · EcoCash ••• 5678</div><span class="price-tag">$185.00</span></div>`
}
function drvWithdraw(){
  if(DRV.earnings.balance<=0){ alert('No balance to withdraw'); return }
  alert('Withdrawal of $'+DRV.earnings.balance.toFixed(2)+' requested to EcoCash — demo')
  DRV.earnings.balance=0; renderDrv()
}

function drvProfile() {
  return `
    <div class="sec-h">Driver profile <span class="verified-pill">✓ Verified</span></div>
    <div class="dash-card">
      <div class="form-row"><input class="dinput" value="${DRV.name}"/><input class="dinput" value="+263 77 555 0192"/></div>
      <input class="dinput" value="${DRV.vehicle}" style="width:100%;margin-top:10px"/>
    </div>
    <div class="sec-h" style="margin-top:20px">Documents & verification</div>
    <div class="list-row"><div>Driver's licence</div><span class="status-chip confirmed">verified</span></div>
    <div class="list-row"><div>Vehicle registration</div><span class="status-chip confirmed">verified</span></div>
    <div class="list-row"><div>ID document</div><span class="status-chip confirmed">verified</span></div>
    <div class="list-row"><div>Background check</div><span class="status-chip confirmed">passed</span></div>`
}

/* ───────────────── shared ───────────────── */
function dashSidebar(portal, name, sub, nav, active, goFn) {
  const initial = name.charAt(0)
  return `
    <aside class="dash-sidebar">
      <div class="dash-logo"><div class="app-logo-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#fff"/></svg></div><span>spotly</span></div>
      <div class="portal-tag">${portal}</div>
      <nav class="dash-nav">
        ${nav.map(n=>`<a class="dash-item ${n.id===active?'active':''}" onclick="${goFn}('${n.id}')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${n.icon}"/></svg>${n.label}</a>`).join('')}
      </nav>
      <div class="dash-userbox">
        <div class="dash-avatar">${initial}</div>
        <div class="dash-uinfo"><div class="dash-uname">${name}</div><div class="dash-usub">${sub}</div></div>
        <button class="dash-logout" onclick="dashLogout()" title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>
    </aside>`
}
function kpi(label, value, sub) {
  return `<div class="kpi"><div class="kpi-label">${label}</div><div class="kpi-value">${value}</div>${sub?`<div class="kpi-sub">${sub}</div>`:''}</div>`
}
function liveBadge(status) {
  const on = status === 'connected'
  return `<span class="live-badge ${on?'on':''}"><span class="live-dot"></span>${on?'Live':(status==='connecting'||status==='reconnecting'?'…':'Offline')}</span>`
}
function dashLogout() {
  localStorage.removeItem('spotly_auth')
  document.getElementById('view-business').hidden = true
  document.getElementById('view-driver').hidden = true
  if (typeof showPlatform === 'function') showPlatform()
}
