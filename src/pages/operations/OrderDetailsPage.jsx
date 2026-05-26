import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  User,
  Truck,
  Package,
  Pencil,
  Loader2,
  Phone,
  Building2,
  CreditCard,
  Banknote,
  AlertCircle,
  ImageIcon,
} from 'lucide-react'
import { AnimatedPage } from '../../components/AnimatedPage'
import { SmoothSlideOver } from '../../components/SmoothSlideOver'
import { LocationMapCard } from '../../components/LocationMap'
import apiInstance from '../../api/axiosInstance'

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED', 'REFUSED']
const DELIVERY_STATUS_OPTIONS = ['ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'PENDING']
const PAYMENT_OPTIONS = ['cash', 'credit']

const STATUS_META = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  CONFIRMED: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  READY: 'border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200',
  IN_TRANSIT: 'border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-500/30 dark:bg-purple-500/10 dark:text-purple-200',
  DELIVERED: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  CANCELLED: 'border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
  REFUSED: 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
}

function StatusBadge({ status }) {
  const key = status ? String(status).toUpperCase() : ''
  const cls = STATUS_META[key] || 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
  return (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${cls}`}>
      {key || status || '—'}
    </span>
  )
}

function PaymentBadge({ method }) {
  const isCredit = method === 'credit'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${
        isCredit
          ? 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200'
          : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
      }`}
    >
      {isCredit ? <CreditCard className="h-3.5 w-3.5" /> : <Banknote className="h-3.5 w-3.5" />}
      {method || '—'}
    </span>
  )
}

function SidebarCard({ title, icon: Icon, children, action }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          {Icon && <Icon className="h-3.5 w-3.5" />}
          {title}
        </h3>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  )
}

function toDateInputValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  return d.toISOString().slice(0, 10)
}

