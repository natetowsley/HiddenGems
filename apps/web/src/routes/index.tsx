import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import LoginPage from '@/pages/LoginPage'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const role = user?.app_metadata?.role as string | undefined
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (role !== 'admin') return <Navigate to="/" replace />
  return <>{children}</>
}

// Temporary placeholder rendered at '/' until the map page is built.
function AppShell() {
  const { signOut, user } = useAuth()
  return (
    <div style={{ padding: 40, fontFamily: 'Outfit, sans-serif', background: '#0c0f08', minHeight: '100vh', color: '#f0ead8' }}>
      <p style={{ color: '#d4a853', letterSpacing: '0.15em', fontSize: 11 }}>HIDDEN GEMS</p>
      <p style={{ marginTop: 24 }}>Signed in as <strong>{user?.email}</strong></p>
      <p style={{ color: '#4a4435', marginTop: 8, fontSize: 13 }}>Map page coming soon.</p>
      <button
        onClick={signOut}
        style={{ marginTop: 24, background: '#d4a853', color: '#0c0f08', border: 'none', borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600 }}
      >
        Sign out
      </button>
    </div>
  )
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RequireAuth><AppShell /></RequireAuth>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
