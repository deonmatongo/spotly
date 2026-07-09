# Spotly — Business Proposal & Development Plan

**Prepared for:** Spotly (Client)
**Prepared by:** Development Team
**Date:** 26 June 2026
**Engagement:** Fixed-scope mobile application build
**Total Fee:** **USD $8,000**
**Timeline:** **8 weeks** (6 phases)

---

## 1. Executive Summary

Spotly is a Zimbabwean lifestyle super-app — a single platform that combines the
best of **OpenTable** (reservations), **ClassPass** (activities & wellness),
**Eventbrite** (events & ticketing), and a **lifestyle concierge**.

From one app a user can:

- Open the app → **Restaurants** → book a table
- Open the app → **Activities** → book a padel court
- Open the app → **Events This Week** → buy a concert ticket
- Open the app → **Spa & Beauty** → book a treatment

This proposal breaks the build into **six phases over eight weeks**. Phases 1–4
deliver the four product surfaces (Customer App, Business Dashboard, Driver
Dashboard, Admin Dashboard) plus discovery, payments, maps and marketing.
Phases 5–6 are dedicated **Testing/QA** and **Debugging, Optimization &
Deployment** so the platform ships stable and store-ready.

The fixed fee for the full scope below is **USD $8,000**.

---

## 2. Platform Overview

The product is delivered as **four connected surfaces** sharing one backend:

| Surface | Audience | Purpose |
|---|---|---|
| **Customer App** | End users | Discover, book, pay, attend |
| **Business Dashboard** | Restaurants, spas, salons, padel courts, studios, gyms | List, manage bookings, get paid |
| **Driver Dashboard** | Delivery drivers | Accept jobs, navigate, earn |
| **Admin Dashboard** | Spotly owners | Approve, moderate, manage commissions & reports |

### Proposed Technology Stack

- **Mobile (Customer & Driver):** React Native (Expo) — single codebase for iOS & Android
- **Dashboards (Business & Admin):** Responsive web (React)
- **Backend:** Node.js API, PostgreSQL, secure file/media storage
- **Realtime:** Live booking availability, driver tracking, support chat
- **Payments:** EcoCash, OneMoney, Visa/Mastercard, bank transfer (Apple Pay/Google Pay ready)
- **Notifications:** Push (FCM/APNs), SMS, email
- **Maps:** Interactive maps, geolocation & directions

---

## 3. Phase Breakdown (6 Phases / 8 Weeks)

> Phases 1–4 are development. Phase 5 is Testing/QA. Phase 6 is Debugging,
> Optimization & Deployment.

| Phase | Title | Weeks | Fee (USD) |
|---|---|---|---|
| 1 | Foundation & Customer App | Weeks 1–2 | $2,000 |
| 2 | Booking Engine, Payments & Business Dashboard | Weeks 3–4 | $1,800 |
| 3 | Driver Dashboard & Admin Dashboard | Week 5 | $1,500 |
| 4 | Events, Discovery, Maps & Marketing | Week 6 | $1,200 |
| 5 | Testing & Quality Assurance | Week 7 | $800 |
| 6 | Debugging, Optimization & Deployment | Week 8 | $700 |
| | **Total** | **8 weeks** | **$8,000** |

---

### Phase 1 — Foundation & Customer App
**Weeks 1–2 · USD $2,000**

The foundation of the whole platform and the customer-facing experience users
will see first.

**Scope**

