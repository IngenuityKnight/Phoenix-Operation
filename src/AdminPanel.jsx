import { useState } from 'react'
import { Pin, PinOff, Trash2 } from 'lucide-react'
import { supabase } from './supabaseClient'
import { useSupabaseTable } from './hooks/useSupabaseTable'

const CATEGORIES = ['INFO', 'ARRIVAL', 'TRANSPORT', 'FOOD', 'ALERT', 'HYPE']

const CATEGORY_CONFIG = {
  INFO:      { color: '#58A6FF', label: 'INFO' },
  ARRIVAL:   { color: '#3FB950', label: 'ARRIVAL' },
  TRANSPORT: { color: '#D29922', label: 'TRANSPORT' },
  FOOD:      { color: '#F78166', label: 'FOOD' },
  ALERT:     { color: '#F85149', label: 'ALERT' },
  HYPE:      { color: '#A371F7', label: 'HYPE' },
}

const EXPIRE_OPTIONS = [
  { label: 'Never', value: null },
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
]

function relativeTime(ts) {
  const diff = Date.now() - new Date(ts)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return `${hrs}h ${mins % 60}m ago`
}

function expiresIn(ts) {
  if (!ts) return null
  const diff = new Date(ts) - Date.now()
  if (diff <= 0) return 'expired'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `expires in ${mins}m`
  return `expires in ${Math.floor(mins / 60)}h ${mins % 60}m`
}

