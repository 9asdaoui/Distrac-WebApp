import L from 'leaflet'

const POSITION_EPSILON = 0.00005
const MARKER_FADE_MS = 150

function fadeInMarkerElement(marker) {
  const el = marker?.getElement?.()
  if (!el) return
  el.style.opacity = '0'
  el.style.transition = `opacity ${MARKER_FADE_MS}ms ease-out`
  requestAnimationFrame(() => {
    el.style.opacity = '1'
  })
}

function positionsEqual(a, b) {
  if (!a || !b) return false
  return (
    Math.abs(Number(a[0]) - Number(b[0])) < POSITION_EPSILON &&
    Math.abs(Number(a[1]) - Number(b[1])) < POSITION_EPSILON
  )
}

/**
 * Imperatively sync Leaflet markers in a layer group — update in place, no remount.
 */
export function syncMarkers(layerGroup, markers, options = {}) {
  if (!layerGroup) return

  const {
    getIcon,
    onMarkerClick,
    popupHtmlForMarker,
    draggableId = null,
    onDragEnd,
    selectedId = null,
    fadeInNew = false,
  } = options

  const nextById = new Map((markers || []).map((m) => [m.id, m]))
  const existingById = layerGroup.__entityMarkers || new Map()

  for (const [id, marker] of existingById.entries()) {
    if (!nextById.has(id)) {
      layerGroup.removeLayer(marker)
      existingById.delete(id)
    }
  }

  for (const item of markers || []) {
    const position = item.position || [item.lat, item.lng]
    if (!item.id || !position?.[0] || position?.[1] == null) continue

    const isSelected = selectedId != null && item.id === selectedId
    const icon = getIcon ? getIcon(item, isSelected) : undefined
    let leafletMarker = existingById.get(item.id)

    if (!leafletMarker) {
      leafletMarker = L.marker(position, {
        icon,
        draggable: draggableId === item.id,
      })
      leafletMarker.on('click', () => onMarkerClick?.(item))
      if (popupHtmlForMarker) {
        const html = popupHtmlForMarker(item)
        if (html) leafletMarker.bindPopup(html)
      }
      if (draggableId === item.id && onDragEnd) {
        leafletMarker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng()
          onDragEnd(item.id, [lat, lng])
        })
      }
      layerGroup.addLayer(leafletMarker)
      existingById.set(item.id, leafletMarker)
      if (fadeInNew) fadeInMarkerElement(leafletMarker)
    } else {
      const current = leafletMarker.getLatLng()
      if (!positionsEqual([current.lat, current.lng], position)) {
        leafletMarker.setLatLng(position)
      }
      if (icon) leafletMarker.setIcon(icon)
      const shouldDrag = draggableId === item.id
      if (leafletMarker.dragging) {
        if (shouldDrag && !leafletMarker.dragging.enabled()) leafletMarker.dragging.enable()
        if (!shouldDrag && leafletMarker.dragging.enabled()) leafletMarker.dragging.disable()
      }
    }
  }

  layerGroup.__entityMarkers = existingById
}
