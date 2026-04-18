import { useState } from 'react'
import { CheckCircle, Circle, DollarSign, Edit2, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const HEADCOUNT = 14
const CATEGORIES = ['house', 'golf', 'food', 'drinks', 'transport', 'activities', 'other']

const CATEGORY_COLORS = {
  house:      'text-[#58A6FF] bg-[#58A6FF]/10 border-[#58A6FF]/30',
  golf:       'text-[#3FB950] bg-[#3FB950]/10 border-[#3FB950]/30',
  food:       'text-[#D29922] bg-[#D29922]/10 border-[#D29922]/30',
  drinks:     'text-[#A371F7] bg-[#A371F7]/10 border-[#A371F7]/30',
  transport:  'text-[#F78166] bg-[#F78166]/10 border-[#F78166]/30',
  activities: 'text-[#39D353] bg-[#39D353]/10 border-[#39D353]/30',
  other:      'text-[#8B949E] bg-[#8B949E]/10 border-[#8B949E]/30',
}

// Settlement algorithm: minimize transactions
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
  split_count: HEADCOUNT,
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

function ExpenseForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial || EMPTY_FORM)
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }))

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form) }} className="flex flex-col gap-4">
      <FormField label="Description">
        <input className={inputCls} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="e.g. Tee time deposit, Costco run…" required />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Amount ($)">
          <input type="number" className={inputCls} value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0.00" min={0} step="0.01" required />
        </FormField>
        <FormField label="Category">
          <select className={selectCls} value={form.category} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} className="capitalize">{c}</option>)}
          </select>
        </FormField>
      </div>
      <FormField label="Paid By">
        <input className={inputCls} value={form.paid_by} onChange={(e) => set('paid_by', e.target.value)} placeholder="Who fronted the money?" required />
      </FormField>
      <FormField label={`Split Among (# of people, max ${HEADCOUNT})`}>
        <input type="number" className={inputCls} value={form.split_count} onChange={(e) => set('split_count', e.target.value)} min={1} max={HEADCOUNT} />
      </FormField>
      <FormField label="Notes">
        <input className={inputCls} value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Receipt #, context…" />
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

