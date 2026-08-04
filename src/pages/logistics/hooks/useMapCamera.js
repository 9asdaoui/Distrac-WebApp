import { useCallback, useEffect, useRef } from 'react'
import {
  MAP_FLY_DURATION,
  FOLLOW_EASE_DURATION,
  applyEntityFlyTarget,
  easeMapTo,
  flyToLatLng as cameraFlyToLatLng,
  resolveEntityFlyTarget,
} from '../../../components/map/engine/cameraController'

/** Default zoom when flying to a geocoded city. */
export const CITY_FLY_ZOOM = 12

/**
 * Command Center camera — eased fly-to on select, smooth follow pan.
 */
export function useMapCamera(mapInstance) {
  const programmaticMapMoveRef = useRef(false)
  const programmaticMapMoveTimerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (programmaticMapMoveTimerRef.current) {
        clearTimeout(programmaticMapMoveTimerRef.current)
      }
    }
  }, [])

  const guardProgrammaticMove = useCallback((durationMs = MAP_FLY_DURATION * 1000 + 250) => {
    programmaticMapMoveRef.current = true
    if (programmaticMapMoveTimerRef.current) {
      clearTimeout(programmaticMapMoveTimerRef.current)
    }
    programmaticMapMoveTimerRef.current = setTimeout(() => {
      programmaticMapMoveRef.current = false
    }, durationMs)
  }, [])

  const flyToEntity = useCallback(
    (payload, ctx) => {
      if (!mapInstance || !payload) return false
      const target = resolveEntityFlyTarget(payload, ctx)
      if (!target) return false
      guardProgrammaticMove()
      applyEntityFlyTarget(mapInstance, target)
      return true
    },
    [mapInstance, guardProgrammaticMove],
  )

  const flyToLatLng = useCallback(
    (lat, lng, zoom = CITY_FLY_ZOOM) => {
      if (!mapInstance || lat == null || lng == null) return false
      const latN = Number(lat)
      const lngN = Number(lng)
      if (!Number.isFinite(latN) || !Number.isFinite(lngN)) return false
      guardProgrammaticMove()
      cameraFlyToLatLng(mapInstance, [latN, lngN], zoom)
      return true
    },
    [mapInstance, guardProgrammaticMove],
  )

  const easeFollowTo = useCallback(
    (lat, lng) => {
      if (!mapInstance || lat == null || lng == null) return
      if (programmaticMapMoveRef.current) return
      guardProgrammaticMove(FOLLOW_EASE_DURATION * 1000 + 150)
      easeMapTo(mapInstance, [Number(lat), Number(lng)])
    },
    [mapInstance, guardProgrammaticMove],
  )

  return {
    flyToEntity,
    flyToLatLng,
    easeFollowTo,
    programmaticMapMoveRef,
    programmaticMapMoveTimerRef,
    guardProgrammaticMove,
  }
}
