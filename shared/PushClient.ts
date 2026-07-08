import { getApiUrl } from './config'

// Register the device's Expo push token with the backend so the server
// can send remote push notifications. Call this after every login.
export async function registerPushToken(
  userId: string,
  accessToken: string,
  expoPushToken: string,
): Promise<void> {
  if (!expoPushToken.startsWith('ExponentPushToken[')) return
  try {
    await fetch(`${getApiUrl()}/push/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: expoPushToken }),
    })
  } catch {
    // Best-effort — local notifications still work without this
  }
}

// Unregister on logout so the user stops receiving pushes.
export async function unregisterPushToken(
  accessToken: string,
  expoPushToken: string,
): Promise<void> {
  try {
    await fetch(`${getApiUrl()}/push/token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token: expoPushToken }),
    })
  } catch {}
}
