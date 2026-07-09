// useAdminApi — thin authenticated client for the /api/admin surface.
//
// The admin signs in through the normal Spotly OTP flow (phone → code) and gets
// a JWT with role:"admin". Store that access token however your shell prefers;
// this hook reads it from localStorage("spotly_admin_token") by default.

import { useCallback } from 'react'
import type { AdminUser, AdminOrder, Dispute, AuditEntry, Overview, Role, DisputeStatus } from './types'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4001'

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('spotly_admin_token') ?? ''
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: authHeaders() })
  if (res.status === 401) throw new Error('Session expired — sign in again.')
  if (res.status === 403) throw new Error('Admin access required.')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `Request failed (${res.status}).`)
  }
  return res.json() as Promise<T>
}

export function useAdminApi() {
  return {
    overview:   useCallback(() => req<Overview>('/api/admin/overview'), []),
    metrics:    useCallback(() => req<Record<string, unknown>>('/api/metrics'), []),

    listUsers:  useCallback((q = '') => req<AdminUser[]>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`), []),
    suspend:    useCallback((id: string, reason: string) =>
      req(`/api/admin/users/${id}/suspend`, { method: 'POST', body: JSON.stringify({ reason }) }), []),
    activate:   useCallback((id: string) =>
      req(`/api/admin/users/${id}/activate`, { method: 'POST' }), []),
    setRole:    useCallback((id: string, role: Role) =>
      req(`/api/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }) }), []),
    setCompliance: useCallback((id: string, payload: { idStatus?: string; ageVerified?: boolean; backgroundCheck?: string }) =>
      req(`/api/admin/users/${id}/compliance`, { method: 'POST', body: JSON.stringify(payload) }), []),

    listOrders: useCallback((activeOnly = true) =>
      req<AdminOrder[]>(`/api/admin/orders${activeOnly ? '?active=1' : ''}`), []),
    refundOrder: useCallback((ref: string, reason: string) =>
      req<{ ok: boolean; refundedAmount: number }>(`/api/admin/orders/${ref}/refund`, { method: 'POST', body: JSON.stringify({ reason }) }), []),

    listDisputes: useCallback((status = '') =>
      req<Dispute[]>(`/api/admin/disputes${status ? `?status=${status}` : ''}`), []),
    resolveDispute: useCallback((id: string, status: DisputeStatus, resolution: string) =>
      req<Dispute>(`/api/admin/disputes/${id}/resolve`, { method: 'POST', body: JSON.stringify({ status, resolution }) }), []),

    listAudit:  useCallback(() => req<AuditEntry[]>('/api/admin/audit'), []),
  }
}
