import { useCallback, useEffect, useRef, useState } from 'react'
import apiInstance from '../../../api/axiosInstance'
import { viewportLayersFromVisibility } from '../../../components/map/mapLayerVisibility'

export const USE_MAP_VIEWPORT_BUNDLE = true
const BBOX_DEBOUNCE_MS = 400
const PREFETCH_CACHE_MAX = 12
const MARKER_FADE_MS = 150

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

/** One viewport-width ring around the current bbox (for prefetch). */
export function ringBounds(bounds) {
  const latSpan = bounds.maxLat - bounds.minLat
  const lngSpan = bounds.maxLng - bounds.minLng
  return {
    minLat: bounds.minLat - latSpan,
    maxLat: bounds.maxLat + latSpan,
    minLng: bounds.minLng - lngSpan,
    maxLng: bounds.maxLng + lngSpan,
  }
}

function boundsCacheKey(bounds, layers) {
  return [
    bounds.minLat.toFixed(3),
    bounds.maxLat.toFixed(3),
    bounds.minLng.toFixed(3),
    bounds.maxLng.toFixed(3),
    layers,
  ].join('|')
}

function pinsToClients(pins) {
  return (pins || []).map((pin) => ({
    id: pin.id,
    client_name: pin.label,
    store_name: pin.label,
    gps_latitude: pin.lat,
    gps_longitude: pin.lng,
    sector_id: pin.sectorId,
    is_active: pin.isActive !== false,
    created_at: pin.createdAt || pin.created_at || null,
  }))
}

function pinsToVehiclePositions(pins) {
  const map = {}
  for (const pin of pins || []) {
    map[pin.id] = {
      lat: pin.lat,
      lng: pin.lng,
      speed: pin.speed,
      heading: pin.heading,
      synced_at: pin.syncedAt,
    }
  }
  return map
}

function layerListForVisibility(visibility) {
  return viewportLayersFromVisibility(visibility)
}

/**
 * Single viewport bundle fetch with ETag stale-while-revalidate + adjacent ring prefetch.
 */
