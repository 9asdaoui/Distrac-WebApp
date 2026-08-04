import React, { useRef } from 'react'
import { Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { ProductCatalogTab } from '../../components/inventory/ProductCatalogTab'
import { useAuth } from '../../context/AuthContext'

export function ProductsPage() {
  const { hasPermission } = useAuth()
  const canManageCatalog = hasPermission('manage_products')
  const catalogRef = useRef(null)

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-cc-surface sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Products</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage the product catalog used by depot stock requests and orders.
                {canManageCatalog ? ' Add, edit, or deactivate items below.' : ' Read-only view.'}
              </p>
            </div>
            {canManageCatalog && (
              <button
                type="button"
                onClick={() => catalogRef.current?.openCreateForm()}
                className="btn-primary shrink-0"
              >
                <Plus className="h-4 w-4" />
                Add product
              </button>
            )}
          </div>
          <ProductCatalogTab ref={catalogRef} canManage={canManageCatalog} />
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
