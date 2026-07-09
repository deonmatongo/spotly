# Spotly — Resilience & Reach (Tier 4 polish)

Cross-cutting polish so the apps hold up on flaky Zimbabwean/Polish mobile
networks, work for more people, and stay correct as they change. The building
blocks live in `@spotly/shared` (pure, framework-agnostic, unit-tested) and the
apps consume them.

---

## 1. Offline cache for flaky connectivity

`shared/offline.ts` — storage-agnostic, so it runs under AsyncStorage in the apps
and `MemoryStorage` in tests.

- **`Cache`** — TTL'd read-through cache for server state (menus, listings, order
  history). `wrap(key, fetcher)` returns fresh data when online, and **serves the
  last-known value stale rather than nothing when the fetch fails offline** — a
  cold start on no signal still shows real content.
- **`OfflineQueue`** — durable FIFO queue for actions taken offline (e.g. merchant
  "mark ready", driver "accept job"). `flush(handler)` replays them in order when
  connectivity returns, preserves ordering on failure, and drops poison actions
  after `maxAttempts`.

```ts
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Cache, OfflineQueue } from '@spotly/shared'

const menus = new Cache(AsyncStorage, { namespace: 'menus', ttlMs: 60 * 60 * 1000 })
const menu = await menus.wrap(merchantId, () => api.getMenu(merchantId))  // works offline

const queue = new OfflineQueue(AsyncStorage, { namespace: 'merchant-actions' })
await queue.enqueue('order.ready', { ref })          // tap while offline
// on reconnect (NetInfo):
await queue.flush(a => api.advanceStatus(a.payload)) // replays in order
```

Install in each app: `npm install @react-native-async-storage/async-storage @react-native-community/netinfo`.

---

## 2. Accessibility

`shared/a11y.ts` — prop builders you spread onto React Native components, plus a
WCAG contrast checker.

- **`touchableProps(label, opts)`** — sets `accessible`, `accessibilityRole`,
  `accessibilityLabel/Hint`, `accessibilityState`, and auto-computes **`hitSlop`
  so controls reach the 44pt minimum touch target**.
- **`headerProps` / `imageProps` / `liveRegionProps`** — headings, decorative-vs-
  labelled images, and live status announcements ("Order ready").
- **`contrastRatio` / `meetsWCAG`** — verify palette choices meet AA/AAA. Wire into
  a test to guard against regressions (the Spotly green `#0b7a5b` on white passes AA).

```tsx
import { touchableProps } from '@spotly/shared'
<Pressable {...touchableProps('Place order', { hint: 'Confirms and pays', width: 32, height: 32 })} />
```

**Checklist for screens:** every actionable element labelled; icons either
labelled or hidden; text ≥ AA contrast; touch targets ≥ 44pt; status changes in a
live region; test with VoiceOver (iOS) and TalkBack (Android).

---

## 3. Internationalisation

`shared/i18n.ts` — dependency-free, English + **Shona (sn)** + **Polish (pl)** for
the launch markets. English is the source-of-truth and the fallback.

- **`detectLocale(deviceLocales)`** resolves BCP-47 tags → a supported locale.
- **`I18n.t(key, params)`** interpolates and falls back (locale → English → key).
- **`formatCurrency` / `formatNumber`** are market-aware (USD for ZW, PLN for PL).

```ts
import { createI18n, detectLocale } from '@spotly/shared'
import * as Localization from 'expo-localization'

const i18n = createI18n(detectLocale(Localization.getLocales().map(l => l.languageTag)))
i18n.t('greeting.hello', { name })        // "Mhoro, Tendai" in Shona
i18n.formatCurrency(24.5)                 // "$24.50"
```

The dictionaries are a representative starter set (nav, order statuses, checkout,
errors, age gate, driver/merchant prompts); extend the `en`/`sn`/`pl` maps as
screens are translated. The i18n test asserts every locale defines the core keys.

---

## 4. Test coverage (beyond the bus-contract smoke test)

| Suite | Runner | Command | Covers |
|---|---|---|---|
| Shared contract + integration | vitest | `cd shared && npm test` | order model, topics, live bus |
| Shared polish | vitest | `cd shared && npm test` | i18n, offline cache/queue, a11y + WCAG |
| Backend units | node:test | `cd backend/bridge && npm test` | rate limit, validation, HMAC, age calc, 24h window |
| Backend smoke | node | `cd backend/bridge && npm run smoke` | end-to-end bus lifecycle |

All run in CI (`.github/workflows/ci.yml`) on every push/PR, alongside a
TypeScript typecheck for each app. **34 new shared tests + 15 backend unit tests**
were added in this pass, all green.

---

## 5. Cold-start & performance

Concrete wins to apply during screen work (no new deps needed):

- **Hydrate from cache first.** On mount, read `Cache` synchronously-ish before the
  network resolves so the first frame shows real data, not a spinner.
- **Virtualize long lists.** Use `FlatList`/`FlashList` with `keyExtractor`,
  `getItemLayout` where sizes are fixed, and `initialNumToRender` tuned low.
- **Memoize.** `React.memo` list rows; `useMemo`/`useCallback` for derived data and
  handlers passed to memoized children (the contexts already do this in places).
- **Defer non-critical work.** Lazy-load heavy screens (maps, scanner) with
  `React.lazy`/dynamic import so they don't inflate cold start.
- **Trim images.** Serve right-sized images from the CDN; avoid full-res in lists.
- **Measure.** Use the RN performance monitor / Flipper and Expo's startup trace;
  budget cold start and watch the `/api/metrics` `slowRequests` counter for the API.

---

## Status

Built & tested this pass: offline cache + queue, a11y helpers + WCAG checker, i18n
(en/sn/pl), backend unit suite, CI wiring. **Remaining (integration work):** adopt
the helpers across every screen, add AsyncStorage/NetInfo/expo-localization to each
app, translate the full string catalogue, and run device performance passes.
