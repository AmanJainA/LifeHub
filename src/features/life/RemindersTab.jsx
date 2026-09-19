import { useEffect, useState } from 'react'
import { Trash2, Bell, Check, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { Card, Button, Input, Select, Modal, Pill, EmptyState, Spinner } from '../../components/ui'
import { useListControls } from '../shared/useListControls'

const empty = { title: '', remind_at: '', repeat_type: 'none' }

export default function RemindersTab() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(empty)

  const load = async () => {
    const { data } = await supabase.from('reminders').select('*').eq('user_id', user.id).order('remind_at', { ascending: true })
    setItems(data || [])
  }

  useEffect(() => { load() }, [user])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpen(true), 'New reminder'), [setQuickAdd])

  const save = async (e) => {
    e.preventDefault()
    await supabase.from('reminders').insert({ ...form, user_id: user.id })
    setForm(empty)
    setOpen(false)
    load()
  }

  const toggle = async (r) => {
    await supabase.from('reminders').update({ done: !r.done }).eq('id', r.id)
    load()
  }

  const remove = async (id) => {
    await supabase.from('reminders').delete().eq('id', id)
    load()
  }

  const startEdit = (r) => {
    setEditId(r.id)
    setEditForm({ title: r.title, remind_at: r.remind_at?.slice(0, 16) || '', repeat_type: r.repeat_type })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    await supabase.from('reminders').update(editForm).eq('id', editId)
    setEditId(null)
    load()
  }

  const { visibleItems, Toolbar, PaginationBar } = useListControls(items || [], {
    searchKeys: ['title'],
    dateKey: 'remind_at',
    columns: [
      { label: 'Title', value: (r) => r.title },
      { label: 'Remind at', value: (r) => new Date(r.remind_at).toLocaleString('en-IN') },
      { label: 'Repeat', value: (r) => r.repeat_type },
      { label: 'Done', value: (r) => (r.done ? 'Yes' : 'No') },
    ],
    filename: 'reminders',
    title: 'Reminders',
  })

  if (items === null) return <Spinner />

  return (
    <div className="space-y-4">
      {Toolbar}

      {visibleItems.length === 0 ? (
        <EmptyState icon="🔔" title="No reminders" subtitle="Set a reminder so nothing slips through the cracks." />
      ) : (
        <div className="space-y-2">
          {visibleItems.map((r) => (
            <Card key={r.id} className="flex items-center gap-3 py-3">
              <Bell size={16} className="text-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${r.done ? 'line-through text-muted' : ''}`}>{r.title}</p>
                <p className="text-xs text-muted">{new Date(r.remind_at).toLocaleString()}</p>
              </div>
              {r.repeat_type !== 'none' && <Pill>{r.repeat_type}</Pill>}
              <button onClick={() => toggle(r)} className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${r.done ? 'bg-success border-success' : 'border-border'}`}>
                {r.done && <Check size={12} className="text-onaccent" />}
              </button>
              <button onClick={() => startEdit(r)} className="text-muted hover:text-accent shrink-0"><Pencil size={14} /></button>
              <button onClick={() => remove(r.id)} className="text-muted hover:text-danger shrink-0"><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}

      {PaginationBar}

      <Modal open={open} onClose={() => setOpen(false)} title="New reminder">
        <form onSubmit={save} className="space-y-3">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="Remind at" type="datetime-local" required value={form.remind_at} onChange={(e) => setForm({ ...form, remind_at: e.target.value })} />
          <Select label="Repeat" value={form.repeat_type} onChange={(e) => setForm({ ...form, repeat_type: e.target.value })}>
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
          <Button type="submit" className="w-full">Save reminder</Button>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Edit reminder">
        <form onSubmit={saveEdit} className="space-y-3">
          <Input label="Title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <Input label="Remind at" type="datetime-local" required value={editForm.remind_at} onChange={(e) => setEditForm({ ...editForm, remind_at: e.target.value })} />
          <Select label="Repeat" value={editForm.repeat_type} onChange={(e) => setEditForm({ ...editForm, repeat_type: e.target.value })}>
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </Select>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Modal>
    </div>
  )
}
