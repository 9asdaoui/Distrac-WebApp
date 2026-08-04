import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../api/axiosInstance'

/**
 * Fetch Command Center depot-ops snapshot.
 * When depotId is null/undefined, loads aggregated All-depots overview.
 * Passes date (start) plus optional dateFrom/dateTo for range-aware backends.
 */
export function useDepotOpsOverview({
  date,
  dateFrom,
  dateTo,
  depotId,
  enabled = true,
}) {
  const canFetch = Boolean(enabled && date)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(canFetch)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestIdRef = useRef(0)
  const filterKeyRef = useRef(`${date || ''}|${dateFrom || ''}|${dateTo || ''}|${depotId || ''}`)

  const refetch = useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!canFetch) {
      setData(null)
      setIsLoading(false)
      setIsError(false)
      setError(null)
      return undefined
    }

    const filterKey = `${date || ''}|${dateFrom || ''}|${dateTo || ''}|${depotId || ''}`
    const filterChanged = filterKeyRef.current !== filterKey
    filterKeyRef.current = filterKey
    if (filterChanged) {
      setData(null)
    }

    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    // Keep previous snapshot on soft refetch so live WS rows don't flash away.
    setIsLoading(true)
    setIsError(false)
    setError(null)

    const params = { date }
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (depotId) params.depotId = depotId

    apiInstance
      .get('/command-center/depot-ops', {
        params,
        signal: controller.signal,
      })
      .then((res) => {
        if (requestId !== requestIdRef.current) return
        setData(res.data?.data?.depotOps || null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        setIsLoading(false)
        setIsError(true)
        setError(err)
      })

    return () => controller.abort()
  }, [canFetch, date, dateFrom, dateTo, depotId, reloadToken])

  return {
    data,
    isLoading: canFetch ? isLoading : false,
    isError,
    error,
    refetch,
    needsDepot: false,
    canFetch,
  }
}

export default useDepotOpsOverview
