function perpendicularDistance(point, lineStart, lineEnd) {
  const [px, py] = point
  const [x1, y1] = lineStart
  const [x2, y2] = lineEnd

  const dx = x2 - x1
  const dy = y2 - y1

  if (dx === 0 && dy === 0) {
    const dlat = px - x1
    const dlng = py - y1
    return Math.sqrt(dlat * dlat + dlng * dlng)
  }

  const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
  const projX = x1 + t * dx
  const projY = y1 + t * dy
  const dlat = px - projX
  const dlng = py - projY
  return Math.sqrt(dlat * dlat + dlng * dlng)
}

function douglasPeucker(points, tolerance) {
  if (!points || points.length < 3) return points || []

  let maxDist = 0
  let index = 0
  const end = points.length - 1

  for (let i = 1; i < end; i += 1) {
    const dist = perpendicularDistance(points[i], points[0], points[end])
    if (dist > maxDist) {
      maxDist = dist
      index = i
    }
  }

  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, index + 1), tolerance)
    const right = douglasPeucker(points.slice(index), tolerance)
    return [...left.slice(0, -1), ...right]
  }

  return [points[0], points[end]]
}

/**
 * Simplify a lat/lng trail for low-zoom rendering (Douglas-Peucker).
 */
export function simplifyLatLngTrail(points, zoom, { force = false } = {}) {
  if (!Array.isArray(points) || points.length < 3) return points || []
  const z = Number(zoom)
  if (!force && Number.isFinite(z) && z >= 12) return points

  const tolerance = !Number.isFinite(z) || z >= 11 ? 0.00015 : z < 9 ? 0.0008 : 0.0004
  return douglasPeucker(points, tolerance)
}
