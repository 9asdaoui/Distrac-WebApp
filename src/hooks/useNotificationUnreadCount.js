import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../api/axiosInstance'

export function useNotificationUnreadCount({
  enabled = true,
  initialCount = 0,
  liveSignal = null,
  /** Safety net when WS miss — poll while mounted (ms). 0 = off. */
  pollIntervalMs = 0,
} = {}) {
  const [count, setCount] = useState(Number(initialCount || 0))
  const [isLoading, setIsLoading] = useState(false)
  const firstLiveSignalRef = useRef(true)

  const refetch = useCallback(async () => {
    if (!enabled) return 0
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/notifications/unread-count')
      const next = Number(res.data?.data?.count || 0)
      setCount(next)
      return next
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    setCount(Number(initialCount || 0))
  }, [enabled, initialCount])

  useEffect(() => {
    if (!enabled) return undefined
    refetch().catch(() => {})
    return undefined
  }, [enabled, refetch])

  useEffect(() => {
    if (!enabled || liveSignal == null) return
    if (firstLiveSignalRef.current) {
      firstLiveSignalRef.current = false
      return
    }
    refetch().catch(() => {})
  }, [enabled, liveSignal, refetch])

  useEffect(() => {
    if (!enabled || !pollIntervalMs || pollIntervalMs < 1000) return undefined
    const id = window.setInterval(() => {
      refetch().catch(() => {})
    }, pollIntervalMs)
    return () => window.clearInterval(id)
  }, [enabled, pollIntervalMs, refetch])

  return {
    count,
    setCount,
    isLoading,
    refetch,
  }
}

export default useNotificationUnreadCount
