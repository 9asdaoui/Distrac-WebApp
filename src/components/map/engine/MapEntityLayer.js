import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { syncMarkers } from './syncMarkers'

/**
 * Imperative point layer — patches markers in place instead of React remounts.
 */
export function MapEntityLayer({
  markers,
  entityType,
  enabled = true,
  selectedId = null,
  getIcon,
  onMarkerClick,
  popupHtmlForMarker,
  draggableId = null,
  onDragEnd,
  fadeInNew = false,
}) {
  const map = useMap()
  const groupRef = useRef(null)

  useEffect(() => {
    if (!map || !enabled) return undefined

    if (!groupRef.current) {
      groupRef.current = L.layerGroup().addTo(map)
    }

    syncMarkers(groupRef.current, markers, {
      getIcon: getIcon || ((item, isSelected) => item.icon),
      onMarkerClick: (item) =>
        onMarkerClick?.({
          type: entityType,
          id: item.id,
          name: item.name || item.label,
        }),
      popupHtmlForMarker,
      draggableId,
      onDragEnd,
      selectedId,
      fadeInNew,
    })

    return undefined
  }, [
    map,
    enabled,
    markers,
    entityType,
    selectedId,
    getIcon,
    onMarkerClick,
    popupHtmlForMarker,
    draggableId,
    onDragEnd,
    fadeInNew,
  ])

  useEffect(() => {
    return () => {
      if (groupRef.current && map) {
        map.removeLayer(groupRef.current)
        groupRef.current = null
      }
    }
  }, [map])

  return null
}
