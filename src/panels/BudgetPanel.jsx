import { useEffect, useState } from 'react'
import { ArrowDownLeft, ChevronDown, ChevronRight, CheckCircle, Circle, DollarSign, Edit2, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const HEADCOUNT = 14
const CATEGORIES = ['house', 'golf', 'food', 'drinks', 'transport', 'activities', 'other']
const PAYMENT_CAT = 'payment'

const CATEGORY_COLORS = {
  house:      'text-[#BA1323] bg-[#BA1323]/10 border-[#BA1323]/30',
  golf:       'text-[#48B040] bg-[#48B040]/10 border-[#48B040]/30',
  food:       'text-[#C4952A] bg-[#C4952A]/10 border-[#C4952A]/30',
  drinks:     'text-[#C4952A] bg-[#C4952A]/10 border-[#C4952A]/30',
  transport:  'text-[#D4601A] bg-[#D4601A]/10 border-[#D4601A]/30',
  activities: 'text-[#48B040] bg-[#48B040]/10 border-[#48B040]/30',
  other:      'text-[#9A8070] bg-[#9A8070]/10 border-[#9A8070]/30',
}

function computeSettlement(balances) {
  const creditors = []
  const debtors = []
  Object.entries(balances).forEach(([name, bal]) => {
    if (bal > 0.01) creditors.push({ name, amount: bal })
    else if (bal < -0.01) debtors.push({ name, amount: -bal })
  })
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)
  const txns = []
  let ci = 0, di = 0
  while (ci < creditors.length && di < debtors.length) {
    const amount = Math.min(creditors[ci].amount, debtors[di].amount)
    if (amount > 0.01) txns.push({ from: debtors[di].name, to: creditors[ci].name, amount })
    creditors[ci].amount -= amount
    debtors[di].amount -= amount
    if (creditors[ci].amount < 0.01) ci++
    if (debtors[di].amount < 0.01) di++
  }
  return txns
}

const VIEWS = ['expenses', 'balances', 'settle']
const VIEW_LABELS = { expenses: 'Expenses', balances: 'Balances', settle: 'Settle Up' }

