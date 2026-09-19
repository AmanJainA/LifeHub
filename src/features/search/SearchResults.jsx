import { useNavigate } from 'react-router-dom'
import { CheckSquare, FileText, Target, Bell, Lightbulb, Wallet, Users } from 'lucide-react'
import { Pill } from '../../components/ui'

const GROUPS = [
  { key: 'tasks', label: 'Tasks', icon: CheckSquare, tab: 'tasks', page: '/life' },
  { key: 'notes', label: 'Notes', icon: FileText, tab: 'notes', page: '/life' },
  { key: 'goals', label: 'Goals', icon: Target, tab: 'goals', page: '/life' },
  { key: 'reminders', label: 'Reminders', icon: Bell, tab: 'reminders', page: '/life' },
  { key: 'ideas', label: 'Ideas', icon: Lightbulb, tab: 'ideas', page: '/life' },
  { key: 'expenses', label: 'Finance', icon: Wallet, page: '/finance' },
  { key: 'splitwise', label: 'Splitwise', icon: Users, page: '/splitwise' },
]

function itemLine(key, item) {
  switch (key) {
    case 'tasks': return { title: item.title, meta: [item.priority, item.due_date].filter(Boolean).join(' · ') }
    case 'notes': return { title: item.title, meta: item.tags || (item.content || '').slice(0, 60) }
    case 'goals': return { title: item.title, meta: [`${item.current}/${item.target} ${item.unit || ''}`, item.deadline].filter(Boolean).join(' · ') }
    case 'reminders': return { title: item.title, meta: new Date(item.remind_at).toLocaleString('en-IN') }
    case 'ideas': return { title: item.title, meta: [item.tag, item.status].filter(Boolean).join(' · ') }
    case 'expenses': return { title: item.description || item.category, meta: [item.category, item.date, `₹${item.amount}`].filter(Boolean).join(' · ') }
    case 'splitwise': return { title: item.description || item.category, meta: [item.sw_groups?.name, item.date, `₹${item.amount}`].filter(Boolean).join(' · ') }
    default: return { title: '', meta: '' }
  }
}

export default function SearchResults({ results, loading, hasQuery, onNavigate }) {
  const navigate = useNavigate()

  if (!hasQuery) return null
  if (loading) return <p className="text-sm text-muted py-6 text-center">Searching…</p>

  const groups = GROUPS.map((g) => ({ ...g, items: results[g.key] || [] })).filter((g) => g.items.length > 0)

  if (groups.length === 0) {
    return <p className="text-sm text-muted py-6 text-center">No results found.</p>
  }

  const go = (g) => {
    navigate(g.tab ? `${g.page}?tab=${g.tab}` : g.page)
    onNavigate?.()
  }

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="flex items-center gap-2 text-xs text-muted font-semibold uppercase tracking-wide mb-1.5 px-1">
            <g.icon size={13} /> {g.label}
          </div>
          <div className="space-y-1">
            {g.items.map((item) => {
              const { title, meta } = itemLine(g.key, item)
              return (
                <button
                  key={item.id}
                  onClick={() => go(g)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-surface-2 transition flex items-center justify-between gap-3"
                >
                  <span className="text-sm truncate">{title}</span>
                  {meta && <Pill>{meta}</Pill>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
