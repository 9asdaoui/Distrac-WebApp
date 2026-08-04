import React, { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, Package, Truck, User } from 'lucide-react'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import apiInstance from '../../api/axiosInstance'

const BUCKET_HINTS = {
  waiting_preparation: 'Pull these products from depot stock, then mark prepared.',
  ready_to_load: 'Prepared and waiting on the dock for the agent.',
  loading: 'Agent mission is in progress — load confirmation is on mobile.',
  departed: 'Agent confirmed loaded — order has left the depot.',
}

function StageBadge({ label }) {
  return (
    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      {label || '—'}
    </span>
  )
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </h3>
      {children}
    </section>
  )
}

/**
 * Notification-style slide-over for depot prep: pick list + Mark prepared.
 */
export function ShipmentPrepSlideOver({
  open,
  orderSummary,
  onClose,
  onMarkedReady,
}) {
  const [detail, setDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const orderId = orderSummary?.id
  const bucket = orderSummary?.bucket
  const canMarkReady =
    bucket === 'waiting_preparation' ||
    String(orderSummary?.status || '').toLowerCase() === 'confirmed'

  useEffect(() => {
    if (!open || !orderId) {
      setDetail(null)
      setError('')
      return undefined
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    setDetail(null)

    apiInstance
      .get(`/orders/${orderId}`, { signal: controller.signal })
      .then((res) => {
        setDetail(res.data?.data?.order || null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name === 'CanceledError') return
        setError(err.response?.data?.message || 'Failed to load order detail')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [open, orderId])

  const handleMarkReady = async () => {
    if (!orderId || !canMarkReady) return
    setIsSaving(true)
    setError('')
    try {
      await apiInstance.post(`/orders/${orderId}/mark-ready`)
      onMarkedReady?.()
      onClose?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to mark order prepared')
    } finally {
      setIsSaving(false)
    }
  }

  const items = detail?.items || []
  const clientName =
    detail?.client?.name ||
    detail?.client?.client_name ||
    detail?.client?.store_name ||
    orderSummary?.clientName ||
    '—'
  const livreurName =
    detail?.livreur?.full_name || orderSummary?.livreurName || null
  const deliveryDate = detail?.delivery_date || null
  const paymentMethod = detail?.payment_method || null

  const footer = canMarkReady ? (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Close
      </button>
      <button
        type="button"
        onClick={handleMarkReady}
        disabled={isSaving || isLoading}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
        Mark prepared
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {BUCKET_HINTS[bucket] || 'Status updates from the agent appear when the mission advances.'}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        Close
      </button>
    </div>
  )

  return (
    <SlideOverPanel
      isOpen={open}
      onClose={onClose}
      title={orderSummary?.orderNumber || 'Shipment'}
      description={orderSummary?.bucketLabel || 'Prep detail'}
      footer={footer}
      maxWidthClass="max-w-xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading pick list…
        </div>
      ) : error && !detail ? (
        <p className="py-10 text-center text-sm text-red-600 dark:text-red-300">{error}</p>
      ) : (
        <div className="space-y-6">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <StageBadge label={orderSummary?.bucketLabel} />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {BUCKET_HINTS[bucket]}
            </span>
          </div>

          <Section title="Shipment">
            <div className="rounded-xl border border-gray-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Client</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">{clientName}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Delivery date</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {deliveryDate ? new Date(deliveryDate).toLocaleDateString() : '—'}
                  </dd>
                </div>
                {paymentMethod ? (
                  <div>
                    <dt className="text-zinc-500">Payment</dt>
                    <dd className="mt-0.5 font-medium capitalize text-zinc-900 dark:text-zinc-100">
                      {paymentMethod}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-zinc-500">Agent</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-zinc-900 dark:text-zinc-100">
                    {livreurName ? (
                      <>
                        <User className="h-3.5 w-3.5 text-zinc-400" />
                        {livreurName}
                      </>
                    ) : (
                      'Not assigned yet'
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </Section>

          <Section title="Pick list">
            {items.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-zinc-700">
                <Package className="mx-auto h-8 w-8 text-zinc-400" />
                <p className="mt-2 text-sm text-zinc-500">No line items on this order.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 dark:divide-zinc-800 dark:border-zinc-800">
                {items.map((item) => (
                  <li
                    key={item.id || `${item.product_id}-${item.quantity}`}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                        {item.product_name || item.product?.name || 'Product'}
                      </p>
                      <p className="font-mono text-xs text-zinc-500">
                        {item.sku || item.product?.sku || '—'}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-zinc-100 px-2.5 py-1 text-sm font-semibold tabular-nums text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                      ×{item.quantity}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {bucket === 'loading' || bucket === 'departed' ? (
            <div className="flex items-start gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                {bucket === 'loading'
                  ? 'Waiting for the agent to confirm load on mobile.'
                  : 'This shipment has departed the depot.'}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </SlideOverPanel>
  )
}

export default ShipmentPrepSlideOver
