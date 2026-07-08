# Auth — Customer App (`client-app`)

## Overview

Customers authenticate with their phone number + a 6-digit OTP.
No passwords. On first login the user is created automatically with `role: 'customer'`.

---

## Flow

```
1. OnboardingScreen  →  user enters phone (+263 77 …)
2. POST /auth/otp/request  →  backend sends SMS (or returns dev_otp in dev)
3. User enters 6-digit code
4. POST /auth/otp/verify   →  backend returns { accessToken, refreshToken, user }
5. Tokens stored in SecureStore; user lands on Home
```

---

## API endpoints used

| Method | Path | Description |
|---|---|---|
| POST | `/auth/otp/request` | Send OTP to phone number |
| POST | `/auth/otp/verify` | Exchange OTP for JWT tokens |
| POST | `/auth/token/refresh` | Silent refresh on app launch |
| GET | `/auth/me` | Fetch profile after refresh |
| POST | `/auth/logout` | Delete session on sign-out |

---

## Token lifetimes

| Token | TTL | Storage key |
|---|---|---|
| Access token (JWT) | 15 minutes | `spotly_customer_access` |
| Refresh token | 30 days | `spotly_customer_refresh` |

Tokens are stored with `expo-secure-store` (iOS Keychain / Android Keystore).

---

## Role assigned

`customer` — set by `client-app/src/context/AuthContext.tsx` when calling `verifyOtp`.

---

## Session restore (app launch)

`AuthProvider` reads `spotly_customer_refresh` on mount, calls
`POST /auth/token/refresh`, then `GET /auth/me`.
If the backend is unreachable or the refresh token is expired, `isLoading` resolves
to `false` with `user = null` → `AppGate` shows `OnboardingScreen`.

---

## AppGate routing

```
AuthProvider
  AppGate
    isLoading → blank dark screen (prevents flash)
    !user     → OnboardingScreen (phone + OTP)
    user      → all context providers → RootNavigator
```

File: `client-app/App.tsx`

---

## Dev testing

In dev (`NODE_ENV !== 'production'`) the backend returns the OTP in the response body:

```json
{ "message": "OTP sent", "dev_otp": "123456" }
```

The OTP is also logged to the backend console. No SMS provider needed to test.

### Quick test (curl)

```bash
# 1. Request OTP
curl -X POST http://localhost:4001/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+263771234567"}'

# 2. Verify OTP (use dev_otp from step 1)
curl -X POST http://localhost:4001/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+263771234567","code":"123456","role":"customer","name":"Test User"}'
```

---

## SMS setup for production

See `SMS_PROVIDER.md` for Africa's Talking and Twilio integration snippets.

Required env var: `JWT_SECRET` — generate with:
```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Key files

| File | Purpose |
|---|---|
| `client-app/src/context/AuthContext.tsx` | AuthProvider + useAuth hook |
| `client-app/src/screens/OnboardingScreen.tsx` | Login UI (phone + OTP step) |
| `client-app/App.tsx` | AppGate routing logic |
| `backend/bridge/auth.js` | OTP + JWT backend router |
| `shared/AuthClient.ts` | API helper functions |
