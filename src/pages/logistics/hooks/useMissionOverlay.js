import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../../../api/axiosInstance'
import { isLayerVisible } from '../../../components/map/mapLayerVisibility'

const MISSION_OVERLAY_POLL_MS = 60_000

function routeKey(route) {
  return route?.mission_id || ''
}

function mergeMissionRoutes(prev, incoming) {
  if (!incoming?.length) return prev || []
  const byId = new Map((prev || []).map((row) => [routeKey(row), row]))
  for (const row of incoming) {
    byId.set(routeKey(row), row)
  }
  return [...byId.values()]
}

/**
 * @param {{
 *   enabled: boolean,
 *   mapBbox?: object|null,
 *   date?: string|null,
 *   depotId?: string|null,
 *   status?: string|null,
 * }} opts
 */
export function useMissionOverlay({
  enabled,
  mapBbox = null,
  date = null,
  depotId = null,
  status = null,
}) {
  const [missionRoutes, setMissionRoutes] = useState([])
  const lastSyncAtRef = useRef(null)
  const pollRef = useRef(null)
  const filterKey = `${date || ''}|${depotId || ''}|${status || ''}`

  const fetchOverlay = useCallback(
    async ({ signal, incremental = false } = {}) => {
      const params = {}
      if (date) params.date = date
      if (depotId) params.depotId = depotId
      if (status) params.status = status
      if (mapBbox) {
        params.minLat = mapBbox.minLat
        params.maxLat = mapBbox.maxLat
        params.minLng = mapBbox.minLng
        params.maxLng = mapBbox.maxLng
      }
      if (incremental && lastSyncAtRef.current) {
        params.since = lastSyncAtRef.current
      }

      const res = await apiInstance.get('/missions/map-overlay', { params, signal })
      const payload = res.data?.data || {}
      const routes = payload.routes || []

      if (payload.since) lastSyncAtRef.current = payload.since

      if (incremental && routes.length) {
        setMissionRoutes((prev) => mergeMissionRoutes(prev, routes))
      } else if (!incremental) {
        setMissionRoutes(routes)
      }
    },
    [mapBbox, date, depotId, status],
  )

  useEffect(() => {
    lastSyncAtRef.current = null
  }, [filterKey])

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }

    if (!enabled) {
      setMissionRoutes([])
      return undefined
    }

    const controller = new AbortController()
    fetchOverlay({ signal: controller.signal, incremental: false }).catch(() => {})

    pollRef.current = setInterval(() => {
      fetchOverlay({ incremental: true }).catch(() => {})
    }, MISSION_OVERLAY_POLL_MS)

    return () => {
      controller.abort()
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [enabled, fetchOverlay, filterKey])

  const reloadMissionOverlay = useCallback(() => {
    lastSyncAtRef.current = null
    return fetchOverlay({ incremental: false })
  }, [fetchOverlay])

  return { missionRoutes, reloadMissionOverlay }
}

export function isMissionOverlayEnabled(mapLayerVisibility) {
  return isLayerVisible(mapLayerVisibility, 'vehicles')
}
