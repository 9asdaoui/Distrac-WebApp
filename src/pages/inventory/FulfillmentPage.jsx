import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { usePanelEmbed } from '../../components/map/CcPanelHost'
import { useCcMissionFilters } from '../../components/map/CcMissionFiltersContext'
import { filterByCreatedAt } from '../../utils/filterByCreatedAt'
import apiInstance from '../../api/axiosInstance'

const STATUS_META = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  READY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  SHIPPED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  APPROVED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
}

function StatusBadge({ status }) {
  const cls = STATUS_META[status] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{status || 'UNKNOWN'}</span>
}

function FulfillmentSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              {['Order', 'Request Depot', 'Source', 'Products', 'Status', 'Updated'].map((h) => (
                <th key={h} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                {[20, 28, 24, 44, 16, 24].map((w, i) => (
                  <td key={i} className="px-6 py-4">
                    <div className={`h-4 w-${w} animate-pulse rounded bg-gray-200 dark:bg-zinc-700`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function FulfillmentPage() {
  const embedded = usePanelEmbed()
  const ccFilters = useCcMissionFilters()
  const [orders, setOrders] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  const load = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get('/industry/orders', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setOrders(res.data?.data?.orders || [])
      }
    } catch (e) {
      if (e.name !== 'CanceledError') {
        setOrders([])
        setError('Failed to load fulfillment orders.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [])

  const visibleOrders = useMemo(() => {
    const ranged =
      embedded && ccFilters?.dateFrom && ccFilters?.dateTo
        ? filterByCreatedAt(orders, ccFilters.dateFrom, ccFilters.dateTo)
        : orders
    if (!statusFilter) return ranged
    return ranged.filter((o) => o.status === statusFilter)
  }, [orders, statusFilter, embedded, ccFilters?.dateFrom, ccFilters?.dateTo])

  const statusFilterControl = (
    <div className="flex items-center gap-2">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-200"
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="READY">Ready</option>
        <option value="SHIPPED">Shipped</option>
        <option value="APPROVED">Approved</option>
      </select>
      {!isLoading && (
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{visibleOrders.length} orders</span>
      )}
    </div>
  )

  const pageBody = (
    <>
      {!embedded ? (
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-cc-surface md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <PackageCheck className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Industry restock</h1>
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                Track restock shipments from industry to your depot.
              </p>
            </div>
          </div>
          {statusFilterControl}
        </div>
      ) : null}

      {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {isLoading ? (
            <FulfillmentSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Order</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Request Depot</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Source</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Products</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order) => {
                      const sourceLabel = order.industry?.industry_name || order.source_depot?.depot_name || 'Mixed source'
                      const productSummary = (order.items || [])
                        .map((item) => `${item.products?.name || item.product_id} x${item.quantity}`)
                        .join(', ')

                      return (
                        <tr key={order.id} className="border-b border-gray-200 align-top dark:border-zinc-800">
                          <td className="px-6 py-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">{order.id.slice(0, 8)}</td>
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{order.request?.depot?.depot_name || '-'}</td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{sourceLabel}</td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{productSummary || '-'}</td>
                          <td className="px-6 py-4"><StatusBadge status={order.status} /></td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{order.updated_at ? new Date(order.updated_at).toLocaleString() : '-'}</td>
                        </tr>
                      )
                    })}
                    {visibleOrders.length === 0 && (
                      <tr>
                        <td className="px-6 py-10 text-center text-zinc-500 dark:text-zinc-400" colSpan={6}>No fulfillment orders found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
    </>
  )

  if (embedded) {
    return (
      <DepotCcPageShell
        title="Industry restock"
        subtitle="Track restock shipments from industry to your depot"
        icon={PackageCheck}
        actions={statusFilterControl}
      >
        <div className="space-y-6">{pageBody}</div>
      </DepotCcPageShell>
    )
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">{pageBody}</div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
