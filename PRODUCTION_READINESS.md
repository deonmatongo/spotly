# Spotly — Production Readiness

_What's left for this product to be fully used by real people._

**Status today:** a polished, fully-wired **demo**. Everything a user *sees and
touches* is done; almost everything *behind the glass* is still mock. The
customer, driver, and merchant apps plus the website dashboards are all
connected end-to-end over the real-time MQTT event bus (`@spotly/shared`), and
the `SpotlyClient` SDK was deliberately shaped so a real backend can slot in
behind the same method signatures.

---

## ✅ Done
- All four surfaces (customer / driver / merchant apps + website Business & Driver dashboards) with real, considered UX.
- Real-time event bus connecting them end-to-end: order → merchant → driver → live tracking → delivery.
- `SpotlyClient` abstraction built so a real backend can replace the transport without touching screens.

---

## Tier 1 — Hard blockers (can't onboard a single real user without these)

1. **Real backend + database.** Everything lives in in-memory React contexts + `mock.ts`; orders, tickets, bookings, and menus vanish on restart. The bus is a *transport*, not a source of truth — need a service (API + Postgres) that persists state and is the authority the bus reflects. This is the "backend later" that's now the critical path.
2. **Real accounts & auth.** Credentials are hardcoded (`tatendamoyo/123456`, `amanzi@spotly.app/business`). Need real sign-up/login (phone + OTP fits Zimbabwe), sessions/JWT, roles, password reset.
3. **Payments + payouts.** 100% UI-only. Need a real PSP — EcoCash / OneMoney / Zimswitch / cards — plus capture, refunds, a ledger, and actual merchant/driver payouts (the "Request payout" / "Cash out" buttons do nothing). Heaviest lift, technically and legally.
4. **Production broker + config.** Currently the dev Aedes broker with open auth, and `localhost` / `192.168.0.193` hardcoded across every `tracking.ts` + shared config. Need a hosted broker with TLS (`wss://`), enforced ACLs, and env-based config (no hardcoded hosts/IPs).
5. **App-store distribution.** Apps run in Expo Go only. Need EAS builds, Apple/Google developer accounts, store listings + review (background-location justification), real icons/splash (currently reused), and OTA updates.

## Tier 2 — Core product completeness

6. **Push notifications.** In-app only today (`NotificationsContext`). A delivery app is unusable without real push — drivers must get job offers and customers order updates while backgrounded. Needs `expo-notifications` + a push service.
7. **Real background GPS.** The driver publishes real GPS via `expo-location`, but background tracking needs a dev/standalone build (not Expo Go) with the iOS background-location entitlement + Android foreground service. (The simulated-GPS mode is demo-only.)
8. **Merchant onboarding + real menus/inventory**, availability, and pricing — replacing the mock listings.
9. **Dispatch/matching engine.** Job assignment is manual/mock. Real ops need automatic driver-matching, no-driver-available handling, reassignment, timeouts, surge.
10. **Ticket redemption.** QR tickets generate, but nothing *scans/validates* them at the door — needs a scanner/redemption side.
11. **Real geocoding + ETAs.** Addresses are hardcoded coords; ETA uses the public OSRM demo server (rate-limited). Need geocoding + a production routing provider. Android Maps also needs a Google Maps API key.

## Tier 3 — Trust, ops & legal

12. **Admin / ops console** — no surface today to manage users, resolve disputes, refund, or monitor orders.
13. **Legal** — terms, privacy policy, data protection, driver background checks (currently mock), insurance, age/ID checks for event & alcohol sales.
14. **Monitoring, error tracking (Sentry), analytics, backups, CI/CD.**

## Tier 4 — Polish

- Order edge cases (cancel/refund flows are only partial)
- Local persistence / offline support
- Accessibility, internationalisation
- Persisting ratings/reviews for real
- Automated tests beyond the bus contract

---

## Highest-leverage next step

**Tier 1 #1 — the real backend + database.** Auth, payments, persistence, and
dispatch all hang off it, and the `SpotlyClient` interface is already shaped to
accept it. Recommended sequence:

1. Backend + DB (source of truth; bus reads/writes through it)
2. Auth & accounts
3. Payments & payouts
4. Production broker/infra + app-store builds
5. Push notifications & background GPS
6. Dispatch engine, merchant onboarding, ticket redemption
7. Admin console, legal, monitoring
