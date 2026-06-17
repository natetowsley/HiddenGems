import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AuthLayout from '@/components/AuthLayout'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import MapPage from '@/pages/MapPage'
import ProfilePage from '@/pages/ProfilePage'
import CollectionPage from '@/pages/CollectionPage'
import SettingsPage from '@/pages/SettingsPage'

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

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<RequireAuth><AuthLayout /></RequireAuth>}>
          <Route path="/" element={<MapPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:username" element={<ProfilePage />} />
          <Route path="/collections/:id" element={<CollectionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
