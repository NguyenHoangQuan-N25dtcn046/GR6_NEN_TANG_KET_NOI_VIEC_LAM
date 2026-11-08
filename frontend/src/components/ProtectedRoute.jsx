import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ role, children }) {
  const { isAuthenticated, role: userRole } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if (role && userRole !== role) {
    return <Navigate to="/" replace />
  }
  return children
}
