import { useState } from 'react'
import { Car, Edit2, Plane, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const TRANSPORT_OPTIONS = ['flight', 'drive', 'rideshare', 'TBD']
const STATUS_OPTIONS = ['TBD', 'Confirmed', 'En Route', 'Landed', 'Arrived']

const STATUS_COLORS = {
  TBD: 'text-[#9A8070] bg-[#9A8070]/10',
  Confirmed: 'text-[#BA1323] bg-[#BA1323]/10',
  'En Route': 'text-[#C4952A] bg-[#C4952A]/10',
  Landed: 'text-[#C4952A] bg-[#C4952A]/10',
  Arrived: 'text-[#48B040] bg-[#48B040]/10',
}

const EMPTY_FORM = {
  name: '',
  transport: 'flight',
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
      <div className="mx-4 w-full max-w-lg rounded border border-[#3C1810] bg-[#1C0C08] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#BA1323]">{title}</span>
          <button type="button" onClick={onClose} className="text-[#9A8070] hover:text-[#F2E4D0]">
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
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none'
const selectCls =
  'rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] focus:border-[#BA1323] focus:outline-none'

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
        <FormField label="Flight #">
          <input className={inputCls} value={form.flight_number} onChange={(e) => set('flight_number', e.target.value)} placeholder="e.g. WN 1565" />
        </FormField>
      </div>
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
          className="h-4 w-4 accent-[#BA1323]"
        />
        <label htmlFor="pickup" className="text-[11px] font-semibold uppercase tracking-widest text-[#9A8070]">
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
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#9A8070] hover:text-[#F2E4D0]">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-[#BA1323] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#140a06] hover:bg-[#79b8ff] disabled:opacity-50"
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
    if (!window.confirm('Remove this arrival?')) return
    setDeletingId(id)
    await remove(id)
    setDeletingId(null)
  }

  const arrived = arrivals.filter((a) => a.status === 'Arrived').length
  const landed = arrivals.filter((a) => a.status === 'Landed').length
  const needsPickup = arrivals.filter((a) => a.pickup_needed && a.status !== 'Arrived').length

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#3C1810] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8070]">Arrivals Tracker</div>
            <div className="mt-0.5 text-lg font-bold text-[#F2E4D0]">14 Guys · Scottsdale</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#3C1810] bg-[#1C0C08] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#BA1323] hover:border-[#BA1323] hover:bg-[#251508]"
          >
            <Plus size={14} />
            Add Guy
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#48B040]">{arrived}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Arrived</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C4952A]">{needsPickup}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Need Pickup</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C4952A]">{landed}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Landed</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#F2E4D0]">{arrivals.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Tracked</div>
          </div>
        </div>
      </div>

      {/* I'm Here Check-In */}
      {!loading && arrivals.length > 0 && (
        <div className="border-b border-[#3C1810] bg-[#140a06] px-4 py-5 md:px-6">
          <div className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#BA1323]">I'm Here</div>
          <div className="mb-4 text-xs text-[#9A8070]">Tap your name when you land at PHX</div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {arrivals.map((a) => {
              const isArrived = a.status === 'Arrived'
              const isChecking = checkingInId === a.id
              return (
                <button
                  key={a.id}
                  type="button"
                  disabled={isArrived || isChecking}
                  onClick={() => handleCheckIn(a)}
                  className={`rounded border px-3 py-4 text-sm font-bold uppercase tracking-wider transition-colors sm:py-2 ${
                    isArrived
                      ? 'border-[#48B040]/40 bg-[#48B040]/10 text-[#48B040] cursor-default'
                      : 'border-[#3C1810] bg-[#1C0C08] text-[#9A8070] active:border-[#BA1323] active:text-[#BA1323]'
                  } disabled:opacity-60`}
                >
                  {isChecking ? '…' : isArrived ? `✓ ${a.name}` : a.name}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="md:flex-1 md:overflow-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#9A8070]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : arrivals.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 text-[#5C3820]">
            <span className="text-[11px] uppercase tracking-widest">No arrivals tracked yet</span>
            <button
              type="button"
              onClick={() => setModal({ mode: 'add' })}
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#BA1323] hover:text-[#79b8ff]"
            >
              <Plus size={13} /> Add the first guy
            </button>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:hidden">
              {arrivals.map((a) => (
                <div key={a.id} className="rounded border border-[#281408] bg-[#140a06] p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-base text-[#F2E4D0]">{a.name}</div>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[a.status] || STATUS_COLORS.TBD}`}>
                      {a.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-[#9A8070]">
                    {a.transport === 'flight' ? <Plane size={13} /> : <Car size={13} />}
                    <span className="capitalize">{a.transport}</span>
                    {a.flight_number && <span className="font-mono text-[#BA1323]">{a.flight_number}</span>}
                  </div>
                  {(a.arrival_date || a.arrival_time) && (
                    <div className="mt-1 font-mono text-sm text-[#9A8070]">
                      {a.arrival_date || ''}{a.arrival_time ? ` · ${a.arrival_time.slice(0, 5)}` : ''}
                    </div>
                  )}
                  {a.pickup_needed && (
                    <div className="mt-2 text-sm font-bold uppercase tracking-wider text-[#C4952A]">Needs pickup</div>
                  )}
                  {(a.notes || a.pickup_notes) && (
                    <div className="mt-1 text-sm text-[#5C3820] italic">{a.notes || a.pickup_notes}</div>
                  )}
                  <div className="mt-3 flex items-center gap-3">
                    <button type="button" onClick={() => setModal({ mode: 'edit', row: a })} className="flex items-center gap-1.5 text-xs text-[#5C3820] hover:text-[#BA1323]">
                      <Edit2 size={13} /> Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="flex items-center gap-1.5 text-xs text-[#5C3820] hover:text-[#E83025] disabled:opacity-40">
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <table className="hidden w-full border-collapse text-sm md:table">
              <thead>
                <tr className="border-b border-[#281408]">
                  {['Name', 'Status', 'Transport', 'Arrives', 'Flight #', 'Pickup', 'Notes', ''].map((h) => (
                    <th key={h} className="px-4 py-2.5 text-left text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {arrivals.map((a) => (
                  <tr key={a.id} className="border-b border-[#281408] hover:bg-[#251508]">
                    <td className="px-4 py-3 font-semibold text-[#F2E4D0]">{a.name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[a.status] || STATUS_COLORS.TBD}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 text-[#9A8070]">
                        {a.transport === 'flight' ? <Plane size={12} /> : <Car size={12} />}
                        <span className="text-xs capitalize">{a.transport}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9A8070]">
                      {a.arrival_date ? `${a.arrival_date}` : '—'}
                      {a.arrival_time ? ` ${a.arrival_time}` : ''}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#9A8070]">{a.flight_number || '—'}</td>
                    <td className="px-4 py-3">
                      {a.pickup_needed ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4952A]">Yes</span>
                      ) : (
                        <span className="text-[10px] text-[#5C3820]">—</span>
                      )}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-xs text-[#9A8070]">{a.notes || a.pickup_notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setModal({ mode: 'edit', row: a })} className="text-[#5C3820] hover:text-[#BA1323]">
                          <Edit2 size={13} />
                        </button>
                        <button type="button" onClick={() => handleDelete(a.id)} disabled={deletingId === a.id} className="text-[#5C3820] hover:text-[#E83025] disabled:opacity-40">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
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
