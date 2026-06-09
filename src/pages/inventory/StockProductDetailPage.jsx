import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Package } from 'lucide-react'
import { IndustryAvatar, ProductThumb } from '../../components/inventory/StockRequestVisuals'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'
import { useScopedDepots } from '../../hooks/useScopedDepots'

const REQUEST_STATUS_LABELS = {
  PENDING_MANAGEMENT: 'Awaiting management approval',
  APPROVED_FOR_INDUSTRY: 'Approved — with industry',
  SHIPPED: 'Shipped by industry',
  RECEIVED: 'Received at depot',
}

function formatDa(value) {
  return `${Number(value || 0).toLocaleString('fr-MA', { maximumFractionDigits: 2 })} MAD`
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

export function StockProductDetailPage() {
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const depotId = searchParams.get('depotId') || ''
  const navigate = useNavigate()
  const { depots } = useScopedDepots()

  const [product, setProduct] = useState(null)
  const [stockRow, setStockRow] = useState(null)
  const [depotMeta, setDepotMeta] = useState(null)
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const selectedDepot = useMemo(
    () => depots.find((depot) => depot.id === depotId) || depotMeta,
    [depots, depotId, depotMeta],
  )

  const productRequests = useMemo(
    () => requests.filter((request) => (
      (request.items || []).some((item) => item.product_id === productId)
    )),
    [requests, productId],
  )

  const load = async () => {
    if (!productId || !depotId) return
    setIsLoading(true)
    setError('')
    try {
      const [productRes, depotRes, requestsRes] = await Promise.all([
        apiInstance.get(`/products/${productId}`),
        apiInstance.get(`/depots/${depotId}`),
        apiInstance.get('/stock/requests', { params: { depotId, limit: 50 } }),
      ])

      const productData = productRes.data?.data?.product || null
      const depot = depotRes.data?.data?.depot || null
      const stockLines = depot?.stock || []
      const row = stockLines.find((line) => line.product_id === productId) || null

      setProduct(productData)
      setDepotMeta(depot)
      setStockRow(row)
      setRequests(requestsRes.data?.data?.requests || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product stock details')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [productId, depotId])

  const quantity = Number(stockRow?.quantity || 0)
  const minQty = Number(stockRow?.min_quantity || 0)
  const isLow = minQty > 0 ? quantity <= minQty : quantity <= 0
  const unitPrice = Number(product?.base_price || stockRow?.product?.base_price || 0)

  if (!depotId) {
    return (
      <DashboardLayout>
        <AnimatedPage>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            Missing depot context. Open this product from the{' '}
            <Link to="/inventory/stock" className="font-medium underline">Stock</Link> table.
          </div>
        </AnimatedPage>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => navigate(`/inventory/stock${depotId ? `?depotId=${depotId}` : ''}`)}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to stock
          </button>

          {isLoading ? (
            <div className="h-64 animate-pulse rounded-2xl bg-gray-200 dark:bg-zinc-800" />
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
                  <div className="flex gap-5">
                    {product?.image_url ? (
                      <img src={product.image_url} alt="" className="h-24 w-24 rounded-2xl object-cover" />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                        <Package className="h-8 w-8 text-zinc-400" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{product?.name || 'Product'}</h1>
                      <p className="mt-1 text-sm text-zinc-500">SKU: {product?.sku || '—'}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                          {product?.brand?.name || 'No brand'}
                        </span>
                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                          {product?.category?.name || 'No category'}
                        </span>
                        <span className="rounded-lg bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                          {formatDa(unitPrice)}
                        </span>
                      </div>
                      {product?.description && (
                        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">{product.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Depot situation</p>
                  <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                    {selectedDepot?.depot_name || depotMeta?.depot_name || 'Depot'}
                  </p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">On hand</dt>
                      <dd className="font-semibold text-zinc-900 dark:text-zinc-100">{quantity.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Minimum</dt>
                      <dd>{minQty.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Line value</dt>
                      <dd className="font-medium">{formatDa(quantity * unitPrice)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-zinc-500">Status</dt>
                      <dd>
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                            <AlertTriangle className="h-3.5 w-3.5" />
                            Below minimum
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">Healthy</span>
                        )}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-4 text-xs text-zinc-500">
                    To request replenishment, use{' '}
                    <strong>Request stock</strong> on the{' '}
                    <Link to={`/inventory/stock?depotId=${depotId}`} className="font-medium text-zinc-700 underline dark:text-zinc-300">
                      Stock
                    </Link>{' '}
                    page. Management maintains the catalog under{' '}
                    <Link to="/products" className="font-medium text-zinc-700 underline dark:text-zinc-300">
                      Products
                    </Link>{' '}
                    in the sidebar.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Replenishment history</h2>
                <p className="mt-1 text-sm text-zinc-500">Stock requests for this depot that include this product.</p>
                <div className="mt-4 space-y-3">
                  {productRequests.length === 0 ? (
                    <p className="text-sm text-zinc-500">No requests for this product yet.</p>
                  ) : (
                    productRequests.map((request) => {
                      const line = (request.items || []).find((item) => item.product_id === productId)
                      return (
                        <div
                          key={request.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/inventory/stock/requests/${request.id}?depotId=${depotId}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              navigate(`/inventory/stock/requests/${request.id}?depotId=${depotId}`)
                            }
                          }}
                          className="cursor-pointer rounded-xl border border-gray-200 p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-800/40"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <StatusBadge status={request.status} />
                            <span className="text-xs text-zinc-500">
                              {request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-3">
                            <ProductThumb product={product} size="md" />
                            {line && (
                              <div>
                                <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                  Requested: {line.quantity} units
                                </p>
                                {line.industry?.industry_name && (
                                  <div className="mt-1">
                                    <IndustryAvatar industry={line.industry} size="xs" />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          {request.notes && (
                            <p className="mt-1 text-xs text-zinc-500">{request.notes}</p>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
