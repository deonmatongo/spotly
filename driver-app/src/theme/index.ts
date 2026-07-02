// Shared design system — kept in lockstep with mobile/src/theme so the driver
// app and customer app read as one product family.
export const darkColors = {
  primary: '#16A34A',
  primaryMid: '#22C55E',
  primaryLight: '#4ADE80',
  primaryPale: 'rgba(34,197,94,0.16)',
  primaryBorder: 'rgba(34,197,94,0.35)',
  dark: '#0D1B2A',
  white: '#FFFFFF',
  background: '#0B1622',
  surface: '#13263A',
  surfaceAlt: '#1B3149',
  border: '#27405A',
  divider: '#1C3045',
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  textLight: '#64748B',
  amber: '#F59E0B',
  red: '#EF4444',
  redLight: 'rgba(239,68,68,0.16)',
  blue: '#3B82F6',
  bluePale: 'rgba(59,130,246,0.16)',
}

// Light theme — clean white with the original brand green
export const lightColors: typeof darkColors = {
  primary: '#15803D',
  primaryMid: '#16A34A',
  primaryLight: '#22C55E',
  primaryPale: '#DCFCE7',
  primaryBorder: '#BBF7D0',
  dark: '#0D1B2A',
  white: '#FFFFFF',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  border: '#E5E7EB',
  divider: '#F3F4F6',
  textPrimary: '#111827',
  textSecondary: '#374151',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  amber: '#F59E0B',
  red: '#EF4444',
  redLight: '#FEE2E2',
  blue: '#2563EB',
  bluePale: '#DBEAFE',
}

export type Palette = typeof darkColors

// Default export kept for pre-login screens (onboarding/splash stay dark) and module-level constants.
export const colors = darkColors

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
}

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
}

// Two-voice type system: Space Grotesk carries numbers & headlines (the app's
// personality), Manrope carries everything read at length. Loaded in App.tsx
// via useFonts — these string keys must match the export names exactly.
export const fonts = {
  display: 'SpaceGrotesk_700Bold',
  displayMid: 'SpaceGrotesk_600SemiBold',
  displayLight: 'SpaceGrotesk_500Medium',
  body: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyReg: 'Manrope_400Regular',
}

// Asymmetric corner presets — a single uniform radius on every card is the
// fastest way to look templated. Pairing a sharp corner with a generous one
// gives shapes a cut, folded-paper feel instead of a rounded-rect grid.
export const cut = {
  card: { borderTopLeftRadius: 26, borderTopRightRadius: 8, borderBottomRightRadius: 26, borderBottomLeftRadius: 8 },
  cardFlip: { borderTopLeftRadius: 8, borderTopRightRadius: 26, borderBottomRightRadius: 8, borderBottomLeftRadius: 26 },
  chip: { borderTopLeftRadius: 14, borderTopRightRadius: 4, borderBottomRightRadius: 14, borderBottomLeftRadius: 4 },
  sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, borderBottomRightRadius: 4, borderBottomLeftRadius: 4 },
}
