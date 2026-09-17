import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, role, loading } = useAuth()

  if (loading) {
    return <p className="text-center mt-10">Memuat...</p>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && role !== 'admin' && role !== 'developer') {
    return <Navigate to="/" replace />
  }

  return children
}
