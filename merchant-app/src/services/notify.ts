import * as Notifications from 'expo-notifications'

// Show notifications while the app is foregrounded too (banner + list).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

let asked = false
export async function ensureNotifPermission() {
  if (asked) return
  asked = true
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') await Notifications.requestPermissionsAsync()
  } catch { /* ignore — notifications are best-effort */ }
}

// Fire a local notification now. Backgrounded remote push (via a push server)
// is a later addition; this delivers order updates while the app is running.
export async function notify(title: string, body: string) {
  try {
    await ensureNotifPermission()
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    })
  } catch { /* ignore */ }
}