export default function BudgetPanel() {
  const { rows: expenses, loading, insert, update, remove } = useSupabaseTable('expenses', { orderBy: 'created_at', ascending: false })
  const { rows: paidSettlements, insert: markPaid, remove: unmarkPaid } = useSupabaseTable('settlements_paid', { orderBy: 'created_at' })
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState('expenses')

  function isPaid(t) {
    return paidSettlements.some((p) => p.from_person === t.from && p.to_person === t.to)
  }

  function getPaidRecord(t) {
    return paidSettlements.find((p) => p.from_person === t.from && p.to_person === t.to)
  }

  async function handleMarkPaid(t) {
    await markPaid({ from_person: t.from, to_person: t.to, amount: t.amount })
  }

  async function handleUnmarkPaid(t) {
    const record = getPaidRecord(t)
    if (record) await unmarkPaid(record.id)
  }

  async function handleSave(form) {
    setSaving(true)
    const payload = {
      description: form.description,
      amount: Number(form.amount),
      paid_by: form.paid_by.trim(),
      category: form.category,
      split_count: Math.min(HEADCOUNT, Math.max(1, Number(form.split_count) || HEADCOUNT)),
      notes: form.notes,
    }
    if (modal?.mode === 'edit') await update(modal.row.id, payload)
    else await insert(payload)
    setSaving(false)
    setModal(null)
  }

  // Compute totals
  const totalSpent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const perPerson = totalSpent / HEADCOUNT

  // Category breakdown
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
    return acc
  }, {})

  // Balance sheet: net per person (paid - owed)
  const balances = {}
  expenses.forEach((e) => {
    const amt = Number(e.amount) || 0
    const sc = Number(e.split_count) || HEADCOUNT
    const share = amt / sc
    const payer = e.paid_by?.trim()
    if (!payer) return
    balances[payer] = (balances[payer] || 0) + amt - share
    // Others each owe their share — we track as negative for "all others"
    // We represent this as: payer gets credit for (amt - share), everyone else owes share
    // For settlement we need to track debtors too. We'll approximate:
    // since we don't have named individuals per expense, we track aggregate owed from "the group"
  })

  // Simpler model: per-payer ledger
  // paid_total - fair_share_of_all_expenses
  const payerTotals = {}
  expenses.forEach((e) => {
    const payer = e.paid_by?.trim()
    if (!payer) return
    payerTotals[payer] = (payerTotals[payer] || 0) + Number(e.amount)
  })

  // Each person's fair share = totalSpent / HEADCOUNT
  const namedPayers = Object.keys(payerTotals)
  const netBalances = {}
  namedPayers.forEach((name) => {
    netBalances[name] = (payerTotals[name] || 0) - perPerson
  })

  const settlements = computeSettlement(netBalances)

  return (
    <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#30363D] px-4 py-4 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B949E]">Budget Tracker</div>
            <div className="mt-0.5 text-lg font-bold text-[#C9D1D9]">Cost Split · {HEADCOUNT} guys</div>
          </div>
          <button
            type="button"
            onClick={() => setModal({ mode: 'add' })}
            className="flex items-center gap-2 rounded border border-[#30363D] bg-[#161b22] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#58A6FF] hover:border-[#58A6FF] hover:bg-[#1f2a34]"
          >
            <Plus size={14} /> Log Expense
          </button>
        </div>

        {/* Stats */}
        <div className="mt-3 flex flex-wrap gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C9D1D9]">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#D29922]">${perPerson.toFixed(0)}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Per Person</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#58A6FF]">{expenses.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Expenses</div>
          </div>
          {settlements.length > 0 && (
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#A371F7]">{settlements.filter((t) => !isPaid(t)).length}</div>
              <div className="text-[9px] uppercase tracking-widest text-[#8B949E]">Outstanding</div>
            </div>
          )}
        </div>

        {/* View switcher */}
        <div className="mt-3 flex gap-1">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${view === v ? 'bg-[#58A6FF]/15 text-[#58A6FF]' : 'text-[#4B5563] hover:text-[#8B949E]'}`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#8B949E]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : (
          <>
            {/* EXPENSES VIEW */}
            {view === 'expenses' && (
              <div className="flex flex-col gap-4">
                {/* Category breakdown bar */}
                {totalSpent > 0 && (
                  <div className="rounded border border-[#30363D] bg-[#11161d] p-4">
                    <div className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#8B949E]">Breakdown by Category</div>
                    {/* Visual bar */}
                    <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-[#21262d]">
                      {CATEGORIES.filter((c) => byCategory[c] > 0).map((c) => (
                        <div
                          key={c}
                          style={{ width: `${(byCategory[c] / totalSpent) * 100}%` }}
                          className={`h-full ${CATEGORY_COLORS[c].split(' ')[0].replace('text-', 'bg-')}`}
                        />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      {CATEGORIES.filter((c) => byCategory[c] > 0).map((c) => (
                        <div key={c} className="text-center">
                          <div className={`font-mono text-sm font-black ${CATEGORY_COLORS[c].split(' ')[0]}`}>${byCategory[c].toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className="text-[9px] capitalize text-[#8B949E]">{c}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expense list */}
                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-[#4B5563]">
                    <DollarSign size={32} strokeWidth={1} />
                    <span className="text-[11px] uppercase tracking-widest">No expenses logged yet</span>
                    <button type="button" onClick={() => setModal({ mode: 'add' })} className="text-[11px] font-bold uppercase tracking-wider text-[#58A6FF] hover:text-[#79b8ff]">
                      Log the first expense
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {expenses.map((e) => {
                      const share = Number(e.amount) / (Number(e.split_count) || HEADCOUNT)
                      return (
                        <div key={e.id} className="group flex items-center gap-3 rounded border border-[#21262d] bg-[#0d1117] p-3 hover:border-[#30363D]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>
                                {e.category}
                              </span>
                              <span className="truncate text-sm font-semibold text-[#C9D1D9]">{e.description}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-4 flex-wrap">
                              <span className="text-[10px] text-[#8B949E]">Paid by <span className="text-[#C9D1D9]">{e.paid_by}</span></span>
                              <span className="text-[10px] text-[#8B949E]">Split {e.split_count || HEADCOUNT} ways · <span className="font-mono text-[#D29922]">${share.toFixed(2)}/person</span></span>
                              {e.notes && <span className="text-[10px] italic text-[#4B5563]">{e.notes}</span>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-sm font-black text-[#3FB950]">${Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                              <button type="button" onClick={() => setModal({ mode: 'edit', row: e })} className="p-1 text-[#4B5563] hover:text-[#58A6FF]"><Edit2 size={12} /></button>
                              <button type="button" onClick={() => { if (window.confirm('Delete this expense?')) remove(e.id) }} className="p-1 text-[#4B5563] hover:text-[#F85149]"><Trash2 size={12} /></button>
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
                <div className="text-[10px] text-[#8B949E] uppercase tracking-widest mb-1">
                  Who paid what vs. their fair share (${perPerson.toFixed(2)} each)
                </div>
                {namedPayers.length === 0 ? (
                  <div className="py-12 text-center text-[11px] uppercase tracking-widest text-[#4B5563]">No expenses logged yet</div>
                ) : (
                  namedPayers.sort((a, b) => netBalances[b] - netBalances[a]).map((name) => {
                    const net = netBalances[name]
                    const isCreditor = net > 0
                    return (
                      <div key={name} className="rounded border border-[#21262d] bg-[#0d1117] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-[#C9D1D9]">{name}</div>
                            <div className="mt-0.5 text-[10px] text-[#8B949E]">
                              Paid <span className="font-mono text-[#C9D1D9]">${(payerTotals[name] || 0).toFixed(2)}</span>
                              {' · '}fair share <span className="font-mono text-[#C9D1D9]">${perPerson.toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-mono text-base font-black ${isCreditor ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                              {isCreditor ? '+' : ''}{net.toFixed(2)}
                            </div>
                            <div className={`text-[9px] uppercase tracking-widest ${isCreditor ? 'text-[#3FB950]' : 'text-[#F85149]'}`}>
                              {isCreditor ? 'owed back' : 'owes'}
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#21262d]">
                          <div
                            className={`h-full rounded-full ${isCreditor ? 'bg-[#3FB950]' : 'bg-[#F85149]'}`}
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
                {settlements.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-[#4B5563]">
                    <div className="text-[11px] uppercase tracking-widest">
                      {expenses.length === 0 ? 'No expenses yet' : 'All square — nothing to settle!'}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Outstanding transfers */}
                    {settlements.filter((t) => !isPaid(t)).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#8B949E]">Outstanding</div>
                        {settlements.filter((t) => !isPaid(t)).map((t, i) => (
                          <div key={i} className="flex items-center justify-between rounded border border-[#21262d] bg-[#0d1117] p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#F85149]/10 text-xs font-black text-[#F85149]">
                                {t.from[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-[#C9D1D9]">{t.from}</div>
                                <div className="text-[10px] text-[#8B949E]">sends to <span className="text-[#3FB950]">{t.to}</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-mono text-lg font-black text-[#D29922]">${t.amount.toFixed(2)}</div>
                                <div className="text-[9px] uppercase tracking-widest text-[#4B5563]">Venmo / Cash</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(t)}
                                className="flex items-center gap-1.5 rounded border border-[#30363D] bg-[#161b22] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#8B949E] hover:border-[#3FB950] hover:text-[#3FB950] transition-colors"
                              >
                                <Circle size={12} />
                                Mark Paid
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Settled transfers */}
                    {settlements.filter((t) => isPaid(t)).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#3FB950]/60">Settled</div>
                        {settlements.filter((t) => isPaid(t)).map((t, i) => (
                          <div key={i} className="flex items-center justify-between rounded border border-[#3FB950]/20 bg-[#3FB950]/5 p-4 opacity-60">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#3FB950]/10 text-xs font-black text-[#3FB950]">
                                <CheckCircle size={16} />
                              </div>
                              <div>
                                <div className="text-sm font-semibold line-through text-[#8B949E]">{t.from}</div>
                                <div className="text-[10px] text-[#4B5563]">paid <span className="text-[#8B949E]">{t.to}</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-mono text-lg font-black text-[#3FB950]">${t.amount.toFixed(2)}</div>
                                <div className="text-[9px] uppercase tracking-widest text-[#3FB950]/60">Settled</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleUnmarkPaid(t)}
                                className="text-[10px] text-[#4B5563] hover:text-[#8B949E] underline"
                              >
                                Undo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {settlements.every((t) => isPaid(t)) && (
                      <div className="rounded border border-[#3FB950]/30 bg-[#3FB950]/10 p-4 text-center">
                        <div className="text-sm font-black text-[#3FB950]">All settled up!</div>
                        <div className="mt-1 text-[10px] text-[#8B949E]">Everyone's square. Good trip.</div>
                      </div>
                    )}

                    <div className="rounded border border-[#30363D] bg-[#11161d] p-3 text-[10px] text-[#8B949E]">
                      Note: settlement assumes all {HEADCOUNT} guys split equally. If someone was absent for a specific expense, adjust the split count on that expense.
                    </div>
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
