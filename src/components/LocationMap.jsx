import React, { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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

export function hasGpsCoordinates(lat, lng) {
  if (lat == null || lng == null) return false
  const latitude = Number(lat)
  const longitude = Number(lng)
  return Number.isFinite(latitude) && Number.isFinite(longitude)
}

export function LocationMap({ lat, lng, name, className = 'h-72' }) {
  const latitude = Number(lat)
  const longitude = Number(lng)
  const position = useMemo(() => [latitude, longitude], [latitude, longitude])

  return (
    <div className={`relative z-0 overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800 ${className}`}>
      <MapContainer
        center={position}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ minHeight: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position}>
          <Popup>{name || 'Location'}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
