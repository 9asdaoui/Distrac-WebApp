import apiInstance from '../api/axiosInstance'
import { parseRegionBoundary } from './regionBoundaryClip'
import { findNearestRegionBoundary } from './regionBoundaryTrace'

/**
 * Resolve nearest traceable border via topology API, with client-side fallback.
 */
export async function pickRegionBoundaryForTrace(lat, lng, traceableRegions, options = {}) {
  try {
    const params = { lat, lng, limit: 5 }
    if (options.excludeRegionId) params.excludeRegionId = options.excludeRegionId
    const res = await apiInstance.get('/regions/trace-candidates', { params })
    let candidates = res.data?.data?.candidates || []
    if (options.onlyRegionId) {
      candidates = candidates.filter((c) => c.regionId === options.onlyRegionId)
    }
    const top = candidates[0]
    if (!top) {
      return findNearestRegionBoundary(lat, lng, traceableRegions, options)
    }

    const region = traceableRegions.find((r) => r.id === top.regionId)
    const geom = parseRegionBoundary(region?.boundary)
    const ring = geom?.coordinates?.[0]
    if (!ring?.length) {
      return findNearestRegionBoundary(lat, lng, traceableRegions, options)
    }

    return {
      regionId: top.regionId,
      regionName: top.regionName,
      ring,
      lat: top.lat,
      lng: top.lng,
      distance: top.distanceDeg,
      segmentIndex: top.segmentIndex,
    }
  } catch {
    return findNearestRegionBoundary(lat, lng, traceableRegions, options)
  }
}