const EMPTY_FORM = {
  description: '',
  amount: '',
  paid_by: '',
  category: 'other',
  split_names: [],
  custom_splits: null,
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
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center">
      <div className="w-full rounded-t-xl border border-[#3C1810] bg-[#1C0C08] shadow-2xl sm:mx-4 sm:max-w-lg sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-[#3C1810] px-5 py-4">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#BA1323]">{title}</span>
          <button type="button" onClick={onClose} className="text-[#9A8070] hover:text-[#F2E4D0]"><X size={16} /></button>
        </div>
        <div className="max-h-[78vh] overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function SplitPicker({ value, onChange, rosterNames }) {
  function toggle(name) {
    onChange(value.includes(name) ? value.filter(n => n !== name) : [...value, name])
  }
  return (
    <div className="rounded border border-[#3C1810] bg-[#140a06] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-[10px] text-[#9A8070]">
          {value.length} / {rosterNames.length} selected
        </span>
        <div className="flex gap-3">
          <button type="button" onClick={() => onChange([...rosterNames])} className="text-[10px] font-bold text-[#BA1323] hover:text-[#F2E4D0]">All</button>
          <button type="button" onClick={() => onChange([])} className="text-[10px] text-[#5C3820] hover:text-[#9A8070]">Clear</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {rosterNames.map(name => {
          const on = value.includes(name)
          return (
            <button
              key={name}
              type="button"
              onClick={() => toggle(name)}
              className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                on
                  ? 'border border-[#BA1323]/50 bg-[#BA1323]/15 text-[#BA1323]'
                  : 'border border-[#3C1810] bg-[#1C0C08] text-[#5C3820] hover:border-[#9A8070]/40 hover:text-[#9A8070]'
              }`}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const amtInputCls = 'w-24 rounded border border-[#3C1810] bg-[#1C0C08] px-2 py-1 text-right font-mono text-sm text-[#F2E4D0] placeholder-[#5C3820] focus:border-[#C4952A] focus:outline-none'

function CustomSplitEditor({ splitNames, customSplits, totalAmount, rosterNames, onToggle, onAmountChange }) {
  const billTotal = Number(totalAmount) || 0
  const enteredTotal = splitNames.reduce((s, n) => s + (Number(customSplits[n]) || 0), 0)
  const diff = billTotal - enteredTotal
  const balanced = Math.abs(diff) < 0.005
  const excluded = rosterNames.filter(n => !splitNames.includes(n))

  function distributeEvenly() {
    if (!splitNames.length || !billTotal) return
    const share = (billTotal / splitNames.length).toFixed(2)
    splitNames.forEach(n => onAmountChange(n, share))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="rounded border border-[#3C1810] bg-[#140a06] divide-y divide-[#1f0d08]">
        {splitNames.length === 0 && (
          <div className="px-3 py-4 text-center text-[10px] text-[#5C3820]">No one selected — add people below</div>
        )}
        {splitNames.map(name => (
          <div key={name} className="flex items-center gap-3 px-3 py-2">
            <button type="button" onClick={() => onToggle(name)} className="shrink-0 text-[#5C3820] hover:text-[#E83025]" title="Remove">
              <X size={11} />
            </button>
            <span className="flex-1 text-sm text-[#F2E4D0]">{name}</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#5C3820]">$</span>
              <input
                type="number"
                className={amtInputCls}
                value={customSplits[name] ?? ''}
                onChange={e => onAmountChange(name, e.target.value)}
                placeholder="0.00"
                min={0}
                step="0.01"
              />
            </div>
          </div>
        ))}
      </div>

      {excluded.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {excluded.map(name => (
            <button key={name} type="button" onClick={() => onToggle(name)}
              className="flex items-center gap-1 rounded border border-[#281408] bg-[#1C0C08] px-2 py-1 text-[10px] text-[#5C3820] hover:border-[#3C1810] hover:text-[#9A8070]"
            >
              <Plus size={9} /> {name}
            </button>
          ))}
        </div>
      )}

      <div className={`flex items-center justify-between rounded px-3 py-2 text-[10px] font-mono ${balanced ? 'bg-[#48B040]/10 text-[#48B040]' : 'bg-[#C4952A]/10 text-[#C4952A]'}`}>
        <span>Entered: ${enteredTotal.toFixed(2)}</span>
        {billTotal > 0 && (
          <span>{balanced ? '✓ Matches bill' : diff > 0 ? `$${diff.toFixed(2)} unassigned` : `$${Math.abs(diff).toFixed(2)} over bill`}</span>
        )}
        <button type="button" onClick={distributeEvenly} className="text-[9px] font-bold uppercase tracking-wider opacity-70 hover:opacity-100">
          Split evenly
        </button>
      </div>
    </div>
  )
}

function DirectPaymentForm({ allPeople, initialFrom, initialTo, onSave, onCancel, saving }) {
  const [from, setFrom] = useState(initialFrom || '')
  const [to, setTo] = useState(initialTo || '')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(from, to, Number(amount), note) }} className="flex flex-col gap-4">
      <div className="rounded border border-[#C4952A]/30 bg-[#C4952A]/5 p-3 text-[11px] text-[#C4952A]">
        Record a payment made outside the app (Venmo, cash, etc.). Both people's balances update immediately.
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Who paid">
          <select className={selectCls} value={from} onChange={e => { setFrom(e.target.value); if (e.target.value === to) setTo('') }} required>
            <option value="">— Select —</option>
            {allPeople.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
        <FormField label="Paid to">
          <select className={selectCls} value={to} onChange={e => setTo(e.target.value)} required>
            <option value="">— Select —</option>
            {allPeople.filter(p => p !== from).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Amount ($)">
        <input type="number" className={inputCls} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" min={0.01} step="0.01" required />
      </FormField>
      <FormField label="Note (optional)">
        <input className={inputCls} value={note} onChange={e => setNote(e.target.value)} placeholder="Venmo, cash, Airbnb share…" />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#9A8070] hover:text-[#F2E4D0]">Cancel</button>
        <button type="submit" disabled={saving || !from || !to || !amount || Number(amount) <= 0} className="rounded bg-[#48B040] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#0a1f0a] hover:bg-[#5fd455] disabled:opacity-50">
          {saving ? 'Saving…' : 'Log Payment'}
        </button>
      </div>
    </form>
  )
}

function ExpenseForm({ initial, rosterNames, onSave, onCancel, saving }) {
  const initSplitNames = initial?.split_names?.length ? initial.split_names : [...rosterNames]
  const hasCustom = initial?.custom_splits && Object.keys(initial.custom_splits).length > 0

  const [form, setForm] = useState(
    initial
      ? { ...initial, split_names: initSplitNames, custom_splits: initial.custom_splits || null }
      : { ...EMPTY_FORM, split_names: [...rosterNames] }
  )
  const [splitMode, setSplitMode] = useState(hasCustom ? 'custom' : 'even')
  const [payMode, setPayMode] = useState(
    initial?.paid_by && !rosterNames.includes(initial.paid_by) ? 'manual' : 'roster'
  )
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  function switchSplitMode(mode) {
    if (mode === 'custom') {
      const billTotal = Number(form.amount) || 0
      const share = form.split_names.length > 0 ? (billTotal / form.split_names.length) : 0
      const splits = {}
      form.split_names.forEach(n => { splits[n] = share > 0 ? share.toFixed(2) : '' })
      setForm(p => ({ ...p, custom_splits: splits }))
    } else {
      setForm(p => ({ ...p, custom_splits: null }))
    }
    setSplitMode(mode)
  }

  function handleCustomToggle(name) {
    if (form.split_names.includes(name)) {
      const newSplits = { ...(form.custom_splits || {}) }
      delete newSplits[name]
      setForm(p => ({ ...p, split_names: p.split_names.filter(n => n !== name), custom_splits: newSplits }))
    } else {
      setForm(p => ({ ...p, split_names: [...p.split_names, name], custom_splits: { ...(p.custom_splits || {}), [name]: '' } }))
    }
  }

  function handleCustomAmount(name, val) {
    setForm(p => ({ ...p, custom_splits: { ...(p.custom_splits || {}), [name]: val } }))
  }

  const evenShare = form.amount && form.split_names.length ? (Number(form.amount) / form.split_names.length).toFixed(2) : '0.00'

  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form, splitMode) }} className="flex flex-col gap-4">
      <FormField label="Description">
        <input className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="e.g. Tee time deposit, Costco run…" required />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Amount ($)">
          <input type="number" className={inputCls} value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" min={0} step="0.01" required />
        </FormField>
        <FormField label="Category">
          <select className={selectCls} value={form.category} onChange={e => set('category', e.target.value)}>
            {CATEGORIES.map(c => <option key={c} className="capitalize">{c}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Paid By">
        {payMode === 'roster' ? (
          <select className={selectCls} value={form.paid_by}
            onChange={e => { if (e.target.value === '__manual__') { setPayMode('manual'); set('paid_by', '') } else set('paid_by', e.target.value) }}
            required
          >
            <option value="">— Who fronted it? —</option>
            {rosterNames.map(n => <option key={n} value={n}>{n}</option>)}
            <option value="__manual__">Other (not on roster)…</option>
          </select>
        ) : (
          <div className="flex gap-2">
            <input className={`${inputCls} flex-1`} value={form.paid_by} onChange={e => set('paid_by', e.target.value)} placeholder="Name" required />
            <button type="button" onClick={() => { setPayMode('roster'); set('paid_by', '') }} className="shrink-0 text-[10px] text-[#9A8070] hover:text-[#BA1323]">← Roster</button>
          </div>
        )}
      </FormField>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#9A8070]">
            {splitMode === 'even' ? `Split Among (${form.split_names.length} people · $${evenShare}/person)` : `Custom Split (${form.split_names.length} people)`}
          </label>
          <div className="flex gap-0.5 rounded border border-[#3C1810] bg-[#140a06] p-0.5">
            {['even', 'custom'].map(m => (
              <button key={m} type="button" onClick={() => switchSplitMode(m)}
                className={`rounded px-2.5 py-1 text-[9px] font-black uppercase tracking-wider transition-colors ${splitMode === m ? 'bg-[#BA1323]/20 text-[#BA1323]' : 'text-[#5C3820] hover:text-[#9A8070]'}`}
              >
                {m === 'even' ? 'Even' : 'Custom'}
              </button>
            ))}
          </div>
        </div>
        {splitMode === 'even' ? (
          <SplitPicker value={form.split_names} onChange={v => set('split_names', v)} rosterNames={rosterNames} />
        ) : (
          <CustomSplitEditor
            splitNames={form.split_names}
            customSplits={form.custom_splits || {}}
            totalAmount={form.amount}
            rosterNames={rosterNames}
            onToggle={handleCustomToggle}
            onAmountChange={handleCustomAmount}
          />
        )}
      </div>

      <FormField label="Notes">
        <input className={inputCls} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Receipt #, context…" />
      </FormField>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#9A8070] hover:text-[#F2E4D0]">Cancel</button>
        <button type="submit" disabled={saving || form.split_names.length === 0} className="rounded bg-[#BA1323] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#140a06] hover:bg-[#79b8ff] disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  )
}

export default function BudgetPanel() {
  const { rows: expenses, loading, insert, update, remove } = useSupabaseTable('expenses', { orderBy: 'created_at', ascending: false })
  const { rows: paidSettlements, insert: markPaid, remove: unmarkPaid } = useSupabaseTable('settlements_paid', { orderBy: 'created_at' })
  const { rows: roster } = useSupabaseTable('roster', { orderBy: 'name' })
  const [modal, setModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null) // null | { from?: string, to?: string }
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('expenses')
  const [sortBy, setSortBy] = useState('newest')
  const [filterCat, setFilterCat] = useState('')
  const [filterPerson, setFilterPerson] = useState('')

  const activeRoster = roster.filter(r => r.status !== 'Ghosting')
  const rosterNames = activeRoster.map(r => r.name.trim())
  const groupSize = rosterNames.length > 0 ? rosterNames.length : HEADCOUNT

  function isPaid(t) {
    return paidSettlements.some(p => p.from_person === t.from && p.to_person === t.to)
  }
  function getPaidRecord(t) {
    return paidSettlements.find(p => p.from_person === t.from && p.to_person === t.to)
  }
  async function handleMarkPaid(t) {
    await markPaid({ from_person: t.from, to_person: t.to, amount: t.amount })
  }
  async function handleUnmarkPaid(t) {
    const record = getPaidRecord(t)
    if (record) await unmarkPaid(record.id)
  }

  async function handleLogPayment(from, to, amount, note) {
    setSaving(true)
    await insert({
      description: `Payment from ${from} to ${to}${note ? ` — ${note}` : ''}`,
      amount,
      paid_by: from,
      category: PAYMENT_CAT,
      split_names: [to],
      split_count: 1,
      notes: note || '',
    })
    setSaving(false)
    setPaymentModal(null)
  }

  async function handleSave(form, splitMode) {
    setSaving(true)
    const splitNames = form.split_names.length > 0 ? form.split_names : null
    const customSplits = splitMode === 'custom' && form.custom_splits && Object.keys(form.custom_splits).length > 0
      ? Object.fromEntries(Object.entries(form.custom_splits).map(([k, v]) => [k, Number(v) || 0]))
      : null
    const payload = {
      description: form.description,
      amount: Number(form.amount),
      paid_by: form.paid_by.trim(),
      category: form.category,
      split_names: splitNames,
      split_count: splitNames ? splitNames.length : HEADCOUNT,
      notes: form.notes,
      // only include custom_splits when non-null — avoids errors if DB migration hasn't run yet
      ...(customSplits !== null && { custom_splits: customSplits }),
    }
    const { error } = modal?.mode === 'edit'
      ? await update(modal.row.id, payload)
      : await insert(payload)
    setSaving(false)
    if (error) {
      alert(`Save failed: ${error}`)
      return
    }
    setModal(null)
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const realExpenses = expenses.filter(e => e.category !== PAYMENT_CAT)
  const paymentEntries = expenses.filter(e => e.category === PAYMENT_CAT)

  const totalSpent = realExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const perPerson = groupSize > 0 ? totalSpent / groupSize : 0

  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = realExpenses.filter(e => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
    return acc
  }, {})

  const payerTotals = {}
  expenses.forEach(e => {
    const payer = e.paid_by?.trim()
    if (!payer) return
    payerTotals[payer] = (payerTotals[payer] || 0) + Number(e.amount)
  })

  const splitPeopleNames = [...new Set(realExpenses.flatMap(e => Array.isArray(e.split_names) ? e.split_names : []))]
  const allPeople = [...new Set([...rosterNames, ...Object.keys(payerTotals), ...splitPeopleNames])]

  // Per-person owed: custom_splits take priority, then even split, then legacy
  const owedByPerson = {}
  allPeople.forEach(name => {
    owedByPerson[name] = expenses.reduce((sum, e) => {
      if (e.custom_splits && typeof e.custom_splits === 'object') {
        return sum + (Number(e.custom_splits[name]) || 0)
      }
      const names = Array.isArray(e.split_names) && e.split_names.length > 0 ? e.split_names : null
      if (names) {
        return sum + (names.includes(name) ? Number(e.amount) / names.length : 0)
      }
      return sum + Number(e.amount) / (Number(e.split_count) || HEADCOUNT)
    }, 0)
  })

  const netBalances = {}
  allPeople.forEach(name => {
    netBalances[name] = (payerTotals[name] || 0) - owedByPerson[name]
  })

  const settlements = computeSettlement(netBalances)

  function getDebtBreakdown(personName) {
    const lines = realExpenses
      .filter(e => {
        const names = Array.isArray(e.split_names) && e.split_names.length > 0 ? e.split_names : null
        const payer = e.paid_by?.trim()
        if (payer === personName) return false // they paid this, skip
        return names ? names.includes(personName) : true
      })
      .map(e => {
        let share
        if (e.custom_splits && typeof e.custom_splits === 'object') {
          share = Number(e.custom_splits[personName]) || 0
        } else {
          const names = Array.isArray(e.split_names) && e.split_names.length > 0 ? e.split_names : null
          const denom = names ? names.length : (Number(e.split_count) || HEADCOUNT)
          share = Number(e.amount) / denom
        }
        return { id: e.id, description: e.description, category: e.category, paid_by: e.paid_by?.trim(), share, isCustom: !!(e.custom_splits) }
      })
      .sort((a, b) => b.share - a.share)
    const logsForPerson = paymentEntries.filter(e => e.paid_by?.trim() === personName)
    return { lines, logsForPerson }
  }

  function toggleRow(key) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  // ── Sort + filter for expense list ────────────────────────────────────────

  const visibleExpenses = realExpenses
    .filter(e => !filterCat || e.category === filterCat)
    .filter(e => {
      if (!filterPerson) return true
      if (e.paid_by?.trim() === filterPerson) return true
      if (Array.isArray(e.split_names)) return e.split_names.includes(filterPerson)
      return true // legacy expenses shown for all
    })
    .slice()
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'amount-desc') return Number(b.amount) - Number(a.amount)
      if (sortBy === 'amount-asc') return Number(a.amount) - Number(b.amount)
      return 0
    })

  const hasFilters = filterCat || filterPerson

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#3C1810] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9A8070]">Budget Tracker</div>
            <div className="mt-0.5 text-lg font-bold text-[#F2E4D0]">Cost Split · {HEADCOUNT} guys</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#3C1810] bg-[#1C0C08] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#BA1323] hover:border-[#BA1323] hover:bg-[#251508]"
          >
            <Plus size={14} /> Log Expense
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#F2E4D0]">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C4952A]">${perPerson.toFixed(0)}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Avg / Person</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#BA1323]">{realExpenses.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Expenses</div>
          </div>
          {settlements.length > 0 && (
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#C4952A]">{settlements.filter(t => !isPaid(t)).length}</div>
              <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Outstanding</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex gap-1">
          {VIEWS.map(v => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${view === v ? 'bg-[#BA1323]/15 text-[#BA1323]' : 'text-[#5C3820] hover:text-[#9A8070]'}`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6" style={{ paddingBottom: '7rem' }}>
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#9A8070]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : (
          <>
            {/* EXPENSES VIEW */}
            {view === 'expenses' && (
              <div className="flex flex-col gap-4">
                {/* Category breakdown */}
                {totalSpent > 0 && (
                  <div className="rounded border border-[#3C1810] bg-[#180C07] p-4">
                    <div className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">Breakdown by Category</div>
                    <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-[#281408]">
                      {CATEGORIES.filter(c => byCategory[c] > 0).map(c => (
                        <div
                          key={c}
                          style={{ width: `${(byCategory[c] / totalSpent) * 100}%` }}
                          className={`h-full ${CATEGORY_COLORS[c].split(' ')[0].replace('text-', 'bg-')}`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {CATEGORIES.filter(c => byCategory[c] > 0).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFilterCat(filterCat === c ? '' : c)}
                          className={`text-center transition-opacity ${filterCat && filterCat !== c ? 'opacity-40' : ''}`}
                        >
                          <div className={`font-mono text-sm font-black ${CATEGORY_COLORS[c].split(' ')[0]}`}>${byCategory[c].toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className="text-[9px] capitalize text-[#9A8070]">{c}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sort + filter controls */}
                {realExpenses.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="rounded border border-[#3C1810] bg-[#140a06] px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9A8070] focus:outline-none"
                    >
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                      <option value="amount-desc">Highest $</option>
                      <option value="amount-asc">Lowest $</option>
                    </select>
                    <select
                      value={filterCat}
                      onChange={e => setFilterCat(e.target.value)}
                      className="rounded border border-[#3C1810] bg-[#140a06] px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9A8070] focus:outline-none"
                    >
                      <option value="">All Categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                    </select>
                    <select
                      value={filterPerson}
                      onChange={e => setFilterPerson(e.target.value)}
                      className="rounded border border-[#3C1810] bg-[#140a06] px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9A8070] focus:outline-none"
                    >
                      <option value="">All People</option>
                      {allPeople.sort().map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {hasFilters && (
                      <button
                        type="button"
                        onClick={() => { setFilterCat(''); setFilterPerson('') }}
                        className="text-[10px] text-[#5C3820] hover:text-[#BA1323]"
                      >
                        Clear filters
                      </button>
                    )}
                    {hasFilters && (
                      <span className="font-mono text-[10px] text-[#5C3820]">{visibleExpenses.length} of {realExpenses.length}</span>
                    )}
                  </div>
                )}

                {/* Expense list */}
                {realExpenses.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-[#5C3820]">
                    <DollarSign size={32} strokeWidth={1} />
                    <span className="text-[11px] uppercase tracking-widest">No expenses logged yet</span>
                    <button type="button" onClick={() => setModal({ mode: 'add' })} className="text-[11px] font-bold uppercase tracking-wider text-[#BA1323] hover:text-[#79b8ff]">
                      Log the first expense
                    </button>
                  </div>
                ) : visibleExpenses.length === 0 ? (
                  <div className="py-12 text-center text-[11px] uppercase tracking-widest text-[#5C3820]">
                    No expenses match the current filters
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {visibleExpenses.map(e => {
                      const names = Array.isArray(e.split_names) && e.split_names.length > 0 ? e.split_names : null
                      const isCustom = e.custom_splits && typeof e.custom_splits === 'object' && Object.keys(e.custom_splits).length > 0
                      const denom = names ? names.length : (Number(e.split_count) || HEADCOUNT)
                      const evenShare = Number(e.amount) / denom
                      const isAllGroup = !isCustom && names && rosterNames.length > 0 && names.length === rosterNames.length

                      return (
                        <div key={e.id} className="group flex items-start gap-3 rounded border border-[#281408] bg-[#140a06] p-3 hover:border-[#3C1810]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>
                                {e.category}
                              </span>
                              <span className="truncate text-sm font-semibold text-[#F2E4D0]">{e.description}</span>
                              {isCustom && (
                                <span className="rounded border border-[#C4952A]/40 bg-[#C4952A]/10 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#C4952A]">Custom</span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="text-[10px] text-[#9A8070]">
                                Paid by <span className="text-[#F2E4D0]">{e.paid_by}</span>
                              </span>
                              {!isCustom && (
                                <span className="font-mono text-[10px] text-[#C4952A]">${evenShare.toFixed(2)}/person</span>
                              )}
                              {e.notes && <span className="text-[10px] italic text-[#5C3820]">{e.notes}</span>}
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1">
                              {isCustom ? (
                                Object.entries(e.custom_splits).slice(0, 6).map(([name, amt]) => (
                                  <span key={name} className="rounded bg-[#281408] px-1.5 py-0.5 text-[9px] text-[#9A8070]">
                                    {name} <span className="font-mono text-[#C4952A]">${Number(amt).toFixed(2)}</span>
                                  </span>
                                ))
                              ) : isAllGroup ? (
                                <span className="text-[10px] text-[#5C3820]">All {names.length} guys</span>
                              ) : names ? (
                                <>
                                  {names.slice(0, 5).map(n => (
                                    <span key={n} className="rounded bg-[#281408] px-1.5 py-0.5 text-[9px] text-[#9A8070]">{n}</span>
                                  ))}
                                  {names.length > 5 && <span className="text-[9px] text-[#5C3820]">+{names.length - 5} more</span>}
                                </>
                              ) : (
                                <span className="text-[10px] text-[#5C3820]">Split {e.split_count || HEADCOUNT} ways</span>
                              )}
                              {isCustom && Object.keys(e.custom_splits).length > 6 && (
                                <span className="text-[9px] text-[#5C3820]">+{Object.keys(e.custom_splits).length - 6} more</span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-sm font-black text-[#48B040]">${Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                              <button type="button" onClick={() => setModal({ mode: 'edit', row: e })} className="p-2 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={12} /></button>
                              <button type="button" onClick={() => { if (window.confirm('Delete this expense?')) remove(e.id) }} className="p-2 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* BALANCES VIEW */}
            {view === 'balances' && (
              <div className="flex flex-col gap-3">
                <div className="text-[10px] text-[#9A8070] uppercase tracking-widest mb-1">
                  Net balance based on actual expense splits · {groupSize} people
                </div>
                {allPeople.length === 0 ? (
                  <div className="py-12 text-center text-[11px] uppercase tracking-widest text-[#5C3820]">No expenses logged yet</div>
                ) : (
                  allPeople.sort((a, b) => netBalances[b] - netBalances[a]).map(name => {
                    const net = netBalances[name]
                    const owed = owedByPerson[name] || 0
                    const paid = payerTotals[name] || 0
                    const isCreditor = net > 0
                    return (
                      <div key={name} className="rounded border border-[#281408] bg-[#140a06] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-[#F2E4D0]">{name}</div>
                            <div className="mt-0.5 text-[10px] text-[#9A8070]">
                              Paid <span className="font-mono text-[#F2E4D0]">${paid.toFixed(2)}</span>
                              {' · '}owes <span className="font-mono text-[#F2E4D0]">${owed.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono text-base font-black ${isCreditor ? 'text-[#48B040]' : 'text-[#E83025]'}`}>
                              {isCreditor ? '+' : ''}{net.toFixed(2)}
                            </div>
                            <div className={`text-[9px] uppercase tracking-widest ${isCreditor ? 'text-[#48B040]' : 'text-[#E83025]'}`}>
                              {isCreditor ? 'owed back' : 'owes'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#281408]">
                          <div
                            className={`h-full rounded-full ${isCreditor ? 'bg-[#48B040]' : 'bg-[#E83025]'}`}
                            style={{ width: `${Math.min(100, (Math.abs(net) / (totalSpent / 2)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            )}

            {/* SETTLE UP VIEW */}
            {view === 'settle' && (
              <div className="flex flex-col gap-3">
                {/* Settle Up header actions */}
                <div className="flex items-center justify-between">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">
                    Optimized settlement · {allPeople.length} people
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentModal({})}
                    className="flex items-center gap-1.5 rounded border border-[#3C1810] bg-[#1C0C08] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#C4952A] transition-colors hover:border-[#C4952A] hover:bg-[#251508]"
                  >
                    <ArrowDownLeft size={12} /> Log Direct Payment
                  </button>
                </div>

                {activeRoster.length === 0 && (
                  <div className="rounded border border-[#C4952A]/30 bg-[#C4952A]/10 p-3 text-[10px] text-[#C4952A]">
                    Add your crew to the <span className="font-bold">Roster</span> tab first — Settle Up needs the full group to calculate who owes what.
                  </div>
                )}
                {settlements.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-[#5C3820]">
                    <div className="text-[11px] uppercase tracking-widest">
                      {expenses.length === 0 ? 'No expenses yet' : 'All square — nothing to settle!'}
                    </div>
                  </div>
                ) : (
                  <>
                    {settlements.filter(t => !isPaid(t)).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">Outstanding</div>
                        {settlements.filter(t => !isPaid(t)).map((t, i) => {
                          const rowKey = `${t.from}--${t.to}`
                          const isExpanded = expandedRows.has(rowKey)
                          const { lines, logsForPerson } = getDebtBreakdown(t.from)
                          const totalLogged = logsForPerson.reduce((s, e) => s + Number(e.amount), 0)
                          return (
                            <div key={i} className="rounded border border-[#281408] bg-[#140a06]">
                              {/* Main row */}
                              <div className="flex items-center gap-2 p-4">
                                <button
                                  type="button"
                                  onClick={() => toggleRow(rowKey)}
                                  className="shrink-0 text-[#5C3820] hover:text-[#9A8070]"
                                  title="Show expense breakdown"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#E83025]/10 text-xs font-black text-[#E83025]">
                                  {t.from[0]?.toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-[#F2E4D0]">{t.from}</div>
                                  <div className="text-[10px] text-[#9A8070]">sends to <span className="text-[#48B040]">{t.to}</span></div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-right mr-1">
                                    <div className="font-mono text-lg font-black text-[#C4952A]">${t.amount.toFixed(2)}</div>
                                    <div className="text-[9px] uppercase tracking-widest text-[#5C3820]">Venmo / Cash</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPaymentModal({ from: t.from, to: t.to })}
                                    className="flex items-center gap-1.5 rounded border border-[#3C1810] bg-[#1C0C08] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9A8070] transition-colors hover:border-[#C4952A] hover:text-[#C4952A]"
                                  >
                                    <ArrowDownLeft size={12} /> Paid Me
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkPaid(t)}
                                    className="flex items-center gap-1.5 rounded border border-[#3C1810] bg-[#1C0C08] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9A8070] transition-colors hover:border-[#48B040] hover:text-[#48B040]"
                                  >
                                    <Circle size={12} /> Mark Paid
                                  </button>
                                </div>
                              </div>

                              {/* Expandable breakdown */}
                              {isExpanded && (
                                <div className="border-t border-[#281408] px-4 pb-4 pt-3">
                                  <div className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">
                                    {t.from}'s expense breakdown
                                  </div>
                                  {lines.length === 0 ? (
                                    <div className="text-[10px] text-[#5C3820]">No expense shares found.</div>
                                  ) : (
                                    <div className="flex flex-col gap-0.5">
                                      {lines.map(line => (
                                        <div key={line.id} className="flex items-center gap-2 py-1">
                                          <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${CATEGORY_COLORS[line.category] || CATEGORY_COLORS.other}`}>
                                            {line.category}
                                          </span>
                                          <span className="flex-1 min-w-0 truncate text-[11px] text-[#9A8070]">{line.description}</span>
                                          <span className="shrink-0 text-[10px] text-[#5C3820]">
                                            paid by <span className="text-[#9A8070]">{line.paid_by}</span>
                                          </span>
                                          <span className="shrink-0 font-mono text-[11px] font-bold text-[#F2E4D0]">${line.share.toFixed(2)}</span>
                                        </div>
                                      ))}
                                      <div className="mt-2 flex items-center justify-between border-t border-[#281408] pt-2">
                                        <span className="text-[9px] uppercase tracking-widest text-[#5C3820]">Total expense shares</span>
                                        <span className="font-mono text-sm font-black text-[#F2E4D0]">${lines.reduce((s, l) => s + l.share, 0).toFixed(2)}</span>
                                      </div>
                                    </div>
                                  )}
                                  {logsForPerson.length > 0 && (
                                    <div className="mt-3 flex flex-col gap-0.5 border-t border-[#281408] pt-3">
                                      <div className="mb-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#48B040]/70">Payments logged</div>
                                      {logsForPerson.map(p => (
                                        <div key={p.id} className="flex items-center gap-2 py-0.5 text-[10px]">
                                          <ArrowDownLeft size={10} className="shrink-0 text-[#48B040]" />
                                          <span className="flex-1 text-[#9A8070]">{p.description}{p.notes ? ` · ${p.notes}` : ''}</span>
                                          <span className="font-mono font-bold text-[#48B040]">−${Number(p.amount).toFixed(2)}</span>
                                        </div>
                                      ))}
                                      {totalLogged > 0 && (
                                        <div className="mt-1 flex items-center justify-between text-[10px]">
                                          <span className="text-[#5C3820]">Total paid directly</span>
                                          <span className="font-mono font-bold text-[#48B040]">${totalLogged.toFixed(2)}</span>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-3 rounded border border-[#3C1810]/50 bg-[#180C07] p-2 text-[9px] text-[#5C3820]">
                                    The algorithm routes all debts through the fewest transfers. The amount above ({t.from} → {t.to}) may consolidate obligations to multiple people.
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {settlements.filter(t => isPaid(t)).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#48B040]/60">Settled</div>
                        {settlements.filter(t => isPaid(t)).map((t, i) => (
                          <div key={i} className="flex items-center justify-between rounded border border-[#48B040]/20 bg-[#48B040]/5 p-4 opacity-60">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#48B040]/10 text-xs font-black text-[#48B040]">
                                <CheckCircle size={16} />
                              </div>
                              <div>
                                <div className="text-sm font-semibold line-through text-[#9A8070]">{t.from}</div>
                                <div className="text-[10px] text-[#5C3820]">paid <span className="text-[#9A8070]">{t.to}</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-mono text-lg font-black text-[#48B040]">${t.amount.toFixed(2)}</div>
                                <div className="text-[9px] uppercase tracking-widest text-[#48B040]/60">Settled</div>
                              </div>
                              <button type="button" onClick={() => handleUnmarkPaid(t)} className="text-[10px] text-[#5C3820] underline hover:text-[#9A8070]">
                                Undo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {settlements.every(t => isPaid(t)) && (
                      <div className="rounded border border-[#48B040]/30 bg-[#48B040]/10 p-4 text-center">
                        <div className="text-sm font-black text-[#48B040]">All settled up!</div>
                        <div className="mt-1 text-[10px] text-[#9A8070]">Everyone's square. Good trip.</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {modal && (
        <Modal title={modal.mode === 'edit' ? 'Edit Expense' : 'Log Expense'} onClose={() => setModal(null)}>
          <ExpenseForm
            initial={modal.mode === 'edit' ? modal.row : undefined}
            rosterNames={rosterNames}
            onSave={handleSave}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        </Modal>
      )}

      {paymentModal !== null && (
        <Modal title="Log Direct Payment" onClose={() => setPaymentModal(null)}>
          <DirectPaymentForm
            allPeople={allPeople.sort()}
            initialFrom={paymentModal.from}
            initialTo={paymentModal.to}
            onSave={handleLogPayment}
            onCancel={() => setPaymentModal(null)}
            saving={saving}
          />
        </Modal>
      )}
    </div>
  )
}
