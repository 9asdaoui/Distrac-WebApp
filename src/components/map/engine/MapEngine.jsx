import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Polyline,
  Marker,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import {
  DARK_TILE_URL as TILE_URL,
  GLOBAL_MAP_TILE_OPTIONS,
} from '../mapTileLayer'
import { MapMarkerWithPopup } from '../popups/MapMarkerWithPopup'
import { VehicleMapPopupCard } from '../popups/VehicleMapPopupCard'
import { DepotMapPopupCard } from '../popups/DepotMapPopupCard'
import { IndustryMapPopupCard } from '../popups/IndustryMapPopupCard'
import { ClientMapPopupCard } from '../popups/ClientMapPopupCard'
import { MapMarkerClusterLayer, shouldClusterMarkers } from '../MapMarkerClusterLayer'
import { GlobalMapCommandBar } from '../GlobalMapCommandBar'
import { MapFollowHud } from '../MapFollowHud'
import {
  RegionBoundaryDraftLayers,
  RegionBoundaryDrawControls,
  RegionBoundaryEditableVertices,
  RegionBoundaryMapInteraction,
  RegionBoundaryTraceHighlight,
} from '../../RegionBoundaryDrawer'
import { applyMapLayerSearch } from '../mapLayerSearch'
import { useMapHudOffsetClass } from '../../../context/SidebarLayoutContext'
import { hasGpsCoordinates } from '../../LocationMap'
import { USE_MAP_VIEWPORT_BUNDLE } from '../../../pages/logistics/hooks/useMapViewport'
import { dedupeById } from '../../../pages/logistics/hooks/mapUtils'
import { MapEntityLayer } from './MapEntityLayer'
import { MapPlacePinLayer } from './MapPlacePinLayer'
import { MapClusterLayer } from './MapClusterLayer'
import { MapBoundaryLayer } from './MapBoundaryLayer'
import { iconForEntity } from './mapEntityIcons'
import { mergeLodWithFilter, resolveLodForZoom } from './mapLod'
import { MAP_FLY_OPTIONS } from './cameraController'
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MAP_HUD_GLASS,
} from './mapEngineConstants'
import {
  buildDepotColorMap,
  getSectorColor,
  polygonRingsFromBoundary,
} from './mapGeometryHelpers'
import {
  buildVehicleMarkers,
  vehicleLiveIcon,
  vehicleStaticIcon,
  clientIcon,
  industryIcon,
  normalDepotIcon,
  centralDepotIcon,
  vertexIcon,
} from './mapMarkerBuilders'

/** Auto-fit runs only when fitNonce changes (initial load / layer tab), not on live GPS polls. */
export function FitGlobalBounds({ positions, fitNonce }) {
  const map = useMap()
  const lastFitNonceRef = useRef(-1)

  useEffect(() => {
    if (!positions?.length || fitNonce == null || fitNonce === lastFitNonceRef.current) return
    lastFitNonceRef.current = fitNonce

    if (positions.length === 1) {
      map.flyTo(positions[0], 13, MAP_FLY_OPTIONS)
      return
    }
    map.flyToBounds(L.latLngBounds(positions), {
      ...MAP_FLY_OPTIONS,
      padding: [56, 56],
      maxZoom: 14,
    })
  }, [map, fitNonce, positions])

  return null
}

export function MapInstanceBridge({ onMapReady }) {
  const map = useMap()
  useEffect(() => {
    onMapReady(map)
    return () => onMapReady(null)
  }, [map, onMapReady])
  return null
}

/** Keeps Leaflet in sync when the map pane resizes — debounced to avoid jank during CSS transitions. */
export function MapCanvasResizeSync({ mapInstance, containerRef }) {
  useEffect(() => {
    const el = containerRef?.current
    if (!el || !mapInstance) return undefined

    let debounceTimer = null

    const invalidate = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        window.requestAnimationFrame(() => {
          try {
            mapInstance.invalidateSize({ animate: false })
          } catch (err) {
            console.warn('[GlobalMapPage] invalidateSize failed:', err)
          }
        })
      }, 120)
    }

    invalidate()
    const observer = new ResizeObserver(invalidate)
    observer.observe(el)
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      observer.disconnect()
    }
  }, [mapInstance, containerRef])

  return null
}

