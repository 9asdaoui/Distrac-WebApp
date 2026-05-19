import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, DollarSign, Activity, ShoppingCart } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from 'recharts'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function isoDate(date) {
  return startOfDay(date).toISOString().slice(0, 10)
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)
}

function toAmount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function KpiCard({ title, value, subtitle, icon: Icon, colorClass }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{title}</p>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
    </div>
  )
}

export function DashboardHome() {
  const [ordersToday, setOrdersToday] = useState([])
  const [ordersLast7d, setOrdersLast7d] = useState([])
  const [pendingExceptionsCount, setPendingExceptionsCount] = useState(0)
  const [depotStatus, setDepotStatus] = useState([])
  const [debtSummary, setDebtSummary] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  useEffect(() => {
    const load = async () => {
      if (controllerRef.current) controllerRef.current.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      setIsLoading(true)
      setError('')

      const today = new Date()
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(today.getDate() - 6)

      const todayStr = isoDate(today)
      const sevenDaysAgoStr = isoDate(sevenDaysAgo)

      try {
        const [ordersTodayRes, orders7dRes, exceptionsRes, depotRes, debtRes] = await Promise.all([
          apiInstance.get(`/orders?fromDate=${todayStr}&toDate=${todayStr}&limit=100`, { signal: controller.signal }),
          apiInstance.get(`/orders?fromDate=${sevenDaysAgoStr}&toDate=${todayStr}&limit=100`, { signal: controller.signal }),
          apiInstance.get('/exceptions?status=PENDING', { signal: controller.signal }),
          apiInstance.get('/reports/depot/status', { signal: controller.signal }),
          apiInstance.get('/reports/debt/summary', { signal: controller.signal }),
        ])

        if (!controller.signal.aborted) {
          setOrdersToday(ordersTodayRes.data?.data?.orders || [])
          setOrdersLast7d(orders7dRes.data?.data?.orders || [])
          setPendingExceptionsCount(exceptionsRes.data?.data?.exceptions?.length || 0)
          setDepotStatus(depotRes.data?.data?.depots || [])
          setDebtSummary(debtRes.data?.data?.summary || [])
        }
      } catch (e) {
        if (e.name !== 'CanceledError') {
          setError('Failed to load executive dashboard data.')
          setOrdersToday([])
          setOrdersLast7d([])
          setPendingExceptionsCount(0)
          setDepotStatus([])
          setDebtSummary([])
        }
      } finally {
        setIsLoading(false)
      }
    }

    load()
    return () => controllerRef.current?.abort()
  }, [])

  const totalDailySales = useMemo(
    () => ordersToday.reduce((sum, order) => sum + toAmount(order.total_amount), 0),
    [ordersToday]
  )

  const avgDepotHealth = useMemo(() => {
    if (!depotStatus.length) return 0
    const total = depotStatus.reduce((sum, depot) => sum + toAmount(depot.usage_percentage), 0)
    return total / depotStatus.length
  }, [depotStatus])

  const activeDebt = useMemo(
    () => debtSummary.reduce((sum, row) => sum + toAmount(row.total_responsibility_amount), 0),
    [debtSummary]
  )

  const ordersChartData = useMemo(() => {
    const days = []
    const today = startOfDay(new Date())
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      days.push({
        key: isoDate(d),
        label: formatDayLabel(d),
        orders: 0,
      })
    }

    const byDay = new Map(days.map((d) => [d.key, d]))
    for (const order of ordersLast7d) {
      const rawDate = order.order_date || order.created_at
      if (!rawDate) continue
      const key = String(rawDate).slice(0, 10)
      if (byDay.has(key)) {
        byDay.get(key).orders += 1
      }
    }

    return days
  }, [ordersLast7d])

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Executive Home</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Real-time operational pulse across sales, risks, logistics, and responsibility ledger.</p>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Total Daily Sales"
              value={isLoading ? '...' : `${Math.round(totalDailySales).toLocaleString()} DA`}
              subtitle="based on today's orders"
              icon={ShoppingCart}
              colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
            <KpiCard
              title="Pending Exceptions"
              value={isLoading ? '...' : pendingExceptionsCount}
              subtitle="awaiting supervisor decision"
              icon={AlertTriangle}
              colorClass="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
            />
            <KpiCard
              title="Depot Health"
              value={isLoading ? '...' : `${avgDepotHealth.toFixed(1)}%`}
              subtitle="average capacity utilization"
              icon={Activity}
              colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            />
            <KpiCard
              title="Active Debt"
              value={isLoading ? '...' : `${Math.round(activeDebt).toLocaleString()} DA`}
              subtitle="supervisor responsibility total"
              icon={DollarSign}
              colorClass="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Orders Over The Last 7 Days</h2>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Daily Order Count</span>
            </div>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={ordersChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-zinc-200 dark:text-zinc-800" />
                  <XAxis dataKey="label" tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: '#71717a', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(113,113,122,0.08)' }}
                    contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7' }}
                  />
                  <Bar dataKey="orders" radius={[8, 8, 0, 0]} fill="#0ea5e9" />
                  <Line type="monotone" dataKey="orders" stroke="#0369a1" strokeWidth={2} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}
