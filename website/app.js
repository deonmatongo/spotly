/* ══════════════════════════════════════════
   SPOTLY WEB APP — MAIN LOGIC
   ══════════════════════════════════════════ */

/* ── State ── */
const state = {
  route: 'home',
  category: 'all',
  searchQuery: '',
  detailId: null,
  bookingId: null,
  bookingStep: 1,
  booking: { date: 'Sat, Jun 28', time: null, party: 2, tierId: null, tierQty: 1 },
  bookingsTab: 'upcoming',
  bookings: [],
  cart: [],         // [{ listingId, name, image, itemId, itemName, price, qty, type }]
}

function getCart() {
  try { const s = localStorage.getItem('spotly_cart'); return s ? JSON.parse(s) : [] } catch { return [] }
}
function saveCart() {
  try { localStorage.setItem('spotly_cart', JSON.stringify(state.cart)) } catch {}
}
function cartCount() { return state.cart.reduce((n, i) => n + i.qty, 0) }
function cartTotal() { return state.cart.reduce((n, i) => n + i.price * i.qty, 0) }

function addToCart(listingId, item, type = 'menu') {
  const listing = LISTINGS.find(l => l.id === listingId)
  if (!listing) return
  const existing = state.cart.find(c => c.itemId === item.id && c.listingId === listingId)
  if (existing) {
    existing.qty += 1
  } else {
    state.cart.push({
      listingId,
      listingName: listing.name,
      listingImage: listing.image,
      itemId: item.id,
      itemName: item.name,
      price: item.price,
      qty: 1,
      type,
    })
  }
  saveCart()
  updateCartBadge()
  showToast(`${item.name} added to cart`, 'success')
}

function removeFromCart(itemId, listingId) {
  state.cart = state.cart.filter(c => !(c.itemId === itemId && c.listingId === listingId))
  saveCart()
  updateCartBadge()
}

function updateCartQty(itemId, listingId, delta) {
  const item = state.cart.find(c => c.itemId === itemId && c.listingId === listingId)
  if (!item) return
  item.qty = Math.max(0, item.qty + delta)
  if (item.qty === 0) removeFromCart(itemId, listingId)
  else saveCart()
  updateCartBadge()
  if (state.route === 'cart') renderCart(document.getElementById('pageContent'))
}

function updateCartBadge() {
  const count = cartCount()
  document.querySelectorAll('.cart-badge').forEach(b => {
    b.textContent = count
    b.style.display = count > 0 ? 'flex' : 'none'
  })
  // update sidebar/bottomnav cart item label
  document.querySelectorAll('[data-nav="cart"] .sb-cart-count, [data-nav="cart"] .bn-cart-count').forEach(el => {
    el.textContent = count > 0 ? count : ''
  })
}

function getBookings() {
  try {
    const saved = localStorage.getItem('spotly_bookings')
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(DEFAULT_BOOKINGS))
  } catch { return JSON.parse(JSON.stringify(DEFAULT_BOOKINGS)) }
}
function saveBookings(b) {
  try { localStorage.setItem('spotly_bookings', JSON.stringify(b)) } catch {}
}
function isLoggedIn() {
  return localStorage.getItem('spotly_auth') === '1'
}

/* ── Platforms ── */
const PLATFORMS = {
  customer: { badge: 'Customer portal', title: 'Welcome back.',   sub: 'Sign in to discover restaurants, events, and experiences around you.' },
  business: { badge: 'Business portal', title: 'Partner sign in.', sub: 'Manage your listings, bookings, pricing and earnings on Spotly.' },
  driver:   { badge: 'Driver portal',   title: 'Driver sign in.',  sub: 'Accept deliveries, navigate with GPS and track your payouts.' },
}
function getPlatform() { return localStorage.getItem('spotly_platform') || 'customer' }

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  state.bookings = getBookings()
  state.cart = getCart()
  if (isLoggedIn()) showApp()
  else showPlatform()
  setupPlatform()
  setupLogin()
})

/* ── Platform select ── */
function showPlatform() {
  document.getElementById('view-platform').hidden = false
  document.getElementById('view-login').hidden = true
  document.getElementById('view-app').hidden = true
}
function setupPlatform() {
  document.querySelectorAll('#view-platform .platform-card').forEach(card => {
    card.addEventListener('click', () => {
      const p = card.dataset.platform
      localStorage.setItem('spotly_platform', p)
      showLogin(p)
    })
  })
  const back = document.getElementById('loginBack')
  if (back) back.addEventListener('click', showPlatform)
}

/* ── Login ── */
function showLogin(platform) {
  const meta = PLATFORMS[platform || getPlatform()] || PLATFORMS.customer
  const badge = document.getElementById('loginBadge')
  const title = document.getElementById('loginTitle')
  const sub   = document.getElementById('loginSubtitle')
  if (badge) badge.textContent = meta.badge
  if (title) title.textContent = meta.title
  if (sub)   sub.textContent   = meta.sub
  document.getElementById('view-platform').hidden = true
  document.getElementById('view-login').hidden = false
  document.getElementById('view-app').hidden = true
}
function showApp() {
  document.getElementById('view-platform').hidden = true
  document.getElementById('view-login').hidden = true
  document.getElementById('view-app').hidden = false
  setupApp()
  navigate('home')
}

