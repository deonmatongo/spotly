// SupportDashboard — three-column live WhatsApp support workspace.
//
// Left:   searchable conversation sidebar with status badges + unread counts
// Middle: chat feed (incoming grey/left, agent green/right) + composer
// Right:  customer metadata, status dropdown, live Meta 24-hour session countdown
//
// Tailwind CSS required. Data + realtime come from ./useSupport.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSupport } from './useSupport'
import type { Conversation, Message, TicketStatus } from './types'

const MIN = 60_000, HOUR = 3_600_000, DAY = 86_400_000
const AVATAR_COLORS = ['#0b7a5b', '#2563eb', '#7c3aed', '#d97706', '#db2777', '#0891b2', '#65a30d']

const avatarColor = (s: string) => AVATAR_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]
const initials = (n: string) => (n || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

function relTime(ts: number) {
  const d = Date.now() - ts
  if (d < MIN) return 'now'
  if (d < HOUR) return `${Math.floor(d / MIN)}m`
  if (d < DAY) return `${Math.floor(d / HOUR)}h`
  return `${Math.floor(d / DAY)}d`
}
const clock = (ts: number) =>
  new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const STATUS_STYLES: Record<TicketStatus, string> = {
  open: 'text-emerald-600 bg-emerald-500/15',
  pending: 'text-amber-600 bg-amber-500/15',
  closed: 'text-slate-500 bg-slate-500/15',
}

function Avatar({ name, size = 42 }: { name: string; size?: number }) {
  return (
    <div
      className="shrink-0 grid place-items-center rounded-full font-semibold text-white"
      style={{ width: size, height: size, background: avatarColor(name), fontSize: size * 0.36 }}
    >
      {initials(name)}
    </div>
  )
}

function DeliveryTicks({ status }: { status: Message['status'] }) {
  if (status === 'failed') return <span className="text-red-500 text-[11px]">✕ failed</span>
  if (status === 'read') return <span className="text-sky-400 tracking-[-2px] text-[11px]">✓✓</span>
  if (status === 'delivered') return <span className="opacity-60 tracking-[-2px] text-[11px]">✓✓</span>
  return <span className="opacity-60 text-[11px]">✓</span>
}

export default function SupportDashboard() {
  const { conversations, active, activeId, messages, connected, sending, openConversation, sendReply, setStatus } =
    useSupport()
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [banner, setBanner] = useState<string | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter(c => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q))
  }, [conversations, query])

  // Auto-scroll to newest message
  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight })
  }, [messages, activeId])

  const send = async () => {
    if (!draft.trim()) return
    const text = draft
    setDraft('')
    const res = await sendReply(text)
    if (!res.ok) {
      setDraft(text) // restore on failure
      setBanner(res.error ?? 'Could not send.')
    } else {
      setBanner(null)
    }
  }

  return (
    <div className="grid h-screen w-full overflow-hidden bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100
                    grid-cols-1 md:grid-cols-[336px_minmax(0,1fr)] lg:grid-cols-[336px_minmax(0,1fr)_312px]">
      {/* ═══ LEFT: sidebar ═══ */}
      <aside className="hidden md:flex flex-col min-h-0 border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
        <header className="flex items-center gap-2.5 border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-800">
          <div className="grid h-[30px] w-[30px] place-items-center rounded-[9px] bg-emerald-700 font-bold text-white">S</div>
          <div>
            <h1 className="text-[15px] font-semibold leading-tight">Spotly Support</h1>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-neutral-400">
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
              {connected ? 'live · whatsapp' : 'reconnecting…'}
            </div>
          </div>
        </header>

        <div className="border-b border-neutral-100 p-3 dark:border-neutral-800/60">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search name or number…"
            className="w-full rounded-[9px] border border-neutral-200 bg-white px-3 py-2 text-[13px] outline-none
                       focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20
                       dark:border-neutral-700 dark:bg-neutral-800"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {filtered.length === 0 && <div className="grid place-items-center p-10 text-sm text-neutral-400">No conversations</div>}
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => openConversation(c.id)}
              className={`relative grid w-full grid-cols-[42px_1fr_auto] gap-3 border-b border-neutral-100 px-3.5 py-3 text-left
                          transition-colors hover:bg-white dark:border-neutral-800/60 dark:hover:bg-neutral-800/60
                          ${c.id === activeId ? 'bg-white dark:bg-neutral-800/60' : ''}`}
            >
              {c.id === activeId && <span className="absolute inset-y-0 left-0 w-[3px] bg-emerald-700" />}
              <Avatar name={c.name} />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold">{c.name || c.phone}</div>
                <div className="font-mono text-[11px] text-neutral-400">{c.phone}</div>
                <div className="mt-0.5 truncate text-[12.5px] text-neutral-500 dark:text-neutral-400">
                  {c.lastMessagePreview}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="font-mono text-[10.5px] text-neutral-400">{relTime(c.lastMessageAt)}</span>
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLES[c.status]}`}>
                  {c.status}
                </span>
                {c.unread > 0 && (
                  <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-emerald-700 px-1 font-mono text-[10.5px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ═══ MIDDLE: chat feed ═══ */}
      <main className="flex min-h-0 flex-col bg-white dark:bg-neutral-950">
        {!active ? (
          <div className="grid flex-1 place-items-center text-neutral-400">Select a conversation to start</div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-950">
              <Avatar name={active.name} size={38} />
              <div>
                <div className="text-[14.5px] font-semibold">{active.name || active.phone}</div>
                <div className="font-mono text-[11.5px] text-neutral-400">{active.phone} · {active.status}</div>
              </div>
            </header>

            <div ref={feedRef} className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto bg-neutral-50 px-6 py-5 dark:bg-neutral-900/40">
              {messages.map(m => (
                <div
                  key={m.id}
                  className={`max-w-[68%] rounded-2xl px-3 pb-1.5 pt-2 shadow-sm ${
                    m.direction === 'inbound'
                      ? 'self-start rounded-bl-sm bg-white dark:bg-neutral-800'
                      : 'self-end rounded-br-sm bg-emerald-100 text-emerald-950 dark:bg-emerald-900/50 dark:text-emerald-50'
                  }`}
                >
                  {m.mediaUrl && (
                    <a href={m.mediaUrl} target="_blank" rel="noreferrer" className="mb-1 block text-[12px] underline opacity-80">
                      📎 Attachment
                    </a>
                  )}
                  <div className="whitespace-pre-wrap break-words text-[13.5px]">{m.body}</div>
                  <div className="mt-0.5 flex items-center justify-end gap-1.5">
                    <span className="font-mono text-[10px] opacity-60">{clock(m.createdAt)}</span>
                    {m.direction === 'outbound' && <DeliveryTicks status={m.status} />}
                  </div>
                </div>
              ))}
            </div>

            {/* Composer */}
            <div className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              {(!active.sessionOpen || banner) && (
                <div className="mb-2.5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                  <span className="text-base">⚠️</span>
                  <div className="text-[12px]">
                    {active.sessionOpen ? (
                      <span className="text-red-600">{banner}</span>
                    ) : (
                      <>
                        <b className="text-red-600">24-hour window closed.</b>
                        <span className="mt-0.5 block text-neutral-500">
                          Meta only allows a pre-approved template now — free-form replies will be rejected.
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2.5">
                <button
                  title="Attach (placeholder)"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-neutral-200 bg-neutral-50 text-lg text-neutral-500 hover:text-neutral-800 dark:border-neutral-700 dark:bg-neutral-800"
                >
                  📎
                </button>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send() }
                  }}
                  disabled={!active.sessionOpen}
                  placeholder={active.sessionOpen ? 'Type a reply…' : 'Window closed — send an approved template instead'}
                  rows={1}
                  className="max-h-[120px] flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-[13.5px] outline-none
                             focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 disabled:opacity-50
                             dark:border-neutral-700 dark:bg-neutral-800"
                />
                <button
                  onClick={() => void send()}
                  disabled={!active.sessionOpen || sending || !draft.trim()}
                  title="Send"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-emerald-700 text-[17px] text-white
                             transition hover:brightness-110 active:scale-95 disabled:bg-neutral-400"
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      {/* ═══ RIGHT: metadata + session countdown ═══ */}
      <aside className="hidden flex-col border-l border-neutral-200 bg-neutral-50 lg:flex dark:border-neutral-800 dark:bg-neutral-900">
        <header className="border-b border-neutral-200 px-4 py-3.5 dark:border-neutral-800">
          <h1 className="text-[15px] font-semibold">Customer</h1>
        </header>
        {active && (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <Avatar name={active.name} size={60} />
              <div className="text-base font-bold">{active.name || 'Unknown'}</div>
              <div className="font-mono text-[12.5px] text-neutral-500">{active.phone}</div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Ticket status</label>
              <select
                value={active.status}
                onChange={e => setStatus(active.id, e.target.value as TicketStatus)}
                className="mt-1.5 w-full cursor-pointer rounded-[9px] border border-neutral-200 bg-neutral-50 px-2.5 py-2 text-[13px] font-semibold outline-none focus:border-emerald-600 dark:border-neutral-700 dark:bg-neutral-800"
              >
                <option value="open">🟢 Open</option>
                <option value="pending">🟡 Pending</option>
                <option value="closed">⚫ Closed</option>
              </select>
            </div>

            <SessionRing conversation={active} />

            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
              <h3 className="border-b border-neutral-100 bg-neutral-50 px-3.5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:border-neutral-800 dark:bg-neutral-900">
                Details
              </h3>
              <dl className="divide-y divide-neutral-100 text-[12.5px] dark:divide-neutral-800/60">
                <Row k="Region" v={active.phone.startsWith('+263') ? 'Zimbabwe' : active.phone.startsWith('+48') ? 'Poland' : 'International'} />
                <Row k="Assigned to" v={active.assignedAgentId || '— unassigned'} />
                <Row k="Messages" v={String(messages.length)} />
                <Row k="Channel" v="WhatsApp" mono />
                <Row k="Conversation ID" v={active.id} mono />
              </dl>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3 px-3.5 py-2">
      <dt className="text-neutral-400">{k}</dt>
      <dd className={`text-right font-medium ${mono ? 'font-mono font-normal' : ''}`}>{v}</dd>
    </div>
  )
}

// Live-ticking circular countdown for Meta's 24-hour customer-service window.
function SessionRing({ conversation }: { conversation: Conversation }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const remaining = Math.max(0, conversation.lastCustomerMsgAt + DAY - now)
  const frac = Math.max(0, Math.min(1, remaining / DAY))
  const R = 52, C = 2 * Math.PI * R
  const color = remaining <= 0 ? '#dc2626' : frac > 0.25 ? '#059669' : frac > 0.08 ? '#d97706' : '#dc2626'

  const h = Math.floor(remaining / HOUR)
  const m = Math.floor((remaining % HOUR) / MIN)
  const s = Math.floor((remaining % MIN) / 1000)
  const label = remaining <= 0 ? '0:00' : h > 0 ? `${h}:${String(m).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-2.5 overflow-hidden rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h3 className="w-full text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Meta 24-hour session</h3>
      <div className="relative h-[116px] w-[116px]">
        <svg width="116" height="116" viewBox="0 0 116 116" className="-rotate-90">
          <circle cx="58" cy="58" r={R} fill="none" strokeWidth="8" className="stroke-neutral-200 dark:stroke-neutral-800" />
          <circle
            cx="58" cy="58" r={R} fill="none" strokeWidth="8" strokeLinecap="round"
            stroke={color} strokeDasharray={C} strokeDashoffset={C * (1 - frac)}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke .6s' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="font-mono text-[21px] font-semibold tabular-nums" style={{ color }}>{label}</div>
            <div className="text-[9.5px] uppercase tracking-wider text-neutral-400">
              {remaining <= 0 ? 'closed' : h > 0 ? 'hrs left' : 'min left'}
            </div>
          </div>
        </div>
      </div>
      <p className="px-1.5 text-center text-[11.5px] leading-snug text-neutral-500">
        {remaining <= 0 ? (
          <>Window <b className="text-neutral-800 dark:text-neutral-200">closed</b>. A pre-approved template is required to reach this customer.</>
        ) : (
          <>Free-form replies allowed for <b className="text-neutral-800 dark:text-neutral-200">{h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`}</b> more.</>
        )}
      </p>
    </div>
  )
}
