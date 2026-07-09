# Auth — Merchant App (`merchant-app`)

## Overview

Merchants authenticate with their phone number + a 6-digit OTP.
On first login the user is created automatically with `role: 'merchant'`.

---

## Flow

```
1. LoginScreen  →  merchant enters phone (+263 77 …)
2. POST /auth/otp/request  →  backend sends SMS (or returns dev_otp in dev)
3. Merchant enters 6-digit code
4. POST /auth/otp/verify   →  backend returns { accessToken, refreshToken, user }
5. Tokens stored in SecureStore; merchant lands on Home (order inbox)
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
| Access token (JWT) | 15 minutes | `spotly_merchant_access` |
| Refresh token | 30 days | `spotly_merchant_refresh` |

Tokens are stored with `expo-secure-store` (iOS Keychain / Android Keystore).

---

## Role assigned

`merchant` — set by `merchant-app/src/context/AuthContext.tsx` when calling `verifyOtp`.

---

## Session restore (app launch)

`AuthProvider` reads `spotly_merchant_refresh` on mount, calls
`POST /auth/token/refresh`, then `GET /auth/me`.
If the backend is unreachable or the refresh token is expired, `isLoading` resolves
to `false` with `user = null` → `AppGate` shows `LoginScreen`.

---

## AppGate routing

```
AuthProvider
  AppGate
    SplashScreen (2.4 s)
    isLoading → blank dark screen
    !user     → LoginScreen (phone + OTP)
    user      → StoreProvider → OrdersProvider → MenuProvider → ThemedNavRoot
```

File: `merchant-app/App.tsx`

---

## Dev testing

In dev (`NODE_ENV !== 'production'`) the backend returns the OTP in the response body:

```json
{ "message": "OTP sent", "dev_otp": "123456" }
```

The OTP is also printed to the backend console and shown inline in the login screen.

### Quick test (curl)

```bash
# 1. Request OTP
curl -X POST http://localhost:4001/auth/otp/request \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+263771000001"}'

# 2. Verify OTP
curl -X POST http://localhost:4001/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+263771000001","code":"123456","role":"merchant","name":"Amanzi Restaurant"}'
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
| `merchant-app/src/context/AuthContext.tsx` | AuthProvider + useAuth hook |
| `merchant-app/src/screens/LoginScreen.tsx` | Login UI (phone + OTP, branded) |
| `merchant-app/App.tsx` | AppGate routing logic |
| `backend/bridge/auth.js` | OTP + JWT backend router |
| `shared/AuthClient.ts` | API helper functions |
