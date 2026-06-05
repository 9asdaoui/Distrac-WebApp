import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Polyline, Polygon, CircleMarker, useMapEvents } from 'react-leaflet'
import { Check, Eraser, HelpCircle, Pencil, Route, Undo2 } from 'lucide-react'
import {
  latLngPairsFromGeometry,
  geometryFromLatLngPairs,
  isValidSectorPolygon,
} from './SectorBoundaryDrawer'
import {
  parseRegionBoundary,
  geometriesOverlap,
  isLatLngSegmentAllowed,
  resolveRegionPlacementPoint,
} from '../utils/regionBoundaryClip'
import {
  appendPointsDeduped,
  closestPointOnRingDetailed,
  findNearestRegionBoundary,
  insertVertexOnBoundary,
  isNearRing,
  ringArcPoints,
} from '../utils/regionBoundaryTrace'

export { isValidSectorPolygon as isValidRegionPolygon }

const CONFIRMED_LINE = {
  color: '#60a5fa',
  weight: 2.5,
  opacity: 0.95,
}

const RUBBER_BAND_LINE = {
  color: '#3b82f6',
  weight: 2,
  opacity: 0.55,
  dashArray: '5, 10',
}

const TRACE_PREVIEW_LINE = {
  color: '#fbbf24',
  weight: 3,
  opacity: 0.95,
}

const POLYGON_DRAFT = {
  color: '#60a5fa',
  weight: 2,
  fillColor: '#3b82f6',
  fillOpacity: 0.2,
}

const POLYGON_SAVED = {
  color: '#22c55e',
  weight: 2.5,
  fillColor: '#10b981',
  fillOpacity: 0.2,
}

const VERTEX = {
  color: '#ffffff',
  weight: 1.5,
  fillColor: '#3b82f6',
  fillOpacity: 1,
}

const TRACE_RING_HIGHLIGHT = {
  color: '#fbbf24',
  weight: 3,
  fillColor: '#f59e0b',
  fillOpacity: 0.08,
  dashArray: '8 6',
}

const DRAW_TOOLBAR_HELP =
  'Free draw: place corners in open area. Trace: click an orange border, follow the edge, then switch to Free draw for open sides. Save when the shape is closed.'

function ToolbarDivider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-zinc-700" aria-hidden />
}

