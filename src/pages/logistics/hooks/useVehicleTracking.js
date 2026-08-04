import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../../../api/axiosInstance'
import { isLayerVisible } from '../../../components/map/mapLayerVisibility'
import { hasGpsCoordinates } from '../../../components/LocationMap'
import { emitMapEvent, MAP_EVENTS } from '../../../components/map/engine/mapEventBus'
import {
  mergeVehiclePositionDeltas,
  trackedVehiclesChanged,
  VEHICLE_POSITION_POLL_MS,
  gpsTrailPointsNear,
} from './mapUtils'
import { capTrailRing } from './useSmoothVehicleTrail'

export const VEHICLE_TRAIL_POLL_MS = VEHICLE_POSITION_POLL_MS
const TRAIL_HISTORY_HOURS = 6

function appendTrailPoint(setVehicleTrail, lat, lng) {
  const point = [Number(lat), Number(lng)]
  if (!hasGpsCoordinates(point[0], point[1])) return

  setVehicleTrail((prev) => {
    const last = prev?.[prev.length - 1]
    if (last && gpsTrailPointsNear(last, point)) return prev
    return capTrailRing([...(prev || []), point])
  })
}

function syncTrailFromTrackedRow(trailVehicleIdRef, setVehicleTrail, row) {
  if (!row?.id || row.id !== trailVehicleIdRef.current) return
  const { lat, lng } = row.position || {}
  if (lat == null || lng == null) return
  appendTrailPoint(setVehicleTrail, lat, lng)
}

