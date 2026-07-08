import { getApiUrl } from './config'

export interface SpotlyUser {
  id: string
  phone: string
  name: string
  role: 'customer' | 'merchant' | 'driver'
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: SpotlyUser
}

async function post(path: string, body: object) {
  const res = await fetch(`${getApiUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Auth error ${res.status}`)
  return data
}

// Request a 6-digit OTP for this phone number.
// In dev mode the server logs and returns { dev_otp } so you can verify
// without an SMS gateway.
export async function requestOtp(phone: string): Promise<{ devOtp?: string }> {
  const data = await post('/auth/otp/request', { phone })
  return { devOtp: data.dev_otp }
}

// Submit the OTP received by SMS (or from dev_otp) and get tokens back.
export async function verifyOtp(
  phone: string,
  code: string,
  opts?: { role?: string; name?: string },
): Promise<AuthTokens> {
  return post('/auth/otp/verify', { phone, code, ...opts }) as Promise<AuthTokens>
}

// Silently exchange a refresh token for a new access token.
// Throws if the session has expired (user must log in again).
export async function refreshAccessToken(
  refreshToken: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  return post('/auth/token/refresh', { refreshToken })
}

// Revoke the session on the server (best-effort — ignore errors).
export async function logout(refreshToken: string): Promise<void> {
  try { await post('/auth/logout', { refreshToken }) } catch {}
}

// Fetch the current user profile using an access token.
// Returns null on any error so callers can fall back gracefully.
export async function getMe(accessToken: string): Promise<SpotlyUser | null> {
  try {
    const res = await fetch(`${getApiUrl()}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    return res.json() as Promise<SpotlyUser>
  } catch { return null }
}

// Update the display name of the current user.
export async function updateName(accessToken: string, name: string): Promise<void> {
  await fetch(`${getApiUrl()}/auth/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ name }),
  })
}

// Register an Expo push token for this user so the backend can send remote
// pushes. Best-effort — fails silently on simulators.
export async function registerPushToken(userId: string, accessToken: string, pushToken: string): Promise<void> {
  try {
    await fetch(`${getApiUrl()}/auth/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ userId, pushToken }),
    })
  } catch { /* best-effort */ }
}