function ToolbarIconButton({
  icon: Icon,
  label,
  active = false,
  disabled = false,
  onClick,
  className = '',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`flex items-center gap-1 rounded-md p-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? 'bg-white text-zinc-900 shadow-sm'
          : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
      } ${className}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
    </button>
  )
}

function toLatLngs(points) {
  return points.map(([lat, lng]) => [lat, lng])
}

/** Leaflet click/mouse handlers — mount inside the Global Map MapContainer. */
export function RegionBoundaryMapInteraction({
  isActive,
  onPointAdd,
  onCursorMove,
  onCursorLeave,
  enableVertexEdit = false,
  onVertexEditClick,
}) {
  useMapEvents({
    click(event) {
      const pair = [event.latlng.lat, event.latlng.lng]
      if (isActive) {
        onPointAdd(pair)
        return
      }
      if (enableVertexEdit) {
        onVertexEditClick?.(pair)
      }
    },
    mousemove(event) {
      if (isActive) {
        onCursorMove([event.latlng.lat, event.latlng.lng])
      }
    },
    mouseout: onCursorLeave,
  })
  return null
}

const EDIT_VERTEX = {
  color: '#ffffff',
  weight: 2,
  fillColor: '#f97316',
  fillOpacity: 1,
}

/** Draggable handles for reshaping an existing region boundary while editing. */
export function RegionBoundaryEditableVertices({ points, enabled, onVertexDrag }) {
  if (!enabled || !points?.length) return null
  return (
    <>
      {points.map(([lat, lng], index) => (
        <CircleMarker
          key={`region-edit-vertex-${index}-${lat}-${lng}`}
          center={[lat, lng]}
          radius={7}
          draggable
          pathOptions={EDIT_VERTEX}
          eventHandlers={{
            dragend: (event) => {
              const { lat: nextLat, lng: nextLng } = event.target.getLatLng()
              onVertexDrag?.(index, [nextLat, nextLng])
            },
          }}
        />
      ))}
    </>
  )
}

/** Highlight the neighbor ring being traced. */
export function RegionBoundaryTraceHighlight({ traceTarget }) {
  if (!traceTarget?.ring) return null
  const positions = traceTarget.ring.slice(0, -1).map(([lng, lat]) => [lat, lng])
  if (positions.length < 3) return null
  return <Polygon positions={positions} pathOptions={TRACE_RING_HIGHLIGHT} />
}

/** Draft polygon, polyline, rubber-band, and vertex markers on the map. */
export function RegionBoundaryDraftLayers({
  points,
  cursorPosition,
  isDrawing,
  isSaved,
  tracePreviewArc,
  showVertexMarkers = true,
  onEdgeClick,
}) {
  const latLngs = toLatLngs(points)
  const showRubberBand = isDrawing && points.length > 0 && cursorPosition && !tracePreviewArc?.length
  const showPolygon = points.length >= 3
  const showPolyline = points.length >= 2 && !showPolygon
  const polygonStyle = isSaved && !isDrawing ? POLYGON_SAVED : POLYGON_DRAFT
  const edgeHandlers = onEdgeClick
    ? {
        click: (event) => {
          onEdgeClick([event.latlng.lat, event.latlng.lng])
        },
      }
    : undefined

  return (
    <>
      {showPolygon && (
        <Polygon positions={latLngs} pathOptions={polygonStyle} eventHandlers={edgeHandlers} />
      )}
      {showPolyline && (
        <Polyline positions={latLngs} pathOptions={CONFIRMED_LINE} eventHandlers={edgeHandlers} />
      )}
      {tracePreviewArc?.length >= 2 && (
        <Polyline positions={toLatLngs(tracePreviewArc)} pathOptions={TRACE_PREVIEW_LINE} />
      )}
      {showRubberBand && (
        <Polyline
          positions={[points[points.length - 1], cursorPosition]}
          pathOptions={RUBBER_BAND_LINE}
        />
      )}
      {showVertexMarkers &&
        points.map(([lat, lng], index) => (
          <CircleMarker
            key={`region-draft-vertex-${index}-${lat}-${lng}`}
            center={[lat, lng]}
            radius={5}
            pathOptions={VERTEX}
          />
        ))}
    </>
  )
}

/** Compact floating draw toolbar — bottom-left of the map canvas (mirrors filter bar anchoring). */
export function RegionBoundaryDrawControls({
  isDrawing,
  pointCount,
  interactionMode,
  tracePickRegionId,
  traceableRegions = [],
  onToggleDraw,
  onStartTracePick,
  onLeaveTrace,
  onCancelTracePick,
  onTracePickRegionChange,
  onUndo,
  onClear,
  onSave,
  className = '',
}) {
  const canSave = pointCount >= 3
  const canUndo = pointCount > 0
  const canClear = pointCount > 0 || isDrawing
  const isTracePick = interactionMode === 'trace-pick'
  const isTracing = interactionMode === 'trace'
  const isFreeActive = isDrawing && interactionMode === 'free'
  const isTraceActive = isTracePick || isTracing

  const handleTraceClick = () => {
    if (isTracing) {
      onLeaveTrace?.()
      return
    }
    if (isTracePick) {
      onCancelTracePick?.()
      return
    }
    onStartTracePick?.()
  }

  return (
    <div
      className={`pointer-events-none absolute bottom-4 left-4 z-[1000] ${className}`}
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900/90 p-1 shadow-lg backdrop-blur-md">
        <button
          type="button"
          title={DRAW_TOOLBAR_HELP}
          aria-label="Drawing help"
          className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <HelpCircle className="h-3.5 w-3.5" />
        </button>

        <ToolbarDivider />

        <ToolbarIconButton
          icon={Pencil}
          label="Free draw"
          active={isFreeActive}
          onClick={onToggleDraw}
        />

        <ToolbarIconButton
          icon={Route}
          label={
            isTracing
              ? 'Leave shared edge'
              : isTracePick
                ? 'Cancel trace'
                : 'Trace neighbor'
          }
          active={isTraceActive}
          onClick={handleTraceClick}
        />

        {isTracePick && traceableRegions.length > 0 && (
          <select
            value={tracePickRegionId || ''}
            onChange={(e) => onTracePickRegionChange?.(e.target.value || null)}
            title="Neighbor to trace"
            className="max-w-[7.5rem] rounded-md border border-zinc-700 bg-zinc-950/90 px-1.5 py-1 text-[10px] text-zinc-300 outline-none focus:border-amber-500/50"
          >
            <option value="">Any border</option>
            {traceableRegions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.region_name || region.code || 'Region'}
              </option>
            ))}
          </select>
        )}

        <ToolbarDivider />

        <ToolbarIconButton icon={Undo2} label="Undo" disabled={!canUndo} onClick={onUndo} />
        <ToolbarIconButton icon={Eraser} label="Clear" disabled={!canClear} onClick={onClear} />

        <ToolbarDivider />

        <button
          type="button"
          onClick={onSave}
          disabled={!canSave}
          title="Save boundary"
          className="flex items-center gap-1 rounded-md bg-emerald-500 px-2 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-3.5 w-3.5 shrink-0" />
          Save
        </button>
      </div>
    </div>
  )
}

/**
 * Headless region boundary drawing state — use with Global Map layers + controls.
 */
export function useRegionBoundaryDraw({
  value,
  onChange,
  existingRegions = [],
  excludeRegionId = null,
  enableVertexEditing = false,
}) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [interactionMode, setInteractionMode] = useState('idle') // idle | free | trace-pick | trace
  const [traceTarget, setTraceTarget] = useState(null)
  const [tracePickRegionId, setTracePickRegionId] = useState(null)
  const [tracePreviewArc, setTracePreviewArc] = useState(null)
  const [points, setPoints] = useState(() => latLngPairsFromGeometry(value))
  const [cursorPosition, setCursorPosition] = useState(null)
  const [clipNotice, setClipNotice] = useState('')

  const isSaved = Boolean(value?.type === 'Polygon' && !isDrawing)

  const traceableRegions = useMemo(
    () =>
      (existingRegions || []).filter((region) => {
        if (!region?.id || region.id === excludeRegionId) return false
        return Boolean(parseRegionBoundary(region.boundary))
      }),
    [existingRegions, excludeRegionId],
  )

  const existingForClip = useMemo(
    () =>
      (existingRegions || [])
        .filter((r) => r.id !== excludeRegionId)
        .map((r) => parseRegionBoundary(r.boundary))
        .filter(Boolean),
    [existingRegions, excludeRegionId],
  )

  useEffect(() => {
    if (value) {
      setPoints(latLngPairsFromGeometry(value))
      setIsDrawing(false)
      setInteractionMode('idle')
      setTraceTarget(null)
      setTracePreviewArc(null)
      setCursorPosition(null)
    }
  }, [value])

  const reset = useCallback(() => {
    setPoints([])
    setCursorPosition(null)
    setClipNotice('')
    setIsDrawing(false)
    setInteractionMode('idle')
    setTraceTarget(null)
    setTracePickRegionId(null)
    setTracePreviewArc(null)
    onChange(null)
  }, [onChange])

  const handleToggleDraw = useCallback(() => {
    setTraceTarget(null)
    setTracePreviewArc(null)
    setTracePickRegionId(null)

    if (isDrawing && interactionMode === 'free') {
      setIsDrawing(false)
      setInteractionMode('idle')
      setCursorPosition(null)
      return
    }

    setIsDrawing(true)
    setInteractionMode('free')
    setClipNotice('')
  }, [isDrawing, interactionMode])

  const handleStartTracePick = useCallback(() => {
    setIsDrawing(true)
    setInteractionMode('trace-pick')
    setTraceTarget(null)
    setTracePreviewArc(null)
    setCursorPosition(null)
    setClipNotice('Click an orange border to start tracing along that edge.')
  }, [])

  const handleCancelTracePick = useCallback(() => {
    setInteractionMode(points.length > 0 ? 'free' : 'idle')
    setTracePickRegionId(null)
    setTracePreviewArc(null)
    setCursorPosition(null)
    if (points.length === 0) setIsDrawing(false)
    setClipNotice('')
  }, [points.length])

  const handleLeaveTrace = useCallback(() => {
    setInteractionMode('free')
    setTraceTarget(null)
    setTracePreviewArc(null)
    setCursorPosition(null)
    setClipNotice('Left shared edge — continue with free corners in open area.')
  }, [])

  const handleUndo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1))
    setTracePreviewArc(null)
    setClipNotice('')
  }, [])

  const handleClear = useCallback(() => {
    setPoints([])
    setCursorPosition(null)
    setTraceTarget(null)
    setTracePreviewArc(null)
    setTracePickRegionId(null)
    onChange(null)
    setClipNotice('')
    setIsDrawing(true)
    setInteractionMode('free')
  }, [onChange])

  const handleSave = useCallback(() => {
    const rawGeometry = geometryFromLatLngPairs(points)
    if (!rawGeometry) return

    if (!isValidSectorPolygon(rawGeometry)) {
      setClipNotice('Place at least 3 corners before saving.')
      return
    }

    if (geometriesOverlap(rawGeometry, existingForClip)) {
      setClipNotice(
        'Boundary overlaps another region. Use Trace neighbor for shared edges, then free draw for open sides.',
      )
      return
    }

    onChange(rawGeometry)
    setIsDrawing(false)
    setInteractionMode('idle')
    setTraceTarget(null)
    setTracePreviewArc(null)
    setCursorPosition(null)
    setClipNotice('Boundary saved.')
  }, [onChange, points, existingForClip])

  const appendFreePoint = useCallback(
    (placement) => {
      setPoints((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1]
          if (!isLatLngSegmentAllowed(last, placement, existingForClip)) {
            setClipNotice(
              'This line would cross through another region. Trace the shared edge instead.',
            )
            return prev
          }
        }

        const lastPlaced = prev[prev.length - 1]
        if (
          lastPlaced &&
          Math.abs(lastPlaced[0] - placement[0]) < 1e-8 &&
          Math.abs(lastPlaced[1] - placement[1]) < 1e-8
        ) {
          return prev
        }

        return [...prev, placement]
      })
    },
    [existingForClip],
  )

  const handleVertexDrag = useCallback((vertexIndex, pair) => {
    setPoints((prev) =>
      prev.map(([lat, lng], index) =>
        index === vertexIndex ? [pair[0], pair[1]] : [lat, lng],
      ),
    )
    setClipNotice('')
  }, [])

  const handleVertexEditClick = useCallback(
    (pair) => {
      if (!enableVertexEditing || interactionMode !== 'idle' || isDrawing || points.length < 3) {
        return false
      }

      const insertion = insertVertexOnBoundary(pair[0], pair[1], points)
      if (!insertion) return false

      setPoints((prev) => {
        const next = [...prev]
        next.splice(insertion.insertIndex, 0, insertion.point)
        return next
      })
      setClipNotice('New corner added on the boundary — drag it to adjust.')
      return true
    },
    [enableVertexEditing, interactionMode, isDrawing, points],
  )

  const handlePointAdd = useCallback(
    (pair) => {
      if (interactionMode === 'trace-pick') {
        const pick = findNearestRegionBoundary(pair[0], pair[1], traceableRegions, {
          excludeRegionId,
          onlyRegionId: tracePickRegionId,
        })
        if (!pick) {
          setClipNotice('Click closer to an existing region border (orange dashed line).')
          return
        }

        const start = [pick.lat, pick.lng]
        setTraceTarget({
          regionId: pick.regionId,
          regionName: pick.regionName,
          ring: pick.ring,
        })
        setInteractionMode('trace')
        setIsDrawing(true)
        setPoints((prev) => appendPointsDeduped(prev, [start]))
        setTracePreviewArc(null)
        setCursorPosition(start)
        setClipNotice(`Tracing ${pick.regionName}. Click along its border; Leave edge when done.`)
        return
      }

      if (interactionMode === 'trace' && traceTarget?.ring) {
        const onRing = isNearRing(pair[0], pair[1], traceTarget.ring)
        if (onRing) {
          const snapped = closestPointOnRingDetailed(pair[0], pair[1], traceTarget.ring)
          const placement = [snapped.lat, snapped.lng]
          setPoints((prev) => {
            if (!prev.length) return [placement]
            const last = prev[prev.length - 1]
            const arc = ringArcPoints(traceTarget.ring, last, placement)
            return appendPointsDeduped(prev, arc.slice(1))
          })
          setTracePreviewArc(null)
          setClipNotice(`Edge fixed on ${traceTarget.regionName}. Click again or Leave edge.`)
          return
        }

        const resolved = resolveRegionPlacementPoint(pair[0], pair[1], existingForClip)
        const placement = [resolved.lat, resolved.lng]
        setPoints((prev) => {
          if (!prev.length) return [placement]
          const last = prev[prev.length - 1]
          if (!isLatLngSegmentAllowed(last, placement, existingForClip)) {
            setClipNotice('Cannot cross through another region. Click Leave edge first.')
            return prev
          }
          return appendPointsDeduped(prev, [placement])
        })
        setInteractionMode('free')
        setTraceTarget(null)
        setTracePreviewArc(null)
        setClipNotice('Left shared edge — placed corner in open area.')
        return
      }

      const resolved = resolveRegionPlacementPoint(pair[0], pair[1], existingForClip)
      const placement = [resolved.lat, resolved.lng]
      appendFreePoint(placement)
      setClipNotice(resolved.snapped ? 'Corner snapped to the nearest shared boundary.' : '')
    },
    [
      interactionMode,
      traceTarget,
      traceableRegions,
      excludeRegionId,
      tracePickRegionId,
      existingForClip,
      appendFreePoint,
    ],
  )

  const handleCursorMove = useCallback(
    (pair) => {
      if (interactionMode === 'trace-pick') {
        const pick = findNearestRegionBoundary(pair[0], pair[1], traceableRegions, {
          excludeRegionId,
          onlyRegionId: tracePickRegionId,
        })
        setCursorPosition(pick ? [pick.lat, pick.lng] : null)
        return
      }

      if (interactionMode === 'trace' && traceTarget?.ring) {
        if (isNearRing(pair[0], pair[1], traceTarget.ring)) {
          const snapped = closestPointOnRingDetailed(pair[0], pair[1], traceTarget.ring)
          const placement = [snapped.lat, snapped.lng]
          setCursorPosition(placement)
          if (points.length > 0) {
            const last = points[points.length - 1]
            const arc = ringArcPoints(traceTarget.ring, last, placement)
            setTracePreviewArc(arc)
          } else {
            setTracePreviewArc(null)
          }
          return
        }

        setTracePreviewArc(null)
        const resolved = resolveRegionPlacementPoint(pair[0], pair[1], existingForClip)
        setCursorPosition([resolved.lat, resolved.lng])
        return
      }

      const resolved = resolveRegionPlacementPoint(pair[0], pair[1], existingForClip)
      const placement = [resolved.lat, resolved.lng]

      if (points.length > 0) {
        const last = points[points.length - 1]
        if (!isLatLngSegmentAllowed(last, placement, existingForClip)) {
          setCursorPosition(null)
          setTracePreviewArc(null)
          return
        }
      }

      setTracePreviewArc(null)
      setCursorPosition(placement)
    },
    [
      interactionMode,
      traceTarget,
      traceableRegions,
      excludeRegionId,
      tracePickRegionId,
      existingForClip,
      points,
    ],
  )

  const isMapInteractionActive =
    isDrawing || interactionMode === 'trace-pick' || interactionMode === 'trace'

  const canVertexEdit =
    enableVertexEditing && interactionMode === 'idle' && !isDrawing && points.length >= 3

  return {
    isDrawing,
    interactionMode,
    traceTarget,
    tracePickRegionId,
    traceableRegions,
    tracePreviewArc,
    points,
    cursorPosition,
    clipNotice,
    isSaved,
    isMapInteractionActive,
    canVertexEdit,
    setClipNotice,
    setTracePickRegionId,
    reset,
    handleToggleDraw,
    handleStartTracePick,
    handleCancelTracePick,
    handleLeaveTrace,
    handleUndo,
    handleClear,
    handleSave,
    handlePointAdd,
    handleVertexDrag,
    handleVertexEditClick,
    handleCursorMove,
    handleCursorLeave: () => {
      setCursorPosition(null)
      setTracePreviewArc(null)
    },
  }
}
