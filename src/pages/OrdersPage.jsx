import React, { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'

export function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const controllerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      if (controllerRef.current) controllerRef.current.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setIsLoading(true)
      try {
        const res = await apiInstance.get('/orders', { signal: controller.signal })
        if (!controller.signal.aborted) {
          setOrders(res.data?.data?.orders || [])
        }
      } catch (error) {
        if (error.name !== 'CanceledError') setOrders([])
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
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Orders</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Track order lifecycle and operational status.</p>
            </div>
            <button type="button" className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Order
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Order</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Client</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!isLoading && orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-200 dark:border-zinc-800">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{order.order_number || order.id}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{order.client_name || '-'}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{order.status || '-'}</td>
                    </tr>
                  ))}
                  {!isLoading && orders.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>No orders available.</td>
                    </tr>
                  )}
                  {isLoading && (
                    <tr>
                      <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>Loading orders...</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
