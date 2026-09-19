import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    try {
      await resetPassword(email)
      setMessage('If that email exists, a reset link has been sent — check your inbox (and spam).')
    } catch (err) {
      setError(err.message || 'Could not send reset email right now.')
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
          <h1 className="font-display text-lg font-semibold mb-1">Reset your password</h1>
          <p className="text-sm text-muted mb-5">Enter the email on your account and we'll send you a reset link.</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            {error && <p className="text-sm text-danger">{error}</p>}
            {message && <p className="text-sm text-success">{message}</p>}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </Button>
          </form>

          <Link to="/login" className="text-sm text-muted hover:text-accent mt-4 w-full block text-center">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}