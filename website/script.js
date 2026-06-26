/* ============================================
   SPOTLY WEBSITE — SCRIPT
   ============================================ */

// Nav scroll effect
const nav = document.getElementById('nav')
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20)
}, { passive: true })

// Mobile menu toggle
const hamburger = document.getElementById('hamburger')
const navMobile = document.getElementById('nav-mobile')
let menuOpen = false

hamburger.addEventListener('click', () => {
  menuOpen = !menuOpen
  navMobile.classList.toggle('open', menuOpen)
  const spans = hamburger.querySelectorAll('span')
  if (menuOpen) {
    spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)'
    spans[1].style.opacity = '0'
    spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)'
  } else {
    spans.forEach(s => { s.style.transform = ''; s.style.opacity = '' })
  }
})

// Close mobile menu on link click
navMobile.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => {
    menuOpen = false
    navMobile.classList.remove('open')
    hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = '' })
  })
})

// Feature tabs — clicking items switches the phone screen
const featureItems = document.querySelectorAll('.feature-item')
const featureMocks = document.querySelectorAll('.feature-mock')

featureItems.forEach(item => {
  item.addEventListener('click', () => {
    const idx = item.dataset.index

    featureItems.forEach(f => f.classList.remove('feature-item-active'))
    item.classList.add('feature-item-active')

    featureMocks.forEach(m => m.classList.remove('feature-mock-active'))
    const target = document.querySelector(`.feature-mock[data-feature="${idx}"]`)
    if (target) target.classList.add('feature-mock-active')
  })
})

// Auto-rotate feature tabs
let featureIdx = 0
setInterval(() => {
  featureIdx = (featureIdx + 1) % featureItems.length
  featureItems[featureIdx].click()
}, 3500)

// Scroll-triggered fade-in
const fadeEls = document.querySelectorAll('.cat-card, .step, .testimonial-card, .feature-item, .store-btn')

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1'
      entry.target.style.transform = entry.target.style.transform.replace('translateY(24px)', 'translateY(0)')
      observer.unobserve(entry.target)
    }
  })
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })

fadeEls.forEach((el, i) => {
  el.style.opacity = '0'
  el.style.transform = (el.style.transform || '') + ' translateY(24px)'
  el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`
  observer.observe(el)
})

// Smooth active nav link highlighting
const sections = document.querySelectorAll('section[id]')
const navLinks = document.querySelectorAll('.nav-links a')

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id
      navLinks.forEach(a => {
        a.style.color = a.getAttribute('href') === `#${id}` ? 'var(--green-800)' : ''
      })
    }
  })
}, { threshold: 0.4 })

sections.forEach(s => sectionObserver.observe(s))

// Animate stat numbers on scroll
const statNums = document.querySelectorAll('.stat-num')
const statObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target
      const target = parseInt(el.textContent.replace(/\D/g, ''), 10)
      const suffix = el.textContent.replace(/[0-9]/g, '')
      if (isNaN(target)) return
      let current = 0
      const step = Math.ceil(target / 40)
      const timer = setInterval(() => {
        current = Math.min(current + step, target)
        el.textContent = current + suffix
        if (current >= target) clearInterval(timer)
      }, 30)
      statObserver.unobserve(el)
    }
  })
}, { threshold: 1.0 })

statNums.forEach(n => statObserver.observe(n))
