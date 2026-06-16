import { useCallback, useEffect, useRef } from 'react'
import apiInstance from '../../../api/axiosInstance'

const BBOX_DEBOUNCE_MS = 450

function paddedBounds(mapInstance) {
  const bounds = mapInstance.getBounds()
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  const padLat = (ne.lat - sw.lat) * 0.08
  const padLng = (ne.lng - sw.lng) * 0.08
  return {
    minLat: sw.lat - padLat,
    maxLat: ne.lat + padLat,
    minLng: sw.lng - padLng,
    maxLng: ne.lng + padLng,
  }
}

/**
 * Fetch simplified region/sector boundaries for the current viewport.
 */
export function useMapBoundaries({
  mapInstance,
  isLoading,
  setRegions,
  setSectors,
  enabled = true,
}) {
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  const loadBoundaries = useCallback(() => {
    if (!mapInstance || !enabled || isLoading) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const bounds = paddedBounds(mapInstance)
    const zoom = mapInstance.getZoom()
    const params = { ...bounds, zoom }

    Promise.all([
      apiInstance.get('/regions', { params, signal: controller.signal }),
      apiInstance.get('/sectors', { params, signal: controller.signal }),
    ])
      .then(([regionsRes, sectorsRes]) => {
        if (controller.signal.aborted) return
        const regions = regionsRes.data?.data?.regions
        const sectors = sectorsRes.data?.data?.sectors
        if (Array.isArray(regions)) setRegions(regions)
        if (Array.isArray(sectors)) setSectors(sectors)
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        console.warn('[useMapBoundaries] fetch failed:', err?.message || err)
      })
  }, [mapInstance, enabled, isLoading, setRegions, setSectors])

  const scheduleLoad = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(loadBoundaries, BBOX_DEBOUNCE_MS)
  }, [loadBoundaries])

  useEffect(() => {
    if (!enabled || !mapInstance || isLoading) return undefined

    loadBoundaries()

    const onMoveEnd = () => scheduleLoad()
    mapInstance.on('moveend', onMoveEnd)
    mapInstance.on('zoomend', onMoveEnd)

    return () => {
      mapInstance.off('moveend', onMoveEnd)
      mapInstance.off('zoomend', onMoveEnd)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [enabled, mapInstance, isLoading, loadBoundaries, scheduleLoad])
}
