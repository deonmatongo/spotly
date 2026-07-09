# Spotly — Compliance & Trust

How Spotly meets its trust, safety, and legal obligations, and what still needs a
provider or a lawyer before launch. Markets: **Zimbabwe (+263)** and **Poland (+48)**.

> ⚠️ **Not legal advice.** The documents in `legal/` are engineering drafts to be
> reviewed and completed by a qualified lawyer in each market before going live.

---

## 1. Age & ID verification (18+ for alcohol and licensed events)

**Built:** a self-declared age gate.

| Piece | Where |
|---|---|
| DB fields | `users.dob`, `users.age_verified`, `users.id_status` |
| Age-gate API | `POST /api/compliance/age` `{ dob }` → sets `age_verified` |
| Status | `GET /api/compliance/status` |
| Purchase guard | `requireAgeVerified` in `backend/bridge/compliance.js` |
| Admin override | Ops console → Users → compliance (`id_status`) |

**To wire up:** mount `requireAgeVerified` on the alcohol / 18+ event checkout
routes so a purchase 403s with `AGE_VERIFICATION_REQUIRED` until the customer
passes the gate. The client catches that code and launches the DOB prompt.

**To harden (needs a provider — deferred):** self-declaration is the baseline.
For regulated alcohol delivery, escalate `id_status` to a real document + liveness
check. Candidates: **Smile ID** (strong Africa/Zimbabwe coverage), **Veriff**, or
**Onfido**. On a verified callback, set `id_status = 'verified'`; on failure,
`'rejected'`. Delivery drivers should also confirm the recipient is 18+ at handover
for alcohol.

---

## 2. Driver background checks

**Built:** a status field and admin workflow — `users.background_check`
(`none → pending → clear | flagged`), settable from the ops console, surfaced on
the driver row. A `flagged` or non-`clear` driver should be blocked from receiving
jobs by the dispatch layer.

**To harden (needs a provider — deferred):** integrate a vetting provider to run
identity + criminal-record + driving-record checks and drive the status
automatically. In Zimbabwe this typically involves ZRP police clearance and
license validation; in Poland, KRK criminal-record + driving-licence checks.
Re-run periodically (e.g. annually) — `background_check` should carry an expiry.

---

## 3. Insurance

**Not built — commercial, not code.** Before drivers carry real orders you need:

- **Public liability** cover for the platform.
- **Goods-in-transit** cover for orders in a rider's possession.
- **Driver accident / third-party** cover (or a verified requirement that each
  driver carries their own, checked during onboarding).
- Event-ticket consumer-protection / refund guarantees where required.

Record proof-of-insurance expiry per driver and gate active status on it (extend
`background_check` with an `insurance_valid_until` field when this is contracted).

---

## 4. Data protection

**Built:** a draft `legal/data-protection.md` describing what's collected, why,
retention, and user rights; automated DB backups (`backup.js`); an immutable
`audit_log` for privileged access; TLS + security headers in production.

**To harden:**
- **Zimbabwe** — comply with the **Data Protection Act [Chapter 11:12] (2021)**;
  register with POTRAZ as a data controller if required.
- **Poland / EU** — full **GDPR**: lawful basis per purpose, DPA with each
  processor (Twilio, host, maps, PSP), a Record of Processing, breach-notification
  procedure (72h), and a route for erasure/portability requests.
- Implement account deletion end-to-end (a `DELETE /api/auth/me` that anonymises
  orders and purges PII while preserving financial records as legally required).

---

## 5. Payments & financial compliance

- **KYC/AML** on merchants and drivers receiving payouts (name, ID, bank/mobile-money
  account) — collected at onboarding, verified before first payout.
- **PCI-DSS** — never store raw card data; delegate to the PSP (see `PAYMENT_PROVIDER.md`).
- Keep an **auditable ledger** of every charge, refund, and payout (the `payments`
  and `payouts` tables are the base; add immutable transaction records for reconciliation).
- Tax: VAT/withholding handling per market and merchant invoicing.

---

## 6. Platform safety & content

- Driver **SOS / emergency** flow (dialer wired in the driver app) and trip sharing.
- Report/block between customers, drivers, and merchants → feeds the **disputes**
  queue (`backend/bridge/admin.js`).
- Merchant menu moderation for prohibited items.
- Rate limiting + input validation + webhook signature verification (`security.js`).

---

## Launch compliance checklist

- [ ] `legal/terms-of-service.md` reviewed & completed by counsel (both markets)
- [ ] `legal/privacy-policy.md` reviewed; published at a public URL; linked in-app
- [ ] `legal/data-protection.md` finalised; POTRAZ / GDPR obligations met
- [ ] Age-gate guard mounted on alcohol + 18+ event checkout
- [ ] ID-verification provider integrated for regulated sales
- [ ] Driver background-check provider integrated; jobs gated on `clear`
- [ ] Insurance contracted; proof + expiry recorded per driver
- [ ] KYC/AML on payout recipients; PSP PCI delegation confirmed
- [ ] Account-deletion / data-export flows implemented
- [ ] DPAs signed with every third-party processor
