import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, setAuthToken } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const SESSION_KEY = 'lifehub_session_v2'

async function callAuth(action, payload) {
  const { data, error } = await supabase.functions.invoke('custom-auth', {
    body: {
      action,
      app: 'lifehub',
      ...payload,
    },
  })

  // Successful response
  if (!error) {
    if (data?.error) {
      throw new Error(data.error)
    }

    return data
  }

  console.log('[callAuth] Supabase error:', error)
  console.log('[callAuth] error context:', error.context)

  // --------------------------------------------------
  // IMPORTANT:
  // Supabase FunctionsHttpError stores the actual
  // Edge Function Response in error.context
  // --------------------------------------------------

  let actualMessage = null

  try {
    const response = error.context

    if (response) {
      // Clone so we don't consume the original response
      const clonedResponse =
        typeof response.clone === 'function'
          ? response.clone()
          : response

      const text = await clonedResponse.text()

      console.log('[callAuth] Edge Function response:', text)

      if (text) {
        try {
          const json = JSON.parse(text)

          actualMessage =
            json?.error ||
            json?.message ||
            json?.error_description ||
            null
        } catch {
          // Response wasn't JSON
          actualMessage = text
        }
      }
    }
  } catch (parseError) {
    console.error('[callAuth] Could not parse error response:', parseError)
  }

  // --------------------------------------------------
  // If Edge Function sent:
  //
  // {"error":"Invalid email or password."}
  //
  // this will now be shown to the user.
  // --------------------------------------------------

  if (actualMessage) {
    throw new Error(actualMessage)
  }

  // --------------------------------------------------
  // Fallback only when we genuinely don't have an
  // application-level error message.
  // --------------------------------------------------

  throw new Error(
    error.message || 'Something went wrong. Please try again.'
  )
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (
      !parsed?.token ||
      !parsed?.expiresAt ||
      Date.now() > parsed.expiresAt
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

function saveSession(sessionObj) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionObj))
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const existing = loadSession()

    if (existing) {
      setAuthToken(existing.token)
      setProfile(existing.profile)
    }

    setLoading(false)
  }, [])

  const signUp = async ({ name, email, password }) => {
    return callAuth('signup', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    })
  }

  const signIn = async ({ email, password }) => {
    const result = await callAuth('login', {
      email: email.trim().toLowerCase(),
      password,
    })

    saveSession({
      token: result.token,
      expiresAt: Date.now() + result.expiresIn * 1000,
      profile: result.profile,
    })

    setAuthToken(result.token)
    setProfile(result.profile)

    return result
  }

  const signOut = () => {
    clearSession()
    setAuthToken(null)
    setProfile(null)
    window.location.replace('/LifeHub/login')
  }

  const resendVerification = (email) =>
    callAuth('resend_verification', {
      email: email.trim().toLowerCase(),
    })

  const verifyEmail = (token) =>
    callAuth('verify_email', { token })

  const resetPassword = (email) =>
    callAuth('request_reset', {
      email: email.trim().toLowerCase(),
    })

  const resetPasswordWithToken = (token, newPassword) =>
    callAuth('reset_password', {
      token,
      newPassword,
    })

  const changePassword = (currentPassword, newPassword) =>
    callAuth('change_password', {
      currentPassword,
      newPassword,
    })

  const refreshProfile = async () => {
    if (!profile?.id) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .maybeSingle()

    if (data) {
      setProfile(data)

      const existing = loadSession()

      if (existing) {
        saveSession({
          ...existing,
          profile: data,
        })
      }
    }
  }

  const value = {
    user: profile,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    resendVerification,
    verifyEmail,
    resetPassword,
    resetPasswordWithToken,
    changePassword,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)

  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return ctx
}