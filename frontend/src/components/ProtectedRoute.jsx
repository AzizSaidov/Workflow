import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, requireRole }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireRole === 'admin' && !user?.is_admin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  if (requireRole && requireRole !== 'admin' && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
