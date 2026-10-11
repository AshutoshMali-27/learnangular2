import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PageLoader } from '@/components/shared/PageLoader'
import { useCurrentUser } from '@/features/auth'

export function ProtectedRoute() {
  const location = useLocation()
  const { data: user, isPending } = useCurrentUser()

  if (isPending) return <PageLoader label="Checking session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}
