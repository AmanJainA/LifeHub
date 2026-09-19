import { createClient } from '@supabase/supabase-js'
const supabaseUrl=import.meta.env.VITE_SUPABASE_URL; const supabaseAnonKey=import.meta.env.VITE_SUPABASE_ANON_KEY
export const isSupabaseConfigured=Boolean(supabaseUrl&&supabaseAnonKey)
export function getCustomToken(){return localStorage.getItem('lifehub_custom_token')}
export function setCustomToken(token){localStorage.setItem('lifehub_custom_token',token)}
export function clearCustomToken(){localStorage.removeItem('lifehub_custom_token')}
export async function customAuth(action,payload={}){const token=getCustomToken();const res=await fetch(`${supabaseUrl}/functions/v1/custom-auth`,{method:'POST',headers:{'Content-Type':'application/json',apikey:supabaseAnonKey,...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({action,app:'lifehub',...payload})});const data=await res.json();if(!res.ok||data.error)throw new Error(data.error||'Request failed');return data}
export const supabase=createClient(supabaseUrl||'https://placeholder.supabase.co',supabaseAnonKey||'placeholder-anon-key',{auth:{persistSession:false},accessToken:async()=>getCustomToken()})
