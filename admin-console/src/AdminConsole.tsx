// AdminConsole — Spotly ops console (React + Tailwind).
//
// Five views: Overview · Users · Live Orders · Disputes · Audit Log.
// Talks to /api/admin via useAdminApi; polls live data every 10s.

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAdminApi } from './useAdminApi'
import type { AdminUser, AdminOrder, Dispute, AuditEntry, Overview, DisputeStatus } from './types'

type View = 'overview' | 'users' | 'orders' | 'disputes' | 'audit'

const rel = (ts: number) => {
  const d = Date.now() - ts
  if (d < 3_600_000) return `${Math.max(1, Math.floor(d / 60_000))}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

const STATUS_TONE: Record<string, string> = {
  active: 'ok', suspended: 'bad', placed: 'info', preparing: 'warn', ready: 'info',
  en_route: 'warn', picked_up: 'warn', delivered: 'ok', done: 'ok', cancelled: 'bad', declined: 'bad',
}
const TONE: Record<string, string> = {
  ok: 'text-emerald-600 bg-emerald-500/15',
  warn: 'text-amber-600 bg-amber-500/15',
  bad: 'text-red-600 bg-red-500/15',
  info: 'text-blue-600 bg-blue-500/15',
  muted: 'text-slate-500 bg-slate-500/15',
}
const Pill = ({ label, tone }: { label: string; tone: string }) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-semibold capitalize ${TONE[tone] ?? TONE.muted}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />{label.replace(/_/g, ' ')}
  </span>
)

const NAV: { key: View; icon: string; label: string }[] = [
  { key: 'overview', icon: '◉', label: 'Overview' },
  { key: 'users', icon: '☰', label: 'Users' },
  { key: 'orders', icon: '▤', label: 'Live Orders' },
  { key: 'disputes', icon: '⚖', label: 'Disputes' },
  { key: 'audit', icon: '◷', label: 'Audit Log' },
]

export default function AdminConsole() {
  const api = useAdminApi()
  const [view, setView] = useState<View>('overview')
  const [overview, setOverview] = useState<Overview | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const flash = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(null), 2200) }, [])
  const openDisputes = overview?.disputes.open ?? 0

  useEffect(() => {
    const load = () => api.overview().then(setOverview).catch(e => setError(e.message))
    load()
    const t = setInterval(load, 10_000)
    return () => clearInterval(t)
  }, [api])

  return (
    <div className="grid h-screen grid-cols-1 overflow-hidden bg-neutral-100 text-neutral-900 md:grid-cols-[216px_minmax(0,1fr)] dark:bg-neutral-950 dark:text-neutral-100">
      {/* Sidebar */}
      <aside className="hidden flex-col gap-1 bg-[#0b1119] p-3 md:flex">
        <div className="flex items-center gap-2.5 px-2.5 pb-4 pt-1.5">
          <div className="grid h-[30px] w-[30px] place-items-center rounded-lg bg-emerald-600 font-extrabold text-white">S</div>
          <div className="leading-none text-white">
            <div className="text-[14.5px] font-semibold">Spotly</div>
            <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-400">Ops Console</div>
          </div>
        </div>
        {NAV.map(n => (
          <button key={n.key} onClick={() => setView(n.key)}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium transition-colors
              ${view === n.key ? 'bg-[#1a2632] text-white' : 'text-slate-300 hover:bg-[#1a2632] hover:text-white'}`}>
            <span className={`w-[17px] text-center ${view === n.key ? 'text-emerald-400' : 'text-slate-500'}`}>{n.icon}</span>
            {n.label}
            {n.key === 'disputes' && openDisputes > 0 && (
              <span className="ml-auto rounded-full bg-red-500 px-1.5 font-mono text-[10.5px] font-bold text-white">{openDisputes}</span>
            )}
          </button>
        ))}
        <div className="mt-auto flex items-center gap-2.5 border-t border-white/10 p-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white">A</div>
          <div className="leading-tight text-white"><div className="text-xs font-semibold">Spotly Admin</div><div className="text-[10px] text-slate-400">ops</div></div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-h-0 flex-col">
        <header className="flex items-center gap-4 border-b border-neutral-200 bg-white px-6 py-3.5 dark:border-neutral-800 dark:bg-neutral-900">
          <h1 className="text-[16px] font-bold">{NAV.find(n => n.key === view)!.label}</h1>
          <div className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live · auto-refresh
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {error && <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</div>}
          {view === 'overview' && <OverviewView overview={overview} api={api} />}
          {view === 'users' && <UsersView api={api} flash={flash} />}
          {view === 'orders' && <OrdersView api={api} flash={flash} />}
          {view === 'disputes' && <DisputesView api={api} flash={flash} />}
          {view === 'audit' && <AuditView api={api} />}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-xl bg-[#0b1119] px-4 py-2.5 text-[12.5px] font-medium text-white shadow-2xl">{toast}</div>
      )}
    </div>
  )
}

