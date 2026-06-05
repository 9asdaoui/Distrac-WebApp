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
import apiInstance from '../../api/axiosInstance'

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

function KpiCard({ title, value, subtitle, icon: Icon, colorClass, variant }) {
  const isDark = variant === 'dark'
  return (
    <div
      className={
        isDark
          ? 'rounded-xl border border-zinc-800 bg-zinc-900/80 p-4'
          : 'rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'
      }
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{title}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className={`font-bold ${isDark ? 'text-2xl text-zinc-100' : 'text-3xl text-zinc-900 dark:text-zinc-100'}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-zinc-500">{subtitle}</p>
    </div>
  )
}

/**
 * Executive Home dashboard body (KPIs + 7-day orders chart).
 * Shared by /dashboard and Global Map default side panel.
 */
export function ExecutiveHomeContent({ variant = 'light', compact = false, showIntro = true }) {
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
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controllerRef.current?.abort()
  }, [])

  const totalDailySales = useMemo(
    () => ordersToday.reduce((sum, order) => sum + toAmount(order.total_amount), 0),
    [ordersToday],
  )

  const avgDepotHealth = useMemo(() => {
    if (!depotStatus.length) return 0
    const total = depotStatus.reduce((sum, depot) => sum + toAmount(depot.usage_percentage), 0)
    return total / depotStatus.length
  }, [depotStatus])

  const activeDebt = useMemo(
    () => debtSummary.reduce((sum, row) => sum + toAmount(row.total_responsibility_amount), 0),
    [debtSummary],
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

  const isDark = variant === 'dark'
  const chartHeight = compact ? 'h-52' : 'h-80'
  const gridClass = compact ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {showIntro && (
        <div className={isDark ? '' : 'rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900'}>
          {isDark ? (
            <div className="border-b border-zinc-800 px-1 pb-4">
              <h2 className="text-base font-semibold text-zinc-100">Executive Home</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Real-time operational pulse across sales, risks, logistics, and responsibility ledger.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Executive Home</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Real-time operational pulse across sales, risks, logistics, and responsibility ledger.
              </p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/50 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className={gridClass}>
        <KpiCard
          title="Total Daily Sales"
          value={isLoading ? '...' : `${Math.round(totalDailySales).toLocaleString()} DA`}
          subtitle="based on today's orders"
          icon={ShoppingCart}
          colorClass="bg-emerald-500/15 text-emerald-400"
          variant={variant}
        />
        <KpiCard
          title="Pending Exceptions"
          value={isLoading ? '...' : pendingExceptionsCount}
          subtitle="awaiting supervisor decision"
          icon={AlertTriangle}
          colorClass="bg-amber-500/15 text-amber-400"
          variant={variant}
        />
        <KpiCard
          title="Depot Health"
          value={isLoading ? '...' : `${avgDepotHealth.toFixed(1)}%`}
          subtitle="average capacity utilization"
          icon={Activity}
          colorClass="bg-blue-500/15 text-blue-400"
          variant={variant}
        />
        <KpiCard
          title="Active Debt"
          value={isLoading ? '...' : `${Math.round(activeDebt).toLocaleString()} DA`}
          subtitle="supervisor responsibility total"
          icon={DollarSign}
          colorClass="bg-rose-500/15 text-rose-400"
          variant={variant}
        />
      </div>

      <div
        className={
          isDark
            ? 'rounded-xl border border-zinc-800 bg-zinc-900/80 p-4'
            : 'rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900'
        }
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className={`font-semibold text-zinc-100 ${compact ? 'text-sm' : 'text-lg'}`}>
            Orders Over The Last 7 Days
          </h3>
          <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">Daily count</span>
        </div>
        <div className={`${chartHeight} w-full`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={ordersChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
              <XAxis dataKey="label" tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(113,113,122,0.12)' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #3f3f46',
                  background: '#18181b',
                  color: '#fafafa',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="orders" radius={[6, 6, 0, 0]} fill="#0ea5e9" />
              <Line type="monotone" dataKey="orders" stroke="#38bdf8" strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
