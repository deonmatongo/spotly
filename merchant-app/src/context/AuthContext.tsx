import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as Notifications from 'expo-notifications'
import { requestOtp, verifyOtp, refreshAccessToken, logout as apiLogout, getMe, registerPushToken, SpotlyUser } from '@spotly/shared'
import { ensureNotifPermission } from '../services/notify'

const KEY_ACCESS  = 'spotly_merchant_access'
const KEY_REFRESH = 'spotly_merchant_refresh'

interface AuthContextType {
  user: SpotlyUser | null
  accessToken: string | null
  isLoading: boolean
  requestOtp: (phone: string) => Promise<{ devOtp?: string }>
  verifyOtp: (phone: string, code: string, name?: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<SpotlyUser | null>(null)
  const [accessToken, setToken]   = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session from SecureStore on launch
  useEffect(() => {
    ;(async () => {
      try {
        const refresh = await SecureStore.getItemAsync(KEY_REFRESH)
        if (!refresh) return
        const { accessToken: fresh } = await refreshAccessToken(refresh)
        const me = await getMe(fresh)
        if (me) {
          await SecureStore.setItemAsync(KEY_ACCESS, fresh)
          setToken(fresh)
          setUser(me)
        }
      } catch {
        // Expired or backend unreachable — show login
      } finally {
        setIsLoading(false)
      }
    })()
  }, [])

  const handleRequestOtp = useCallback(async (phone: string) => {
    return requestOtp(phone)
  }, [])

  const handleVerifyOtp = useCallback(async (phone: string, code: string, name?: string) => {
    const tokens = await verifyOtp(phone, code, { role: 'merchant', name })
    await SecureStore.setItemAsync(KEY_ACCESS, tokens.accessToken)
    await SecureStore.setItemAsync(KEY_REFRESH, tokens.refreshToken)
    setToken(tokens.accessToken)
    setUser(tokens.user)
    // Register push token for remote notifications (best-effort)
    try {
      await ensureNotifPermission()
      const tokenResult = await Notifications.getExpoPushTokenAsync()
      await registerPushToken(tokens.user.id, tokens.accessToken, tokenResult.data)
    } catch {
      // Simulators don't support push tokens — that's fine
    }
  }, [])

  const handleLogout = useCallback(async () => {
    const refresh = await SecureStore.getItemAsync(KEY_REFRESH)
    if (refresh) await apiLogout(refresh)
    await SecureStore.deleteItemAsync(KEY_ACCESS)
    await SecureStore.deleteItemAsync(KEY_REFRESH)
    setUser(null)
    setToken(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user, accessToken, isLoading,
      requestOtp: handleRequestOtp,
      verifyOtp: handleVerifyOtp,
      logout: handleLogout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
