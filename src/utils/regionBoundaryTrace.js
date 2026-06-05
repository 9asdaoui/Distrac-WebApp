import { parseRegionBoundary } from './regionBoundaryClip'

/** ~1.2 km — max distance to pick a neighbor border by click. */
export const PICK_BOUNDARY_MAX_DEG = 0.012

/** While tracing, stick cursor to ring within this distance. */
export const STICK_TO_RING_MAX_DEG = 0.01

/** ~900 m — max distance to insert a corner by clicking an existing boundary edge. */
export const INSERT_EDGE_MAX_DEG = 0.008

function latLngPairsToClosedRing(pairs) {
  const ring = (pairs || []).map(([lat, lng]) => [Number(lng), Number(lat)])
  if (ring.length < 3) return ring
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push([first[0], first[1]])
  }
  return ring
}

/** Insert a new vertex on the closest segment of an open lat/lng ring. */
export function insertVertexOnBoundary(lat, lng, pairs, maxDistanceDeg = INSERT_EDGE_MAX_DEG) {
  if (!pairs || pairs.length < 3) return null
  const ring = latLngPairsToClosedRing(pairs)
  const detailed = closestPointOnRingDetailed(lat, lng, ring)
  if (detailed.distance > maxDistanceDeg) return null
  return {
    point: [detailed.lat, detailed.lng],
    insertIndex: detailed.segmentIndex + 1,
  }
}

function closestPointOnSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) {
    return { x: x1, y: y1, t: 0 }
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
  t = Math.max(0, Math.min(1, t))
  return { x: x1 + t * dx, y: y1 + t * dy, t }
}

export function closestPointOnRingDetailed(lat, lng, ring) {
  const px = Number(lng)
  const py = Number(lat)
  let bestLat = py
  let bestLng = px
  let bestDist = Infinity
  let bestSegmentIndex = 0
  let bestT = 0

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
      bestSegmentIndex = i
      bestT = projected.t
    }
  }

  return {
    lat: bestLat,
    lng: bestLng,
    segmentIndex: bestSegmentIndex,
    t: bestT,
    distance: Math.sqrt(bestDist),
  }
}

export function findNearestRegionBoundary(
  lat,
  lng,
  regions = [],
  { excludeRegionId = null, onlyRegionId = null, maxDistanceDeg = PICK_BOUNDARY_MAX_DEG } = {},
) {
  let best = null

  for (const region of regions) {
    if (!region?.id || region.id === excludeRegionId) continue
    if (onlyRegionId && region.id !== onlyRegionId) continue

    const geom = parseRegionBoundary(region.boundary)
    const ring = geom?.coordinates?.[0]
    if (!ring?.length) continue

    const detailed = closestPointOnRingDetailed(lat, lng, ring)
    if (detailed.distance > maxDistanceDeg) continue

    if (!best || detailed.distance < best.distance) {
      best = {
        regionId: region.id,
        regionName: region.region_name || region.name || 'Region',
        ring,
        ...detailed,
      }
    }
  }

  return best
}

function pathLength(points) {
  let sum = 0
  for (let i = 1; i < points.length; i += 1) {
    const dlat = points[i][0] - points[i - 1][0]
    const dlng = points[i][1] - points[i - 1][1]
    sum += dlat * dlat + dlng * dlng
  }
  return sum
}

function walkRing(ring, fromD, toD, direction) {
  const n = ring.length - 1
  if (n < 3) return [[fromD.lat, fromD.lng], [toD.lat, toD.lng]]

  const path = [[fromD.lat, fromD.lng]]
  let seg = fromD.segmentIndex

  for (let step = 0; step <= n; step += 1) {
    if (seg === toD.segmentIndex) break

    if (direction > 0) {
      const vtxIdx = (seg + 1) % n
      const [lng, lat] = ring[vtxIdx]
      path.push([lat, lng])
      seg = (seg + 1) % n
    } else {
      const vtxIdx = seg
      const [lng, lat] = ring[vtxIdx]
      path.push([lat, lng])
      seg = (seg - 1 + n) % n
    }
  }

  const end = [toD.lat, toD.lng]
  const last = path[path.length - 1]
  if (Math.abs(last[0] - end[0]) > 1e-8 || Math.abs(last[1] - end[1]) > 1e-8) {
    path.push(end)
  }

  return path
}

/** Points along the shorter arc of a ring between two on-ring positions. */
export function ringArcPoints(ring, fromLatLng, toLatLng) {
  const fromD = closestPointOnRingDetailed(fromLatLng[0], fromLatLng[1], ring)
  const toD = closestPointOnRingDetailed(toLatLng[0], toLatLng[1], ring)

  if (
    Math.abs(fromD.lat - toD.lat) < 1e-8 &&
    Math.abs(fromD.lng - toD.lng) < 1e-8
  ) {
    return [[fromD.lat, fromD.lng]]
  }

  if (fromD.segmentIndex === toD.segmentIndex) {
    return [
      [fromD.lat, fromD.lng],
      [toD.lat, toD.lng],
    ]
  }

  const forward = walkRing(ring, fromD, toD, 1)
  const backward = walkRing(ring, fromD, toD, -1)

  return pathLength(forward) <= pathLength(backward) ? forward : backward
}

export function isNearRing(lat, lng, ring, maxDistanceDeg = STICK_TO_RING_MAX_DEG) {
  return closestPointOnRingDetailed(lat, lng, ring).distance <= maxDistanceDeg
}

export function appendPointsDeduped(prev, nextPoints) {
  const out = [...prev]
  for (const pt of nextPoints) {
    const last = out[out.length - 1]
    if (last && Math.abs(last[0] - pt[0]) < 1e-8 && Math.abs(last[1] - pt[1]) < 1e-8) {
      continue
    }
    out.push(pt)
  }
  return out
}