export function useMapViewport({
  mapInstance,
  mapLayerVisibility,
  isLoading,
  setClients,
  onVehiclePins,
  recordViewportFetch,
  recordMoveEndStart,
  recordMarkersPainted,
  enabled = USE_MAP_VIEWPORT_BUNDLE,
}) {
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const prefetchAbortRef = useRef(null)
  const etagRef = useRef(null)
  const cacheRef = useRef(new Map())
  const [isViewportLoading, setIsViewportLoading] = useState(false)
  const [vehiclePins, setVehiclePins] = useState([])
  const [clusters, setClusters] = useState([])
  const [mapZoom, setMapZoom] = useState(12)
  const [viewportClustered, setViewportClustered] = useState(false)
  const [fadeInNonce, setFadeInNonce] = useState(0)

  const applyViewportData = useCallback(
    (data, { fadeIn = false } = {}) => {
      const layers = data?.layers || {}
      if (layers.clients) {
        setClients(pinsToClients(layers.clients))
      }
      if (layers.vehicles) {
        setVehiclePins(layers.vehicles)
        onVehiclePins?.(pinsToVehiclePositions(layers.vehicles), layers.vehicles)
      }
      if (layers.clusters) {
        setClusters(layers.clusters)
      } else {
        setClusters([])
      }
      setViewportClustered(Boolean(data?.meta?.clustered))
      if (fadeIn) setFadeInNonce((n) => n + 1)
      const count =
        (layers.clients?.length || 0) +
        (layers.vehicles?.length || 0) +
        (layers.depots?.length || 0) +
        (layers.clusters?.length || 0)
      recordMarkersPainted?.(count)
    },
    [setClients, onVehiclePins, recordMarkersPainted],
  )

  const fetchViewport = useCallback(
    (bounds, zoom, layersCsv, { signal, useEtag = true, applyResult = true, fadeIn = false } = {}) => {
      const headers = {}
      if (useEtag && etagRef.current) {
        headers['If-None-Match'] = etagRef.current
      }

      const started = performance.now()
      return apiInstance
        .get('/logistics/map/viewport', {
          params: { ...bounds, zoom, layers: layersCsv },
          headers,
          signal,
          validateStatus: (status) => status === 200 || status === 304,
        })
        .then((res) => {
          const duration = performance.now() - started
          recordViewportFetch?.(duration, res.status)

          if (res.status === 304) return { status: 304, data: null }

          const etag = res.headers?.etag
          if (etag && applyResult) etagRef.current = etag

          const payload = res.data?.data
          if (payload && applyResult) {
            applyViewportData(payload, { fadeIn })
          }

          return { status: 200, data: payload }
        })
    },
    [applyViewportData, recordViewportFetch],
  )

  const prefetchRing = useCallback(
    (centerBounds, zoom, layersCsv) => {
      if (!enabled) return

      if (prefetchAbortRef.current) prefetchAbortRef.current.abort()
      const controller = new AbortController()
      prefetchAbortRef.current = controller

      const ring = ringBounds(centerBounds)
      const key = boundsCacheKey(ring, layersCsv)

      if (cacheRef.current.has(key)) return

      fetchViewport(ring, zoom, layersCsv, {
        signal: controller.signal,
        useEtag: false,
        applyResult: false,
      })
        .then((result) => {
          if (controller.signal.aborted || !result?.data) return
          cacheRef.current.set(key, result.data)
          if (cacheRef.current.size > PREFETCH_CACHE_MAX) {
            const firstKey = cacheRef.current.keys().next().value
            cacheRef.current.delete(firstKey)
          }
        })
        .catch((err) => {
          if (err.name === 'CanceledError' || controller.signal.aborted) return
        })
    },
    [enabled, fetchViewport],
  )

  const loadViewport = useCallback(() => {
    if (!mapInstance || !enabled) return

    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const bounds = paddedBounds(mapInstance)
    const zoom = Math.round(mapInstance.getZoom())
    setMapZoom(zoom)
    const layers = layerListForVisibility(mapLayerVisibility)
    const layersCsv = layers.join(',')

    const cacheKey = boundsCacheKey(bounds, layersCsv)
    const cached = cacheRef.current.get(cacheKey)
    if (cached) {
      applyViewportData(cached, { fadeIn: true })
      cacheRef.current.delete(cacheKey)
    }

    setIsViewportLoading(true)

    fetchViewport(bounds, zoom, layersCsv, {
      signal: controller.signal,
      fadeIn: !cached,
    })
      .then(() => {
        if (!controller.signal.aborted) {
          prefetchRing(bounds, zoom, layersCsv)
        }
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        console.warn('[useMapViewport] fetch failed:', err?.message || err)
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsViewportLoading(false)
      })
  }, [mapInstance, enabled, mapLayerVisibility, applyViewportData, fetchViewport, prefetchRing])

  const scheduleLoad = useCallback(() => {
    recordMoveEndStart?.()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(loadViewport, BBOX_DEBOUNCE_MS)
  }, [loadViewport, recordMoveEndStart])

  useEffect(() => {
    if (!enabled) return undefined

    const layers = layerListForVisibility(mapLayerVisibility)
    const needsData = !isLoading && layers.length > 0

    if (!needsData || !mapInstance) return undefined

    loadViewport()

    const onMoveEnd = () => scheduleLoad()
    mapInstance.on('moveend', onMoveEnd)
    mapInstance.on('zoomend', onMoveEnd)

    return () => {
      mapInstance.off('moveend', onMoveEnd)
      mapInstance.off('zoomend', onMoveEnd)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (abortRef.current) abortRef.current.abort()
      if (prefetchAbortRef.current) prefetchAbortRef.current.abort()
    }
  }, [enabled, mapInstance, mapLayerVisibility, isLoading, loadViewport, scheduleLoad])

  return {
    isViewportLoading,
    vehiclePins,
    clusters,
    mapZoom,
    viewportClustered,
    reloadViewport: loadViewport,
    markerFadeInNonce: fadeInNonce,
    markerFadeMs: MARKER_FADE_MS,
  }
}