function setupLogin() {
  const form = document.getElementById('loginForm')
  const err  = document.getElementById('loginError')
  const eye  = document.getElementById('eyeBtn')
  const pwd  = document.getElementById('loginPwd')

  eye.addEventListener('click', () => {
    pwd.type = pwd.type === 'password' ? 'text' : 'password'
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = document.getElementById('loginEmail').value.trim().toLowerCase()
    const pass  = pwd.value
    if (email === CREDENTIALS.email && pass === CREDENTIALS.password) {
      localStorage.setItem('spotly_auth', '1')
      err.hidden = true
      showApp()
    } else {
      err.hidden = false
      form.querySelectorAll('.input-wrap input').forEach(i => i.style.borderColor = '#EF4444')
      setTimeout(() => form.querySelectorAll('.input-wrap input').forEach(i => i.style.borderColor = ''), 2000)
    }
  })
}

/* ── App Setup ── */
function setupApp() {
  // Sidebar items
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', (e) => {
      const nav = el.dataset.nav
      if (nav) { e.preventDefault(); navigate(nav) }
    })
  })

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('spotly_auth')
    showPlatform()
  })

  // Mobile sidebar toggle
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('sidebarOverlay')
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    sidebar.classList.toggle('open')
    overlay.classList.toggle('open')
  })
  overlay.addEventListener('click', () => {
    sidebar.classList.remove('open')
    overlay.classList.remove('open')
  })
}

/* ── Router ── */
function navigate(route, params = {}) {
  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open')
  document.getElementById('sidebarOverlay').classList.remove('open')

  state.route = route
  Object.assign(state, params)

  // Update active nav items
  document.querySelectorAll('.sb-item, .bn-item').forEach(el => {
    const nav = el.dataset.nav
    el.classList.toggle('sb-active', nav === route)
    el.classList.toggle('bn-active', nav === route)
  })

  const content = document.getElementById('pageContent')

  switch (route) {
    case 'home':     renderHome(content); break
    case 'browse':   renderBrowse(content); break
    case 'search':   renderSearch(content); break
    case 'detail':   renderDetail(content, state.detailId); break
    case 'bookings': renderBookings(content); break
    case 'cart':     renderCart(content); break
    case 'profile':  renderProfile(content); break
    case 'confirm':  renderConfirmation(content, state.confirmData); break
    default:         renderHome(content)
  }

  updateCartBadge()

  content.scrollTop = 0
}

