// Wire types — mirror backend/bridge/admin.js responses.

export type Role = 'customer' | 'driver' | 'merchant' | 'admin'
export type UserStatus = 'active' | 'suspended'
export type IdStatus = 'unverified' | 'pending' | 'verified' | 'rejected'
export type BgCheck = 'none' | 'pending' | 'clear' | 'flagged'
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'rejected'

export interface AdminUser {
  id: string
  phone: string
  name: string
  role: Role
  status: UserStatus
  id_status: IdStatus
  background_check: BgCheck
  age_verified: number
  suspended_reason: string
  created_at: number
}

export interface AdminOrder {
  ref: string
  customerName: string
  merchantName: string
  driverName?: string
  status: string
  total: number
  placedAt: number
}

export interface Dispute {
  id: string
  order_ref: string
  raised_by: string
  against: string
  reason: string
  detail: string
  status: DisputeStatus
  resolution: string
  resolved_by: string
  created_at: number
  resolved_at: number
}

export interface AuditEntry {
  id: number
  actor_id: string
  actor_name: string
  action: string
  target: string
  detail: unknown
  ip: string
  created_at: number
}

export interface Overview {
  users: { total: number; byRole: Partial<Record<Role, number>> }
  orders: { active: number; byStatus: Record<string, number> }
  disputes: { open: number }
  revenue: { last24hUSD: number }
  refunds: { total: number }
}
