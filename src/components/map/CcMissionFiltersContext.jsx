import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import {
  createDayPeriod,
  localTodayIso,
  normalizePeriod,
  resolvePeriodRange,
} from '../dashboard/depotOps/datePeriod'

export const DEPOT_FILTER_ALL = 'all'

const CcMissionFiltersContext = createContext(null)

/**
 * Shared Command Center filters (date period + depot + status).
 *
 * Controlled props (prefer period):
 *   period / onPeriodChange
 * Legacy string date still accepted and mapped to { granularity: 'day', value }.
 */
export function CcMissionFiltersProvider({
  children,
  period: controlledPeriod,
  onPeriodChange,
  date: controlledDate,
  onDateChange,
  depotId: controlledDepotId,
  onDepotChange,
  status: controlledStatus,
  onStatusChange,
}) {
  const [internalPeriod, setInternalPeriod] = useState(() => createDayPeriod())
  const [internalDepotId, setInternalDepotId] = useState(DEPOT_FILTER_ALL)
  const [internalStatus, setInternalStatus] = useState('ALL')

  const isPeriodControlled = controlledPeriod !== undefined || onPeriodChange != null
  const isLegacyDateControlled = !isPeriodControlled && (controlledDate !== undefined || onDateChange != null)

  const period = useMemo(() => {
    if (controlledPeriod !== undefined) {
      return normalizePeriod(controlledPeriod)
    }
    if (isLegacyDateControlled && controlledDate !== undefined) {
      return normalizePeriod(controlledDate)
    }
    return normalizePeriod(internalPeriod)
  }, [controlledPeriod, controlledDate, isLegacyDateControlled, internalPeriod])

  const setPeriod = useCallback(
    (next) => {
      const normalized = normalizePeriod(typeof next === 'function' ? next(period) : next)
      if (onPeriodChange) {
        onPeriodChange(normalized)
        return
      }
      if (isLegacyDateControlled && onDateChange) {
        // Legacy parents only store a day string — keep them on day granularity.
        onDateChange(normalized.value)
        return
      }
      setInternalPeriod(normalized)
    },
    [onPeriodChange, isLegacyDateControlled, onDateChange, period],
  )

  const range = useMemo(() => resolvePeriodRange(period), [period])

  const date = range.date
  const setDate = useCallback(
    (isoOrUpdater) => {
      const nextIso =
        typeof isoOrUpdater === 'function' ? isoOrUpdater(date) : isoOrUpdater
      setPeriod(createDayPeriod(nextIso || localTodayIso()))
    },
    [date, setPeriod],
  )

  const depotId = controlledDepotId ?? internalDepotId
  const setDepotId = onDepotChange ?? setInternalDepotId
  const status = controlledStatus ?? internalStatus
  const setStatus = onStatusChange ?? setInternalStatus

  const value = useMemo(
    () => ({
      period,
      setPeriod,
      granularity: period.granularity,
      date,
      setDate,
      dateFrom: range.dateFrom,
      dateTo: range.dateTo,
      depotId,
      setDepotId,
      status,
      setStatus,
      depotIdForApi: depotId === DEPOT_FILTER_ALL ? null : depotId,
    }),
    [period, setPeriod, date, setDate, range.dateFrom, range.dateTo, depotId, setDepotId, status, setStatus],
  )

  return (
    <CcMissionFiltersContext.Provider value={value}>{children}</CcMissionFiltersContext.Provider>
  )
}

export function useCcMissionFilters() {
  return useContext(CcMissionFiltersContext)
}

export { localTodayIso as missionFilterToday, createDayPeriod }
