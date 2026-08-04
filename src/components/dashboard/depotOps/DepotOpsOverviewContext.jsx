import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { useCcMissionFilters } from '../../map/CcMissionFiltersContext'
import { useDepotOpsOverview } from '../../../hooks/useDepotOpsOverview'
import { useDepotOpsLive } from '../../../hooks/useDepotOpsLive'
import { depotOpsLiveReducer } from '../../../hooks/depotOpsLiveReducer'

const DepotOpsOverviewContext = createContext(null)

/**
 * Provides depot-ops snapshot + live WS deltas to home rail body + header bell.
 * Only fetch/connect when `enabled` (home Command Center rail).
 * All depots (no depotId): REST aggregate + WS multi-room via meta.depotIds.
 */
export function DepotOpsOverviewProvider({ enabled = false, children }) {
  const filters = useCcMissionFilters()
  const date = filters?.date
  const dateFrom = filters?.dateFrom || date
  const dateTo = filters?.dateTo || date
  const depotId = filters?.depotIdForApi || null

  const overview = useDepotOpsOverview({
    date,
    dateFrom,
    dateTo,
    depotId,
    enabled,
  })

  const [view, dispatch] = useReducer(depotOpsLiveReducer, null)
  const snapshotKeyRef = useRef(null)

  useEffect(() => {
    const snapshot = overview.data
    if (!snapshot) {
      snapshotKeyRef.current = null
      dispatch({ type: 'RESET', snapshot: null })
      return
    }
    const idsKey = (snapshot.meta?.depotIds || []).join(',')
    // Omit generatedAt — soft refetches must not wipe live timeline/KPI deltas.
    const key = `${snapshot.meta?.depotId || 'all'}|${idsKey}|${snapshot.meta?.date || date}|${dateFrom}|${dateTo}`
    if (snapshotKeyRef.current === key) return
    snapshotKeyRef.current = key
    dispatch({ type: 'RESET', snapshot })
  }, [overview.data, depotId, date, dateFrom, dateTo])

  // Drop live/view cache while REST snapshot is cleared (refetch / filter change).
  const merged = overview.data != null ? view || overview.data : null

  const onMessage = useCallback((message) => {
    dispatch({ message })
  }, [])

  const sinceEventId = useMemo(() => {
    const timeline = merged?.timeline || []
    return timeline[0]?.id || null
  }, [merged?.timeline])

  const liveDepotIdsKey = useMemo(() => {
    if (depotId) return ''
    const ids = overview.data?.meta?.depotIds
    if (!Array.isArray(ids) || ids.length === 0) return ''
    return [...ids].map(String).sort().join(',')
  }, [depotId, overview.data?.meta?.depotIds])

  const liveDepotIds = useMemo(() => {
    if (!liveDepotIdsKey) return null
    return liveDepotIdsKey.split(',')
  }, [liveDepotIdsKey])

  const { liveStatus } = useDepotOpsLive({
    depotId,
    depotIds: liveDepotIds,
    date,
    dateFrom,
    dateTo,
    enabled: Boolean(enabled && date && (depotId || liveDepotIds?.length)),
    sinceEventId,
    onMessage,
  })

  const value = useMemo(
    () => ({
      ...overview,
      data: merged,
      date,
      dateFrom,
      dateTo,
      depotId,
      liveStatus,
      notificationCount: merged?.notificationCount ?? 0,
      notificationRevision: merged?.notificationRevision ?? 0,
      kpis: merged?.kpis || null,
      approvalQueue: merged?.approvalQueue || null,
      timeline: merged?.timeline || [],
      alerts: merged?.alerts || [],
    }),
    [overview, merged, date, dateFrom, dateTo, depotId, liveStatus],
  )

  return (
    <DepotOpsOverviewContext.Provider value={value}>{children}</DepotOpsOverviewContext.Provider>
  )
}

export function useDepotOpsOverviewContext() {
  return useContext(DepotOpsOverviewContext)
}

export default DepotOpsOverviewProvider
