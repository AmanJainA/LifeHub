import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const baseUrl = supabaseUrl || 'https://ixjdjvkktlzgiyojnsto.supabase.co'
const baseKey = supabaseAnonKey || 'sb_publishable_Qb66X-cvzAckaQev2ku1VA__CoLmIB1'

// --------------------------------------------------------------------
// Custom-auth token handling.
//
// We no longer use supabase.auth.signIn/signUp (see AuthContext.jsx).
// Instead, our own Edge Function ("custom-auth") signs a JWT after a
// successful login. We attach that JWT as a plain Authorization header
// on a fresh Supabase client instance, so every `supabase.from(...)`
// call elsewhere in the app keeps working completely unchanged — RLS's
// auth.uid() resolves correctly because the JWT's `sub` claim is the
// profile's id.
//
// The exported `supabase` is a Proxy that always forwards to whichever
// client instance is "current", so existing imports/usages don't need
// to change when the token is set or cleared.
// --------------------------------------------------------------------
function buildClient(token) {
  return createClient(baseUrl, baseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : {},
  })
}

let currentClient = buildClient(null)

export function setAuthToken(token) {
  currentClient = buildClient(token || null)
}

export const supabase = new Proxy(
  {},
  {
    get(_target, prop) {
      const value = currentClient[prop]
      return typeof value === 'function' ? value.bind(currentClient) : value
    },
  },
)
