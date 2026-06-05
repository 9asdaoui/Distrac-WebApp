import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { MAP_CRISP_VECTOR_RENDERER } from './mapVectorRenderer'

function refreshCrispVectors(map) {
  map.eachLayer((layer) => {
    if (layer?.options?.renderer !== MAP_CRISP_VECTOR_RENDERER) return
    if (typeof layer.redraw !== 'function') return
    try {
      layer.redraw()
    } catch {
      /* ignore layer redraw errors during animation */
    }
  })
}

/** Keeps boundary/draw vectors sharp while the map is flying or zooming. */
export function MapZoomVectorSync() {
  const map = useMap()

  useEffect(() => {
    const onZoomAnim = () => refreshCrispVectors(map)
    const onZoom = () => refreshCrispVectors(map)

    map.on('zoomanim', onZoomAnim)
    map.on('zoom', onZoom)

    return () => {
      map.off('zoomanim', onZoomAnim)
      map.off('zoom', onZoom)
    }
  }, [map])

  return null
}