/* ── Helpers ── */
const CAT_LABELS = { all:'All', food:'Food', groceries:'Groceries', events:'Events', experiences:'Experiences' }
const CAT_ICONS = {
  food: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>`,
  groceries: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/></svg>`,
  events: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  experiences: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>`,
}

function starSvg(filled = true) {
  return `<svg width="12" height="12" viewBox="0 0 24 24" fill="${filled ? '#F59E0B' : 'none'}" stroke="${filled ? 'none' : '#CBD5E1'}" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>`
}
function starsHtml(rating) {
  return Array.from({length: 5}, (_, i) => starSvg(i < Math.round(rating))).join('')
}

function listingCard(l, wide = false) {
  const isFeatured = l.popular
  const badgeLabel = l.category === 'events' ? 'Event' : l.category === 'groceries' ? 'Store' : l.category === 'experiences' ? 'Xp' : ''
  return `
  <div class="listing-card ${wide ? '' : ''}" data-id="${l.id}" onclick="navigate('detail', {detailId: ${l.id}})">
    <div class="lc-img">
      <img src="${l.image}" alt="${l.name}" loading="lazy" />
      ${isFeatured ? `<span class="lc-badge">Popular</span>` : ''}
      ${badgeLabel ? `<span class="lc-cat">${badgeLabel}</span>` : ''}
    </div>
    <div class="lc-body">
      <div class="lc-name">${l.name}</div>
      <div class="lc-cuisine">${l.cuisine}</div>
      <div class="lc-row">
        <div class="lc-rating">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
          ${l.rating} <span style="color:var(--s400);font-weight:400">(${l.reviewCount})</span>
        </div>
        <div class="lc-eta">${l.eta}</div>
      </div>
    </div>
  </div>`
}

function catPills(activeCat) {
  const cats = ['all', 'food', 'groceries', 'events', 'experiences']
  return `<div class="cat-pills">
    ${cats.map(c => `
      <button class="cat-pill ${activeCat === c ? 'active' : ''}" onclick="filterCat('${c}')">
        ${c !== 'all' ? CAT_ICONS[c] : ''}
        ${CAT_LABELS[c]}
      </button>`).join('')}
  </div>`
}

function filterCat(cat) {
  state.category = cat
  if (state.route === 'home') renderHome(document.getElementById('pageContent'))
  else if (state.route === 'browse') renderBrowse(document.getElementById('pageContent'))
  else if (state.route === 'search') renderSearch(document.getElementById('pageContent'))
}

/* ── HOME ── */
function renderHome(el) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const featured = LISTINGS.find(l => l.popular && l.category === 'events') || LISTINGS[4]
  const filtered = state.category === 'all' ? LISTINGS : LISTINGS.filter(l => l.category === state.category)
  const popular  = LISTINGS.filter(l => l.popular).slice(0, 6)

  el.innerHTML = `
    <div class="home-greeting">
      <h2>${greeting}, ${CURRENT_USER.firstName}</h2>
      <p>Discover the best of Harare, all in one place.</p>
    </div>

    ${catPills(state.category)}

    ${state.category === 'all' ? `
      <div class="featured-hero" onclick="navigate('detail', {detailId: ${featured.id}})">
        <img src="${featured.image}" alt="${featured.name}" />
        <div class="featured-hero-overlay">
          <div class="fh-tag">Featured Event</div>
          <div class="fh-name">${featured.name}</div>
          <div class="fh-meta">
            <div class="fh-rating">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
              ${featured.rating} (${featured.reviewCount})
            </div>
            <div class="fh-address">${featured.eventDate || featured.address}</div>
          </div>
        </div>
      </div>

      <div class="section-row">
        <div class="sec-title">Popular near you</div>
        <span class="see-all" onclick="navigate('browse')">See all</span>
      </div>
      <div class="h-scroll">
        ${popular.map(l => `<div class="h-card">${listingCard(l)}</div>`).join('')}
      </div>

      <div class="section-row" style="margin-top:28px">
        <div class="sec-title">Upcoming events</div>
        <span class="see-all" onclick="filterCat('events')">See all</span>
      </div>
      <div class="listings-grid">
        ${LISTINGS.filter(l => l.category === 'events').slice(0,4).map(l => listingCard(l)).join('')}
      </div>
    ` : `
      <div class="sec-title" style="margin-bottom:16px">${CAT_LABELS[state.category]} (${filtered.length})</div>
      <div class="listings-grid">
        ${filtered.map(l => listingCard(l)).join('')}
      </div>
    `}
  `
}

/* ── BROWSE ── */
function renderBrowse(el) {
  const filtered = state.category === 'all' ? LISTINGS : LISTINGS.filter(l => l.category === state.category)

  el.innerHTML = `
    <div style="margin-bottom:24px">
      <div class="page-title">Browse</div>
      <div class="page-sub">Explore everything Spotly has to offer.</div>
    </div>

    ${state.category === 'all' ? `
      <div class="browse-cats">
        <div class="browse-cat-card bcc-food" onclick="navigate('browse'); filterCat('food')">
          <div class="bcc-icon">${CAT_ICONS.food}</div>
          <div class="bcc-name">Food &amp; Dining</div>
          <div class="bcc-count">${LISTINGS.filter(l=>l.category==='food').length} restaurants</div>
          <div class="bcc-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
        </div>
        <div class="browse-cat-card bcc-groceries" onclick="navigate('browse'); filterCat('groceries')">
          <div class="bcc-icon">${CAT_ICONS.groceries}</div>
          <div class="bcc-name">Groceries</div>
          <div class="bcc-count">${LISTINGS.filter(l=>l.category==='groceries').length} stores</div>
          <div class="bcc-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
        </div>
        <div class="browse-cat-card bcc-events" onclick="navigate('browse'); filterCat('events')">
          <div class="bcc-icon">${CAT_ICONS.events}</div>
          <div class="bcc-name">Events</div>
          <div class="bcc-count">${LISTINGS.filter(l=>l.category==='events').length} upcoming</div>
          <div class="bcc-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
        </div>
        <div class="browse-cat-card bcc-experiences" onclick="navigate('browse'); filterCat('experiences')">
          <div class="bcc-icon">${CAT_ICONS.experiences}</div>
          <div class="bcc-name">Experiences</div>
          <div class="bcc-count">${LISTINGS.filter(l=>l.category==='experiences').length} activities</div>
          <div class="bcc-arrow"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>
        </div>
      </div>
      <div class="sec-title" style="margin-bottom:16px">All listings</div>
    ` : `
      <div style="margin-bottom:20px">${catPills(state.category)}</div>
      <div class="sec-title" style="margin-bottom:16px">${CAT_LABELS[state.category]} · ${filtered.length} results</div>
    `}

    <div class="listings-grid">
      ${filtered.map(l => listingCard(l)).join('')}
    </div>
  `
}

/* ── SEARCH ── */
function renderSearch(el) {
  const q = state.searchQuery.toLowerCase()
  const filtered = q
    ? LISTINGS.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.cuisine.toLowerCase().includes(q) ||
        l.tags.some(t => t.toLowerCase().includes(q)) ||
        l.address.toLowerCase().includes(q)
      )
    : (state.category === 'all' ? LISTINGS : LISTINGS.filter(l => l.category === state.category))

  el.innerHTML = `
    <div style="margin-bottom:20px">
      <div class="page-title">Search</div>
    </div>
    <div class="search-bar">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input type="text" id="searchInput" placeholder="Restaurants, events, experiences..." value="${state.searchQuery}" autocomplete="off" />
    </div>
    ${catPills(state.category)}
    ${q ? `<div class="search-results-count">${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${state.searchQuery}"</div>` : ''}
    <div class="listings-grid">
      ${filtered.length ? filtered.map(l => listingCard(l)).join('') : `
        <div class="empty-state" style="grid-column:1/-1">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <h3>No results found</h3>
          <p>Try a different search term or browse by category.</p>
        </div>
      `}
    </div>
  `

  const inp = document.getElementById('searchInput')
  if (inp) {
    inp.focus()
    inp.addEventListener('input', (e) => {
      state.searchQuery = e.target.value
      renderSearch(el)
    })
  }
}

/* ── DETAIL ── */
function renderDetail(el, id) {
  const l = LISTINGS.find(x => x.id === id)
  if (!l) { navigate('home'); return }

  const listingReviews = REVIEWS.filter(r => r.listingId === id)
  const isEvent = l.category === 'events'
  const isGrocery = l.category === 'groceries'

  const dates = ['Tonight', 'Tomorrow', 'Sat, Jun 28', 'Sun, Jun 29', 'Mon, Jun 30', 'Tue, Jul 1']
  const slots = l.timeSlots || ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM']

  el.innerHTML = `
    <div class="detail-view">
      <div class="detail-hero">
        <img src="${l.image}" alt="${l.name}" />
        <button class="back-btn" onclick="history.back(); navigate('browse')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
      </div>

      <div class="detail-layout">
        <div class="detail-info">
          <h1 class="detail-name">${l.name}</h1>
          <div class="detail-cuisine">${l.cuisine}</div>
          <div class="detail-meta-row">
            <div class="detail-chip chip-green">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
              ${l.rating} (${l.reviewCount.toLocaleString()} reviews)
            </div>
            <div class="detail-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${l.distance}
            </div>
            <div class="detail-chip">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
              ${l.hours}
            </div>
            <div class="detail-chip">${l.priceLevel}</div>
          </div>
          <p class="detail-desc">${l.description}</p>
          <div class="detail-tags">${l.tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}</div>

          ${(l.menu && l.menu.length) ? `
            <div class="sec-title" style="margin-bottom:14px">${l.category === 'groceries' ? 'Shop items' : 'Menu highlights'}</div>
            <div class="menu-grid">
              ${l.menu.map(item => `
                <div class="menu-card">
                  <div class="mc-img"><img src="${item.image}" alt="${item.name}" loading="lazy" /></div>
                  <div class="mc-body">
                    <div class="mc-name">${item.name}</div>
                    <div class="mc-desc">${item.desc}</div>
                    <div class="mc-footer">
                      <span class="mc-price">$${item.price.toFixed(2)}</span>
                      <button class="mc-add" onclick="addToCart(${l.id}, {id:'${item.id}',name:'${item.name.replace(/'/g,"\\'")}',price:${item.price}})">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${listingReviews.length ? `
            <div class="sec-title" style="margin-bottom:14px">Guest reviews</div>
            <div class="reviews-list">
              ${listingReviews.map(r => `
                <div class="review-card">
                  <div class="review-header">
                    <div class="review-user">
                      <img src="${r.avatar}" alt="${r.user}" class="review-avatar" />
                      <div>
                        <div class="review-name">${r.user}</div>
                        <div class="review-date">${r.date}</div>
                      </div>
                    </div>
                    <div class="review-stars">${starsHtml(r.rating)}</div>
                  </div>
                  <div class="review-text">${r.text}</div>
                </div>`).join('')}
            </div>
          ` : ''}
        </div>

        <!-- Booking panel -->
        <div class="booking-panel" id="bookingPanel">
          ${isEvent ? renderEventBookingPanel(l) : renderRestaurantBookingPanel(l, dates, slots)}
        </div>
      </div>
    </div>
  `

  // Wire up booking panel events
  wireBookingPanel(l, dates, slots)
}

