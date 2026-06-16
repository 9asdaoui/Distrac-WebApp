import { useCallback, useEffect, useRef } from 'react'
import { MAP_FILTER_ALL } from '../../../components/map/MapLayerFilterBar'
import { fetchClientsInBounds } from './mapUtils'

const BBOX_DEBOUNCE_MS = 400

function paddedBounds(mapInstance) {
  const bounds = mapInstance.getBounds()
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  const padLat = (ne.lat - sw.lat) * 0.1
  const padLng = (ne.lng - sw.lng) * 0.1
  return {
    minLat: sw.lat - padLat,
    maxLat: ne.lat + padLat,
    minLng: sw.lng - padLng,
    maxLng: ne.lng + padLng,
  }
}

export function useMapClients({
  mapInstance,
  mapLayerFilter,
  isLoading,
  setClients,
  enabled = true,
}) {
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  const loadClientsForViewport = useCallback(() => {
    if (!enabled || !mapInstance) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const bounds = paddedBounds(mapInstance)
    fetchClientsInBounds(bounds, controller.signal)
      .then((list) => {
        if (!controller.signal.aborted) setClients(list)
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        console.warn('[useMapClients] bbox fetch failed:', err?.message || err)
      })
  }, [enabled, mapInstance, setClients])

  const scheduleLoad = useCallback(() => {
    if (!enabled) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(loadClientsForViewport, BBOX_DEBOUNCE_MS)
  }, [loadClientsForViewport])

  useEffect(() => {
    if (!enabled) return undefined

    const needsClients =
      !isLoading && (mapLayerFilter === MAP_FILTER_ALL || mapLayerFilter === 'clients')
    if (!needsClients || !mapInstance) return undefined

    loadClientsForViewport()

    const onMoveEnd = () => scheduleLoad()
    mapInstance.on('moveend', onMoveEnd)
    mapInstance.on('zoomend', onMoveEnd)

    return () => {
      mapInstance.off('moveend', onMoveEnd)
      mapInstance.off('zoomend', onMoveEnd)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [enabled, mapInstance, mapLayerFilter, isLoading, loadClientsForViewport, scheduleLoad])

  return { reloadClientsInView: loadClientsForViewport }
}
