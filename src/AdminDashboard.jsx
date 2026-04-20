import { useRef, useState } from 'react'
import {
  Calendar, Check, ClipboardList, DollarSign, Edit2,
  LogOut, Monitor, Pin, PinOff, Plus, Radio, RefreshCw,
  Settings, Trash2, Users, Utensils, X, Zap,
} from 'lucide-react'
import { supabase } from './supabaseClient'
import { useSupabaseTable } from './hooks/useSupabaseTable'

// ─── AUTH ─────────────────────────────────────────────────────────────────────
const PASSWORD   = 'phxops2025'
const STORAGE_KEY = 'phx_admin_authed'

// ─── STYLE PRIMITIVES ─────────────────────────────────────────────────────────
const inp = 'w-full rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none'
const sel = 'w-full rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] focus:border-[#BA1323] focus:outline-none'
const btnPrimary = 'rounded bg-[#BA1323] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#140a06] hover:bg-[#79b8ff] transition-colors disabled:opacity-40'
const btnGhost   = 'rounded border border-[#3C1810] px-4 py-2 text-[11px] font-black uppercase tracking-wider text-[#9A8070] hover:border-[#9A8070] hover:text-[#F2E4D0] transition-colors'

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 pt-16 pb-12">
      <div className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded border border-[#3C1810] bg-[#1C0C08] shadow-2xl`}>
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#BA1323]">{title}</span>
          <button type="button" onClick={onClose} className="text-[#9A8070] hover:text-[#F2E4D0]"><X size={16} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function FF({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">{label}</label>
      {children}
    </div>
  )
}

function SectionHeader({ title, sub, action }) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#BA1323]">{sub}</div>
        <div className="text-2xl font-black uppercase tracking-[0.06em] text-[#FAF0E8]">{title}</div>
      </div>
      {action}
    </div>
  )
}

// ─── TRIP SETTINGS ────────────────────────────────────────────────────────────
const HOUSE_KEYS = ['Airbnb Address', 'Front Door Code', 'WiFi Network', 'WiFi Password', 'Check-in Time', 'Check-out Time']

