import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { DashboardHome } from './pages/DashboardHome'
import { Unauthorized } from './pages/Unauthorized'
import { UsersPage } from './pages/UsersPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { RolesPage } from './pages/RolesPage'
import { MissionsPage } from './pages/operations/MissionsPage'
import { IndustriesPage } from './pages/logistics/IndustriesPage'
import { IndustryDetailsPage } from './pages/logistics/IndustryDetailsPage'
import { DepotsPage } from './pages/logistics/DepotsPage'
import { DepotDetailsPage } from './pages/logistics/DepotDetailsPage'
import { DashboardLayout } from './components/DashboardLayout'
import { RegionsPage } from './pages/logistics/RegionsPage'
import { SectorsPage } from './pages/logistics/SectorsPage'
import { SectorDetailsPage } from './pages/logistics/SectorDetailsPage'
import { GlobalMapPage } from './pages/logistics/GlobalMapPage'
import { ClientDetailsPage } from './pages/logistics/ClientDetailsPage'
import { VehiclesPage } from './pages/logistics/VehiclesPage'
import { ProductsPage } from './pages/catalog/ProductsPage'
import { BrandsPage } from './pages/catalog/BrandsPage'
import { CategoriesPage } from './pages/catalog/CategoriesPage'
import { OrdersPage } from './pages/operations/OrdersPage'
import { OrderDetailsPage } from './pages/operations/OrderDetailsPage'
import { MissionDetailsPage } from './pages/operations/MissionDetailsPage'
import { ExceptionsPage } from './pages/operations/ExceptionsPage'
import { DebtPage } from './pages/finance/DebtPage'
import { ProposalsPage } from './pages/inventory/ProposalsPage'
import { FulfillmentPage } from './pages/inventory/FulfillmentPage'

function AppRoutes() {
  const { isAuthLoading } = useAuth()
  const location = useLocation()

  if (isAuthLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100"></div>
          <p className="font-medium text-zinc-700 dark:text-zinc-300">Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardHome />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission="manage_users">
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/roles"
        element={
          <ProtectedRoute requiredPermission="manage_roles">
            <RolesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/missions"
        element={
          <ProtectedRoute requiredPermission={['view_missions', 'approve_missions', 'manage_logistics']}>
            <MissionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/industries"
        element={
          <ProtectedRoute requiredPermission={['view_industries', 'view_logistics_tab', 'manage_logistics']}>
            <IndustriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/depots"
        element={
          <ProtectedRoute requiredPermission={['view_depots', 'view_logistics_tab', 'manage_logistics']}>
            <DepotsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/global-map"
        element={
          <ProtectedRoute requiredPermission={['view_logistics_tab', 'manage_logistics']}>
            <GlobalMapPage />
          </ProtectedRoute>
        }
      />

      <Route element={<DashboardLayout />}>
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industries/:id"
          element={
            <ProtectedRoute requiredPermission={['view_industries', 'view_logistics_tab', 'manage_logistics']}>
              <IndustryDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/depots/:id"
          element={
            <ProtectedRoute requiredPermission={['view_depots', 'view_logistics_tab', 'manage_logistics']}>
              <DepotDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute requiredPermission="view_orders_tab">
              <OrderDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/missions/:id"
          element={
            <ProtectedRoute requiredPermission={['view_missions', 'approve_missions', 'manage_logistics']}>
              <MissionDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sectors/:id"
          element={
            <ProtectedRoute requiredPermission={['view_sectors', 'view_logistics_tab', 'manage_logistics']}>
              <SectorDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute requiredPermission="manage_users">
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute requiredPermission={['view_logistics_tab', 'manage_logistics']}>
              <ClientDetailsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/regions"
        element={
          <ProtectedRoute requiredPermission={['view_regions', 'view_logistics_tab', 'manage_logistics']}>
            <RegionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sectors"
        element={
          <ProtectedRoute requiredPermission={['view_sectors', 'view_logistics_tab', 'manage_logistics']}>
            <SectorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vehicles"
        element={
          <ProtectedRoute requiredPermission="manage_logistics">
            <VehiclesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute requiredPermission={['view_products', 'manage_products']}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/brands"
        element={
          <ProtectedRoute requiredPermission={['view_brands', 'manage_products']}>
            <BrandsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute requiredPermission={['view_categories', 'manage_products']}>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute requiredPermission="view_orders_tab">
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exceptions"
        element={
          <ProtectedRoute requiredPermission="manage_exceptions">
            <ExceptionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/debt"
        element={
          <ProtectedRoute requiredPermission={['view_reports_tab', 'view_finance']}>
            <DebtPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/proposals"
        element={
          <ProtectedRoute>
            <ProposalsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/fulfillment"
        element={
          <ProtectedRoute>
            <FulfillmentPage />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
    </AnimatePresence>
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
