import { useEffect, useState } from 'react'
import { Trash2, Check, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { Card, Button, Input, Select, Modal, Pill, EmptyState, Spinner } from '../../components/ui'
import { useListControls } from '../shared/useListControls'

const empty = { title: '', description: '', priority: 'medium', due_date: '' }

export default function TasksTab() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [filter, setFilter] = useState('pending')
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(empty)

  const load = async () => {
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id).order('due_date', { ascending: true, nullsFirst: false }).order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [user])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpen(true), 'New task'), [setQuickAdd])

  const save = async (e) => {
    e.preventDefault()
    await supabase.from('tasks').insert({ ...form, user_id: user.id, due_date: form.due_date || null })
    setForm(empty)
    setOpen(false)
    load()
  }

  const toggle = async (task) => {
    await supabase.from('tasks').update({ status: task.status === 'pending' ? 'done' : 'pending' }).eq('id', task.id)
    load()
  }

  const remove = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  const startEdit = (t) => {
    setEditId(t.id)
    setEditForm({ title: t.title, description: t.description || '', priority: t.priority, due_date: t.due_date || '' })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    await supabase.from('tasks').update({ ...editForm, due_date: editForm.due_date || null }).eq('id', editId)
    setEditId(null)
    load()
  }

  const filtered = (items || []).filter((t) => filter === 'all' || t.status === filter)
  const priorityTone = { high: 'danger', medium: 'accent', low: 'muted' }

  const { visibleItems, Toolbar, PaginationBar } = useListControls(filtered, {
    searchKeys: ['title', 'description'],
    dateKey: 'due_date',
    columns: [
      { label: 'Title', value: (r) => r.title },
      { label: 'Priority', value: (r) => r.priority },
      { label: 'Status', value: (r) => r.status },
      { label: 'Due date', value: (r) => r.due_date || '' },
      { label: 'Description', value: (r) => r.description || '' },
    ],
    filename: 'tasks',
    title: 'Tasks',
  })

  if (items === null) return <Spinner />

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {['pending', 'done', 'all'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1.5 rounded-full capitalize ${filter === f ? 'bg-surface-3 text-text' : 'text-muted'}`}>{f}</button>
        ))}
      </div>

      {Toolbar}

      {visibleItems.length === 0 ? (
        <EmptyState icon="✅" title="No tasks here" subtitle="Add a task to start tracking your day." />
      ) : (
        <div className="space-y-2">
          {visibleItems.map((t) => (
            <Card key={t.id} className="flex items-start gap-3 py-3">
              <button onClick={() => toggle(t)} className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${t.status === 'done' ? 'bg-success border-success' : 'border-border'}`}>
                {t.status === 'done' && <Check size={13} className="text-onaccent" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${t.status === 'done' ? 'line-through text-muted' : ''}`}>{t.title}</p>
                {t.description && <p className="text-xs text-muted mt-0.5">{t.description}</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <Pill tone={priorityTone[t.priority]}>{t.priority}</Pill>
                  {t.due_date && <span className="text-xs text-muted">Due {t.due_date}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => startEdit(t)} className="text-muted hover:text-accent"><Pencil size={14} /></button>
                <button onClick={() => remove(t.id)} className="text-muted hover:text-danger"><Trash2 size={15} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {PaginationBar}

      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <form onSubmit={save} className="space-y-3">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Input label="Due date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>
          <Button type="submit" className="w-full">Save task</Button>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Edit task">
        <form onSubmit={saveEdit} className="space-y-3">
          <Input label="Title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <Input label="Description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            <Input label="Due date" type="date" value={editForm.due_date} onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })} />
          </div>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Modal>
    </div>
  )
}
