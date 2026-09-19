import { useEffect, useState } from 'react'
import { Trash2, Pin, Pencil } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useQuickAdd } from '../../context/QuickAddContext'
import { Card, Button, Input, Textarea, Modal, EmptyState, Spinner } from '../../components/ui'
import { useListControls } from '../shared/useListControls'

const COLORS = ['#f5a623', '#35d0c0', '#ff6b6b', '#8b7cf6', '#4ade80']
const empty = { title: '', content: '', tags: '', color: COLORS[0] }

export default function NotesTab() {
  const { user } = useAuth()
  const [items, setItems] = useState(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState(empty)

  const load = async () => {
    const { data } = await supabase.from('notes').select('*').eq('user_id', user.id).order('pinned', { ascending: false }).order('updated_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { load() }, [user])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => setQuickAdd(() => setOpen(true), 'New note'), [setQuickAdd])

  const save = async (e) => {
    e.preventDefault()
    await supabase.from('notes').insert({ ...form, user_id: user.id })
    setForm(empty)
    setOpen(false)
    load()
  }

  const togglePin = async (n) => {
    await supabase.from('notes').update({ pinned: !n.pinned }).eq('id', n.id)
    load()
  }

  const remove = async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    load()
  }

  const startEdit = (n) => {
    setEditId(n.id)
    setEditForm({ title: n.title, content: n.content || '', tags: n.tags || '', color: n.color || COLORS[0] })
  }

  const saveEdit = async (e) => {
    e.preventDefault()
    await supabase.from('notes').update({ ...editForm, updated_at: new Date().toISOString() }).eq('id', editId)
    setEditId(null)
    load()
  }

  const { visibleItems, Toolbar, PaginationBar } = useListControls(items || [], {
    searchKeys: ['title', 'content', 'tags'],
    dateKey: 'updated_at',
    columns: [
      { label: 'Title', value: (r) => r.title },
      { label: 'Content', value: (r) => r.content || '' },
      { label: 'Tags', value: (r) => r.tags || '' },
      { label: 'Pinned', value: (r) => (r.pinned ? 'Yes' : 'No') },
    ],
    filename: 'notes',
    title: 'Notes',
  })

  if (items === null) return <Spinner />

  return (
    <div className="space-y-4">
      {Toolbar}

      {visibleItems.length === 0 ? (
        <EmptyState icon="📝" title="No notes yet" subtitle="Capture an idea, a snippet, or a to-remember." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleItems.map((n) => (
            <Card key={n.id} className="relative" style={{ borderTopColor: n.color, borderTopWidth: 3 }}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{n.title}</p>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => togglePin(n)} className={n.pinned ? 'text-accent' : 'text-muted hover:text-text'}><Pin size={14} /></button>
                  <button onClick={() => startEdit(n)} className="text-muted hover:text-accent"><Pencil size={14} /></button>
                  <button onClick={() => remove(n.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                </div>
              </div>
              <p className="text-xs text-muted whitespace-pre-wrap line-clamp-4">{n.content}</p>
              {n.tags && <p className="text-[11px] text-accent mt-2">{n.tags.split(',').map(t => `#${t.trim()}`).join(' ')}</p>}
            </Card>
          ))}
        </div>
      )}

      {PaginationBar}

      <Modal open={open} onClose={() => setOpen(false)} title="New note">
        <form onSubmit={save} className="space-y-3">
          <Input label="Title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Content" rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <Input label="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          <div>
            <span className="block text-xs text-muted mb-1">Color</span>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                  className="w-7 h-7 rounded-full border-2" style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Save note</Button>
        </form>
      </Modal>

      <Modal open={editId !== null} onClose={() => setEditId(null)} title="Edit note">
        <form onSubmit={saveEdit} className="space-y-3">
          <Input label="Title" required value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
          <Textarea label="Content" rows={4} value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} />
          <Input label="Tags (comma separated)" value={editForm.tags} onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })} />
          <div>
            <span className="block text-xs text-muted mb-1">Color</span>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setEditForm({ ...editForm, color: c })}
                  className="w-7 h-7 rounded-full border-2" style={{ background: c, borderColor: editForm.color === c ? '#fff' : 'transparent' }} />
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">Save changes</Button>
        </form>
      </Modal>
    </div>
  )
}
