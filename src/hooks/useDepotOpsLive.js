import { useCallback, useEffect, useRef, useState } from 'react'
import { buildCommandCenterLiveUrl } from '../utils/commandCenterLiveUrl'

const PING_MS = 25_000
const RECONNECT_MAX_MS = 15_000

/**
 * Command Center live WebSocket — connect, subscribe, ping, reconnect, cleanup.
 *
 * @param {object} opts
 * @param {string|null} [opts.depotId] Single-depot subscribe
 * @param {string[]|null} [opts.depotIds] All-depots multi-room subscribe
 * @param {string|null} opts.date
 * @param {string|null} [opts.dateFrom]
 * @param {string|null} [opts.dateTo]
 * @param {boolean} [opts.enabled]
 * @param {string|null} [opts.sinceEventId]
 * @param {(msg: object) => void} [opts.onMessage]
 * @param {(status: string) => void} [opts.onStatus]
 */
export function useDepotOpsLive({
  depotId = null,
  depotIds = null,
  date,
  dateFrom = null,
  dateTo = null,
  enabled = true,
  sinceEventId = null,
  onMessage,
  onStatus,
} = {}) {
  const [liveStatus, setLiveStatus] = useState('idle')
  const wsRef = useRef(null)
  const pingRef = useRef(null)
  const reconnectRef = useRef(null)
  const attemptRef = useRef(0)
  const intentionalCloseRef = useRef(false)
  const sinceRef = useRef(sinceEventId)
  const onMessageRef = useRef(onMessage)
  const onStatusRef = useRef(onStatus)

  const scopeKey = depotId
    ? `one:${depotId}`
    : Array.isArray(depotIds) && depotIds.length
      ? `many:${[...depotIds].sort().join(',')}`
      : ''

  useEffect(() => {
    sinceRef.current = sinceEventId
  }, [sinceEventId])

  useEffect(() => {
    onMessageRef.current = onMessage
  }, [onMessage])

  useEffect(() => {
    onStatusRef.current = onStatus
  }, [onStatus])

  const setStatus = useCallback((status) => {
    setLiveStatus(status)
    onStatusRef.current?.(status)
  }, [])

  const clearTimers = useCallback(() => {
    if (pingRef.current) {
      clearInterval(pingRef.current)
      pingRef.current = null
    }
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current)
      reconnectRef.current = null
    }
  }, [])

  const closeSocket = useCallback(() => {
    clearTimers()
    const ws = wsRef.current
    wsRef.current = null
    if (!ws) return
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'unsubscribe' }))
      }
    } catch {
      /* ignore */
    }
    try {
      ws.close()
    } catch {
      /* ignore */
    }
  }, [clearTimers])

  useEffect(() => {
    const canConnect = Boolean(enabled && date && scopeKey)
    if (!canConnect) {
      intentionalCloseRef.current = true
      closeSocket()
      attemptRef.current = 0
      setStatus('idle')
      return undefined
    }

    intentionalCloseRef.current = false
    let cancelled = false

    const scheduleReconnect = () => {
      if (cancelled || intentionalCloseRef.current) return
      clearTimers()
      const attempt = attemptRef.current
      const delay = Math.min(1000 * 2 ** attempt, RECONNECT_MAX_MS)
      attemptRef.current = attempt + 1
      setStatus('connecting')
      reconnectRef.current = setTimeout(() => {
        if (!cancelled && !intentionalCloseRef.current) connect()
      }, delay)
    }

    const connect = () => {
      if (cancelled || intentionalCloseRef.current) return

      const url = buildCommandCenterLiveUrl()
      if (!url) {
        setStatus('error')
        return
      }

      closeSocket()
      setStatus('connecting')

      let ws
      try {
        ws = new WebSocket(url)
      } catch {
        setStatus('error')
        scheduleReconnect()
        return
      }

      wsRef.current = ws

      ws.onopen = () => {
        if (cancelled || wsRef.current !== ws) return
        attemptRef.current = 0
        setStatus('connected')
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(JSON.stringify({ type: 'ping' }))
            } catch {
              /* ignore */
            }
          }
        }, PING_MS)
      }

      ws.onmessage = (event) => {
        if (cancelled || wsRef.current !== ws) return
        let msg
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }

        if (msg?.type === 'connected') {
          const payload = {
            type: 'subscribe',
            date,
          }
          if (dateFrom) payload.dateFrom = dateFrom
          if (dateTo) payload.dateTo = dateTo
          if (depotId) {
            payload.depotId = depotId
          } else if (Array.isArray(depotIds) && depotIds.length) {
            payload.depotIds = depotIds
          }
          if (sinceRef.current) {
            payload.sinceEventId = sinceRef.current
          }
          try {
            ws.send(JSON.stringify(payload))
          } catch {
            /* ignore */
          }
          return
        }

        if (msg?.type === 'subscribed') {
          setStatus('subscribed')
          return
        }

        if (msg?.type === 'pong') return

        onMessageRef.current?.(msg)
      }

      ws.onerror = () => {
        if (cancelled || wsRef.current !== ws) return
        setStatus('error')
      }

      ws.onclose = () => {
        if (wsRef.current === ws) {
          wsRef.current = null
        }
        clearTimers()
        if (cancelled || intentionalCloseRef.current) {
          setStatus('idle')
          return
        }
        scheduleReconnect()
      }
    }

    connect()

    return () => {
      cancelled = true
      intentionalCloseRef.current = true
      closeSocket()
      setStatus('idle')
    }
    // scopeKey already encodes depotId / depotIds identity — do not depend on
    // depotIds array identity or the socket reconnects every REST refetch.
  }, [enabled, scopeKey, date, dateFrom, dateTo, closeSocket, clearTimers, setStatus])

  return { liveStatus }
}

export default useDepotOpsLive