function renderRestaurantBookingPanel(l, dates, slots) {
  const sel = state.booking
  return `
    <div class="bp-title">Reserve a table</div>

    <div class="bp-field">
      <label class="bp-label">Select date</label>
      <div class="date-chips">
        ${dates.map(d => `<div class="date-chip ${sel.date === d ? 'selected' : ''}" data-date="${d}">${d}</div>`).join('')}
      </div>
    </div>

    <div class="bp-field">
      <label class="bp-label">Select time</label>
      <div class="bp-slots">
        ${slots.map(s => `<div class="bp-slot ${sel.time === s ? 'selected' : ''}" data-time="${s}">${s}</div>`).join('')}
      </div>
    </div>

    <div class="bp-field">
      <label class="bp-label">Party size</label>
      <div class="bp-stepper">
        <button class="bp-step-btn" data-party="-1">−</button>
        <span class="bp-step-val">${sel.party}</span>
        <button class="bp-step-btn" data-party="1">+</button>
        <span style="font-size:13px;color:var(--s500)">guests</span>
      </div>
    </div>

    <div class="bp-price-row"><span>Spotly Points earned</span><strong style="color:var(--g800)">+${l.pointsEarned} pts</strong></div>
    <button class="bp-btn" id="bookBtn" ${!sel.time ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
      ${sel.time ? `Reserve · ${sel.date} at ${sel.time}` : 'Select a time slot'}
    </button>
    <div class="bp-points">Free cancellation up to 2 hours before</div>
  `
}

