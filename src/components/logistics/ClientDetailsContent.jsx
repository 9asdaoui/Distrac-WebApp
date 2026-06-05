import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  BadgeCheck,
  Clock,
  Store,
  Calendar,
  QrCode,
  X,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'react-qr-code'
import { LocationMapCard } from '../LocationMap'
import apiInstance from '../../api/axiosInstance'
import {
  LOGISTICS_MODULES,
  EntityBreadcrumb,
  EntityConnectedActions,
  EntityGpsStrip,
  EntityIconBadge,
  EntityMapLink,
} from './logisticsModuleUi'

const CLIENT_MODULE = LOGISTICS_MODULES.client

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const ORDER_STATUS_META = {
  PENDING:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  APPROVED:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200',
  DELIVERED:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  CANCELLED:
    'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
}

function OrderStatusBadge({ status }) {
  const cls =
    ORDER_STATUS_META[status] ||
    'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status || '—'}
    </span>
  )
}

function ClientDetailsSkeleton({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
      <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

function OpeningHoursCard({ openingHours, compact = false }) {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className={`border-b border-gray-200 dark:border-zinc-800 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
          <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            Opening Hours
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center px-4 py-8">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">No opening hours configured.</p>
        </div>
      </div>
    )
  }

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`border-b border-gray-200 dark:border-zinc-800 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          <Clock className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          Opening Hours
        </h3>
      </div>
      <div className={`divide-y divide-gray-100 dark:divide-zinc-800 ${compact ? 'px-4 py-2' : 'px-5 py-3'}`}>
        {days.map((day) => {
          const shifts = openingHours[day]
          const isOpen = shifts && shifts.length > 0
          return (
            <div key={day} className="flex items-center justify-between py-2">
              <span className="text-sm font-medium capitalize text-zinc-700 dark:text-zinc-300">{DAY_LABELS[day]}</span>
              {isOpen ? (
                <div className="flex flex-wrap justify-end gap-1.5">
                  {shifts.map((shift, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                      {shift.open} – {shift.close}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-zinc-400 dark:text-zinc-500">Closed</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function OrdersTable({ orders, compact = false }) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-5 py-3.5'
  const headPad = compact ? 'px-3 py-2' : 'px-5 py-3'

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-zinc-900/50">
        <Calendar className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No orders yet</p>
        <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Orders appear once this client places one.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Order #</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Date</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Total</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 10).map((order) => (
              <tr key={order.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                <td className={`${cellPad} font-mono text-xs text-zinc-700 dark:text-zinc-300`}>
                  {order.order_number || `${order.id.slice(0, 8)}…`}
                </td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>
                  {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '—'}
                </td>
                <td className={`${cellPad} font-medium text-zinc-900 dark:text-zinc-100`}>
                  {order.total_amount ? `${Number(order.total_amount).toLocaleString()} DA` : '—'}
                </td>
                <td className={cellPad}>
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ClientQrCard({ client, compact = false }) {
  if (!client?.qr_code) {
    return null
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`border-b border-gray-200 dark:border-zinc-800 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          <QrCode className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          Client QR Code
        </h3>
      </div>
      <div className={`flex flex-col items-center ${compact ? 'gap-3 px-4 py-4' : 'gap-4 px-5 py-5'}`}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950">
          <QRCode value={client.qr_code} size={compact ? 160 : 200} />
        </div>
        <p className="break-all text-center font-mono text-xs text-zinc-600 dark:text-zinc-300">{client.qr_code}</p>
      </div>
    </div>
  )
}

function ContactCard({ client, compact = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`border-b border-gray-200 dark:border-zinc-800 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Contact</h3>
      </div>
      <div className={`space-y-3 ${compact ? 'px-4 py-3' : 'space-y-4 px-5 py-4'}`}>
        {client.phone && (
          <a
            href={`tel:${client.phone}`}
            className="flex items-center gap-3 text-sm text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Phone className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <span>{client.phone}</span>
          </a>
        )}
        {client.email && (
          <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Mail className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <span className="truncate">{client.email}</span>
          </div>
        )}
        {(client.client_address || client.city) && (
          <div className="flex items-start gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <MapPin className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
            </div>
            <span>{[client.client_address, client.city].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function CreditCardSection({ client, onUpdateCredit, compact = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`border-b border-gray-200 dark:border-zinc-800 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          <CreditCard className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          Credit & Financials
        </h3>
      </div>
      <div className={`space-y-4 ${compact ? 'px-4 py-3' : 'space-y-5 px-5 py-4'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Auto-approve Credit</span>
          {client.auto_approve_credit ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <BadgeCheck className="h-3.5 w-3.5" />
              Enabled
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
              Disabled
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Credit Limit</p>
            <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {client.max_credit_limit ? `${Number(client.max_credit_limit).toLocaleString()} DA` : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Credit Days</p>
            <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {client.max_credit_days ? `${client.max_credit_days} days` : '—'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Current Balance</p>
          <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {client.current_balance ? `${Number(client.current_balance).toLocaleString()} DA` : '0 DA'}
          </p>
        </div>
        {onUpdateCredit && (
          <button
            type="button"
            onClick={onUpdateCredit}
            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Update Credit Settings
          </button>
        )}
      </div>
    </div>
  )
}

export function ClientDetailsContent({
  client,
  orders: ordersProp,
  isLoading = false,
  error = '',
  layout = 'page',
  showMap = true,
  backTo = CLIENT_MODULE.listPath,
  backLabel = 'Back to Clients',
  onClientUpdate,
}) {
  const compact = layout === 'panel'
  const [orders, setOrders] = useState(ordersProp ?? [])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [showCreditSlideover, setShowCreditSlideover] = useState(false)
  const [creditForm, setCreditForm] = useState({ autoApproveCredit: false, maxCreditLimit: '', maxCreditDays: '' })
  const [isUpdatingCredit, setIsUpdatingCredit] = useState(false)
  const [creditError, setCreditError] = useState('')
  const ordersControllerRef = useRef(null)

  useEffect(() => {
    if (ordersProp !== undefined) {
      setOrders(ordersProp)
      return undefined
    }
    if (!client?.id) {
      setOrders([])
      return undefined
    }

    if (ordersControllerRef.current) ordersControllerRef.current.abort()
    const controller = new AbortController()
    ordersControllerRef.current = controller
    setOrdersLoading(true)

    apiInstance
      .get(`/clients/${client.id}/orders`, { signal: controller.signal })
      .then((res) => {
        if (!controller.signal.aborted) {
          setOrders(res.data?.data?.orders || [])
        }
      })
      .catch((err) => {
        if (err.name !== 'CanceledError' && !controller.signal.aborted) {
          setOrders([])
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setOrdersLoading(false)
      })

    return () => controller.abort()
  }, [client?.id, ordersProp])

  useEffect(() => {
    if (showCreditSlideover) {
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [showCreditSlideover])

  const openCreditSlideover = () => {
    if (!client) return
    setCreditForm({
      autoApproveCredit: client.auto_approve_credit || false,
      maxCreditLimit: client.max_credit_limit?.toString() || '',
      maxCreditDays: client.max_credit_days?.toString() || '',
    })
    setCreditError('')
    setShowCreditSlideover(true)
  }

  const handleCreditUpdate = async (e) => {
    e.preventDefault()
    if (!client?.id) return
    setIsUpdatingCredit(true)
    setCreditError('')
    try {
      const res = await apiInstance.put(`/clients/${client.id}/credit-settings`, {
        autoApproveCredit: creditForm.autoApproveCredit,
        maxCreditLimit: Number(creditForm.maxCreditLimit) || 0,
        maxCreditDays: Number(creditForm.maxCreditDays) || 0,
      })
      const updated = res.data?.data?.client
      onClientUpdate?.(updated)
      setShowCreditSlideover(false)
    } catch (err) {
      setCreditError(err?.response?.data?.message || 'Failed to update credit settings.')
    } finally {
      setIsUpdatingCredit(false)
    }
  }

  if (isLoading) {
    return <ClientDetailsSkeleton compact={compact} />
  }

  if (error || !client) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'Client not found.'}</p>
        {layout === 'page' && (
          <Link
            to={backTo}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}
      </div>
    )
  }

  const mainColumn = (
    <>
      {showMap && (
        <LocationMapCard
          lat={client.gps_latitude}
          lng={client.gps_longitude}
          name={client.client_name}
          emptyMessage="No GPS coordinates set for this client."
        />
      )}
      <OpeningHoursCard openingHours={client.opening_hours} compact={compact} />
      <div>
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Order History</h2>
        {ordersLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
        ) : (
          <OrdersTable orders={orders} compact={compact} />
        )}
      </div>
    </>
  )

  const sideColumn = (
    <>
      <ClientQrCard client={client} compact={compact} />
      <ContactCard client={client} compact={compact} />
      <CreditCardSection
        client={client}
        onUpdateCredit={onClientUpdate ? openCreditSlideover : undefined}
        compact={compact}
      />
    </>
  )

  return (
    <>
      <div className={compact ? 'space-y-4' : 'space-y-8'}>
        {layout === 'page' && (
          <header className="space-y-4">
            <EntityBreadcrumb
              moduleKey="client"
              entityName={client.store_name || client.client_name}
              mode="page"
            />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 gap-3">
                <EntityIconBadge moduleKey="client" size="lg" />
                <div className="min-w-0 space-y-2">
                  <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                    {client.store_name || client.client_name}
                  </h1>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {client.client_name}
                    {client.city ? ` · ${client.city}` : ''}
                  </p>
                </div>
              </div>
              <EntityConnectedActions moduleKey="client" entityId={client.id} layout="page" />
            </div>
            <Link
              to={backTo}
              className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </header>
        )}

        {layout === 'panel' && (
          <EntityGpsStrip moduleKey="client" record={client} layout="panel" extra={client.city || 'No GPS set'} />
        )}

        {layout === 'page' ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">{mainColumn}</div>
            <div className="space-y-6">{sideColumn}</div>
          </div>
        ) : (
          <div className="space-y-4">
            {sideColumn}
            {mainColumn}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCreditSlideover && (
          <div className="fixed inset-0 z-[60]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setShowCreditSlideover(false)}
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="flex-shrink-0 border-b border-gray-200 px-6 py-5 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Update Credit Settings</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Configure {client.client_name}&apos;s credit parameters.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCreditSlideover(false)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="credit-settings-form" onSubmit={handleCreditUpdate} className="space-y-6">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Auto-approve Credit
                    </label>
                    <div className="flex gap-3">
                      {[
                        { value: true, label: 'Enabled' },
                        { value: false, label: 'Disabled' },
                      ].map((opt) => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setCreditForm({ ...creditForm, autoApproveCredit: opt.value })}
                          className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                            creditForm.autoApproveCredit === opt.value
                              ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                              : 'border-gray-200 text-zinc-500 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-500'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Max Credit Limit (DA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditForm.maxCreditLimit}
                      onChange={(e) => setCreditForm({ ...creditForm, maxCreditLimit: e.target.value })}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Max Credit Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditForm.maxCreditDays}
                      onChange={(e) => setCreditForm({ ...creditForm, maxCreditDays: e.target.value })}
                      placeholder="0"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                  {creditError && <p className="text-sm text-red-500">{creditError}</p>}
                </form>
              </div>
              <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 dark:border-zinc-800">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    form="credit-settings-form"
                    disabled={isUpdatingCredit}
                    className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {isUpdatingCredit ? 'Saving…' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreditSlideover(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
