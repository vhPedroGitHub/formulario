import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { PageLoader } from './ui/Spinner'
import { useEffect, useState } from 'react'

export function ProtectedRoute() {
  const { isAuthenticated, fetchMe, user } = useAuthStore()
  const [checking, setChecking] = useState(!user && isAuthenticated)

  useEffect(() => {
    if (!user && isAuthenticated) {
      fetchMe().finally(() => setChecking(false))
    }
  }, []) // eslint-disable-line

  if (checking) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export function AdminRoute() {
  const { user } = useAuthStore()
  if (!user) return <PageLoader />
  if (user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}
