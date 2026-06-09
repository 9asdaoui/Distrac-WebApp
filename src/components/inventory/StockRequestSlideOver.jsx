import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, Minus, Plus, Search, Truck } from 'lucide-react'
import { SlideOverPanel } from '../SlideOverPanel'
import apiInstance from '../../api/axiosInstance'

async function fetchAllProducts(signal) {
  const unique = new Map()
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await apiInstance.get('/products', {
      params: { page, limit: 100, sortBy: 'name', isActive: true },
      signal,
    })
    const products = res.data?.data?.products || []
    const pagination = res.data?.data?.pagination || {}
    totalPages = pagination.pages || 1

    for (const product of products) {
      if (product?.id && !unique.has(product.id)) {
        unique.set(product.id, product)
      }
    }

    if (products.length === 0) break
    page += 1
  }

  return [...unique.values()].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
}

function getProductIndustry(product) {
  return {
    id: product.industry_id || product.industry?.id || '',
    name: product.industry?.industry_name || '',
  }
}

export function StockRequestSlideOver({
  isOpen,
  onClose,
  depotId,
  depotName,
  depotStockByProduct = {},
  onSuccess,
}) {
  const controllerRef = useRef(null)
  const [catalogProducts, setCatalogProducts] = useState([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [qtyDraft, setQtyDraft] = useState({})
  const [cartLines, setCartLines] = useState([])
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!isOpen) return undefined

    setCatalogSearch('')
    setQtyDraft({})
    setCartLines([])
    setNotes('')
    setSubmitError('')

    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoadingCatalog(true)
      setCatalogError('')
      try {
        const products = await fetchAllProducts(controller.signal)
        if (!controller.signal.aborted) setCatalogProducts(products)
      } catch (err) {
        if (err.name === 'CanceledError') return
        setCatalogProducts([])
        setCatalogError(err.response?.data?.message || 'Failed to load products')
      } finally {
        if (!controller.signal.aborted) setIsLoadingCatalog(false)
      }
    }

    load()
    return () => controller.abort()
  }, [isOpen])

  const filteredCatalog = useMemo(() => {
    const term = catalogSearch.trim().toLowerCase()
    if (!term) return catalogProducts
    return catalogProducts.filter((product) => (
      String(product.name || '').toLowerCase().includes(term)
      || String(product.sku || '').toLowerCase().includes(term)
      || String(product.industry?.industry_name || '').toLowerCase().includes(term)
    ))
  }, [catalogProducts, catalogSearch])

  const cartCount = cartLines.length
  const cartTotalQty = cartLines.reduce((sum, line) => sum + line.requestQty, 0)

  const industryGroups = useMemo(() => {
    const groups = new Map()
    for (const line of cartLines) {
      const key = line.industryName || 'Unknown industry'
      groups.set(key, (groups.get(key) || 0) + line.requestQty)
    }
    return [...groups.entries()]
  }, [cartLines])

  const getOnHand = (productId) => Number(depotStockByProduct[productId]?.quantity || 0)

  const addToCart = (product) => {
    const industry = getProductIndustry(product)
    if (!industry.id) {
      setSubmitError(`"${product.name}" has no supplying industry. Assign one in Products first.`)
      return
    }

    const raw = qtyDraft[product.id]
    const qty = Math.max(1, Math.floor(Number(raw) || 1))
    setSubmitError('')

    setCartLines((prev) => {
      const existing = prev.find((line) => line.productId === product.id)
      if (existing) {
        return prev.map((line) => (
          line.productId === product.id
            ? { ...line, requestQty: line.requestQty + qty }
            : line
        ))
      }
      return [...prev, {
        productId: product.id,
        name: product.name || 'Product',
        sku: product.sku || '',
        onHand: getOnHand(product.id),
        requestQty: qty,
        industryId: industry.id,
        industryName: industry.name,
      }]
    })
    setQtyDraft((prev) => ({ ...prev, [product.id]: '' }))
  }

  const updateCartQty = (productId, value) => {
    const qty = Math.max(1, Math.floor(Number(value) || 1))
    setCartLines((prev) => prev.map((line) => (
      line.productId === productId ? { ...line, requestQty: qty } : line
    )))
  }

  const removeFromCart = (productId) => {
    setCartLines((prev) => prev.filter((line) => line.productId !== productId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!depotId || cartLines.length === 0) return

    setIsSubmitting(true)
    setSubmitError('')
    try {
      await apiInstance.post('/stock/requests', {
        depotId,
        notes: notes.trim() || `Replenishment request for ${depotName || 'depot'}`,
        items: cartLines.map((line) => ({
          productId: line.productId,
          quantity: line.requestQty,
        })),
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit stock request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SlideOverPanel
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isSubmitting}
      maxWidthClass="max-w-xl"
      title="Request stock"
      description={depotName ? `Replenishment for ${depotName}. Products route to their linked industry automatically.` : 'Select products and quantities to request.'}
      footer={(
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Optional…"
            />
          </div>

          {industryGroups.length > 1 && (
            <p className="text-xs text-zinc-500">
              This request will be split across {industryGroups.length} industries after submit.
            </p>
          )}

          {submitError && (
            <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || cartCount === 0}
            className="btn-primary w-full justify-center"
          >
            <Truck className="h-4 w-4" />
            {isSubmitting
              ? 'Submitting…'
              : `Submit request${cartCount > 0 ? ` (${cartCount} · ${cartTotalQty} units)` : ''}`}
          </button>
        </form>
      )}
    >
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Selected ({cartCount})
          </h3>
          {cartLines.length === 0 ? (
            <p className="mt-2 rounded-xl border border-dashed border-gray-300 px-4 py-5 text-center text-sm text-zinc-500 dark:border-zinc-700">
              No products selected yet. Pick from the catalog below.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {cartLines.map((line) => (
                <li
                  key={line.productId}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 dark:border-zinc-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{line.name}</p>
                    <p className="text-xs text-zinc-500">
                      {line.sku || '—'} · On hand: {line.onHand.toLocaleString()}
                    </p>
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      → {line.industryName}
                    </p>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={line.requestQty}
                    onChange={(e) => updateCartQty(line.productId, e.target.value)}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.productId)}
                    className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    aria-label="Remove"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Product catalog</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Each product is linked to a supplying industry. Multi-industry carts are split on submit.
          </p>

          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Search by name, SKU, or industry…"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>

          {catalogError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{catalogError}</p>
          )}

          {isLoadingCatalog ? (
            <div className="mt-4 space-y-2">
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
              ))}
            </div>
          ) : (
            <ul className="mt-4 max-h-[50vh] space-y-2 overflow-y-auto pr-1">
              {filteredCatalog.length === 0 ? (
                <li className="rounded-xl border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
                  No products match your search.
                </li>
              ) : (
                filteredCatalog.map((product) => {
                  const onHand = getOnHand(product.id)
                  const inCart = cartLines.some((line) => line.productId === product.id)
                  const industry = getProductIndustry(product)
                  const missingIndustry = !industry.id

                  return (
                    <li
                      key={product.id}
                      className={`rounded-xl border px-3 py-3 dark:border-zinc-800 ${
                        missingIndustry
                          ? 'border-amber-300 bg-amber-50/40 dark:border-amber-500/30 dark:bg-amber-500/5'
                          : inCart
                            ? 'border-blue-300 bg-blue-50/50 dark:border-blue-500/30 dark:bg-blue-500/5'
                            : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{product.name}</p>
                          <p className="text-xs text-zinc-500">{product.sku || '—'}</p>
                          <p className="mt-1 text-xs font-medium text-zinc-600 dark:text-zinc-300">
                            Depot on hand: <span className="text-zinc-900 dark:text-zinc-100">{onHand.toLocaleString()}</span>
                          </p>
                          {missingIndustry ? (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="h-3 w-3" />
                              No industry linked
                            </p>
                          ) : (
                            <p className="mt-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                              Industry: {industry.name}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            disabled={missingIndustry}
                            value={qtyDraft[product.id] ?? ''}
                            onChange={(e) => setQtyDraft((prev) => ({ ...prev, [product.id]: e.target.value }))}
                            className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
                          />
                          <button
                            type="button"
                            disabled={missingIndustry}
                            onClick={() => addToCart(product)}
                            className="btn-secondary-sm shrink-0"
                            title={missingIndustry ? 'Assign an industry in Products first' : 'Add to request'}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          )}
        </div>
      </div>
    </SlideOverPanel>
  )
}
