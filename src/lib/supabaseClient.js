import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const baseUrl = supabaseUrl || 'https://wrssvnvagpnvlwhnqqta.supabase.co'
const baseKey = supabaseAnonKey || 'sb_publishable_AEu-JBRYrCLYrVq3VjAtyA_ya5ApyM'

const SESSION_KEY = 'lifehub_session_v2'
const TOKEN_KEY = 'lifehub_custom_token'

const getStoredSessionId = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    return session?.sessionId || null
  } catch {
    return null
  }
}

// CRUD requests never send the custom JWT. They use the public API key
// plus the opaque server-tracked LifeHub session header. This keeps
// PostgREST CRUD independent of HS256/ES256 JWT signing keys.
const lifeHubFetch = async (input, init = {}) => {
  const headers = new Headers(
    init?.headers || (input instanceof Request ? input.headers : undefined)
  )

  headers.delete('Authorization')

  const sessionId = getStoredSessionId()
  if (sessionId) headers.set('x-lifehub-session', sessionId)
  else headers.delete('x-lifehub-session')

  return fetch(input, {
    ...init,
    headers,
  })
}

export function setAuthToken(token) {
  // Kept for AuthContext compatibility. This token is no longer used
  // for PostgREST CRUD requests.
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Ignore storage errors.
  }
}

export const supabase = createClient(baseUrl, baseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    fetch: lifeHubFetch,
  },
})
