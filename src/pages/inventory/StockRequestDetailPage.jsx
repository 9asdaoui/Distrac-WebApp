import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Factory } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import {
  Calendar,
  IndustryAvatar,
  MetaTile,
  ProductThumb,
  QuantityBadge,
  User,
  Warehouse,
  uniqueIndustriesFromItems,
} from '../../components/inventory/StockRequestVisuals'
import apiInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'

const REQUEST_STATUS_LABELS = {
  PENDING_MANAGEMENT: 'Awaiting management approval',
  APPROVED_FOR_INDUSTRY: 'Approved — with industry',
  SHIPPED: 'Shipped by industry',
  RECEIVED: 'Received at depot',
}

function StatusBadge({ status }) {
  const tone = {
    PENDING_MANAGEMENT: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    APPROVED_FOR_INDUSTRY: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    SHIPPED: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
    RECEIVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  }[status] || 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {REQUEST_STATUS_LABELS[status] || status || 'UNKNOWN'}
    </span>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-800" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

export function StockRequestDetailPage() {
  const { requestId } = useParams()
  const [searchParams] = useSearchParams()
  const depotId = searchParams.get('depotId') || ''
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const canApproveStock = hasPermission('approve_stock')

  const [request, setRequest] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const backUrl = `/inventory/stock${depotId ? `?depotId=${depotId}` : ''}`

  const loadRequest = useCallback(async () => {
    if (!requestId) return
    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get(`/stock/requests/${requestId}`)
      setRequest(res.data?.data?.request || null)
    } catch (err) {
      setRequest(null)
      setError(err.response?.data?.message || 'Failed to load stock request')
    } finally {
      setIsLoading(false)
    }
  }, [requestId])

  useEffect(() => {
    loadRequest()
  }, [loadRequest])

  const industries = useMemo(
    () => uniqueIndustriesFromItems(request?.items || []),
    [request?.items],
  )

  const handleApprove = async () => {
    setActionMessage('')
    try {
      await apiInstance.patch(`/stock/requests/${requestId}/approve`)
      setActionMessage('Request approved and forwarded to industry.')
      await loadRequest()
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Failed to approve request')
    }
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => navigate(backUrl)}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stock
          </button>

          {isLoading ? (
            <DetailSkeleton />
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          ) : !request ? (
            <p className="text-sm text-zinc-500">Stock request not found.</p>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Stock request</h1>
                    <p className="mt-1 font-mono text-xs text-zinc-500">{request.id}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MetaTile
                    icon={Warehouse}
                    label="Depot"
                    value={request.depot?.depot_name}
                    accent="blue"
                  />
                  <MetaTile
                    icon={User}
                    label="Requested by"
                    value={request.requester?.full_name}
                  />
                  <MetaTile
                    icon={Calendar}
                    label="Submitted"
                    value={request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
                    accent="amber"
                  />
                  <MetaTile
                    icon={Factory}
                    label={industries.length > 1 ? 'Industries' : 'Industry'}
                    value={
                      request.industry?.industry_name
                      || (industries.length === 1 ? industries[0].industry_name : `${industries.length} suppliers`)
                    }
                    accent="emerald"
                  />
                </div>

                {industries.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Supplying industries
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {industries.map((industry) => (
                        <div
                          key={industry.id || industry.industry_name}
                          className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/40"
                        >
                          <IndustryAvatar industry={industry} size="lg" showName={false} />
                          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {industry.industry_name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {request.notes && (
                  <p className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                    {request.notes}
                  </p>
                )}

                {actionMessage && (
                  <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{actionMessage}</p>
                )}

                {canApproveStock && request.status === 'PENDING_MANAGEMENT' && (
                  <button
                    type="button"
                    onClick={handleApprove}
                    className="btn-primary mt-4"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve for industry
                  </button>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Requested products</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    {(request.items || []).length} line{(request.items || []).length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="grid gap-4 p-4 sm:grid-cols-2 lg:p-6">
                  {(request.items || []).length === 0 ? (
                    <p className="col-span-full py-8 text-center text-sm text-zinc-500">No line items.</p>
                  ) : (
                    (request.items || []).map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                      >
                        {depotId && item.product_id ? (
                          <Link to={`/inventory/stock/${item.product_id}?depotId=${depotId}`}>
                            <ProductThumb product={item.product} size="xl" />
                          </Link>
                        ) : (
                          <ProductThumb product={item.product} size="xl" />
                        )}
                        <div className="min-w-0 flex-1">
                          {depotId && item.product_id ? (
                            <Link
                              to={`/inventory/stock/${item.product_id}?depotId=${depotId}`}
                              className="font-semibold text-zinc-900 hover:underline dark:text-zinc-100"
                            >
                              {item.product?.name || item.product_id}
                            </Link>
                          ) : (
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {item.product?.name || item.product_id}
                            </p>
                          )}
                          <p className="mt-0.5 font-mono text-xs text-zinc-500">{item.product?.sku || 'No SKU'}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <QuantityBadge label="Quantity" value={item.quantity} />
                            <QuantityBadge
                              label="Min at request"
                              value={item.min_quantity_snapshot != null ? item.min_quantity_snapshot : '—'}
                            />
                          </div>
                          <div className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/50">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Supplied by</p>
                            <IndustryAvatar industry={item.industry} size="sm" className="mt-1.5" />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {(request.fulfillment_orders || []).length > 0 && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Fulfillment orders</h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Split by supplying industry after submission.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {request.fulfillment_orders.map((order) => {
                      const orderItems = (request.items || []).filter(
                        (item) => item.fulfillment_order_id === order.id,
                      )
                      return (
                        <div
                          key={order.id}
                          className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <IndustryAvatar industry={order.industry} size="md" />
                            <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                              {order.status || 'PENDING'}
                            </span>
                          </div>
                          {order.source_depot?.depot_name && (
                            <p className="mt-2 text-xs text-zinc-500">
                              Source depot: {order.source_depot.depot_name}
                            </p>
                          )}
                          {orderItems.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {orderItems.map((item) => (
                                <ProductThumb key={item.id} product={item.product} size="sm" />
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
