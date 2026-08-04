import { useEffect, useRef } from 'react'
import { hasGpsCoordinates } from '../../../components/LocationMap'
import { buildVehicleMarkers } from '../../../components/map/engine/mapMarkerBuilders'
import {
  getEntityDisplayName,
  getLogisticsModule,
} from '../../../components/logistics/logisticsModuleUi'
import { writeMapLayerVisibility } from '../../../components/map/mapLayerVisibility'
import { MAP_ENTITY_TYPE_BY_PANEL } from '../../../components/map/ccPanelRegistry'

/**
 * Sync map entity selection from `/clients/:id`-style paths (and optional ?tab=&focus=).
 */
export function useMapDeepLinks({
  panelState,
  searchParams,
  isLoading,
  industries,
  depots,
  sectors,
  clients,
  regions,
  vehicles,
  vehiclePositionById,
  mapInstance,
  flyToEntity,
  setMapLayerVisibility,
  setSelectedElement,
  setFollowVehicleId,
  selectedElement,
}) {
  const deepLinkHandledRef = useRef(null)
  const deepLinkVehicleRef = useRef(null)

  const entityType =
    panelState?.entityType ||
    (panelState?.panel ? MAP_ENTITY_TYPE_BY_PANEL[panelState.panel] : null)
  const entityId = panelState?.id

  useEffect(() => {
    if (!entityType || !entityId) return
    const mod = getLogisticsModule(entityType)
    const layer = mod?.mapFilter
    if (!layer) return
    setMapLayerVisibility((prev) => {
      if (prev?.[layer]) return prev
      const next = { ...prev, [layer]: true }
      writeMapLayerVisibility(next)
      return next
    })
  }, [entityType, entityId, setMapLayerVisibility])

  useEffect(() => {
    if (!entityType || !entityId) {
      deepLinkHandledRef.current = null
      return
    }
    if (isLoading) return

    const tab = searchParams.get('tab')
    const focus = searchParams.get('focus')
    const linkKey = `${entityType}:${entityId}:${tab || ''}:${focus || ''}`
    if (deepLinkHandledRef.current === linkKey) return
    if (selectedElement?.type === entityType && selectedElement?.id === entityId) {
      deepLinkHandledRef.current = linkKey
      return
    }

    const mod = getLogisticsModule(entityType)
    if (!mod) return

    const collections = {
      industry: industries,
      depot: depots,
      sector: sectors,
      client: clients,
      region: regions,
      vehicle: vehicles,
    }
    const list = collections[entityType] || []
    const row = list.find((item) => item.id === entityId)

    if (!row) {
      if (list.length > 0) {
        deepLinkHandledRef.current = linkKey
      }
      return
    }

    deepLinkHandledRef.current = linkKey

    setSelectedElement({
      type: entityType,
      id: row.id,
      name: getEntityDisplayName(entityType, row, mod.label),
      ...(entityType === 'depot' ? { isCentral: Boolean(row.is_central) } : {}),
      ...(tab ? { tab } : {}),
      ...(focus ? { focusId: focus } : {}),
    })

    if (!mapInstance) return

    if (entityType === 'vehicle') {
      deepLinkVehicleRef.current = row.id
      setFollowVehicleId(row.id)
    }

    flyToEntity(
      {
        type: entityType,
        id: row.id,
        name: getEntityDisplayName(entityType, row, mod.label),
      },
      {
        regions,
        sectors,
        industries,
        depots,
        clients,
        vehicles,
        vehiclePositionById,
        buildVehicleMarkers,
      },
    )
  }, [
    isLoading,
    entityType,
    entityId,
    industries,
    depots,
    sectors,
    clients,
    regions,
    vehicles,
    vehiclePositionById,
    mapInstance,
    searchParams,
    flyToEntity,
    setFollowVehicleId,
    setSelectedElement,
    selectedElement?.type,
    selectedElement?.id,
  ])

  // Leaving map-entity detail path clears selection (home or list without :id)
  useEffect(() => {
    if (!selectedElement) return
    const panelForType = Object.entries(MAP_ENTITY_TYPE_BY_PANEL).find(
      ([, t]) => t === selectedElement.type,
    )?.[0]
    if (!panelForType) return

    if (!panelState?.panel) {
      setSelectedElement(null)
      setFollowVehicleId(null)
      deepLinkHandledRef.current = null
      return
    }
    if (panelState.panel !== panelForType || !entityId) {
      setSelectedElement(null)
      setFollowVehicleId(null)
      deepLinkHandledRef.current = null
    }
  }, [
    entityId,
    panelState?.panel,
    selectedElement,
    setSelectedElement,
    setFollowVehicleId,
  ])

  useEffect(() => {
    const vehicleId = deepLinkVehicleRef.current
    if (!vehicleId || !mapInstance) return

    const live = vehiclePositionById[vehicleId]
    if (!live || !hasGpsCoordinates(live.lat, live.lng)) return

    const marker = buildVehicleMarkers(vehicles, depots, vehiclePositionById).find(
      (item) => item.id === vehicleId,
    )
    if (!marker?.isLive) return

    flyToEntity(
      { type: 'vehicle', id: vehicleId },
      {
        regions,
        sectors,
        industries,
        depots,
        clients,
        vehicles,
        vehiclePositionById,
        buildVehicleMarkers,
      },
    )
    deepLinkVehicleRef.current = null
  }, [
    vehiclePositionById,
    vehicles,
    depots,
    mapInstance,
    flyToEntity,
    regions,
    sectors,
    industries,
    clients,
  ])
}
