import { useState } from 'react'
import { Car, Edit2, Plane, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const TRANSPORT_OPTIONS = ['flight', 'drive', 'rideshare', 'TBD']
const STATUS_OPTIONS = ['TBD', 'Confirmed', 'En Route', 'Arrived']

const STATUS_COLORS = {
  TBD: 'text-[#8B949E] bg-[#8B949E]/10',
  Confirmed: 'text-[#58A6FF] bg-[#58A6FF]/10',
  'En Route': 'text-[#D29922] bg-[#D29922]/10',
  Arrived: 'text-[#3FB950] bg-[#3FB950]/10',
}

const EMPTY_FORM = {
  name: '',
  transport: 'flight',
  origin_airport: '',
  arrival_date: '',
  arrival_time: '',
  flight_number: '',
  pickup_needed: false,
  pickup_notes: '',
  status: 'TBD',
  notes: '',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded border border-[#30363D] bg-[#161b22] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#30363D] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">{title}</span>
          <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-[#C9D1D9]">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8B949E]">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-[#C9D1D9] placeholder-[#4B5563] focus:border-[#58A6FF] focus:outline-none'
const selectCls =
  'rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-[#C9D1D9] focus:border-[#58A6FF] focus:outline-none'

function ArrivalForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSave(form)
      }}
      className="flex flex-col gap-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Name">
          <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" required />
        </FormField>
        <FormField label="Status">
          <select className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Transport">
          <select className={selectCls} value={form.transport} onChange={(e) => set('transport', e.target.value)}>
            {TRANSPORT_OPTIONS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </FormField>
        <FormField label="Origin Airport">
          <input className={inputCls} value={form.origin_airport} onChange={(e) => set('origin_airport', e.target.value.toUpperCase())} placeholder="e.g. ORD, JFK, ATL" maxLength={3} />
        </FormField>
      </div>
      <FormField label="Flight #">
        <input className={inputCls} value={form.flight_number} onChange={(e) => set('flight_number', e.target.value)} placeholder="e.g. WN 1565" />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Arrival Date">
          <input type="date" className={inputCls} value={form.arrival_date} onChange={(e) => set('arrival_date', e.target.value)} />
        </FormField>
        <FormField label="Arrival Time">
          <input type="time" className={inputCls} value={form.arrival_time} onChange={(e) => set('arrival_time', e.target.value)} />
        </FormField>
      </div>
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="pickup"
          checked={form.pickup_needed}
          onChange={(e) => set('pickup_needed', e.target.checked)}
          className="h-4 w-4 accent-[#58A6FF]"
        />
        <label htmlFor="pickup" className="text-[11px] font-semibold uppercase tracking-widest text-[#8B949E]">
          Needs airport pickup
        </label>
      </div>
      {form.pickup_needed && (
        <FormField label="Pickup Notes">
          <input className={inputCls} value={form.pickup_notes} onChange={(e) => set('pickup_notes', e.target.value)} placeholder="Terminal, time, who's picking up…" />
        </FormField>
      )}
      <FormField label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Anything else…" />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#8B949E] hover:text-[#C9D1D9]">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-[#58A6FF] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0d1117] hover:bg-[#79b8ff] disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function ArrivalsPanel() {
  const { rows: arrivals, loading, insert, update, remove } = useSupabaseTable('arrivals', { orderBy: 'arrival_date', ascending: true })
  const [modal, setModal] = useState(null) // null | { mode: 'add' } | { mode: 'edit', row }
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [checkingInId, setCheckingInId] = useState(null)

  async function handleCheckIn(arrival) {
    if (arrival.status === 'Arrived') return
    setCheckingInId(arrival.id)
    await update(arrival.id, { status: 'Arrived' })
    setCheckingInId(null)
  }

  async function handleSave(form) {
    setSaving(true)
    if (modal?.mode === 'edit') {
      await update(modal.row.id, form)
    } else {
      await insert(form)
    }
    setSaving(false)
    setModal(null)
  }

  async function handleDelete(id) {
    setDeletingId(id)
    await remove(id)
    setDeletingId(null)
  }

  const arrived = arrivals.filter((a) => a.status === 'Arrived').length
  const needsPickup = arrivals.filter((a) => a.pickup_needed && a.status !== 'Arrived').length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#30363D] px-6 py-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Arrivals Tracker</div>
          <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">14 Guys · Scottsdale</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#3FB950]">{arrived}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Arrived</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#D29922]">{needsPickup}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Need Pickup</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C9D1D9]">{arrivals.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Tracked</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#30363D] bg-[#161b22] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF] hover:bg-[#1f2a34]"
          >
            <Plus size={14} />
            Add Guy
          </button>
        </div>
      </div>

      {/* I'm Here Check-In */}
      {!loading && arrivals.length > 0 && (
        <div className="border-b border-[#30363D] px-6 py-4">
          <div className="mb-2 text-[9px] font-black uppercase tracking-[0.2em] text-[#4B5563]">Tap your name when you land</div>
          <div className="flex flex-wrap gap-2">
            {arrivals.map((a) => {
              const isArrived = a.status === 'Arrived'
              const isChecking = checkingInId === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={isArrived || isChecking}
                  onClick={() => handleCheckIn(a)}
                  className={`rounded border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                    isArrived
                      ? 'border-[#3FB950]/40 bg-[#3FB950]/10 text-[#3FB950] cursor-default'
                      : 'border-[#30363D] bg-[#161b22] text-[#8B949E] hover:border-[#58A6FF] hover:text-[#58A6FF]'
                  } disabled:opacity-60`}
                >
                  {isChecking ? '…' : isArrived ? `✓ ${a.name}` : a.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#8B949E]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : arrivals.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-[#4B5563]">
            <span className="text-[11px] uppercase tracking-widest">No arrivals tracked yet</span>
            <button
              type="button"
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] hover:text-[#79b8ff]"
            >
              <Plus size={13} /> Add the first guy
            </button>
          </div>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#21262d]">
                {['Name', 'Status', 'Transport', 'From', 'Arrives', 'Flight #', 'Pickup', 'Notes', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-[0.18em] text-[#8B949E]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {arrivals.map((a) => (
                <tr key={a.id} className="border-b border-[#21262d] hover:bg-[#1f2935]">
                  <td className="px-4 py-3 font-semibold text-[#C9D1D9]">{a.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[a.status] || STATUS_COLORS.TBD}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1.5 text-[#8B949E]">
                      {a.transport === 'flight' ? <Plane size={12} /> : <Car size={12} />}
                      <span className="text-xs capitalize">{a.transport}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#58A6FF] font-bold">{a.origin_airport || '—'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#8B949E]">
                    {a.arrival_date ? `${a.arrival_date}` : '—'}
                    {a.arrival_time ? ` ${a.arrival_time}` : ''}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#8B949E]">{a.flight_number || '—'}</td>
                  <td className="px-4 py-3">
                    {a.pickup_needed ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D29922]">Yes</span>
                    ) : (
                      <span className="text-[10px] text-[#4B5563]">—</span>
                    )}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-xs text-[#8B949E]">{a.notes || a.pickup_notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'edit', row: a })}
                        className="text-[#4B5563] hover:text-[#58A6FF]"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        disabled={deletingId === a.id}
                        className="text-[#4B5563] hover:text-[#F85149] disabled:opacity-40"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal
          title={modal.mode === 'edit' ? 'Edit Arrival' : 'Add Guy'}
          onClose={() => setModal(null)}
        >
          <ArrivalForm
            initial={modal.mode === 'edit' ? modal.row : undefined}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
