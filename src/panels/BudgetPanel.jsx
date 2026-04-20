import { useState } from 'react'
import { CheckCircle, Circle, DollarSign, Edit2, Plus, Trash2, X } from 'lucide-react'
import { useSupabaseTable } from '../hooks/useSupabaseTable'

const HEADCOUNT = 14
const CATEGORIES = ['house', 'golf', 'food', 'drinks', 'transport', 'activities', 'other']

const CATEGORY_COLORS = {
  house:      'text-[#BA1323] bg-[#BA1323]/10 border-[#BA1323]/30',
  golf:       'text-[#48B040] bg-[#48B040]/10 border-[#48B040]/30',
  food:       'text-[#C4952A] bg-[#C4952A]/10 border-[#C4952A]/30',
  drinks:     'text-[#C4952A] bg-[#C4952A]/10 border-[#C4952A]/30',
  transport:  'text-[#D4601A] bg-[#D4601A]/10 border-[#D4601A]/30',
  activities: 'text-[#48B040] bg-[#48B040]/10 border-[#48B040]/30',
  other:      'text-[#9A8070] bg-[#9A8070]/10 border-[#9A8070]/30',
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
        <button type="button" onClick={onCancel} className="px-4 py-2 text-xs text-[#9A8070] hover:text-[#F2E4D0]">Cancel</button>
        <button type="submit" disabled={saving} className="rounded bg-[#BA1323] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#140a06] hover:bg-[#79b8ff] disabled:opacity-50">
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

  // Use active roster members as the group; fall back to HEADCOUNT if roster is empty
  const activeRoster = roster.filter((r) => r.status !== 'Ghosting')
  const groupSize = activeRoster.length > 0 ? activeRoster.length : HEADCOUNT
  const perPerson = groupSize > 0 ? totalSpent / groupSize : 0

  // Category breakdown
  const byCategory = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = expenses.filter((e) => e.category === cat).reduce((s, e) => s + Number(e.amount), 0)
    return acc
  }, {})

  // How much each person has paid out
  const payerTotals = {}
  expenses.forEach((e) => {
    const payer = e.paid_by?.trim()
    if (!payer) return
    payerTotals[payer] = (payerTotals[payer] || 0) + Number(e.amount)
  })

  // All people in the group: roster members + anyone who appears as a payer
  // (in case they logged an expense before being added to the roster)
  const rosterNames = activeRoster.map((r) => r.name.trim())
  const payerNames = Object.keys(payerTotals)
  const allPeople = [...new Set([...rosterNames, ...payerNames])]

  // Net balance = what they paid - their fair share of all expenses
  const netBalances = {}
  allPeople.forEach((name) => {
    netBalances[name] = (payerTotals[name] || 0) - perPerson
  })

  const namedPayers = payerNames
  const settlements = computeSettlement(netBalances)

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

        {/* Stats */}
        <div className="mt-3 flex flex-wrap gap-6">
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#F2E4D0]">${totalSpent.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Total Spent</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#C4952A]">${perPerson.toFixed(0)}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Per Person</div>
          </div>
          <div className="text-center">
            <div className="font-mono text-xl font-black text-[#BA1323]">{expenses.length}</div>
            <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Expenses</div>
          </div>
          {settlements.length > 0 && (
            <div className="text-center">
              <div className="font-mono text-xl font-black text-[#C4952A]">{settlements.filter((t) => !isPaid(t)).length}</div>
              <div className="text-[9px] uppercase tracking-widest text-[#9A8070]">Outstanding</div>
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
              className={`rounded px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors ${view === v ? 'bg-[#BA1323]/15 text-[#BA1323]' : 'text-[#5C3820] hover:text-[#9A8070]'}`}
            >
              {VIEW_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:flex-1 md:overflow-auto md:p-6">
        {loading ? (
          <div className="flex h-48 items-center justify-center text-[#9A8070]">
            <span className="text-[11px] uppercase tracking-widest">Loading…</span>
          </div>
        ) : (
          <>
            {/* EXPENSES VIEW */}
            {view === 'expenses' && (
              <div className="flex flex-col gap-4">
                {/* Category breakdown bar */}
                {totalSpent > 0 && (
                  <div className="rounded border border-[#3C1810] bg-[#180C07] p-4">
                    <div className="mb-3 text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">Breakdown by Category</div>
                    {/* Visual bar */}
                    <div className="mb-3 flex h-2 w-full overflow-hidden rounded-full bg-[#281408]">
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
                          <div className="text-[9px] capitalize text-[#9A8070]">{c}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expense list */}
                {expenses.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-16 text-[#5C3820]">
                    <DollarSign size={32} strokeWidth={1} />
                    <span className="text-[11px] uppercase tracking-widest">No expenses logged yet</span>
                    <button type="button" onClick={() => setModal({ mode: 'add' })} className="text-[11px] font-bold uppercase tracking-wider text-[#BA1323] hover:text-[#79b8ff]">
                      Log the first expense
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {expenses.map((e) => {
                      const share = Number(e.amount) / (Number(e.split_count) || HEADCOUNT)
                      return (
                        <div key={e.id} className="group flex items-center gap-3 rounded border border-[#281408] bg-[#140a06] p-3 hover:border-[#3C1810]">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${CATEGORY_COLORS[e.category] || CATEGORY_COLORS.other}`}>
                                {e.category}
                              </span>
                              <span className="truncate text-sm font-semibold text-[#F2E4D0]">{e.description}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-4 flex-wrap">
                              <span className="text-[10px] text-[#9A8070]">Paid by <span className="text-[#F2E4D0]">{e.paid_by}</span></span>
                              <span className="text-[10px] text-[#9A8070]">Split {e.split_count || HEADCOUNT} ways · <span className="font-mono text-[#C4952A]">${share.toFixed(2)}/person</span></span>
                              {e.notes && <span className="text-[10px] italic text-[#5C3820]">{e.notes}</span>}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="font-mono text-sm font-black text-[#48B040]">${Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
                              <button type="button" onClick={() => setModal({ mode: 'edit', row: e })} className="p-1 text-[#5C3820] hover:text-[#BA1323]"><Edit2 size={12} /></button>
                              <button type="button" onClick={() => { if (window.confirm('Delete this expense?')) remove(e.id) }} className="p-1 text-[#5C3820] hover:text-[#E83025]"><Trash2 size={12} /></button>
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
                  Who paid what vs. their fair share (${perPerson.toFixed(2)} each · {groupSize} people)
                </div>
                {allPeople.length === 0 ? (
                  <div className="py-12 text-center text-[11px] uppercase tracking-widest text-[#5C3820]">No expenses logged yet</div>
                ) : (
                  allPeople.sort((a, b) => netBalances[b] - netBalances[a]).map((name) => {
                    const net = netBalances[name]
                    const isCreditor = net > 0
                    return (
                      <div key={name} className="rounded border border-[#281408] bg-[#140a06] p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-[#F2E4D0]">{name}</div>
                            <div className="mt-0.5 text-[10px] text-[#9A8070]">
                              Paid <span className="font-mono text-[#F2E4D0]">${(payerTotals[name] || 0).toFixed(2)}</span>
                              {' · '}owes <span className="font-mono text-[#F2E4D0]">${perPerson.toFixed(2)}</span>
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
                        {/* Progress bar */}
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
                    {/* Outstanding transfers */}
                    {settlements.filter((t) => !isPaid(t)).length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9A8070]">Outstanding</div>
                        {settlements.filter((t) => !isPaid(t)).map((t, i) => (
                          <div key={i} className="flex items-center justify-between rounded border border-[#281408] bg-[#140a06] p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-[#E83025]/10 text-xs font-black text-[#E83025]">
                                {t.from[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-[#F2E4D0]">{t.from}</div>
                                <div className="text-[10px] text-[#9A8070]">sends to <span className="text-[#48B040]">{t.to}</span></div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="font-mono text-lg font-black text-[#C4952A]">${t.amount.toFixed(2)}</div>
                                <div className="text-[9px] uppercase tracking-widest text-[#5C3820]">Venmo / Cash</div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(t)}
                                className="flex items-center gap-1.5 rounded border border-[#3C1810] bg-[#1C0C08] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9A8070] hover:border-[#48B040] hover:text-[#48B040] transition-colors"
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
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#48B040]/60">Settled</div>
                        {settlements.filter((t) => isPaid(t)).map((t, i) => (
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
                              <button
                                type="button"
                                onClick={() => handleUnmarkPaid(t)}
                                className="text-[10px] text-[#5C3820] hover:text-[#9A8070] underline"
                              >
                                Undo
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {settlements.every((t) => isPaid(t)) && (
                      <div className="rounded border border-[#48B040]/30 bg-[#48B040]/10 p-4 text-center">
                        <div className="text-sm font-black text-[#48B040]">All settled up!</div>
                        <div className="mt-1 text-[10px] text-[#9A8070]">Everyone's square. Good trip.</div>
                      </div>
                    )}

                    <div className="rounded border border-[#3C1810] bg-[#180C07] p-3 text-[10px] text-[#9A8070]">
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