- Project setup, architecture, shared design system, app navigation & theming (dark/light)
- **Authentication:** registration & login via email, phone number, Google and Apple
- **User profile management** (details, preferences, avatar, settings)
- **Search** across the platform
- **Browse by category:** Restaurants, Cafes, Padel Courts, Spas, Salons, Studios, Gyms, Events & Concerts, Activities & Experiences
- **Location-based recommendations** (content tailored to the user's area)
- **Saved favourites / wishlist**
- **Reviews & ratings** (browse and read)
- Home & discovery screens (venue cards, categories, featured content)

**Deliverables**

- Installable Customer App (iOS & Android) with working auth, profiles, search, browse, favourites
- Core backend, database schema and APIs for users, venues and categories
- Design system reused across all later phases

**Outcome:** A user can sign up, explore every category, search, and save places — the spine the rest of the platform plugs into.

---

### Phase 2 — Booking Engine, Payments & Business Dashboard
**Weeks 3–4 · USD $1,800**

The commercial heart of Spotly: how customers book and pay, and how businesses
receive and manage that business.

**Scope — Booking & Payments (Customer side)**

- **Booking system** with real-time availability and instant booking
- **Appointment scheduling**, **restaurant reservations**, and **event ticket purchases**
- Booking **confirmation**, **reminders**, **cancellation**, **rescheduling**
- **QR code check-in**
- **In-app payments:** EcoCash, OneMoney, Visa/Mastercard, bank transfer; secure processing
- **Automatic commission deduction** and **business payouts**
- **Booking history** for the customer

**Scope — Business Dashboard**

- Business **registration & verification**
- Business **profile management**, photo/video uploads
- **Manage services/products**, **set pricing**, **set availability/calendar**
- **Receive, accept/reject and manage bookings**
- **View earnings**, **customer management**
- **Promotions & discount creation**
- **Analytics dashboard** and **reviews management**

**Deliverables**

- End-to-end booking → payment → confirmation flow across all categories
- Payment integrations (EcoCash, OneMoney, cards, bank transfer) with commission split
- Web-based Business Dashboard for onboarding and day-to-day management

**Outcome:** A real transaction works end-to-end — a customer books and pays; a business is verified, lists services, and manages those bookings and earnings.

---

### Phase 3 — Driver Dashboard & Admin Dashboard
**Week 5 · USD $1,500**

The operational layer: delivery logistics and full platform control.

**Scope — Driver Dashboard**

- Driver **registration** and **verification**
- Driver **profile**
- **Accept/reject deliveries**
- **GPS navigation**, **live location tracking**, **delivery status updates**
- **Delivery history**, **earnings dashboard**, **withdrawal requests**
- **Customer contact** feature

**Scope — Admin Dashboard (Spotly owners)**

- Manage all **users**, **businesses** and **drivers**
- **Approve business listings** and **driver accounts**
- Manage **bookings**, **payments**, **commissions**
- Manage **categories**, **events**, **promotions**
- **Reports & analytics**, **customer support management**
- **Content moderation**, **send notifications to users**, **platform settings**

**Deliverables**

- Driver app flow with verification, job acceptance, live tracking and earnings
- Admin web dashboard with full oversight of users, businesses, drivers, payments, commissions and content

**Outcome:** Spotly can approve and govern the marketplace, and delivery operations run end-to-end with live tracking and driver payouts.

---

### Phase 4 — Events, Discovery, Maps & Marketing
**Week 6 · USD $1,200**

The "lifestyle concierge" layer that makes Spotly feel alive and drives repeat usage.

**Scope — Event Discovery**

- Weekly **events calendar**, **concert listings**, **festivals**, **networking**, **sports** and **nightlife** events
- **Event ticket booking**, **event reminders**, **event recommendations**

**Scope — Discovery & Lifestyle**

- "**What's Happening This Week**" section
- **Trending venues**, **trending events**, **new businesses**, **staff picks**, **featured experiences**
- **Date night**, **family activities**, **weekend planner**

**Scope — Maps & Location**

- **Interactive map**, **nearby businesses**, **directions**, **distance from user**, **location filtering**

**Scope — Marketing & Engagement**

- **Promo codes**, **referral program**, **loyalty rewards**, **influencer codes**
- **Featured business placements**
- **Email**, **SMS** and **push** marketing
- **Special offers & promotions** surfaced to users
- **Customer support chat**

**Deliverables**

- Events hub with discovery, ticketing and reminders
- Curated discovery & lifestyle sections and an interactive map
- Marketing toolkit (promos, referrals, loyalty, featured placements, messaging)

**Outcome:** Spotly becomes a destination users open weekly — discovering what's on, getting recommendations, and being re-engaged through promotions and loyalty.

---

### Phase 5 — Testing & Quality Assurance
**Week 7 · USD $800**

Systematic verification that every feature works correctly across the four
surfaces before launch.

**Scope**

- **Functional testing** of all user journeys (book a table, book padel, buy a ticket, book a spa treatment)
- **Cross-platform & device testing** (iOS and Android, multiple screen sizes and OS versions)
- **Payment testing in sandbox** (EcoCash, OneMoney, cards, bank transfer) including commission split and payouts
- **Booking-flow edge cases:** double bookings, cancellations, rescheduling, QR check-in, time-zone/availability conflicts
- **Role-based testing** across Customer, Business, Driver and Admin dashboards
- **Performance & load testing**, **security review** (auth, payments, data access)
- **User Acceptance Testing (UAT)** with the client, with a tracked issue list

**Deliverables**

- Test plan and executed test report
- Prioritized defect/issue log from QA and UAT
- Sign-off checklist per surface

**Outcome:** A clear, evidence-based picture of quality and a ranked list of everything to fix before launch.

---

### Phase 6 — Debugging, Optimization & Deployment
**Week 8 · USD $700**

Resolve everything found in Phase 5, polish performance, and ship to the stores.

**Scope**

- **Bug fixing** of all issues raised in QA/UAT (prioritized critical → minor)
- **Performance optimization** (load times, list performance, image/media handling)
- **Stability hardening** (error handling, edge cases, offline/poor-network behaviour)
- **Final UI/UX polish** and accessibility pass
- **App Store & Google Play submission** preparation (assets, listings, compliance)
- **Production deployment** of backend and dashboards
- **Handover:** source code, documentation, environment/credentials, and a walkthrough/training session

**Deliverables**

- Stable, store-ready Customer & Driver apps and live Business & Admin dashboards
- Production deployment + submission packages
- Documentation and knowledge-transfer session

**Outcome:** Spotly is live, stable and in the hands of real users and businesses.

---

## 4. Timeline at a Glance

```
Week:        1     2     3     4     5     6     7     8
Phase 1  [==========]
Phase 2              [==========]
Phase 3                          [=====]
Phase 4                                [=====]
Phase 5 (Testing)                            [=====]
Phase 6 (Debug/Deploy)                             [=====]
```

| Week | Focus |
|---|---|
| 1–2 | Foundation & Customer App |
| 3–4 | Booking, Payments & Business Dashboard |
| 5 | Driver & Admin Dashboards |
| 6 | Events, Discovery, Maps & Marketing |
| 7 | Testing & QA |
| 8 | Debugging, Optimization & Deployment |

---

## 5. Investment & Payment Schedule

**Total fixed fee: USD $8,000** for the full scope in Phases 1–6.

| Milestone | Trigger | Amount | % |
|---|---|---|---|
| Deposit | Project kick-off (start of Week 1) | $2,400 | 30% |
| Milestone 1 | End of Phase 2 (end of Week 4) | $2,400 | 30% |
| Milestone 2 | End of Phase 4 (end of Week 6) | $1,600 | 20% |
| Final | On deployment & handover (end of Week 8) | $1,600 | 20% |
| | **Total** | **$8,000** | **100%** |

*Per-phase fee allocation is shown in Section 3 for transparency; invoicing
follows the milestone schedule above.*

---

## 6. What's Included

- All features listed in Phases 1–4 across the four surfaces
- One iOS app and one Android app (single React Native codebase) for Customer and Driver
- Web Business Dashboard and web Admin Dashboard
- Payment integrations: EcoCash, OneMoney, Visa/Mastercard, bank transfer
- Push, SMS and email notifications
- Testing/QA and debugging (Phases 5–6)
- Store submission support, deployment, documentation and a handover session

---

## 7. Out of Scope (Future — Phase 2 Roadmap)

The following are **not** included in this 8-week engagement and can be quoted
separately as a future phase:

- Concierge chat ("Plan my weekend") and **AI recommendations**
- **Group bookings**, **corporate accounts**, **membership subscriptions**
- **Hotel bookings**, **travel experiences**, **car-hire bookings**
- **Private event bookings**
- Apple Pay / Google Pay (architecture will be ready; activation in a later phase)

---

## 8. Assumptions & Notes

- Client provides branding assets, content (initial venues/events) and access to
  payment-provider merchant accounts (EcoCash, OneMoney, card acquirer).
- Third-party costs (developer accounts, payment-gateway fees, SMS/push
  credits, map/API usage, hosting) are billed at cost or covered by the client.
- Timeline assumes timely client feedback at each milestone; UAT in Week 7
  requires client availability.
- Scope is fixed; new features beyond this document are handled via a simple
  change-request and may affect timeline and fee.

---

*This proposal is valid for 30 days from the date above.*
