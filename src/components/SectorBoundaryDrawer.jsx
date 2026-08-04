import React, { useCallback, useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  CircleMarker,
  useMapEvents,
} from 'react-leaflet'
import { Check, Eraser, Pencil, Square, Undo2 } from 'lucide-react'

const DEFAULT_CENTER = [33.5731, -7.5898]
const DEFAULT_ZOOM = 12

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

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

export function latLngPairsFromGeometry(geometry) {
  if (!geometry || geometry.type !== 'Polygon') return []
  const ring = geometry.coordinates?.[0] || []
  if (ring.length < 4) return []
  return ring.slice(0, -1).map(([lng, lat]) => [lat, lng])
}

export function geometryFromLatLngPairs(pairs) {
  if (!pairs || pairs.length < 3) return null
  const ring = pairs.map(([lat, lng]) => [lng, lat])
  ring.push([ring[0][0], ring[0][1]])
  return { type: 'Polygon', coordinates: [ring] }
}

function toLatLngs(points) {
  return points.map(([lat, lng]) => [lat, lng])
}

function MapInteraction({ isDrawing, onPointAdd, onCursorMove, onCursorLeave }) {
  useMapEvents({
    click(event) {
      if (isDrawing) {
        onPointAdd([event.latlng.lat, event.latlng.lng])
      }
    },
    mousemove(event) {
      if (isDrawing) {
        onCursorMove([event.latlng.lat, event.latlng.lng])
      }
    },
    mouseout: onCursorLeave,
  })
  return null
}

function BoundaryLayers({ points, cursorPosition, isDrawing, isSaved }) {
  const latLngs = toLatLngs(points)
  const showRubberBand = isDrawing && points.length > 0 && cursorPosition
  const showPolygon = points.length >= 3
  const showPolyline = points.length >= 2 && !showPolygon
  const polygonStyle = isSaved && !isDrawing ? POLYGON_SAVED : POLYGON_DRAFT

  return (
    <>
      {showPolygon && <Polygon positions={latLngs} pathOptions={polygonStyle} />}

      {showPolyline && <Polyline positions={latLngs} pathOptions={CONFIRMED_LINE} />}

      {showRubberBand && (
        <Polyline
          positions={[points[points.length - 1], cursorPosition]}
          pathOptions={RUBBER_BAND_LINE}
        />
      )}

      {points.map(([lat, lng], index) => (
        <CircleMarker
          key={`vertex-${index}-${lat}-${lng}`}
          center={[lat, lng]}
          radius={5}
          pathOptions={VERTEX}
        />
      ))}
    </>
  )
}

function FloatingMapControls({
  isDrawing,
  pointCount,
  isSaved,
  onToggleDraw,
  onUndo,
  onClear,
  onSave,
}) {
  const canSave = isDrawing && pointCount >= 3
  const canUndo = isDrawing && pointCount > 0
  const canClear = pointCount > 0 || isDrawing

  return (
    <div className="pointer-events-none absolute inset-0 z-[1000]">
      <div className="pointer-events-auto absolute right-4 top-4 w-[168px] overflow-hidden rounded-xl border border-zinc-200/90 bg-white/95 shadow-xl shadow-black/10 backdrop-blur-md dark:border-zinc-700/90 dark:bg-cc-surface/95">
        <div className="border-b border-zinc-200/80 px-3 py-2 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Draw boundary
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-300">
            {isDrawing
              ? `${pointCount} point${pointCount === 1 ? '' : 's'} placed`
              : isSaved
                ? 'Saved — toggle draw to edit'
                : 'Toggle draw, then click corners'}
          </p>
        </div>

        <div className="flex flex-col gap-1 p-1.5">
          <button
            type="button"
            onClick={onToggleDraw}
            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${
              isDrawing
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
            }`}
          >
            {isDrawing ? (
              <>
                <Square className="h-3.5 w-3.5 shrink-0" />
                Stop drawing
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5 shrink-0" />
                Draw
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Undo2 className="h-3.5 w-3.5 shrink-0" />
            Undo
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!canClear}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-35 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            <Eraser className="h-3.5 w-3.5 shrink-0" />
            Clear
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={!canSave}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-white transition enabled:bg-emerald-600 enabled:hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-500"
          >
            <Check className="h-3.5 w-3.5 shrink-0" />
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export function SectorBoundaryDrawer({ value, onChange, className = '' }) {
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState(() => latLngPairsFromGeometry(value))
  const [cursorPosition, setCursorPosition] = useState(null)

  const isSaved = Boolean(value?.type === 'Polygon' && !isDrawing)

  useEffect(() => {
    if (value) {
      setPoints(latLngPairsFromGeometry(value))
      setIsDrawing(false)
      setCursorPosition(null)
    }
  }, [value])

  const handleToggleDraw = useCallback(() => {
    setIsDrawing((active) => {
      if (active) {
        setCursorPosition(null)
        return false
      }
      return true
    })
  }, [])

  const handleUndo = useCallback(() => {
    setPoints((prev) => prev.slice(0, -1))
  }, [])

  const handleClear = useCallback(() => {
    setPoints([])
    setCursorPosition(null)
    onChange(null)
    setIsDrawing(true)
  }, [onChange])

  const handleSave = useCallback(() => {
    const geometry = geometryFromLatLngPairs(points)
    if (!geometry) return
    onChange(geometry)
    setIsDrawing(false)
    setCursorPosition(null)
  }, [onChange, points])

  const handlePointAdd = useCallback((pair) => {
    setPoints((prev) => [...prev, pair])
  }, [])

  return (
    <div className={className}>
      <div
        className={`sector-boundary-map relative overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-700 ${
          isDrawing ? 'sector-boundary-map--drawing' : ''
        }`}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          className="h-[340px] w-full"
          scrollWheelZoom
        >
          <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
          <MapInteraction
            isDrawing={isDrawing}
            onPointAdd={handlePointAdd}
            onCursorMove={setCursorPosition}
            onCursorLeave={() => setCursorPosition(null)}
          />
          <BoundaryLayers
            points={points}
            cursorPosition={cursorPosition}
            isDrawing={isDrawing}
            isSaved={isSaved}
          />
        </MapContainer>

        <FloatingMapControls
          isDrawing={isDrawing}
          pointCount={points.length}
          isSaved={isSaved}
          onToggleDraw={handleToggleDraw}
          onUndo={handleUndo}
          onClear={handleClear}
          onSave={handleSave}
        />
      </div>

      {isSaved && (
        <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          Boundary saved — {points.length} corners.
        </p>
      )}

      {isDrawing && points.length === 0 && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Click on the map to place the first corner. The line will follow your cursor.
        </p>
      )}
    </div>
  )
}

export function isValidSectorPolygon(geometry) {
  if (!geometry || geometry.type !== 'Polygon') return false
  const ring = geometry.coordinates?.[0]
  return Array.isArray(ring) && ring.length >= 4
}
