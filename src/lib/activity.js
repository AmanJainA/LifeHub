import { supabase } from './supabaseClient'

const SESSION_KEY = 'lifehub_session_v2'

function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null

    const session = JSON.parse(raw)

    if (!session?.token || !session?.profile?.id) return null
    if (session.expiresAt && Date.now() > session.expiresAt) return null

    return session
  } catch {
    return null
  }
}

export async function recordPageVisit(pageName) {
  const session = getSession()

  if (!session?.activitySessionId || !session?.profile?.id) {
    return false
  }

  const { error } = await supabase.rpc('record_page_visit', {
    p_user_id: session.profile.id,
    p_session_id: session.activitySessionId,
    p_page_name: pageName || `${window.location.pathname}${window.location.search}${window.location.hash}`,
    p_ip_address: null,
  })

  if (error) {
    console.error('[activity] record_page_visit failed:', error)
    return false
  }

  return true
}

export async function heartbeatSession() {
  const session = getSession()

  if (!session?.activitySessionId || !session?.profile?.id) {
    return false
  }

  const { error } = await supabase.rpc('session_heartbeat', {
    p_user_id: session.profile.id,
    p_session_id: session.activitySessionId,
  })

  if (error) {
    console.error('[activity] session_heartbeat failed:', error)
    return false
  }

  return true
}
