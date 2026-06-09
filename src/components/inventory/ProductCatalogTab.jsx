import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, Pencil, Search, Trash2, X } from 'lucide-react'
import { SlideOverPanel } from '../SlideOverPanel'
import { FilterNavButton, FilterSectionLabel } from './CatalogFilterNav'
import apiInstance from '../../api/axiosInstance'

const EMPTY_FORM = {
  name: '',
  sku: '',
  barcode: '',
  brandId: '',
  categoryId: '',
  industryId: '',
  basePrice: '',
  description: '',
  imageUrl: '',
  volumePerUnit: '',
  isActive: true,
}

function formatDa(value) {
  return `${Number(value || 0).toLocaleString('fr-MA', { maximumFractionDigits: 2 })} MAD`
}

async function fetchAllProducts(signal) {
  const unique = new Map()
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const res = await apiInstance.get('/products', {
      params: { page, limit: 100, sortBy: 'name', isActive: undefined },
      signal,
    })
    const products = res.data?.data?.products || []
    const pagination = res.data?.data?.pagination || {}
    totalPages = pagination.pages || 1

    for (const product of products) {
      if (product?.id && !unique.has(product.id)) unique.set(product.id, product)
    }

    if (products.length === 0) break
    page += 1
  }

  return [...unique.values()].sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
}

function CatalogSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-800" />
      ))}
    </div>
  )
}

