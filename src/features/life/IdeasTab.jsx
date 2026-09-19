import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { Card, Button, Input, Select, Textarea, Modal, Pill, EmptyState, Spinner } from '../../components/ui'
import { useListControls } from '../shared/useListControls'

const empty = { title: '', description: '', tag: 'general', priority: 'medium', status: 'new' }
const statusTone = { new: 'accent', wip: 'teal', done: 'success', shelved: 'muted' }

export default function IdeasTab() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(empty)

  const load = async () => {
    const { data } = await supabase.from('ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [user])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpen(true), 'New idea'), [setQuickAdd])

  const save = async (e) => {
    e.preventDefault()
    await supabase.from('ideas').insert({ ...form, user_id: user.id })
    setForm(empty)
    setOpen(false)
    load()
  }

  const cycleStatus = async (idea) => {
    const order = ['new', 'wip', 'done', 'shelved']
    const next = order[(order.indexOf(idea.status) + 1) % order.length]
    await supabase.from('ideas').update({ status: next }).eq('id', idea.id)
    load()
  }

  const remove = async (id) => {
    await supabase.from('ideas').delete().eq('id', id)
    load()
  }

  const startEdit = (i) => {
    setEditId(i.id)
    setEditForm({ title: i.title, description: i.description || '', tag: i.tag, priority: i.priority, status: i.status })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    await supabase.from('ideas').update(editForm).eq('id', editId)
    setEditId(null)
    load()
  }

  const { visibleItems, Toolbar, PaginationBar } = useListControls(items || [], {
    searchKeys: ['title', 'description', 'tag'],
    dateKey: 'created_at',
    columns: [
      { label: 'Title', value: (r) => r.title },
      { label: 'Description', value: (r) => r.description || '' },
      { label: 'Tag', value: (r) => r.tag },
      { label: 'Priority', value: (r) => r.priority },
      { label: 'Status', value: (r) => r.status },
    ],
    filename: 'ideas',
    title: 'Ideas',
  })

  if (items === null) return <Spinner />

  return (
    <div className="space-y-4">
      {Toolbar}

      {visibleItems.length === 0 ? (
        <EmptyState icon="💡" title="No ideas captured" subtitle="Jot down the next big (or small) thing." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleItems.map((i) => (
            <Card key={i.id}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{i.title}</p>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => startEdit(i)} className="text-muted hover:text-accent"><Pencil size={14} /></button>
                  <button onClick={() => remove(i.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                </div>
              </div>
              {i.description && <p className="text-xs text-muted line-clamp-3 mb-2">{i.description}</p>}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Pill>{i.tag}</Pill>
                <Pill tone={i.priority === 'high' ? 'danger' : 'muted'}>{i.priority}</Pill>
                <button onClick={() => cycleStatus(i)}>
                  <Pill tone={statusTone[i.status]}>{i.status}</Pill>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {PaginationBar}

      <Modal open={open} onClose={() => setOpen(false)} title="New idea">
        <form onSubmit={save} className="space-y-3">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tag" value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })}>
              <option value="app">App</option>
              <option value="business">Business</option>
              <option value="feature">Feature</option>
              <option value="general">General</option>
            </Select>
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">Save idea</Button>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Edit idea">
        <form onSubmit={saveEdit} className="space-y-3">
          <Input label="Title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <Textarea label="Description" rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Tag" value={editForm.tag} onChange={(e) => setEditForm({ ...editForm, tag: e.target.value })}>
              <option value="app">App</option>
              <option value="business">Business</option>
              <option value="feature">Feature</option>
              <option value="general">General</option>
            </Select>
            <Select label="Priority" value={editForm.priority} onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
          </div>
          <Select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
            <option value="new">New</option>
            <option value="wip">In progress</option>
            <option value="done">Done</option>
            <option value="shelved">Shelved</option>
          </Select>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Modal>
    </div>
  )
}
