import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { LayoutGrid, Sparkles, Wallet, Users, CircleUser, LogOut, Plus, Zap, Search, Sun, Moon, MonitorSmartphone, ShieldCheck } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { QuickAddProvider, useQuickAdd } from '../context/QuickAddContext'
import GlobalSearchModal from './GlobalSearchModal'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutGrid, end: true },
  { to: '/life', label: 'Life', icon: Sparkles },
  { to: '/finance', label: 'Finance', icon: Wallet },
  { to: '/splitwise', label: 'Splitwise', icon: Users },
  { to: '/profile', label: 'My Profile', icon: CircleUser },
]

const ADMIN_NAV_ITEM = { to: '/admin', label: 'Admin', icon: ShieldCheck }

const PAGE_TITLE = { '/': 'Dashboard', '/life': 'Life', '/finance': 'Finance', '/splitwise': 'Splitwise', '/profile': 'My Profile', '/admin': 'Admin' }

export default function Layout() {
  return (
    <QuickAddProvider>
      <LayoutInner />
    </QuickAddProvider>
  )
}

function LayoutInner() {
  const { profile, user, signOut } = useAuth()
  const { trigger, hasHandler, label } = useQuickAdd()
  const { mode, effectiveTheme, cycle } = useTheme()
  const location = useLocation()
  const [confirmingLogout, setConfirmingLogout] = useState(false)

  const ThemeIcon = mode === 'system' ? MonitorSmartphone : effectiveTheme === 'dark' ? Moon : Sun
  const themeTitle = mode === 'system' ? `Auto (${effectiveTheme}) — click for Light` : mode === 'light' ? 'Light — click for Dark' : 'Dark — click for Auto'

  const title = PAGE_TITLE[location.pathname] || 'LifeHub'
  const [searchOpen, setSearchOpen] = useState(false)
  const navItems = profile?.is_admin ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleLogout = () => {
    if (confirmingLogout) {
      signOut()
    } else {
      setConfirmingLogout(true)
      setTimeout(() => setConfirmingLogout(false), 3000)
    }
  }

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar — fixed */}
      <aside className="hidden md:flex md:w-60 lg:w-64 flex-col border-r border-border bg-surface/60 shrink-0 fixed top-0 left-0 bottom-0 z-40">
        <div className="h-[60px] px-5 flex items-center gap-2.5 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-display font-bold text-onaccent text-sm shrink-0">
            <Zap size={16} fill="currentColor" />
          </div>
          <div className="min-w-0">
            <p className="font-display font-semibold text-[15px] leading-tight truncate">LifeHub</p>
            <p className="text-[10px] text-muted font-mono-num leading-tight">Personal Hub</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                  isActive
                    ? 'bg-accent/15 text-accent font-semibold'
                    : 'text-muted hover:text-text hover:bg-surface-2'
                }`
              }
            >
              <item.icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 pt-1 pb-2 text-center border-t border-border">
          <p className="font-mono-num text-lg font-semibold pt-2">
            {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </p>
          <p className="text-[10px] text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>

        <div className="px-3 py-3 border-t border-border flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface-3 flex items-center justify-center text-lg shrink-0">
            {profile?.avatar || '🙂'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold truncate">{profile?.name || 'Loading…'}</p>
            <p className="text-[10px] text-muted truncate font-mono-num">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition ${
              confirmingLogout ? 'bg-danger text-onaccent' : 'bg-danger/15 text-danger hover:bg-danger/25'
            }`}
          >
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col md:ml-60 lg:ml-64">
        {/* Header — present on every page */}
        <header className="h-[60px] shrink-0 border-b border-border bg-surface/60 backdrop-blur sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="min-w-0 flex-1">
            <p className="font-display font-semibold text-[16px] leading-tight truncate">{title}</p>
            <p className="text-[11px] text-muted font-mono-num truncate">
              Welcome back, {profile?.name?.split(' ')[0] || '…'} {profile?.avatar}
            </p>
          </div>
          <button
            onClick={cycle}
            title={themeTitle}
            className="w-9 h-9 rounded-xl border border-border text-muted hover:text-text hover:bg-surface-2 flex items-center justify-center shrink-0 transition"
          >
            <ThemeIcon size={16} />
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            title="Search (Ctrl+K)"
            className="w-9 h-9 rounded-xl border border-border text-muted hover:text-text hover:bg-surface-2 flex items-center justify-center shrink-0 transition"
          >
            <Search size={16} />
          </button>
          <button
            onClick={trigger}
            disabled={!hasHandler}
            className="flex items-center gap-1.5 bg-accent text-onaccent font-semibold text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl hover:brightness-110 transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-5 sm:py-7 pb-24 md:pb-8 max-w-6xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Mobile bottom tab bar - app style */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-stretch justify-between px-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] transition ${
                  isActive ? 'text-accent' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`w-9 h-7 flex items-center justify-center rounded-full ${isActive ? 'bg-accent/15' : ''}`}>
                    <item.icon size={19} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {item.label === 'My Profile' ? 'Profile' : item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
