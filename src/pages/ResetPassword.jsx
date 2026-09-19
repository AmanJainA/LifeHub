import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

// Reached via the link emailed by the custom-auth Edge Function:
// {LIFEHUB_APP_URL}/reset-password?token=...
export default function ResetPassword() {
  const { resetPasswordWithToken } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      await resetPasswordWithToken(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setError(err.message || 'Could not update password right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-onaccent">L</div>
          <span className="font-display font-semibold text-xl">LifeHub</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          <h1 className="font-display text-lg font-semibold mb-1">Set a new password</h1>
          <p className="text-sm text-muted mb-5">Choose a new password for your account.</p>

          {!token ? (
            <p className="text-sm text-danger">This reset link is missing its token. Please use the link from your email.</p>
          ) : done ? (
            <p className="text-sm text-success">Password updated! Redirecting to login…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" minLength={6} required />
              <Input label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" minLength={6} required />

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          )}

          <Link to="/login" className="text-sm text-muted hover:text-accent mt-4 w-full block text-center">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
