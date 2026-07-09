# Spotly — Production Readiness

_What's left for the website and apps to be safely used by real people._

**Status today:** the product has crossed from "polished demo" into a **working
system with a real backend**. A Node.js/Express service now persists everything
to SQLite (schema is Postgres-compatible), issues real JWT sessions, and is the
source of truth the MQTT event bus reflects. Auth, payments, payouts, push,
dispatch, ticket scanning, and WhatsApp support are all **code-complete** — most
are running on **dev stubs** that need real provider credentials and hardening
before go-live.

The gap now is not "build the backend" — it's **flip the stubs to real
providers, harden the infrastructure, and ship to the stores.**

---

## ✅ Done since the last review

- **Real backend + database** — Express REST API + SQLite persistence (orders, menus, bookings, tickets, reviews, favorites, notifications, payments, payouts, users, sessions). Survives restarts; the bus reads/writes through it.
- **Real accounts & auth** — phone OTP + JWT access/refresh sessions (`auth.js`), plus a Twilio Verify WhatsApp/SMS flow (`twilio-verify.js`). Roles wired across all three apps.
- **Payments + payouts** — full charge / refund / payout API + ledger tables (`payments.js`). Auto-completes in dev; ready for a real PSP.
- **Push notifications** — `expo-notifications` + a push service and token registry (`push.js`, `notify.ts` in all three apps).
- **Dispatch / matching engine** — presence-aware timed job offers, auto-match to a roster, reassignment, no-driver handling (`dispatch.js`).
- **Ticket redemption** — merchant scan-and-validate screen (`ScanTicketsScreen.tsx`).
- **Live menus** — merchant menu edits publish live to customers (`MenuContext`, `useLiveMenu`).
- **WhatsApp support desk** — inbound webhook + agent dashboard + 24h session rule (`whatsapp-chat.js`, `support-dashboard/`).

---

## Tier 1 — Hard blockers (can't take real money / real users without these)

1. **Provider credentials & go-live switch.** The code is built but running on dev
   stubs that auto-complete. Needs: a real **payment provider** (Paynow / EcoCash /
   OneMoney / Zimswitch / cards) wired into `payments.js`; a real **SMS/WhatsApp
   sender** (Twilio) for OTP + support; and `NODE_ENV=production` so stubs stop
   short-circuiting. See `PAYMENT_PROVIDER.md`, `SMS_PROVIDER.md`, `WHATSAPP_SUPPORT.md`.
2. **Production broker + infrastructure + secrets.** Still the dev Aedes broker with
   open auth, and `localhost` / `192.168.x.x` hardcoded in `tracking.ts` + shared
   config. Needs a **hosted MQTT broker with TLS (`wss://`)** and enforced ACLs,
   **env-based config** (no hardcoded hosts), a strong `JWT_SECRET`, and a
   **managed Postgres** (swap the SQLite adapter — schema already compatible).
3. **App-store distribution.** Apps run in Expo Go. Needs **EAS builds**, Apple +
   Google developer accounts, store listings and review (background-location
   justification), real icons/splash, and OTA updates.
4. **Payments hardening.** Beyond wiring the PSP: capture/refund reconciliation
   against the provider, webhook signature verification, an auditable ledger, and
   idempotency on charge/refund. Heaviest lift, technically and legally.

## Tier 2 — Core product completeness  ✅ _built this pass (see notes)_

5. **Real background GPS.** ✅ Code + native config complete — `locationTask.ts`
   + `locationTracker.ts` (foreground-service location updates) and `app.json`
   (iOS `UIBackgroundModes`, Android `FOREGROUND_SERVICE_LOCATION`). Added
   `eas.json` for all three apps + `MOBILE_BUILDS.md`. _Only remaining step is
   producing the EAS standalone build (needs Apple/Google accounts); it can't run
   in Expo Go._
6. **Merchant self-onboarding.** ✅ Built — `merchant-onboard.js`: `POST
   /api/merchant/onboard` (name→slug, creates storefront listing, promotes the user
   to merchant, opens the store) + profile/hours/open/menu routes; interactive
   onboarding flow demoed. No hand-seeding needed.
