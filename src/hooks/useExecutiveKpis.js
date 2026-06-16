import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

export function useExecutiveKpis() {
  const [ordersToday, setOrdersToday] = useState([])
  const [ordersLast7d, setOrdersLast7d] = useState([])
  const [pendingExceptionsCount, setPendingExceptionsCount] = useState(0)
  const [depotStatus, setDepotStatus] = useState([])
  const [debtSummary, setDebtSummary] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  const reload = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    reload()
    return () => controllerRef.current?.abort()
  }, [reload])

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
      days.push({ key: isoDate(d), label: formatDayLabel(d), orders: 0 })
    }
    const byDay = new Map(days.map((d) => [d.key, d]))
    for (const order of ordersLast7d) {
      const rawDate = order.order_date || order.created_at
      if (!rawDate) continue
      const key = String(rawDate).slice(0, 10)
      if (byDay.has(key)) byDay.get(key).orders += 1
    }
    return days
  }, [ordersLast7d])

  return {
    isLoading,
    error,
    reload,
    totalDailySales,
    avgDepotHealth,
    activeDebt,
    pendingExceptionsCount,
    ordersChartData,
  }
}
