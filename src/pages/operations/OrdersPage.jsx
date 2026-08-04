import React, { useEffect, useRef, useState } from 'react'
import { useCcNavigation } from '../../hooks/useCcNavigation'
import { ShoppingCart, Search, ChevronDown, Plus, X, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import { CreateOrderForm } from '../../components/operations/CreateOrderForm'
import { DataTable } from '../../components/DataTable'
import { useAuth } from '../../context/AuthContext'
import { PERMISSION_GROUPS } from '../../config/permissions'
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
  PENDING:   { label: 'Pending (legacy)',   cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
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
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
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
  const { openPanel } = useCcNavigation()
  const { t } = useTranslation()
  const { hasPermission } = useAuth()
  const canCreateOrder = PERMISSION_GROUPS.createOrder.some((perm) => hasPermission(perm))

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
        openPanel('orders', orderRef)
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
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-cc-surface md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <ShoppingCart className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h1 className="page-title">{t('orders.pageTitle')}</h1>
                <p className="page-subtitle">{t('orders.pageSubtitle')}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {canCreateOrder && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4" />
                  {t('orders.createOrderBtn')}
                </button>
              )}
            </div>
          </div>

          {/* Filters bar */}
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  load({ status: e.target.value, sector: sectorFilter })
                }}
                className="form-select"
              >
                <option value="">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                ))}
              </select>
            </div>
            {sectors.length > 0 && (
              <div className="relative">
                <select
                  value={sectorFilter}
                  onChange={(e) => {
                    setSectorFilter(e.target.value)
                    load({ status: statusFilter, sector: e.target.value })
                  }}
                  className="form-select"
                >
                  <option value="">All Sectors</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.sector_name || s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex h-32 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100" />
            </div>
          ) : (
            <DataTable
              data={orders}
              columns={[
                {
                  header: t('orders.orderId'),
                  accessor: 'order_number',
                  sortable: true,
                  render: (row) => (
                    <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">
                      {row.order_number || row.order_id || row.id?.slice(0, 8)}
                    </span>
                  ),
                },
                {
                  header: t('orders.client'),
                  accessor: 'client_name',
                  sortable: true,
                  render: (row) => row.client?.name || row.client_name || '—',
                },
                {
                  header: 'Sector',
                  accessor: 'sector',
                  sortable: false,
                  render: (row) => row.client?.sector_name || row.client?.sector_id || '—',
                },
                {
                  header: t('orders.amount'),
                  accessor: 'total_amount',
                  sortable: true,
                  render: (row) => row.total_amount != null ? `${Number(row.total_amount).toLocaleString()} DA` : '—',
                },
                {
                  header: 'Payment',
                  accessor: 'payment_method',
                  sortable: false,
                  render: (row) => <span className="capitalize">{row.payment_method || '—'}</span>,
                },
                {
                  header: t('orders.status'),
                  accessor: 'status',
                  sortable: true,
                  render: (row) => <StatusBadge status={row.status} />,
                },
                {
                  header: t('orders.date'),
                  accessor: 'created_at',
                  sortable: true,
                  render: (row) => row.order_date ? new Date(row.order_date).toLocaleDateString() : row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
                },
              ]}
              searchPlaceholder={t('orders.searchPlaceholder')}
              onRowClick={(row) => openPanel('orders', row.order_number || row.order_id || row.id)}
              emptyStateMessage={t('orders.noOrdersDesc')}
            />
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
