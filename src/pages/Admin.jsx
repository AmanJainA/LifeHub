import { useEffect, useState } from 'react'
import { Trash2, Pencil, ShieldAlert } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Input, Select, Modal, Pill, EmptyState, Spinner } from '../components/ui'

const empty = { name: '', kind: 'both', is_active: true }

export default function Admin() {
  const { profile } = useAuth()
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(empty)
  const [error, setError] = useState('')

  const load = async () => {
    const { data } = await supabase.from('expense_types').select('*').order('kind').order('name')
    setItems(data || [])
  }

  useEffect(() => { load() }, [])

  if (!profile?.is_admin) {
    return (
      <EmptyState
        icon={<ShieldAlert className="mx-auto" />}
        title="Admins only"
        subtitle="This page manages the income/expense categories everyone else sees in the Finance section. Your account doesn't have admin access."
      />
    )
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('expense_types').insert(form)
    if (error) { setError(error.message); return }
    setForm(empty)
    setOpen(false)
    load()
  }

  const startEdit = (t) => {
    setEditId(t.id)
    setEditForm({ name: t.name, kind: t.kind, is_active: t.is_active })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    setError('')
    const { error } = await supabase.from('expense_types').update(editForm).eq('id', editId)
    if (error) { setError(error.message); return }
    setEditId(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('Delete this category? Transactions already using it keep the old text but it will disappear from the dropdown.')) return
    await supabase.from('expense_types').delete().eq('id', id)
    load()
  }

  if (items === null) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Admin · Categories</h1>
          <p className="text-muted text-sm mt-1">
            Add, edit, or remove the income/expense categories. Changes show up immediately in
            everyone's Finance → category dropdown.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>New category</Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Card>
        {items.length === 0 ? (
          <EmptyState icon="🏷️" title="No categories yet" subtitle="Add your first income/expense category." />
        ) : (
          <div className="space-y-2">
            {items.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-border/60 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={t.is_active ? '' : 'line-through text-muted'}>{t.name}</span>
                  <Pill tone={t.kind === 'income' ? 'success' : t.kind === 'expense' ? 'danger' : 'accent'}>{t.kind}</Pill>
                  {!t.is_active && <Pill tone="muted">hidden</Pill>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => startEdit(t)} className="text-muted hover:text-accent"><Pencil size={14} /></button>
                  <button onClick={() => remove(t.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="New category">
        <form onSubmit={save} className="space-y-3">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Subscriptions" />
          <Select label="Applies to" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
            <option value="both">Both income & expense</option>
            <option value="expense">Expense only</option>
            <option value="income">Income only</option>
          </Select>
          <Button type="submit" className="w-full">Add category</Button>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Edit category">
        <form onSubmit={saveEdit} className="space-y-3">
          <Input label="Name" required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Select label="Applies to" value={editForm.kind} onChange={(e) => setEditForm({ ...editForm, kind: e.target.value })}>
            <option value="both">Both income & expense</option>
            <option value="expense">Expense only</option>
            <option value="income">Income only</option>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={editForm.is_active} onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })} />
            Active (visible in the dropdown)
          </label>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Modal>
    </div>
  )
}
