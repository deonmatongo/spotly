# Spotly Ops Console

Internal admin dashboard (React + Tailwind) for the Spotly platform — user
management, live order monitoring, refunds, dispute resolution, and an audit log.

- `src/AdminConsole.tsx` — the UI (Overview · Users · Orders · Disputes · Audit)
- `src/useAdminApi.ts` — authenticated client for `/api/admin`
- `src/types.ts` — wire types shared with `backend/bridge/admin.js`

## Access

The console requires a JWT with `role: "admin"`. On a fresh database the backend
seeds a bootstrap admin (`ADMIN_PHONE`, default `+263770000000`) — sign in through
the normal Spotly OTP flow with that number and store the returned access token as
`localStorage["spotly_admin_token"]`. Admins can promote other users from the
**Users** view.

## Run

```bash
npm create vite@latest . -- --template react-ts   # in this folder
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
# render <AdminConsole /> from src/main.tsx, then:
npm run dev
```

Env (`.env`): `VITE_API_BASE=http://localhost:4001`

## Backend

Every action is role-guarded, rate-limited, and written to the immutable
`audit_log`. See the routes in `backend/bridge/admin.js` and the security /
observability layers in `security.js` + `observability.js`.
