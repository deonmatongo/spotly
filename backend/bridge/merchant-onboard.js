// Spotly — merchant self-onboarding.
//
// Turns any authenticated user into a live merchant with a storefront listing,
// then lets them manage profile, hours, open/closed, and menu — no hand-seeding.
// Mounted at /api/merchant in api.js.
//
//   POST  /api/merchant/onboard   { name, category, cuisine?, address, hours?, description?, priceLevel?, image? }
//   GET   /api/merchant/profile
//   PUT   /api/merchant/profile   { name?, cuisine?, address?, hours?, description?, priceLevel? }
//   PATCH /api/merchant/open      { open: boolean }
//   PUT   /api/merchant/menu      { items: [...] }   (proxies the live-menu publish)

const express = require('express')
const { requireAuth } = require('./auth')
const { validate } = require('./security')
const {
  insertListing, updateListingProfile, getListingByMerchant,
  setUserMerchant, merchantSlugExists, getUserById,
  upsertMerchantSettings, upsertMenu,
} = require('./db')

const CATEGORIES = ['food', 'groceries', 'events', 'experiences']

/** business name → url-safe slug, e.g. "Amanzi Restaurant" → "amanzi-restaurant". */
function slugify(name) {
  return String(name).toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'merchant'
}

/** Ensure the slug is unique by appending -2, -3, … if taken. */
function uniqueSlug(base) {
  let slug = base
  let n = 1
  while (merchantSlugExists.get(slug)) { n++; slug = `${base}-${n}` }
  return slug
}

// createMerchantOnboard({ publish }) — publish(topic,obj) mirrors menu to the bus.
function createMerchantOnboard({ publish } = {}) {
  const router = express.Router()
  router.use(requireAuth())

  const myListing = req => {
    const user = getUserById.get(req.user.sub)
    const slug = user?.merchant_id
    return slug ? getListingByMerchant.get(slug) : null
  }

  // ── Onboard ────────────────────────────────────────────────────────────────
  router.post('/onboard',
    validate({
      name:        { type: 'string', required: true, maxLen: 80 },
      category:    { type: 'string', required: true, enum: CATEGORIES },
      address:     { type: 'string', required: true, maxLen: 200 },
      cuisine:     { type: 'string', maxLen: 80 },
      hours:       { type: 'string', maxLen: 120 },
      description: { type: 'string', maxLen: 600 },
      priceLevel:  { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
      image:       { type: 'string', maxLen: 400 },
    }),
    (req, res) => {
      const user = getUserById.get(req.user.sub)
      if (!user) return res.status(401).json({ error: 'Unauthorized' })
      if (user.merchant_id) {
        return res.status(409).json({ error: 'This account already has a merchant storefront.', merchantId: user.merchant_id })
      }

      const v = req.valid
      const slug = uniqueSlug(slugify(v.name))
      const type = v.category === 'food' ? 'restaurant' : v.category === 'events' ? 'event' : v.category

      insertListing.run({
        category: v.category,
        type,
        name: v.name,
        cuisine: v.cuisine || '',
        price_level: v.priceLevel || '$$',
        address: v.address,
        description: v.description || '',
        image: v.image || '',
        hours: v.hours || '',
        merchant_id: slug,
      })
      setUserMerchant.run({ id: user.id, merchant_id: slug })
      upsertMerchantSettings.run({ user_id: user.id, is_open: 1, updated_at: Date.now() })

      const listing = getListingByMerchant.get(slug)
      res.status(201).json({ ok: true, merchantId: slug, listingId: listing.id, role: 'merchant' })
    })

  // ── Profile ─────────────────────────────────────────────────────────────────
  router.get('/profile', (req, res) => {
    const listing = myListing(req)
    if (!listing) return res.status(404).json({ error: 'No storefront yet — onboard first.' })
    res.json(listing)
  })

  router.put('/profile',
    validate({
      name:        { type: 'string', maxLen: 80 },
      cuisine:     { type: 'string', maxLen: 80 },
      address:     { type: 'string', maxLen: 200 },
      hours:       { type: 'string', maxLen: 120 },
      description: { type: 'string', maxLen: 600 },
      priceLevel:  { type: 'string', enum: ['$', '$$', '$$$', '$$$$'] },
    }),
    (req, res) => {
      const listing = myListing(req)
      if (!listing) return res.status(404).json({ error: 'No storefront yet — onboard first.' })
      const v = req.valid
      updateListingProfile.run({
        merchant_id: listing.merchant_id,
        name:        v.name        ?? listing.name,
        cuisine:     v.cuisine     ?? listing.cuisine,
        address:     v.address     ?? listing.address,
        hours:       v.hours       ?? listing.hours,
        description: v.description ?? listing.description,
        price_level: v.priceLevel  ?? listing.price_level,
      })
      res.json(getListingByMerchant.get(listing.merchant_id))
    })

  // ── Open / closed ─────────────────────────────────────────────────────────────
  router.patch('/open', validate({ open: { type: 'boolean', required: true } }), (req, res) => {
    const user = getUserById.get(req.user.sub)
    if (!user?.merchant_id) return res.status(404).json({ error: 'No storefront yet — onboard first.' })
    upsertMerchantSettings.run({ user_id: user.id, is_open: req.valid.open ? 1 : 0, updated_at: Date.now() })
    res.json({ ok: true, open: req.valid.open })
  })

  // ── Menu (publishes live to customers) ────────────────────────────────────────
  router.put('/menu', validate({}), (req, res) => {
    const user = getUserById.get(req.user.sub)
    if (!user?.merchant_id) return res.status(404).json({ error: 'No storefront yet — onboard first.' })
    const items = req.body?.items
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array.' })
    upsertMenu.run({ merchant_id: user.merchant_id, items: JSON.stringify(items), updated_at: Date.now() })
    try { publish?.(`merchants/${user.merchant_id}/menu`, { merchantId: user.merchant_id, items }) } catch {}
    res.json({ ok: true, merchantId: user.merchant_id, count: items.length })
  })

  return router
}

module.exports = { createMerchantOnboard, slugify }
