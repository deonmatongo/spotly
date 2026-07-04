/* ══════════════════════════════════════════
   SPOTLY WEB — PORTAL AUTH & ROUTING
   Platform select → per-portal login → Business / Driver dashboards.
   (The customer experience lives in the mobile apps, not on the web.)
   ══════════════════════════════════════════ */

function isLoggedIn() {
  return localStorage.getItem('spotly_auth') === '1'
}

/* ── Portals (each has its own demo login) ── */
const PLATFORMS = {
  business: { badge: 'Business portal', title: 'Partner sign in.', sub: 'Manage your live orders, bookings, pricing and earnings on Spotly.', email: 'amanzi@spotly.app', password: 'business' },
  driver:   { badge: 'Driver portal',   title: 'Driver sign in.',  sub: 'Accept deliveries, navigate with GPS and track your payouts.',      email: 'tendai@spotly.app', password: 'driver' },
}
function getPlatform() {
  const p = localStorage.getItem('spotly_platform')
  return (p === 'business' || p === 'driver') ? p : 'business'
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) routeToDashboard()
  else showPlatform()
  setupPlatform()
  setupLogin()
})

/* Route a logged-in user to the right portal */
function routeToDashboard() {
  const p = getPlatform()
  if (p === 'driver') showDriver()
  else showBusiness()
}
function hideAuthViews() {
  document.getElementById('view-platform').hidden = true
  document.getElementById('view-login').hidden = true
}

/* ── Platform select ── */
function showPlatform() {
  document.getElementById('view-platform').hidden = false
  document.getElementById('view-login').hidden = true
  const biz = document.getElementById('view-business'); if (biz) biz.hidden = true
  const drv = document.getElementById('view-driver'); if (drv) drv.hidden = true
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
  const p = platform || getPlatform()
  const meta = PLATFORMS[p] || PLATFORMS.business
  const badge = document.getElementById('loginBadge')
  const title = document.getElementById('loginTitle')
  const sub   = document.getElementById('loginSubtitle')
  const hint  = document.getElementById('loginHint')
  const emailInput = document.getElementById('loginEmail')
  const pwdInput = document.getElementById('loginPwd')
  if (badge) badge.textContent = meta.badge
  if (title) title.textContent = meta.title
  if (sub)   sub.textContent   = meta.sub
  if (hint)  hint.innerHTML = `Demo: <strong>${meta.email}</strong> / <strong>${meta.password}</strong>`
  if (emailInput) emailInput.value = meta.email   // prefill for the demo
  if (pwdInput) pwdInput.value = ''
  document.getElementById('view-platform').hidden = true
  document.getElementById('view-login').hidden = false
}

function setupLogin() {
  const form = document.getElementById('loginForm')
  const err  = document.getElementById('loginError')
  const eye  = document.getElementById('eyeBtn')
  const pwd  = document.getElementById('loginPwd')
  if (!form) return

  if (eye) eye.addEventListener('click', () => {
    pwd.type = pwd.type === 'password' ? 'text' : 'password'
  })

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const email = document.getElementById('loginEmail').value.trim().toLowerCase()
    const pass  = pwd.value
    const acct = PLATFORMS[getPlatform()] || PLATFORMS.business
    if (email === acct.email.toLowerCase() && pass === acct.password) {
      localStorage.setItem('spotly_auth', '1')
      err.hidden = true
      routeToDashboard()
    } else {
      err.hidden = false
      form.querySelectorAll('.input-wrap input').forEach(i => i.style.borderColor = '#EF4444')
      setTimeout(() => form.querySelectorAll('.input-wrap input').forEach(i => i.style.borderColor = ''), 2000)
    }
  })
}
