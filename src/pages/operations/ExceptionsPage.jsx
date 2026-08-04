import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, X, CheckCircle2, XCircle, Package, Truck, RotateCcw, CreditCard, Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { getAuthRoleName } from '../../components/map/ccPanelRegistry'
import { useAuth } from '../../context/AuthContext'
import apiInstance from '../../api/axiosInstance'

// Role-based header messages
const ROLE_HEADER_CONFIG = {
  GENERAL_MANAGEMENT: {
    title: 'Exception Control Room',
    subtitle: 'Platform-wide exception management & oversight.',
  },
  DEPOT_SUPERVISOR: {
    title: 'Depot Exception Inbox',
    subtitle: 'Manage operational exceptions for your depot.',
  },
  DEPOT_MANAGER: {
    title: 'Depot Exception Inbox',
    subtitle: 'Review and resolve exceptions for your depot operations.',
  },
  SUPERVISOR: {
    title: 'Operations Exception Inbox',
    subtitle: 'Oversee exceptions across all depots.',
  },
  default: {
    title: 'Exception Inbox',
    subtitle: 'Review and resolve operational exceptions.',
  },
}

// Exception type mapper: to KPI categories
const EXCEPTION_TYPE_MAP = {
  VENDOR_LOAD: 'VENDOR_LOAD',
  LIVREUR_MISSION: 'LIVREUR_MISSION',
  RETURN: 'RETURN',
  PAYMENT_CHANGE: 'PAYMENT_CHANGE',
}

