import { useEffect, useMemo, useRef, useState } from 'react'
import { gpsTrailPointsNear, VEHICLE_POSITION_POLL_MS } from './mapUtils'

export const TRAIL_RING_MAX_POINTS = 600
const INTERPOLATION_DURATION_MS = VEHICLE_POSITION_POLL_MS

export function capTrailRing(points, max = TRAIL_RING_MAX_POINTS) {
  if (!Array.isArray(points) || points.length <= max) return points || []
  return points.slice(points.length - max)
}

function interpolatePoint(from, to, t) {
  return [
    from[0] + (to[0] - from[0]) * t,
    from[1] + (to[1] - from[1]) * t,
  ]
}

/**
 * Smooth trail tail — interpolates between GPS polls so the line grows continuously.
 */
export function useSmoothVehicleTrail(historyTrail, vehicleId, trackedVehicles) {
  const [animatedTail, setAnimatedTail] = useState(null)
  const rafRef = useRef(null)
  const animRef = useRef({ from: null, to: null, start: 0 })

  const baseTrail = useMemo(
    () => capTrailRing(Array.isArray(historyTrail) ? historyTrail : []),
    [historyTrail],
  )

  const livePoint = useMemo(() => {
    if (!vehicleId) return null
    const tracked = (trackedVehicles || []).find((row) => row.id === vehicleId)
    const live = tracked?.position
    if (live?.lat == null || live?.lng == null) return null
    return [Number(live.lat), Number(live.lng)]
  }, [vehicleId, trackedVehicles])

  useEffect(() => {
    if (!livePoint) {
      setAnimatedTail(null)
      return undefined
    }

    const prev = animRef.current.to || baseTrail[baseTrail.length - 1] || livePoint
    if (gpsTrailPointsNear(prev, livePoint)) {
      setAnimatedTail(livePoint)
      return undefined
    }

    animRef.current = { from: prev, to: livePoint, start: performance.now() }

    const tick = (now) => {
      const { from, to, start } = animRef.current
      if (!from || !to) return
      const elapsed = now - start
      const t = Math.min(1, elapsed / INTERPOLATION_DURATION_MS)
      setAnimatedTail(interpolatePoint(from, to, t))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [livePoint, baseTrail])

  const displayTrail = useMemo(() => {
    if (!vehicleId) return []
    if (!baseTrail.length && !animatedTail) return livePoint ? [livePoint] : []
    if (!animatedTail) return baseTrail
    const last = baseTrail[baseTrail.length - 1]
    if (last && gpsTrailPointsNear(last, animatedTail)) return baseTrail
    return [...baseTrail, animatedTail]
  }, [baseTrail, animatedTail, livePoint, vehicleId])

  return displayTrail
}
