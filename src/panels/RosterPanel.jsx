import { useState } from 'react'
import { Edit2, Plus, Trash2, Users, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const STATUS_OPTIONS = ['Confirmed', 'Maybe', 'Ghosting']
const STATUS_COLORS = {
  Confirmed: 'text-[#3FB950] bg-[#3FB950]/10 border-[#3FB950]/30',
  Maybe:     'text-[#D29922] bg-[#D29922]/10 border-[#D29922]/30',
  Ghosting:  'text-[#F85149] bg-[#F85149]/10 border-[#F85149]/30',
}
const STATUS_DOT = {
  Confirmed: 'bg-[#3FB950]',
  Maybe:     'bg-[#D29922]',
  Ghosting:  'bg-[#F85149]',
}

const ARRIVAL_WINDOWS = [
  'Wed morning (5/28)',
  'Wed afternoon (5/28)',
  'Wed evening (5/28)',
  'Wed night (5/28)',
  'Thu morning (5/29)',
  'Thu afternoon (5/29)',
  'Thu evening (5/29)',
  'Driving — flexible',
  'TBD',
]

const EMPTY_FORM = {
  name: '',
  status: 'Confirmed',
  arrival_window: 'TBD',
  venmo_handle: '',
  phone: '',
  dietary_notes: '',
  notes: '',
}

const inputCls = 'rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-[#C9D1D9] placeholder-[#4B5563] focus:border-[#58A6FF] focus:outline-none'
const selectCls = 'rounded border border-[#30363D] bg-[#0d1117] px-3 py-2 text-sm text-[#C9D1D9] focus:border-[#58A6FF] focus:outline-none'

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#8B949E]">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded border border-[#30363D] bg-[#161b22] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#30363D] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">{title}</span>
          <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-[#C9D1D9]"><X size={16} /></button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function RosterForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
      <FormField label="Name">
        <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Full name" required />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Status">
          <select className={selectCls} value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </FormField>
        <FormField label="Arrival Window">
          <select className={selectCls} value={form.arrival_window} onChange={(e) => set('arrival_window', e.target.value)}>
            {ARRIVAL_WINDOWS.map((w) => <option key={w}>{w}</option>)}
          </select>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Phone">
          <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(555) 000-0000" />
        </FormField>
        <FormField label="Venmo Handle">
          <input className={inputCls} value={form.venmo_handle} onChange={(e) => set('venmo_handle', e.target.value)} placeholder="@username" />
        </FormField>
      </div>
      <FormField label="Dietary Restrictions">
        <input className={inputCls} value={form.dietary_notes} onChange={(e) => set('dietary_notes', e.target.value)} placeholder="Allergies, restrictions, preferences…" />
      </FormField>
      <FormField label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Room assignment, anything else…" />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#8B949E] hover:text-[#C9D1D9]">Cancel</button>
        <button type="submit" disabled={saving} className="rounded bg-[#58A6FF] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0d1117] hover:bg-[#79b8ff] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function RosterCard({ person, onEdit, onDelete }) {
  const colorCls = STATUS_COLORS[person.status] || STATUS_COLORS.Maybe
  const dotCls = STATUS_DOT[person.status] || 'bg-[#8B949E]'
  return (
    <div className="group rounded border border-[#21262d] bg-[#0d1117] p-3 hover:border-[#30363D]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotCls}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#C9D1D9]">{person.name}</span>
              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${colorCls}`}>
                {person.status}
              </span>
            </div>
            {person.arrival_window && person.arrival_window !== 'TBD' && (
              <div className="mt-0.5 text-[10px] text-[#8B949E]">{person.arrival_window}</div>
            )}
            <div className="mt-1 flex flex-wrap gap-3">
              {person.phone && (
                <a href={`tel:${person.phone}`} className="text-[10px] text-[#58A6FF] hover:underline">{person.phone}</a>
              )}
              {person.venmo_handle && (
                <span className="text-[10px] text-[#8B949E]">Venmo: <span className="text-[#C9D1D9]">{person.venmo_handle}</span></span>
              )}
            </div>
            {person.dietary_notes && (
              <div className="mt-1 text-[10px] italic text-[#D29922]">{person.dietary_notes}</div>
            )}
            {person.notes && (
              <div className="mt-0.5 text-[10px] text-[#4B5563]">{person.notes}</div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          <button type="button" onClick={onEdit} className="p-1 text-[#4B5563] hover:text-[#58A6FF]"><Edit2 size={12} /></button>
          <button type="button" onClick={onDelete} className="p-1 text-[#4B5563] hover:text-[#F85149]"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  )
}

export default function RosterPanel() {
  const { rows: roster, loading, insert, update, remove } = useSupabaseTable('roster', { orderBy: 'name' })
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(form) {
    setSaving(true)
    if (modal?.mode === 'edit') await update(modal.row.id, form)
    else await insert(form)
    setSaving(false)
    setModal(null)
  }

  const confirmed = roster.filter((p) => p.status === 'Confirmed').length
  const maybe = roster.filter((p) => p.status === 'Maybe').length
  const ghosting = roster.filter((p) => p.status === 'Ghosting').length

  // Group by arrival window for the Arrivals tab
  const arrivalGroups = ARRIVAL_WINDOWS.reduce((acc, w) => {
    const group = roster.filter((p) => p.arrival_window === w && p.status !== 'Ghosting')
    if (group.length > 0) acc[w] = group
    return acc
  }, {})

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#30363D] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Headcount / RSVP</div>
            <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">Guest Roster · May 28–31</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#30363D] bg-[#161b22] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF] hover:bg-[#1f2a34]"
          >
            <Plus size={14} /> Add Person
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#3FB950]">{confirmed}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Confirmed</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#D29922]">{maybe}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Maybe</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#F85149]">{ghosting}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Ghosting</div>
          </div>
          <div className="h-8 w-px self-center bg-[#21262d]" />
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C9D1D9]">{roster.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Total Added</div>
          </div>
        </div>

        {/* Confirmation bar */}
        {roster.length > 0 && (
          <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-[#21262d]">
            <div className="h-full bg-[#3FB950]" style={{ width: `${(confirmed / roster.length) * 100}%` }} />
            <div className="h-full bg-[#D29922]" style={{ width: `${(maybe / roster.length) * 100}%` }} />
            <div className="h-full bg-[#F85149]" style={{ width: `${(ghosting / roster.length) * 100}%` }} />
          </div>
        )}
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#8B949E]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : roster.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[#4B5563]">
            <Users size={32} strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest">No one added yet</span>
            <button type="button" onClick={() => setModal({ mode: 'add' })} className="text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] hover:text-[#79b8ff]">
              Add the first person
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* By arrival wave */}
            {Object.entries(arrivalGroups).map(([window, people]) => (
              <div key={window} className="flex flex-col gap-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#4B5563]">{window}</div>
                {people.map((p) => (
                  <RosterCard key={p.id} person={p} onEdit={() => setModal({ mode: 'edit', row: p })} onDelete={() => { if (window.confirm?.('Remove this person?')) remove(p.id) }} />
                ))}
              </div>
            ))}

            {/* TBD / no window */}
            {(() => {
              const noWindow = roster.filter((p) => (!p.arrival_window || p.arrival_window === 'TBD') && p.status !== 'Ghosting')
              if (noWindow.length === 0) return null
              return (
                <div className="flex flex-col gap-2">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#4B5563]">Arrival TBD</div>
                  {noWindow.map((p) => (
                    <RosterCard key={p.id} person={p} onEdit={() => setModal({ mode: 'edit', row: p })} onDelete={() => { if (window.confirm?.('Remove this person?')) remove(p.id) }} />
                  ))}
                </div>
              )
            })()}

            {/* Ghosting section */}
            {ghosting > 0 && (
              <div className="flex flex-col gap-2">
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#F85149]/50">Ghosting</div>
                {roster.filter((p) => p.status === 'Ghosting').map((p) => (
                  <RosterCard key={p.id} person={p} onEdit={() => setModal({ mode: 'edit', row: p })} onDelete={() => { if (window.confirm?.('Remove this person?')) remove(p.id) }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit Person' : 'Add Person'} onClose={() => setModal(null)}>
          <RosterForm
            initial={modal.mode === 'edit' ? modal.row : EMPTY_FORM}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
