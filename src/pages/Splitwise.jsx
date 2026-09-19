import { useEffect, useState } from 'react'
import { Users as UsersIcon, X } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useQuickAdd } from '../context/QuickAddContext'
import { Card, Button, Input, Modal, EmptyState, Spinner, Pill } from '../components/ui'
import GroupDetail from '../features/splitwise/GroupDetail'

export default function Splitwise() {
  const { user, profile } = useAuth()
  const [groups, setGroups] = useState(null)
  const [activeGroupId, setActiveGroupId] = useState(null)
  const [open, setOpen] = useState(false)

  const [name, setName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [pendingMembers, setPendingMembers] = useState([]) // {id, name, email, avatar}
  const [lookupError, setLookupError] = useState('')

  const loadGroups = async () => {
    const { data: memberships } = await supabase
      .from('sw_group_members')
      .select('group_id, sw_groups(id, name, created_by, created_at)')
      .eq('user_id', user.id)
    setGroups((memberships || []).map((m) => m.sw_groups).filter(Boolean))
  }

  useEffect(() => { loadGroups() }, [user])

  const { setQuickAdd } = useQuickAdd()
  useEffect(() => {
    if (activeGroupId) return // GroupDetail registers its own "Add expense" while open
    return setQuickAdd(() => setOpen(true), 'New group')
  }, [setQuickAdd, activeGroupId])

  const addMemberByEmail = async () => {
    setLookupError('')
    if (!memberEmail) return
    const { data, error } = await supabase.from('profiles').select('id, name, email, avatar').eq('email', memberEmail.trim().toLowerCase()).single()
    if (error || !data) { setLookupError('No LifeHub user found with that email.'); return }
    if (data.id === user.id) { setLookupError("That's you — you're added automatically."); return }
    if (pendingMembers.some((m) => m.id === data.id)) { setLookupError('Already added.'); return }
    setPendingMembers([...pendingMembers, data])
    setMemberEmail('')
  }

  const createGroup = async (e) => {
    e.preventDefault()
    const { data: group, error } = await supabase.from('sw_groups').insert({ name, created_by: user.id }).select().single()
    if (error) return
    const rows = [{ group_id: group.id, user_id: user.id }, ...pendingMembers.map((m) => ({ group_id: group.id, user_id: m.id }))]
    await supabase.from('sw_group_members').insert(rows)
    setName(''); setPendingMembers([]); setOpen(false)
    loadGroups()
    setActiveGroupId(group.id)
  }

  if (groups === null) return <Spinner />

  if (activeGroupId) {
    return <GroupDetail groupId={activeGroupId} onBack={() => { setActiveGroupId(null); loadGroups() }} />
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold">Splitwise</h1>
        <p className="text-muted text-sm mt-1">Split bills and settle up with friends & flatmates.</p>
      </div>

      {groups.length === 0 ? (
        <EmptyState icon="🤝" title="No groups yet" subtitle="Create a group to start splitting expenses with people." action={<Button onClick={() => setOpen(true)}>Create a group</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((g) => (
            <Card key={g.id} className="cursor-pointer hover:border-accent/40 transition" onClick={() => setActiveGroupId(g.id)}>
              <div className="w-10 h-10 rounded-xl bg-teal/15 text-teal flex items-center justify-center mb-3">
                <UsersIcon size={18} />
              </div>
              <p className="font-medium text-sm">{g.name}</p>
              <p className="text-xs text-muted mt-1">Tap to view balances</p>
            </Card>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New splitwise group">
        <form onSubmit={createGroup} className="space-y-3">
          <Input label="Group name" required placeholder="e.g. Goa Trip, Flat 4B" value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <span className="block text-xs text-muted mb-1">Add members by email</span>
            <div className="flex gap-2">
              <Input placeholder="friend@example.com" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} className="flex-1" />
              <Button type="button" variant="subtle" onClick={addMemberByEmail}>Add</Button>
            </div>
            {lookupError && <p className="text-xs text-danger mt-1">{lookupError}</p>}
            <p className="text-xs text-muted mt-1">Members must already have a LifeHub account.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill tone="accent">{profile?.avatar} You</Pill>
            {pendingMembers.map((m) => (
              <Pill key={m.id}>
                <span className="inline-flex items-center gap-1">
                  {m.avatar} {m.name}
                  <button type="button" onClick={() => setPendingMembers(pendingMembers.filter((x) => x.id !== m.id))}><X size={11} /></button>
                </span>
              </Pill>
            ))}
          </div>
          <Button type="submit" className="w-full">Create group</Button>
        </form>
      </Modal>
    </div>
  )
}