const TYPE_META = {
  VENDOR_LOAD: { label: 'Vendor Loads',    cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  LIVREUR_MISSION: { label: 'Livreur Missions', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  RETURN: { label: 'Returns',         cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  PAYMENT_CHANGE: { label: 'Payment Changes', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  CLIENT_REFUSAL: { label: 'Client Refusal',    cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  CREDIT_REQUEST: { label: 'Credit Request',    cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  CHECK_REQUEST:  { label: 'Check Approval',    cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  PARTIAL_PAYMENT:{ label: 'Partial Payment',   cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
}

const STATUS_META = {
  PENDING:  { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', color: 'yellow' },
  APPROVED: { label: 'Approved', cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', color: 'green' },
  REJECTED: { label: 'Rejected', cls: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', color: 'red' },
}

const SEV_META = {
  info:     { label: 'Info',     cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  warning:  { label: 'Warning',  cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
}

function Badge({ label, cls }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
}

function KpiCard({ icon: Icon, label, count, color = 'blue' }) {
  const bgColor = {
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
  }[color]

  const textColor = {
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
  }[color]

  const iconColor = {
    amber: 'text-amber-500 dark:text-amber-400',
    blue: 'text-blue-500 dark:text-blue-400',
    green: 'text-green-500 dark:text-green-400',
    purple: 'text-purple-500 dark:text-purple-400',
  }[color]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`rounded-xl border-2 ${bgColor} p-4 transition hover:shadow-md`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-bold ${textColor}`}>{count}</p>
        </div>
      </div>
    </motion.div>
  )
}

function ExceptionsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              {['Type', 'Raised By', 'Severity', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <motion.tr key={row} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: row * 0.05 }}
                className="border-b border-gray-200 dark:border-zinc-800">
                {[28, 32, 20, 20, 24, 12].map((w, i) => (
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

function ResolvePanel({ exception, onClose, onResolved }) {
  const [approved, setApproved] = useState(true)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!notes.trim()) {
      setError('Please add a note confirming the call and decision.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      await apiInstance.post(`/exceptions/${exception.id}/resolve`, {
        approved,
        notes,
        ledgerId: exception.payload?.ledger_id || undefined,
      })
      onResolved()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to resolve exception.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const payload = exception.payload || {}

  return (
    <motion.div
      className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Resolve Exception</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Confirm you have called the client and make a decision.
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Exception details */}
      <div className="mb-6 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3 dark:border-zinc-800 dark:bg-cc-surface">
        <div className="flex flex-wrap gap-2">
          {(() => {
            const tm = TYPE_META[exception.exception_type] || { label: exception.exception_type, cls: 'bg-zinc-100 text-zinc-500' }
            const sm = SEV_META[exception.severity] || { label: exception.severity, cls: 'bg-zinc-100 text-zinc-500' }
            return (<><Badge label={tm.label} cls={tm.cls} /><Badge label={sm.label} cls={sm.cls} /></>)
          })()}
        </div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-1">
          <p><span className="font-medium">Raised by:</span> {exception.raiser?.full_name || exception.raised_by || '—'}</p>
          <p><span className="font-medium">Entity:</span> {exception.entity_type} — <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">{exception.entity_id?.slice(0, 12)}…</code></p>
          {payload.reason && <p><span className="font-medium">Reason:</span> {payload.reason}</p>}
          {payload.requested_payment_method && <p><span className="font-medium">Requested Payment:</span> {payload.requested_payment_method}</p>}
          {payload.remaining_amount != null && <p><span className="font-medium">Remaining Amount:</span> {Number(payload.remaining_amount).toLocaleString()} DA</p>}
        </div>
      </div>

      {/* Decision */}
      <div className="mb-5 space-y-3">
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Decision</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setApproved(true)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition ${
              approved
                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700'
                : 'border-gray-200 text-zinc-500 hover:border-gray-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={() => setApproved(false)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 py-3 text-sm font-semibold transition ${
              !approved
                ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700'
                : 'border-gray-200 text-zinc-500 hover:border-gray-300 dark:border-zinc-700 dark:hover:border-zinc-600'
            }`}
          >
            <XCircle className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="mb-5 space-y-2">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Resolution Notes <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Called client on 05/18 at 14:30. Client confirmed refusal due to product damage. Approved return."
          className="w-full resize-none rounded-lg border border-gray-200 bg-white p-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-100"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>

      {approved && (
        <div className="mb-5 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300">
          ℹ️ Approving this exception will create a <strong>responsibility ledger</strong> entry assigning you as the current owner of this debt.
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="btn-primary btn-primary-block rounded-xl py-3 disabled:opacity-40"
      >
        {isSubmitting ? 'Submitting…' : `${approved ? 'Approve' : 'Reject'} Exception`}
      </button>
    </motion.div>
  )
}

export function ExceptionsPage() {
  const [searchParams] = useSearchParams()
  const params = useParams()
  const deepLinkId = searchParams.get('id') || params.id || null
  const [allExceptions, setAllExceptions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedEx, setSelectedEx] = useState(null)
  const controllerRef = useRef(null)
  const deepLinkHandledRef = useRef(null)
    const { user } = useAuth()

    // Get role-based header config
    const headerConfig = useMemo(() => {
      const userRole = getAuthRoleName(user)
      return ROLE_HEADER_CONFIG[userRole] || ROLE_HEADER_CONFIG.default
    }, [user])

  const load = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    try {
      const res = await apiInstance.get(`/exceptions`, { signal: controller.signal })
      if (!controller.signal.aborted) {
        setAllExceptions(res.data?.data?.exceptions || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') setAllExceptions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [])

  useEffect(() => {
    if (!deepLinkId || isLoading) return
    if (deepLinkHandledRef.current === deepLinkId) return
    const match = allExceptions.find((ex) => String(ex.id) === String(deepLinkId))
    if (match) {
      deepLinkHandledRef.current = deepLinkId
      setSelectedEx(match)
    }
  }, [deepLinkId, allExceptions, isLoading])

  // Filter exceptions based on tabs + text search
  const filteredExceptions = useMemo(() => {
    const term = search.trim().toLowerCase()
    return allExceptions.filter((ex) => {
      if (statusFilter && ex.exception_status !== statusFilter) return false
      if (typeFilter && ex.exception_type !== typeFilter) return false
      if (!term) return true
      const typeLabel = TYPE_META[ex.exception_type]?.label || ex.exception_type || ''
      const statusLabel = STATUS_META[ex.exception_status]?.label || ex.exception_status || ''
      const haystack = [
        typeLabel,
        statusLabel,
        ex.id,
        ex.raiser?.full_name,
        ex.raised_by,
        ex.severity,
        ex.notes,
        ex.reason,
        ex.description,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [allExceptions, statusFilter, typeFilter, search])

  // Count KPI metrics
  const kpiCounts = {
    VENDOR_LOAD: allExceptions.filter((e) => e.exception_type === 'VENDOR_LOAD').length,
    LIVREUR_MISSION: allExceptions.filter((e) => e.exception_type === 'LIVREUR_MISSION').length,
    RETURN: allExceptions.filter((e) => e.exception_type === 'RETURN').length,
    PAYMENT_CHANGE: allExceptions.filter((e) => e.exception_type === 'PAYMENT_CHANGE').length,
  }

  return (
    <DashboardLayout>
      <DepotCcPageShell
        title={headerConfig.title}
        subtitle={headerConfig.subtitle}
        icon={AlertTriangle}
        actions={
          !isLoading ? (
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {filteredExceptions.length} records
            </span>
          ) : null
        }
      >
        <div className="space-y-6">
          {/* KPI Cards */}
          {!isLoading && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard 
                icon={Package}
                label="Vendor Loads"
                count={kpiCounts.VENDOR_LOAD}
                color="amber"
              />
              <KpiCard 
                icon={Truck}
                label="Livreur Missions"
                count={kpiCounts.LIVREUR_MISSION}
                color="blue"
              />
              <KpiCard 
                icon={RotateCcw}
                label="Returns"
                count={kpiCounts.RETURN}
                color="green"
              />
              <KpiCard 
                icon={CreditCard}
                label="Payment Changes"
                count={kpiCounts.PAYMENT_CHANGE}
                color="purple"
              />
            </div>
          )}

          {/* Exception Type Tabs */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Filter by Type</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTypeFilter('')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  typeFilter === ''
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'border border-gray-200 text-zinc-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                }`}
              >
                All Types
              </button>
              {Object.entries(EXCEPTION_TYPE_MAP).map(([key]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTypeFilter(key)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    typeFilter === key
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border border-gray-200 text-zinc-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {TYPE_META[key]?.label || key}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Filter by Status</p>
            <div className="flex flex-wrap gap-2">
              {['', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                    statusFilter === s
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border border-gray-200 text-zinc-600 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
                  }`}
                >
                  {s === '' ? 'All' : STATUS_META[s]?.label || s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <ExceptionsSkeleton />
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search type, status, raiser, or id…"
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Raised By</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Severity</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Date</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExceptions.map((ex, i) => {
                      const tm = TYPE_META[ex.exception_type] || { label: ex.exception_type, cls: 'bg-zinc-100 text-zinc-500' }
                      const sm = STATUS_META[ex.exception_status] || { label: ex.exception_status, cls: 'bg-zinc-100 text-zinc-500' }
                      const sev = SEV_META[ex.severity] || { label: ex.severity, cls: 'bg-zinc-100 text-zinc-500' }
                      return (
                        <motion.tr
                          key={ex.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-gray-200 dark:border-zinc-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                          onClick={() => setSelectedEx(ex)}
                        >
                          <td className="px-6 py-4"><Badge label={tm.label} cls={tm.cls} /></td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                            {ex.raiser?.full_name || ex.raised_by?.slice(0, 8) || '—'}
                          </td>
                          <td className="px-6 py-4"><Badge label={sev.label} cls={sev.cls} /></td>
                          <td className="px-6 py-4"><Badge label={sm.label} cls={sm.cls} /></td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                            {ex.created_at ? new Date(ex.created_at).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4">
                            {ex.exception_status === 'PENDING' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedEx(ex)
                                }}
                                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                              >
                                Resolve
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      )
                    })}
                    {filteredExceptions.length === 0 && (
                      <tr>
                        <td className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={6}>
                          No exceptions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            </div>
          )}
        </div>
      </DepotCcPageShell>

      {/* Resolve slide-over — outside shell to avoid transform clipping */}
      <AnimatePresence>
        {selectedEx && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedEx(null)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <ResolvePanel
              exception={selectedEx}
              onClose={() => setSelectedEx(null)}
              onResolved={() => { setSelectedEx(null); load() }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