const card = 'rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900'
const th = 'bg-neutral-50 px-4 py-2.5 text-left text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400 dark:bg-neutral-800/50'
const td = 'border-t border-neutral-100 px-4 py-2.5 dark:border-neutral-800/60'

function Metric({ label, value, sub, alert }: { label: string; value: string; sub?: string; alert?: boolean }) {
  return (
    <div className={`${card} p-4`}>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">{label}</div>
      <div className={`mt-1.5 text-[27px] font-bold tabular-nums tracking-tight ${alert ? 'text-red-600' : ''}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11.5px] text-neutral-500">{sub}</div>}
    </div>
  )
}

function OverviewView({ overview, api }: { overview: Overview | null; api: ReturnType<typeof useAdminApi> }) {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  useEffect(() => { api.listOrders(true).then(setOrders).catch(() => {}) }, [api])
  if (!overview) return <div className="text-neutral-400">Loading…</div>
  return (
    <>
      <div className="mb-6 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        <Metric label="Active orders" value={String(overview.orders.active)} sub={`${overview.orders.byStatus.en_route ?? 0} en route`} />
        <Metric label="Revenue · 24h" value={`$${overview.revenue.last24hUSD.toFixed(0)}`} />
        <Metric label="Open disputes" value={String(overview.disputes.open)} sub="needs attention" alert={overview.disputes.open > 0} />
        <Metric label="Total users" value={String(overview.users.total)} sub={`${overview.users.byRole.driver ?? 0} drivers · ${overview.users.byRole.merchant ?? 0} merchants`} />
      </div>
      <div className={card}>
        <div className="border-b border-neutral-100 px-4 py-3 text-[13.5px] font-bold dark:border-neutral-800/60">Live order feed</div>
        <table className="w-full text-[12.5px]">
          <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Merchant</th><th className={th}>Status</th><th className={th}>Total</th></tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.ref} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <td className={`${td} font-mono text-[11.5px]`}>{o.ref}</td>
                <td className={td}>{o.customerName || '—'}</td>
                <td className={td}>{o.merchantName || '—'}</td>
                <td className={td}><Pill label={o.status} tone={STATUS_TONE[o.status] ?? 'muted'} /></td>
                <td className={`${td} font-mono`}>${(o.total ?? 0).toFixed(2)}</td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td className={`${td} py-10 text-center text-neutral-400`} colSpan={5}>No active orders</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

function UsersView({ api, flash }: { api: ReturnType<typeof useAdminApi>; flash: (m: string) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [q, setQ] = useState('')
  const debounce = useRef<ReturnType<typeof setTimeout>>()
  const load = useCallback((query: string) => api.listUsers(query).then(setUsers).catch(() => {}), [api])
  useEffect(() => { load('') }, [load])
  useEffect(() => {
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => load(q), 250)
  }, [q, load])

  const act = async (fn: Promise<unknown>, msg: string) => { try { await fn; flash(msg); load(q) } catch (e) { flash((e as Error).message) } }

  return (
    <div className={card}>
      <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/60">
        <span className="text-[13.5px] font-bold">Users</span>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name or number…"
          className="ml-auto w-64 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[12.5px] outline-none focus:border-emerald-600 dark:border-neutral-700 dark:bg-neutral-800" />
      </div>
      <table className="w-full text-[12.5px]">
        <thead><tr><th className={th}>User</th><th className={th}>Role</th><th className={th}>Status</th><th className={th}>ID</th><th className={th}>Background</th><th className={`${th} text-right`}>Actions</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
              <td className={td}>
                <div className="font-semibold">{u.name || 'Unnamed'}</div>
                <div className="font-mono text-[11px] text-neutral-400">{u.phone}</div>
                {u.suspended_reason && <div className="text-[11px] text-red-500">⚠ {u.suspended_reason}</div>}
              </td>
              <td className={td}>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-blue-500/15 text-blue-600' : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-300'}`}>{u.role}</span>
              </td>
              <td className={td}><Pill label={u.status} tone={STATUS_TONE[u.status] ?? 'muted'} /></td>
              <td className={td}><Pill label={u.id_status} tone={{ verified: 'ok', pending: 'warn', unverified: 'muted', rejected: 'bad' }[u.id_status]!} /></td>
              <td className={td}>{u.role === 'driver'
                ? <Pill label={u.background_check} tone={{ clear: 'ok', pending: 'warn', flagged: 'bad', none: 'muted' }[u.background_check]!} />
                : <span className="text-neutral-300">—</span>}</td>
              <td className={`${td} text-right`}>
                {u.role === 'admin' ? <span className="text-[11px] text-neutral-400">protected</span>
                  : u.status === 'active'
                    ? <button onClick={() => act(api.suspend(u.id, 'Suspended by admin'), `${u.name} suspended`)} className="rounded-md border border-red-500/40 px-2.5 py-1 text-[11.5px] font-semibold text-red-600 hover:bg-red-500/10">Suspend</button>
                    : <button onClick={() => act(api.activate(u.id), `${u.name} reactivated`)} className="rounded-md border border-emerald-500/40 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-600 hover:bg-emerald-500/10">Reactivate</button>}
              </td>
            </tr>
          ))}
          {users.length === 0 && <tr><td className={`${td} py-10 text-center text-neutral-400`} colSpan={6}>No matches</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function OrdersView({ api, flash }: { api: ReturnType<typeof useAdminApi>; flash: (m: string) => void }) {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const load = useCallback(() => api.listOrders(true).then(setOrders).catch(() => {}), [api])
  useEffect(() => { load(); const t = setInterval(load, 10_000); return () => clearInterval(t) }, [load])

  const refund = async (ref: string) => {
    const reason = window.prompt(`Refund + cancel ${ref}? Reason:`) // replace with a modal in production
    if (reason === null) return
    try { const r = await api.refundOrder(ref, reason); flash(`${ref} refunded ($${r.refundedAmount.toFixed(2)})`); load() }
    catch (e) { flash((e as Error).message) }
  }

  return (
    <div className={card}>
      <div className="border-b border-neutral-100 px-4 py-3 text-[13.5px] font-bold dark:border-neutral-800/60">Live orders</div>
      <table className="w-full text-[12.5px]">
        <thead><tr><th className={th}>Order</th><th className={th}>Customer</th><th className={th}>Merchant</th><th className={th}>Driver</th><th className={th}>Status</th><th className={th}>Total</th><th className={th}>Placed</th><th className={`${th} text-right`}>Actions</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o.ref} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
              <td className={`${td} font-mono text-[11.5px]`}>{o.ref}</td>
              <td className={td}>{o.customerName || '—'}</td>
              <td className={td}>{o.merchantName || '—'}</td>
              <td className={td}>{o.driverName || '—'}</td>
              <td className={td}><Pill label={o.status} tone={STATUS_TONE[o.status] ?? 'muted'} /></td>
              <td className={`${td} font-mono`}>${(o.total ?? 0).toFixed(2)}</td>
              <td className={`${td} text-neutral-400`}>{rel(o.placedAt)}</td>
              <td className={`${td} text-right`}>
                <button onClick={() => refund(o.ref)} className="rounded-md border border-red-500/40 px-2.5 py-1 text-[11.5px] font-semibold text-red-600 hover:bg-red-500/10">Refund + cancel</button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td className={`${td} py-10 text-center text-neutral-400`} colSpan={8}>No active orders</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function DisputesView({ api, flash }: { api: ReturnType<typeof useAdminApi>; flash: (m: string) => void }) {
  const [disputes, setDisputes] = useState<Dispute[]>([])
  const load = useCallback(() => api.listDisputes().then(setDisputes).catch(() => {}), [api])
  useEffect(() => { load() }, [load])
  const [choice, setChoice] = useState<Record<string, DisputeStatus>>({})

  const apply = async (d: Dispute) => {
    const status = choice[d.id] ?? 'investigating'
    const resolution = status === 'resolved' ? window.prompt('Resolution note:') ?? '' : ''
    try { await api.resolveDispute(d.id, status, resolution); flash(`Dispute ${status}`); load() }
    catch (e) { flash((e as Error).message) }
  }

  const border: Record<string, string> = { open: 'border-l-red-500', investigating: 'border-l-amber-500', resolved: 'border-l-emerald-500', rejected: 'border-l-neutral-400' }
  return (
    <div className="flex flex-col gap-3">
      {disputes.map(d => (
        <div key={d.id} className={`${card} border-l-4 p-4 ${border[d.status]}`}>
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="text-[13.5px] font-bold">{d.reason}</span>
            <Pill label={d.status} tone={{ open: 'bad', investigating: 'warn', resolved: 'ok', rejected: 'muted' }[d.status]} />
            <span className="ml-auto font-mono text-[11px] text-neutral-400">{d.order_ref || '—'} · vs {d.against} · {rel(d.created_at)}</span>
          </div>
          <div className="mb-2.5 text-[12.5px] text-neutral-500">
            {d.detail}
            {d.resolution && <><br /><b className="text-emerald-600">Resolution:</b> {d.resolution}</>}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-neutral-400">Raised by {d.raised_by}</span>
            {d.status !== 'resolved' && d.status !== 'rejected' && (
              <div className="ml-auto flex gap-2">
                <select value={choice[d.id] ?? 'investigating'} onChange={e => setChoice(c => ({ ...c, [d.id]: e.target.value as DisputeStatus }))}
                  className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1 text-[11.5px] dark:border-neutral-700 dark:bg-neutral-800">
                  <option value="investigating">Investigating</option>
                  <option value="resolved">Resolve</option>
                  <option value="rejected">Reject</option>
                </select>
                <button onClick={() => apply(d)} className="rounded-md bg-emerald-600 px-3 py-1 text-[11.5px] font-semibold text-white hover:brightness-110">Apply</button>
              </div>
            )}
          </div>
        </div>
      ))}
      {disputes.length === 0 && <div className="py-16 text-center text-neutral-400">No disputes 🎉</div>}
    </div>
  )
}

function AuditView({ api }: { api: ReturnType<typeof useAdminApi> }) {
  const [rows, setRows] = useState<AuditEntry[]>([])
  useEffect(() => { api.listAudit().then(setRows).catch(() => {}) }, [api])
  return (
    <div className={card}>
      <div className="flex items-center gap-3 border-b border-neutral-100 px-4 py-3 dark:border-neutral-800/60">
        <span className="text-[13.5px] font-bold">Audit log</span>
        <span className="ml-auto text-[11px] text-neutral-400">Immutable · privileged actions</span>
      </div>
      <table className="w-full text-[12.5px]">
        <thead><tr><th className={th}>Action</th><th className={th}>Target</th><th className={th}>Actor</th><th className={th}>Detail</th><th className={th}>When</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
              <td className={td}><span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">{r.action}</span></td>
              <td className={`${td} font-mono text-[11px]`}>{r.target || '—'}</td>
              <td className={td}>{r.actor_name || r.actor_id || '—'}</td>
              <td className={`${td} text-neutral-500`}>{typeof r.detail === 'object' ? JSON.stringify(r.detail) : String(r.detail || '—')}</td>
              <td className={`${td} text-neutral-400`}>{rel(r.created_at)}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className={`${td} py-10 text-center text-neutral-400`} colSpan={5}>No audit entries yet</td></tr>}
        </tbody>
      </table>
    </div>
  )
}