export default function AdminPanel() {
  const { rows: feed, insert, update, remove } = useSupabaseTable('ops_feed', {
    orderBy: 'created_at',
    ascending: false,
  })

  const [message, setMessage]         = useState('')
  const [category, setCategory]       = useState('INFO')
  const [pinned, setPinned]           = useState(false)
  const [expireMinutes, setExpireMinutes] = useState(null)
  const [posting, setPosting]         = useState(false)

  const activeFeed = feed.filter((e) => !e.expires_at || new Date(e.expires_at) > new Date())
  const expiredFeed = feed.filter((e) => e.expires_at && new Date(e.expires_at) <= new Date())

  async function handlePost(e) {
    e.preventDefault()
    if (!message.trim()) return
    setPosting(true)

    // Unpin all others if this one is pinned
    if (pinned) {
      await supabase.from('ops_feed').update({ pinned: false }).eq('pinned', true)
    }

    const expires_at = expireMinutes
      ? new Date(Date.now() + expireMinutes * 60 * 1000).toISOString()
      : null

    await insert({ message: message.trim(), category, pinned, expires_at })
    setMessage('')
    setPinned(false)
    setExpireMinutes(null)
    setPosting(false)
  }

  async function handlePin(entry) {
    if (!entry.pinned) {
      // Unpin all others, then pin this one
      await supabase.from('ops_feed').update({ pinned: false }).eq('pinned', true)
      await update(entry.id, { pinned: true })
    } else {
      await update(entry.id, { pinned: false })
    }
  }

  const cfg = (cat) => CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.INFO

  return (
    <div className="min-h-screen bg-[#0b0f14] text-[#C9D1D9]">

      {/* ── Header ── */}
      <div className="border-b border-[#30363D] bg-[#0d1117] px-5 py-4">
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#58A6FF]">Phoenix Operation</div>
        <div className="text-xl font-black uppercase tracking-[0.08em] text-[#F0F6FC]">Ops Feed Control</div>
        <div className="mt-1 text-[11px] text-[#4B5563]">
          Posts appear instantly on the war room at <span className="text-[#58A6FF]">/command</span> · Post from <span className="text-[#58A6FF]">/post</span>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">

        {/* ── Quick Post Form ── */}
        <div className="rounded border border-[#30363D] bg-[#161b22]">
          <div className="border-b border-[#30363D] px-5 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#58A6FF]">Quick Post</div>
          </div>
          <form onSubmit={handlePost} className="p-5 space-y-4">
            {/* Message */}
            <textarea
              className="w-full rounded border border-[#30363D] bg-[#0d1117] px-4 py-3 text-sm text-[#C9D1D9] placeholder-[#4B5563] focus:border-[#58A6FF] focus:outline-none resize-none"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Cameron just landed at PHX · 11:32am"
              required
            />

            {/* Category pills */}
            <div>
              <div className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#8B949E]">Category</div>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const c = cfg(cat)
                  const active = category === cat
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className="rounded px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all"
                      style={{
                        color: active ? '#0d1117' : c.color,
                        background: active ? c.color : `${c.color}18`,
                        border: `1px solid ${active ? c.color : `${c.color}40`}`,
                      }}
                    >
                      {cat}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Options row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Pin toggle */}
              <button
                type="button"
                onClick={() => setPinned((p) => !p)}
                className={`flex items-center gap-2 rounded border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  pinned
                    ? 'border-[#D29922] bg-[#D29922]/15 text-[#D29922]'
                    : 'border-[#30363D] bg-[#0d1117] text-[#4B5563] hover:text-[#8B949E]'
                }`}
              >
                <Pin size={12} />
                {pinned ? 'Pinned to top' : 'Pin to top'}
              </button>

              {/* Auto-expire */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#8B949E]">Expires:</span>
                <div className="flex gap-1">
                  {EXPIRE_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => setExpireMinutes(opt.value)}
                      className={`rounded px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        expireMinutes === opt.value
                          ? 'bg-[#58A6FF]/20 text-[#58A6FF] border border-[#58A6FF]/40'
                          : 'border border-[#30363D] text-[#4B5563] hover:text-[#8B949E]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={posting || !message.trim()}
              className="w-full rounded bg-[#58A6FF] py-3 text-sm font-black uppercase tracking-wider text-[#0d1117] hover:bg-[#79b8ff] disabled:opacity-40 transition-colors"
            >
              {posting ? 'Posting…' : 'Post to War Room'}
            </button>
          </form>
        </div>

        {/* ── Active Feed ── */}
        <div className="rounded border border-[#30363D] bg-[#161b22]">
          <div className="flex items-center justify-between border-b border-[#30363D] px-5 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#58A6FF]">
              Live Feed
            </div>
            <div className="font-mono text-[10px] text-[#4B5563]">{activeFeed.length} active</div>
          </div>

          {activeFeed.length === 0 ? (
            <div className="py-10 text-center text-[11px] uppercase tracking-widest text-[#4B5563]">
              No active messages
            </div>
          ) : (
            <div className="divide-y divide-[#21262d]">
              {activeFeed.map((entry) => {
                const c = cfg(entry.category)
                const exp = expiresIn(entry.expires_at)
                return (
                  <div key={entry.id} className={`flex items-start gap-3 px-5 py-4 ${entry.pinned ? 'bg-[#D29922]/5' : ''}`}>
                    {/* Category badge */}
                    <div
                      className="mt-0.5 shrink-0 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{ color: c.color, background: `${c.color}20` }}
                    >
                      {entry.category}
                    </div>

                    {/* Message + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-snug text-[#C9D1D9]">{entry.message}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] text-[#4B5563]">{relativeTime(entry.created_at)}</span>
                        {entry.pinned && (
                          <span className="text-[10px] font-bold text-[#D29922]">📌 Pinned</span>
                        )}
                        {exp && (
                          <span className={`text-[10px] ${exp === 'expired' ? 'text-[#F85149]' : 'text-[#4B5563]'}`}>
                            {exp}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handlePin(entry)}
                        className={`p-1.5 transition-colors ${entry.pinned ? 'text-[#D29922]' : 'text-[#4B5563] hover:text-[#D29922]'}`}
                        title={entry.pinned ? 'Unpin' : 'Pin to top'}
                      >
                        {entry.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => { if (window.confirm('Delete this entry?')) remove(entry.id) }}
                        className="p-1.5 text-[#4B5563] hover:text-[#F85149] transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Expired entries (collapsed) ── */}
        {expiredFeed.length > 0 && (
          <div className="rounded border border-[#21262d] bg-[#0d1117] px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-[#4B5563]">
                {expiredFeed.length} expired {expiredFeed.length === 1 ? 'entry' : 'entries'}
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('Delete all expired entries?')) {
                    for (const e of expiredFeed) await remove(e.id)
                  }
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-[#4B5563] hover:text-[#F85149]"
              >
                Clear all
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
