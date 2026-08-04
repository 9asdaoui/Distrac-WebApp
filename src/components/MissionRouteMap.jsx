import React, { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import L from 'leaflet'
import { hasGpsCoordinates } from './LocationMap'

const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

function numberedIcon(sequence) {
  return L.divIcon({
    className: 'route-stop-marker',
    html: `<div class="route-stop-marker__badge">${sequence}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -26],
  })
}

const depotIcon = L.divIcon({
  className: 'route-depot-marker',
  html: '<div class="route-depot-marker__badge" title="Depot">⌂</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
})

function FitRouteBounds({ positions }) {
  const map = useMap()

  useEffect(() => {
    if (!positions.length) return
    if (positions.length === 1) {
      map.setView(positions[0], 13)
      return
    }
    const bounds = L.latLngBounds(positions)
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
  }, [map, positions])

  return null
}

function normalizeStop(stop, index) {
  const lat = stop.location?.lat ?? stop.location?.latitude
  const lon = stop.location?.lon ?? stop.location?.longitude
  const stopType = stop.stop_type || stop.stopType
  return {
    id: stop.id || `stop-${index}`,
    sequence: stop.sequence_number || index + 1,
    label: stopType,
    title: stop.location?.name || stop.custom_description || stop.customDescription || `Stop ${index + 1}`,
    lat: lat != null ? Number(lat) : null,
    lon: lon != null ? Number(lon) : null,
  }
}

export function MissionRouteMap({ stops, depotOrigin, compact = false }) {
  const depotPoint = useMemo(() => {
    if (!depotOrigin) return null
    const lat = depotOrigin.lat ?? depotOrigin.latitude
    const lon = depotOrigin.lon ?? depotOrigin.longitude
    if (!hasGpsCoordinates(lat, lon)) return null
    return {
      lat: Number(lat),
      lon: Number(lon),
      name: depotOrigin.name || 'Depot',
      address: depotOrigin.address || null,
    }
  }, [depotOrigin])

  const routeStops = useMemo(() => {
    return [...(stops || [])]
      .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
      .map((stop, index) => normalizeStop(stop, index))
      .filter((stop) => hasGpsCoordinates(stop.lat, stop.lon))
  }, [stops])

  const positions = useMemo(() => {
    const pts = []
    if (depotPoint) pts.push([depotPoint.lat, depotPoint.lon])
    for (const stop of routeStops) {
      pts.push([stop.lat, stop.lon])
    }
    return pts
  }, [depotPoint, routeStops])

  const center = positions[0] || [33.5731, -7.5898]
  const mapHeight = compact ? 'h-full min-h-[280px]' : 'h-[320px]'

  if (routeStops.length === 0 && !depotPoint) {
    return (
      <div className={`flex ${mapHeight} items-center justify-center rounded-xl bg-zinc-950/60 px-4 text-center text-xs text-zinc-500`}>
        No GPS for depot or stops — add coordinates to visualize the route.
      </div>
    )
  }

  const wrapperClass = compact
    ? `relative z-0 ${mapHeight} overflow-hidden rounded-xl bg-zinc-950`
    : `overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface`

  const inner = (
    <div className={`relative z-0 ${mapHeight} bg-zinc-950`}>
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <TileLayer attribution={DARK_TILE_ATTRIBUTION} url={DARK_TILE_URL} />
        <FitRouteBounds positions={positions} />
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{
              color: '#60a5fa',
              weight: 3,
              opacity: 0.9,
              dashArray: depotPoint ? undefined : '6 8',
            }}
          />
        )}
        {depotPoint && (
          <Marker position={[depotPoint.lat, depotPoint.lon]} icon={depotIcon} zIndexOffset={1000}>
            <Popup>
              <div className="text-xs">
                <strong>Depot — start</strong>
                <br />
                {depotPoint.name}
                {depotPoint.address && (
                  <>
                    <br />
                    {depotPoint.address}
                  </>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        {routeStops.map((stop) => (
          <Marker key={stop.id} position={[stop.lat, stop.lon]} icon={numberedIcon(stop.sequence)}>
            <Popup>
              <div className="text-xs">
                <strong>
                  #{stop.sequence} {stop.label}
                </strong>
                <br />
                {stop.title}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )

  if (compact) {
    return inner
  }

  return (
    <div className={wrapperClass}>
      <div className="border-b border-gray-200 px-5 py-4 dark:border-zinc-800">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <MapPin className="h-4 w-4 text-zinc-500" />
          Route overview
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500">
          {depotPoint ? 'Depot → ' : ''}
          {routeStops.length} stop{routeStops.length !== 1 ? 's' : ''}
        </p>
      </div>
      {inner}
    </div>
  )
}
