import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../api/axiosInstance'

/**
 * @param {object} opts
 * @param {boolean} [opts.enabled]
 * @param {number} [opts.limit]
 * @param {number} [opts.offset]
 * @param {number|string|null} [opts.liveSignal] When this changes (e.g. WS notificationRevision), refetch.
 * @param {number} [opts.pollIntervalMs] Safety-net poll while enabled (0 = off).
 */
export function useNotifications({
  enabled = true,
  limit = 20,
  offset = 0,
  liveSignal = null,
  pollIntervalMs = 0,
} = {}) {
  const [notifications, setNotifications] = useState([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)
  const requestIdRef = useRef(0)
  const hasLoadedRef = useRef(false)
  const firstLiveSignalRef = useRef(true)

  const refetch = useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  useEffect(() => {
    if (!enabled || liveSignal == null) return
    if (firstLiveSignalRef.current) {
      firstLiveSignalRef.current = false
      return
    }
    refetch()
  }, [enabled, liveSignal, refetch])

  useEffect(() => {
    if (!enabled || !pollIntervalMs || pollIntervalMs < 1000) return undefined
    const id = window.setInterval(() => {
      refetch()
    }, pollIntervalMs)
    return () => window.clearInterval(id)
  }, [enabled, pollIntervalMs, refetch])

  useEffect(() => {
    if (!enabled) return undefined

    const controller = new AbortController()
    const requestId = ++requestIdRef.current
    const soft = hasLoadedRef.current
    if (!soft) setIsLoading(true)
    setIsError(false)
    setError(null)

    apiInstance
      .get('/notifications', {
        params: { limit, offset },
        signal: controller.signal,
      })
      .then((res) => {
        if (requestId !== requestIdRef.current) return
        setNotifications(res.data?.data?.notifications || [])
        hasLoadedRef.current = true
        setIsLoading(false)
      })
      .catch((err) => {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        setNotifications([])
        setIsLoading(false)
        setIsError(true)
        setError(err)
      })

    return () => controller.abort()
  }, [enabled, limit, offset, reloadToken])

  const markRead = useCallback(async (notificationId) => {
    if (!notificationId) return false
    await apiInstance.patch(`/notifications/${notificationId}/read`)
    setNotifications((current) =>
      current.map((row) => (String(row.id) === String(notificationId) ? { ...row, isRead: true } : row)),
    )
    return true
  }, [])

  const markAllRead = useCallback(async () => {
    await apiInstance.patch('/notifications/read-all')
    setNotifications((current) => current.map((row) => ({ ...row, isRead: true })))
    return true
  }, [])

  return {
    notifications,
    setNotifications,
    isLoading,
    isError,
    error,
    refetch,
    markRead,
    markAllRead,
  }
}

export default useNotifications
