import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Button, Input } from '../components/ui'

const RESEND_COOLDOWN = 45

export default function Login() {
  const { signIn, signUp, resendVerification } = useAuth()
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  const [pendingEmail, setPendingEmail] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)
    try {
      if (mode === 'signin') {
        await signIn({ email: form.email, password: form.password })
      } else {
        await signUp(form)
        setPendingEmail(form.email)
        setResendCooldown(RESEND_COOLDOWN)
        setNotice('Account created. Check your inbox (and spam/promotions folder) for a confirmation link, then sign in.')
        setMode('signin')
      }
    } catch (err) {
      const msg = err.message || 'Something went wrong'
      if (/confirm your email/i.test(msg)) {
        setPendingEmail(form.email)
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    const email = pendingEmail || form.email
    if (!email || resendCooldown > 0) return
    setResending(true)
    setError('')
    try {
      await resendVerification(email)
      setNotice('Confirmation email resent. Please also check spam/junk — it can take a few minutes.')
      setResendCooldown(RESEND_COOLDOWN)
    } catch (err) {
      setError(err.message || 'Could not resend the email right now.')
    } finally {
      setResending(false)
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
          <h1 className="font-display text-lg font-semibold mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-muted mb-5">
            {mode === 'signin' ? 'Sign in to your command center' : 'Tasks, finances, and splitwise in one place'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <Input label="Name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" required />
            )}
            <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" required />
            <Input label="Password" type="password" name="password" value={form.password} onChange={handleChange} placeholder="••••••••" required minLength={6} />

            {mode === 'signin' && (
              <div className="text-right -mt-1">
                <Link to="/forgot-password" className="text-xs text-muted hover:text-accent">
                  Forgot password?
                </Link>
              </div>
            )}

            {error && <p className="text-sm text-danger">{error}</p>}
            {notice && <p className="text-sm text-success">{notice}</p>}

            <Button type="submit" className="w-full mt-2" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Sign up'}
            </Button>
          </form>

          {pendingEmail && mode === 'signin' && (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || resendCooldown > 0}
              className="text-sm text-accent hover:brightness-110 mt-3 w-full text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0
                ? `Resend confirmation email (${resendCooldown}s)`
                : resending
                ? 'Resending…'
                : 'Resend confirmation email'}
            </button>
          )}

          <button
            className="text-sm text-muted hover:text-accent mt-4 w-full text-center"
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setNotice('') }}
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  )
}