export function useVehicleTracking({
  mapLayerVisibility,
  isLoading,
  selectedVehicleId = null,
  onTrailLoaded,
  recordVehiclePollCommit,
}) {
  const [trackedVehicles, setTrackedVehicles] = useState([])
  const [vehicleTrail, setVehicleTrail] = useState([])
  const [followVehicleId, setFollowVehicleId] = useState(null)
  const trailVehicleId = selectedVehicleId || followVehicleId || null
  const trackedVehiclesRef = useRef([])
  const lastPositionSyncAtRef = useRef(null)
  const lastTrailSyncAtRef = useRef(null)
  const positionPollRef = useRef(null)
  const sseAbortRef = useRef(null)
  const trailPollRef = useRef(null)
  const trailVehicleIdRef = useRef(null)

  const fetchVehiclePositions = useCallback(async () => {
    try {
      const params = {}
      if (lastPositionSyncAtRef.current) {
        params.since = lastPositionSyncAtRef.current
      }

      const res = await apiInstance.get('/logistics/vehicles/positions', { params })
      const next = res.data?.data?.positions || []

      if (params.since) {
        if (!next.length) return
        const merged = mergeVehiclePositionDeltas(trackedVehiclesRef.current, next)
        trackedVehiclesRef.current = merged
        setTrackedVehicles(merged)
        emitMapEvent(MAP_EVENTS.VEHICLE_POSITION, { positions: next, merged })
        recordVehiclePollCommit?.()
        for (const row of next) {
          syncTrailFromTrackedRow(trailVehicleIdRef, setVehicleTrail, row)
        }
      } else {
        if (!trackedVehiclesChanged(trackedVehiclesRef.current, next)) return
        trackedVehiclesRef.current = next
        setTrackedVehicles(next)
        emitMapEvent(MAP_EVENTS.VEHICLE_POSITION, { positions: next, merged: next })
        recordVehiclePollCommit?.()
      }

      lastPositionSyncAtRef.current = new Date().toISOString()
    } catch (err) {
      console.warn('[useVehicleTracking] vehicle positions fetch failed:', err?.message || err)
    }
  }, [recordVehiclePollCommit])

  const mergeViewportVehiclePins = useCallback((positionById) => {
    if (!positionById || !Object.keys(positionById).length) return

    const deltas = Object.entries(positionById).map(([id, position]) => ({
      id,
      position,
      has_live_gps: true,
    }))
    const merged = mergeVehiclePositionDeltas(trackedVehiclesRef.current, deltas)
    trackedVehiclesRef.current = merged
    setTrackedVehicles(merged)
    emitMapEvent(MAP_EVENTS.VEHICLE_POSITION, { positions: deltas, merged })
    for (const row of deltas) {
      syncTrailFromTrackedRow(trailVehicleIdRef, setVehicleTrail, row)
    }
  }, [])

  const fetchVehicleTrail = useCallback(
    async (vehicleId, { signal, incremental = false } = {}) => {
      if (!vehicleId) return

      try {
        if (incremental && lastTrailSyncAtRef.current && trailVehicleIdRef.current === vehicleId) {
          const historyRes = await apiInstance.get(
            `/logistics/vehicles/${vehicleId}/positions/history`,
            {
              params: { since: lastTrailSyncAtRef.current, maxPoints: 200, sort: 'asc' },
              signal,
            },
          )

          if (signal?.aborted) return

          const history = historyRes.data?.data?.history || []
          if (!history.length) return

          const newPoints = history
            .filter((point) => hasGpsCoordinates(point.lat, point.lng))
            .map((point) => [Number(point.lat), Number(point.lng)])

          if (newPoints.length) {
            setVehicleTrail((prev) => capTrailRing([...(prev || []), ...newPoints]))
            const last = history[history.length - 1]?.gps_time
            if (last) lastTrailSyncAtRef.current = last
          }
          return
        }

        const from = new Date(Date.now() - TRAIL_HISTORY_HOURS * 60 * 60 * 1000).toISOString()
        const [historyRes, tripsRes] = await Promise.all([
          apiInstance.get(`/logistics/vehicles/${vehicleId}/positions/history`, {
            params: { limit: 300, from, sort: 'asc' },
            signal,
          }),
          apiInstance.get(`/logistics/vehicles/${vehicleId}/trips`, {
            params: { limit: 5 },
            signal,
          }),
        ])

        if (signal?.aborted) return

        const history = historyRes.data?.data?.history || []
        const trips = tripsRes.data?.data?.trips || []
        const positions = history
          .filter((point) => hasGpsCoordinates(point.lat, point.lng))
          .map((point) => [Number(point.lat), Number(point.lng)])

        setVehicleTrail(capTrailRing(positions))
        trailVehicleIdRef.current = vehicleId
        lastTrailSyncAtRef.current = history[history.length - 1]?.gps_time || null

        const first = history[0]?.gps_time
        const last = history[history.length - 1]?.gps_time
        onTrailLoaded?.({
          vehicleId,
          trips,
          trailMeta: { pointCount: history.length, from: first, to: last },
        })
      } catch (err) {
        if (err.name === 'CanceledError' || signal?.aborted) return
        console.warn('[useVehicleTracking] vehicle trail fetch failed:', err?.message || err)
        setVehicleTrail([])
        lastTrailSyncAtRef.current = null
      }
    },
    [onTrailLoaded],
  )

  useEffect(() => {
    const showVehicles = isLayerVisible(mapLayerVisibility, 'vehicles')
    if (!showVehicles || isLoading) {
      if (positionPollRef.current) {
        clearInterval(positionPollRef.current)
        positionPollRef.current = null
      }
      if (sseAbortRef.current) {
        sseAbortRef.current.abort()
        sseAbortRef.current = null
      }
      return undefined
    }

    // Cleanup any previous stream/poll.
    if (positionPollRef.current) {
      clearInterval(positionPollRef.current)
      positionPollRef.current = null
    }
    if (sseAbortRef.current) {
      sseAbortRef.current.abort()
      sseAbortRef.current = null
    }

    let cancelled = false

    const run = async () => {
      lastPositionSyncAtRef.current = null
      await fetchVehiclePositions() // initial full sync

      if (cancelled) return

      // Fallback polling until SSE connects (or if it fails).
      positionPollRef.current = setInterval(fetchVehiclePositions, VEHICLE_POSITION_POLL_MS)

      const token = localStorage.getItem('token') || localStorage.getItem('authToken')
      if (!token) return

      const controller = new AbortController()
      sseAbortRef.current = controller

      const streamBase = apiInstance.defaults.baseURL || ''
      const streamUrl = `${streamBase}/logistics/map/stream/positions`
      const url = new URL(streamUrl, window.location.origin)
      if (lastPositionSyncAtRef.current) {
        url.searchParams.set('since', lastPositionSyncAtRef.current)
      }

      let buffer = ''
      const decoder = new TextDecoder('utf-8')
      let sseConnected = false

      try {
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!res.ok) {
          throw new Error(`SSE fetch failed with status ${res.status}`)
        }
        if (!res.body) {
          throw new Error('SSE response has no body')
        }

        const reader = res.body.getReader()

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            const lines = part
              .split('\n')
              .map((l) => l.trim())
              .filter(Boolean)

            let event = null
            let dataLine = null
            for (const line of lines) {
              if (line.startsWith('event:')) event = line.slice('event:'.length).trim()
              if (line.startsWith('data:')) {
                const payload = line.slice('data:'.length).trim()
                dataLine = dataLine ? `${dataLine}\n${payload}` : payload
              }
            }

            if (!event) continue

            if (event === 'connected') {
              sseConnected = true
              if (positionPollRef.current) {
                clearInterval(positionPollRef.current)
                positionPollRef.current = null
              }
              continue
            }

            if (event !== 'positions') continue
            if (!dataLine) continue

            let payload = null
            try {
              payload = JSON.parse(dataLine)
            } catch {
              continue
            }

            const next = payload?.positions || []
            if (!next.length) continue

            const merged = mergeVehiclePositionDeltas(trackedVehiclesRef.current, next)
            trackedVehiclesRef.current = merged
            setTrackedVehicles(merged)
            emitMapEvent(MAP_EVENTS.VEHICLE_POSITION, { positions: next, merged })
            recordVehiclePollCommit?.()
            for (const row of next) {
              syncTrailFromTrackedRow(trailVehicleIdRef, setVehicleTrail, row)
            }

            if (payload?.since) lastPositionSyncAtRef.current = payload.since
          }
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted) return

        if (!sseConnected) {
          console.warn('[useVehicleTracking] SSE stream failed early, keeping polling:', err?.message || err)
          return
        }

        console.warn('[useVehicleTracking] SSE stream failed, switching back to polling:', err?.message || err)
        if (!positionPollRef.current) {
          positionPollRef.current = setInterval(fetchVehiclePositions, VEHICLE_POSITION_POLL_MS)
        }
      }
    }

    run()

    return () => {
      cancelled = true
      if (positionPollRef.current) {
        clearInterval(positionPollRef.current)
        positionPollRef.current = null
      }
      if (sseAbortRef.current) {
        sseAbortRef.current.abort()
        sseAbortRef.current = null
      }
    }
  }, [mapLayerVisibility, isLoading, fetchVehiclePositions])

  useEffect(() => {
    const showVehicles = isLayerVisible(mapLayerVisibility, 'vehicles')

    if (trailPollRef.current) {
      clearInterval(trailPollRef.current)
      trailPollRef.current = null
    }

    if (!trailVehicleId || !showVehicles) {
      setVehicleTrail([])
      lastTrailSyncAtRef.current = null
      trailVehicleIdRef.current = null
      return undefined
    }

    if (trailVehicleIdRef.current !== trailVehicleId) {
      setVehicleTrail([])
      lastTrailSyncAtRef.current = null
      trailVehicleIdRef.current = trailVehicleId
    }

    const controller = new AbortController()
    const load = () => {
      const incremental = Boolean(
        lastTrailSyncAtRef.current && trailVehicleIdRef.current === trailVehicleId,
      )
      return fetchVehicleTrail(trailVehicleId, {
        signal: controller.signal,
        incremental,
      })
    }

    fetchVehicleTrail(trailVehicleId, { signal: controller.signal, incremental: false })

    trailPollRef.current = setInterval(() => {
      load().catch((err) => {
        if (err.name !== 'CanceledError') {
          console.warn('[useVehicleTracking] trail poll failed:', err?.message || err)
        }
      })
    }, VEHICLE_TRAIL_POLL_MS)

    return () => {
      controller.abort()
      if (trailPollRef.current) {
        clearInterval(trailPollRef.current)
        trailPollRef.current = null
      }
    }
  }, [trailVehicleId, mapLayerVisibility, fetchVehicleTrail])

  return {
    trackedVehicles,
    vehicleTrail,
    setVehicleTrail,
    followVehicleId,
    setFollowVehicleId,
    fetchVehiclePositions,
    fetchVehicleTrail,
    mergeViewportVehiclePins,
  }
}
