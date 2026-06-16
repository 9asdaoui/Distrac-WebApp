import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { CLUSTER_ZOOM_THRESHOLD } from './mapLod'

const CLUSTER_ANIM_MS = 200

function clusterIcon(count, types = {}) {
  const clientN = types.client || 0
  const vehicleN = types.vehicle || 0
  const subtitle =
    clientN && vehicleN
      ? `${clientN} clients · ${vehicleN} vehicles`
      : clientN
        ? `${clientN} clients`
        : vehicleN
          ? `${vehicleN} vehicles`
          : `${count} pins`

  return L.divIcon({
    className: 'map-server-cluster',
    html: `<div class="map-server-cluster__badge" title="${subtitle}">
      <span class="map-server-cluster__count">${count}</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  })
}

function fadeInMarker(marker) {
  const el = marker?.getElement?.()
  if (!el) return
  el.style.opacity = '0'
  el.style.transform = 'scale(0.85)'
  el.style.transition = `opacity ${CLUSTER_ANIM_MS}ms ease-out, transform ${CLUSTER_ANIM_MS}ms ease-out`
  requestAnimationFrame(() => {
    el.style.opacity = '1'
    el.style.transform = 'scale(1)'
  })
}

function pulseMarker(marker) {
  const el = marker?.getElement?.()
  if (!el) return
  const badge = el.querySelector('.map-server-cluster__badge')
  if (!badge) return
  badge.style.transition = 'transform 180ms ease-out'
  badge.style.transform = 'scale(1.12)'
  setTimeout(() => {
    badge.style.transform = 'scale(1)'
  }, 180)
}

/**
 * Server-side viewport clusters — click expands by flying into cluster bounds.
 */
export function MapClusterLayer({
  clusters = [],
  enabled = true,
  onClusterClick,
  targetZoom = CLUSTER_ZOOM_THRESHOLD,
}) {
  const map = useMap()
  const groupRef = useRef(null)
  const markersRef = useRef(new Map())

  useEffect(() => {
    if (!map || !enabled) return undefined

    if (!groupRef.current) {
      groupRef.current = L.layerGroup().addTo(map)
    }

    const group = groupRef.current
    const nextById = new Map((clusters || []).map((c) => [c.id, c]))

    for (const [id, marker] of markersRef.current.entries()) {
      if (!nextById.has(id)) {
        group.removeLayer(marker)
        markersRef.current.delete(id)
      }
    }

    for (const cluster of clusters || []) {
      if (!cluster?.id || cluster.lat == null || cluster.lng == null) continue

      let marker = markersRef.current.get(cluster.id)
      if (!marker) {
        marker = L.marker([cluster.lat, cluster.lng], {
          icon: clusterIcon(cluster.count, cluster.types),
        })
        marker.on('click', () => {
          pulseMarker(marker)
          onClusterClick?.(cluster, { map, targetZoom })
        })
        group.addLayer(marker)
        markersRef.current.set(cluster.id, marker)
        fadeInMarker(marker)
      } else {
        marker.setLatLng([cluster.lat, cluster.lng])
        marker.setIcon(clusterIcon(cluster.count, cluster.types))
      }
    }

    return undefined
  }, [map, enabled, clusters, onClusterClick, targetZoom])

  useEffect(
    () => () => {
      if (groupRef.current && map) {
        map.removeLayer(groupRef.current)
        groupRef.current = null
        markersRef.current.clear()
      }
    },
    [map],
  )

  return null
}

export function flyToCluster(map, cluster, targetZoom = CLUSTER_ZOOM_THRESHOLD) {
  if (!map || !cluster) return

  const bounds = cluster.bounds
  if (bounds?.minLat != null) {
    const latLngBounds = L.latLngBounds(
      [bounds.minLat, bounds.minLng],
      [bounds.maxLat, bounds.maxLng],
    )
    const nextZoom = Math.max(map.getZoom() + 2, targetZoom)
    map.flyToBounds(latLngBounds, {
      padding: [48, 48],
      maxZoom: Math.min(nextZoom, 16),
      duration: 0.55,
    })
    return
  }

  map.flyTo([cluster.lat, cluster.lng], Math.max(map.getZoom() + 2, targetZoom), {
    duration: 0.55,
  })
}
