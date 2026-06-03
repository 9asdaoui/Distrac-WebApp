import React, { useEffect, useState, useRef, useMemo } from 'react'
import { Loader2, Plus, ShoppingCart, Image as ImageIcon, X } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import { SmoothSlideOver } from '../components/SmoothSlideOver'
import apiInstance from '../api/axiosInstance'

const TABS = {
  BRANDS: 'brands',
  CATEGORIES: 'categories',
  PRODUCTS: 'products',
}

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  )
}

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
        <div className="pt-0.5">
          <ShoppingCart className="h-4 w-4" />
        </div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
      ))}
    </div>
  )
}

function EmptyState({ title, description, onAdd }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800">
        <ShoppingCart className="h-7 w-7 text-zinc-500" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" />
        Add {title.toLowerCase()}
      </button>
    </div>
  )
}

export function CatalogPage() {
  const [activeTab, setActiveTab] = useState(TABS.BRANDS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({})
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const controllerRef = useRef(null)

  const loadData = async () => {
    // Cancel any previous requests
    if (controllerRef.current) {
      controllerRef.current.abort()
    }

    // Create new controller for this request
    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)

    try {
      const [brandsRes, categoriesRes, productsRes] = await Promise.all([
        apiInstance.get('/brands', { signal: controller.signal }).catch(() => ({ data: { data: { brands: [] } } })),
        apiInstance.get('/categories', { signal: controller.signal }).catch(() => ({ data: { data: { categories: [] } } })),
        apiInstance.get('/products', { signal: controller.signal }).catch(() => ({ data: { data: { products: [] } } })),
      ])

      // Only update state if request wasn't cancelled
      if (!controller.signal.aborted) {
        setBrands(brandsRes.data?.data?.brands || [])
        setCategories(categoriesRes.data?.data?.categories || [])
        setProducts(productsRes.data?.data?.products || [])
      }
    } catch (error) {
      // Only show error if it's not a cancellation
      if (error.name !== 'CanceledError' && !controller.signal.aborted) {
        setToast({
          message: getErrorMessage(error, 'Failed to load catalog data'),
          type: 'error',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    return () => {
      // Abort requests when component unmounts
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (!toast.message) return undefined
    const timer = setTimeout(() => setToast({ message: '', type: 'success' }), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const closePanel = () => {
    setIsCreateOpen(false)
    setCreateFormData({})
  }

  const handleCreateBrand = async (e) => {
    e.preventDefault()
    if (!createFormData.brandName) {
      setToast({ message: 'Brand name is required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/brands', {
        brand_name: createFormData.brandName,
        description: createFormData.description || null,
        logo_url: createFormData.logoUrl || null,
      })

      setToast({ message: 'Brand created successfully', type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create brand'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    if (!createFormData.categoryName) {
      setToast({ message: 'Category name is required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/categories', {
        category_name: createFormData.categoryName,
        description: createFormData.description || null,
      })

      setToast({ message: 'Category created successfully', type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create category'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateProduct = async (e) => {
    e.preventDefault()
    if (!createFormData.productName || !createFormData.brandId || !createFormData.categoryId) {
      setToast({ message: 'Product name, brand, and category are required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/products', {
        product_name: createFormData.productName,
        brand_id: createFormData.brandId,
        category_id: createFormData.categoryId,
        sku: createFormData.sku || null,
        base_price: createFormData.basePrice ? parseFloat(createFormData.basePrice) : 0,
        volume_per_unit: createFormData.volumePerUnit ? parseFloat(createFormData.volumePerUnit) : 0,
        image_url: createFormData.imageUrl || null,
        description: createFormData.description || null,
      })

      setToast({ message: 'Product created successfully', type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create product'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTabContent = () => {
    if (isLoading) return <LoadingSkeleton />

    switch (activeTab) {
      case TABS.BRANDS:
        if (brands.length === 0) {
          return (
            <EmptyState
              title="Brands"
              description="Create your first brand to categorize products."
              onAdd={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
            />
          )
        }
        return (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id} className="border-b border-gray-200 dark:border-zinc-800">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{brand.brand_name}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{brand.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case TABS.CATEGORIES:
        if (categories.length === 0) {
          return (
            <EmptyState
              title="Categories"
              description="Create your first product category."
              onAdd={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
            />
          )
        }
        return (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-b border-gray-200 dark:border-zinc-800">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{category.category_name}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{category.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case TABS.PRODUCTS:
        if (products.length === 0) {
          return (
            <EmptyState
              title="Products"
              description="Create your first product to manage inventory."
              onAdd={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
            />
          )
        }
        return (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Image</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">SKU</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Brand</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Price</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Volume/Unit</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 dark:border-zinc-800">
                      <td className="px-6 py-4">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.product_name} className="h-8 w-8 rounded object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-200 dark:bg-zinc-700">
                            <ImageIcon className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">{product.sku || '-'}</td>
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{product.product_name}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{product.brands?.brand_name || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-zinc-100">${Number(product.base_price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{product.volume_per_unit || '-'} L</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getCreateForm = () => {
    switch (activeTab) {
      case TABS.BRANDS:
        return (
          <form className="space-y-6" onSubmit={handleCreateBrand}>
            <div>
              <label htmlFor="brandName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Brand Name
              </label>
              <input
                id="brandName"
                type="text"
                value={createFormData.brandName || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, brandName: e.target.value })}
                placeholder="e.g. Samsung"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                id="description"
                value={createFormData.description || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Brand description"
                rows="3"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
              <button type="button" onClick={closePanel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-60">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )

      case TABS.CATEGORIES:
        return (
          <form className="space-y-6" onSubmit={handleCreateCategory}>
            <div>
              <label htmlFor="categoryName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Category Name
              </label>
              <input
                id="categoryName"
                type="text"
                value={createFormData.categoryName || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, categoryName: e.target.value })}
                placeholder="e.g. Electronics"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                id="description"
                value={createFormData.description || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Category description"
                rows="3"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
              <button type="button" onClick={closePanel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-60">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )

      case TABS.PRODUCTS:
        return (
          <form className="space-y-6" onSubmit={handleCreateProduct}>
            <div>
              <label htmlFor="productName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Product Name
              </label>
              <input
                id="productName"
                type="text"
                value={createFormData.productName || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, productName: e.target.value })}
                placeholder="e.g. Galaxy S24"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="brandId" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Brand
                </label>
                <select
                  id="brandId"
                  value={createFormData.brandId || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, brandId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Select brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.brand_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="categoryId" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Category
                </label>
                <select
                  id="categoryId"
                  value={createFormData.categoryId || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, categoryId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="sku" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  SKU
                </label>
                <input
                  id="sku"
                  type="text"
                  value={createFormData.sku || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, sku: e.target.value })}
                  placeholder="SKU-12345"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label htmlFor="basePrice" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Base Price
                </label>
                <input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={createFormData.basePrice || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, basePrice: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="volumePerUnit" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Volume per Unit (L)
              </label>
              <input
                id="volumePerUnit"
                type="number"
                step="0.01"
                value={createFormData.volumePerUnit || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, volumePerUnit: e.target.value })}
                placeholder="For depot capacity calculations"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                id="description"
                value={createFormData.description || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Product description"
                rows="3"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
              <button type="button" onClick={closePanel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-60">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Product Catalog</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage brands, categories, and products.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-zinc-800">
              {Object.values(TABS).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
                    activeTab === tab
                      ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {renderTabContent()}
          </div>
        </div>
      </AnimatedPage>

      <SmoothSlideOver isOpen={isCreateOpen} onClose={closePanel} title={`Add ${activeTab.slice(0, -1)}`} description="Fill in the details below to create a new item.">
        {getCreateForm()}
      </SmoothSlideOver>
    </DashboardLayout>
  )
}
