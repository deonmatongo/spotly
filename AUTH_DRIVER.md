# Auth — Driver App (`driver-app`)

## Overview

Drivers authenticate with their phone number + a 6-digit OTP.
On first login the user is created automatically with `role: 'driver'`.

---

## Flow

```
1. LoginScreen  →  driver enters phone (+263 77 …)
2. POST /auth/otp/request  →  backend sends SMS (or returns dev_otp in dev)
3. Driver enters 6-digit code
4. POST /auth/otp/verify   →  backend returns { accessToken, refreshToken, user }
5. Tokens stored in SecureStore; driver lands on Home (job feed)
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
| Access token (JWT) | 15 minutes | `spotly_driver_access` |
| Refresh token | 30 days | `spotly_driver_refresh` |

Tokens are stored with `expo-secure-store` (iOS Keychain / Android Keystore).

---

## Role assigned

`driver` — set by `driver-app/src/context/AuthContext.tsx` when calling `verifyOtp`.

---

## Session restore (app launch)

`AuthProvider` reads `spotly_driver_refresh` on mount, calls
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
    !user     → LoginScreen (phone + OTP, bicycle icon)
    user      → DriverProvider → JobsProvider → ThemedNavRoot
```

File: `driver-app/App.tsx`

---

## Driver ID usage

After login, `user.id` (from `useAuth()`) is used as the driver's canonical identifier for:
- Job acceptance and dispatch (`driverId` field on orders)
- Payout requests (`POST /payments/drivers/:id/payouts/request`)
- Earnings history (`GET /payments/drivers/:id/payouts`)

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
  -d '{"phone":"+263772000001"}'

# 2. Verify OTP
curl -X POST http://localhost:4001/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+263772000001","code":"123456","role":"driver","name":"Tatenda Moyo"}'
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
| `driver-app/src/context/AuthContext.tsx` | AuthProvider + useAuth hook |
| `driver-app/src/screens/LoginScreen.tsx` | Login UI (phone + OTP, bicycle icon) |
| `driver-app/App.tsx` | AppGate routing logic |
| `backend/bridge/auth.js` | OTP + JWT backend router |
| `shared/AuthClient.ts` | API helper functions |
