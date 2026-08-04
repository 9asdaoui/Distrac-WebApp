import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PERMISSION_GROUPS } from './config/permissions'
import { Login } from './pages/Login'
import { Unauthorized } from './pages/Unauthorized'
import { DashboardLayout } from './components/DashboardLayout'
import { GlobalMapPage } from './pages/logistics/GlobalMapPage'
import { legacyGlobalMapSearchToPath } from './components/map/ccPanelRegistry'

/** Old /global-map?panel=… / ?type=… → top-level paths */
function LegacyGlobalMapRedirect() {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const to = legacyGlobalMapSearchToPath(params)
  return <Navigate to={to} replace />
}

function CommandCenterShell() {
  return (
    <ProtectedRoute requiredPermission={PERMISSION_GROUPS.commandCenter}>
      <DashboardLayout flush>
        <GlobalMapPage />
      </DashboardLayout>
    </ProtectedRoute>
  )
}

function AppRoutes() {
  const { isAuthLoading } = useAuth()

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-cc-bg">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/global-map" element={<LegacyGlobalMapRedirect />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      {/* Command Center shell — Home `/` and all module paths */}
      <Route path="/*" element={<CommandCenterShell />} />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  )
}

export default App
