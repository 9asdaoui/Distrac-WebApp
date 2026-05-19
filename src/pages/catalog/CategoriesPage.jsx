import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'

function CategoriesSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Category</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Description</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-64 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const controllerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      if (controllerRef.current) controllerRef.current.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setIsLoading(true)
      try {
        const res = await apiInstance.get('/categories', { signal: controller.signal })
        if (!controller.signal.aborted) {
          setCategories(res.data?.data?.categories || [])
        }
      } catch (error) {
        if (error.name !== 'CanceledError') {
          setCategories([])
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
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Categories</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage product categories and hierarchy.</p>
            </div>
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
              <Plus className="h-4 w-4" />
              Add Category
            </button>
          </div>

          {isLoading ? (
            <CategoriesSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Category</th>
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
                    {categories.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={2}>
                          No categories available.
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
