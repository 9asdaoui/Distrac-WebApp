import { parseSectorBoundary } from '../../../components/SectorBoundaryPreview'
import { latLngPairsFromGeometry } from '../../../components/SectorBoundaryDrawer'

export const DEPOT_SECTOR_PALETTE = [
  { color: '#34d399', fillColor: '#10b981' },
  { color: '#fbbf24', fillColor: '#d97706' },
  { color: '#60a5fa', fillColor: '#2563eb' },
  { color: '#c084fc', fillColor: '#9333ea' },
]

export const UNASSIGNED_SECTOR_STYLE = { color: '#71717a', fillColor: '#52525b' }

export function buildDepotColorMap(depotIds) {
  const unique = [...new Set((depotIds || []).filter(Boolean))].sort()
  const map = new Map()
  unique.forEach((id, index) => {
    map.set(id, DEPOT_SECTOR_PALETTE[index % DEPOT_SECTOR_PALETTE.length])
  })
  return map
}

export function getSectorColor(depotId, depotColorMap) {
  if (!depotId) return UNASSIGNED_SECTOR_STYLE
  return depotColorMap.get(depotId) || UNASSIGNED_SECTOR_STYLE
}

export function polygonRingsFromBoundary(boundary) {
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

/** Reconstruct a GeoJSON Polygon from an array of rings (each ring is [[lat,lng], ...]). */
export function boundaryFromPolygonRings(rings) {
  if (!rings || !rings.length) return null
  const closedRings = rings
    .filter((ring) => Array.isArray(ring) && ring.length >= 3)
    .map((ring) => {
      const coords = ring.map(([lat, lng]) => [Number(lng), Number(lat)])
      const first = coords[0]
      const last = coords[coords.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) coords.push([first[0], first[1]])
      return coords
    })
  if (!closedRings.length) return null
  return { type: 'Polygon', coordinates: closedRings }
}

export function buildRegionDrawSurface(draw, { regionId = null } = {}) {
  if (!draw) return null
  return {
    regionId,
    isDrawing: draw.isDrawing,
    interactionMode: draw.interactionMode,
    traceTarget: draw.traceTarget,
    tracePickRegionId: draw.tracePickRegionId,
    traceableRegions: draw.traceableRegions,
    tracePreviewArc: draw.tracePreviewArc,
    isMapInteractionActive: draw.isMapInteractionActive,
    enableVertexEdit: draw.canVertexEdit,
    points: draw.points,
    cursorPosition: draw.cursorPosition,
    isSaved: draw.isSaved,
    onPointAdd: draw.handlePointAdd,
    onCursorMove: draw.handleCursorMove,
    onCursorLeave: draw.handleCursorLeave,
    onVertexDrag: draw.handleVertexDrag,
    onVertexEditClick: draw.handleVertexEditClick,
    onToggleDraw: draw.handleToggleDraw,
    onStartTracePick: draw.handleStartTracePick,
    onLeaveTrace: draw.handleLeaveTrace,
    onCancelTracePick: draw.handleCancelTracePick,
    onTracePickRegionChange: draw.setTracePickRegionId,
    onUndo: draw.handleUndo,
    onClear: draw.handleClear,
    onSave: draw.handleSave,
  }
}
