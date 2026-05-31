import { Navigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function ProtectedRoute({ children, requireRole }) {
  const { accessToken, user } = useAuthStore()
  const location = useLocation()

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireRole && user?.role !== requireRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