export function FloatingLegend({ depotColorEntries = [], isEditing = false }) {
  const { t } = useTranslation()
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-[1000]">
      <div className={`pointer-events-auto px-3 py-2.5 ${MAP_HUD_GLASS}`}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {t('commandCenter.legend.title')}
        </p>
        <div className="flex flex-col gap-1.5">
          {depotColorEntries.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-zinc-500">{t('commandCenter.legend.sectorsByDepot')}</p>
              {depotColorEntries.map(({ depotName, style }) => (
                <span key={depotName} className="inline-flex items-center gap-2 text-xs text-zinc-400">
                  <span
                    className="h-2.5 w-5 rounded-sm border-2"
                    style={{
                      borderColor: style.color,
                      backgroundColor: `${style.fillColor}26`,
                    }}
                  />
                  {depotName}
                </span>
              ))}
            </>
          )}
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-3 w-3 rounded-full border-2 border-zinc-900 bg-rose-500" />
            {t('commandCenter.legend.industry')}
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-3 w-3 rounded-full border-2 border-zinc-900 bg-amber-500" />
            {t('commandCenter.legend.central')}
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-3 w-3 rounded-full border-2 border-zinc-900 bg-blue-500" />
            {t('commandCenter.legend.depot')}
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-zinc-100 ring-2 ring-zinc-400/50 shadow-md" />
            {t('commandCenter.legend.client')}
          </span>
          {isEditing && (
            <span className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-amber-300">
              <span className="h-3 w-3 rounded-full bg-white shadow-[0_0_0_2px_rgba(245,158,11,0.5)]" />
              {t('commandCenter.legend.draggableCorner')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
export function MapEngine({
  sectors,
  regions,
  industries,
  depots,
  clients,
  vehicles,
  vehiclePositionById,
  vehicleTrail,
  missionRoutes = [],
  layerVisibility,
  mapLayerFilter,
  onMapLayerFilterChange,
  mapLayerSearch,
  onMapLayerSearchChange,
  onSelect,
  onMapReady,
  onRefreshMap,
  mapInstance,
  canvasRef,
  editingBoundary,
  onVertexDrag,
  editingClientId,
  onClientMarkerDrag,
  clientEditPosition,
  editingDepotId,
  onDepotMarkerDrag,
  depotEditPosition,
  editingIndustryId,
  onIndustryMarkerDrag,
  industryEditPosition,
  isEditingMap,
  isCreatingRegion,
  isCreatingIndustry = false,
  isEditingRegion,
  regionCreateDraw,
  regionEditDraw,
  autoFitNonce,
  selectedElement,
  showWialonStatus = false,
  wialonPulseNonce = 0,
  followVehicleId = null,
  onStopFollowVehicle,
  onReFollowVehicle,
  useImperativeMarkers = USE_MAP_VIEWPORT_BUNDLE,
  interactionMode = null,
  onMapPlacePin,
  isPlacingPin = false,
  industryCreatePinPosition = null,
  markerFadeInNew = false,
  mapZoom = 12,
  viewportClusters = [],
  useServerClusters = false,
  onClusterClick,
}) {
  const hudOffsetClass = useMapHudOffsetClass()
  const canSelectEntities = interactionMode?.canSelectEntities !== false

  const handleEntitySelect = useCallback(
    (payload) => {
      if (!canSelectEntities) return
      onSelect(payload)
    },
    [canSelectEntities, onSelect],
  )
  const activeRegionDraw = regionCreateDraw || regionEditDraw
  const mapData = useMemo(
    () =>
      applyMapLayerSearch(mapLayerFilter, mapLayerSearch, {
        regions,
        sectors,
        depots,
        industries,
        clients,
        vehicles,
      }),
    [mapLayerFilter, mapLayerSearch, regions, sectors, depots, industries, clients, vehicles],
  )

  const depotColorMap = useMemo(() => {
    const ids = [
      ...(mapData.depots || []).map((row) => row.id),
      ...(mapData.sectors || []).map((row) => row.depot_id),
    ]
    return buildDepotColorMap(ids)
  }, [mapData.depots, mapData.sectors])

  const depotColorEntries = useMemo(() => {
    const depotById = new Map(
      (mapData.depots || []).map((row) => [row.id, row.depot_name || 'Depot']),
    )
    return [...depotColorMap.entries()].map(([depotId, style]) => ({
      depotId,
      depotName: depotById.get(depotId) || `Depot ${depotId.slice(0, 8)}…`,
      style,
    }))
  }, [depotColorMap, mapData.depots])

  const regionLayers = useMemo(
    () =>
      (mapData.regions || []).map((region) => {
        const rings = polygonRingsFromBoundary(region.boundary)
        return { region, rings }
      }),
    [mapData.regions],
  )

  const sectorLayers = useMemo(
    () =>
      (mapData.sectors || []).map((sector) => {
        const rings = polygonRingsFromBoundary(sector.boundary)
        const isBeingEdited =
          editingBoundary?.entityType === 'sector' && editingBoundary.id === sector.id
        const depotIdForStyle =
          isBeingEdited && editingBoundary.previewDepotId !== undefined
            ? editingBoundary.previewDepotId || null
            : sector.depot_id
        const style = getSectorColor(depotIdForStyle, depotColorMap)
        return { sector, rings, style }
      }),
    [mapData.sectors, depotColorMap, editingBoundary],
  )

  const industryMarkers = useMemo(
    () =>
      dedupeById(mapData.industries)
        .map((row) => {
          const isBeingEdited = editingIndustryId === row.id
          const lat = isBeingEdited && industryEditPosition ? industryEditPosition[0] : row.gps_latitude
          const lng = isBeingEdited && industryEditPosition ? industryEditPosition[1] : row.gps_longitude
          if (!hasGpsCoordinates(lat, lng)) return null
          return {
            id: row.id,
            name: row.industry_name,
            position: [Number(lat), Number(lng)],
            markerKey: `industry-${row.id}-${Number(lat).toFixed(5)}-${Number(lng).toFixed(5)}-${isBeingEdited ? 'edit' : 'view'}`,
          }
        })
        .filter(Boolean),
    [mapData.industries, editingIndustryId, industryEditPosition],
  )

  const depotMarkers = useMemo(
    () =>
      dedupeById(mapData.depots)
        .map((row) => {
          const isBeingEdited = editingDepotId === row.id
          const lat = isBeingEdited && depotEditPosition ? depotEditPosition[0] : row.gps_latitude
          const lng = isBeingEdited && depotEditPosition ? depotEditPosition[1] : row.gps_longitude
          if (!hasGpsCoordinates(lat, lng)) return null
          return {
            id: row.id,
            name: row.depot_name,
            isCentral: Boolean(row.is_central),
            position: [Number(lat), Number(lng)],
            markerKey: `depot-${row.id}-${Number(lat).toFixed(5)}-${Number(lng).toFixed(5)}-${isBeingEdited ? 'edit' : 'view'}`,
          }
        })
        .filter(Boolean),
    [mapData.depots, editingDepotId, depotEditPosition],
  )

  const clientMarkers = useMemo(
    () =>
      dedupeById(mapData.clients)
        .map((row) => {
          const isBeingEdited = editingClientId === row.id
          const lat = isBeingEdited && clientEditPosition ? clientEditPosition[0] : row.gps_latitude
          const lng = isBeingEdited && clientEditPosition ? clientEditPosition[1] : row.gps_longitude
          if (!hasGpsCoordinates(lat, lng)) return null
          return {
            id: row.id,
            name: row.client_name || row.place_name || 'Client',
            position: [Number(lat), Number(lng)],
            markerKey: `client-${row.id}-${Number(lat).toFixed(5)}-${Number(lng).toFixed(5)}-${isBeingEdited ? 'edit' : 'view'}`,
          }
        })
        .filter(Boolean),
    [mapData.clients, editingClientId, clientEditPosition],
  )

  const vehicleMarkers = useMemo(
    () => buildVehicleMarkers(mapData.vehicles, mapData.depots, vehiclePositionById),
    [mapData.vehicles, mapData.depots, vehiclePositionById],
  )

  const industryById = useMemo(
    () => new Map((industries || []).map((row) => [row.id, row])),
    [industries],
  )
  const depotById = useMemo(() => new Map((depots || []).map((row) => [row.id, row])), [depots])
  const clientById = useMemo(() => new Map((clients || []).map((row) => [row.id, row])), [clients])
  const vehicleById = useMemo(() => new Map((vehicles || []).map((row) => [row.id, row])), [vehicles])
  const sectorCountByDepot = useMemo(() => {
    const counts = new Map()
    for (const sector of sectors || []) {
      if (!sector.depot_id) continue
      counts.set(sector.depot_id, (counts.get(sector.depot_id) || 0) + 1)
    }
    return counts
  }, [sectors])

  const isSelected = (type, id) =>
    selectedElement?.type === type && selectedElement?.id === id

  const clusterClientMarkers = useMemo(
    () =>
      clientMarkers.map((marker) => ({
        position: marker.position,
        icon: clientIcon,
        popupHtml: `<strong>${marker.name || 'Client'}</strong>`,
        onClick: () => handleEntitySelect({ type: 'client', id: marker.id, name: marker.name }),
      })),
    [clientMarkers, handleEntitySelect],
  )

  const clusterVehicleMarkers = useMemo(
    () =>
      vehicleMarkers.map((marker) => ({
        position: marker.position,
        icon: marker.isLive ? vehicleLiveIcon : vehicleStaticIcon,
        popupHtml: `<strong>${marker.name || 'Vehicle'}</strong>`,
        onClick: () => handleEntitySelect({ type: 'vehicle', id: marker.id, name: marker.name }),
      })),
    [vehicleMarkers, handleEntitySelect],
  )

  const useClientCluster =
    !useServerClusters && shouldClusterMarkers(clientMarkers.length)
  const useVehicleCluster =
    !useServerClusters && shouldClusterMarkers(vehicleMarkers.length)

  const mapLod = useMemo(
    () => mergeLodWithFilter(resolveLodForZoom(mapZoom), layerVisibility),
    [mapZoom, layerVisibility],
  )

  const show = useMemo(
    () => ({
      regions: mapLod.showRegions,
      sectors: mapLod.showSectors,
      industries: mapLod.showIndustries,
      depots: mapLod.showDepots,
      clients: mapLod.showClients,
      vehicles: mapLod.showVehicles,
    }),
    [mapLod],
  )


  /* Bounds from full layer data — not search-filtered — so the viewport stays stable while typing. */
  const fitPositions = useMemo(() => {
    const fullData = applyMapLayerSearch(mapLayerFilter, '', {
      regions,
      sectors,
      depots,
      industries,
      clients,
      vehicles,
    })
    const points = []

    if (show.regions) {
      for (const region of fullData.regions || []) {
        const rings = polygonRingsFromBoundary(region.boundary)
        for (const ring of rings) points.push(...ring)
      }
    }
    if (show.sectors) {
      for (const sector of fullData.sectors || []) {
        const rings = polygonRingsFromBoundary(sector.boundary)
        for (const ring of rings) points.push(...ring)
      }
    }
    if (show.industries) {
      for (const row of dedupeById(fullData.industries)) {
        if (hasGpsCoordinates(row.gps_latitude, row.gps_longitude)) {
          points.push([Number(row.gps_latitude), Number(row.gps_longitude)])
        }
      }
    }
    if (show.depots) {
      for (const row of dedupeById(fullData.depots)) {
        if (hasGpsCoordinates(row.gps_latitude, row.gps_longitude)) {
          points.push([Number(row.gps_latitude), Number(row.gps_longitude)])
        }
      }
    }
    if (show.clients) {
      for (const row of dedupeById(fullData.clients)) {
        if (hasGpsCoordinates(row.gps_latitude, row.gps_longitude)) {
          points.push([Number(row.gps_latitude), Number(row.gps_longitude)])
        }
      }
    }
    if (show.vehicles) {
      // Depot anchors only — live GPS must not shift auto-fit bounds on each poll.
      for (const marker of buildVehicleMarkers(fullData.vehicles, fullData.depots, {})) {
        points.push(marker.position)
      }
    }
    return points
  }, [show, mapLayerFilter, regions, sectors, depots, industries, clients, vehicles])

  return (
    <div
      ref={canvasRef}
      className={`global-map-canvas relative h-full min-h-0 w-full ${
        interactionMode?.mapClass || ''
      } ${
        activeRegionDraw?.isMapInteractionActive ? 'sector-boundary-map--drawing' : ''
      } ${activeRegionDraw?.enableVertexEdit ? 'sector-boundary-map--vertex-edit' : ''}`}
      style={interactionMode?.cursor ? { cursor: interactionMode.cursor } : undefined}
    >
      <MapContainer
        center={fitPositions[0] || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="absolute inset-0 z-0 h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer url={TILE_URL} {...GLOBAL_MAP_TILE_OPTIONS} />
        {fitPositions.length > 0 && <FitGlobalBounds positions={fitPositions} fitNonce={autoFitNonce} />}
        <MapInstanceBridge onMapReady={onMapReady} />
        <MapCanvasResizeSync mapInstance={mapInstance} containerRef={canvasRef} />

        <MapBoundaryLayer
          showRegions={show.regions}
          showSectors={show.sectors}
          regionLayers={regionLayers}
          sectorLayers={sectorLayers}
          mapZoom={mapZoom}
          editingBoundary={editingBoundary}
          regionEditDraw={regionEditDraw}
          canSelectEntities={canSelectEntities}
          isCreatingRegion={isCreatingRegion}
          isEditingRegion={isEditingRegion}
          onSelect={handleEntitySelect}
        />

        {/*
          When editing a sector, render a small draggable white dot on each
          vertex. Dragging updates the coordinate at that index in the rings
          array (see handleVertexDrag in the page); the Polygon above is
          bound to the same rings state, so the shape naturally follows.
        */}
        {editingBoundary &&
          Array.isArray(editingBoundary.rings) &&
          editingBoundary.entityType === 'sector' &&
          show.sectors && (
          <>
            {editingBoundary.rings.flatMap((ring, ringIndex) =>
              ring.map(([lat, lng], vertexIndex) => (
                <Marker
                  key={`vertex-${editingBoundary.entityType}-${editingBoundary.id}-${ringIndex}-${vertexIndex}`}
                  position={[lat, lng]}
                  icon={vertexIcon}
                  draggable
                  eventHandlers={{
                    dragend: (e) => {
                      const { lat: nlat, lng: nlng } = e.target.getLatLng()
                      onVertexDrag(ringIndex, vertexIndex, [nlat, nlng])
                    },
                  }}
                />
              )),
            )}
          </>
        )}

        {show.industries &&
          industryMarkers.map((marker) => {
          const isDraggable = editingIndustryId && marker.id === editingIndustryId
          const industry = industryById.get(marker.id)
          return (
          <MapMarkerWithPopup
            key={marker.markerKey || `industry-${marker.id}`}
            markerKey={marker.markerKey || `industry-${marker.id}`}
            position={marker.position}
            icon={industryIcon}
            isSelected={isSelected('industry', marker.id)}
            draggable={isDraggable}
            dragHandlers={
              isDraggable && onIndustryMarkerDrag
                ? { drag: onIndustryMarkerDrag, dragend: onIndustryMarkerDrag }
                : {}
            }
            onMarkerClick={() => handleEntitySelect({ type: 'industry', id: marker.id, name: marker.name })}
            popupContent={<IndustryMapPopupCard industry={industry} />}
          />
          )
        })}

        {show.depots &&
          depotMarkers.map((marker) => {
          const isDraggable = editingDepotId && marker.id === editingDepotId
          const depot = depotById.get(marker.id)
          return (
          <MapMarkerWithPopup
            key={marker.markerKey || `depot-${marker.id}`}
            markerKey={marker.markerKey || `depot-${marker.id}`}
            position={marker.position}
            icon={marker.isCentral ? centralDepotIcon : normalDepotIcon}
            isSelected={isSelected('depot', marker.id)}
            draggable={isDraggable}
            dragHandlers={isDraggable && onDepotMarkerDrag ? { dragend: onDepotMarkerDrag } : {}}
            onMarkerClick={() =>
              handleEntitySelect({
                type: 'depot',
                id: marker.id,
                name: marker.name,
                isCentral: marker.isCentral,
              })
            }
            popupContent={
              <DepotMapPopupCard
                depot={depot}
                sectorCount={sectorCountByDepot.get(marker.id) || 0}
              />
            }
          />
          )
        })}

        {useServerClusters && viewportClusters?.length > 0 ? (
          <MapClusterLayer
            enabled
            clusters={viewportClusters}
            onClusterClick={onClusterClick}
          />
        ) : null}

        {show.clients &&
          (useImperativeMarkers && !useClientCluster ? (
            <MapEntityLayer
              enabled
              entityType="client"
              markers={clientMarkers}
              selectedId={selectedElement?.type === 'client' ? selectedElement.id : null}
              getIcon={(item, isSelected) => iconForEntity('client', { isSelected })}
              onMarkerClick={handleEntitySelect}
              popupHtmlForMarker={(item) => `<strong>${item.name || 'Client'}</strong>`}
              draggableId={editingClientId}
              fadeInNew={markerFadeInNew}
              onDragEnd={(_id, pos) =>
                onClientMarkerDrag?.({
                  target: { getLatLng: () => ({ lat: pos[0], lng: pos[1] }) },
                })
              }
            />
          ) : useClientCluster ? (
            <MapMarkerClusterLayer enabled markers={clusterClientMarkers} />
          ) : (
          clientMarkers.map((marker) => {
          const isDraggable = editingClientId && marker.id === editingClientId
          const client = clientById.get(marker.id)
          return (
            <MapMarkerWithPopup
              key={marker.markerKey || `client-${marker.id}`}
              markerKey={marker.markerKey || `client-${marker.id}`}
              position={marker.position}
              icon={clientIcon}
              isSelected={isSelected('client', marker.id)}
              draggable={isDraggable}
              dragHandlers={isDraggable && onClientMarkerDrag ? { dragend: onClientMarkerDrag } : {}}
              onMarkerClick={() => handleEntitySelect({ type: 'client', id: marker.id, name: marker.name })}
              popupContent={<ClientMapPopupCard client={client} />}
            />
          )
        })
          ))}

        {show.vehicles && missionRoutes?.length > 0 &&
          missionRoutes.map((route) => (
            <Polyline
              key={`mission-route-${route.mission_id}`}
              positions={route.points}
              pathOptions={{
                color: '#38bdf8',
                weight: 2,
                opacity: 0.55,
                dashArray: '6 8',
              }}
            />
          ))}

        {show.vehicles && vehicleTrail?.length > 1 && (
          <Polyline
            positions={vehicleTrail}
            pathOptions={{
              color: '#f97316',
              weight: 3,
              opacity: 0.85,
            }}
          />
        )}

        {show.vehicles &&
          (useImperativeMarkers && !useVehicleCluster ? (
            <MapEntityLayer
              enabled
              entityType="vehicle"
              markers={vehicleMarkers}
              selectedId={selectedElement?.type === 'vehicle' ? selectedElement.id : null}
              getIcon={(item, isSelected) =>
                iconForEntity('vehicle', { isLive: item.isLive, isSelected })
              }
              onMarkerClick={handleEntitySelect}
              popupHtmlForMarker={(item) => `<strong>${item.name || 'Vehicle'}</strong>`}
              fadeInNew={markerFadeInNew}
            />
          ) : useVehicleCluster ? (
            <MapMarkerClusterLayer enabled markers={clusterVehicleMarkers} />
          ) : (
          vehicleMarkers.map((marker) => {
          const vehicle = vehicleById.get(marker.id)
          const livePosition = vehiclePositionById[marker.id] || null
          return (
            <MapMarkerWithPopup
              key={marker.markerKey || `vehicle-${marker.id}`}
              markerKey={marker.markerKey || `vehicle-${marker.id}`}
              position={marker.position}
              icon={marker.isLive ? vehicleLiveIcon : vehicleStaticIcon}
              isSelected={isSelected('vehicle', marker.id)}
              onMarkerClick={() =>
                handleEntitySelect({
                  type: 'vehicle',
                  id: marker.id,
                  name: marker.name,
                })
              }
              popupContent={
                <VehicleMapPopupCard
                  vehicle={vehicle}
                  livePosition={livePosition}
                  isLive={marker.isLive}
                />
              }
            />
          )
          })
          ))}

        {activeRegionDraw && (
          <>
            <RegionBoundaryTraceHighlight traceTarget={activeRegionDraw.traceTarget} />
            <RegionBoundaryMapInteraction
              isActive={activeRegionDraw.isMapInteractionActive}
              enableVertexEdit={activeRegionDraw.enableVertexEdit}
              onPointAdd={activeRegionDraw.onPointAdd}
              onCursorMove={activeRegionDraw.onCursorMove}
              onCursorLeave={activeRegionDraw.onCursorLeave}
              onVertexEditClick={activeRegionDraw.onVertexEditClick}
            />
            <RegionBoundaryDraftLayers
              points={activeRegionDraw.points}
              cursorPosition={activeRegionDraw.cursorPosition}
              isDrawing={
                activeRegionDraw.isDrawing || activeRegionDraw.interactionMode === 'trace'
              }
              isSaved={activeRegionDraw.isSaved}
              tracePreviewArc={activeRegionDraw.tracePreviewArc}
              showVertexMarkers={!activeRegionDraw.enableVertexEdit}
              onEdgeClick={
                activeRegionDraw.enableVertexEdit
                  ? activeRegionDraw.onVertexEditClick
                  : undefined
              }
            />
            <RegionBoundaryEditableVertices
              points={activeRegionDraw.points}
              enabled={activeRegionDraw.enableVertexEdit}
              onVertexDrag={activeRegionDraw.onVertexDrag}
            />
          </>
        )}

        {isPlacingPin && onMapPlacePin ? (
          <MapPlacePinLayer
            enabled={isPlacingPin}
            onPlace={onMapPlacePin}
            hint="Click the map to place the industry pin"
          />
        ) : null}

        {isCreatingIndustry && industryCreatePinPosition ? (
          <Marker position={industryCreatePinPosition} icon={industryIcon} />
        ) : null}
      </MapContainer>

      {activeRegionDraw && (
        <RegionBoundaryDrawControls
          className={hudOffsetClass}
          isDrawing={activeRegionDraw.isDrawing}
          pointCount={activeRegionDraw.points.length}
          interactionMode={activeRegionDraw.interactionMode}
          tracePickRegionId={activeRegionDraw.tracePickRegionId}
          traceableRegions={activeRegionDraw.traceableRegions}
          onToggleDraw={activeRegionDraw.onToggleDraw}
          onStartTracePick={activeRegionDraw.onStartTracePick}
          onLeaveTrace={activeRegionDraw.onLeaveTrace}
          onCancelTracePick={activeRegionDraw.onCancelTracePick}
          onTracePickRegionChange={activeRegionDraw.onTracePickRegionChange}
          onUndo={activeRegionDraw.onUndo}
          onClear={activeRegionDraw.onClear}
          onSave={activeRegionDraw.onSave}
        />
      )}

      <GlobalMapCommandBar
        hudOffsetClass={hudOffsetClass}
        filter={mapLayerFilter}
        onFilterChange={onMapLayerFilterChange}
        searchQuery={mapLayerSearch}
        onSearchChange={onMapLayerSearchChange}
        searchDisabled={isCreatingRegion || isCreatingIndustry}
        onRefresh={onRefreshMap}
        showWialonStatus={showWialonStatus}
        wialonPulseNonce={wialonPulseNonce}
        modeHint={interactionMode?.hint || ''}
        modeBadge={interactionMode?.badge}
      />
      {show.sectors && (
        <FloatingLegend depotColorEntries={depotColorEntries} isEditing={isEditingMap} />
      )}

      {selectedElement?.type === 'vehicle' && (
        <MapFollowHud
          followVehicleId={followVehicleId}
          selectedVehicleId={selectedElement.id}
          onStopFollow={() => onStopFollowVehicle?.()}
          onReFollow={onReFollowVehicle}
        />
      )}
    </div>
  )
}