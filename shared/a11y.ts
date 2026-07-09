// @spotly/shared — accessibility helpers.
//
// Prop builders that return plain objects the apps spread onto React Native
// components (works with Pressable/TouchableOpacity/View/Text), plus a WCAG
// contrast calculator to keep the palette legible. All pure → testable.

// WCAG 2.1 minimum interactive target is 44×44 pt (Apple HIG agrees).
export const MIN_TOUCH_TARGET = 44

export type A11yRole =
  | 'button' | 'link' | 'header' | 'image' | 'text' | 'summary'
  | 'adjustable' | 'search' | 'none'

interface TouchableOpts {
  role?: A11yRole
  hint?: string          // accessibilityHint — what happens on activation
  disabled?: boolean
  selected?: boolean
  busy?: boolean
  /** current element size, to compute hitSlop up to MIN_TOUCH_TARGET */
  width?: number
  height?: number
}

interface A11yProps {
  accessible: boolean
  accessibilityRole: A11yRole
  accessibilityLabel: string
  accessibilityHint?: string
  accessibilityState?: { disabled?: boolean; selected?: boolean; busy?: boolean }
  hitSlop?: { top: number; bottom: number; left: number; right: number }
}

/** Expand a too-small control's touch area symmetrically toward MIN_TOUCH_TARGET. */
export function hitSlopFor(width?: number, height?: number) {
  const padX = width && width < MIN_TOUCH_TARGET ? Math.ceil((MIN_TOUCH_TARGET - width) / 2) : 0
  const padY = height && height < MIN_TOUCH_TARGET ? Math.ceil((MIN_TOUCH_TARGET - height) / 2) : 0
  return { top: padY, bottom: padY, left: padX, right: padX }
}

/** Props for an interactive control (button/link/etc). */
export function touchableProps(label: string, opts: TouchableOpts = {}): A11yProps {
  const { role = 'button', hint, disabled, selected, busy, width, height } = opts
  const props: A11yProps = {
    accessible: true,
    accessibilityRole: role,
    accessibilityLabel: label,
  }
  if (hint) props.accessibilityHint = hint
  if (disabled || selected || busy) {
    props.accessibilityState = {
      ...(disabled ? { disabled: true } : {}),
      ...(selected ? { selected: true } : {}),
      ...(busy ? { busy: true } : {}),
    }
  }
  const slop = hitSlopFor(width, height)
  if (slop.top || slop.left) props.hitSlop = slop
  return props
}

/** Props marking a section heading for screen readers. */
export function headerProps(label: string) {
  return { accessible: true, accessibilityRole: 'header' as A11yRole, accessibilityLabel: label }
}

/** Props for an image/icon: label it, or hide it from AT if purely decorative. */
export function imageProps(label?: string) {
  return label
    ? { accessible: true, accessibilityRole: 'image' as A11yRole, accessibilityLabel: label }
    : { accessible: false, accessibilityElementsHidden: true, importantForAccessibility: 'no' as const }
}

/** Announce a live status change (e.g. "Order ready") to screen readers. */
export function liveRegionProps(polite = true) {
  return { accessibilityLiveRegion: (polite ? 'polite' : 'assertive') as 'polite' | 'assertive' }
}

// ── WCAG contrast ───────────────────────────────────────────────────────────────

/** Parse #rgb / #rrggbb → [r,g,b] 0–255. Throws on malformed input. */
export function hexToRgb(hex: string): [number, number, number] {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Invalid hex colour: ${hex}`)
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Relative luminance per WCAG 2.1. */
export function relativeLuminance(hex: string): number {
  const srgb = hexToRgb(hex).map(v => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]
}

/** Contrast ratio between two colours (1–21). */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg)
  const l2 = relativeLuminance(bg)
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Does fg-on-bg meet WCAG? AA: 4.5 (normal) / 3.0 (large ≥18pt or 14pt bold).
 * AAA: 7.0 / 4.5.
 */
export function meetsWCAG(
  fg: string, bg: string,
  { large = false, level = 'AA' as 'AA' | 'AAA' } = {},
): boolean {
  const ratio = contrastRatio(fg, bg)
  const threshold = level === 'AAA' ? (large ? 4.5 : 7) : (large ? 3 : 4.5)
  return ratio >= threshold
}
