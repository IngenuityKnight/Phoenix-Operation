import { useState } from 'react'
import { CheckSquare, Edit2, Plus, Square, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const CATEGORIES = ['groceries', 'supplies', 'transport', 'activities', 'other']

const CATEGORY_COLORS = {
  groceries: 'text-[#3FB950] bg-[#3FB950]/10 border-[#3FB950]/30',
  supplies: 'text-[#58A6FF] bg-[#58A6FF]/10 border-[#58A6FF]/30',
  transport: 'text-[#D29922] bg-[#D29922]/10 border-[#D29922]/30',
  activities: 'text-[#A371F7] bg-[#A371F7]/10 border-[#A371F7]/30',
  other: 'text-[#8B949E] bg-[#8B949E]/10 border-[#8B949E]/30',
}

const EMPTY_FORM = {
  category: 'other',
  title: '',
  assignee: '',
  notes: '',
  done: false,
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
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category">
          <select className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} className="capitalize">{c}</option>)}
          </select>
        </FormField>
        <FormField label="Assigned To">
          <input className={inputCls} value={form.assignee} onChange={(e) => set('assignee', e.target.value)} placeholder="Who's on it?" />
        </FormField>
      </div>
      <FormField label="Task">
        <input className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What needs to happen?" required />
      </FormField>
      <FormField label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Details, links, quantities…" />
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

function LogisticsItem({ item, onToggle, onEdit, onDelete }) {
  const colorCls = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
  return (
    <div className={`group flex items-center gap-3 rounded border p-3 transition-colors ${item.done ? 'border-[#21262d] bg-[#0d1117] opacity-50' : 'border-[#21262d] bg-[#0d1117] hover:border-[#30363D]'}`}>
      <button type="button" onClick={onToggle} className="shrink-0 text-[#4B5563] hover:text-[#3FB950]">
        {item.done ? <CheckSquare size={16} className="text-[#3FB950]" /> : <Square size={16} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${colorCls}`}>
            {item.category}
          </span>
          <span className={`text-sm font-semibold truncate ${item.done ? 'line-through text-[#4B5563]' : 'text-[#C9D1D9]'}`}>
            {item.title}
          </span>
        </div>
        {(item.assignee || item.notes) && (
          <div className="mt-0.5 flex items-center gap-3">
            {item.assignee && <span className="text-[10px] text-[#8B949E]">{item.assignee}</span>}
            {item.notes && <span className="text-[10px] text-[#4B5563] italic truncate">{item.notes}</span>}
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onClick={onEdit} className="text-[#4B5563] hover:text-[#58A6FF]"><Edit2 size={12} /></button>
        <button type="button" onClick={onDelete} className="text-[#4B5563] hover:text-[#F85149]"><Trash2 size={12} /></button>
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
    if (modal?.mode === 'edit') await update(modal.row.id, form)
    else await insert(form)
    setSaving(false)
    setModal(null)
  }

  async function handleToggle(item) {
    await update(item.id, { done: !item.done })
  }

  const done = items.filter((i) => i.done).length
  const total = items.length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-b border-[#30363D] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Logistics Checklist</div>
            <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">May 28–31 · Scottsdale</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#30363D] bg-[#161b22] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF] hover:bg-[#1f2a34]"
          >
            <Plus size={14} /> Add Task
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#3FB950]">{done}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Done</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C9D1D9]">{total - done}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Remaining</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <span className="text-[11px] uppercase tracking-widest text-[#8B949E]">Loading…</span>
          </div>
        ) : (
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
                      onDelete={() => remove(item.id)}
                    />
                  ))}
                </div>
              )
            })}
            {items.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-3 py-16 text-[#4B5563]">
                <span className="text-[11px] uppercase tracking-widest">No tasks yet</span>
                <button
                  type="button"
                  onClick={() => setModal({ mode: 'add' })}
                  className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] hover:text-[#79b8ff]"
                >
                  <Plus size={13} /> Add the first task
                </button>
              </div>
            )}
          </div>
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
