import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { toast } from './toast'
import {
  BriefcaseBusiness,
  ClipboardList,
  DollarSign,
  Map,
  MessageSquarePlus,
  Plane,
  Receipt,
  ScrollText,
  Send,
  Users,
  UtensilsCrossed,
  X,
  Zap,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import { useSupabaseTable } from './hooks/useSupabaseTable'
import { useNotifications } from './hooks/useNotifications'
import ArrivalsPanel from './panels/ArrivalsPanel'
import BudgetPanel from './panels/BudgetPanel'
import DailyBriefingPanel from './panels/DailyBriefingPanel'
const FlightMapPanel = lazy(() => import('./panels/FlightMapPanel'))
import ItineraryPanel from './panels/ItineraryPanel'
import LogisticsPanel from './panels/LogisticsPanel'
import MealsPanel from './panels/MealsPanel'
import PresencePanel from './panels/PresencePanel'
import RosterPanel from './panels/RosterPanel'

// ─── MESSAGES ────────────────────────────────────────────────────────────────

const MSG_CATS = ['INFO', 'ARRIVAL', 'HYPE', 'FOOD', 'TRANSPORT']
const MSG_CAT_CFG = {
  INFO:      { color: '#BA1323', emoji: '💬' },
  ARRIVAL:   { color: '#48B040', emoji: '✈️' },
  HYPE:      { color: '#C4952A', emoji: '🔥' },
  FOOD:      { color: '#D4601A', emoji: '🍔' },
  TRANSPORT: { color: '#9A8070', emoji: '🚗' },
}

function relTime(ts) {
  const diff = Date.now() - new Date(ts)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

function MessagesDrawer({ onClose }) {
  const { rows: feed, insert } = useSupabaseTable('ops_feed', { orderBy: 'created_at', ascending: false })
  const [text, setText]       = useState('')
  const [cat, setCat]         = useState('INFO')
  const [name, setName]       = useState(() => localStorage.getItem('phx_name') || '')
  const [posting, setPosting] = useState(false)

  const active = feed.filter(e => !e.expires_at || new Date(e.expires_at) > new Date()).slice(0, 20)

  async function handlePost(e) {
    e.preventDefault()
    if (!text.trim() || !name.trim()) return
    setPosting(true)
    localStorage.setItem('phx_name', name.trim())
    await insert({ message: `${name.trim()}: ${text.trim()}`, category: cat, pinned: false, expires_at: null })
    setText('')
    setPosting(false)
    toast('Message sent', 'success')
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end md:items-stretch md:justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex w-full flex-col bg-[#140a06] md:w-96 md:border-l md:border-[#3C1810]" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#3C1810] px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#BA1323]">Freakman Operation</div>
            <div className="text-base font-black uppercase tracking-[0.06em] text-[#FAF0E8]">Messages</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#9A8070] hover:text-[#F2E4D0]"><X size={18} /></button>
        </div>

        {/* Compose */}
        <div className="shrink-0 border-b border-[#3C1810] bg-[#1C0C08] p-4">
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            <input
              className="w-full rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none"
                placeholder="Send a message to the group…"
                value={text}
                onChange={e => setText(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={posting || !text.trim() || !name.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded bg-[#BA1323] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#FAF0E8] hover:bg-[#D4152A] disabled:opacity-40 transition-colors"
              >
                {posting ? <span className="text-[10px]">Sending…</span> : <Send size={13} />}
              </button>
            </div>
            {/* Category pills */}
            <div className="flex gap-1.5 flex-wrap">
              {MSG_CATS.map(c => {
                const cfg = MSG_CAT_CFG[c]
                const active = cat === c
                return (
                  <button key={c} type="button" onClick={() => setCat(c)}
                    className="rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-wider transition-all"
                    style={{ color: active ? '#FAF0E8' : cfg.color, background: active ? cfg.color : `${cfg.color}18`, border: `1px solid ${active ? cfg.color : `${cfg.color}40`}` }}>
                    {cfg.emoji} {c}
                  </button>
                )
              })}
            </div>
          </form>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto">
          {active.length === 0 && (
            <div className="flex h-full items-center justify-center py-12 text-sm text-[#5C3820]">No messages yet</div>
          )}
          {active.map(entry => {
            const cfg = MSG_CAT_CFG[entry.category] || MSG_CAT_CFG.INFO
            return (
              <div key={entry.id} className="flex gap-3 border-b border-[#281408] px-5 py-3"
                style={{ borderLeft: `3px solid ${cfg.color}30` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug text-[#F2E4D0]">{entry.message}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{ color: cfg.color, background: `${cfg.color}20` }}>
                      {entry.category}
                    </span>
                    <span className="font-mono text-[10px] text-[#5C3820]">{relTime(entry.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'briefing',  label: 'Today',      icon: ScrollText },
  { id: 'itinerary', label: 'Itinerary',  icon: BriefcaseBusiness },
  { id: 'arrivals',  label: 'Arrivals',   icon: Plane },
  { id: 'map',       label: 'Map',        icon: Map,         desktopOnly: true },
  { id: 'meals',     label: 'Meals',      icon: UtensilsCrossed },
  { id: 'logistics', label: 'Logistics',  icon: ClipboardList, desktopOnly: true },
  { id: 'budget',    label: 'Budget',     icon: DollarSign },
  { id: 'roster',    label: 'Roster',     icon: Users },
  { id: 'crew',      label: 'Crew',       icon: Zap },
]

function ShellNav({ selectedPage, onSelectPage }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#3C1810] bg-[#140a06] md:w-72 md:border-b-0 md:border-r">
      <div className="border-b border-[#3C1810] px-4 py-4 md:px-5 md:py-5">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#BA1323]">
          Freakman Bachelor Command
        </div>
        <div className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#FAF0E8] md:mt-2 md:text-xl">
          Scottsdale Ops
        </div>
        <div className="mt-1 hidden text-[11px] leading-relaxed text-[#9A8070] md:mt-2 md:block">
          May 29 to May 31. One house, one roster, one Freakman weekend.
        </div>
      </div>

      <nav className="grid grid-cols-3 gap-1 p-2 md:grid-cols-1 md:gap-2 md:p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = item.id === selectedPage

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPage(item.id)}
              className={`flex items-center justify-center gap-2 border px-2 py-3 text-center text-[10px] font-black uppercase tracking-[0.12em] transition-colors md:justify-start md:px-3 md:py-3 md:text-[11px] md:tracking-[0.16em] ${item.desktopOnly ? 'hidden md:flex' : ''} ${
                active
                  ? 'border-[#BA1323] bg-[#BA1323]/10 text-[#BA1323]'
                  : 'border-[#3C1810] bg-[#1C0C08] text-[#9A8070] hover:border-[#BA1323]/40 hover:text-[#F2E4D0]'
              }`}
            >
              <Icon size={16} />
              <span className="leading-tight">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}

function AppHeader({ selectedPage }) {
  const current = useMemo(
    () => NAV_ITEMS.find((item) => item.id === selectedPage) || NAV_ITEMS[0],
    [selectedPage],
  )

  return (
    <header className="hidden items-center justify-between border-b border-[#3C1810] bg-[#180C07] px-6 py-4 md:flex">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#9A8070]">
          Freakman Command Center
        </div>
        <div className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#FAF0E8]">
          {current.label}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#BA1323]">
          Theater
        </div>
        <div className="mt-1 text-sm font-semibold text-[#F2E4D0]">
          Scottsdale / Phoenix Metro
        </div>
      </div>
    </header>
  )
}

// ─── QUICK EXPENSE ────────────────────────────────────────────────────────────

const EXPENSE_CATS = ['house', 'golf', 'food', 'drinks', 'transport', 'activities', 'other']
const inpCls = 'w-full rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none'
const selCls = 'w-full rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] focus:border-[#BA1323] focus:outline-none'

function QuickExpenseModal({ onClose }) {
  const { insert } = useSupabaseTable('expenses', { orderBy: 'created_at' })
  const { rows: roster } = useSupabaseTable('roster', { orderBy: 'name' })
  const [desc, setDesc]         = useState('')
  const [amount, setAmount]     = useState('')
  const [paidBy, setPaidBy]     = useState(() => localStorage.getItem('phx_name') || '')
  const [payMode, setPayMode]   = useState('roster')
  const [category, setCategory] = useState('other')
  const [saving, setSaving]     = useState(false)

  const rosterNames = roster.filter(r => r.status !== 'Ghosting').map(r => r.name)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!desc.trim() || !amount || !paidBy.trim()) return
    setSaving(true)
    localStorage.setItem('phx_name', paidBy.trim())
    await insert({
      description: desc.trim(),
      amount: parseFloat(amount),
      paid_by: paidBy.trim(),
      category,
      split_count: rosterNames.length || 14,
      split_names: rosterNames.length > 0 ? rosterNames : null,
      notes: null,
    })
    setSaving(false)
    toast('Expense logged', 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded border border-[#3C1810] bg-[#1C0C08] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#BA1323]">Log Expense</span>
          <button type="button" onClick={onClose} className="text-[#9A8070] hover:text-[#F2E4D0]"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">What was it?</label>
            <input className={inpCls} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Costco run, tee time, rounds…" required autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">Amount ($)</label>
              <input type="number" step="0.01" min="0" className={inpCls} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">Category</label>
              <select className={selCls} value={category} onChange={e => setCategory(e.target.value)}>
                {EXPENSE_CATS.map(c => <option key={c} className="capitalize">{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">Who fronted it?</label>
            {payMode === 'roster' ? (
              <select className={selCls} value={paidBy} onChange={e => { if (e.target.value === '__manual__') { setPayMode('manual'); setPaidBy('') } else setPaidBy(e.target.value) }} required>
                <option value="">— Pick name —</option>
                {rosterNames.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="__manual__">Other…</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input className={`${inpCls} flex-1`} value={paidBy} onChange={e => setPaidBy(e.target.value)} placeholder="Name" required />
                <button type="button" onClick={() => { setPayMode('roster'); setPaidBy('') }} className="shrink-0 text-[10px] text-[#9A8070] hover:text-[#BA1323]">← List</button>
              </div>
            )}
          </div>
          <div className="text-[10px] text-[#5C3820]">
            Split will default to all {rosterNames.length || 14} guys — edit in Budget tab to customize.
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-[#9A8070] hover:text-[#F2E4D0]">Cancel</button>
            <button type="submit" disabled={saving} className="rounded bg-[#BA1323] px-5 py-2 text-xs font-bold uppercase tracking-wider text-[#140a06] hover:bg-[#79b8ff] disabled:opacity-50">
              {saving ? 'Logging…' : 'Log It'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────

export default function App() {
  const [selectedPage, setSelectedPage] = useState('briefing')
  const [msgOpen, setMsgOpen]           = useState(false)
  const [expenseOpen, setExpenseOpen]   = useState(false)

  useNotifications()

  let content = <DailyBriefingPanel />
  if (selectedPage === 'itinerary') content = <ItineraryPanel />
  if (selectedPage === 'arrivals')  content = <ArrivalsPanel />
  if (selectedPage === 'map')       content = <Suspense fallback={<div className="flex flex-1 items-center justify-center text-[11px] uppercase tracking-widest text-[#5C3820]">Loading map…</div>}><FlightMapPanel /></Suspense>
  if (selectedPage === 'meals')     content = <MealsPanel />
  if (selectedPage === 'logistics') content = <LogisticsPanel />
  if (selectedPage === 'budget')    content = <BudgetPanel />
  if (selectedPage === 'roster')    content = <RosterPanel />
  if (selectedPage === 'crew')      content = <PresencePanel />

  return (
    <div className="flex flex-col bg-[#100805] text-[#F2E4D0] md:h-screen md:flex-row">
      <ShellNav selectedPage={selectedPage} onSelectPage={setSelectedPage} />
      <main className="flex flex-1 flex-col md:min-h-0 md:overflow-hidden">
        <AppHeader selectedPage={selectedPage} />
        <div className="flex flex-1 md:min-h-0 md:overflow-hidden">{content}</div>
      </main>

      {/* Floating action buttons */}
      <div
        className="fixed right-4 z-30 flex flex-col gap-2"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <button
          onClick={() => setExpenseOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#48B040]/40 bg-[#1C0C08] px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#48B040] shadow-lg shadow-black/40 hover:bg-[#48B040]/10 transition-colors"
        >
          <Receipt size={16} />
          <span className="hidden sm:inline">Log $</span>
        </button>
        <button
          onClick={() => setMsgOpen(true)}
          className="flex items-center gap-2 rounded-full border border-[#BA1323]/40 bg-[#1C0C08] px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#BA1323] shadow-lg shadow-black/40 hover:bg-[#BA1323]/10 transition-colors"
        >
          <MessageSquarePlus size={16} />
          <span className="hidden sm:inline">Message</span>
        </button>
      </div>

      {msgOpen     && <MessagesDrawer onClose={() => setMsgOpen(false)} />}
      {expenseOpen && <QuickExpenseModal onClose={() => setExpenseOpen(false)} />}
    </div>
  )
}
