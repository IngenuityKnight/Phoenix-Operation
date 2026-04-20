import { useState } from 'react'
import { Edit2, Plus, Trash2, Utensils, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const DAYS = [
  { date: '2026-05-28', label: 'Wed 5/28', title: 'Arrivals Day' },
  { date: '2026-05-29', label: 'Thu 5/29', title: 'Pool Day' },
  { date: '2026-05-30', label: 'Fri 5/30', title: 'Golf / Nightlife' },
  { date: '2026-05-31', label: 'Sat 5/31', title: 'Last Night' },
]
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snacks']
const PLAN_TYPES = ['TBD', 'cook', 'restaurant', 'delivery', 'catered']

const PLAN_COLORS = {
  TBD: 'text-[#9A8070] bg-[#9A8070]/10',
  cook: 'text-[#48B040] bg-[#48B040]/10',
  restaurant: 'text-[#BA1323] bg-[#BA1323]/10',
  delivery: 'text-[#C4952A] bg-[#C4952A]/10',
  catered: 'text-[#C4952A] bg-[#C4952A]/10',
}

const EMPTY_FORM = {
  day_date: '',
  meal_type: 'dinner',
  name: '',
  organizer: '',
  plan_type: 'TBD',
  headcount: 14,
  dietary_notes: '',
  location_name: '',
  cost_estimate: '',
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

function MealForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Day">
          <select className={selectCls} value={form.day_date} onChange={(e) => set('day_date', e.target.value)} required>
            <option value="">Select day…</option>
            {DAYS.map((d) => <option key={d.date} value={d.date}>{d.label} — {d.title}</option>)}
          </select>
        </FormField>
        <FormField label="Meal">
          <select className={selectCls} value={form.meal_type} onChange={(e) => set('meal_type', e.target.value)}>
            {MEAL_TYPES.map((t) => <option key={t} className="capitalize">{t}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Meal / Restaurant Name">
        <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Tacos at Los Sombreros, Backyard BBQ…" />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Plan Type">
          <select className={selectCls} value={form.plan_type} onChange={(e) => set('plan_type', e.target.value)}>
            {PLAN_TYPES.map((t) => <option key={t} className="capitalize">{t}</option>)}
          </select>
        </FormField>
        <FormField label="Organizer">
          <input className={inputCls} value={form.organizer} onChange={(e) => set('organizer', e.target.value)} placeholder="Who's handling this?" />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Headcount">
          <input type="number" className={inputCls} value={form.headcount} onChange={(e) => set('headcount', e.target.value)} min={1} max={50} />
        </FormField>
        <FormField label="Est. Cost ($)">
          <input type="number" className={inputCls} value={form.cost_estimate} onChange={(e) => set('cost_estimate', e.target.value)} placeholder="0" min={0} />
        </FormField>
      </div>
      <FormField label="Location / Address">
        <input className={inputCls} value={form.location_name} onChange={(e) => set('location_name', e.target.value)} placeholder="Restaurant name or address" />
      </FormField>
      <FormField label="Dietary Notes">
        <input className={inputCls} value={form.dietary_notes} onChange={(e) => set('dietary_notes', e.target.value)} placeholder="Allergies, restrictions…" />
      </FormField>
      <FormField label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Reservation needed? Timing?" />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#9A8070] hover:text-[#F2E4D0]">Cancel</button>
        <button type="submit" disabled={saving} className="rounded bg-[#BA1323] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#140a06] hover:bg-[#79b8ff] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function MealCard({ meal, onEdit, onDelete }) {
  return (
    <div className="rounded border border-[#3C1810] bg-[#140a06] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${PLAN_COLORS[meal.plan_type] || PLAN_COLORS.TBD}`}>
              {meal.plan_type}
            </span>
            {meal.name && <span className="truncate text-xs font-semibold text-[#F2E4D0]">{meal.name}</span>}
            {!meal.name && <span className="text-xs text-[#5C3820] italic">Unplanned</span>}
          </div>
          {meal.organizer && (
            <div className="mt-1 text-[10px] text-[#9A8070]">Organizer: <span className="text-[#F2E4D0]">{meal.organizer}</span></div>
          )}
          {meal.location_name && (
            <div className="mt-0.5 text-[10px] text-[#9A8070]">{meal.location_name}</div>
          )}
          {(meal.notes || meal.dietary_notes) && (
            <div className="mt-1 text-[10px] text-[#9A8070] italic">{meal.notes || meal.dietary_notes}</div>
          )}
          <div className="mt-1 flex items-center gap-3">
            {meal.headcount && (
              <span className="text-[10px] text-[#9A8070]">{meal.headcount} pax</span>
            )}
            {Number(meal.cost_estimate) > 0 && (
              <span className="font-mono text-[10px] text-[#9A8070]">${Number(meal.cost_estimate).toLocaleString()}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={onEdit} className="p-1 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={14} /></button>
          <button type="button" onClick={onDelete} className="p-1 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  )
}

export default function MealsPanel() {
  const { rows: meals, loading, insert, update, remove } = useSupabaseTable('meals', { orderBy: 'day_date' })
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(form) {
    setSaving(true)
    const payload = {
      ...form,
      headcount: form.headcount ? Number(form.headcount) : 14,
      cost_estimate: form.cost_estimate ? Number(form.cost_estimate) : null,
    }
    if (modal?.mode === 'edit') await update(modal.row.id, payload)
    else await insert(payload)
    setSaving(false)
    setModal(null)
  }

  const totalEst = meals.reduce((sum, m) => sum + (Number(m.cost_estimate) || 0), 0)

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      <div className="border-b border-[#3C1810] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8070]">Meals Coordinator</div>
            <div className="mt-0.5 text-lg font-bold text-[#F2E4D0]">May 28–31 · Scottsdale</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#3C1810] bg-[#1C0C08] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#BA1323] hover:border-[#BA1323] hover:bg-[#251508]"
          >
            <Plus size={14} /> Add Meal
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#F2E4D0]">{meals.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Planned</div>
          </div>
          {totalEst > 0 && (
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#48B040]">${totalEst.toLocaleString()}</div>
              <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Est. Total</div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#9A8070]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-4">
            {DAYS.map((day) => {
              const dayMeals = meals.filter((m) => m.day_date === day.date)
              const grouped = MEAL_TYPES.reduce((acc, type) => {
                acc[type] = dayMeals.filter((m) => m.meal_type === type)
                return acc
              }, {})

              return (
                <div key={day.date} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#BA1323]">{day.label}</div>
                      <div className="text-xs font-semibold text-[#9A8070]">{day.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date } })}
                      className="flex h-6 w-6 items-center justify-center rounded text-[#5C3820] hover:bg-[#251508] hover:text-[#BA1323]"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {MEAL_TYPES.map((type) => (
                    <div key={type} className="flex flex-col gap-1.5">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#5C3820] flex items-center gap-1.5">
                        <Utensils size={9} />
                        {type}
                      </div>
                      {grouped[type].length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date, meal_type: type } })}
                          className="rounded border border-dashed border-[#281408] px-3 py-2 text-left text-[10px] text-[#5C3820] hover:border-[#3C1810] hover:text-[#9A8070]"
                        >
                          + Add {type}
                        </button>
                      ) : (
                        grouped[type].map((meal) => (
                          <MealCard
                            key={meal.id}
                            meal={meal}
                            onEdit={() => setModal({ mode: 'edit', row: meal })}
                            onDelete={() => { if (window.confirm('Delete this meal?')) remove(meal.id) }}
                          />
                        ))
                      )}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal?.mode === 'edit' ? 'Edit Meal' : 'Add Meal'} onClose={() => setModal(null)}>
          <MealForm
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
