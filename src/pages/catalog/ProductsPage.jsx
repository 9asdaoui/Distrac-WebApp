import React, { useEffect, useRef, useState } from 'react'
import { Image as ImageIcon, Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'

function ProductsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Image</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">SKU</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Product</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Brand</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Price</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-8 w-8 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-56 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ProductsPage() {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const controllerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      if (controllerRef.current) controllerRef.current.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setIsLoading(true)
      try {
        const res = await apiInstance.get('/products', { signal: controller.signal })
        if (!controller.signal.aborted) {
          setProducts(res.data?.data?.products || [])
        }
      } catch (error) {
        if (error.name !== 'CanceledError') {
          setProducts([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return () => controllerRef.current?.abort()
  }, [])

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Products</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage product SKUs, pricing, and category mapping.</p>
            </div>
            <button type="button" className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>

          {isLoading ? (
            <ProductsSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Image</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">SKU</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Product</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Brand</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Price</th>
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
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={5}>
                          No products available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
