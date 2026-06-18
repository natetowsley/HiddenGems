import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { apiGet } from '@/api/client'
import type { UserResponse } from '@/types'
import AuthLayout from '@/components/AuthLayout'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import MapPage from '@/pages/MapPage'
import ProfilePage from '@/pages/ProfilePage'
import CollectionPage from '@/pages/CollectionPage'
import SettingsPage from '@/pages/SettingsPage'
import AdminPage from '@/pages/AdminPage'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => apiGet<UserResponse>('/api/users/me'),
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  })

  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  if (profileLoading) return null
  if (profile?.role !== 'admin') return <Navigate to="/" replace />
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
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
