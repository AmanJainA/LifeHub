import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { Card, Select, Input, Spinner } from '../../components/ui'
import ExportMenu from '../../components/ExportMenu'

function sumBy(rows, keyFn) {
  const map = {}
  rows.forEach((r) => { const k = keyFn(r); map[k] = (map[k] || 0) + Number(r.amount) })
  return map
}
function totalOf(map) { return Object.values(map).reduce((a, b) => a + b, 0) }
function fmt(n) { return `₹${Math.round(n).toLocaleString('en-IN')}` }

function lastNMonths(n) {
  const arr = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    arr.push({ key: d.toISOString().slice(0, 7), label: d.toLocaleDateString('en-IN', { month: 'short' }) })
  }
  return arr
}
function lastNYears(n) {
  const arr = []
  const y = new Date().getFullYear()
  for (let i = n - 1; i >= 0; i--) arr.push({ key: String(y - i), label: String(y - i) })
  return arr
}

export default function Reports({ expenses }) {
  const { user } = useAuth()
  const [periodType, setPeriodType] = useState('month') // 'month' | 'year'
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [sw, setSw] = useState(null) // { receivable, payable }

  useEffect(() => { loadSplitwiseBalances() }, [user])

  async function loadSplitwiseBalances() {
    const { data: memberships } = await supabase.from('sw_group_members').select('group_id').eq('user_id', user.id)
    const groupIds = (memberships || []).map((m) => m.group_id)
    if (!groupIds.length) { setSw({ receivable: 0, payable: 0 }); return }

    const [expRes, settleRes] = await Promise.all([
      supabase.from('sw_expenses').select('*, sw_expense_shares(user_id, share_amount)').in('group_id', groupIds),
      supabase.from('sw_settlements').select('*').in('group_id', groupIds),
    ])

    const netByGroup = {}
    ;(expRes.data || []).forEach((exp) => {
      netByGroup[exp.group_id] = netByGroup[exp.group_id] || 0
      if (exp.paid_by === user.id) netByGroup[exp.group_id] += Number(exp.amount)
      ;(exp.sw_expense_shares || []).forEach((s) => {
        if (s.user_id === user.id) netByGroup[exp.group_id] -= Number(s.share_amount)
      })
    })
    ;(settleRes.data || []).forEach((s) => {
      netByGroup[s.group_id] = netByGroup[s.group_id] || 0
      if (s.from_user === user.id) netByGroup[s.group_id] += Number(s.amount)
      if (s.to_user === user.id) netByGroup[s.group_id] -= Number(s.amount)
    })

    let receivable = 0, payable = 0
    Object.values(netByGroup).forEach((v) => { if (v > 0.01) receivable += v; else if (v < -0.01) payable += Math.abs(v) })
    setSw({ receivable, payable })
  }

  const periodStart = periodType === 'month' ? `${month}-01` : `${year}-01-01`
  const inPeriod = (e) => (periodType === 'month' ? e.date?.slice(0, 7) === month : e.date?.slice(0, 4) === year)

  const periodExpenses = useMemo(() => expenses.filter(inPeriod), [expenses, periodType, month, year])
  const priorExpenses = useMemo(() => expenses.filter((e) => e.date < periodStart), [expenses, periodType, month, year])
  const allUpToPeriodEnd = useMemo(() => {
    const periodEnd = periodType === 'month'
      ? new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10)
      : `${year}-12-31`
    return expenses.filter((e) => e.date <= periodEnd)
  }, [expenses, periodType, month, year])

  const incomeByCat = sumBy(periodExpenses.filter((e) => e.type === 'income'), (e) => e.category)
  const expenseByCat = sumBy(periodExpenses.filter((e) => e.type === 'expense'), (e) => e.category)
  const totalIncome = totalOf(incomeByCat)
  const totalExpense = totalOf(expenseByCat)
  const netPL = totalIncome - totalExpense

  const netOf = (rows) => rows.reduce((s, e) => s + (e.type === 'income' ? Number(e.amount) : -Number(e.amount)), 0)
  const openingBalance = netOf(priorExpenses)
  const closingBalance = openingBalance + netPL
  const cashOnHandToDate = netOf(allUpToPeriodEnd)

  const trend = useMemo(() => {
    const buckets = periodType === 'month' ? lastNMonths(6) : lastNYears(5)
    return buckets.map((b) => {
      const rows = expenses.filter((e) => (periodType === 'month' ? e.date?.slice(0, 7) === b.key : e.date?.slice(0, 4) === b.key))
      const inc = rows.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
      const exp = rows.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
      return { label: b.label, 'Net P&L': inc - exp }
    })
  }, [expenses, periodType])

  if (sw === null) return <Spinner />

  const netWorth = cashOnHandToDate + sw.receivable - sw.payable
  const periodLabel = periodType === 'month' ? month : year

  const reportRows = [
    { section: 'P&L', label: 'Total Income', value: totalIncome },
    ...Object.entries(incomeByCat).map(([cat, amt]) => ({ section: 'P&L — Income', label: cat, value: amt })),
    { section: 'P&L', label: 'Total Expenses', value: totalExpense },
    ...Object.entries(expenseByCat).map(([cat, amt]) => ({ section: 'P&L — Expenses', label: cat, value: amt })),
    { section: 'P&L', label: 'Net Profit / Loss', value: netPL },
    { section: 'Cash Flow', label: 'Opening balance', value: openingBalance },
    { section: 'Cash Flow', label: 'Cash inflow', value: totalIncome },
    { section: 'Cash Flow', label: 'Cash outflow', value: totalExpense },
    { section: 'Cash Flow', label: 'Net cash flow', value: netPL },
    { section: 'Cash Flow', label: 'Closing balance', value: closingBalance },
    { section: 'Balance Sheet — Assets', label: 'Cash & savings (cumulative)', value: cashOnHandToDate },
    { section: 'Balance Sheet — Assets', label: 'Owed to you (Splitwise)', value: sw.receivable },
    { section: 'Balance Sheet — Liabilities', label: 'You owe (Splitwise)', value: sw.payable },
    { section: 'Balance Sheet', label: 'Net Worth', value: netWorth },
  ]
  const reportColumns = [
    { label: 'Section', value: (r) => r.section },
    { label: 'Line item', value: (r) => r.label },
    { label: 'Amount (₹)', value: (r) => Math.round(r.value) },
  ]

  return (
    <div className="space-y-5">
      {/* Period selector */}
      <Card className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Select label="Period" value={periodType} onChange={(e) => setPeriodType(e.target.value)} className="w-32">
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </Select>
          {periodType === 'month' ? (
            <Input label="Month" type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-40" />
          ) : (
            <Input label="Year" type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-28" />
          )}
        </div>
        <ExportMenu rows={reportRows} columns={reportColumns} filename={`financial-report-${periodLabel}`} title={`Financial Report — ${periodLabel}`} />
      </Card>

      {/* Net P&L trend */}
      <Card>
        <h2 className="font-display font-semibold mb-3 text-sm">Net P&L trend ({periodType === 'month' ? 'last 6 months' : 'last 5 years'})</h2>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: '#9498c2', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9498c2', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: '#1e2145', border: '1px solid #2b2f5c', borderRadius: 8, fontSize: 12 }} formatter={(v) => `₹${v}`} />
              <Bar dataKey="Net P&L" radius={[4, 4, 0, 0]}>
                {trend.map((t, i) => <Cell key={i} fill={t['Net P&L'] >= 0 ? '#4ade80' : '#ff6b6b'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* P&L Statement */}
        <Card>
          <h2 className="font-display font-semibold mb-3 text-sm">Profit &amp; Loss Statement</h2>
          <p className="text-[11px] text-muted mb-3">{periodType === 'month' ? month : year}</p>

          <p className="text-xs font-semibold text-success mb-1.5">Income</p>
          {Object.keys(incomeByCat).length === 0 ? (
            <p className="text-xs text-muted mb-3">No income recorded.</p>
          ) : (
            <div className="space-y-1 mb-3">
              {Object.entries(incomeByCat).map(([cat, amt]) => (
                <Row key={cat} label={cat} value={fmt(amt)} />
              ))}
            </div>
          )}

          <p className="text-xs font-semibold text-danger mb-1.5">Expenses</p>
          {Object.keys(expenseByCat).length === 0 ? (
            <p className="text-xs text-muted mb-3">No expenses recorded.</p>
          ) : (
            <div className="space-y-1 mb-3">
              {Object.entries(expenseByCat).map(([cat, amt]) => (
                <Row key={cat} label={cat} value={fmt(amt)} />
              ))}
            </div>
          )}

          <div className="pt-2 mt-1 border-t border-border flex justify-between items-center">
            <span className="text-sm font-semibold">Net Profit / Loss</span>
            <span className={`font-mono-num font-semibold ${netPL >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(netPL)}</span>
          </div>
        </Card>

        {/* Cash Flow Statement */}
        <Card>
          <h2 className="font-display font-semibold mb-3 text-sm">Cash Flow Statement</h2>
          <p className="text-[11px] text-muted mb-3">{periodType === 'month' ? month : year}</p>
          <div className="space-y-1.5">
            <Row label="Opening balance" value={fmt(openingBalance)} />
            <Row label="Cash inflow (income)" value={`+ ${fmt(totalIncome)}`} valueTone="text-success" />
            <Row label="Cash outflow (expenses)" value={`− ${fmt(totalExpense)}`} valueTone="text-danger" />
          </div>
          <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
            <span className="text-sm font-semibold">Net Cash Flow</span>
            <span className={`font-mono-num font-semibold ${netPL >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(netPL)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-border flex justify-between items-center">
            <span className="text-sm font-semibold">Closing balance</span>
            <span className="font-mono-num font-semibold">{fmt(closingBalance)}</span>
          </div>
        </Card>

        {/* Balance Sheet (approximate, personal-finance style) */}
        <Card>
          <h2 className="font-display font-semibold mb-3 text-sm">Balance Sheet</h2>
          <p className="text-[11px] text-muted mb-3">As of end of {periodType === 'month' ? month : year} · Splitwise reflects current standing</p>

          <p className="text-xs font-semibold text-teal mb-1.5">Assets</p>
          <div className="space-y-1 mb-3">
            <Row label="Cash & savings (cumulative)" value={fmt(cashOnHandToDate)} />
            <Row label="Owed to you (Splitwise)" value={fmt(sw.receivable)} />
          </div>

          <p className="text-xs font-semibold text-danger mb-1.5">Liabilities</p>
          <div className="space-y-1 mb-3">
            <Row label="You owe (Splitwise)" value={fmt(sw.payable)} />
          </div>

          <div className="pt-2 mt-1 border-t border-border flex justify-between items-center">
            <span className="text-sm font-semibold">Net Worth</span>
            <span className={`font-mono-num font-semibold ${netWorth >= 0 ? 'text-success' : 'text-danger'}`}>{fmt(netWorth)}</span>
          </div>
        </Card>
      </div>

      <p className="text-[11px] text-muted">
        These statements are generated from your logged income/expenses and Splitwise balances — a personal-finance
        approximation, not formal accounting output.
      </p>
    </div>
  )
}

function Row({ label, value, valueTone = '' }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted">{label}</span>
      <span className={`font-mono-num ${valueTone}`}>{value}</span>
    </div>
  )
}
