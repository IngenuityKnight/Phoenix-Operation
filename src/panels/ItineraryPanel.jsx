import { useState } from 'react'
import { Clock, Edit2, MapPin, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const DAYS = [
  { date: '2026-05-28', label: 'Wed 5/28', title: 'Arrivals Day' },
  { date: '2026-05-29', label: 'Thu 5/29', title: 'Pool Day' },
  { date: '2026-05-30', label: 'Fri 5/30', title: 'Golf / Nightlife' },
  { date: '2026-05-31', label: 'Sat 5/31', title: 'Last Night' },
]

const CATEGORIES = ['pool', 'nightlife', 'golf', 'food', 'transport', 'activity', 'other']

const CATEGORY_COLORS = {
  pool: 'text-[#58A6FF] bg-[#58A6FF]/10 border-[#58A6FF]/30',
  nightlife: 'text-[#A371F7] bg-[#A371F7]/10 border-[#A371F7]/30',
  golf: 'text-[#3FB950] bg-[#3FB950]/10 border-[#3FB950]/30',
  food: 'text-[#D29922] bg-[#D29922]/10 border-[#D29922]/30',
  transport: 'text-[#8B949E] bg-[#8B949E]/10 border-[#8B949E]/30',
  activity: 'text-[#F85149] bg-[#F85149]/10 border-[#F85149]/30',
  other: 'text-[#4B5563] bg-[#4B5563]/10 border-[#4B5563]/30',
}

const EMPTY_FORM = {
  day_date: '',
  start_time: '',
  end_time: '',
  title: '',
  category: 'other',
  location_name: '',
  address: '',
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
      <div className="w-full max-w-lg rounded border border-[#30363D] bg-[#161b22] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#30363D] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">{title}</span>
          <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-[#C9D1D9]"><X size={16} /></button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function ItemForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Day">
          <select className={selectCls} value={form.day_date} onChange={(e) => set('day_date', e.target.value)} required>
            <option value="">Select day…</option>
            {DAYS.map((d) => <option key={d.date} value={d.date}>{d.label}</option>)}
          </select>
        </FormField>
        <FormField label="Category">
          <select className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} className="capitalize">{c}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Title">
        <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What's happening?" required />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Start Time">
          <input type="time" className={inputCls} value={form.start_time} onChange={(e) => set('start_time', e.target.value)} />
        </FormField>
        <FormField label="End Time">
          <input type="time" className={inputCls} value={form.end_time} onChange={(e) => set('end_time', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Location">
        <input className={inputCls} value={form.location_name} onChange={(e) => set('location_name', e.target.value)} placeholder="Venue or place name" />
      </FormField>
      <FormField label="Address">
        <input className={inputCls} value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address (optional)" />
      </FormField>
      <FormField label="Notes">
        <textarea
          className={`${inputCls} resize-none`}
          rows={3}
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder="Reservations, headcount, dress code…"
        />
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

function ItineraryItem({ item, onEdit, onDelete }) {
  const colorCls = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
  return (
    <div className="group flex gap-3 rounded border border-[#21262d] bg-[#0d1117] p-3 hover:border-[#30363D]">
      <div className="mt-0.5 flex w-12 shrink-0 flex-col items-center">
        {item.start_time && (
          <span className="font-mono text-[10px] font-bold text-[#8B949E]">
            {item.start_time.slice(0, 5)}
          </span>
        )}
        {item.end_time && (
          <span className="font-mono text-[9px] text-[#4B5563]">
            {item.end_time.slice(0, 5)}
          </span>
        )}
        {!item.start_time && <Clock size={12} className="text-[#4B5563]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${colorCls}`}>
            {item.category}
          </span>
          <span className="font-semibold text-sm text-[#C9D1D9] truncate">{item.title}</span>
        </div>
        {item.location_name && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8B949E]">
            <MapPin size={9} />
            {item.location_name}
          </div>
        )}
        {item.notes && (
          <div className="mt-1 text-[10px] text-[#4B5563] italic">{item.notes}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onClick={onEdit} className="text-[#4B5563] hover:text-[#58A6FF]"><Edit2 size={12} /></button>
        <button type="button" onClick={onDelete} className="text-[#4B5563] hover:text-[#F85149]"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

export default function ItineraryPanel() {
  const { rows: items, loading, insert, update, remove } = useSupabaseTable('itinerary_items', { orderBy: 'start_time' })
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(form) {
    setSaving(true)
    if (modal?.mode === 'edit') await update(modal.row.id, form)
    else await insert(form)
    setSaving(false)
    setModal(null)
  }

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      <div className="border-b border-[#30363D] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Itinerary</div>
            <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">May 28–31 · Scottsdale</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#30363D] bg-[#161b22] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF] hover:bg-[#1f2a34]"
          >
            <Plus size={14} /> Add Item
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <span key={c} className={`rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${CATEGORY_COLORS[c]}`}>
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="md:flex-1 md:overflow-auto">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="text-[11px] uppercase tracking-widest text-[#8B949E]">Loading…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-[#21262d] lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            {DAYS.map((day) => {
              const dayItems = items
                .filter((i) => i.day_date === day.date)
                .sort((a, b) => (a.start_time || '99:99').localeCompare(b.start_time || '99:99'))

              return (
                <div key={day.date} className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#21262d] px-4 py-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">{day.label}</div>
                      <div className="text-xs text-[#8B949E]">{day.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date } })}
                      className="flex h-6 w-6 items-center justify-center rounded text-[#4B5563] hover:bg-[#1f2935] hover:text-[#58A6FF]"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 overflow-auto p-4">
                    {dayItems.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date } })}
                        className="flex flex-col items-center gap-2 rounded border border-dashed border-[#21262d] py-8 text-center text-[#4B5563] hover:border-[#30363D] hover:text-[#8B949E]"
                      >
                        <Plus size={16} />
                        <span className="text-[10px] uppercase tracking-widest">Add items</span>
                      </button>
                    ) : (
                      dayItems.map((item) => (
                        <ItineraryItem
                          key={item.id}
                          item={item}
                          onEdit={() => setModal({ mode: 'edit', row: item })}
                          onDelete={() => remove(item.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal?.mode === 'edit' ? 'Edit Item' : 'Add Itinerary Item'} onClose={() => setModal(null)}>
          <ItemForm
            initial={modal?.mode === 'edit' ? modal.row : { ...EMPTY_FORM, ...modal?.defaults }}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
