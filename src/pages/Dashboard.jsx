import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckSquare, Wallet, Banknote, Lightbulb, Target, ArrowUpRight, Bell, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useQuickAdd } from '../context/QuickAddContext'
import { Card, Button, Input, Select, Modal, Pill, EmptyState, Spinner } from '../components/ui'
import { useGlobalSearch } from '../features/search/useGlobalSearch'
import SearchResults from '../features/search/SearchResults'

function monthKey(d) { return d.toISOString().slice(0, 7) }
function startOfMonthISO() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function last6Months() {
  const arr = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    arr.push({ key: monthKey(d), label: d.toLocaleDateString('en-IN', { month: 'short' }) })
  }
  return arr
}

const priorityTone = { high: 'danger', medium: 'accent', low: 'muted' }
const ideaStatusTone = { new: 'accent', wip: 'teal', done: 'success', shelved: 'muted' }

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [openTask, setOpenTask] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', priority: 'medium', due_date: '' })

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpenTask(true), 'Quick Add'), [setQuickAdd])

  const search = useGlobalSearch()

  const load = async () => {
    setLoading(true)
    const today = new Date().toISOString().slice(0, 10)
    const monthStart = startOfMonthISO()
    const sixMoStart = last6Months()[0].key + '-01'

    const [tasksRes, goalsRes, ideasRes, remindersRes, expensesRes] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('reminders').select('*').eq('user_id', user.id).eq('done', false).order('remind_at', { ascending: true }),
      supabase.from('expenses').select('*').eq('user_id', user.id).gte('date', sixMoStart),
    ])

    setData({
      tasks: tasksRes.data || [],
      goals: goalsRes.data || [],
      ideas: ideasRes.data || [],
      reminders: remindersRes.data || [],
      expenses: expensesRes.data || [],
      today,
      monthStart,
    })
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const saveTask = async (e) => {
    e.preventDefault()
    await supabase.from('tasks').insert({ ...taskForm, user_id: user.id, due_date: taskForm.due_date || null })
    setTaskForm({ title: '', priority: 'medium', due_date: '' })
    setOpenTask(false)
    load()
  }

  const stats = useMemo(() => {
    if (!data) return null
    const tasksToday = data.tasks.filter((t) => t.status === 'pending' && t.due_date === data.today).length
    const monthExpenses = data.expenses.filter((e) => e.date?.slice(0, 7) === data.monthStart.slice(0, 7))
    const income = monthExpenses.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0)
    const expense = monthExpenses.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0)
    const newIdeas = data.ideas.filter((i) => i.status === 'new').length
    const activeGoals = data.goals.filter((g) => g.status === 'active')
    return { tasksToday, income, expense, newIdeas, activeGoalsCount: activeGoals.length, activeGoals }
  }, [data])

  const chartData = useMemo(() => {
    if (!data) return []
    const months = last6Months()
    return months.map((m) => {
      const rows = data.expenses.filter((e) => e.date?.slice(0, 7) === m.key)
      return {
        month: m.label,
        Income: rows.filter((e) => e.type === 'income').reduce((s, e) => s + Number(e.amount), 0),
        Expense: rows.filter((e) => e.type === 'expense').reduce((s, e) => s + Number(e.amount), 0),
      }
    })
  }, [data])

  if (loading || !data || !stats) return <Spinner />

  const recentTasks = data.tasks.slice(0, 5)
  const activeGoals = stats.activeGoals.slice(0, 4)
  const upcomingReminders = data.reminders.slice(0, 4)
  const latestIdeas = data.ideas.slice(0, 4)
  const now = new Date()

  return (
    <div className="space-y-5">
      {/* Universal search — title, content, category & date across everything */}
      <Card>
        <div className="flex items-center gap-2.5">
          <Search size={16} className="text-muted shrink-0" />
          <input
            value={search.query}
            onChange={(e) => search.setQuery(e.target.value)}
            placeholder="Search tasks, notes, goals, transactions, splitwise… (title, content, category, date)"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted/60"
          />
        </div>
        {search.hasQuery && (
          <div className="mt-3 pt-3 border-t border-border">
            <SearchResults results={search.results} loading={search.loading} hasQuery={search.hasQuery} />
          </div>
        )}
      </Card>

      {/* Stat cards — mirrors DevPanel: Tasks due today / Month income / Month spent / New ideas / Active goals */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard icon={CheckSquare} label="Tasks due today" value={stats.tasksToday} meta="Pending today" to="/life" bar="bg-gradient-to-r from-accent to-[#a78bfa]" iconTone="text-accent" />
        <StatCard icon={Banknote} label="Month income" value={`₹${stats.income.toLocaleString('en-IN')}`} meta="This month" to="/finance" bar="bg-gradient-to-r from-success to-[#4ade80]" iconTone="text-success" />
        <StatCard icon={Wallet} label="Month spent" value={`₹${stats.expense.toLocaleString('en-IN')}`} meta="This month" to="/finance" bar="bg-gradient-to-r from-danger to-[#fb923c]" iconTone="text-danger" />
        <StatCard icon={Lightbulb} label="New ideas" value={stats.newIdeas} meta="Status: new" to="/life" bar="bg-gradient-to-r from-teal to-[#818cf8]" iconTone="text-teal" />
        <StatCard icon={Target} label="Active goals" value={stats.activeGoalsCount} meta="In progress" to="/life" bar="bg-gradient-to-r from-[#fbbf24] to-[#fb923c]" iconTone="text-[#fbbf24]" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Tasks */}
        <Card>
          <PanelHeader icon="✅" title="Recent Tasks" to="/life" />
          {recentTasks.length === 0 ? (
            <EmptyState icon="📋" title="No tasks yet" />
          ) : (
            <div className="space-y-2">
              {recentTasks.map((t) => (
                <div key={t.id} className="flex items-start gap-2.5 py-1.5">
                  <span className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 text-[10px] ${t.status === 'done' ? 'bg-success border-success text-onaccent' : 'border-border text-transparent'}`}>✓</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm truncate ${t.status === 'done' ? 'line-through text-muted' : ''}`}>{t.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Pill tone={priorityTone[t.priority]}>{t.priority}</Pill>
                      {t.due_date && <span className="text-[11px] text-muted">📅 {t.due_date}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Goals */}
        <Card>
          <PanelHeader icon="🎯" title="Active Goals" to="/life" />
          {activeGoals.length === 0 ? (
            <EmptyState icon="🏆" title="No active goals" />
          ) : (
            <div className="space-y-3">
              {activeGoals.map((g) => {
                const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="truncate pr-2">{g.title}</span>
                      <span className="text-accent font-mono-num shrink-0">{pct}%</span>
                    </div>
                    <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-accent to-[#a78bfa]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[11px] text-muted">
                      <span className="font-mono-num">{g.current} / {g.target} {g.unit}</span>
                      {g.deadline && <span>📅 {g.deadline}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Upcoming Reminders */}
        <Card>
          <PanelHeader icon="🔔" title="Upcoming Reminders" />
          {upcomingReminders.length === 0 ? (
            <EmptyState icon="🔕" title="No upcoming reminders" />
          ) : (
            <div className="space-y-2.5">
              {upcomingReminders.map((r) => {
                const overdue = new Date(r.remind_at) < now
                return (
                  <div key={r.id} className="flex items-start gap-2.5">
                    <Bell size={14} className={`mt-0.5 shrink-0 ${overdue ? 'text-danger' : 'text-accent'}`} />
                    <div className="min-w-0">
                      <p className="text-sm truncate">{r.title}</p>
                      <p className="text-[11px] text-muted">
                        ⏰ {new Date(r.remind_at).toLocaleString('en-IN')}
                        {overdue && <span className="text-danger font-semibold ml-1.5">OVERDUE</span>}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Finance Snapshot */}
        <Card>
          <PanelHeader icon="📈" title="Finance Snapshot" to="/finance" iconEl={<TrendingUp size={14} />} />
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#9498c2', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9498c2', fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={{ background: '#1e2145', border: '1px solid #2b2f5c', borderRadius: 8, fontSize: 12 }} formatter={(v) => `₹${v}`} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9498c2' }} />
                <Bar dataKey="Income" fill="#4ade80" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ff6b6b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Latest Ideas — full width */}
      <Card>
        <PanelHeader icon="💡" title="Latest Ideas" to="/life" />
        {latestIdeas.length === 0 ? (
          <EmptyState icon="💡" title="No ideas yet" />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {latestIdeas.map((i) => (
              <div key={i.id} className="bg-surface-2 border border-border rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-medium truncate">{i.title}</p>
                </div>
                {i.description && <p className="text-xs text-muted line-clamp-2 mb-2">{i.description}</p>}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Pill>{i.tag}</Pill>
                  <Pill tone={ideaStatusTone[i.status]}>{i.status}</Pill>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={openTask} onClose={() => setOpenTask(false)} title="New task">
        <form onSubmit={saveTask} className="space-y-3">
          <Input label="Title" required value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="What needs to be done?" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Input label="Due date" type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
          </div>
          <Button type="submit" className="w-full">Save task</Button>
        </form>
      </Modal>
    </div>
  )
}

function PanelHeader({ icon, title, to, iconEl }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-display font-semibold text-sm flex items-center gap-2">
        {iconEl || <span>{icon}</span>} {title}
      </h2>
      {to && (
        <Link to={to} className="text-xs text-accent flex items-center gap-1 shrink-0">
          View all <ArrowUpRight size={12} />
        </Link>
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, meta, to, bar, iconTone }) {
  return (
    <Link to={to}>
      <Card className="relative overflow-hidden hover:-translate-y-0.5 transition h-full !p-0">
        <div className={`h-[3px] w-full ${bar}`} />
        <div className="p-4 relative">
          <Icon size={26} className={`absolute right-3 top-3 opacity-10 ${iconTone}`} />
          <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">{label}</p>
          <p className="text-xl sm:text-2xl font-display font-semibold font-mono-num mt-1.5">{value}</p>
          <p className="text-[11px] text-muted mt-0.5">{meta}</p>
        </div>
      </Card>
    </Link>
  )
}
