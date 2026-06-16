import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../../../api/axiosInstance'
import { MAP_FILTER_ALL } from '../../../components/map/MapLayerFilterBar'

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

export function useMissionOverlay({ enabled, mapBbox = null }) {
  const [missionRoutes, setMissionRoutes] = useState([])
  const lastSyncAtRef = useRef(null)
  const pollRef = useRef(null)

  const fetchOverlay = useCallback(
    async ({ signal, incremental = false } = {}) => {
      const params = {}
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
    [mapBbox],
  )

  useEffect(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }

    if (!enabled) {
      setMissionRoutes([])
      lastSyncAtRef.current = null
      return undefined
    }

    const controller = new AbortController()
    lastSyncAtRef.current = null

    fetchOverlay({ signal: controller.signal, incremental: false }).catch((err) => {
      if (err.name === 'CanceledError' || controller.signal.aborted) return
      console.warn('[useMissionOverlay] fetch failed:', err?.message || err)
    })

    pollRef.current = setInterval(() => {
      fetchOverlay({ incremental: true }).catch((err) => {
        console.warn('[useMissionOverlay] poll failed:', err?.message || err)
      })
    }, MISSION_OVERLAY_POLL_MS)

    return () => {
      controller.abort()
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [enabled, fetchOverlay])

  const reloadMissionOverlay = useCallback(() => {
    lastSyncAtRef.current = null
    return fetchOverlay({ incremental: false })
  }, [fetchOverlay])

  return { missionRoutes, reloadMissionOverlay }
}

export function isMissionOverlayEnabled(mapLayerFilter) {
  return mapLayerFilter === MAP_FILTER_ALL || mapLayerFilter === 'vehicles'
}
