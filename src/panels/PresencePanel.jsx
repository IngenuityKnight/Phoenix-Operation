import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const STATUSES = [
  { key: 'At the house', emoji: '🏠', color: '#48B040' },
  { key: 'At the pool',  emoji: '🏊', color: '#BA1323' },
  { key: 'Out / bars',   emoji: '🍺', color: '#C4952A' },
  { key: 'Golf',         emoji: '⛳', color: '#48B040' },
  { key: 'On the way',   emoji: '🚗', color: '#C4952A' },
  { key: 'Crashed',      emoji: '😴', color: '#9A8070' },
]

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]))

function relTime(ts) {
  const diff = Date.now() - new Date(ts)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export default function PresencePanel() {
  const { rows: presence, insert, update } = useSupabaseTable('presence', { orderBy: 'updated_at', ascending: false })
  const { rows: roster } = useSupabaseTable('roster', { orderBy: 'name' })

  const [myName, setMyName]     = useState(() => localStorage.getItem('phx_name') || '')
  const [nameMode, setNameMode] = useState('roster') // 'roster' | 'manual'
  const [saving, setSaving]     = useState(false)

  const rosterNames = roster.filter(r => r.status !== 'Ghosting').map(r => r.name)

  async function setStatus(statusKey) {
    if (!myName.trim()) return
    setSaving(true)
    localStorage.setItem('phx_name', myName.trim())

    const existing = presence.find(p => p.name.toLowerCase() === myName.trim().toLowerCase())
    const payload = { status: statusKey, updated_at: new Date().toISOString() }

    if (existing) {
      await update(existing.id, payload)
    } else {
      await insert({ name: myName.trim(), ...payload })
    }
    setSaving(false)
  }

  const myRow = presence.find(p => p.name.toLowerCase() === myName.trim().toLowerCase())

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#3C1810] px-4 py-4 md:px-6">
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8070]">Live Crew Status</div>
        <div className="mt-0.5 text-lg font-bold text-[#F2E4D0]">Where Is Everyone</div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {/* Set my status */}
        <div className="mb-6 rounded border border-[#3C1810] bg-[#1C0C08] p-4">
          <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#BA1323]">Set My Status</div>

          {/* Name picker */}
          <div className="mb-4">
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">Who are you?</div>
            {nameMode === 'roster' ? (
              <select
                className="w-full rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] focus:border-[#BA1323] focus:outline-none"
                value={myName}
                onChange={e => {
                  if (e.target.value === '__manual__') { setNameMode('manual'); setMyName('') }
                  else setMyName(e.target.value)
                }}
              >
                <option value="">— Pick your name —</option>
                {rosterNames.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="__manual__">Other (not on roster)…</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none"
                  value={myName}
                  onChange={e => setMyName(e.target.value)}
                  placeholder="Your name"
                />
                <button type="button" onClick={() => { setNameMode('roster'); setMyName('') }} className="shrink-0 text-[10px] text-[#9A8070] hover:text-[#BA1323]">← Roster</button>
              </div>
            )}
          </div>

          {/* Status pills */}
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">Where are you?</div>
          <div className={`flex flex-wrap gap-2 transition-opacity ${!myName.trim() || saving ? 'pointer-events-none opacity-40' : ''}`}>
            {STATUSES.map(s => {
              const isActive = myRow?.status === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatus(s.key)}
                  className="rounded px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-all"
                  style={{
                    color: isActive ? '#140a06' : s.color,
                    background: isActive ? s.color : `${s.color}18`,
                    border: `1px solid ${isActive ? s.color : `${s.color}40`}`,
                  }}
                >
                  {s.emoji} {s.key}
                </button>
              )
            })}
          </div>
          {!myName.trim() && (
            <div className="mt-2 text-[10px] text-[#5C3820]">Pick your name above to set a status</div>
          )}
          {myRow && (
            <div className="mt-3 font-mono text-[10px] text-[#9A8070]">
              Last updated: {relTime(myRow.updated_at)}
            </div>
          )}
        </div>

        {/* Live crew grid */}
        <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
          <div className="border-b border-[#3C1810] px-5 py-3">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5C3820]">
              {presence.length} / {rosterNames.length} reporting
            </div>
          </div>

          {presence.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-[#5C3820]">
              No one has set their status yet
            </div>
          ) : (
            <div className="divide-y divide-[#281408]">
              {presence.map(row => {
                const s = STATUS_MAP[row.status]
                return (
                  <div key={row.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{s?.emoji ?? '❓'}</span>
                      <div>
                        <div className="text-sm font-semibold text-[#F2E4D0]">{row.name}</div>
                        <div
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: s?.color ?? '#9A8070' }}
                        >
                          {row.status}
                        </div>
                      </div>
                    </div>
                    <div className="font-mono text-[10px] text-[#5C3820]">{relTime(row.updated_at)}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Roster members not yet reporting */}
          {(() => {
            const reported = new Set(presence.map(p => p.name.toLowerCase()))
            const silent = rosterNames.filter(n => !reported.has(n.toLowerCase()))
            if (silent.length === 0) return null
            return (
              <div className="border-t border-[#281408] px-5 py-3">
                <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#3C1810]">No status set</div>
                <div className="flex flex-wrap gap-1.5">
                  {silent.map(n => (
                    <span key={n} className="rounded border border-[#281408] px-2 py-0.5 text-[10px] text-[#3C1810]">{n}</span>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
