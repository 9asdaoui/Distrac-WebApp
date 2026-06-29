import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import apiInstance from '../api/axiosInstance'

function toAmount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function toIsoDate(date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getYesterdayIso() {
  const date = new Date()
  date.setUTCDate(date.getUTCDate() - 1)
  return toIsoDate(date)
}

const INITIAL_SECTION_LOADING = {
  pulse: true,
  action: true,
  inventory: true,
  fleet: true,
}

function orderRevenue(order) {
  return toAmount(order.total_amount ?? order.totalAmount)
}

function mapCriticalDepots(depots) {
  return depots
    .map((depot) => {
      const raw = toAmount(depot.usage_percentage_raw ?? depot.usage_percentage)
      return {
        id: depot.depot_id,
        name: depot.depot_name || 'Depot',
        usageRaw: raw,
        usageDisplay: depot.over_capacity ? 100 : Math.min(raw, 100),
        overCapacity: Boolean(depot.over_capacity),
      }
    })
    .filter((depot) => depot.overCapacity || depot.usageRaw >= 80)
    .sort((a, b) => b.usageRaw - a.usageRaw)
    .slice(0, 3)
}

export function useOperationsBoard() {
  const controllerRef = useRef(null)
  const [error, setError] = useState('')
  const [sectionLoading, setSectionLoading] = useState(INITIAL_SECTION_LOADING)

  const [pendingExceptionsCount, setPendingExceptionsCount] = useState(0)
  const [pendingProposalsCount, setPendingProposalsCount] = useState(0)
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0)
  const [missionStopsTotal, setMissionStopsTotal] = useState(0)
  const [missionStopsCompleted, setMissionStopsCompleted] = useState(0)
  const [criticalDepots, setCriticalDepots] = useState([])
  const [livreursCheckedIn, setLivreursCheckedIn] = useState(0)
  const [livreursTotal, setLivreursTotal] = useState(0)
  const [unassignedOrdersTomorrow, setUnassignedOrdersTomorrow] = useState(0)

  const reload = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setError('')
    setSectionLoading(INITIAL_SECTION_LOADING)

    const signal = controller.signal
    const yesterday = getYesterdayIso()

    const actionPromise = Promise.all([
      apiInstance.get('/exceptions?status=PENDING', { signal }),
      apiInstance.get('/depot/proposals', { signal }),
    ])
      .then(([exceptionsRes, proposalsRes]) => {
        if (signal.aborted) return
        const exceptions = exceptionsRes.data?.data?.exceptions || []
        const proposals = (proposalsRes.data?.data?.proposals || []).filter(
          (row) => String(row.status || '').toUpperCase() === 'PENDING',
        )
        setPendingExceptionsCount(exceptions.length)
        setPendingProposalsCount(proposals.length)
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || signal.aborted) return
        throw err
      })
      .finally(() => {
        if (!signal.aborted) setSectionLoading((prev) => ({ ...prev, action: false }))
      })

    const pulsePromise = Promise.all([
      apiInstance.get('/orders/today', { signal }),
      apiInstance.get(`/orders/today?date=${yesterday}`, { signal }),
      apiInstance.get('/missions/today', { signal }),
    ])
      .then(([ordersRes, yesterdayRes, missionsRes]) => {
        if (signal.aborted) return
        const orders = ordersRes.data?.data?.orders || []
        const yesterdayOrders = yesterdayRes.data?.data?.orders || []
        const itinerary = missionsRes.data?.data?.itinerary || []
        const revenue = orders.reduce((sum, order) => sum + orderRevenue(order), 0)
        const priorRevenue = yesterdayOrders.reduce((sum, order) => sum + orderRevenue(order), 0)
        const total = itinerary.length
        const completed = itinerary.filter(
          (stop) => String(stop.status || '').toUpperCase() === 'COMPLETED',
        ).length
        setTodayRevenue(revenue)
        setYesterdayRevenue(priorRevenue)
        setMissionStopsTotal(total)
        setMissionStopsCompleted(completed)
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || signal.aborted) return
        throw err
      })
      .finally(() => {
        if (!signal.aborted) setSectionLoading((prev) => ({ ...prev, pulse: false }))
      })

    const inventoryPromise = apiInstance
      .get('/reports/depot/status', { signal })
      .then((depotRes) => {
        if (signal.aborted) return
        const depots = depotRes.data?.data?.depots || []
        setCriticalDepots(mapCriticalDepots(depots))
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || signal.aborted) return
        throw err
      })
      .finally(() => {
        if (!signal.aborted) setSectionLoading((prev) => ({ ...prev, inventory: false }))
      })

    const fleetPromise = apiInstance
      .get('/reports/fleet/status', { signal })
      .then((fleetRes) => {
        if (signal.aborted) return
        const fleet = fleetRes.data?.data?.fleet || {}
        setLivreursCheckedIn(toAmount(fleet.livreurs_checked_in_today))
        setLivreursTotal(toAmount(fleet.livreurs_total))
        setUnassignedOrdersTomorrow(toAmount(fleet.unassigned_orders_tomorrow))
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || signal.aborted) return
        throw err
      })
      .finally(() => {
        if (!signal.aborted) setSectionLoading((prev) => ({ ...prev, fleet: false }))
      })

    try {
      await Promise.all([actionPromise, pulsePromise, inventoryPromise, fleetPromise])
    } catch {
      if (!signal.aborted) {
        setError('Failed to load operations board data.')
      }
    }
  }, [])

  useEffect(() => {
    reload()
    return () => controllerRef.current?.abort()
  }, [reload])

  const actionRequiredCount = pendingExceptionsCount + pendingProposalsCount

  const missionProgressPercent = useMemo(() => {
    if (!missionStopsTotal) return 0
    return Math.round((missionStopsCompleted / missionStopsTotal) * 100)
  }, [missionStopsCompleted, missionStopsTotal])

  const isRevenueUp = todayRevenue > yesterdayRevenue

  const hasFleetWarnings = unassignedOrdersTomorrow > 0

  const systemHealthy = useMemo(() => {
    if (error) return false
    return (
      actionRequiredCount === 0 &&
      criticalDepots.length === 0 &&
      !hasFleetWarnings &&
      !Object.values(sectionLoading).some(Boolean)
    )
  }, [actionRequiredCount, criticalDepots.length, error, hasFleetWarnings, sectionLoading])

  const isLoading = Object.values(sectionLoading).some(Boolean)

  return {
    error,
    isLoading,
    sectionLoading,
    reload,
    actionRequiredCount,
    pendingExceptionsCount,
    pendingProposalsCount,
    todayRevenue,
    yesterdayRevenue,
    isRevenueUp,
    missionStopsTotal,
    missionStopsCompleted,
    missionProgressPercent,
    criticalDepots,
    livreursCheckedIn,
    livreursTotal,
    unassignedOrdersTomorrow,
    hasFleetWarnings,
    systemHealthy,
  }
}
