import { useState } from 'react'
import { Copy, Edit2, Home, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const CATEGORIES = ['access', 'utilities', 'local', 'rules', 'other']

const CATEGORY_CONFIG = {
  access:    { label: 'Access & Entry',    color: 'text-[#58A6FF] bg-[#58A6FF]/10 border-[#58A6FF]/30' },
  utilities: { label: 'WiFi & Utilities',  color: 'text-[#3FB950] bg-[#3FB950]/10 border-[#3FB950]/30' },
  local:     { label: 'Local Resources',   color: 'text-[#D29922] bg-[#D29922]/10 border-[#D29922]/30' },
  rules:     { label: 'House Rules',       color: 'text-[#A371F7] bg-[#A371F7]/10 border-[#A371F7]/30' },
  other:     { label: 'Other Info',        color: 'text-[#8B949E] bg-[#8B949E]/10 border-[#8B949E]/30' },
}

const EMPTY_FORM = { category: 'access', key: '', value: '', notes: '' }

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

function InfoForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
      <FormField label="Category">
        <select className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>)}
        </select>
      </FormField>
      <FormField label="Label">
        <input className={inputCls} value={form.key} onChange={(e) => set('key', e.target.value)} placeholder="e.g. Front Door Code, WiFi Password, Pool Hours…" required />
      </FormField>
      <FormField label="Value">
        <input className={inputCls} value={form.value} onChange={(e) => set('value', e.target.value)} placeholder="The actual info…" required />
      </FormField>
      <FormField label="Notes (optional)">
        <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any context or caveats…" />
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

function InfoCard({ item, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false)

  function copyValue() {
    navigator.clipboard.writeText(item.value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="group rounded border border-[#21262d] bg-[#0d1117] p-3 hover:border-[#30363D]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-widest text-[#8B949E]">{item.key}</div>
          <div className="mt-1 font-mono text-sm font-semibold text-[#C9D1D9] break-all">{item.value}</div>
          {item.notes && <div className="mt-1 text-[10px] italic text-[#4B5563]">{item.notes}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={copyValue}
            className={`p-1.5 rounded text-[10px] transition-colors ${copied ? 'text-[#3FB950]' : 'text-[#4B5563] hover:text-[#C9D1D9]'}`}
            title="Copy to clipboard"
          >
            <Copy size={12} />
          </button>
          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
            <button type="button" onClick={onEdit} className="p-1 text-[#4B5563] hover:text-[#58A6FF]"><Edit2 size={12} /></button>
            <button type="button" onClick={onDelete} className="p-1 text-[#4B5563] hover:text-[#F85149]"><Trash2 size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HousePanel() {
  const { rows: items, loading, insert, update, remove } = useSupabaseTable('house_info', { orderBy: 'category' })
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
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">House Info Board</div>
            <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">6543 E 3rd St · Scottsdale</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#30363D] bg-[#161b22] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF] hover:bg-[#1f2a34]"
          >
            <Plus size={14} /> Add Info
          </button>
        </div>
        <div className="mt-2 text-[10px] text-[#4B5563]">
          Check-in codes, WiFi, pool hours, local resources — tap the copy icon to grab any value instantly.
        </div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#8B949E]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[#4B5563]">
            <Home size={32} strokeWidth={1} />
            <span className="text-[11px] uppercase tracking-widest">No house info added yet</span>
            <div className="max-w-xs text-center text-[10px] text-[#4B5563]">
              Add the door code, WiFi password, pool schedule, and local numbers so nobody has to ask.
            </div>
            <button type="button" onClick={() => setModal({ mode: 'add' })} className="mt-2 text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] hover:text-[#79b8ff]">
              Add first entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const catItems = items.filter((i) => i.category === cat)
              if (catItems.length === 0) return null
              const { label, color } = CATEGORY_CONFIG[cat]
              return (
                <div key={cat} className="flex flex-col gap-2">
                  <div className={`flex items-center gap-2 rounded border px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] ${color}`}>
                    {label}
                    <span className="ml-auto font-mono">{catItems.length}</span>
                  </div>
                  {catItems.map((item) => (
                    <InfoCard
                      key={item.id}
                      item={item}
                      onEdit={() => setModal({ mode: 'edit', row: item })}
                      onDelete={() => { if (window.confirm('Delete this entry?')) remove(item.id) }}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit Entry' : 'Add House Info'} onClose={() => setModal(null)}>
          <InfoForm
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