function renderEventBookingPanel(l) {
  const tiers = l.ticketTiers || []
  const sel = state.booking
  const selTier = tiers.find(t => t.id === sel.tierId)
  const total = selTier ? selTier.price * sel.tierQty : 0

  return `
    <div class="bp-title">Buy tickets</div>
    ${l.eventDate ? `<div style="font-size:13px;color:var(--s500);margin-bottom:16px;display:flex;align-items:center;gap:6px"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>${l.eventDate}${l.eventTime ? ' · ' + l.eventTime : ''}</div>` : ''}

    <div class="bp-field">
      <label class="bp-label">Ticket type</label>
      <div class="tier-list">
        ${tiers.map(t => `
          <div class="tier-item ${sel.tierId === t.id ? 'selected' : ''}" data-tier="${t.id}">
            <div class="tier-header">
              <span class="tier-name">${t.name}</span>
              <span class="tier-price">$${t.price}</span>
            </div>
            <div class="tier-desc">${t.description}</div>
            ${sel.tierId === t.id ? `
              <div class="tier-qty">
                <span class="tier-qty-label">Quantity</span>
                <div class="bp-stepper">
                  <button class="bp-step-btn" data-qty="-1">−</button>
                  <span class="bp-step-val">${sel.tierQty}</span>
                  <button class="bp-step-btn" data-qty="1">+</button>
                </div>
              </div>` : ''}
          </div>`).join('')}
      </div>
    </div>

    ${selTier ? `
      <div class="bp-price-row"><span>${selTier.name} × ${sel.tierQty}</span><strong>$${total.toFixed(2)}</strong></div>
      <div class="bp-price-row"><span>Spotly fee</span><strong>$${(total * 0.05).toFixed(2)}</strong></div>
      <div class="bp-total"><span>Total</span><strong>$${(total * 1.05).toFixed(2)}</strong></div>
    ` : `<div style="height:16px"></div>`}

    <button class="bp-btn" id="bookBtn" ${!selTier ? 'disabled style="opacity:.5;cursor:not-allowed"' : ''}>
      ${selTier ? `Buy ${sel.tierQty} ticket${sel.tierQty > 1 ? 's' : ''} — $${(total * 1.05).toFixed(2)}` : 'Select a ticket type'}
    </button>
    <div class="bp-points">Earn <strong>+${l.pointsEarned} pts</strong> on this purchase</div>
  `
}

function wireBookingPanel(l, dates, slots) {
  const panel = document.getElementById('bookingPanel')
  if (!panel) return

  // Date chips
  panel.querySelectorAll('.date-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.booking.date = chip.dataset.date
      rerenderPanel(l, dates, slots)
    })
  })

  // Time slots
  panel.querySelectorAll('.bp-slot').forEach(slot => {
    slot.addEventListener('click', () => {
      state.booking.time = slot.dataset.time
      rerenderPanel(l, dates, slots)
    })
  })

  // Party stepper
  panel.querySelectorAll('[data-party]').forEach(btn => {
    btn.addEventListener('click', () => {
      const delta = parseInt(btn.dataset.party)
      state.booking.party = Math.max(1, Math.min(20, state.booking.party + delta))
      rerenderPanel(l, dates, slots)
    })
  })

  // Tier selection
  panel.querySelectorAll('[data-tier]').forEach(item => {
    item.addEventListener('click', () => {
      state.booking.tierId = item.dataset.tier
      state.booking.tierQty = 1
      rerenderPanel(l, dates, slots)
    })
  })

  // Qty stepper
  panel.querySelectorAll('[data-qty]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const delta = parseInt(btn.dataset.qty)
      state.booking.tierQty = Math.max(1, Math.min(10, state.booking.tierQty + delta))
      rerenderPanel(l, dates, slots)
    })
  })

  // Book button
  const bookBtn = document.getElementById('bookBtn')
  if (bookBtn && !bookBtn.disabled) {
    bookBtn.addEventListener('click', () => confirmBooking(l))
  }
}

