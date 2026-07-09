import { describe, it, expect } from 'vitest'
import { createI18n, detectLocale, SUPPORTED_LOCALES, I18n } from '../index'

describe('i18n', () => {
  it('translates in each supported locale', () => {
    expect(createI18n('en').t('nav.home')).toBe('Home')
    expect(createI18n('sn').t('nav.home')).toBe('Kumba')
    expect(createI18n('pl').t('nav.home')).toBe('Start')
  })

  it('interpolates params', () => {
    expect(createI18n('en').t('greeting.hello', { name: 'Tendai' })).toBe('Hello, Tendai')
    expect(createI18n('pl').t('greeting.hello', { name: 'Ola' })).toBe('Cześć, Ola')
  })

  it('falls back to English when a key is missing in the locale', () => {
    const sn = createI18n('sn')
    // 'merchant.new_order' is only defined in en
    expect(sn.has('merchant.new_order')).toBe(false)
    expect(sn.t('merchant.new_order')).toBe('New order')
  })

  it('falls back to the key itself when absent everywhere', () => {
    expect(createI18n('en').t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('leaves unknown placeholders intact', () => {
    expect(createI18n('en').t('greeting.hello', {})).toBe('Hello, {name}')
  })

  it('detects locale from BCP-47 candidates', () => {
    expect(detectLocale('pl-PL')).toBe('pl')
    expect(detectLocale(['fr-FR', 'sn-ZW', 'en'])).toBe('sn')
    expect(detectLocale('de-DE')).toBe('en')       // unsupported → fallback
    expect(detectLocale(undefined)).toBe('en')
  })

  it('rejects an unsupported locale and defaults to en', () => {
    const i = new I18n('xx' as never)
    expect(i.locale).toBe('en')
  })

  it('switches locale at runtime', () => {
    const i = createI18n('en')
    i.setLocale('pl')
    expect(i.locale).toBe('pl')
    expect(i.t('common.cancel')).toBe('Anuluj')
  })

  it('formats currency by market', () => {
    const usd = createI18n('en').formatCurrency(12.5)
    expect(usd).toMatch(/12\.5/)
    const pln = createI18n('pl').formatCurrency(12.5)
    expect(pln).toMatch(/12/)
  })

  it('every locale defines the core nav + order keys present in English', () => {
    const coreKeys = ['nav.home', 'nav.orders', 'order.status.delivered', 'checkout.total']
    for (const loc of SUPPORTED_LOCALES) {
      const i = createI18n(loc)
      for (const k of coreKeys) expect(i.has(k), `${loc} missing ${k}`).toBe(true)
    }
  })
})
