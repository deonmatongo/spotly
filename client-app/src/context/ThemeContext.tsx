import React, { createContext, useContext, useState, ReactNode } from 'react'
import { darkColors, lightColors, Palette } from '../theme'

export type { Palette }
export type ThemeMode = 'dark' | 'light'

interface ThemeContextType {
  mode: ThemeMode
  isDark: boolean
  colors: Palette
  toggle: () => void
  setMode: (m: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>('dark')
  const colors = mode === 'dark' ? darkColors : lightColors
  const toggle = () => setMode(m => (m === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ mode, isDark: mode === 'dark', colors, toggle, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
