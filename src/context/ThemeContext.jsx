import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const ThemeContext = createContext(null)
const STORAGE_KEY = 'lifehub-theme' // 'system' | 'light' | 'dark'

function getSystemTheme() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) || 'system' } catch { return 'system' }
  })
  const [systemTheme, setSystemTheme] = useState(getSystemTheme)

  // Live-updates if the OS/browser theme changes while the app is open
  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light')
    mq.addEventListener?.('change', handler)
    return () => mq.removeEventListener?.('change', handler)
  }, [])

  const effectiveTheme = mode === 'system' ? systemTheme : mode

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', effectiveTheme)
  }, [effectiveTheme])

  const setThemeMode = useCallback((m) => {
    setMode(m)
    try { localStorage.setItem(STORAGE_KEY, m) } catch { /* ignore */ }
  }, [])

  const cycle = useCallback(() => {
    const order = ['system', 'light', 'dark']
    setThemeMode(order[(order.indexOf(mode) + 1) % order.length])
  }, [mode, setThemeMode])

  return (
    <ThemeContext.Provider value={{ mode, effectiveTheme, setThemeMode, cycle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
