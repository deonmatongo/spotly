// @spotly/shared — internationalisation.
//
// Dependency-free, framework-agnostic. The apps wrap `createI18n()` in a small
// context/hook; this layer is pure so it's testable in Node.
//
// Launch markets: Zimbabwe (English + Shona) and Poland (Polish). English is the
// source-of-truth locale and the fallback for any missing key.

export type Locale = 'en' | 'sn' | 'pl'
export const SUPPORTED_LOCALES: Locale[] = ['en', 'sn', 'pl']
export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  sn: 'chiShona',
  pl: 'Polski',
}

// Default currency per market (overridable per call).
export const LOCALE_CURRENCY: Record<Locale, string> = {
  en: 'USD', // Zimbabwe transacts widely in USD
  sn: 'USD',
  pl: 'PLN',
}

type Dict = Record<string, string>

// Keys are dotted namespaces. Only English must be complete; others fall back.
const en: Dict = {
  'common.ok': 'OK',
  'common.cancel': 'Cancel',
  'common.retry': 'Retry',
  'common.save': 'Save',
  'common.search': 'Search',
  'common.offline': "You're offline — showing saved data",
  'common.back_online': 'Back online',
  'common.loading': 'Loading…',
  'greeting.hello': 'Hello, {name}',
  'greeting.welcome': 'Welcome to Spotly',
  'nav.home': 'Home',
  'nav.orders': 'Orders',
  'nav.account': 'Account',
  'order.status.placed': 'Order placed',
  'order.status.accepted': 'Accepted',
  'order.status.preparing': 'Preparing',
  'order.status.ready': 'Ready',
  'order.status.picked_up': 'Picked up',
  'order.status.en_route': 'On the way',
  'order.status.delivered': 'Delivered',
  'order.status.cancelled': 'Cancelled',
  'checkout.title': 'Checkout',
  'checkout.subtotal': 'Subtotal',
  'checkout.delivery_fee': 'Delivery fee',
  'checkout.total': 'Total',
  'checkout.pay': 'Pay {amount}',
  'checkout.eta': 'Arrives in about {minutes} min',
  'age.gate_title': 'Confirm your age',
  'age.gate_body': 'You must be {age}+ to buy this item.',
  'age.confirm': "I'm {age} or older",
  'error.network': 'Connection problem. Please try again.',
  'error.generic': 'Something went wrong. Please try again.',
  'driver.new_job': 'New delivery offer',
  'driver.accept': 'Accept',
  'driver.decline': 'Decline',
  'merchant.new_order': 'New order',
}

const sn: Dict = {
  'common.ok': 'Zvakanaka',
  'common.cancel': 'Kanzura',
  'common.retry': 'Edzazve',
  'common.save': 'Chengetedza',
  'common.search': 'Tsvaga',
  'common.offline': 'Hauna intaneti — tiri kuratidza data yakachengetwa',
  'common.back_online': 'Wadzokera paintaneti',
  'common.loading': 'Kurodha…',
  'greeting.hello': 'Mhoro, {name}',
  'greeting.welcome': 'Tigashire kuSpotly',
  'nav.home': 'Kumba',
  'nav.orders': 'Zvawaraira',
  'nav.account': 'Akaundi',
  'order.status.placed': 'Odha yaitwa',
  'order.status.accepted': 'Yagamuchirwa',
  'order.status.preparing': 'Kugadzirira',
  'order.status.ready': 'Yagadzirwa',
  'order.status.picked_up': 'Yatorwa',
  'order.status.en_route': 'Iri munzira',
  'order.status.delivered': 'Yasvitswa',
  'order.status.cancelled': 'Yamiswa',
  'checkout.title': 'Kubhadhara',
  'checkout.subtotal': 'Huwandu',
  'checkout.delivery_fee': 'Mari yekutumira',
  'checkout.total': 'Zvose',
  'checkout.pay': 'Bhadhara {amount}',
  'checkout.eta': 'Inosvika mumaminetsi anenge {minutes}',
  'error.network': 'Dambudziko rekubatana. Edzazve.',
  'error.generic': 'Pane chakakanganisika. Edzazve.',
  'driver.accept': 'Gamuchira',
  'driver.decline': 'Ramba',
}

