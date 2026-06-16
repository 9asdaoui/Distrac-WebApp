import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

const CLUSTER_THRESHOLD = 40

/**
 * Imperative marker cluster for dense point layers (clients / vehicles).
 * Uses Leaflet popups only; selection still opens the right detail rail.
 */
export function MapMarkerClusterLayer({ markers, enabled }) {
  const map = useMap()

  useEffect(() => {
    if (!enabled || !markers?.length) return undefined

    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
    })

    for (const item of markers) {
      const marker = L.marker(item.position, { icon: item.icon })
      if (item.popupHtml) {
        marker.bindPopup(item.popupHtml)
      }
      marker.on('click', () => item.onClick?.())
      group.addLayer(marker)
    }

    map.addLayer(group)
    return () => {
      map.removeLayer(group)
    }
  }, [map, enabled, markers])

  return null
}

export function shouldClusterMarkers(count) {
  return count >= CLUSTER_THRESHOLD
}
