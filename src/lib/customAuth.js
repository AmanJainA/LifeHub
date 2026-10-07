import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export function getCustomToken() {
  try {
    return localStorage.getItem('lifehub_custom_token')
  } catch {
    return null
  }
}

export function setCustomToken(token) {
  try {
    if (token) localStorage.setItem('lifehub_custom_token', token)
    else localStorage.removeItem('lifehub_custom_token')
  } catch {
    // Ignore storage errors.
  }
}

export function clearCustomToken() {
  try {
    localStorage.removeItem('lifehub_custom_token')
  } catch {
    // Ignore storage errors.
  }
}

export async function customAuth(action, payload = {}) {
  let sessionId = null
  try {
    const session = JSON.parse(localStorage.getItem('lifehub_session_v2') || '{}')
    sessionId = session?.sessionId || null
  } catch {
    sessionId = null
  }

  const res = await fetch(
    supabaseUrl + '/functions/v1/custom-auth',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        ...(sessionId ? { 'x-lifehub-session': sessionId } : {}),
      },
      body: JSON.stringify({ action, app: 'lifehub', ...payload }),
    }
  )

  const data = await res.json()
  if (!res.ok || data.error) {
    throw new Error(data.error || 'Request failed')
  }
  return data
}

// Use the same JWT-independent client as the rest of LifeHub.
export { supabase } from './supabaseClient'
