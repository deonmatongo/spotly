# Spotly — Mobile Builds (EAS) & Background GPS

The three apps run in **Expo Go** for development. Two capabilities only work in a
**standalone / dev-client build**, not Expo Go:

1. **Background GPS** (driver app) — the always-on location + foreground service.
2. **Push notifications** on a real device with production credentials.

The code and native config for both are **already in place** — this doc is how to
produce the builds that activate them.

> API keys / store accounts are deferred. Placeholders are marked `[…]`.

---

## Background GPS — already coded, needs a build

The driver app already ships the full background-location implementation:

| Piece | File | Status |
|---|---|---|
| Background task (`TaskManager.defineTask`) | `driver-app/src/services/locationTask.ts` | ✅ |
| `startLocationUpdatesAsync` + foreground-service notification | `driver-app/src/services/locationTracker.ts` | ✅ |
| iOS `UIBackgroundModes: ["location"]` + usage strings | `driver-app/app.json` | ✅ |
| Android `ACCESS_BACKGROUND_LOCATION` + `FOREGROUND_SERVICE_LOCATION` | `driver-app/app.json` | ✅ |
| `expo-location` plugin `isAndroidBackgroundLocationEnabled: true` | `driver-app/app.json` | ✅ |

The tracker **degrades gracefully in Expo Go** (foreground-only `watchPositionAsync`)
and switches to the background foreground-service path automatically once it detects
it's running in a standalone build (`Constants.appOwnership !== 'expo'`). So the only
remaining step is producing that build.

---

## One-time setup

```bash
npm install -g eas-cli
eas login                       # needs an Expo account
# In each app dir (client-app / driver-app / merchant-app):
eas build:configure            # eas.json is already committed for all three
```

Each app has an `eas.json` with `development`, `preview`, and `production` profiles.

---

## Build the driver app (to exercise background GPS)

```bash
cd driver-app

# Dev client — hot reload + native modules, for testing background location:
eas build --profile development --platform ios      # or android
# install the build on a physical device, then:
npx expo start --dev-client

# Internal preview (shareable APK / ad-hoc IPA):
eas build --profile preview --platform android
```

On the device, accept **"Allow while using"** then **"Change to Always allow"** when
prompted — background tracking needs *Always*. During a trip you'll see the
persistent "Spotly Driver — trip in progress" notification (the Android foreground
service / iOS background indicator).

---

## Store submission

1. **Apple:** Apple Developer Program ($99/yr). `eas submit --platform ios`.
   App Store review will ask you to justify **Always** background location — the
   reason string is already set ("shares your live location with customers during
   an active delivery").
2. **Google:** Play Console ($25 one-time). `eas submit --platform android`.
   Complete the **background-location declaration** form (prominent-disclosure +
   video) — Google reviews this specifically.

---

## Required config still to fill in

| Item | Where | Needed for |
|---|---|---|
| EAS `projectId` / owner | each `app.json` → `extra.eas.projectId` | any EAS build |
| Apple team / bundle IDs | `eas.json` submit + Apple portal | iOS |
| Google service account JSON | `eas submit` config | Play submission |
| `GOOGLE_MAPS_API_KEY` (Android maps) | `app.json` android config | live maps on Android |
| Push credentials | EAS / APNs + FCM | production push |

---

## OTA updates

After the first store build, ship JS-only changes without a re-review:

```bash
eas update --branch production --message "…"
```

(Requires `expo-updates`, configured per app.)
