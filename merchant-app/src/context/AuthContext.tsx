import React, { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ logout, children }: { logout: () => void; children: ReactNode }) {
  return <AuthContext.Provider value={{ logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
