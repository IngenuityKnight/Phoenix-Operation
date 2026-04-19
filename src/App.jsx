import { useMemo, useState } from 'react'
import {
  BriefcaseBusiness,
  ClipboardList,
  DollarSign,
  Map,
  MessageSquarePlus,
  Plane,
  ScrollText,
  Send,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import { useSupabaseTable } from './hooks/useSupabaseTable'
import ArrivalsPanel from './panels/ArrivalsPanel'
import BudgetPanel from './panels/BudgetPanel'
import DailyBriefingPanel from './panels/DailyBriefingPanel'
import FlightMapPanel from './panels/FlightMapPanel'
import ItineraryPanel from './panels/ItineraryPanel'
import LogisticsPanel from './panels/LogisticsPanel'
import MealsPanel from './panels/MealsPanel'
import RosterPanel from './panels/RosterPanel'

// ─── MESSAGES ────────────────────────────────────────────────────────────────

const MSG_CATS = ['INFO', 'ARRIVAL', 'HYPE', 'FOOD', 'TRANSPORT']
const MSG_CAT_CFG = {
  INFO:      { color: '#58A6FF', emoji: '💬' },
  ARRIVAL:   { color: '#3FB950', emoji: '✈️' },
  HYPE:      { color: '#A371F7', emoji: '🔥' },
  FOOD:      { color: '#F78166', emoji: '🍔' },
  TRANSPORT: { color: '#D29922', emoji: '🚗' },
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
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-end md:items-stretch md:justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex w-full flex-col bg-[#0d1117] md:w-96 md:border-l md:border-[#30363D]" style={{ maxHeight: '85vh' }}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#30363D] px-5 py-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#58A6FF]">Phoenix Operation</div>
            <div className="text-base font-black uppercase tracking-[0.06em] text-[#F0F6FC]">Messages</div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#8B949E] hover:text-[#C9D1D9]"><X size={18} /></button>
        </div>

        {/* Compose */}
        <div className="shrink-0 border-b border-[#30363D] bg-[#161b22] p-4">
          <form onSubmit={handlePost} className="flex flex-col gap-3">
            <input
              className="w-full rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-[#C9D1D9] placeholder-[#4B5563] focus:border-[#58A6FF] focus:outline-none"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-[#C9D1D9] placeholder-[#4B5563] focus:border-[#58A6FF] focus:outline-none"
                placeholder="Send a message to the group…"
                value={text}
                onChange={e => setText(e.target.value)}
                required
              />
              <button
                type="submit"
                disabled={posting || !text.trim() || !name.trim()}
                className="flex shrink-0 items-center gap-1.5 rounded bg-[#58A6FF] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#0d1117] hover:bg-[#79b8ff] disabled:opacity-40 transition-colors"
              >
                <Send size={13} />
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
                    style={{ color: active ? '#0d1117' : cfg.color, background: active ? cfg.color : `${cfg.color}18`, border: `1px solid ${active ? cfg.color : `${cfg.color}40`}` }}>
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
            <div className="flex h-full items-center justify-center py-12 text-sm text-[#4B5563]">No messages yet</div>
          )}
          {active.map(entry => {
            const cfg = MSG_CAT_CFG[entry.category] || MSG_CAT_CFG.INFO
            return (
              <div key={entry.id} className="flex gap-3 border-b border-[#21262d] px-5 py-3"
                style={{ borderLeft: `3px solid ${cfg.color}30` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm leading-snug text-[#C9D1D9]">{entry.message}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{ color: cfg.color, background: `${cfg.color}20` }}>
                      {entry.category}
                    </span>
                    <span className="font-mono text-[10px] text-[#4B5563]">{relTime(entry.created_at)}</span>
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
]

function ShellNav({ selectedPage, onSelectPage }) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[#30363D] bg-[#0d1117] md:w-72 md:border-b-0 md:border-r">
      <div className="border-b border-[#30363D] px-4 py-4 md:px-5 md:py-5">
        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-[#58A6FF]">
          Phoenix Bachelor Command
        </div>
        <div className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#F0F6FC] md:mt-2 md:text-xl">
          Scottsdale Ops
        </div>
        <div className="mt-1 hidden text-[11px] leading-relaxed text-[#8B949E] md:mt-2 md:block">
          May 28 to May 31. One house, one roster, one clean command surface.
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
                  ? 'border-[#58A6FF] bg-[#58A6FF]/10 text-[#58A6FF]'
                  : 'border-[#30363D] bg-[#161b22] text-[#8B949E] hover:border-[#58A6FF]/40 hover:text-[#C9D1D9]'
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
    <header className="hidden items-center justify-between border-b border-[#30363D] bg-[#11161d] px-6 py-4 md:flex">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8B949E]">
          Phoenix Command Center
        </div>
        <div className="mt-1 text-lg font-black uppercase tracking-[0.08em] text-[#F0F6FC]">
          {current.label}
        </div>
      </div>
      <div className="text-right">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">
          Theater
        </div>
        <div className="mt-1 text-sm font-semibold text-[#C9D1D9]">
          Scottsdale / Phoenix Metro
        </div>
      </div>
    </header>
  )
}

export default function App() {
  const [selectedPage, setSelectedPage] = useState('briefing')
  const [msgOpen, setMsgOpen]           = useState(false)

  let content = <DailyBriefingPanel />
  if (selectedPage === 'itinerary') content = <ItineraryPanel />
  if (selectedPage === 'arrivals')  content = <ArrivalsPanel />
  if (selectedPage === 'map')       content = <FlightMapPanel />
  if (selectedPage === 'meals')     content = <MealsPanel />
  if (selectedPage === 'logistics') content = <LogisticsPanel />
  if (selectedPage === 'budget')    content = <BudgetPanel />
  if (selectedPage === 'roster')    content = <RosterPanel />

  return (
    <div className="flex flex-col bg-[#0b0f14] text-[#C9D1D9] md:h-screen md:flex-row">
      <ShellNav selectedPage={selectedPage} onSelectPage={setSelectedPage} />
      <main className="flex flex-1 flex-col md:min-h-0 md:overflow-hidden">
        <AppHeader selectedPage={selectedPage} />
        <div className="flex flex-1 md:min-h-0 md:overflow-hidden">{content}</div>
      </main>

      {/* Floating messages button */}
      <button
        onClick={() => setMsgOpen(true)}
        className="fixed bottom-6 right-5 z-30 flex items-center gap-2 rounded-full border border-[#58A6FF]/40 bg-[#161b22] px-4 py-3 text-[11px] font-black uppercase tracking-wider text-[#58A6FF] shadow-lg shadow-black/40 hover:bg-[#58A6FF]/10 transition-colors"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <MessageSquarePlus size={16} />
        <span className="hidden sm:inline">Message</span>
      </button>

      {msgOpen && <MessagesDrawer onClose={() => setMsgOpen(false)} />}
    </div>
  )
}