function rerenderPanel(l, dates, slots) {
  const panel = document.getElementById('bookingPanel')
  if (!panel) return
  panel.innerHTML = l.category === 'events'
    ? renderEventBookingPanel(l)
    : renderRestaurantBookingPanel(l, dates, slots)
  wireBookingPanel(l, dates, slots)
}

function confirmBooking(l) {
  const sel = state.booking
  const isEvent = l.category === 'events'
  const tier = isEvent ? (l.ticketTiers || []).find(t => t.id === sel.tierId) : null
  const code = 'SPT-' + Math.floor(Math.random() * 9000 + 1000)
  const total = tier ? (tier.price * sel.tierQty * 1.05).toFixed(2) : '0.00'

  const newBooking = {
    id: 'b' + Date.now(),
    listingId: l.id,
    listingName: l.name,
    listingImage: l.image,
    date: isEvent ? (l.eventDate || sel.date) : sel.date,
    time: isEvent ? (l.eventTime || '7:00 PM') : sel.time,
    partySize: isEvent ? sel.tierQty : sel.party,
    confirmationCode: code,
    points: l.pointsEarned,
    status: 'confirmed',
    type: l.category === 'events' ? 'event' : 'restaurant',
    tierName: tier?.name,
    total,
  }
  state.bookings = [newBooking, ...state.bookings]
  saveBookings(state.bookings)

  state.booking = { date: 'Sat, Jun 28', time: null, party: 2, tierId: null, tierQty: 1 }

  navigate('confirm', {
    confirmData: {
      name: l.name,
      date: newBooking.date,
      time: newBooking.time,
      party: newBooking.partySize,
      code,
      points: l.pointsEarned,
      total,
      isEvent,
      tierName: tier?.name,
    }
  })
}

/* ── CONFIRMATION ── */
function renderConfirmation(el, data) {
  if (!data) { navigate('home'); return }

  el.innerHTML = `
    <div class="confirm-page">
      <div class="confirm-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#15803D" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <h2>${data.isOrder ? 'Order placed!' : data.isEvent ? 'Tickets confirmed!' : 'Booking confirmed!'}</h2>
      <p>${data.isOrder ? 'Your order is being prepared. Estimated delivery in 25–35 minutes.' : data.isEvent ? 'Your tickets have been confirmed. We\'ll send them to your email.' : 'Your reservation has been confirmed. We\'ll send a confirmation to your email.'}</p>

      <div class="confirm-card">
        <div class="confirm-card-name">${data.name}</div>
        <div class="confirm-rows">
          <div class="confirm-row"><span>Date</span><span>${data.date}</span></div>
          <div class="confirm-row"><span>Time</span><span>${data.time}</span></div>
          ${data.isEvent
            ? `<div class="confirm-row"><span>Tickets</span><span>${data.party}× ${data.tierName || 'General'}</span></div>
               <div class="confirm-row"><span>Total paid</span><span>$${data.total}</span></div>`
            : `<div class="confirm-row"><span>Party size</span><span>${data.party} guests</span></div>`}
          <div class="confirm-row"><span>Points earned</span><span style="color:var(--g500)">+${data.points} pts</span></div>
        </div>
        <div class="confirm-code">${data.code}</div>
      </div>

      <div class="confirm-btns">
        <button class="bc-btn" onclick="navigate('bookings')">View bookings</button>
        <button class="bp-btn" onclick="navigate('home')">Back to home</button>
      </div>
    </div>
  `
}

/* ── BOOKINGS ── */
function renderBookings(el) {
  const upcoming = state.bookings.filter(b => b.status === 'confirmed')
  const past     = state.bookings.filter(b => b.status !== 'confirmed')
  const list     = state.bookingsTab === 'upcoming' ? upcoming : past

  el.innerHTML = `
    <div style="margin-bottom:24px">
      <div class="page-title">My Bookings</div>
      <div class="page-sub">Track and manage your reservations &amp; tickets.</div>
    </div>

    <div class="bookings-tabs">
      <button class="b-tab ${state.bookingsTab === 'upcoming' ? 'active' : ''}" data-tab="upcoming">
        Upcoming (${upcoming.length})
      </button>
      <button class="b-tab ${state.bookingsTab === 'past' ? 'active' : ''}" data-tab="past">
        Past (${past.length})
      </button>
    </div>

    <div id="bookings-list">
      ${list.length ? list.map(b => bookingCard(b)).join('') : `
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          <h3>${state.bookingsTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}</h3>
          <p>${state.bookingsTab === 'upcoming' ? 'Book a restaurant or event to see it here.' : 'Your completed bookings will appear here.'}</p>
          ${state.bookingsTab === 'upcoming' ? `<button class="bp-btn" style="width:auto;padding:12px 24px" onclick="navigate('browse')">Browse now</button>` : ''}
        </div>
      `}
    </div>
  `

  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.bookingsTab = btn.dataset.tab
      renderBookings(el)
    })
  })
}

