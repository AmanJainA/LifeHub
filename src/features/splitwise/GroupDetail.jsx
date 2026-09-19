import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Trash2, HandCoins } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { Card, Button, Input, Select, Modal, Pill, EmptyState, Spinner } from '../../components/ui'
import { useListControls } from '../shared/useListControls'

export default function GroupDetail({ groupId, onBack }) {
  const { user } = useAuth()
  const [group, setGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [settlements, setSettlements] = useState([])
  const [loading, setLoading] = useState(true)

  const [openExpense, setOpenExpense] = useState(false)
  const [openSettle, setOpenSettle] = useState(false)
  const [form, setForm] = useState({ description: '', amount: '', category: 'General', date: new Date().toISOString().slice(0, 10), paid_by: user.id, selected: [] })
  const [settleForm, setSettleForm] = useState({ from_user: user.id, to_user: '', amount: '' })

  const load = async () => {
    setLoading(true)
    const [g, m, e, s] = await Promise.all([
      supabase.from('sw_groups').select('*').eq('id', groupId).single(),
      supabase.from('sw_group_members').select('user_id, profiles(id, name, email, avatar)').eq('group_id', groupId),
      supabase.from('sw_expenses').select('*, sw_expense_shares(user_id, share_amount, settled)').eq('group_id', groupId).order('date', { ascending: false }),
      supabase.from('sw_settlements').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ])
    setGroup(g.data)
    const memberList = (m.data || []).map((x) => x.profiles).filter(Boolean)
    setMembers(memberList)
    setExpenses(e.data || [])
    setSettlements(s.data || [])
    setForm((f) => ({ ...f, selected: memberList.map((mm) => mm.id) }))
    setLoading(false)
  }

  useEffect(() => { load() }, [groupId])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpenExpense(true), 'Add expense'), [setQuickAdd])

  const saveExpense = async (e) => {
    e.preventDefault()
    const amount = Number(form.amount)
    const selected = form.selected.length ? form.selected : members.map((m) => m.id)
    const { data: exp, error } = await supabase.from('sw_expenses').insert({
      group_id: groupId, paid_by: form.paid_by, description: form.description, amount, category: form.category, date: form.date,
    }).select().single()
    if (error) return
    const share = Math.round((amount / selected.length) * 100) / 100
    const shares = selected.map((uid) => ({ expense_id: exp.id, user_id: uid, share_amount: share, settled: uid === form.paid_by }))
    await supabase.from('sw_expense_shares').insert(shares)
    setOpenExpense(false)
    setForm({ description: '', amount: '', category: 'General', date: new Date().toISOString().slice(0, 10), paid_by: user.id, selected: members.map((m) => m.id) })
    load()
  }

  const removeExpense = async (id) => {
    await supabase.from('sw_expenses').delete().eq('id', id)
    load()
  }

  const saveSettlement = async (e) => {
    e.preventDefault()
    await supabase.from('sw_settlements').insert({ group_id: groupId, from_user: settleForm.from_user, to_user: settleForm.to_user, amount: Number(settleForm.amount) })
    setOpenSettle(false)
    setSettleForm({ from_user: user.id, to_user: '', amount: '' })
    load()
  }

  // Net balance per member: positive = they are owed overall in this group
  const balances = useMemo(() => {
    const net = {}
    members.forEach((m) => { net[m.id] = 0 })
    expenses.forEach((exp) => {
      net[exp.paid_by] = (net[exp.paid_by] || 0) + Number(exp.amount)
      ;(exp.sw_expense_shares || []).forEach((s) => {
        net[s.user_id] = (net[s.user_id] || 0) - Number(s.share_amount)
      })
    })
    settlements.forEach((s) => {
      net[s.from_user] = (net[s.from_user] || 0) + Number(s.amount)
      net[s.to_user] = (net[s.to_user] || 0) - Number(s.amount)
    })
    return net
  }, [members, expenses, settlements])

  const nameOf = (id) => members.find((m) => m.id === id)?.name || '—'
  const avatarOf = (id) => members.find((m) => m.id === id)?.avatar || '🙂'

  const { visibleItems: visibleExpenses, Toolbar: expensesToolbar, PaginationBar: expensesPagination } = useListControls(expenses, {
    searchKeys: ['description', 'category'],
    dateKey: 'date',
    columns: [
      { label: 'Date', value: (r) => r.date },
      { label: 'Description', value: (r) => r.description || '' },
      { label: 'Category', value: (r) => r.category },
      { label: 'Paid by', value: (r) => (r.paid_by === user.id ? 'You' : nameOf(r.paid_by)) },
      { label: 'Amount', value: (r) => r.amount },
    ],
    filename: `${group?.name || 'splitwise'}-expenses`,
    title: `${group?.name || 'Splitwise'} — Expenses`,
  })

  if (loading || !group) return <Spinner />

  const myBalance = balances[user.id] || 0

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted hover:text-text">
        <ArrowLeft size={15} /> All groups
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{group.name}</h1>
          <p className="text-sm mt-1">
            {myBalance === 0 ? <span className="text-muted">You're all settled up</span>
              : myBalance > 0 ? <span className="text-success">You are owed ₹{myBalance.toFixed(2)}</span>
              : <span className="text-danger">You owe ₹{Math.abs(myBalance).toFixed(2)}</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setOpenSettle(true)}><HandCoins size={15} className="inline -mt-0.5 mr-1" />Settle up</Button>
        </div>
      </div>

      <Card>
        <h2 className="font-display font-semibold mb-3">Balances</h2>
        <div className="space-y-2">
          {members.map((m) => {
            const b = balances[m.id] || 0
            return (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">{m.avatar} {m.id === user.id ? 'You' : m.name}</span>
                <span className={`font-mono-num ${b > 0.01 ? 'text-success' : b < -0.01 ? 'text-danger' : 'text-muted'}`}>
                  {b > 0.01 ? `is owed ₹${b.toFixed(2)}` : b < -0.01 ? `owes ₹${Math.abs(b).toFixed(2)}` : 'settled'}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="font-display font-semibold mb-3">Expenses</h2>
        {expenses.length === 0 ? (
          <EmptyState icon="🧾" title="No expenses yet" subtitle="Add the first shared expense for this group." />
        ) : (
          <div className="space-y-3">
            {expensesToolbar}
            {visibleExpenses.length === 0 ? (
              <p className="text-sm text-muted py-6 text-center">No expenses match your filters.</p>
            ) : (
              <div className="space-y-2">
                {visibleExpenses.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/60 last:border-0">
                    <div className="min-w-0">
                      <p className="truncate">{exp.description || exp.category}</p>
                      <p className="text-xs text-muted">Paid by {exp.paid_by === user.id ? 'you' : nameOf(exp.paid_by)} · {exp.category} · {exp.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono-num">₹{Number(exp.amount).toLocaleString('en-IN')}</span>
                      <button onClick={() => removeExpense(exp.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {expensesPagination}
          </div>
        )}
      </Card>

      {settlements.length > 0 && (
        <Card>
          <h2 className="font-display font-semibold mb-3">Settlement history</h2>
          <div className="space-y-2">
            {settlements.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span>{avatarOf(s.from_user)} {s.from_user === user.id ? 'You' : nameOf(s.from_user)} paid {s.to_user === user.id ? 'you' : nameOf(s.to_user)}</span>
                <span className="font-mono-num text-success">₹{Number(s.amount).toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal open={openExpense} onClose={() => setOpenExpense(false)} title="Add group expense">
        <form onSubmit={saveExpense} className="space-y-3">
          <Input label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Amount (₹)" type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label="Date" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
          <Select label="Paid by" value={form.paid_by} onChange={(e) => setForm({ ...form, paid_by: e.target.value })}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.id === user.id ? 'You' : m.name}</option>)}
          </Select>
          <div>
            <span className="block text-xs text-muted mb-1">Split equally between</span>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const checked = form.selected.includes(m.id)
                return (
                  <button type="button" key={m.id}
                    onClick={() => setForm({ ...form, selected: checked ? form.selected.filter((id) => id !== m.id) : [...form.selected, m.id] })}
                    className={`text-xs px-2.5 py-1.5 rounded-full border ${checked ? 'bg-accent/15 border-accent text-accent' : 'border-border text-muted'}`}>
                    {m.id === user.id ? 'You' : m.name}
                  </button>
                )
              })}
            </div>
          </div>
          <Button type="submit" className="w-full">Save expense</Button>
        </form>
      </Modal>

      <Modal open={openSettle} onClose={() => setOpenSettle(false)} title="Settle up">
        <form onSubmit={saveSettlement} className="space-y-3">
          <Select label="From" value={settleForm.from_user} onChange={(e) => setSettleForm({ ...settleForm, from_user: e.target.value })}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.id === user.id ? 'You' : m.name}</option>)}
          </Select>
          <Select label="To" required value={settleForm.to_user} onChange={(e) => setSettleForm({ ...settleForm, to_user: e.target.value })}>
            <option value="">Select member</option>
            {members.filter((m) => m.id !== settleForm.from_user).map((m) => <option key={m.id} value={m.id}>{m.id === user.id ? 'You' : m.name}</option>)}
          </Select>
          <Input label="Amount (₹)" type="number" step="0.01" required value={settleForm.amount} onChange={(e) => setSettleForm({ ...settleForm, amount: e.target.value })} />
          <Button type="submit" className="w-full">Record settlement</Button>
        </form>
      </Modal>
    </div>
  )
}
