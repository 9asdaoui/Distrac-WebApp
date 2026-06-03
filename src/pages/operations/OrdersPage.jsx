import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Search, ChevronDown, Plus, X, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import { CreateOrderForm } from '../../components/operations/CreateOrderForm'
import { useAuth } from '../../context/AuthContext'
import apiInstance from '../../api/axiosInstance'

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null
  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
        }`}
      >
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const STATUS_META = {
  PENDING:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  ESCALATED: { label: 'Escalated', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  READY:     { label: 'Ready',     cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  IN_TRANSIT:{ label: 'In Transit',cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  DELIVERED: { label: 'Delivered', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  REFUSED:   { label: 'Refused',   cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.cls}`}>
      {meta.label}
    </span>
  )
}

function OrdersSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              {['Order #', 'Client', 'Sector', 'Total', 'Payment', 'Status', 'Date'].map((h) => (
                <th key={h} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((row) => (
              <motion.tr
                key={row}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: row * 0.05 }}
                className="border-b border-gray-200 dark:border-zinc-800"
              >
                {[40, 28, 24, 16, 20, 20, 24].map((w, i) => (
                  <td key={i} className="px-6 py-4">
                    <div className={`h-4 w-${w} animate-pulse rounded bg-gray-200 dark:bg-zinc-700`} />
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const ALL_STATUSES = ['PENDING', 'ESCALATED', 'CONFIRMED', 'READY', 'IN_TRANSIT', 'DELIVERED', 'REFUSED', 'CANCELLED']

export function OrdersPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canCreateOrder = hasPermission('create_order')

  const [orders, setOrders] = useState([])
  const [sectors, setSectors] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const controllerRef = useRef(null)
  const createFormRef = useRef(null)

  const load = async (params = {}) => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (params.search)  queryParams.set('search', params.search)
      if (params.status)  queryParams.set('status', params.status)
      if (params.sector)  queryParams.set('sectorId', params.sector)
      queryParams.set('limit', '50')

      const res = await apiInstance.get(`/orders?${queryParams}`, { signal: controller.signal })
      if (!controller.signal.aborted) {
        const raw = res.data?.data?.orders || res.data?.data || []
        setOrders(Array.isArray(raw) ? raw : [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') setOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const loadSectors = async () => {
      try {
        const res = await apiInstance.get('/sectors')
        setSectors(res.data?.data?.sectors || [])
      } catch {}
    }
    loadSectors()
    load()
    return () => controllerRef.current?.abort()
  }, [])

  const applyFilters = () => load({ search, status: statusFilter, sector: sectorFilter })

  const handleKeyDown = (e) => { if (e.key === 'Enter') applyFilters() }

  const openCreate = () => {
    setFormError('')
    createFormRef.current?.reset?.()
    setIsCreateOpen(true)
  }

  const handleCreateOrder = async () => {
    if (!createFormRef.current?.submit) return
    setIsSubmitting(true)
    setFormError('')
    try {
      const order = await createFormRef.current.submit()
      setIsCreateOpen(false)
      createFormRef.current.reset?.()
      setToast({ message: 'Order created successfully.', type: 'success' })
      load({ search, status: statusFilter, sector: sectorFilter })
      const orderRef = order?.order_number || order?.order_id || order?.id
      if (orderRef) {
        navigate(`/orders/${encodeURIComponent(orderRef)}`)
      }
    } catch (err) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to create order.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <AnimatedPage>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <ShoppingCart className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Orders</h1>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Track client order lifecycle and delivery status.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!isLoading && (
                <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{orders.length} orders</span>
              )}
              {canCreateOrder && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  <Plus className="h-4 w-4" />
                  Add Order
                </button>
              )}
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search order # or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-8 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            </div>
            {sectors.length > 0 && (
              <div className="relative">
                <select
                  value={sectorFilter}
                  onChange={(e) => setSectorFilter(e.target.value)}
                  className="appearance-none rounded-lg border border-gray-200 bg-white py-2.5 pl-4 pr-8 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  <option value="">All Sectors</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.sector_name || s.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              </div>
            )}
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              Filter
            </button>
          </div>

          {/* Table */}
          {isLoading ? (
            <OrdersSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Order #</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Client</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Sector</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Total</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Payment</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => {
                      const orderRef = order.order_number || order.order_id || order.id
                      return (
                      <motion.tr
                        key={order.id || orderRef}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => navigate('/orders/' + encodeURIComponent(orderRef))}
                        className="cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-6 py-4 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                          {order.order_number || order.order_id || order.id?.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                          {order.client?.name || order.client_name || '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                          {order.client?.sector_name || order.client?.sector_id || '—'}
                        </td>
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                          {order.total_amount != null
                            ? `${Number(order.total_amount).toLocaleString()} DA`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400 capitalize">
                          {order.payment_method || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                          {order.order_date
                            ? new Date(order.order_date).toLocaleDateString()
                            : order.created_at
                            ? new Date(order.created_at).toLocaleDateString()
                            : '—'}
                        </td>
                      </motion.tr>
                      )
                    })}
                    {orders.length === 0 && (
                      <tr>
                        <td className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={7}>
                          No orders match the current filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AnimatedPage>

      <SlideOverPanel
        isOpen={isCreateOpen}
        onClose={() => !isSubmitting && setIsCreateOpen(false)}
        disableClose={isSubmitting}
        title="Create Order"
        description="Place a new client order with line items and cash payment on delivery."
        maxWidthClass="max-w-3xl"
        footer={
          <div className="space-y-3">
            {formError ? <p className="text-sm text-red-500">{formError}</p> : null}
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleCreateOrder}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isSubmitting ? 'Creating…' : 'Create Order'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsCreateOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        }
      >
        {isCreateOpen ? <CreateOrderForm ref={createFormRef} /> : null}
      </SlideOverPanel>
    </DashboardLayout>
  )
}
