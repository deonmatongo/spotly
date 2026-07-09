# Spotly — Data Protection Statement

> **DRAFT — requires review by qualified legal counsel.** Complements the Privacy
> Policy with the operational detail regulators and enterprise partners expect.
> Not legal advice.

**Last updated:** [DATE] · **Controller:** [LEGAL ENTITY] · **Contact:** [DPO EMAIL]

## 1. Frameworks
- **Zimbabwe:** Data Protection Act [Chapter 11:12] (2021), enforced by POTRAZ.
  [Confirm data-controller registration requirement.]
- **Poland / EU:** General Data Protection Regulation (GDPR), supervised by UODO.

## 2. Roles
Spotly is the **data controller** for platform accounts and orders. Third parties
that process data on Spotly's instructions are **processors** and must be bound by
a Data Processing Agreement (DPA).

## 3. Record of Processing Activities (summary)
| Purpose | Data | Basis | Retention |
|---|---|---|---|
| Account & auth | Phone, name, role, sessions | Contract | Life of account + [X] |
| Order fulfilment | Items, address, coords, contact | Contract | [X years] |
| Payments & payouts | Amount, method, provider ref | Contract + legal | [Financial-record period] |
| Live tracking | Driver GPS (active trips only) | Contract / legitimate interest | Trip + [short window] |
| Age & ID compliance | DOB/age flag, ID status | Legal obligation | [X] |
| Driver vetting | Background-check status | Legal / legitimate interest | Employment/engagement + [X] |
| Support | Chats, notifications | Contract / legitimate interest | [X months] |
| Security & fraud | IP, device, audit log | Legitimate interest / legal | [X] |

## 4. Processors (maintain a live register + signed DPAs)
| Processor | Purpose | Location | DPA |
|---|---|---|---|
| [Payment provider] | Payments/payouts | [ ] | [ ] |
| Twilio | SMS/WhatsApp OTP + support | [ ] | [ ] |
| [Hosting provider] | Compute, database | [ ] | [ ] |
| [Maps/geocoding] | Routing, ETAs | [ ] | [ ] |
| [Error tracking] | Diagnostics | [ ] | [ ] |

## 5. Data-subject requests
- **Channels:** [PRIVACY EMAIL] and in-app account controls.
- **Timescale:** respond within statutory limits (GDPR: 1 month; ZW DPA: [ ]).
- **Verification:** confirm identity via the account phone before actioning.
- **Deletion:** anonymise orders and purge PII; retain legally required financial
  records in a restricted store. (`DELETE /api/auth/me` — to be implemented.)

## 6. Security controls
- TLS in transit; secrets via environment, never committed.
- Least-privilege access; the ops console is role-guarded and every privileged
  action is written to an immutable `audit_log`.
- Rate limiting + input validation on the API; webhook signature verification.
- Automated, retained database backups (`backend/bridge/backup.js`); backups
  should be shipped off-box and encrypted at rest in production.

## 7. Breach response
1. Contain and assess scope. 2. Log in the incident register. 3. Notify the
supervisory authority where required (**GDPR: within 72 hours**) and affected
users where there is high risk. 4. Remediate and review.
**Incident owner:** [NAME/ROLE] · **Escalation:** [CONTACT]

## 8. Retention & disposal
Data is deleted or anonymised once its purpose ends and legal retention lapses.
Backups age out on the configured retention (`BACKUP_KEEP`).

## 9. Review
This statement is reviewed at least annually and on any material processing change.
