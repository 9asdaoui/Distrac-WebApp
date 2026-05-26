import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const DARK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const markerIconDiv = L.divIcon({
  className: 'location-map-marker',
  html: '<div class="location-map-marker__wrap"><span class="location-map-marker__ring"></span><span class="location-map-marker__dot"></span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

export function hasGpsCoordinates(lat, lng) {
  if (lat == null || lng == null) return false
  const latitude = Number(lat)
  const longitude = Number(lng)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

function MapCardHeader() {
  return (
    <div className="border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
      <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
        <MapPin className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
        Location Map
      </h3>
      <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">Physical coordinates for this entity</p>
    </div>
  )
}

function MapEmptyBody({ message }) {
  return (
    <div className="flex h-[300px] flex-col items-center justify-center bg-zinc-950/40 px-6">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800">
        <MapPin className="h-5 w-5 text-zinc-500" />
      </div>
      <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  )
}

export function LocationMap({ lat, lng, name }) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  const position = useMemo(() => [latitude, longitude], [latitude, longitude])
  const icon = useMemo(() => markerIconDiv, [])

  return (
    <div className="relative z-0 h-[300px] overflow-hidden bg-zinc-950">
      <MapContainer center={position} zoom={14} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer attribution={DARK_TILE_ATTRIBUTION} url={DARK_TILE_URL} />
        <Marker position={position} icon={icon}>
          <Popup>
            <span className="location-map-popup__label">{name || 'Location'}</span>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}

/** Card-wrapped map (or empty state) for detail pages */
export function LocationMapCard({ lat, lng, name, emptyMessage = 'No GPS coordinates set for this location.' }) {
  const showMap = hasGpsCoordinates(lat, lng)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <MapCardHeader />
      {showMap ? <LocationMap lat={lat} lng={lng} name={name} /> : <MapEmptyBody message={emptyMessage} />}
    </div>
  )
}