function bookingCard(b) {
  const isPast = b.status !== 'confirmed'
  return `
    <div class="booking-card">
      <div class="bc-top">
        <div class="bc-img">
          <img src="${b.listingImage}" alt="${b.listingName}" style="height:120px" />
        </div>
        <div class="bc-body">
          <div class="bc-name">${b.listingName}</div>
          <div class="bc-date">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            ${b.date} · ${b.time}
          </div>
          <div class="bc-meta">${b.type === 'event' ? `${b.partySize} ticket${b.partySize > 1 ? 's' : ''}` : `${b.partySize} guest${b.partySize > 1 ? 's' : ''}`}</div>
          <span class="bc-status ${isPast ? 'bc-completed' : 'bc-confirmed'}">
            ${isPast
              ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Completed`
              : `<svg width="8" height="8" viewBox="0 0 24 24" fill="#15803D"><circle cx="12" cy="12" r="10"/></svg> Confirmed`}
          </span>
        </div>
      </div>
      <div class="bc-points">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#F59E0B"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
        <strong>+${b.points} pts</strong> earned · Ref: ${b.confirmationCode}
      </div>
      ${!isPast ? `
        <div class="bc-actions">
          <button class="bc-btn bc-btn-primary" onclick="navigate('detail', {detailId: ${b.listingId}})">View details</button>
          <button class="bc-btn" onclick="navigate('detail', {detailId: ${b.listingId}})">Modify</button>
          <button class="bc-btn bc-btn-danger" data-cancel="${b.id}">Cancel</button>
        </div>
      ` : `
        <div class="bc-actions">
          <button class="bc-btn bc-btn-primary" onclick="navigate('detail', {detailId: ${b.listingId}})">Book again</button>
          ${b.canReview !== false ? `<button class="bc-btn" onclick="showToast('Review submitted!','success')">Leave a review</button>` : ''}
        </div>
      `}
    </div>
  `
}

document.addEventListener('click', (e) => {
  const cancelBtn = e.target.closest('[data-cancel]')
  if (cancelBtn) {
    const id = cancelBtn.dataset.cancel
    if (confirm('Cancel this booking?')) {
      state.bookings = state.bookings.map(b => b.id === id ? {...b, status: 'cancelled'} : b)
      saveBookings(state.bookings)
      renderBookings(document.getElementById('pageContent'))
      showToast('Booking cancelled', '')
    }
  }
})

/* ── PROFILE ── */
function renderProfile(el) {
  const progress = CURRENT_USER.points / CURRENT_USER.nextTierPoints

  el.innerHTML = `
    <div class="page-title" style="margin-bottom:24px">Profile</div>

    <div class="profile-header">
      <div class="profile-avatar">D</div>
      <div>
        <div class="profile-name">${CURRENT_USER.name}</div>
        <div class="profile-email">${CURRENT_USER.email}</div>
      </div>
    </div>

    <div class="points-card">
      <div class="pc-top">
        <div>
          <div class="pc-label">Spotly Points</div>
          <div class="pc-value">${CURRENT_USER.points.toLocaleString()}</div>
        </div>
        <div class="pc-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/></svg>
        </div>
      </div>
      <div class="pc-bar"><div class="pc-bar-fill" style="width:${Math.min(progress*100,100)}%"></div></div>
      <div class="pc-sub">${(CURRENT_USER.nextTierPoints - CURRENT_USER.points).toLocaleString()} pts until your next reward tier · ${CURRENT_USER.tier} tier</div>
    </div>

    <div class="sec-title" style="margin-bottom:12px">Account</div>
    <div class="menu-list">
      <div class="menu-item" onclick="navigate('bookings')">
        <div class="mi-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--s500)" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
        </div>
        <span class="mi-label">My Bookings &amp; Tickets</span>
        <svg class="mi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      <div class="menu-item" onclick="showToast('Coming soon')">
        <div class="mi-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--s500)" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
        </div>
        <span class="mi-label">Payment methods</span>
        <svg class="mi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      <div class="menu-item" onclick="showToast('Coming soon')">
        <div class="mi-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--s500)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
        <span class="mi-label">Saved addresses</span>
        <svg class="mi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      <div class="menu-item" onclick="showToast('Coming soon')">
        <div class="mi-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--s500)" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
        </div>
        <span class="mi-label">Notifications</span>
        <svg class="mi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      <div class="menu-item" onclick="showToast('Coming soon')">
        <div class="mi-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--s500)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <span class="mi-label">Privacy &amp; Security</span>
        <svg class="mi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
      <div class="menu-item" onclick="showToast('Coming soon')">
        <div class="mi-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--s500)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>
        </div>
        <span class="mi-label">Help &amp; Support</span>
        <svg class="mi-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
      </div>
    </div>

    <button class="signout-btn" id="profileSignout">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:middle;margin-right:6px"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
      Sign out
    </button>
  `

  document.getElementById('profileSignout').addEventListener('click', () => {
    localStorage.removeItem('spotly_auth')
    showPlatform()
  })
}

/* ── CART ── */
function renderCart(el) {
  const grouped = {}
  state.cart.forEach(item => {
    if (!grouped[item.listingId]) grouped[item.listingId] = { name: item.listingName, image: item.listingImage, id: item.listingId, items: [] }
    grouped[item.listingId].items.push(item)
  })
  const groups = Object.values(grouped)
  const subtotal = cartTotal()
  const fee = subtotal * 0.05
  const total = subtotal + fee

  el.innerHTML = `
    <div style="max-width:680px;margin:0 auto">
      <div style="margin-bottom:24px">
        <div class="page-title">My Cart</div>
        <div class="page-sub">${cartCount()} item${cartCount() !== 1 ? 's' : ''} from ${groups.length} venue${groups.length !== 1 ? 's' : ''}</div>
      </div>

      ${!state.cart.length ? `
        <div class="empty-state">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 001.97-1.67L23 6H6"/></svg>
          <h3>Your cart is empty</h3>
          <p>Browse restaurants and groceries to add items.</p>
          <button class="bp-btn" style="width:auto;padding:12px 28px" onclick="navigate('browse')">Start browsing</button>
        </div>
      ` : `
        <div class="cart-groups">
          ${groups.map(g => `
            <div class="cart-group">
              <div class="cg-header" onclick="navigate('detail', {detailId: ${g.id}})">
                <img src="${g.image}" alt="${g.name}" class="cg-img" />
                <div class="cg-name">${g.name}</div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
              </div>
              ${g.items.map(item => `
                <div class="cart-item">
                  <div class="ci-info">
                    <div class="ci-name">${item.itemName}</div>
                    <div class="ci-price">$${item.price.toFixed(2)} each</div>
                  </div>
                  <div class="ci-controls">
                    <button class="ci-btn" onclick="updateCartQty('${item.itemId}', ${item.listingId}, -1)">−</button>
                    <span class="ci-qty">${item.qty}</span>
                    <button class="ci-btn" onclick="updateCartQty('${item.itemId}', ${item.listingId}, 1)">+</button>
                    <span class="ci-subtotal">$${(item.price * item.qty).toFixed(2)}</span>
                    <button class="ci-remove" onclick="removeFromCart('${item.itemId}', ${item.listingId}); navigate('cart')">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <div class="cart-summary">
          <div class="cs-row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
          <div class="cs-row"><span>Spotly delivery fee (5%)</span><span>$${fee.toFixed(2)}</span></div>
          <div class="cs-total"><span>Total</span><strong>$${total.toFixed(2)}</strong></div>
          <button class="bp-btn" onclick="checkoutCart()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="vertical-align:middle;margin-right:6px"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Checkout · $${total.toFixed(2)}
          </button>
          <button class="bc-btn" style="width:100%;margin-top:8px;padding:12px;text-align:center" onclick="navigate('browse')">Continue shopping</button>
        </div>
      `}
    </div>
  `
}

function checkoutCart() {
  if (!state.cart.length) return
  const code = 'SPT-' + Math.floor(Math.random() * 9000 + 1000)
  const total = (cartTotal() * 1.05).toFixed(2)
  const points = Math.floor(cartTotal() * 2)
  // create one booking per venue
  const grouped = {}
  state.cart.forEach(item => {
    if (!grouped[item.listingId]) grouped[item.listingId] = { ...item, items: [] }
    grouped[item.listingId].items.push(item)
  })
  Object.values(grouped).forEach(g => {
    state.bookings = [{
      id: 'b' + Date.now() + g.listingId,
      listingId: g.listingId,
      listingName: g.listingName,
      listingImage: g.listingImage,
      date: 'Today',
      time: 'Delivery',
      partySize: state.cart.filter(c => c.listingId === g.listingId).reduce((n, i) => n + i.qty, 0),
      confirmationCode: code,
      points,
      status: 'confirmed',
      type: 'order',
      total,
    }, ...state.bookings]
  })
  saveBookings(state.bookings)
  state.cart = []
  saveCart()
  updateCartBadge()
  navigate('confirm', {
    confirmData: {
      name: 'Your order',
      date: 'Today',
      time: 'Delivery · 25–35 min',
      party: null,
      code,
      points,
      total,
      isEvent: false,
      isOrder: true,
    }
  })
}

/* ── Toast ── */
let toastTimer
function showToast(msg, type = '') {
  let t = document.querySelector('.toast')
  if (!t) {
    t = document.createElement('div')
    t.className = 'toast'
    document.body.appendChild(t)
  }
  t.innerHTML = (type === 'success'
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`) + msg
  t.className = `toast ${type === 'success' ? 'toast-success' : ''} show`
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800)
}