const pl: Dict = {
  'common.ok': 'OK',
  'common.cancel': 'Anuluj',
  'common.retry': 'Ponów',
  'common.save': 'Zapisz',
  'common.search': 'Szukaj',
  'common.offline': 'Jesteś offline — pokazujemy zapisane dane',
  'common.back_online': 'Ponownie online',
  'common.loading': 'Ładowanie…',
  'greeting.hello': 'Cześć, {name}',
  'greeting.welcome': 'Witamy w Spotly',
  'nav.home': 'Start',
  'nav.orders': 'Zamówienia',
  'nav.account': 'Konto',
  'order.status.placed': 'Złożono zamówienie',
  'order.status.accepted': 'Przyjęto',
  'order.status.preparing': 'W przygotowaniu',
  'order.status.ready': 'Gotowe',
  'order.status.picked_up': 'Odebrane',
  'order.status.en_route': 'W drodze',
  'order.status.delivered': 'Dostarczone',
  'order.status.cancelled': 'Anulowane',
  'checkout.title': 'Do kasy',
  'checkout.subtotal': 'Suma częściowa',
  'checkout.delivery_fee': 'Opłata za dostawę',
  'checkout.total': 'Razem',
  'checkout.pay': 'Zapłać {amount}',
  'checkout.eta': 'Dotrze za około {minutes} min',
  'age.gate_title': 'Potwierdź swój wiek',
  'age.gate_body': 'Musisz mieć ukończone {age} lat, aby to kupić.',
  'age.confirm': 'Mam {age} lub więcej lat',
  'error.network': 'Problem z połączeniem. Spróbuj ponownie.',
  'error.generic': 'Coś poszło nie tak. Spróbuj ponownie.',
  'driver.accept': 'Akceptuj',
  'driver.decline': 'Odrzuć',
}

const DICTS: Record<Locale, Dict> = { en, sn, pl }

/** Interpolate {placeholders} from params. */
function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`))
}

/**
 * Resolve the best supported locale from BCP-47 candidates (e.g. device locales
 * like "pl-PL", "sn", "en-ZW"). Falls back to English.
 */
export function detectLocale(candidates?: string | string[], fallback: Locale = DEFAULT_LOCALE): Locale {
  const list = Array.isArray(candidates) ? candidates : candidates ? [candidates] : []
  for (const raw of list) {
    const base = String(raw).toLowerCase().split(/[-_]/)[0]
    if ((SUPPORTED_LOCALES as string[]).includes(base)) return base as Locale
  }
  return fallback
}

export class I18n {
  private _locale: Locale
  constructor(locale: Locale = DEFAULT_LOCALE) {
    this._locale = (SUPPORTED_LOCALES as string[]).includes(locale) ? locale : DEFAULT_LOCALE
  }
  get locale(): Locale { return this._locale }
  setLocale(locale: Locale): void {
    if ((SUPPORTED_LOCALES as string[]).includes(locale)) this._locale = locale
  }

  /** Translate a key, falling back to English, then to the key itself. */
  t(key: string, params?: Record<string, string | number>): string {
    const template = DICTS[this._locale][key] ?? DICTS.en[key] ?? key
    return interpolate(template, params)
  }

  /** Does this key exist in the active locale (not just the fallback)? */
  has(key: string): boolean { return key in DICTS[this._locale] }

  formatNumber(n: number, opts?: Intl.NumberFormatOptions): string {
    try { return new Intl.NumberFormat(this.intlLocale(), opts).format(n) }
    catch { return String(n) }
  }

  formatCurrency(amount: number, currency = LOCALE_CURRENCY[this._locale]): string {
    try {
      return new Intl.NumberFormat(this.intlLocale(), { style: 'currency', currency }).format(amount)
    } catch {
      return `${currency} ${amount.toFixed(2)}`
    }
  }

  private intlLocale(): string {
    return { en: 'en-ZW', sn: 'sn-ZW', pl: 'pl-PL' }[this._locale]
  }
}

export function createI18n(locale?: Locale): I18n {
  return new I18n(locale)
}
