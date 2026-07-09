import { describe, it, expect } from 'vitest'
import {
  touchableProps, headerProps, imageProps, hitSlopFor, MIN_TOUCH_TARGET,
  contrastRatio, meetsWCAG, relativeLuminance, hexToRgb,
} from '../index'

describe('a11y prop builders', () => {
  it('builds accessible button props', () => {
    const p = touchableProps('Place order', { hint: 'Confirms and pays' })
    expect(p).toMatchObject({
      accessible: true,
      accessibilityRole: 'button',
      accessibilityLabel: 'Place order',
      accessibilityHint: 'Confirms and pays',
    })
  })

  it('encodes disabled/selected/busy state', () => {
    const p = touchableProps('Tab', { role: 'button', disabled: true, selected: true })
    expect(p.accessibilityState).toEqual({ disabled: true, selected: true })
  })

  it('adds hitSlop to expand small targets to 44pt', () => {
    const p = touchableProps('X', { width: 24, height: 24 })
    expect(p.hitSlop).toEqual({ top: 10, bottom: 10, left: 10, right: 10 })
  })

  it('omits hitSlop for already-large targets', () => {
    expect(touchableProps('Big', { width: 48, height: 48 }).hitSlop).toBeUndefined()
  })

  it('hitSlopFor reaches the minimum target', () => {
    const slop = hitSlopFor(20, 20)
    expect(20 + slop.left + slop.right).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)
  })

  it('marks headers', () => {
    expect(headerProps('Your orders').accessibilityRole).toBe('header')
  })

  it('hides decorative images from assistive tech', () => {
    expect(imageProps().accessible).toBe(false)
    expect(imageProps('Chef photo').accessibilityLabel).toBe('Chef photo')
  })
})

describe('WCAG contrast', () => {
  it('parses #rgb and #rrggbb', () => {
    expect(hexToRgb('#fff')).toEqual([255, 255, 255])
    expect(hexToRgb('0b7a5b')).toEqual([11, 122, 91])
  })

  it('throws on malformed hex', () => {
    expect(() => hexToRgb('#zzz')).toThrow()
  })

  it('black on white is the maximum ratio (~21)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
  })

  it('same colour has ratio 1', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5)
  })

  it('is symmetric regardless of arg order', () => {
    expect(contrastRatio('#0b7a5b', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#0b7a5b'), 5)
  })

  it('luminance is ordered white > mid > black', () => {
    expect(relativeLuminance('#ffffff')).toBeGreaterThan(relativeLuminance('#888888'))
    expect(relativeLuminance('#888888')).toBeGreaterThan(relativeLuminance('#000000'))
  })

  it('applies AA/AAA thresholds correctly', () => {
    // Spotly green on white: good for normal AA text
    expect(meetsWCAG('#0b7a5b', '#ffffff')).toBe(true)
    // A light grey on white fails normal AA but the same pair may pass for large text
    expect(meetsWCAG('#aaaaaa', '#ffffff')).toBe(false)
    expect(meetsWCAG('#000000', '#ffffff', { level: 'AAA' })).toBe(true)
  })
})
