import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

const baseUrl = supabaseUrl || 'https://wrssvnvagpnvlwhnqqta.supabase.co'
const baseKey = supabaseAnonKey || 'sb_publishable_AEu-JBRYrCLYrVq3VjAtyA_ya5ApyuM'

// LifeHub uses custom authentication.
// The JWT issued by custom-auth is stored in localStorage and is supplied
// dynamically to every Supabase request through accessToken(). This avoids
// stale Authorization headers when a user logs in, logs out, or refreshes
// the page. The API key remains the public Supabase publishable/anon key;
// the user's custom JWT is sent separately as the Authorization bearer token.

const getStoredToken = () => {
  try {
    return localStorage.getItem('lifehub_custom_token') || null
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  // Kept for AuthContext compatibility.
  // The Supabase client reads the latest token directly from localStorage.
  if (token) {
    try {
      localStorage.setItem('lifehub_custom_token', token)
    } catch {
      // Ignore storage errors; the next request will simply be unauthenticated.
    }
  }
}

export const supabase = createClient(baseUrl, baseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  accessToken: async () => getStoredToken(),
})