7. **Real geocoding + ETAs.** ✅ Built — `geo.js`: provider-abstracted
   (Google/Mapbox/OSRM by env) with a **zero-key fallback** (gazetteer geocoding +
   haversine/ETA model) so it works in dev/CI. `/api/geo/geocode` + `/api/geo/route`.
   _Still needs `GOOGLE_MAPS_API_KEY`/`MAPBOX_TOKEN` + a self-hosted OSRM for prod
   (deferred)._
8. **Order edge cases.** ✅ Built — `order-policy.js` (pure, tested) + `orders-ops.js`:
   cancellation policy by actor, **partial + full refunds** (cumulative), payment
   retry, and out-of-stock resolution (refund-item / substitute / cancel), each
   auto-refunding and notifying the customer.

## Tier 3 — Trust, ops & legal  ✅ _built this pass (see notes)_

9.  **Admin / ops console.** ✅ Built — `backend/bridge/admin.js` (users
    suspend/activate/role/compliance, live order monitor, refund+cancel, dispute
    queue, audit log, ops metrics) + a React ops console (`admin-console/`). Every
    action is role-guarded, rate-limited, and written to an immutable `audit_log`.
10. **Legal & compliance.** ✅ Drafted — `legal/` (terms, privacy, data-protection)
    + `COMPLIANCE.md`, plus a working **age gate** (`compliance.js`,
    `requireAgeVerified`) and driver `background_check` state in the ops console.
    _Still needs: counsel review of the legal drafts, and real ID/background-check
    + insurance **providers** (deferred, documented in `COMPLIANCE.md`)._
11. **Security hardening.** ✅ Built — `security.js`: per-IP rate limiting (tight on
    OTP), security headers, input validation, and constant-time payment-webhook
    HMAC verification; automated retained DB backups (`backup.js`). _Still needs:
    the payment webhook wired to a real PSP secret._
12. **Monitoring & delivery.** ✅ Built — `observability.js`: structured request
    logging, `/api/metrics`, an error handler, and an env-gated Sentry hook; a
    GitHub Actions **CI** pipeline (`.github/workflows/ci.yml`). _Still needs: a
    `SENTRY_DSN` + uptime/alerting and product analytics (deferred)._

## Tier 4 — Polish  ✅ _foundations built this pass_

13. **Resilience & reach.** ✅ Built in `@spotly/shared` (pure, unit-tested):
    - **Offline** — `offline.ts` `Cache` (TTL read-through, serves stale when
      offline) + `OfflineQueue` (durable replay of actions).
    - **Accessibility** — `a11y.ts` prop builders (44pt touch targets, labels,
      live regions) + a WCAG contrast checker.
    - **i18n** — `i18n.ts` English + Shona + Polish, locale detection, market
      currency formatting.
    - **Tests** — 34 shared (vitest) + 15 backend (`node:test`) unit tests, all
      green; CI runs them + typechecks each app (`.github/workflows/ci.yml`).
    - See `RESILIENCE.md`. _Remaining: adopt helpers across every screen, add
      AsyncStorage/NetInfo/expo-localization per app, translate the full catalogue,
      and run device performance passes._

---

## Website — production checklist

The marketing site + Business/Driver dashboards (`website/`) share the same
backend. Before launch the site specifically needs: **HTTPS + a real domain**,
wiring its dashboards to the **authenticated API** (not mock data), **SEO/meta +
Open Graph**, **cookie/privacy + legal pages**, **analytics**, and a **CDN** for
assets.

---

## Recommended go-live sequence

1. **Managed Postgres + hosted broker (TLS/ACLs) + env-based config & secrets** — the foundation everything else assumes.
2. **Wire the real payment provider + reconciliation/webhooks** — the revenue path and biggest risk.
3. **Real SMS/WhatsApp sender for OTP + support** — gates sign-up.
4. **EAS store builds + background-GPS entitlements** — get installable apps out.
5. **Security hardening + monitoring/backups** — before real traffic.
6. **Admin console + legal/compliance** — required to operate and resolve disputes.
7. **Merchant self-onboarding, geocoding/routing, edge cases** — scale the catalogue and ops.
8. **Polish: offline, accessibility, i18n, tests.**

_The `SpotlyClient` SDK and the Postgres-compatible schema were shaped so each of
these slots in behind existing interfaces — these are integration and hardening
tasks, not rewrites._
