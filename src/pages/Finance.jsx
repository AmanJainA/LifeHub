import { useEffect, useMemo, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useQuickAdd } from '../context/QuickAddContext'
import { Card, Button, Input, Select, Modal, Pill, EmptyState, Spinner } from '../components/ui'
import Reports from '../features/finance/Reports'
import { useListControls } from '../features/shared/useListControls'

const emptyExpense = { type: 'expense', amount: '', category: '', description: '', date: new Date().toISOString().slice(0, 10) }
const emptyBudget = { category: '', amount: '', month: new Date().toISOString().slice(0, 7) }
// Fallback only, used until expense_types finishes loading (or if the table is empty).
const FALLBACK_CATEGORIES = ['Food', 'Rent', 'Transport', 'Shopping', 'Bills', 'Health', 'Entertainment', 'Travel', 'Salary', 'Other']
const CHART_COLORS = ['#f5a623', '#35d0c0', '#ff6b6b', '#8b7cf6', '#4ade80', '#60a5fa', '#f472b6', '#fbbf24', '#a3e635', '#94a3b8']

export default function Finance() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState(null)
  const [budgets, setBudgets] = useState([])
  const [openExpense, setOpenExpense] = useState(false)
  const [openBudget, setOpenBudget] = useState(false)
  const [form, setForm] = useState(emptyExpense)
  const [budgetForm, setBudgetForm] = useState(emptyBudget)
  const [tab, setTab] = useState('overview')
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(emptyExpense)
  const [expenseTypes, setExpenseTypes] = useState([])
  const month = new Date().toISOString().slice(0, 7)

  const load = async () => {
    const [e, b, t] = await Promise.all([
      supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('budgets').select('*').eq('user_id', user.id).eq('month', month),
      supabase.from('expense_types').select('*').eq('is_active', true).order('name'),
    ])
    setExpenses(e.data || [])
    setBudgets(b.data || [])
    setExpenseTypes(t.data || [])
  }

  useEffect(() => { load() }, [user])

  // Categories shown in the dropdowns come from the admin-managed expense_types
  // table (falls back to a default list if it's empty, e.g. before the SQL
  // migration/admin has added anything).
  const categoriesFor = (kind) => {
    const names = expenseTypes.filter((t) => t.kind === kind || t.kind === 'both').map((t) => t.name)
    return names.length ? names : FALLBACK_CATEGORIES
  }
  const expenseCategoryOptions = categoriesFor(form.type)
  const editCategoryOptions = categoriesFor(editForm.type)

  useEffect(() => {
    if (expenseCategoryOptions.length && !expenseCategoryOptions.includes(form.category)) {
      setForm((f) => ({ ...f, category: expenseCategoryOptions[0] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type, expenseTypes])

  useEffect(() => {
    const opts = categoriesFor('expense')
    if (opts.length && !opts.includes(budgetForm.category)) {
      setBudgetForm((f) => ({ ...f, category: opts[0] }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseTypes])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpenExpense(true), 'Add transaction'), [setQuickAdd])

  const saveExpense = async (e) => {
    e.preventDefault()
    await supabase.from('expenses').insert({ ...form, user_id: user.id, amount: Number(form.amount) })
    setForm(emptyExpense)
    setOpenExpense(false)
    load()
  }

  const saveBudget = async (e) => {
    e.preventDefault()
    await supabase.from('budgets').upsert({ ...budgetForm, user_id: user.id, amount: Number(budgetForm.amount) }, { onConflict: 'user_id,category,month' })
    setBudgetForm(emptyBudget)
    setOpenBudget(false)
    load()
  }

  const removeExpense = async (id) => {
    await supabase.from('expenses').delete().eq('id', id)
    load()
  }

  const startEditExpense = (ex) => {
    setEditId(ex.id)
    setEditForm({ type: ex.type, amount: ex.amount, category: ex.category, description: ex.description || '', date: ex.date })
  }

  const saveEditExpense = async (e) => {
    e.preventDefault()
    await supabase.from('expenses').update({ ...editForm, amount: Number(editForm.amount) }).eq('id', editId)
    setEditId(null)
    load()
  }

  const monthExpenses = useMemo(() => (expenses || []).filter((e) => e.date?.slice(0, 7) === month), [expenses, month])
  const income = monthExpenses.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
  const spend = monthExpenses.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)

  const byCategory = useMemo(() => {
    const map = {}
    monthExpenses.filter((e) => e.type === 'expense').forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount) })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [monthExpenses])

  const budgetProgress = useMemo(() => budgets.map((b) => {
    const spent = monthExpenses.filter((e) => e.type === 'expense' && e.category === b.category).reduce((s, e) => s + Number(e.amount), 0)
    return { ...b, spent, pct: b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0 }
  }), [budgets, monthExpenses])

  const { visibleItems: visibleExpenses, Toolbar: expensesToolbar, PaginationBar: expensesPagination } = useListControls(expenses || [], {
    searchKeys: ['description', 'category'],
    dateKey: 'date',
    columns: [
      { label: 'Date', value: (r) => r.date },
      { label: 'Type', value: (r) => r.type },
      { label: 'Category', value: (r) => r.category },
      { label: 'Description', value: (r) => r.description || '' },
      { label: 'Amount', value: (r) => r.amount },
    ],
    filename: 'transactions',
    title: 'Transactions',
  })

  if (expenses === null) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Finance</h1>
          <p className="text-muted text-sm mt-1">Track income, spending, budgets & reports.</p>
        </div>
        {tab === 'overview' && (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpenBudget(true)}>Set budget</Button>
          </div>
        )}
      </div>

      <div className="flex gap-1 border-b border-border">
        {[{ id: 'overview', label: 'Overview' }, { id: 'reports', label: 'Reports' }].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-sm rounded-t-lg transition ${
              tab === t.id ? 'text-accent border-b-2 border-accent font-medium' : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'reports' ? (
        <Reports expenses={expenses} />
      ) : (
      <>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <p className="text-xs text-muted mb-1">Income (month)</p>
          <p className="text-lg sm:text-xl font-display font-semibold font-mono-num text-success">₹{income.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted mb-1">Spend (month)</p>
          <p className="text-lg sm:text-xl font-display font-semibold font-mono-num text-danger">₹{spend.toLocaleString('en-IN')}</p>
        </Card>
        <Card>
          <p className="text-xs text-muted mb-1">Net</p>
          <p className={`text-lg sm:text-xl font-display font-semibold font-mono-num ${income - spend >= 0 ? 'text-success' : 'text-danger'}`}>₹{(income - spend).toLocaleString('en-IN')}</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <h2 className="font-display font-semibold mb-3">Spending by category</h2>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No expenses logged this month.</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e2145', border: '1px solid #2b2f5c', borderRadius: 8, fontSize: 12 }} formatter={(v) => `₹${v}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="font-display font-semibold mb-3">Budgets this month</h2>
          {budgetProgress.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">No budgets set. Click "Set budget" to add one.</p>
          ) : (
            <div className="space-y-3">
              {budgetProgress.map((b) => (
                <div key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{b.category}</span>
                    <span className="text-muted font-mono-num">₹{b.spent} / ₹{b.amount}</span>
                  </div>
                  <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${b.pct >= 100 ? 'bg-danger' : b.pct >= 80 ? 'bg-accent' : 'bg-teal'}`} style={{ width: `${b.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-display font-semibold mb-3">All transactions</h2>
        {expenses.length === 0 ? (
          <EmptyState icon="💸" title="No transactions" subtitle="Log your first income or expense." />
        ) : (
          <div className="space-y-3">
            {expensesToolbar}
            {visibleExpenses.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">No transactions match your filters.</p>
            ) : (
              <div className="space-y-2">
                {visibleExpenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate">{e.description || e.category}</p>
                      <p className="text-xs text-muted">{e.category} · {e.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-mono-num ${e.type === 'income' ? 'text-success' : 'text-danger'}`}>
                        {e.type === 'income' ? '+' : '-'}₹{Number(e.amount).toLocaleString('en-IN')}
                      </span>
                      <button onClick={() => startEditExpense(e)} className="text-muted hover:text-accent"><Pencil size={14} /></button>
                      <button onClick={() => removeExpense(e.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {expensesPagination}
          </div>
        )}
      </Card>
      </>
      )}

      <Modal open={openExpense} onClose={() => setOpenExpense(false)} title="Add transaction">
        <form onSubmit={saveExpense} className="space-y-3">
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <Input label="Amount (₹)" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {expenseCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <Button type="submit" className="w-full">Save transaction</Button>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Edit transaction">
        <form onSubmit={saveEditExpense} className="space-y-3">
          <Select label="Type" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
          <Input label="Amount (₹)" type="number" step="0.01" required value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })} />
          <Select label="Category" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
            {editCategoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <Input label="Date" type="date" required value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Modal>

      <Modal open={openBudget} onClose={() => setOpenBudget(false)} title="Set monthly budget">
        <form onSubmit={saveBudget} className="space-y-3">
          <Select label="Category" value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })}>
            {categoriesFor('expense').map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Monthly limit (₹)" type="number" required value={budgetForm.amount} onChange={(e) => setBudgetForm({ ...budgetForm, amount: e.target.value })} />
          <Input label="Month" type="month" required value={budgetForm.month} onChange={(e) => setBudgetForm({ ...budgetForm, month: e.target.value })} />
          <Button type="submit" className="w-full">Save budget</Button>
        </form>
      </Modal>
    </div>
  )
}
