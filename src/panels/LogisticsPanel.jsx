import { useState } from 'react'
import { CheckSquare, Edit2, Plus, Square, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const CATEGORIES = ['groceries', 'supplies', 'transport', 'activities', 'other']

const CATEGORY_COLORS = {
  groceries: 'text-[#48B040] bg-[#48B040]/10 border-[#48B040]/30',
  supplies: 'text-[#BA1323] bg-[#BA1323]/10 border-[#BA1323]/30',
  transport: 'text-[#C4952A] bg-[#C4952A]/10 border-[#C4952A]/30',
  activities: 'text-[#C4952A] bg-[#C4952A]/10 border-[#C4952A]/30',
  other: 'text-[#9A8070] bg-[#9A8070]/10 border-[#9A8070]/30',
}

const HEADCOUNT = 14

const EMPTY_FORM = {
  category: 'other',
  title: '',
  assignee: '',
  notes: '',
  cost: '',
  done: false,
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
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

function ItemForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
      <FormField label="Category">
        <select className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} className="capitalize">{c}</option>)}
        </select>
      </FormField>
      <FormField label="Task">
        <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What needs to happen?" required />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Est. Cost ($)">
          <input type="number" className={inputCls} value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="0" min={0} />
        </FormField>
        <FormField label="Assigned To">
          <input className={inputCls} value={form.assignee} onChange={(e) => set('assignee', e.target.value)} placeholder="Who's on it?" />
        </FormField>
      </div>
      <FormField label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Details, links, quantities…" />
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

function LogisticsItem({ item, onToggle, onEdit, onDelete }) {
  const colorCls = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
  return (
    <div className={`group flex items-center gap-3 rounded border p-3 transition-colors ${item.done ? 'border-[#281408] bg-[#140a06] opacity-50' : 'border-[#281408] bg-[#140a06] hover:border-[#3C1810]'}`}>
      <button type="button" onClick={onToggle} className="shrink-0 text-[#5C3820] hover:text-[#48B040]">
        {item.done ? <CheckSquare size={16} className="text-[#48B040]" /> : <Square size={16} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${colorCls}`}>
            {item.category}
          </span>
          <span className={`text-sm font-semibold truncate ${item.done ? 'line-through text-[#5C3820]' : 'text-[#F2E4D0]'}`}>
            {item.title}
          </span>
        </div>
        {(item.assignee || item.notes || item.cost > 0) && (
          <div className="mt-0.5 flex items-center gap-3 flex-wrap">
            {item.assignee && <span className="text-[10px] text-[#9A8070]">{item.assignee}</span>}
            {Number(item.cost) > 0 && <span className="font-mono text-[10px] text-[#C4952A]">${Number(item.cost).toLocaleString()}</span>}
            {item.notes && <span className="text-[10px] text-[#5C3820] italic truncate">{item.notes}</span>}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
        <button type="button" onClick={onEdit} className="text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={12} /></button>
        <button type="button" onClick={onDelete} className="text-[#5C3820] hover:text-[#E83025]"><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

export default function LogisticsPanel() {
  const { rows: items, loading, insert, update, remove } = useSupabaseTable('logistics', { orderBy: 'created_at' })
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleSave(form) {
    setSaving(true)
    const payload = { ...form, cost: form.cost !== '' ? Number(form.cost) : null }
    if (modal?.mode === 'edit') await update(modal.row.id, payload)
    else await insert(payload)
    setSaving(false)
    setModal(null)
  }

  async function handleToggle(item) {
    await update(item.id, { done: !item.done })
  }

  const done = items.filter((i) => i.done).length
  const total = items.length
  const totalCost = items.reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
  const perPerson = totalCost / HEADCOUNT

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      <div className="border-b border-[#3C1810] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8070]">Logistics Checklist</div>
            <div className="mt-0.5 text-lg font-bold text-[#F2E4D0]">May 28–31 · Scottsdale</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#3C1810] bg-[#1C0C08] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#BA1323] hover:border-[#BA1323] hover:bg-[#251508]"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#48B040]">{done}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Done</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#F2E4D0]">{total - done}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Remaining</div>
          </div>
          {totalCost > 0 && (
            <>
              <div className="h-8 w-px self-center bg-[#281408]" />
              <div className="text-center">
                <div className="font-mono text-xl font-black text-[#C4952A]">${totalCost.toLocaleString()}</div>
                <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Est. Total</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-xl font-black text-[#C4952A]">${Math.ceil(perPerson)}</div>
                <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Per Person</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="text-[11px] uppercase tracking-widest text-[#9A8070]">Loading…</span>
          </div>
        ) : (
          <>
            {totalCost > 0 && (
              <div className="mb-6 rounded border border-[#3C1810] bg-[#180C07] p-4">
                <div className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">Cost Breakdown · ${Math.ceil(perPerson)}/person</div>
                <div className="flex flex-wrap gap-4">
                  {CATEGORIES.map((cat) => {
                    const catCost = items.filter((i) => i.category === cat).reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
                    if (!catCost) return null
                    return (
                      <div key={cat} className="text-center">
                        <div className={`font-mono text-base font-black ${CATEGORY_COLORS[cat].split(' ')[0]}`}>${catCost.toLocaleString()}</div>
                        <div className="text-[9px] capitalize text-[#9A8070]">{cat}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat)
              if (catItems.length === 0) return null
              return (
                <div key={cat} className="flex flex-col gap-2">
                  <div className={`flex items-center gap-2 rounded border px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${CATEGORY_COLORS[cat]}`}>
                    {cat}
                    <span className="ml-auto font-mono">{catItems.filter((i) => i.done).length}/{catItems.length}</span>
                  </div>
                  {catItems.map((item) => (
                    <LogisticsItem
                      key={item.id}
                      item={item}
                      onToggle={() => handleToggle(item)}
                      onEdit={() => setModal({ mode: 'edit', row: item })}
                      onDelete={() => { if (window.confirm('Delete this task?')) remove(item.id) }}
                    />
                  ))}
                </div>
              )
            })}
            {items.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-3 py-16 text-[#5C3820]">
                <span className="text-[11px] uppercase tracking-widest">No tasks yet</span>
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'add' })}
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#BA1323] hover:text-[#79b8ff]"
                >
                  <Plus size={13} /> Add the first task
                </button>
              </div>
            )}
          </div>
          </>
        )}
      </div>

      {modal && (
        <Modal title={modal?.mode === 'edit' ? 'Edit Task' : 'Add Task'} onClose={() => setModal(null)}>
          <ItemForm
            initial={modal?.mode === 'edit' ? modal.row : EMPTY_FORM}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
