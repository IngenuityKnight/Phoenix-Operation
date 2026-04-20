import { useState } from 'react'
import { Clock, Edit2, MapPin, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const DAYS = [
  { date: '2026-05-28', label: 'Thu 5/28', title: 'Night Out in Old Town' },
  { date: '2026-05-29', label: 'Fri 5/29', title: 'Golf · Casino' },
  { date: '2026-05-30', label: 'Sat 5/30', title: 'Breweries · Final Night' },
]

const CATEGORIES = ['pool', 'nightlife', 'golf', 'food', 'transport', 'activity', 'other']

const CATEGORY_COLORS = {
  pool: 'text-[#D4601A] bg-[#D4601A]/10 border-[#D4601A]/30',
  nightlife: 'text-[#BA1323] bg-[#BA1323]/10 border-[#BA1323]/30',
  golf: 'text-[#48B040] bg-[#48B040]/10 border-[#48B040]/30',
  food: 'text-[#C4952A] bg-[#C4952A]/10 border-[#C4952A]/30',
  transport: 'text-[#9A8070] bg-[#9A8070]/10 border-[#9A8070]/30',
  activity: 'text-[#E83025] bg-[#E83025]/10 border-[#E83025]/30',
  other: 'text-[#5C3820] bg-[#5C3820]/10 border-[#5C3820]/30',
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

const inputCls = 'rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#BA1323] focus:outline-none'
const selectCls = 'rounded border border-[#3C1810] bg-[#140a06] px-3 py-2 text-sm text-[#F2E4D0] focus:border-[#BA1323] focus:outline-none'

function FormField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">{label}</label>
      {children}
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded border border-[#3C1810] bg-[#1C0C08] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#BA1323]">{title}</span>
          <button type="button" onClick={onClose} className="text-[#9A8070] hover:text-[#F2E4D0]"><X size={16} /></button>
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
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#9A8070] hover:text-[#F2E4D0]">Cancel</button>
        <button type="submit" disabled={saving} className="rounded bg-[#BA1323] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#FAF0E8] hover:bg-[#D4152A] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function ItineraryItem({ item, onEdit, onDelete }) {
  const colorCls = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
  return (
    <div className="group flex gap-3 rounded border border-[#281408] bg-[#140a06] p-3 hover:border-[#3C1810]">
      <div className="mt-0.5 flex w-12 shrink-0 flex-col items-center">
        {item.start_time && (
          <span className="font-mono text-[10px] font-bold text-[#9A8070]">
            {item.start_time.slice(0, 5)}
          </span>
        )}
        {item.end_time && (
          <span className="font-mono text-[9px] text-[#5C3820]">
            {item.end_time.slice(0, 5)}
          </span>
        )}
        {!item.start_time && <Clock size={12} className="text-[#5C3820]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${colorCls}`}>
            {item.category}
          </span>
          <span className="font-semibold text-sm text-[#F2E4D0] truncate">{item.title}</span>
        </div>
        {item.location_name && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#9A8070]">
            <MapPin size={9} />
            {item.location_name}
          </div>
        )}
        {item.notes && (
          <div className="mt-1 text-[10px] text-[#5C3820] italic">{item.notes}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
        <button type="button" onClick={onEdit} className="text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={12} /></button>
        <button type="button" onClick={onDelete} className="text-[#5C3820] hover:text-[#E83025]"><Trash2 size={12} /></button>
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
      <div className="border-b border-[#3C1810] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8070]">Itinerary</div>
            <div className="mt-0.5 text-lg font-bold text-[#F2E4D0]">May 28–30 · Scottsdale</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#3C1810] bg-[#1C0C08] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#BA1323] hover:border-[#BA1323] hover:bg-[#2A0E09]"
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
            <span className="text-[11px] uppercase tracking-widest text-[#9A8070]">Loading…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 divide-y divide-[#281408] lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {DAYS.map((day) => {
              const dayItems = items
                .filter((i) => i.day_date === day.date)
                .sort((a, b) => (a.start_time || '99:99').localeCompare(b.start_time || '99:99'))

              return (
                <div key={day.date} className="flex flex-col">
                  <div className="flex items-center justify-between border-b border-[#281408] px-4 py-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#BA1323]">{day.label}</div>
                      <div className="text-xs text-[#9A8070]">{day.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date } })}
                      className="flex h-6 w-6 items-center justify-center rounded text-[#5C3820] hover:bg-[#2A0E09] hover:text-[#BA1323]"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 overflow-auto p-4">
                    {dayItems.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date } })}
                        className="flex flex-col items-center gap-2 rounded border border-dashed border-[#281408] py-8 text-center text-[#5C3820] hover:border-[#3C1810] hover:text-[#9A8070]"
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
                          onDelete={() => { if (window.confirm('Delete this item?')) remove(item.id) }}
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