function ProductSearchBar({ value, onChange, onClear, resultCount }) {
  const hasQuery = value.trim().length > 0

  return (
    <div>
      <label className="sr-only" htmlFor="product-catalog-search">Search products</label>
      <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-[#ff6b00]/50 focus-within:ring-2 focus-within:ring-[#ff6b00]/15 dark:border-zinc-700 dark:bg-zinc-900">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <Search className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <input
          id="product-catalog-search"
          type="search"
          value={value}
          onChange={onChange}
          placeholder="Search by name, SKU, brand, or category…"
          className="min-w-0 flex-1 border-0 bg-transparent py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100"
        />
        {hasQuery && (
          <button
            type="button"
            onClick={onClear}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {hasQuery && (
        <p className="mt-2 text-xs text-zinc-500">
          {resultCount} product{resultCount === 1 ? '' : 's'} match your search
        </p>
      )}
    </div>
  )
}

export const ProductCatalogTab = forwardRef(function ProductCatalogTab({ canManage = false }, ref) {
  const controllerRef = useRef(null)
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [industries, setIndustries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [actionMessage, setActionMessage] = useState('')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const loadCatalog = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)
    setLoadError('')
    try {
      const [productList, brandsRes, categoriesRes, industriesRes] = await Promise.all([
        fetchAllProducts(controller.signal),
        apiInstance.get('/brands', { params: { limit: 100 }, signal: controller.signal }),
        apiInstance.get('/categories', { params: { limit: 100 }, signal: controller.signal }),
        apiInstance.get('/industries', { signal: controller.signal }),
      ])
      if (controller.signal.aborted) return
      setProducts(productList)
      setBrands(brandsRes.data?.data?.brands || [])
      setCategories(categoriesRes.data?.data?.categories || [])
      setIndustries(industriesRes.data?.data?.industries || [])
    } catch (err) {
      if (err.name === 'CanceledError') return
      setProducts([])
      setLoadError(err.response?.data?.message || 'Failed to load product catalog')
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCatalog()
    return () => controllerRef.current?.abort()
  }, [loadCatalog])

  const productCountByCategory = useMemo(() => {
    const counts = {}
    for (const product of products) {
      const categoryId = product.category_id || product.category?.id
      if (!categoryId) continue
      counts[categoryId] = (counts[categoryId] || 0) + 1
    }
    return counts
  }, [products])

  const brandsInSelectedCategory = useMemo(() => {
    const brandMap = new Map()
    for (const product of products) {
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
  }, [products, selectedCategoryId])

  const brandFilterTotal = useMemo(() => {
    if (!selectedCategoryId) return products.length
    return products.filter((p) => (p.category_id || p.category?.id) === selectedCategoryId).length
  }, [products, selectedCategoryId])

  const filteredProducts = useMemo(() => {
    let list = products

    if (selectedCategoryId) {
      list = list.filter((product) => (
        (product.category_id || product.category?.id) === selectedCategoryId
      ))
    }

    if (selectedBrandId) {
      list = list.filter((product) => (
        (product.brand_id || product.brand?.id) === selectedBrandId
      ))
    }

    const term = search.trim().toLowerCase()
    if (!term) return list

    return list.filter((product) => (
      String(product.name || '').toLowerCase().includes(term)
      || String(product.sku || '').toLowerCase().includes(term)
      || String(product.brand?.name || '').toLowerCase().includes(term)
      || String(product.category?.name || '').toLowerCase().includes(term)
    ))
  }, [products, search, selectedCategoryId, selectedBrandId])

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId)
    setSelectedBrandId('')
  }

  const openCreateForm = useCallback(() => {
    setEditingProduct(null)
    setFormData({
      ...EMPTY_FORM,
      brandId: selectedBrandId || brandsInSelectedCategory[0]?.id || brands[0]?.id || '',
      categoryId: selectedCategoryId || categories[0]?.id || '',
      industryId: industries[0]?.id || '',
    })
    setFormError('')
    setIsFormOpen(true)
  }, [selectedBrandId, brandsInSelectedCategory, brands, selectedCategoryId, categories, industries])

  useImperativeHandle(ref, () => ({ openCreateForm }), [openCreateForm])

  const openEditForm = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      barcode: product.barcode || '',
      brandId: product.brand_id || product.brand?.id || '',
      categoryId: product.category_id || product.category?.id || '',
      industryId: product.industry_id || product.industry?.id || '',
      basePrice: product.base_price ?? '',
      description: product.description || '',
      imageUrl: product.image_url || '',
      volumePerUnit: product.volume_per_unit ?? '',
      isActive: product.is_active !== false,
    })
    setFormError('')
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (isSubmitting) return
    setIsFormOpen(false)
    setEditingProduct(null)
    setFormData(EMPTY_FORM)
    setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canManage) return

    if (!formData.name.trim() || !formData.sku.trim() || !formData.brandId || !formData.categoryId || !formData.industryId) {
      setFormError('Name, SKU, brand, category, and industry are required.')
      return
    }

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      barcode: formData.barcode.trim() || undefined,
      brandId: formData.brandId,
      categoryId: formData.categoryId,
      industryId: formData.industryId,
      description: formData.description.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || undefined,
      basePrice: Number(formData.basePrice) || 0,
      volumePerUnit: formData.volumePerUnit !== '' ? Number(formData.volumePerUnit) : undefined,
      isActive: formData.isActive,
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      if (editingProduct?.id) {
        await apiInstance.put(`/products/${editingProduct.id}`, payload)
        setActionMessage('Product updated successfully.')
      } else {
        await apiInstance.post('/products', payload)
        setActionMessage('Product created successfully.')
      }
      closeForm()
      await loadCatalog()
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (product) => {
    if (!canManage) return
    const confirmed = window.confirm(`Deactivate "${product.name}"? It will no longer appear in stock requests.`)
    if (!confirmed) return

    setActionMessage('')
    try {
      await apiInstance.delete(`/products/${product.id}`)
      setActionMessage(`"${product.name}" was deactivated.`)
      await loadCatalog()
    } catch (err) {
      setActionMessage(err.response?.data?.message || 'Failed to delete product')
    }
  }

  return (
    <>
      <div className="space-y-4">
        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
            {loadError}
          </div>
        )}

        {actionMessage && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
            {actionMessage}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <div className="hidden lg:block lg:col-span-1" />
            <div className="min-w-0 space-y-4 lg:col-span-3">
              <ProductSearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                resultCount={0}
              />
              <CatalogSkeleton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            <aside className="order-2 lg:order-none lg:col-span-1">
              <FilterSectionLabel>Categories</FilterSectionLabel>
              <nav className="no-scrollbar max-h-[40vh] space-y-0.5 overflow-y-auto pr-1">
                <FilterNavButton
                  label="All products"
                  count={products.length}
                  isActive={!selectedCategoryId}
                  onClick={() => handleCategorySelect('')}
                />
                {[...categories]
                  .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
                  .map((category) => (
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
                {brandsInSelectedCategory.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-zinc-500">
                    {selectedCategoryId ? 'No brands in this category yet.' : 'No brands in catalog yet.'}
                  </p>
                ) : (
                  brandsInSelectedCategory.map((brand) => (
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
            </aside>

            <div className="order-1 min-w-0 space-y-4 lg:order-none lg:col-span-3">
              <ProductSearchBar
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClear={() => setSearch('')}
                resultCount={filteredProducts.length}
              />

              {(selectedCategoryId || selectedBrandId) && (
                <p className="mb-4 text-sm text-zinc-500">
                  Showing {filteredProducts.length} product{filteredProducts.length === 1 ? '' : 's'}
                  {selectedCategoryId && (
                    <> in <span className="font-medium text-zinc-700 dark:text-zinc-300">{categories.find((c) => c.id === selectedCategoryId)?.name}</span></>
                  )}
                  {selectedBrandId && (
                    <> · <span className="font-medium text-zinc-700 dark:text-zinc-300">{brandsInSelectedCategory.find((b) => b.id === selectedBrandId)?.name || brands.find((b) => b.id === selectedBrandId)?.name}</span></>
                  )}
                </p>
              )}

              <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                      <tr>
                        {['Product', 'SKU', 'Industry', 'Brand', 'Category', 'Price', 'Status', ...(canManage ? [''] : [])].map((col) => (
                          <th key={col || 'actions'} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.length === 0 ? (
                        <tr>
                          <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-zinc-500">
                            No products found.
                          </td>
                        </tr>
                      ) : (
                        filteredProducts.map((product) => (
                          <tr key={product.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50/50 dark:border-zinc-800 dark:hover:bg-zinc-800/30">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                {product.image_url ? (
                                  <img src={product.image_url} alt="" className="h-10 w-10 rounded-md object-cover" />
                                ) : (
                                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-100 text-zinc-500 dark:bg-zinc-800">
                                    <ImageIcon className="h-4 w-4" />
                                  </div>
                                )}
                                <span className="font-medium text-zinc-900 dark:text-zinc-100">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-zinc-500">{product.sku || '—'}</td>
                            <td className="px-6 py-4 text-zinc-500">{product.industry?.industry_name || '—'}</td>
                            <td className="px-6 py-4 text-zinc-500">{product.brand?.name || '—'}</td>
                            <td className="px-6 py-4 text-zinc-500">{product.category?.name || '—'}</td>
                            <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{formatDa(product.base_price)}</td>
                            <td className="px-6 py-4">
                              {product.is_active === false ? (
                                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                                  Inactive
                                </span>
                              ) : (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                                  Active
                                </span>
                              )}
                            </td>
                            {canManage && (
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    type="button"
                                    onClick={() => openEditForm(product)}
                                    className="rounded-lg p-2 text-zinc-500 hover:bg-gray-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                                    title="Edit product"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </button>
                                  {product.is_active !== false && (
                                    <button
                                      type="button"
                                      onClick={() => handleDelete(product)}
                                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                      title="Deactivate product"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <SlideOverPanel
        isOpen={isFormOpen}
        onClose={closeForm}
        disableClose={isSubmitting}
        title={editingProduct ? 'Edit product' : 'Add product'}
        description="Products in this catalog can be selected when depots request stock."
        footer={(
          <div className="flex gap-3">
            <button
              type="button"
              onClick={closeForm}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="product-catalog-form"
              disabled={isSubmitting}
              className="btn-primary flex-1 justify-center"
            >
              {isSubmitting ? 'Saving…' : editingProduct ? 'Save changes' : 'Create product'}
            </button>
          </div>
        )}
      >
        <form id="product-catalog-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Name *</label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">SKU *</label>
              <input
                required
                value={formData.sku}
                onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Barcode</label>
              <input
                value={formData.barcode}
                onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Supplying industry *</label>
            <select
              required
              value={formData.industryId}
              onChange={(e) => setFormData((prev) => ({ ...prev, industryId: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              <option value="">Select industry</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.industry_name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Brand *</label>
              <select
                required
                value={formData.brandId}
                onChange={(e) => setFormData((prev) => ({ ...prev, brandId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Select brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Base price (MAD) *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData((prev) => ({ ...prev, basePrice: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">Volume per unit</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={formData.volumePerUnit}
                onChange={(e) => setFormData((prev) => ({ ...prev, volumePerUnit: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, imageUrl: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="rounded border-gray-300"
            />
            Active in catalog
          </label>
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
        </form>
      </SlideOverPanel>
    </>
  )
})