function toDateTimeLocalValue(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildFormFromOrder(order) {
  return {
    status: order?.status ? String(order.status).toUpperCase() : 'PENDING',
    paymentMethod: order?.payment_method || 'cash',
    date: toDateInputValue(order?.delivery_date || order?.order_date),
    creditDueTime: toDateInputValue(order?.credit_due_time),
    deliveryDate: toDateTimeLocalValue(order?.delivery_date || order?.order_date),
    deliveryStatus: order?.livreur?.delivery_status || '',
  }
}

function itemProductName(item) {
  return item.product_name || item.product?.name || 'Unknown product'
}

function formatMoney(amount, currency = 'MAD') {
  return `${Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

export function OrderDetailsPage() {
  const { id: orderKey } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [form, setForm] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const controllerRef = useRef(null)

  const load = async () => {
    if (!orderKey) return

    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get(`/orders/${encodeURIComponent(orderKey)}`, {
        signal: controller.signal,
      })
      if (!controller.signal.aborted) {
        const data = res.data?.data?.order || null
        setOrder(data)
        setForm(buildFormFromOrder(data))
      }
    } catch (err) {
      if (err.name !== 'CanceledError' && !controller.signal.aborted) {
        setOrder(null)
        setForm(null)
        setError(err?.response?.data?.message || 'Failed to load order details.')
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [orderKey])

  const handleSave = async () => {
    if (!form || !orderKey) return
    setIsSaving(true)
    setSaveError('')
    try {
      const payload = {
        status: form.status,
        paymentMethod: form.paymentMethod,
        date: form.date || undefined,
        deliveryDate: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : undefined,
        deliveryStatus: form.deliveryStatus || undefined,
      }
      if (form.paymentMethod === 'credit') {
        payload.creditDueTime = form.creditDueTime || undefined
      }

      const res = await apiInstance.put(`/orders/${encodeURIComponent(orderKey)}`, payload)
      const updated = res.data?.data?.order || null
      setOrder(updated)
      setForm(buildFormFromOrder(updated))
      setIsEditing(false)
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to update order.')
    } finally {
      setIsSaving(false)
    }
  }

  const closeEditPanel = () => {
    setForm(buildFormFromOrder(order))
    setIsEditing(false)
    setSaveError('')
  }

  const client = order?.client || {}
  const livreur = order?.livreur || null
  const items = order?.items || []
  const financials = order?.financials || {}
  const currency = order?.currency || 'MAD'
  const depotName = order?.depot?.depot_name || client.depot_name || '—'

  const subtotal = financials.subtotal ?? items.reduce((s, i) => s + Number(i.line_total || 0), 0)
  const couponDiscount = financials.coupon_discount ?? 0
  const grandTotal = financials.grand_total ?? Math.max(subtotal - couponDiscount, Number(order?.total_amount || 0))

  const inputClass =
    'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {isLoading ? (
          <div className="space-y-6">
            <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
            <div className="grid animate-pulse gap-8 lg:grid-cols-3">
              <div className="h-96 rounded-xl bg-zinc-200 dark:bg-zinc-800 lg:col-span-2" />
              <div className="h-96 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            </div>
          </div>
        ) : error || !order ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'Order not found.'}</p>
            <Link
              to="/orders"
              className="mt-4 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Link>
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                <Link
                  to="/orders"
                  className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Orders
                </Link>
                <h1 className="font-mono text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {order.order_number || order.order_id}
                </h1>
                <p className="text-sm text-zinc-500">
                  {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : '—'} · {items.length} line
                  {items.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm(buildFormFromOrder(order))
                  setSaveError('')
                  setIsEditing(true)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
                Edit order
              </button>
            </header>

            <SmoothSlideOver
              isOpen={isEditing && !!form}
              onClose={closeEditPanel}
              title="Edit order"
              description={`Update status, payment, and delivery for ${order.order_number || order.order_id}.`}
              footer={
                form ? (
                  <div className="space-y-4">
                    {saveError && (
                      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                        {saveError}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeEditPanel}
                        className="flex-1 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                      >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isSaving ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                ) : null
              }
            >
              {form && (
                <div className="space-y-6 pb-20">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={inputClass}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Payment method</label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          paymentMethod: e.target.value,
                          creditDueTime: e.target.value === 'credit' ? form.creditDueTime : '',
                        })
                      }
                      className={inputClass}
                    >
                      {PAYMENT_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  {form.paymentMethod === 'credit' && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Credit due date</label>
                      <input
                        type="date"
                        value={form.creditDueTime}
                        onChange={(e) => setForm({ ...form, creditDueTime: e.target.value })}
                        className={inputClass}
                        required
                      />
                    </div>
                  )}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Order date</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Delivery date & time</label>
                    <input
                      type="datetime-local"
                      value={form.deliveryDate}
                      onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Delivery status</label>
                    <select
                      value={form.deliveryStatus}
                      onChange={(e) => setForm({ ...form, deliveryStatus: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">—</option>
                      {DELIVERY_STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </SmoothSlideOver>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <LocationMapCard
                  lat={client.gps_latitude}
                  lng={client.gps_longitude}
                  name={client.name || client.place_name || 'Client location'}
                />

                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      <Package className="h-4 w-4 text-zinc-500" />
                      Order items
                    </h2>
                  </div>

                  {items.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                      <AlertCircle className="h-8 w-8 text-amber-500" />
                      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">No line items on this order</p>
                      <p className="max-w-sm text-xs text-zinc-500">
                        This order has no products in commande. Check order creation or sync from the admin orders list.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="border-b border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-800/40">
                          <tr>
                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">Product</th>
                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">SKU</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">Qty</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">Unit price</th>
                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-zinc-500">Line total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                          {items.map((item) => (
                            <tr key={item.id || `${item.product_id}-${item.quantity}`} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  {item.image_url || item.product?.image_url ? (
                                    <img
                                      src={item.image_url || item.product?.image_url}
                                      alt=""
                                      className="h-10 w-10 rounded-lg border border-zinc-200 object-cover dark:border-zinc-700"
                                    />
                                  ) : (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                                      <ImageIcon className="h-4 w-4 text-zinc-400" />
                                    </div>
                                  )}
                                  <span className="font-medium text-zinc-900 dark:text-zinc-100">{itemProductName(item)}</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 font-mono text-xs text-zinc-500">{item.sku || item.product?.sku || '—'}</td>
                              <td className="px-5 py-4 text-right tabular-nums text-zinc-700 dark:text-zinc-300">{item.quantity}</td>
                              <td className="px-5 py-4 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                                {formatMoney(item.unit_price, item.currency || currency)}
                              </td>
                              <td className="px-5 py-4 text-right font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                                {formatMoney(item.line_total, item.currency || currency)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="border-t border-zinc-100 bg-zinc-50/50 px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900/50">
                    <dl className="ml-auto max-w-xs space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-zinc-500">Subtotal</dt>
                        <dd className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{formatMoney(subtotal, currency)}</dd>
                      </div>
                      {couponDiscount > 0 && (
                        <div className="flex justify-between gap-4 text-emerald-700 dark:text-emerald-400">
                          <dt>Coupon discount</dt>
                          <dd className="font-medium tabular-nums">−{formatMoney(couponDiscount, currency)}</dd>
                        </div>
                      )}
                      <div className="flex justify-between gap-4 border-t border-zinc-200 pt-2 dark:border-zinc-700">
                        <dt className="font-semibold text-zinc-900 dark:text-zinc-100">Grand total</dt>
                        <dd className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                          {formatMoney(grandTotal, currency)}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>

              <aside className="space-y-4">
                <SidebarCard title="Status" icon={Package}>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={order.status} />
                    <PaymentBadge method={order.payment_method} />
                  </div>
                  {order.payment_method === 'credit' && order.credit_due_time && (
                    <p className="mt-3 text-xs text-zinc-500">
                      Credit due: <span className="font-medium text-zinc-700 dark:text-zinc-300">{toDateInputValue(order.credit_due_time)}</span>
                    </p>
                  )}
                </SidebarCard>

                <SidebarCard title="Client" icon={User}>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{client.name || '—'}</p>
                  {client.phone ? (
                    <a
                      href={`tel:${client.phone}`}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Phone className="h-4 w-4" />
                      Call {client.phone}
                    </a>
                  ) : (
                    <p className="mt-2 text-xs text-zinc-500">No phone on file</p>
                  )}
                  <p className="mt-3 text-xs text-zinc-500">
                    Sector: <span className="font-medium text-zinc-700 dark:text-zinc-300">{client.sector_name || '—'}</span>
                  </p>
                </SidebarCard>

                <SidebarCard
                  title="Logistics"
                  icon={Truck}
                  action={
                    order.mission?.id ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/missions/${order.mission.id}`)}
                        className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Reassign
                      </button>
                    ) : null
                  }
                >
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Depot</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{depotName}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Truck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <div>
                        <p className="text-xs text-zinc-500">Livreur</p>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">{livreur?.full_name || 'Unassigned'}</p>
                        {livreur?.delivery_status && (
                          <p className="mt-0.5 text-xs text-zinc-500">Stop: {livreur.delivery_status}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {!order.mission?.id && (
                    <p className="mt-3 text-xs text-zinc-500">Assign via mission planning when the order is on a delivery route.</p>
                  )}
                </SidebarCard>
              </aside>
            </div>
          </>
        )}
      </div>
    </AnimatedPage>
  )
}