function TripSettings() {
  const { rows, update, insert } = useSupabaseTable('house_info', { orderBy: 'key' })
  const [draft, setDraft]   = useState({}) // key -> draft value
  const [saving, setSaving] = useState({})
  const [tickerDraft, setTickerDraft] = useState(null) // null = not editing
  const [tickerSaving, setTickerSaving] = useState(false)

  const houseRows  = rows.filter(r => HOUSE_KEYS.includes(r.key))
  const tickerRow  = rows.find(r => r.key === 'Ticker Messages')

  async function saveField(row) {
    setSaving(p => ({ ...p, [row.id]: true }))
    await update(row.id, { value: draft[row.id] })
    setDraft(p => { const n = { ...p }; delete n[row.id]; return n })
    setSaving(p => { const n = { ...p }; delete n[row.id]; return n })
  }

  async function saveTicker() {
    setTickerSaving(true)
    if (tickerRow) {
      await update(tickerRow.id, { value: tickerDraft })
    } else {
      await insert({ key: 'Ticker Messages', value: tickerDraft })
    }
    setTickerSaving(false)
    setTickerDraft(null)
  }

  return (
    <div>
      <SectionHeader title="Trip Settings" sub="Phoenix Operation" />

      {/* House info */}
      <div className="mb-6 rounded border border-[#3C1810] bg-[#1C0C08]">
        <div className="border-b border-[#3C1810] px-5 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5C3820]">House Intel</div>
        </div>
        <div className="divide-y divide-[#281408]">
          {houseRows.length === 0 && (
            <div className="px-5 py-4 text-sm text-[#5C3820]">Seed the house_info table to manage fields here.</div>
          )}
          {houseRows.map(row => {
            const isEditing = draft[row.id] !== undefined
            return (
              <div key={row.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-44 shrink-0 text-[11px] font-black uppercase tracking-wider text-[#9A8070]">{row.key}</div>
                <div className="flex-1">
                  {isEditing
                    ? <input className={inp} autoFocus value={draft[row.id]}
                        onChange={e => setDraft(p => ({ ...p, [row.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') saveField(row); if (e.key === 'Escape') setDraft(p => { const n = {...p}; delete n[row.id]; return n }) }}
                      />
                    : <span className="font-mono text-sm text-[#F2E4D0]">{row.value || '—'}</span>}
                </div>
                <div className="flex shrink-0 gap-2">
                  {isEditing ? (
                    <>
                      <button onClick={() => saveField(row)} disabled={saving[row.id]} className={btnPrimary}>{saving[row.id] ? '…' : 'Save'}</button>
                      <button onClick={() => setDraft(p => { const n = {...p}; delete n[row.id]; return n })} className={btnGhost}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => setDraft(p => ({ ...p, [row.id]: row.value || '' }))} className="p-1.5 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={13} /></button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Ticker messages */}
      <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5C3820]">War Room Ticker</div>
            <div className="text-xs text-[#9A8070] mt-0.5">One message per line — scrolls on the /command TV display</div>
          </div>
          {tickerDraft === null && (
            <button onClick={() => setTickerDraft(tickerRow?.value || '')} className={btnGhost}><Edit2 size={13} className="inline mr-1" />Edit</button>
          )}
        </div>
        <div className="p-5">
          {tickerDraft !== null ? (
            <div className="flex flex-col gap-3">
              <textarea className={`${inp} resize-none`} rows={6} value={tickerDraft}
                onChange={e => setTickerDraft(e.target.value)}
                placeholder="Pool opens 8am&#10;Golf tee time 7am Friday — do not sleep in&#10;Hydrate. Scottsdale in May will humble you." />
              <div className="flex gap-3">
                <button onClick={saveTicker} disabled={tickerSaving} className={btnPrimary}>{tickerSaving ? 'Saving…' : 'Save Ticker'}</button>
                <button onClick={() => setTickerDraft(null)} className={btnGhost}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {(tickerRow?.value || '').split('\n').filter(Boolean).map((line, i) => (
                <div key={i} className="font-mono text-xs text-[#9A8070]">· {line}</div>
              ))}
              {!tickerRow?.value && <div className="text-sm text-[#5C3820]">No ticker messages set.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ROSTER ──────────────────────────────────────────────────────────────────
const TRANSPORT_OPTS = ['flight', 'drive', 'rideshare', 'TBD']
const ARRIVAL_STATUS_OPTS = ['TBD', 'Confirmed', 'En Route', 'Landed', 'Arrived']
const STATUS_COLORS = { Arrived: '#48B040', Landed: '#48B040', 'En Route': '#C4952A', Confirmed: '#BA1323', TBD: '#5C3820' }
const ROSTER_EMPTY = { name: '', transport: 'flight', arrival_date: '', arrival_time: '', flight_number: '', pickup_needed: false, pickup_notes: '', status: 'TBD', notes: '' }

function AdminRoster() {
  const { rows, insert, update, remove } = useSupabaseTable('arrivals', { orderBy: 'arrival_time', ascending: true })
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState(ROSTER_EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, arrival_time: form.arrival_time || null, arrival_date: form.arrival_date || null, flight_number: form.flight_number || null, pickup_notes: form.pickup_notes || null, notes: form.notes || null }
    if (modal === 'add') await insert(payload)
    else await update(modal.id, payload)
    setSaving(false); setModal(null)
  }

  return (
    <div>
      <SectionHeader title="Roster" sub="Arrivals Tracking"
        action={<button onClick={() => { setForm(ROSTER_EMPTY); setModal('add') }} className={btnPrimary}><Plus size={13} className="inline mr-1" />Add Person</button>} />

      <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
        <div className="grid grid-cols-[1fr_80px_80px_90px_80px_64px] gap-3 border-b border-[#3C1810] bg-[#140a06] px-5 py-2">
          {['Name', 'Flight', 'ETA', 'Status', 'Transport', ''].map(h => (
            <div key={h} className="text-[9px] font-black uppercase tracking-[0.3em] text-[#5C3820]">{h}</div>
          ))}
        </div>
        {rows.length === 0 && <div className="px-5 py-10 text-center text-sm text-[#5C3820]">No arrivals logged</div>}
        {rows.map(row => (
          <div key={row.id} className="grid grid-cols-[1fr_80px_80px_90px_80px_64px] items-center gap-3 border-b border-[#281408] px-5 py-3">
            <div>
              <div className="text-sm font-semibold text-[#F2E4D0]">{row.name}</div>
              {row.pickup_needed && <div className="text-[10px] font-bold text-[#E83025]">Needs ride</div>}
            </div>
            <div className="font-mono text-sm text-[#9A8070]">{row.flight_number || '—'}</div>
            <div className="font-mono text-sm text-[#F2E4D0]">{row.arrival_time ? row.arrival_time.slice(0, 5) : '—'}</div>
            <div className="text-[10px] font-black uppercase" style={{ color: STATUS_COLORS[row.status] || '#5C3820' }}>{row.status}</div>
            <div className="text-[11px] capitalize text-[#9A8070]">{row.transport || '—'}</div>
            <div className="flex gap-1.5">
              <button onClick={() => { setForm({ ...ROSTER_EMPTY, ...row }); setModal(row) }} className="p-1 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={13} /></button>
              <button onClick={() => { if (window.confirm('Delete?')) remove(row.id) }} className="p-1 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Person' : `Edit — ${modal.name}`} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <FF label="Name"><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} required /></FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Status">
                <select className={sel} value={form.status} onChange={e => set('status', e.target.value)}>
                  {ARRIVAL_STATUS_OPTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </FF>
              <FF label="Transport">
                <select className={sel} value={form.transport} onChange={e => set('transport', e.target.value)}>
                  {TRANSPORT_OPTS.map(t => <option key={t}>{t}</option>)}
                </select>
              </FF>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Flight Number"><input className={inp} value={form.flight_number} onChange={e => set('flight_number', e.target.value)} /></FF>
              <FF label="Arrival Time"><input type="time" className={inp} value={form.arrival_time} onChange={e => set('arrival_time', e.target.value)} /></FF>
            </div>
            <FF label="Arrival Date"><input type="date" className={inp} value={form.arrival_date} onChange={e => set('arrival_date', e.target.value)} /></FF>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" className="accent-[#E83025]" checked={!!form.pickup_needed} onChange={e => set('pickup_needed', e.target.checked)} />
              <span className="text-sm text-[#F2E4D0]">Needs a ride from airport</span>
            </label>
            {form.pickup_needed && <FF label="Pickup Notes"><input className={inp} value={form.pickup_notes} onChange={e => set('pickup_notes', e.target.value)} /></FF>}
            <FF label="Notes"><input className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} /></FF>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── BUDGET ──────────────────────────────────────────────────────────────────
const EXPENSE_CATS = ['house', 'golf', 'food', 'drinks', 'transport', 'activities', 'other']
const CAT_HEX = { house: '#BA1323', golf: '#48B040', food: '#C4952A', drinks: '#C4952A', transport: '#D4601A', activities: '#48B040', other: '#9A8070' }
const BUDGET_EMPTY = { description: '', amount: '', paid_by: '', category: 'other', split_count: '14', notes: '' }

function AdminBudget() {
  const { rows: expenses, insert, update, remove } = useSupabaseTable('expenses', { orderBy: 'created_at', ascending: false })
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState(BUDGET_EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const total = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)

  async function handleSave(e) {
    e.preventDefault(); setSaving(true)
    const payload = { description: form.description, amount: parseFloat(form.amount), paid_by: form.paid_by, category: form.category, split_count: parseInt(form.split_count) || 14, notes: form.notes || null }
    if (modal === 'add') await insert(payload)
    else await update(modal.id, payload)
    setSaving(false); setModal(null)
  }

  return (
    <div>
      <SectionHeader title="Budget" sub="Expense Tracker"
        action={<button onClick={() => { setForm(BUDGET_EMPTY); setModal('add') }} className={btnPrimary}><Plus size={13} className="inline mr-1" />Add Expense</button>} />

      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Total Spent', value: `$${total.toFixed(2)}`, color: '#FAF0E8' },
          { label: 'Per Person', value: `$${(total / 14).toFixed(2)}`, color: '#BA1323' },
          { label: 'Line Items', value: expenses.length, color: '#9A8070' },
        ].map(s => (
          <div key={s.label} className="rounded border border-[#3C1810] bg-[#1C0C08] px-4 py-3 text-center">
            <div className="font-mono text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-[#5C3820]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
        <div className="grid grid-cols-[1fr_80px_100px_80px_52px_56px] gap-3 border-b border-[#3C1810] bg-[#140a06] px-5 py-2">
          {['Description', 'Amount', 'Paid By', 'Category', 'Split', ''].map(h => (
            <div key={h} className="text-[9px] font-black uppercase tracking-[0.3em] text-[#5C3820]">{h}</div>
          ))}
        </div>
        {expenses.length === 0 && <div className="px-5 py-10 text-center text-sm text-[#5C3820]">No expenses logged</div>}
        {expenses.map(row => {
          const color = CAT_HEX[row.category] || '#9A8070'
          return (
            <div key={row.id} className="grid grid-cols-[1fr_80px_100px_80px_52px_56px] items-center gap-3 border-b border-[#281408] px-5 py-3">
              <div className="text-sm font-semibold text-[#F2E4D0] truncate">{row.description}</div>
              <div className="font-mono text-sm font-bold text-[#48B040]">${parseFloat(row.amount).toFixed(2)}</div>
              <div className="text-sm text-[#9A8070] truncate">{row.paid_by}</div>
              <div className="text-[10px] font-bold capitalize" style={{ color }}>{row.category}</div>
              <div className="text-center text-sm text-[#5C3820]">{row.split_count}</div>
              <div className="flex gap-1.5">
                <button onClick={() => { setForm({ ...BUDGET_EMPTY, ...row, amount: String(row.amount), split_count: String(row.split_count) }); setModal(row) }} className="p-1 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={13} /></button>
                <button onClick={() => { if (window.confirm('Delete?')) remove(row.id) }} className="p-1 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Expense' : 'Edit Expense'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <FF label="Description"><input className={inp} value={form.description} onChange={e => set('description', e.target.value)} required /></FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Amount ($)"><input type="number" step="0.01" min="0" className={inp} value={form.amount} onChange={e => set('amount', e.target.value)} required /></FF>
              <FF label="Paid By"><input className={inp} value={form.paid_by} onChange={e => set('paid_by', e.target.value)} required /></FF>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Category">
                <select className={sel} value={form.category} onChange={e => set('category', e.target.value)}>
                  {EXPENSE_CATS.map(c => <option key={c} className="capitalize">{c}</option>)}
                </select>
              </FF>
              <FF label="Split Count"><input type="number" min="1" max="14" className={inp} value={form.split_count} onChange={e => set('split_count', e.target.value)} /></FF>
            </div>
            <FF label="Notes"><input className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} /></FF>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── ITINERARY ────────────────────────────────────────────────────────────────
const DAYS = [
  { date: '2026-05-28', label: 'Wed 5/28' },
  { date: '2026-05-29', label: 'Thu 5/29' },
  { date: '2026-05-30', label: 'Fri 5/30' },
  { date: '2026-05-31', label: 'Sat 5/31' },
]
const ITIN_CATS = ['pool', 'nightlife', 'golf', 'food', 'transport', 'activity', 'other']
const ITIN_CAT_HEX = { pool: '#BA1323', nightlife: '#C4952A', golf: '#48B040', food: '#C4952A', transport: '#9A8070', activity: '#E83025', other: '#5C3820' }
const ITIN_EMPTY = { day_date: DAYS[0].date, start_time: '', end_time: '', title: '', category: 'other', location_name: '', address: '', notes: '' }

function AdminItinerary() {
  const { rows, insert, update, remove } = useSupabaseTable('itinerary_items', { orderBy: 'start_time', ascending: true })
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState(ITIN_EMPTY)
  const [saving, setSaving] = useState(false)
  const [activeDay, setActiveDay] = useState(DAYS[0].date)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, start_time: form.start_time || null, end_time: form.end_time || null, location_name: form.location_name || null, address: form.address || null, notes: form.notes || null }
    if (modal === 'add') await insert(payload)
    else await update(modal.id, payload)
    setSaving(false); setModal(null)
  }

  const dayRows = rows.filter(r => r.day_date === activeDay).sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))

  return (
    <div>
      <SectionHeader title="Itinerary" sub="Schedule Management" />
      <div className="mb-4 flex gap-2 flex-wrap">
        {DAYS.map(d => (
          <button key={d.date} onClick={() => setActiveDay(d.date)}
            className={`rounded px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${activeDay === d.date ? 'bg-[#BA1323] text-[#140a06]' : 'border border-[#3C1810] text-[#9A8070] hover:text-[#F2E4D0]'}`}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5C3820]">{dayRows.length} events</div>
          <button onClick={() => { setForm({ ...ITIN_EMPTY, day_date: activeDay }); setModal('add') }} className={btnPrimary}><Plus size={13} className="inline mr-1" />Add Event</button>
        </div>
        {dayRows.length === 0 && <div className="px-5 py-10 text-center text-sm text-[#5C3820]">No events for this day</div>}
        {dayRows.map(row => {
          const color = ITIN_CAT_HEX[row.category] || '#5C3820'
          return (
            <div key={row.id} className="flex items-start gap-4 border-b border-[#281408] px-5 py-4">
              <div className="w-12 shrink-0 font-mono text-sm font-bold text-[#9A8070]">{row.start_time ? row.start_time.slice(0, 5) : '—'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#F2E4D0]">{row.title}</span>
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider" style={{ color, background: `${color}20` }}>{row.category}</span>
                </div>
                {row.location_name && <div className="text-xs text-[#9A8070] mt-0.5">{row.location_name}</div>}
                {row.notes && <div className="text-xs italic text-[#5C3820] mt-0.5">{row.notes}</div>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => { setForm({ ...ITIN_EMPTY, ...row }); setModal(row) }} className="p-1 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={13} /></button>
                <button onClick={() => { if (window.confirm('Delete?')) remove(row.id) }} className="p-1 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Event' : 'Edit Event'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FF label="Day">
                <select className={sel} value={form.day_date} onChange={e => set('day_date', e.target.value)}>
                  {DAYS.map(d => <option key={d.date} value={d.date}>{d.label}</option>)}
                </select>
              </FF>
              <FF label="Category">
                <select className={sel} value={form.category} onChange={e => set('category', e.target.value)}>
                  {ITIN_CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </FF>
            </div>
            <FF label="Title"><input className={inp} value={form.title} onChange={e => set('title', e.target.value)} required /></FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Start Time"><input type="time" className={inp} value={form.start_time} onChange={e => set('start_time', e.target.value)} /></FF>
              <FF label="End Time"><input type="time" className={inp} value={form.end_time} onChange={e => set('end_time', e.target.value)} /></FF>
            </div>
            <FF label="Location Name"><input className={inp} value={form.location_name} onChange={e => set('location_name', e.target.value)} /></FF>
            <FF label="Notes"><input className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} /></FF>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── MEALS ────────────────────────────────────────────────────────────────────
const MEAL_TYPES  = ['breakfast', 'lunch', 'dinner', 'snacks']
const PLAN_TYPES  = ['TBD', 'cook', 'restaurant', 'delivery', 'catered']
const PLAN_HEX    = { TBD: '#9A8070', cook: '#48B040', restaurant: '#BA1323', delivery: '#C4952A', catered: '#C4952A' }
const MEALS_EMPTY = { day_date: DAYS[0].date, meal_type: 'dinner', name: '', organizer: '', plan_type: 'TBD', headcount: 14, dietary_notes: '', location_name: '', cost_estimate: '', notes: '' }

function AdminMeals() {
  const { rows, insert, update, remove } = useSupabaseTable('meals', { orderBy: 'day_date', ascending: true })
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState(MEALS_EMPTY)
  const [saving, setSaving] = useState(false)
  const [activeDay, setActiveDay] = useState(DAYS[0].date)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, headcount: parseInt(form.headcount) || 14, cost_estimate: form.cost_estimate ? parseFloat(form.cost_estimate) : null, dietary_notes: form.dietary_notes || null, location_name: form.location_name || null, notes: form.notes || null }
    if (modal === 'add') await insert(payload)
    else await update(modal.id, payload)
    setSaving(false); setModal(null)
  }

  const dayRows = rows.filter(r => r.day_date === activeDay)

  return (
    <div>
      <SectionHeader title="Meals" sub="Food Planning"
        action={<button onClick={() => { setForm({ ...MEALS_EMPTY, day_date: activeDay }); setModal('add') }} className={btnPrimary}><Plus size={13} className="inline mr-1" />Add Meal</button>} />

      <div className="mb-4 flex gap-2 flex-wrap">
        {DAYS.map(d => (
          <button key={d.date} onClick={() => setActiveDay(d.date)}
            className={`rounded px-4 py-2 text-[11px] font-black uppercase tracking-wider transition-colors ${activeDay === d.date ? 'bg-[#BA1323] text-[#140a06]' : 'border border-[#3C1810] text-[#9A8070] hover:text-[#F2E4D0]'}`}>
            {d.label}
          </button>
        ))}
      </div>

      <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
        {dayRows.length === 0 && <div className="px-5 py-10 text-center text-sm text-[#5C3820]">No meals for this day</div>}
        {dayRows.map(row => {
          const pcolor = PLAN_HEX[row.plan_type] || '#9A8070'
          return (
            <div key={row.id} className="flex items-start gap-4 border-b border-[#281408] px-5 py-4">
              <div className="w-20 shrink-0 text-[10px] font-black uppercase tracking-wider text-[#9A8070]">{row.meal_type}</div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-[#F2E4D0]">{row.name || 'TBD'}</span>
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-black capitalize" style={{ color: pcolor, background: `${pcolor}20` }}>{row.plan_type}</span>
                </div>
                {row.location_name && <div className="text-xs text-[#9A8070]">{row.location_name}</div>}
                {row.notes && <div className="text-xs italic text-[#5C3820]">{row.notes}</div>}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => { setForm({ ...MEALS_EMPTY, ...row, cost_estimate: row.cost_estimate != null ? String(row.cost_estimate) : '' }); setModal(row) }} className="p-1 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={13} /></button>
                <button onClick={() => { if (window.confirm('Delete?')) remove(row.id) }} className="p-1 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Meal' : 'Edit Meal'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FF label="Day">
                <select className={sel} value={form.day_date} onChange={e => set('day_date', e.target.value)}>
                  {DAYS.map(d => <option key={d.date} value={d.date}>{d.label}</option>)}
                </select>
              </FF>
              <FF label="Meal Type">
                <select className={sel} value={form.meal_type} onChange={e => set('meal_type', e.target.value)}>
                  {MEAL_TYPES.map(m => <option key={m}>{m}</option>)}
                </select>
              </FF>
            </div>
            <FF label="Name / Description"><input className={inp} value={form.name} onChange={e => set('name', e.target.value)} /></FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Plan Type">
                <select className={sel} value={form.plan_type} onChange={e => set('plan_type', e.target.value)}>
                  {PLAN_TYPES.map(p => <option key={p}>{p}</option>)}
                </select>
              </FF>
              <FF label="Location"><input className={inp} value={form.location_name} onChange={e => set('location_name', e.target.value)} /></FF>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Headcount"><input type="number" className={inp} value={form.headcount} onChange={e => set('headcount', e.target.value)} /></FF>
              <FF label="Cost Estimate ($)"><input type="number" step="0.01" className={inp} value={form.cost_estimate} onChange={e => set('cost_estimate', e.target.value)} /></FF>
            </div>
            <FF label="Notes"><input className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} /></FF>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── LOGISTICS ────────────────────────────────────────────────────────────────
const LOG_CATS   = ['groceries', 'supplies', 'transport', 'activities', 'other']
const LOG_CAT_HEX = { groceries: '#48B040', supplies: '#BA1323', transport: '#C4952A', activities: '#C4952A', other: '#9A8070' }
const LOG_EMPTY  = { category: 'other', title: '', assignee: '', notes: '', cost: '', done: false }

function AdminLogistics() {
  const { rows, insert, update, remove } = useSupabaseTable('logistics_items', { orderBy: 'category', ascending: true })
  const [modal, setModal] = useState(null)
  const [form,  setForm]  = useState(LOG_EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  async function handleSave(e) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, cost: form.cost ? parseFloat(form.cost) : null, assignee: form.assignee || null, notes: form.notes || null }
    if (modal === 'add') await insert(payload)
    else await update(modal.id, payload)
    setSaving(false); setModal(null)
  }

  const done = rows.filter(r => r.done).length

  return (
    <div>
      <SectionHeader title="Logistics" sub="Task Checklist"
        action={<button onClick={() => { setForm(LOG_EMPTY); setModal('add') }} className={btnPrimary}><Plus size={13} className="inline mr-1" />Add Task</button>} />

      <div className="mb-4 flex items-center gap-2 font-mono text-sm text-[#9A8070]">
        <span className="font-bold text-[#48B040]">{done}</span> done ·
        <span className="font-bold text-[#F2E4D0]">{rows.length - done}</span> remaining
      </div>

      <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
        {rows.length === 0 && <div className="px-5 py-10 text-center text-sm text-[#5C3820]">No tasks</div>}
        {rows.map(row => {
          const color = LOG_CAT_HEX[row.category] || '#9A8070'
          return (
            <div key={row.id} className={`flex items-center gap-4 border-b border-[#281408] px-5 py-3 ${row.done ? 'opacity-50' : ''}`}>
              <button onClick={() => update(row.id, { done: !row.done })} className="shrink-0">
                {row.done
                  ? <div className="h-4 w-4 rounded-full border-2 border-[#48B040] bg-[#48B040]/20 flex items-center justify-center"><Check size={9} className="text-[#48B040]" /></div>
                  : <div className="h-4 w-4 rounded-full border-2 border-[#3C1810] hover:border-[#9A8070]" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-sm font-semibold ${row.done ? 'line-through text-[#5C3820]' : 'text-[#F2E4D0]'}`}>{row.title}</span>
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-black capitalize" style={{ color, background: `${color}20` }}>{row.category}</span>
                </div>
                {(row.assignee || row.cost) && (
                  <div className="mt-0.5 flex gap-3 text-xs text-[#9A8070]">
                    {row.assignee && <span>→ {row.assignee}</span>}
                    {row.cost && <span className="font-mono">${parseFloat(row.cost).toFixed(2)}</span>}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button onClick={() => { setForm({ ...LOG_EMPTY, ...row, cost: row.cost != null ? String(row.cost) : '' }); setModal(row) }} className="p-1 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={13} /></button>
                <button onClick={() => { if (window.confirm('Delete?')) remove(row.id) }} className="p-1 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={13} /></button>
              </div>
            </div>
          )
        })}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Task' : 'Edit Task'} onClose={() => setModal(null)}>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <FF label="Title"><input className={inp} value={form.title} onChange={e => set('title', e.target.value)} required /></FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Category">
                <select className={sel} value={form.category} onChange={e => set('category', e.target.value)}>
                  {LOG_CATS.map(c => <option key={c} className="capitalize">{c}</option>)}
                </select>
              </FF>
              <FF label="Assignee"><input className={inp} value={form.assignee} onChange={e => set('assignee', e.target.value)} /></FF>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Cost Estimate ($)"><input type="number" step="0.01" className={inp} value={form.cost} onChange={e => set('cost', e.target.value)} /></FF>
              <label className="flex items-end gap-2 cursor-pointer pb-2">
                <input type="checkbox" className="accent-[#48B040]" checked={!!form.done} onChange={e => set('done', e.target.checked)} />
                <span className="text-sm text-[#F2E4D0]">Mark done</span>
              </label>
            </div>
            <FF label="Notes"><input className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} /></FF>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className={btnPrimary}>{saving ? 'Saving…' : 'Save'}</button>
              <button type="button" onClick={() => setModal(null)} className={btnGhost}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

// ─── WAR ROOM CONTROLS ────────────────────────────────────────────────────────
function WarRoomControls() {
  const iframeRef = useRef(null)
  const [broadcast, setBroadcast] = useState('')
  const [sending, setSending]     = useState(false)
  const [sent, setSent]           = useState(false)

  async function handleBroadcast(e) {
    e.preventDefault()
    if (!broadcast.trim()) return
    setSending(true)
    const expires_at = new Date(Date.now() + 5 * 60 * 1000).toISOString()
    // Unpin any existing pinned, then insert the alert
    await supabase.from('ops_feed').update({ pinned: false }).eq('pinned', true)
    await supabase.from('ops_feed').insert({ message: broadcast.trim(), category: 'ALERT', pinned: true, expires_at })
    setBroadcast('')
    setSending(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  function reloadTV() {
    if (iframeRef.current) {
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src
    }
  }

  return (
    <div>
      <SectionHeader title="War Room Controls" sub="TV Display — /command" />

      <div className="grid grid-cols-2 gap-6">
        {/* Controls column */}
        <div className="flex flex-col gap-4">
          {/* Emergency broadcast */}
          <div className="rounded border border-[#E83025]/30 bg-[#1C0C08]">
            <div className="border-b border-[#E83025]/20 bg-[#E83025]/5 px-5 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#E83025]">Emergency Broadcast</div>
              <div className="mt-0.5 text-xs text-[#9A8070]">Flashing ALERT on TV — auto-expires in 5 minutes</div>
            </div>
            <form onSubmit={handleBroadcast} className="flex flex-col gap-3 p-4">
              <textarea className={`${inp} resize-none`} rows={3} value={broadcast}
                onChange={e => setBroadcast(e.target.value)}
                placeholder="e.g. Pool closed — everyone to the rooftop bar NOW" />
              <button type="submit" disabled={sending || !broadcast.trim()}
                className="rounded bg-[#E83025] py-2.5 text-[11px] font-black uppercase tracking-wider text-white hover:bg-[#ff6b63] disabled:opacity-40 transition-colors">
                {sending ? 'Broadcasting…' : sent ? '✓ Alert Sent!' : 'Broadcast Alert'}
              </button>
            </form>
          </div>

          {/* Quick links */}
          <div className="rounded border border-[#3C1810] bg-[#1C0C08] p-4">
            <div className="mb-3 text-[10px] font-black uppercase tracking-[0.25em] text-[#5C3820]">Quick Actions</div>
            <div className="flex flex-col gap-2">
              <button onClick={reloadTV}
                className="flex items-center justify-center gap-2 rounded border border-[#3C1810] py-2.5 text-[11px] font-black uppercase tracking-wider text-[#9A8070] hover:border-[#9A8070] hover:text-[#F2E4D0] transition-colors">
                <RefreshCw size={13} />Force Reload TV
              </button>
              <a href="/command" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded border border-[#3C1810] py-2.5 text-[11px] font-black uppercase tracking-wider text-[#9A8070] hover:border-[#BA1323] hover:text-[#BA1323] transition-colors">
                Open /command ↗
              </a>
              <a href="/post" target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded border border-[#3C1810] py-2.5 text-[11px] font-black uppercase tracking-wider text-[#9A8070] hover:border-[#9A8070] hover:text-[#F2E4D0] transition-colors">
                <Zap size={13} />Quick Post ↗
              </a>
            </div>
          </div>
        </div>

        {/* Iframe preview */}
        <div className="rounded border border-[#3C1810] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between border-b border-[#3C1810] bg-[#140a06] px-4 py-2">
            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#5C3820]">Live Preview</div>
            <div
              className="h-1.5 w-1.5 rounded-full bg-[#48B040]"
              style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
            />
          </div>
          <div className="relative flex-1 bg-[#0a0c10] overflow-hidden" style={{ minHeight: '360px' }}>
            <iframe
              ref={iframeRef}
              src="/command"
              title="War Room Preview"
              style={{
                width: '1920px',
                height: '1080px',
                transform: 'scale(0.31)',
                transformOrigin: 'top left',
                border: 'none',
                pointerEvents: 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── OPS FEED ────────────────────────────────────────────────────────────────
const OPS_CATS = ['INFO', 'ARRIVAL', 'TRANSPORT', 'FOOD', 'ALERT', 'HYPE']
const OPS_CAT_CFG = {
  INFO:      { color: '#BA1323' },
  ARRIVAL:   { color: '#48B040' },
  TRANSPORT: { color: '#C4952A' },
  FOOD:      { color: '#D4601A' },
  ALERT:     { color: '#E83025' },
  HYPE:      { color: '#C4952A' },
}
const EXPIRE_OPTS = [
  { label: 'Never', value: null },
  { label: '30 min', value: 30 },
  { label: '1 hr',   value: 60  },
  { label: '2 hr',   value: 120 },
]

function relativeTime(ts) {
  const diff = Date.now() - new Date(ts)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`
}

function expiresIn(ts) {
  if (!ts) return null
  const diff = new Date(ts) - Date.now()
  if (diff <= 0) return 'expired'
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `expires in ${mins}m`
  return `expires in ${Math.floor(mins / 60)}h ${mins % 60}m`
}

function AdminOpsFeed() {
  const { rows: feed, insert, update, remove } = useSupabaseTable('ops_feed', { orderBy: 'created_at', ascending: false })
  const [message, setMessage]       = useState('')
  const [category, setCategory]     = useState('INFO')
  const [pinned, setPinned]         = useState(false)
  const [expireMinutes, setExpire]  = useState(null)
  const [posting, setPosting]       = useState(false)

  const activeFeed  = feed.filter(e => !e.expires_at || new Date(e.expires_at) > new Date())
  const expiredFeed = feed.filter(e => e.expires_at && new Date(e.expires_at) <= new Date())

  async function handlePost(e) {
    e.preventDefault()
    if (!message.trim()) return
    setPosting(true)
    if (pinned) await supabase.from('ops_feed').update({ pinned: false }).eq('pinned', true)
    const expires_at = expireMinutes ? new Date(Date.now() + expireMinutes * 60 * 1000).toISOString() : null
    await insert({ message: message.trim(), category, pinned, expires_at })
    setMessage(''); setPinned(false); setExpire(null); setPosting(false)
  }

  async function handlePin(entry) {
    if (!entry.pinned) {
      await supabase.from('ops_feed').update({ pinned: false }).eq('pinned', true)
      await update(entry.id, { pinned: true })
    } else {
      await update(entry.id, { pinned: false })
    }
  }

  return (
    <div>
      <SectionHeader title="Ops Feed" sub="War Room Posts" />

      {/* Post form */}
      <div className="mb-6 rounded border border-[#3C1810] bg-[#1C0C08]">
        <div className="border-b border-[#3C1810] px-5 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#BA1323]">New Post</div>
        </div>
        <form onSubmit={handlePost} className="p-5 space-y-4">
          <textarea
            className={`${inp} resize-none`}
            rows={3}
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="e.g. Cameron just landed at PHX · 11:32am"
            required
          />

          {/* Category pills */}
          <div>
            <div className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#9A8070]">Category</div>
            <div className="flex flex-wrap gap-2">
              {OPS_CATS.map(cat => {
                const c = OPS_CAT_CFG[cat]
                const active = category === cat
                return (
                  <button key={cat} type="button" onClick={() => setCategory(cat)}
                    className="rounded px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all"
                    style={{ color: active ? '#140a06' : c.color, background: active ? c.color : `${c.color}18`, border: `1px solid ${active ? c.color : `${c.color}40`}` }}>
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pin + expire */}
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => setPinned(p => !p)}
              className={`flex items-center gap-2 rounded border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                pinned ? 'border-[#C4952A] bg-[#C4952A]/15 text-[#C4952A]' : 'border-[#3C1810] bg-[#140a06] text-[#5C3820] hover:text-[#9A8070]'
              }`}>
              <Pin size={12} />
              {pinned ? 'Pinned to top' : 'Pin to top'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#9A8070]">Expires:</span>
              <div className="flex gap-1">
                {EXPIRE_OPTS.map(opt => (
                  <button key={opt.label} type="button" onClick={() => setExpire(opt.value)}
                    className={`rounded px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      expireMinutes === opt.value
                        ? 'border border-[#BA1323]/40 bg-[#BA1323]/20 text-[#BA1323]'
                        : 'border border-[#3C1810] text-[#5C3820] hover:text-[#9A8070]'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={posting || !message.trim()}
            className="w-full rounded bg-[#BA1323] py-3 text-sm font-black uppercase tracking-wider text-[#140a06] hover:bg-[#79b8ff] disabled:opacity-40 transition-colors">
            {posting ? 'Posting…' : 'Post to War Room'}
          </button>
        </form>
      </div>

      {/* Active feed */}
      <div className="rounded border border-[#3C1810] bg-[#1C0C08]">
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[#BA1323]">Live Feed</div>
          <div className="font-mono text-[10px] text-[#5C3820]">{activeFeed.length} active</div>
        </div>
        {activeFeed.length === 0
          ? <div className="py-10 text-center text-[11px] uppercase tracking-widest text-[#5C3820]">No active messages</div>
          : (
            <div className="divide-y divide-[#281408]">
              {activeFeed.map(entry => {
                const c = OPS_CAT_CFG[entry.category] || OPS_CAT_CFG.INFO
                const exp = expiresIn(entry.expires_at)
                return (
                  <div key={entry.id} className={`flex items-start gap-3 px-5 py-4 ${entry.pinned ? 'bg-[#C4952A]/5' : ''}`}>
                    <div className="mt-0.5 shrink-0 rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                      style={{ color: c.color, background: `${c.color}20` }}>
                      {entry.category}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold leading-snug text-[#F2E4D0]">{entry.message}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3">
                        <span className="font-mono text-[10px] text-[#5C3820]">{relativeTime(entry.created_at)}</span>
                        {entry.pinned && <span className="text-[10px] font-bold text-[#C4952A]">📌 Pinned</span>}
                        {exp && <span className={`text-[10px] ${exp === 'expired' ? 'text-[#E83025]' : 'text-[#5C3820]'}`}>{exp}</span>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button type="button" onClick={() => handlePin(entry)}
                        className={`p-1.5 transition-colors ${entry.pinned ? 'text-[#C4952A]' : 'text-[#5C3820] hover:text-[#C4952A]'}`}>
                        {entry.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                      </button>
                      <button type="button" onClick={() => { if (window.confirm('Delete?')) remove(entry.id) }}
                        className="p-1.5 text-[#5C3820] hover:text-[#E83025] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        }
      </div>

      {/* Expired */}
      {expiredFeed.length > 0 && (
        <div className="mt-4 rounded border border-[#281408] bg-[#140a06] px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-[#5C3820]">
              {expiredFeed.length} expired {expiredFeed.length === 1 ? 'entry' : 'entries'}
            </div>
            <button type="button"
              onClick={async () => { if (window.confirm('Delete all expired?')) for (const e of expiredFeed) await remove(e.id) }}
              className="text-[10px] font-bold uppercase tracking-wider text-[#5C3820] hover:text-[#E83025]">
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── SIDEBAR NAV ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'settings',  label: 'Trip Settings', icon: Settings    },
  { id: 'roster',    label: 'Roster',        icon: Users       },
  { id: 'budget',    label: 'Budget',        icon: DollarSign  },
  { id: 'itinerary', label: 'Itinerary',     icon: Calendar    },
  { id: 'meals',     label: 'Meals',         icon: Utensils    },
  { id: 'logistics', label: 'Logistics',     icon: ClipboardList },
  { id: 'opsfeed',   label: 'Ops Feed',      icon: Radio       },
  { id: 'warroom',   label: 'War Room',      icon: Monitor     },
]

const SECTIONS = {
  settings:  <TripSettings />,
  roster:    <AdminRoster />,
  budget:    <AdminBudget />,
  itinerary: <AdminItinerary />,
  meals:     <AdminMeals />,
  logistics: <AdminLogistics />,
  opsfeed:   <AdminOpsFeed />,
  warroom:   <WarRoomControls />,
}

function Dashboard({ onLogout }) {
  const [active, setActive] = useState('settings')

  return (
    <div className="flex h-screen overflow-hidden bg-[#100805] text-[#F2E4D0]">
      {/* Sidebar */}
      <div className="flex w-56 shrink-0 flex-col border-r border-[#3C1810] bg-[#140a06]">
        <div className="border-b border-[#3C1810] px-5 py-4">
          <div className="text-[9px] font-black uppercase tracking-[0.35em] text-[#BA1323]">Phoenix Operation</div>
          <div className="text-sm font-black uppercase tracking-[0.06em] text-[#FAF0E8]">Admin Dashboard</div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActive(id)}
              className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-[11px] font-black uppercase tracking-wider transition-colors ${
                active === id
                  ? 'border-l-2 border-[#BA1323] bg-[#BA1323]/10 text-[#BA1323]'
                  : 'text-[#5C3820] hover:bg-[#281408] hover:text-[#9A8070]'
              }`}>
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        <div className="border-t border-[#3C1810] p-4 flex flex-col gap-2">
          <a href="/command" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#5C3820] hover:text-[#9A8070] transition-colors">
            <Monitor size={12} />Open War Room ↗
          </a>
          <button onClick={onLogout}
            className="flex w-full items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#5C3820] hover:text-[#E83025] transition-colors">
            <LogOut size={12} />Logout
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-8">
        {SECTIONS[active]}
      </div>
    </div>
  )
}

// ─── PASSWORD GATE ────────────────────────────────────────────────────────────
function PasswordGate({ onAuth }) {
  const [val, setVal] = useState('')
  const [err, setErr] = useState(false)

  function submit(e) {
    e.preventDefault()
    if (val === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, '1')
      onAuth()
    } else {
      setErr(true)
      setVal('')
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#100805]">
      <div className="w-full max-w-sm rounded border border-[#3C1810] bg-[#1C0C08] p-8">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] text-[#BA1323]">Phoenix Operation</div>
        <div className="mb-6 text-2xl font-black uppercase tracking-[0.08em] text-[#FAF0E8]">Admin Access</div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <input type="password" className={inp} placeholder="Password" value={val} autoFocus
            onChange={e => { setVal(e.target.value); setErr(false) }} />
          {err && <div className="text-[11px] font-bold text-[#E83025]">Incorrect password</div>}
          <button type="submit" className={btnPrimary}>Enter</button>
        </form>
      </div>
    </div>
  )
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(STORAGE_KEY) === '1')

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setAuthed(false)
  }

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />
  return <Dashboard onLogout={logout} />
}
