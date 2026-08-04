import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../api/axiosInstance'

/**
 * Fetch warehouse-ops order rows for the Shipments tab (bucket filter optional).
 */
export function useWarehouseOpsOrders({
  date,
  dateFrom,
  dateTo,
  depotId,
  bucket = null,
  enabled = true,
}) {
  const canFetch = Boolean(enabled && date)
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(canFetch)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestIdRef = useRef(0)

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

    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    setIsLoading(true)
    setIsError(false)
    setError(null)

    const params = { date }
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (depotId) params.depotId = depotId
    if (bucket) params.bucket = bucket

    apiInstance
      .get('/command-center/warehouse-ops/orders', {
        params,
        signal: controller.signal,
      })
      .then((res) => {
        if (requestId !== requestIdRef.current) return
        setData(res.data?.data || null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || requestId !== requestIdRef.current) return
        setIsError(true)
        setError(err)
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [canFetch, date, dateFrom, dateTo, depotId, bucket, reloadToken])

  return {
    orders: data?.orders || [],
    count: data?.count ?? 0,
    isLoading,
    isError,
    error,
    refetch,
  }
}

export default useWarehouseOpsOrders
