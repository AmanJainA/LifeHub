import { useEffect, useState } from 'react'
import { Trash2, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { Card, Button, Input, Select, Modal, Pill, EmptyState, Spinner } from '../../components/ui'
import { useListControls } from '../shared/useListControls'

const empty = { title: '', target: '', current: '0', unit: '%', deadline: '', status: 'active' }

export default function GoalsTab() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(empty)

  const load = async () => {
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [user])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpen(true), 'New goal'), [setQuickAdd])

  const save = async (e) => {
    e.preventDefault()
    await supabase.from('goals').insert({ ...form, user_id: user.id, target: Number(form.target), current: Number(form.current), deadline: form.deadline || null })
    setForm(empty)
    setOpen(false)
    load()
  }

  const bump = async (g, delta) => {
    const current = Math.max(0, Number(g.current) + delta)
    const status = current >= Number(g.target) ? 'done' : g.status
    await supabase.from('goals').update({ current, status }).eq('id', g.id)
    load()
  }

  const remove = async (id) => {
    await supabase.from('goals').delete().eq('id', id)
    load()
  }

  const startEdit = (g) => {
    setEditId(g.id)
    setEditForm({
      title: g.title,
      target: g.target,
      current: g.current,
      unit: g.unit || '%',
      deadline: g.deadline || '',
      status: g.status,
    })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    await supabase.from('goals').update({
      title: editForm.title,
      target: Number(editForm.target),
      current: Number(editForm.current),
      unit: editForm.unit,
      deadline: editForm.deadline || null,
      status: editForm.status,
    }).eq('id', editId)
    setEditId(null)
    load()
  }

  const { visibleItems, Toolbar, PaginationBar } = useListControls(items || [], {
    searchKeys: ['title', 'unit'],
    dateKey: 'deadline',
    columns: [
      { label: 'Title', value: (r) => r.title },
      { label: 'Current', value: (r) => r.current },
      { label: 'Target', value: (r) => r.target },
      { label: 'Unit', value: (r) => r.unit || '' },
      { label: 'Status', value: (r) => r.status },
      { label: 'Deadline', value: (r) => r.deadline || '' },
    ],
    filename: 'goals',
    title: 'Goals',
  })

  if (items === null) return <Spinner />

  return (
    <div className="space-y-4">
      {Toolbar}

      {visibleItems.length === 0 ? (
        <EmptyState icon="🎯" title="No goals set" subtitle="Set a target and track your progress over time." />
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {visibleItems.map((g) => {
            const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0
            return (
              <Card key={g.id}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm">{g.title}</p>
                    {g.deadline && <p className="text-xs text-muted mt-0.5">Due {g.deadline}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Pill tone={g.status === 'done' ? 'success' : g.status === 'paused' ? 'muted' : 'accent'}>{g.status}</Pill>
                    <button onClick={() => startEdit(g)} className="text-muted hover:text-accent"><Pencil size={14} /></button>
                    <button onClick={() => remove(g.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="h-2 bg-surface-3 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted font-mono-num">{g.current} / {g.target} {g.unit}</span>
                  <div className="flex gap-1">
                    <button onClick={() => bump(g, -1)} className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3">−</button>
                    <button onClick={() => bump(g, 1)} className="w-7 h-7 rounded-lg bg-surface-2 hover:bg-surface-3">+</button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {PaginationBar}

      <Modal open={open} onClose={() => setOpen(false)} title="New goal">
        <form onSubmit={save} className="space-y-3">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Target" type="number" required value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} />
            <Input label="Current" type="number" value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} />
            <Input label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <Input label="Deadline" type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          <Button type="submit" className="w-full">Save goal</Button>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Edit goal">
        <form onSubmit={saveEdit} className="space-y-3">
          <Input label="Title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Target" type="number" required value={editForm.target} onChange={(e) => setEditForm({ ...editForm, target: e.target.value })} />
            <Input label="Current" type="number" value={editForm.current} onChange={(e) => setEditForm({ ...editForm, current: e.target.value })} />
            <Input label="Unit" value={editForm.unit} onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Deadline" type="date" value={editForm.deadline} onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })} />
            <Select label="Status" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="done">Done</option>
              <option value="paused">Paused</option>
            </Select>
          </div>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Modal>
    </div>
  )
}
