import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '../components/ui'

// Reached via the link emailed by the custom-auth Edge Function:
// {LIFEHUB_APP_URL}/verify?token=...
export default function VerifyEmail() {
  const { verifyEmail } = useAuth()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const [status, setStatus] = useState('checking') // checking | ok | error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('This confirmation link is missing its token.')
      return
    }
    verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'This confirmation link is invalid or has expired.')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-onaccent">L</div>
          <span className="font-display font-semibold text-xl">LifeHub</span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-6">
          {status === 'checking' && (
            <>
              <Spinner />
              <p className="text-sm text-muted mt-2">Confirming your email…</p>
            </>
          )}
          {status === 'ok' && (
            <>
              <p className="text-sm text-success mb-4">Your email is confirmed! You can sign in now.</p>
              <Link to="/login" className="text-sm text-accent hover:brightness-110">Go to sign in</Link>
            </>
          )}
          {status === 'error' && (
            <>
              <p className="text-sm text-danger mb-4">{message}</p>
              <Link to="/login" className="text-sm text-accent hover:brightness-110">Back to sign in</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
