import { useCallback, useEffect, useRef } from 'react'

const metrics = {
  viewportFetchMs: [],
  viewport304Count: 0,
  viewport200Count: 0,
  moveEndToPaintMs: [],
  vehiclePollCommits: 0,
  markerCount: 0,
}

function pushBounded(arr, value, max = 50) {
  arr.push(value)
  if (arr.length > max) arr.shift()
}

function avg(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Dev-only Command Center map performance instrumentation.
 */
export function useMapInstrumentation() {
  const moveEndStartedAt = useRef(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return undefined

    window.__MAP_METRICS__ = {
      getSnapshot: () => ({
        viewportFetchMsAvg: avg(metrics.viewportFetchMs),
        viewport304Rate:
          metrics.viewport304Count /
            Math.max(1, metrics.viewport304Count + metrics.viewport200Count) || 0,
        moveEndToPaintMsAvg: avg(metrics.moveEndToPaintMs),
        vehiclePollCommits: metrics.vehiclePollCommits,
        markerCount: metrics.markerCount,
      }),
      reset: () => {
        metrics.viewportFetchMs.length = 0
        metrics.viewport304Count = 0
        metrics.viewport200Count = 0
        metrics.moveEndToPaintMs.length = 0
        metrics.vehiclePollCommits = 0
        metrics.markerCount = 0
      },
    }

    return () => {
      delete window.__MAP_METRICS__
    }
  }, [])

  const recordViewportFetch = useCallback((durationMs, status) => {
    if (!import.meta.env.DEV) return
    pushBounded(metrics.viewportFetchMs, durationMs)
    if (status === 304) metrics.viewport304Count += 1
    if (status === 200) metrics.viewport200Count += 1
  }, [])

  const recordMoveEndStart = useCallback(() => {
    if (!import.meta.env.DEV) return
    moveEndStartedAt.current = performance.now()
  }, [])

  const recordMarkersPainted = useCallback((count) => {
    if (!import.meta.env.DEV) return
    metrics.markerCount = count
    if (moveEndStartedAt.current != null) {
      pushBounded(metrics.moveEndToPaintMs, performance.now() - moveEndStartedAt.current)
      moveEndStartedAt.current = null
    }
  }, [])

  const recordVehiclePollCommit = useCallback(() => {
    if (!import.meta.env.DEV) return
    metrics.vehiclePollCommits += 1
  }, [])

  return {
    recordViewportFetch,
    recordMoveEndStart,
    recordMarkersPainted,
    recordVehiclePollCommit,
  }
}
