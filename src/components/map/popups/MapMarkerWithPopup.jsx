import React, { useEffect, useRef } from 'react'
import { Marker, Popup } from 'react-leaflet'

export function MapMarkerWithPopup({
  markerKey,
  position,
  icon,
  isSelected,
  onMarkerClick,
  popupContent,
  draggable = false,
  dragHandlers = {},
}) {
  const markerRef = useRef(null)

  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    if (isSelected) {
      marker.openPopup()
    } else {
      marker.closePopup()
    }
  }, [isSelected, position])

  return (
    <Marker
      ref={markerRef}
      key={markerKey}
      position={position}
      icon={icon}
      draggable={draggable}
      eventHandlers={{
        click: () => onMarkerClick?.(),
        ...dragHandlers,
      }}
    >
      <Popup className="map-entity-popup" closeButton={false} offset={[0, -14]} maxWidth={300}>
        {popupContent}
      </Popup>
    </Marker>
  )
}
