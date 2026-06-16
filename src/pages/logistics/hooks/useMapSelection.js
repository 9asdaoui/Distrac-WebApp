import { useCallback, useState } from 'react'
import { emitMapEvent, MAP_EVENTS } from '../../../components/map/engine/mapEventBus'

export function useMapSelection() {
  const [selectedElement, setSelectedElementState] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)

  const setSelectedElement = useCallback((next) => {
    setSelectedElementState(next)
    emitMapEvent(MAP_EVENTS.SELECTION_CHANGED, next)
  }, [])

  return {
    selectedElement,
    setSelectedElement,
    mapInstance,
    setMapInstance,
  }
}
