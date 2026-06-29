import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PERMISSIONS, PERMISSION_GROUPS } from './config/permissions'
import { Login } from './pages/Login'
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
import { ClientsPage } from './pages/ClientsPage'
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
import { StockPage } from './pages/inventory/StockPage'
import { StockProductDetailPage } from './pages/inventory/StockProductDetailPage'
import { StockRequestDetailPage } from './pages/inventory/StockRequestDetailPage'

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
      <Route path="/login" element={<Login />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      <Route path="/dashboard" element={<Navigate to="/global-map" replace />} />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
            <UsersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/roles"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_ROLES}>
            <RolesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/missions"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.missions}>
            <MissionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/industries"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.industries}>
            <IndustriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/depots"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.depots}>
            <DepotsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/global-map"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.commandCenter}>
            <DashboardLayout flush>
              <GlobalMapPage />
            </DashboardLayout>
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
            <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_SETTINGS}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/industries/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSION_GROUPS.industries}>
              <IndustryDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/depots/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSION_GROUPS.depots}>
              <DepotDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ORDERS_TAB}>
              <OrderDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/missions/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSION_GROUPS.missions}>
              <MissionDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sectors/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSION_GROUPS.sectors}>
              <SectorDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_USERS}>
              <UserProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <ProtectedRoute requiredPermission={PERMISSION_GROUPS.clients}>
              <ClientsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/clients/:id"
          element={
            <ProtectedRoute requiredPermission={PERMISSION_GROUPS.clientDetail}>
              <ClientDetailsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/regions"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.regions}>
            <RegionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/sectors"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.sectors}>
            <SectorsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/vehicles"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_LOGISTICS}>
            <VehiclesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/products"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.catalogProducts}>
            <ProductsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/brands"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.catalogBrands}>
            <BrandsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/categories"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.catalogCategories}>
            <CategoriesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_ORDERS_TAB}>
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/exceptions"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.MANAGE_EXCEPTIONS}>
            <ExceptionsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/debt"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.debt}>
            <DebtPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/stock"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.stock}>
            <StockPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/stock/requests/:requestId"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.stock}>
            <StockRequestDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/stock/:productId"
        element={
          <ProtectedRoute requiredPermission={PERMISSION_GROUPS.stock}>
            <StockProductDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/proposals"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_PROPOSALS}>
            <ProposalsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory/fulfillment"
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.VIEW_FULFILLMENT}>
            <FulfillmentPage />
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/global-map" replace />} />
      <Route path="*" element={<Navigate to="/global-map" replace />} />
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
