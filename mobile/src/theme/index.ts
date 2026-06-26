// Dark theme — navy that pairs with the brand green
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

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.textPrimary, letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '700' as const, color: colors.textPrimary },
  h3: { fontSize: 18, fontWeight: '600' as const, color: colors.textPrimary },
  h4: { fontSize: 16, fontWeight: '600' as const, color: colors.textPrimary },
  body: { fontSize: 15, fontWeight: '400' as const, color: colors.textPrimary },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, color: colors.textSecondary },
  bodySm: { fontSize: 13, fontWeight: '400' as const, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
  caption: { fontSize: 11, fontWeight: '400' as const, color: colors.textLight },
}
