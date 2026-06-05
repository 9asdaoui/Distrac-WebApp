import difference from '@turf/difference'
import area from '@turf/area'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point, polygon } from '@turf/helpers'

/** Points on a shared boundary are allowed; only strict interior is blocked. */
const INTERIOR_CHECK_OPTIONS = { ignoreBoundary: true }

export function parseRegionBoundary(boundary) {
  if (!boundary) return null

  if (typeof boundary === 'string') {
    try {
      const parsed = JSON.parse(boundary)
      if (parsed?.type === 'Polygon') return parsed
      if (parsed?.geometry?.type === 'Polygon') return parsed.geometry
      if (parsed?.type === 'MultiPolygon') return parsed
      return null
    } catch {
      return null
    }
  }

  if (boundary.type === 'Polygon') return boundary
  if (boundary.geometry?.type === 'Polygon') return boundary.geometry
  return null
}

function featureFromPolygonGeometry(geom) {
  if (!geom?.coordinates?.length) return null
  try {
    return polygon(geom.coordinates)
  } catch {
    return null
  }
}

function largestPolygonFromGeometry(geometry) {
  if (!geometry) return null
  if (geometry.type === 'Polygon') return geometry

  if (geometry.type === 'MultiPolygon') {
    let best = null
    let bestArea = 0
    for (const coords of geometry.coordinates || []) {
      const candidate = { type: 'Polygon', coordinates: coords }
      try {
        const a = area(polygon(coords))
        if (a > bestArea) {
          bestArea = a
          best = candidate
        }
      } catch {
        // skip invalid ring
      }
    }
    return best
  }

  return null
}

/**
 * Subtract existing region polygons from the drawn polygon so the result
 * only covers area not already assigned to another region.
 */
export function clipPolygonAgainstRegions(drawnGeometry, existingGeometries = []) {
  if (!drawnGeometry || drawnGeometry.type !== 'Polygon') return null

  let current = featureFromPolygonGeometry(drawnGeometry)
  if (!current) return null

  for (const existing of existingGeometries) {
    const geom = typeof existing === 'object' && existing?.type === 'Polygon' ? existing : parseRegionBoundary(existing)
    if (!geom) continue

    const blocker = featureFromPolygonGeometry(geom)
    if (!blocker) continue

    try {
      const result = difference(current, blocker)
      if (!result) return null

      const geometry = result.geometry || result
      const normalized = largestPolygonFromGeometry(geometry)
      if (!normalized) return null

      current = featureFromPolygonGeometry(normalized)
      if (!current) return null
    } catch {
      // If turf cannot compute difference for a pair, keep current shape
    }
  }

  const finalGeometry = current.geometry || current
  return largestPolygonFromGeometry(finalGeometry)
}

export function geometriesOverlap(drawnGeometry, existingGeometries = []) {
  const clipped = clipPolygonAgainstRegions(drawnGeometry, existingGeometries)
  if (!clipped) return true
  try {
    const originalArea = area(featureFromPolygonGeometry(drawnGeometry))
    const clippedArea = area(featureFromPolygonGeometry(clipped))
    return clippedArea < originalArea * 0.995
  } catch {
    return false
  }
}

function normalizeExistingGeometry(existing) {
  if (typeof existing === 'object' && existing?.type === 'Polygon') return existing
  return parseRegionBoundary(existing)
}

/** True when [lat,lng] lies strictly inside any existing region (not on its edge). */
export function isLatLngInsideRegionInterior(lat, lng, existingGeometries = []) {
  const pt = point([Number(lng), Number(lat)])

  for (const existing of existingGeometries) {
    const geom = normalizeExistingGeometry(existing)
    if (!geom) continue

    const feat = featureFromPolygonGeometry(geom)
    if (!feat) continue

    try {
      if (booleanPointInPolygon(pt, feat, INTERIOR_CHECK_OPTIONS)) {
        return true
      }
    } catch {
      /* skip invalid geometry */
    }
  }

  return false
}

function closestPointOnSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) {
    return { x: x1, y: y1 }
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
  t = Math.max(0, Math.min(1, t))
  return { x: x1 + t * dx, y: y1 + t * dy }
}

/** Nearest point on a GeoJSON ring ([lng,lat] pairs) to the given lat/lng. */
function closestPointOnRing(lat, lng, ring) {
  const px = Number(lng)
  const py = Number(lat)
  let bestLat = py
  let bestLng = px
  let bestDist = Infinity

  const limit = Math.max(0, (ring?.length || 0) - 1)
  for (let i = 0; i < limit; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[i + 1]
    const projected = closestPointOnSegment(px, py, x1, y1, x2, y2)
    const dist = (px - projected.x) ** 2 + (py - projected.y) ** 2
    if (dist < bestDist) {
      bestDist = dist
      bestLng = projected.x
      bestLat = projected.y
    }
  }

  return [bestLat, bestLng]
}

/**
 * Resolve a click/hover position for region drawing.
 * Open-area clicks stay put; interior clicks snap to the nearest point on that region's boundary.
 */
export function resolveRegionPlacementPoint(lat, lng, existingGeometries = []) {
  const baseLat = Number(lat)
  const baseLng = Number(lng)

  if (!isLatLngInsideRegionInterior(baseLat, baseLng, existingGeometries)) {
    return { lat: baseLat, lng: baseLng, snapped: false }
  }

  let bestLatLng = null
  let bestDist = Infinity

  for (const existing of existingGeometries) {
    const geom = normalizeExistingGeometry(existing)
    if (!geom?.coordinates?.[0]?.length) continue

    const feat = featureFromPolygonGeometry(geom)
    if (!feat) continue

    try {
      if (!booleanPointInPolygon(point([baseLng, baseLat]), feat, INTERIOR_CHECK_OPTIONS)) {
        continue
      }
    } catch {
      continue
    }

    const snapped = closestPointOnRing(baseLat, baseLng, geom.coordinates[0])
    const dist = (baseLng - snapped[1]) ** 2 + (baseLat - snapped[0]) ** 2
    if (dist < bestDist) {
      bestDist = dist
      bestLatLng = snapped
    }
  }

  if (bestLatLng) {
    return { lat: bestLatLng[0], lng: bestLatLng[1], snapped: true }
  }

  return { lat: baseLat, lng: baseLng, snapped: false }
}

/** True when the segment stays out of existing region interiors (endpoints may sit on shared edges). */
export function isLatLngSegmentAllowed(fromLatLng, toLatLng, existingGeometries = [], sampleSteps = 12) {
  const [fromLat, fromLng] = fromLatLng
  const [toLat, toLng] = toLatLng

  for (let i = 1; i < sampleSteps; i += 1) {
    const t = i / sampleSteps
    const sampleLat = fromLat + t * (toLat - fromLat)
    const sampleLng = fromLng + t * (toLng - fromLng)
    if (isLatLngInsideRegionInterior(sampleLat, sampleLng, existingGeometries)) {
      return false
    }
  }

  return true
}
