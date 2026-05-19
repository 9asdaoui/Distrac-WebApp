import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, requiredPermission = null }) {
  const { isAuthenticated, hasPermission, isAuthLoading } = useAuth()

  const hasRequiredPermission = (permission) => {
    if (!permission) return true
    if (Array.isArray(permission)) {
      return permission.some((perm) => hasPermission(perm))
    }
    return hasPermission(permission)
  }

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          <p className="text-zinc-700 dark:text-zinc-300">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthLoading && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (!hasRequiredPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}
