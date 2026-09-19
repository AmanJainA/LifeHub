import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const EMPTY = { tasks: [], notes: [], goals: [], reminders: [], ideas: [], expenses: [], splitwise: [] }

function parseDate(q) {
  // Accept YYYY-MM-DD, YYYY-MM, or things Date() can parse (e.g. "18 aug", "aug 2026")
  const isoDay = /^\d{4}-\d{2}-\d{2}$/.test(q)
  const isoMonth = /^\d{4}-\d{2}$/.test(q)
  if (isoDay) return { day: q, month: q.slice(0, 7) }
  if (isoMonth) return { day: null, month: q }
  const d = new Date(q)
  if (!isNaN(d.getTime()) && q.length >= 3) {
    const day = d.toISOString().slice(0, 10)
    return { day, month: day.slice(0, 7) }
  }
  return null
}

export function useGlobalSearch() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (!q || q.length < 2 || !user) {
      setResults(EMPTY)
      return
    }
    const timer = setTimeout(() => runSearch(q), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, user])

  async function runSearch(q) {
    setLoading(true)
    const like = `%${q}%`
    const date = parseDate(q)

    const tasksQ = supabase.from('tasks').select('*').eq('user_id', user.id)
      .or(`title.ilike.${like},description.ilike.${like}${date?.day ? `,due_date.eq.${date.day}` : ''}`)
      .limit(6)
    const notesQ = supabase.from('notes').select('*').eq('user_id', user.id)
      .or(`title.ilike.${like},content.ilike.${like},tags.ilike.${like}`)
      .limit(6)
    const goalsQ = supabase.from('goals').select('*').eq('user_id', user.id)
      .or(`title.ilike.${like}${date?.day ? `,deadline.eq.${date.day}` : ''}`)
      .limit(6)
    const remindersQ = supabase.from('reminders').select('*').eq('user_id', user.id)
      .ilike('title', like)
      .limit(6)
    const ideasQ = supabase.from('ideas').select('*').eq('user_id', user.id)
      .or(`title.ilike.${like},description.ilike.${like},tag.ilike.${like}`)
      .limit(6)
    const expensesQ = supabase.from('expenses').select('*').eq('user_id', user.id)
      .or(`description.ilike.${like},category.ilike.${like}${date?.day ? `,date.eq.${date.day}` : ''}`)
      .limit(6)
    const swQ = supabase.from('sw_expenses').select('*, sw_groups(name)')
      .or(`description.ilike.${like},category.ilike.${like}${date?.day ? `,date.eq.${date.day}` : ''}`)
      .limit(6)

    const [tasks, notes, goals, reminders, ideas, expenses, splitwise] = await Promise.all([
      tasksQ, notesQ, goalsQ, remindersQ, ideasQ, expensesQ, swQ,
    ])

    setResults({
      tasks: tasks.data || [],
      notes: notes.data || [],
      goals: goals.data || [],
      reminders: reminders.data || [],
      ideas: ideas.data || [],
      expenses: expenses.data || [],
      splitwise: splitwise.data || [],
    })
    setLoading(false)
  }

  const totalCount = Object.values(results).reduce((s, arr) => s + arr.length, 0)

  return { query, setQuery, results, loading, totalCount, hasQuery: query.trim().length >= 2 }
}
