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
  TBD: 'text-[#8B949E] bg-[#8B949E]/10',
  cook: 'text-[#3FB950] bg-[#3FB950]/10',
  restaurant: 'text-[#58A6FF] bg-[#58A6FF]/10',
  delivery: 'text-[#D29922] bg-[#D29922]/10',
  catered: 'text-[#A371F7] bg-[#A371F7]/10',
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
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#8B949E] hover:text-[#C9D1D9]">Cancel</button>
        <button type="submit" disabled={saving} className="rounded bg-[#58A6FF] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0d1117] hover:bg-[#79b8ff] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

function MealCard({ meal, onEdit, onDelete }) {
  return (
    <div className="rounded border border-[#30363D] bg-[#0d1117] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${PLAN_COLORS[meal.plan_type] || PLAN_COLORS.TBD}`}>
              {meal.plan_type}
            </span>
            {meal.name && <span className="truncate text-xs font-semibold text-[#C9D1D9]">{meal.name}</span>}
            {!meal.name && <span className="text-xs text-[#4B5563] italic">Unplanned</span>}
          </div>
          {meal.organizer && (
            <div className="mt-1 text-[10px] text-[#8B949E]">Organizer: <span className="text-[#C9D1D9]">{meal.organizer}</span></div>
          )}
          {meal.location_name && (
            <div className="mt-0.5 text-[10px] text-[#8B949E]">{meal.location_name}</div>
          )}
          {(meal.notes || meal.dietary_notes) && (
            <div className="mt-1 text-[10px] text-[#8B949E] italic">{meal.notes || meal.dietary_notes}</div>
          )}
          <div className="mt-1 flex items-center gap-3">
            {meal.headcount && (
              <span className="text-[10px] text-[#8B949E]">{meal.headcount} pax</span>
            )}
            {meal.cost_estimate > 0 && (
              <span className="font-mono text-[10px] text-[#8B949E]">${meal.cost_estimate}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button type="button" onClick={onEdit} className="text-[#4B5563] hover:text-[#58A6FF]"><Edit2 size={12} /></button>
          <button type="button" onClick={onDelete} className="text-[#4B5563] hover:text-[#F85149]"><Trash2 size={12} /></button>
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
    const payload = { ...form, cost_estimate: form.cost_estimate ? Number(form.cost_estimate) : null }
    if (modal?.mode === 'edit') await update(modal.row.id, payload)
    else await insert(payload)
    setSaving(false)
    setModal(null)
  }

  const totalEst = meals.reduce((sum, m) => sum + (Number(m.cost_estimate) || 0), 0)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#30363D] px-6 py-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Meals Coordinator</div>
          <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">May 28–31 · Scottsdale</div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C9D1D9]">{meals.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Planned</div>
          </div>
          {totalEst > 0 && (
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#3FB950]">${totalEst.toLocaleString()}</div>
              <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Est. Total</div>
            </div>
          )}
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#30363D] bg-[#161b22] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF] hover:bg-[#1f2a34]"
          >
            <Plus size={14} /> Add Meal
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#8B949E]">
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
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#58A6FF]">{day.label}</div>
                      <div className="text-xs font-semibold text-[#8B949E]">{day.title}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date } })}
                      className="flex h-6 w-6 items-center justify-center rounded text-[#4B5563] hover:bg-[#1f2935] hover:text-[#58A6FF]"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {MEAL_TYPES.map((type) => (
                    <div key={type} className="flex flex-col gap-1.5">
                      <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#4B5563] flex items-center gap-1.5">
                        <Utensils size={9} />
                        {type}
                      </div>
                      {grouped[type].length === 0 ? (
                        <button
                          type="button"
                          onClick={() => setModal({ mode: 'add', defaults: { day_date: day.date, meal_type: type } })}
                          className="rounded border border-dashed border-[#21262d] px-3 py-2 text-left text-[10px] text-[#4B5563] hover:border-[#30363D] hover:text-[#8B949E]"
                        >
                          + Add {type}
                        </button>
                      ) : (
                        grouped[type].map((meal) => (
                          <MealCard
                            key={meal.id}
                            meal={meal}
                            onEdit={() => setModal({ mode: 'edit', row: meal })}
                            onDelete={() => remove(meal.id)}
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
