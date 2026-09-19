import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { Card, Button, Input } from '../components/ui'

const AVATARS = ['🧑‍💻', '🙂', '😎', '🧑‍🚀', '🦊', '🐼', '🌟', '🔥', '🌊', '🌱']

export default function Profile() {
  const { user, profile, signOut, refreshProfile, changePassword } = useAuth()
  const [name, setName] = useState(profile?.full_name || profile?.name || '')
  const [avatar, setAvatar] = useState(profile?.avatar || '🙂')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwSaving, setPwSaving] = useState(false)

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setNotice('')
    await supabase.from('profiles').update({ full_name: name, username: name, avatar }).eq('id', user.id)
    await refreshProfile()
    setSaving(false)
    setNotice('Profile updated.')
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!currentPassword || !newPassword) return
    setPwError('')
    setPwSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setNotice('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setPwError(err.message || 'Could not update password.')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <div>
        <h1 className="font-display text-2xl font-semibold">My profile</h1>
        <p className="text-muted text-sm mt-1">Manage your account details.</p>
      </div>

      <Card>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <span className="block text-xs text-muted mb-2">Avatar</span>
            <div className="flex flex-wrap gap-2">
              {AVATARS.map((a) => (
                <button type="button" key={a} onClick={() => setAvatar(a)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${avatar === a ? 'border-accent bg-accent/10' : 'border-border'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" value={user?.email} disabled className="opacity-60" />
          <Button type="submit" disabled={saving}>Save profile</Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-display font-semibold mb-3">Change password</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <Input label="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" />
          <Input label="New password" type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
          {pwError && <p className="text-sm text-danger">{pwError}</p>}
          <Button type="submit" variant="subtle" disabled={pwSaving}>Update password</Button>
        </form>
      </Card>

      {notice && <p className="text-sm text-success">{notice}</p>}

      <Button variant="danger" onClick={signOut} className="w-full sm:w-auto">
        <LogOut size={15} className="inline -mt-0.5 mr-1" /> Sign out
      </Button>
    </div>
  )
}
