# Spotly — Monthly Running Costs

Estimated infrastructure and third-party costs to operate the Spotly platform
(three mobile apps + Node.js/MQTT/SQLite backend + support dashboard + website).

> **These are planning estimates, not quotes.** Prices are USD as of early 2026
> and change frequently. The dominant costs are **volume-driven** (messaging,
> maps, compute) — your actual bill tracks user and order volume, not headcount.
> Payment processing fees are a **pass-through % of transaction value** and are
> listed separately, not in the monthly totals.

---

## TL;DR

| Stage | Monthly users | Orders/mo | **Est. monthly cost** |
|---|---|---|---|
| **Pilot** (MVP / soft launch) | ~500 | ~2,000 | **$110 – $160** |
| **Growth** | ~5,000 | ~20,000 | **$850 – $1,100** |
| **Scale** | ~50,000 | ~150,000 | **$4,800 – $5,800** |

Plus fixed annual: **Apple Developer $99/yr** (~$8.25/mo) and **Google Play $25
one-time**.

---

## What Spotly runs on

| Component | Technology | Billing driver |
|---|---|---|
| Backend API + MQTT bridge | Node.js / Express + Aedes/Mosquitto | Compute hours |
| Database | SQLite now → Postgres at scale | Storage + IOPS |
| Real-time messaging | MQTT (apps) + Socket.io (dashboard) | Compute (bundled) |
| OTP auth | Twilio Verify **or** self-managed OTP | Per verification / per message |
| WhatsApp support | Twilio WhatsApp Business API | Per conversation / message |
| Push notifications | Expo Push | **Free** |
| Maps & live tracking | Google Maps / Mapbox | Map loads + directions calls |
| Image hosting | Cloudflare R2 / S3 + CDN | Storage + egress |
| Marketing website | Vercel / Netlify | Mostly free tier |
| Payments | EcoCash / card processor | **% of GMV (pass-through)** |

---

## Detailed breakdown by stage

### 🟢 Pilot — ~500 users, ~2k orders/mo

| Line item | Provider (example) | Cost/mo |
|---|---|---|
| Backend compute (1 small instance) | DigitalOcean 2GB droplet / Railway | $12 – $25 |
| Database | SQLite on the same box | $0 |
| MQTT broker | Mosquitto co-located on the box | $0 |
| Image storage + CDN | Cloudflare R2 (few GB) | $5 |
| Twilio OTP (self-managed, ~1k sends) | WhatsApp/SMS send only | $30 – $50 |
| WhatsApp support (user-initiated) | Meta service convos free + Twilio msg fee | $5 – $15 |
| Maps | Google/Mapbox free tier | $0 |
| Push notifications | Expo | $0 |
| Website | Vercel free / Hobby | $0 |
| Domain (amortized) | — | $1 – $2 |
| Apple Developer (amortized) | $99/yr | $8 |
| Monitoring | Sentry free tier | $0 |
| **Subtotal** | | **~$110 – $160** |

### 🟡 Growth — ~5k users, ~20k orders/mo

| Line item | Cost/mo |
|---|---|
| Backend compute (2–4 vCPU + load balancer) | $60 – $120 |
| Managed Postgres | $50 – $100 |
| MQTT broker (dedicated instance or HiveMQ Cloud) | $25 – $60 |
| Image storage + CDN | $20 – $50 |
| Twilio OTP (~10k verifications) | $300 – $500 |
| WhatsApp support conversations | $60 – $120 |
| SMS fallback | $30 – $60 |
| Maps / live tracking | $100 – $200 |
| Website (Vercel Pro) | $20 |
| Monitoring (Sentry Team) | $26 |
| Apple Developer (amortized) | $8 |
| **Subtotal** | **~$850 – $1,100** |

### 🔴 Scale — ~50k users, ~150k orders/mo

| Line item | Cost/mo |
|---|---|
| Backend compute (multi-instance, autoscale) | $350 – $500 |
| Managed Postgres (HA + read replica) | $200 – $400 |
| MQTT broker (hosted cluster, e.g. EMQX/HiveMQ) | $200 – $500 |
| Image storage + CDN | $100 – $300 |
| Twilio OTP (~60k verifications) | $2,000 – $2,800 |
| WhatsApp support conversations | $300 – $500 |
| SMS fallback | $150 – $250 |
| Maps / live tracking | $400 – $700 |
| Website + edge | $20 – $40 |
| Monitoring / logging / alerting | $80 – $150 |
| Apple Developer (amortized) | $8 |
| **Subtotal** | **~$4,800 – $5,800** |

---

## The two costs that dominate at scale

### 1. OTP verification (Twilio)
Twilio **Verify** charges ~**$0.05 per verification** *on top of* the message
delivery cost — at 60k verifications/mo that's ~$3,000 alone.

**Mitigation — the codebase already supports it.** `backend/bridge/auth.js`
implements a **self-managed OTP** flow that only pays the per-message send
(WhatsApp authentication template ≈ $0.01–0.03 in ZW/PL, or SMS), skipping the
Verify premium. Pair that with:
- **Longer refresh-token sessions** (30 days is already configured) so users
  re-authenticate rarely.
- **WhatsApp over SMS** where possible — cheaper and higher deliverability in
  Zimbabwe.

Switching heavy OTP volume off Twilio Verify onto self-managed WhatsApp
templates can cut this line by **50–70%** at scale.

### 2. Maps & live tracking
Uber/Bolt-style live tracking makes frequent map-load and directions calls.
- **Google Maps**: billed per load/request after the monthly free credit.
- **Mapbox**: 50k free map loads/mo, then per-load — often cheaper for this pattern.

Mitigation: throttle driver-location redraws, cache routes, and prefer Mapbox
vector tiles for the tracking screens.

---

## Costs that are **not** monthly infrastructure

| Item | Nature | Notes |
|---|---|---|
| **Payment processing** | % of GMV | e.g. card ~2.9% + $0.30; EcoCash merchant fees vary. Scales with sales, not infra. |
| Apple Developer Program | $99 / year | Required to ship the iOS apps. |
| Google Play Console | $25 one-time | Per developer account. |
| Domain registration | ~$12–20 / year | |

---

## How to keep the bill down

1. **Start co-located** — one droplet runs Node + Mosquitto + SQLite fine for the
   pilot ($12–25/mo total infra). Split services out only when load demands it.
2. **Use self-managed OTP** (`auth.js`) instead of Twilio Verify once volume grows.
3. **Prefer WhatsApp** for OTP and support — user-initiated support conversations
   are free under Meta's current pricing; only pay Twilio's small per-message fee.
4. **Cache aggressively** — menus/listings via MQTT retained messages (already
   done) and Postgres read replicas cut DB load.
5. **Move SQLite → Postgres only when needed** — the schema in `db.js` is already
   Postgres-compatible, so migration is a config swap, not a rewrite.

---

*Figures are directional estimates for budgeting. Confirm live pricing with each
provider (Twilio, your host, Google/Mapbox, and your payment processor) for the
Zimbabwe (+263) and Poland (+48) markets before committing.*
