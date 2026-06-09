import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ChevronRight, Package, Search, Truck } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { StockRequestSlideOver } from '../../components/inventory/StockRequestSlideOver'
import { FilterNavButton, FilterSectionLabel } from '../../components/inventory/CatalogFilterNav'
import {
  IndustryAvatar,
  ProductThumbStrip,
  uniqueIndustriesFromItems,
} from '../../components/inventory/StockRequestVisuals'
import apiInstance from '../../api/axiosInstance'
import { useAuth } from '../../context/AuthContext'
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

function StockMetric({ label, value, valueClassName = 'text-zinc-700 dark:text-zinc-300', className = '' }) {
  return (
    <div className={`rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60 ${className}`}>
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-sm ${valueClassName}`}>{value}</p>
    </div>
  )
}

function StockLevelBadge({ isLow }) {
  if (isLow) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
        <AlertTriangle className="h-3 w-3" />
        Low
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
      OK
    </span>
  )
}

function DepotStockCard({ row, onSelect }) {
  const product = row.product || {}
  const quantity = Number(row.quantity || 0)
  const minQty = Number(row.min_quantity || 0)
  const unitPrice = Number(product.base_price || 0)
  const lineValue = quantity * unitPrice
  const isLow = minQty > 0 ? quantity <= minQty : quantity <= 0

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ layout: { duration: 0.22, ease: 'easeInOut' }, duration: 0.18 }}
      onClick={() => onSelect(row.product_id)}
      className="flex w-full flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <div className="flex items-start justify-between gap-3">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
            <Package className="h-5 w-5" />
          </div>
        )}
        <StockLevelBadge isLow={isLow} />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
          {product.name || '—'}
        </p>
        <p className="mt-0.5 truncate text-xs uppercase tracking-wide text-zinc-500">
          {product.sku || 'No SKU'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StockMetric
          label="Qty / Min"
          value={`${quantity.toLocaleString()} / ${minQty.toLocaleString()}`}
          valueClassName={isLow ? 'font-medium text-red-500 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}
        />
        <StockMetric
          label="Unit price"
          value={formatDa(unitPrice)}
        />
        <StockMetric
          label="Line value"
          value={formatDa(lineValue)}
          className="col-span-2"
          valueClassName="font-medium text-zinc-900 dark:text-white"
        />
      </div>
    </motion.button>
  )
}

function StockSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((row) => (
        <div
          key={row}
          className="h-44 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        />
      ))}
    </div>
  )
}

export function StockPage() {
  const navigate = useNavigate()
  const { hasPermission } = useAuth()
  const { depots, isLoading: depotsLoading, error: depotsError } = useScopedDepots()
  const [selectedDepotId, setSelectedDepotId] = useState('')
  const [stock, setStock] = useState([])
  const [depotMeta, setDepotMeta] = useState(null)
  const [isLoadingStock, setIsLoadingStock] = useState(false)
  const [stockError, setStockError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const controllerRef = useRef(null)

  const [requests, setRequests] = useState([])
  const [actionMessage, setActionMessage] = useState('')
  const [activeTab, setActiveTab] = useState('stock')
  const [isRequestPanelOpen, setIsRequestPanelOpen] = useState(false)

  const canApproveStock = hasPermission('approve_stock')

  useEffect(() => {
    const urlDepotId = new URLSearchParams(window.location.search).get('depotId')
    if (urlDepotId && depots.some((depot) => depot.id === urlDepotId)) {
      setSelectedDepotId(urlDepotId)
      return
    }
    if (!selectedDepotId && depots.length > 0) {
      setSelectedDepotId(depots[0].id)
    }
  }, [depots, selectedDepotId])

  const loadRequests = async (depotId) => {
    if (!depotId) {
      setRequests([])
      return
    }
    try {
      const res = await apiInstance.get('/stock/requests', { params: { depotId, limit: 20 } })
      setRequests(res.data?.data?.requests || [])
    } catch {
      setRequests([])
    }
  }

  useEffect(() => {
    if (!selectedDepotId) {
      setStock([])
      setDepotMeta(null)
      setRequests([])
      return undefined
    }

    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const loadStock = async () => {
      setIsLoadingStock(true)
      setStockError('')
      try {
        const res = await apiInstance.get(`/depots/${selectedDepotId}`, { signal: controller.signal })
        if (controller.signal.aborted) return
        const depot = res.data?.data?.depot || {}
        setDepotMeta(depot)
        setStock(depot.stock || [])
        await loadRequests(selectedDepotId)
      } catch (err) {
        if (err.name === 'CanceledError') return
        setStock([])
        setDepotMeta(null)
        setStockError(err.response?.data?.message || 'Failed to load depot stock')
      } finally {
        if (!controller.signal.aborted) setIsLoadingStock(false)
      }
    }

    loadStock()
    return () => controller.abort()
  }, [selectedDepotId])

  useEffect(() => {
    setSelectedCategoryId('')
    setSelectedBrandId('')
  }, [selectedDepotId])

  const depotStockByProduct = useMemo(() => {
    const map = {}
    for (const row of stock) {
      map[row.product_id] = {
        quantity: Number(row.quantity || 0),
        min_quantity: Number(row.min_quantity || 0),
      }
    }
    return map
  }, [stock])

  const categoriesInStock = useMemo(() => {
    const map = new Map()
    for (const row of stock) {
      const product = row.product || {}
      const id = product.category_id || product.category?.id
      if (!id) continue
      if (!map.has(id)) {
        map.set(id, { id, name: product.category?.name || 'Uncategorized' })
      }
    }
    return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [stock])

  const productCountByCategory = useMemo(() => {
    const counts = {}
    for (const row of stock) {
      const product = row.product || {}
      const categoryId = product.category_id || product.category?.id
      if (!categoryId) continue
      counts[categoryId] = (counts[categoryId] || 0) + 1
    }
    return counts
  }, [stock])

  const brandsInScope = useMemo(() => {
    const brandMap = new Map()
    for (const row of stock) {
      const product = row.product || {}
      const categoryId = product.category_id || product.category?.id
      const brand = product.brand
      const brandId = product.brand_id || brand?.id
      if (!brandId || !brand) continue
      if (selectedCategoryId && categoryId !== selectedCategoryId) continue
      if (!brandMap.has(brandId)) {
        brandMap.set(brandId, { ...brand, id: brandId, productCount: 0 })
      }
      brandMap.get(brandId).productCount += 1
    }
    return [...brandMap.values()].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
  }, [stock, selectedCategoryId])

  const brandFilterTotal = useMemo(() => {
    if (!selectedCategoryId) return stock.length
    return stock.filter((row) => {
      const product = row.product || {}
      return (product.category_id || product.category?.id) === selectedCategoryId
    }).length
  }, [stock, selectedCategoryId])

  const lowStockCount = useMemo(() => {
    return stock.filter((row) => {
      const quantity = Number(row.quantity || 0)
      const minQty = Number(row.min_quantity || 0)
      return minQty > 0 ? quantity <= minQty : quantity <= 0
    }).length
  }, [stock])

  const filteredStock = useMemo(() => {
    let list = stock

    if (selectedCategoryId) {
      list = list.filter((row) => {
        const product = row.product || {}
        return (product.category_id || product.category?.id) === selectedCategoryId
      })
    }

    if (selectedBrandId) {
      list = list.filter((row) => {
        const product = row.product || {}
        return (product.brand_id || product.brand?.id) === selectedBrandId
      })
    }

    const term = search.trim().toLowerCase()
    return list.filter((row) => {
      const product = row.product || {}
      const quantity = Number(row.quantity || 0)
      const minQty = Number(row.min_quantity || 0)
      const isLow = minQty > 0 ? quantity <= minQty : quantity <= 0

      if (lowStockOnly && !isLow) return false
      if (!term) return true
      return (
        String(product.name || '').toLowerCase().includes(term)
        || String(product.sku || '').toLowerCase().includes(term)
        || String(product.brand?.name || '').toLowerCase().includes(term)
        || String(product.category?.name || '').toLowerCase().includes(term)
      )
    })
  }, [stock, search, lowStockOnly, selectedCategoryId, selectedBrandId])

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedBrandId('')
  }

  const summary = useMemo(() => {
    let lowCount = 0
    let totalValue = 0
    for (const row of stock) {
      const product = row.product || {}
      const quantity = Number(row.quantity || 0)
      const minQty = Number(row.min_quantity || 0)
      if (minQty > 0 ? quantity <= minQty : quantity <= 0) lowCount += 1
      totalValue += quantity * Number(product.base_price || 0)
    }
    return { skuCount: stock.length, lowCount, totalValue }
  }, [stock])

  const handleRequestSuccess = async () => {
    setActionMessage('Stock request submitted for management approval.')
    setActiveTab('requests')
    await loadRequests(selectedDepotId)
  }

  const handleApprove = async (requestId) => {
    setActionMessage('')
    try {
      await apiInstance.patch(`/stock/requests/${requestId}/approve`)
      setActionMessage('Request approved and forwarded to industry.')
      await loadRequests(selectedDepotId)
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Failed to approve request')
    }
  }

  const isLoading = depotsLoading || isLoadingStock
  const pendingRequestCount = requests.filter((r) => r.status === 'PENDING_MANAGEMENT').length

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Depot Stock</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                View depot stock levels and submit replenishment requests.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsRequestPanelOpen(true)}
                disabled={!selectedDepotId}
                className="btn-primary"
              >
                <Truck className="h-4 w-4" />
                Request stock
              </button>
              {depots.length > 1 && (
                <select
                  value={selectedDepotId}
                  onChange={(e) => setSelectedDepotId(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  {depots.map((depot) => (
                    <option key={depot.id} value={depot.id}>
                      {depot.depot_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {depotsError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {depotsError}
            </div>
          )}

          {!depotsLoading && depots.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No depot is available for your account.
            </div>
          )}

          {depots.length > 0 && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">SKUs in depot</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{summary.skuCount}</p>
                  <p className="mt-1 text-xs text-zinc-500">{depotMeta?.depot_name || 'Selected depot'}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Low stock lines</p>
                  <p className="mt-2 text-2xl font-semibold text-red-600 dark:text-red-400">{summary.lowCount}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Stock value</p>
                  <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{formatDa(summary.totalValue)}</p>
                </div>
              </div>

              <nav className="flex flex-wrap gap-2">
                {[
                  { id: 'stock', label: 'Depot stock' },
                  {
                    id: 'requests',
                    label: pendingRequestCount > 0 ? `Requests (${pendingRequestCount} pending)` : 'Requests',
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'border-[#ff6b00] bg-[#ff6b00] text-white shadow-sm'
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {stockError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                  {stockError}
                </div>
              )}

              {actionMessage && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  {actionMessage}
                </div>
              )}

              {activeTab === 'stock' && (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search product or SKU…"
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    />
                  </div>

                  {isLoading ? (
                    <StockSkeleton />
                  ) : (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                      <aside className="lg:col-span-1">
                        <FilterSectionLabel>Categories</FilterSectionLabel>
                        <nav className="no-scrollbar max-h-[40vh] space-y-0.5 overflow-y-auto pr-1">
                          <FilterNavButton
                            label="All products"
                            count={stock.length}
                            isActive={!selectedCategoryId}
                            onClick={() => handleCategorySelect('')}
                          />
                          {categoriesInStock.map((category) => (
                            <FilterNavButton
                              key={category.id}
                              label={category.name}
                              count={productCountByCategory[category.id] || 0}
                              isActive={selectedCategoryId === category.id}
                              onClick={() => handleCategorySelect(category.id)}
                            />
                          ))}
                        </nav>

                        <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

                        <FilterSectionLabel>Brands</FilterSectionLabel>
                        <nav className="no-scrollbar max-h-[40vh] space-y-0.5 overflow-y-auto pr-1">
                          <FilterNavButton
                            label="All brands"
                            count={brandFilterTotal}
                            isActive={!selectedBrandId}
                            onClick={() => setSelectedBrandId('')}
                          />
                          {brandsInScope.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-zinc-500">
                              {selectedCategoryId ? 'No brands in this category.' : 'No brands in depot stock.'}
                            </p>
                          ) : (
                            brandsInScope.map((brand) => (
                              <FilterNavButton
                                key={brand.id}
                                label={brand.name}
                                count={brand.productCount}
                                isActive={selectedBrandId === brand.id}
                                onClick={() => setSelectedBrandId(brand.id)}
                              />
                            ))
                          )}
                        </nav>

                        <hr className="my-6 border-zinc-200 dark:border-zinc-800" />

                        <FilterNavButton
                          label="Low stock only"
                          count={lowStockCount}
                          isActive={lowStockOnly}
                          onClick={() => setLowStockOnly((prev) => !prev)}
                        />
                      </aside>

                      <div className="min-w-0 lg:col-span-3">
                        {(selectedCategoryId || selectedBrandId || lowStockOnly) && (
                          <p className="mb-4 text-sm text-zinc-500">
                            Showing {filteredStock.length} line{filteredStock.length === 1 ? '' : 's'}
                            {selectedCategoryId && (
                              <> in <span className="font-medium text-zinc-700 dark:text-zinc-300">{categoriesInStock.find((c) => c.id === selectedCategoryId)?.name}</span></>
                            )}
                            {selectedBrandId && (
                              <> · <span className="font-medium text-zinc-700 dark:text-zinc-300">{brandsInScope.find((b) => b.id === selectedBrandId)?.name}</span></>
                            )}
                            {lowStockOnly && <> · low stock</>}
                          </p>
                        )}

                        {filteredStock.length === 0 ? (
                          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-200 text-zinc-500 dark:bg-zinc-800">
                              <Package className="h-6 w-6" />
                            </div>
                            <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                              No products match this filter
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              Try another category, brand, or search term.
                            </p>
                          </div>
                        ) : (
                          <LayoutGroup>
                            <motion.div
                              layout
                              className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
                            >
                              <AnimatePresence mode="popLayout">
                                {filteredStock.map((row) => (
                                  <DepotStockCard
                                    key={row.id}
                                    row={row}
                                    onSelect={(productId) => navigate(`/inventory/stock/${productId}?depotId=${selectedDepotId}`)}
                                  />
                                ))}
                              </AnimatePresence>
                            </motion.div>
                          </LayoutGroup>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'requests' && (
                <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Stock requests</h2>
                      <p className="mt-1 text-sm text-zinc-500">Replenishment requests for this depot.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsRequestPanelOpen(true)}
                      className="btn-secondary"
                    >
                      <Truck className="h-4 w-4" />
                      New request
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {requests.length === 0 ? (
                      <p className="text-sm text-zinc-500">No stock requests for this depot yet.</p>
                    ) : (
                      requests.map((request) => {
                        const requestIndustries = uniqueIndustriesFromItems(request.items)
                        return (
                        <div
                          key={request.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => navigate(`/inventory/stock/requests/${request.id}?depotId=${selectedDepotId}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              navigate(`/inventory/stock/requests/${request.id}?depotId=${selectedDepotId}`)
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

                          {request.items?.length > 0 && (
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                              <ProductThumbStrip items={request.items} max={5} />
                              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                                {request.items.length} product{request.items.length === 1 ? '' : 's'}
                              </span>
                            </div>
                          )}

                          {requestIndustries.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {requestIndustries.map((industry) => (
                                <div
                                  key={industry.id || industry.industry_name}
                                  className="rounded-lg bg-zinc-50 px-2 py-1 dark:bg-zinc-800/50"
                                >
                                  <IndustryAvatar industry={industry} size="xs" />
                                </div>
                              ))}
                            </div>
                          )}

                          {request.items?.length > 0 && (
                            <ul className="mt-3 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                              {request.items.map((item) => (
                                <li key={item.id} className="flex items-center justify-between gap-2">
                                  <span className="truncate">
                                    {item.product?.name || item.product_id}
                                  </span>
                                  <span className="shrink-0 font-medium">{item.quantity} units</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          {request.notes && (
                            <p className="mt-2 text-xs text-zinc-500">{request.notes}</p>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="btn-secondary-sm">
                              View details
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                            {canApproveStock && request.status === 'PENDING_MANAGEMENT' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleApprove(request.id)
                                }}
                                className="btn-primary-sm"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Approve
                              </button>
                            )}
                          </div>
                        </div>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <StockRequestSlideOver
          isOpen={isRequestPanelOpen}
          onClose={() => setIsRequestPanelOpen(false)}
          depotId={selectedDepotId}
          depotName={depotMeta?.depot_name}
          depotStockByProduct={depotStockByProduct}
          onSuccess={handleRequestSuccess}
        />
      </AnimatedPage>
    </DashboardLayout>
  )
}
