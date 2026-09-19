import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import TasksTab from '../features/life/TasksTab'
import NotesTab from '../features/life/NotesTab'
import GoalsTab from '../features/life/GoalsTab'
import RemindersTab from '../features/life/RemindersTab'
import IdeasTab from '../features/life/IdeasTab'

const TABS = [
  { id: 'tasks', label: 'Tasks' },
  { id: 'notes', label: 'Notes' },
  { id: 'goals', label: 'Goals' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'ideas', label: 'Ideas' },
]
const TAB_IDS = TABS.map((t) => t.id)

export default function Life() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = TAB_IDS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'tasks'
  const [tab, setTab] = useState(initialTab)

  const changeTab = (id) => {
    setTab(id)
    setSearchParams(id === 'tasks' ? {} : { tab: id }, { replace: true })
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Life</h1>
        <p className="text-muted text-sm mt-1">Tasks, notes, goals, reminders & ideas.</p>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => changeTab(t.id)}
            className={`px-3.5 py-2 text-sm rounded-t-lg whitespace-nowrap transition ${
              tab === t.id ? 'text-accent border-b-2 border-accent font-medium' : 'text-muted hover:text-text'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tasks' && <TasksTab />}
      {tab === 'notes' && <NotesTab />}
      {tab === 'goals' && <GoalsTab />}
      {tab === 'reminders' && <RemindersTab />}
      {tab === 'ideas' && <IdeasTab />}
    </div>
  )
}
