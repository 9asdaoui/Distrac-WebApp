import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import {
  BOUNDARY_LABEL_MIN_ZOOM,
  BOUNDARY_TOOLTIP_OPTIONS,
  boundaryGeometryKey,
  regionPathOptions,
  sectorPathOptions,
} from './mapBoundaryStyles'

function bindHoverTooltip(polygon, label, enabled) {
  polygon.unbindTooltip()
  if (!enabled || !label) return
  polygon.bindTooltip(label, BOUNDARY_TOOLTIP_OPTIONS)
}

/**
 * Imperative region/sector polygons.
 * Does not touch layers while the map is panning/zooming — Leaflet drives the transform.
 */
export function MapBoundaryLayer({
  showRegions = false,
  showSectors = false,
  regionLayers = [],
  sectorLayers = [],
  mapZoom = 12,
  editingBoundary = null,
  regionEditDraw = null,
  canSelectEntities = true,
  isCreatingRegion = false,
  isEditingRegion = false,
  onSelect,
}) {
  const map = useMap()
  const groupRef = useRef(null)
  const polygonsRef = useRef(new Map())
  const geometryKeysRef = useRef(new Map())
  const isMapMovingRef = useRef(false)
  const pendingSyncRef = useRef(false)
  const onSelectRef = useRef(onSelect)
  const editingId = editingBoundary?.entityType === 'sector' ? editingBoundary.id : null

  onSelectRef.current = onSelect

  useEffect(() => {
    if (!map) return undefined

    const onMoveStart = () => {
      isMapMovingRef.current = true
    }
    const onMoveEnd = () => {
      isMapMovingRef.current = false
      if (pendingSyncRef.current) {
        pendingSyncRef.current = false
        syncRef.current?.()
      }
    }

    map.on('movestart', onMoveStart)
    map.on('moveend', onMoveEnd)
    map.on('zoomstart', onMoveStart)
    map.on('zoomend', onMoveEnd)

    return () => {
      map.off('movestart', onMoveStart)
      map.off('moveend', onMoveEnd)
      map.off('zoomstart', onMoveStart)
      map.off('zoomend', onMoveEnd)
    }
  }, [map])

  const syncRef = useRef(null)

  syncRef.current = () => {
    if (!map) return
    if (isMapMovingRef.current) {
      pendingSyncRef.current = true
      return
    }

    if (!groupRef.current) {
      groupRef.current = L.layerGroup().addTo(map)
    }

    const group = groupRef.current
    const nextKeys = new Set()
    const showLabels = mapZoom >= BOUNDARY_LABEL_MIN_ZOOM

    if (showRegions) {
      for (const { region, rings } of regionLayers) {
        const isThisBeingEdited =
          editingBoundary?.entityType === 'region' && editingBoundary.id === region.id
        if (regionEditDraw?.regionId === region.id) continue

        const renderRings =
          isThisBeingEdited && editingBoundary?.rings ? editingBoundary.rings : rings
        const isClickable =
          canSelectEntities && !isThisBeingEdited && !isCreatingRegion && !isEditingRegion
        const label = region.region_name || region.code || 'Region'
        const pathOpts = regionPathOptions({ isBeingEdited: isThisBeingEdited })
        const geomKey = boundaryGeometryKey('region', region.id, renderRings)

        renderRings.forEach((positions, ringIndex) => {
          if (!positions?.length) return
          const key = `region-${region.id}-${ringIndex}`
          nextKeys.add(key)

          let polygon = polygonsRef.current.get(key)
          const prevGeom = geometryKeysRef.current.get(key)

          if (!polygon) {
            polygon = L.polygon(positions, pathOpts)
            if (isClickable) {
              polygon.on('click', () =>
                onSelectRef.current?.({
                  type: 'region',
                  id: region.id,
                  name: label,
                }),
              )
            }
            group.addLayer(polygon)
            polygonsRef.current.set(key, polygon)
            geometryKeysRef.current.set(key, geomKey)
          } else if (prevGeom !== geomKey) {
            polygon.setLatLngs(positions)
            polygon.setStyle(pathOpts)
            geometryKeysRef.current.set(key, geomKey)
          }

          bindHoverTooltip(polygon, label, isClickable && showLabels)
        })
      }
    }

    if (showSectors) {
      for (const { sector, rings, style } of sectorLayers) {
        const isThisBeingEdited = editingId && sector.id === editingId
        const renderRings =
          isThisBeingEdited && editingBoundary?.rings ? editingBoundary.rings : rings
        const isClickable = canSelectEntities && !isThisBeingEdited
        const label = sector.sector_name || 'Sector'
        const pathOpts = sectorPathOptions({ style, isBeingEdited: isThisBeingEdited })
        const geomKey = boundaryGeometryKey('sector', sector.id, renderRings)

        renderRings.forEach((positions, ringIndex) => {
          if (!positions?.length) return
          const key = `sector-${sector.id}-${ringIndex}`
          nextKeys.add(key)

          let polygon = polygonsRef.current.get(key)
          const prevGeom = geometryKeysRef.current.get(key)

          if (!polygon) {
            polygon = L.polygon(positions, pathOpts)
            if (isClickable) {
              polygon.on('click', () =>
                onSelectRef.current?.({
                  type: 'sector',
                  id: sector.id,
                  name: label,
                }),
              )
            }
            group.addLayer(polygon)
            polygonsRef.current.set(key, polygon)
            geometryKeysRef.current.set(key, geomKey)
          } else if (prevGeom !== geomKey) {
            polygon.setLatLngs(positions)
            polygon.setStyle(pathOpts)
            geometryKeysRef.current.set(key, geomKey)
          }

          bindHoverTooltip(polygon, label, isClickable && showLabels)
        })
      }
    }

    for (const [key, polygon] of polygonsRef.current.entries()) {
      if (!nextKeys.has(key)) {
        group.removeLayer(polygon)
        polygonsRef.current.delete(key)
        geometryKeysRef.current.delete(key)
      }
    }
  }

  useEffect(() => {
    syncRef.current?.()
  }, [
    map,
    showRegions,
    showSectors,
    regionLayers,
    sectorLayers,
    mapZoom,
    editingBoundary,
    regionEditDraw,
    editingId,
    canSelectEntities,
    isCreatingRegion,
    isEditingRegion,
  ])

  useEffect(
    () => () => {
      if (groupRef.current && map) {
        map.removeLayer(groupRef.current)
        groupRef.current = null
        polygonsRef.current.clear()
        geometryKeysRef.current.clear()
      }
    },
    [map],
  )

  return null
}
