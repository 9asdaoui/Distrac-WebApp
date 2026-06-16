import L from 'leaflet'
import { hasGpsCoordinates } from '../../LocationMap'
import { parseSectorBoundary } from '../../SectorBoundaryPreview'
import { latLngPairsFromGeometry } from '../../SectorBoundaryDrawer'

function polygonRingsFromBoundary(boundary) {
  const geometry = parseSectorBoundary(boundary)
  if (!geometry) return []

  if (geometry.type === 'Polygon') {
    const pairs = latLngPairsFromGeometry(geometry)
    if (pairs.length < 3) return []
    return [pairs.map(([lat, lng]) => [lat, lng])]
  }

  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || [])
      .map((polygonCoords) => {
        const ring = polygonCoords?.[0] || []
        if (ring.length < 4) return null
        const positions = ring.slice(0, -1).map(([lng, lat]) => [lat, lng])
        return positions.length >= 3 ? positions : null
      })
      .filter(Boolean)
  }

  return []
}

export const MAP_FLY_DURATION = 1.85
export const MAP_FLY_OPTIONS = {
  duration: MAP_FLY_DURATION,
  easeLinearity: 0.38,
}
export const ENTITY_FOCUS_ZOOM = 14
export const VEHICLE_FOLLOW_ZOOM = 15
export const FOLLOW_EASE_DURATION = 0.9

export function flyToLatLng(map, latLng, zoom, options = {}) {
  if (!map || !latLng) return
  map.flyTo(latLng, zoom ?? map.getZoom(), { ...MAP_FLY_OPTIONS, ...options })
}

export function flyToBoundsPoints(map, points, options = {}) {
  if (!map || !points?.length) return
  map.flyToBounds(L.latLngBounds(points), {
    ...MAP_FLY_OPTIONS,
    padding: [40, 40],
    ...options,
  })
}

/** Smooth camera move for follow mode — same zoom, eased pan. */
export function easeMapTo(map, latLng, options = {}) {
  if (!map || !latLng) return
  const duration = options.duration ?? FOLLOW_EASE_DURATION
  map.flyTo(latLng, options.zoom ?? map.getZoom(), {
    duration,
    easeLinearity: options.easeLinearity ?? 0.22,
  })
}

/**
 * Resolve camera target for a map entity selection.
 * Returns { kind: 'bounds' | 'latlng', points?, latLng?, zoom? } or null.
 */
export function resolveEntityFlyTarget(payload, ctx) {
  if (!payload?.type || !payload?.id) return null

  const { regions, sectors, industries, depots, clients, vehicles, vehiclePositionById, buildVehicleMarkers } =
    ctx

  if (payload.type === 'region') {
    const region = regions?.find((r) => r.id === payload.id)
    if (!region?.boundary) return null
    const points = polygonRingsFromBoundary(region.boundary).flat()
    return points.length ? { kind: 'bounds', points, padding: [40, 40] } : null
  }

  if (payload.type === 'sector') {
    const sector = sectors?.find((s) => s.id === payload.id)
    if (!sector?.boundary) return null
    const points = polygonRingsFromBoundary(sector.boundary).flat()
    return points.length ? { kind: 'bounds', points, padding: [48, 48] } : null
  }

  if (payload.type === 'vehicle') {
    const marker = buildVehicleMarkers?.(vehicles, depots, vehiclePositionById)?.find(
      (item) => item.id === payload.id,
    )
    if (!marker?.position) return null
    return { kind: 'latlng', latLng: marker.position, zoom: VEHICLE_FOLLOW_ZOOM }
  }

  if (['industry', 'depot', 'client'].includes(payload.type)) {
    const collections = { industry: industries, depot: depots, client: clients }
    const row = (collections[payload.type] || []).find((item) => item.id === payload.id)
    const lat = row?.gps_latitude
    const lng = row?.gps_longitude
    if (!hasGpsCoordinates(lat, lng)) return null
    return { kind: 'latlng', latLng: [Number(lat), Number(lng)], zoom: ENTITY_FOCUS_ZOOM }
  }

  return null
}

export function applyEntityFlyTarget(map, target, options = {}) {
  if (!map || !target) return
  if (target.kind === 'bounds') {
    flyToBoundsPoints(map, target.points, { padding: target.padding, ...options })
    return
  }
  if (target.kind === 'latlng') {
    flyToLatLng(map, target.latLng, target.zoom, options)
  }
}
