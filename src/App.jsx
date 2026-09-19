import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { isSupabaseConfigured } from './lib/supabaseClient'
import Layout from './components/Layout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Life from './pages/Life'
import Finance from './pages/Finance'
import Splitwise from './pages/Splitwise'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import SetupNeeded from './pages/SetupNeeded'
import { Spinner } from './components/ui'

function Protected({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={loading ? <div className="min-h-screen flex items-center justify-center"><Spinner /></div> : user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify" element={<VerifyEmail />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="life" element={<Life />} />
        <Route path="finance" element={<Finance />} />
        <Route path="splitwise" element={<Splitwise />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  if (!isSupabaseConfigured) {
    return (
      <ThemeProvider>
        <SetupNeeded />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <BrowserRouter basename="/LifeHub">
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
