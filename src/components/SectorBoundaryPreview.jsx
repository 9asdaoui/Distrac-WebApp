import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import { latLngPairsFromGeometry } from './SectorBoundaryDrawer'

const DEFAULT_CENTER = [33.5731, -7.5898]
const DEFAULT_ZOOM = 12

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const POLYGON_STYLE = {
  color: '#22c55e',
  weight: 2.5,
  fillColor: '#10b981',
  fillOpacity: 0.2,
}

const CLIENT_MARKER_STYLE = {
  color: '#ffffff',
  weight: 1.5,
  fillColor: '#f59e0b',
  fillOpacity: 0.95,
}

export function parseSectorBoundary(boundary) {
  if (!boundary) return null

  if (typeof boundary === 'string') {
    try {
      const parsed = JSON.parse(boundary)
      if (parsed?.type === 'Polygon') return parsed
      if (parsed?.geometry?.type === 'Polygon') return parsed.geometry
      return null
    } catch {
      return null
    }
  }

  if (boundary.type === 'Polygon') return boundary
  if (boundary.geometry?.type === 'Polygon') return boundary.geometry
  return null
}

function hasGps(lat, lng) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

function FitBounds({ positions }) {
  const map = useMap()

  useEffect(() => {
    if (!positions?.length) return
    map.fitBounds(positions, { padding: [40, 40], maxZoom: 15 })
  }, [map, positions])

  return null
}

export function SectorBoundaryPreview({
  boundary,
  clients = [],
  className = '',
  mapClassName = 'h-[400px]',
}) {
  const geometry = parseSectorBoundary(boundary)
  const points = latLngPairsFromGeometry(geometry)
  const boundaryPositions = points.map(([lat, lng]) => [lat, lng])

  const clientMarkers = useMemo(
    () =>
      (clients || [])
        .filter((client) => hasGps(client.gps_latitude, client.gps_longitude))
        .map((client) => ({
          id: client.id,
          name: client.client_name,
          position: [Number(client.gps_latitude), Number(client.gps_longitude)],
        })),
    [clients],
  )

  const fitPositions = useMemo(() => {
    const all = [...boundaryPositions, ...clientMarkers.map((marker) => marker.position)]
    return all
  }, [boundaryPositions, clientMarkers])

  const hasBoundary = boundaryPositions.length >= 3

  if (!hasBoundary && clientMarkers.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-zinc-950/40 dark:border-zinc-700 ${mapClassName} ${className}`}
      >
        <MapPin className="mb-2 h-8 w-8 text-zinc-500" />
        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">No boundary defined</p>
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-gray-200 shadow-sm dark:border-zinc-800 ${className}`}>
      {clientMarkers.length > 0 && (
        <div className="flex items-center gap-4 border-b border-gray-200 bg-zinc-50 px-4 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-cc-surface/80 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Sector boundary
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            Clients ({clientMarkers.length})
          </span>
        </div>
      )}
      <MapContainer
        center={fitPositions[0] || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className={`w-full ${mapClassName}`}
        scrollWheelZoom
      >
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {fitPositions.length > 0 && <FitBounds positions={fitPositions} />}
        {hasBoundary && <Polygon positions={boundaryPositions} pathOptions={POLYGON_STYLE} />}
        {clientMarkers.map((marker) => (
          <CircleMarker
            key={`client-${marker.id}`}
            center={marker.position}
            radius={5}
            pathOptions={CLIENT_MARKER_STYLE}
          />
        ))}
      </MapContainer>
    </div>
  )
}
