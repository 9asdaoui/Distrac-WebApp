import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  readMapLayerVisibility,
  writeMapLayerVisibility,
} from '../../components/map/mapLayerVisibility'
import { useAuth } from '../../context/AuthContext'
import { hasGpsCoordinates } from '../../components/LocationMap'
import { useMapHudOffsetClass } from '../../context/SidebarLayoutContext'
import { flyToCluster } from '../../components/map/engine/MapClusterLayer'
import { simplifyLatLngTrail } from '../../components/map/engine/mapTrailSimplify'
import { buildVehicleMarkers } from '../../components/map/engine/mapMarkerBuilders'
import { DEPOT_FILTER_ALL, createDayPeriod } from '../../components/map/CcMissionFiltersContext'
import { useMapData } from './hooks/useMapData'
import { useMapClients } from './hooks/useMapClients'
import { useVehicleTracking } from './hooks/useVehicleTracking'
import { useMapViewport, USE_MAP_VIEWPORT_BUNDLE } from './hooks/useMapViewport'
import { useMapBoundaries } from './hooks/useMapBoundaries'
import { useMapInstrumentation } from './hooks/useMapInstrumentation'
import { useMapInteractionMode } from './hooks/useMapInteractionMode'
import { useMapCamera } from './hooks/useMapCamera'
import { useSmoothVehicleTrail } from './hooks/useSmoothVehicleTrail'
import { useMapSelection } from './hooks/useMapSelection'
import { useMissionOverlay, isMissionOverlayEnabled } from './hooks/useMissionOverlay'
import { useWialonFreshness } from './hooks/useWialonFreshness'
import { useCommandCenterUrl } from './commandCenter/useCommandCenterUrl'
import { useMapDeepLinks } from './commandCenter/useMapDeepLinks'
import { useMapCreateSession } from './commandCenter/useMapCreateSession'
import { useMapEditSession } from './commandCenter/useMapEditSession'
import { useMapEditScope } from '../../hooks/useMapEditScope'
import { MapColumn } from './commandCenter/MapColumn'
import { RightRailRouter } from './commandCenter/RightRailRouter'
import { CommandCenterShell } from './commandCenter/CommandCenterShell'
import { useNavigate } from 'react-router-dom'
import {
  buildGlobalMapEntityHref,
  MAP_PANEL_BY_ENTITY_TYPE,
} from '../../components/map/ccPanelRegistry'

export function GlobalMapPage() {
  const navigate = useNavigate()
  const { hasPermission, user } = useAuth()
  const canManageLogistics = hasPermission('manage_logistics')
  const mapEditScope = useMapEditScope()
  const { canEditMapEntity, canCreateMapEntity, canUpdateClientCredit } = mapEditScope
  const hudOffsetClass = useMapHudOffsetClass()
  const mapCanvasRef = useRef(null)
  const prevLoadingRef = useRef(true)
  const resetEditRef = useRef(() => {})
  const setDetailsRef = useRef(null)

  const [mapLayerVisibility, setMapLayerVisibility] = useState(() => readMapLayerVisibility())
  const [missionPeriod, setMissionPeriod] = useState(() => createDayPeriod())
  const [depotId, setDepotId] = useState(DEPOT_FILTER_ALL)
  const [missionStatus, setMissionStatus] = useState('ALL')
  const [autoFitNonce, setAutoFitNonce] = useState(0)
  const [toast, setToast] = useState('')
  const [wialonLinkVehicle, setWialonLinkVehicle] = useState(null)

  const onToast = useCallback((message) => setToast(message), [])

  const {
    sectors,
    depots,
    industries,
    regions,
    clients,
    vehicles,
    isLoading,
    isInitialLoading,
    isRefreshing,
    loadError,
    refreshMapData,
    refreshMapDataNow,
    setClients,
    setRegions,
    setVehicles,
    setSectors,
    setDepots,
    setIndustries,
  } = useMapData()

  const { selectedElement, setSelectedElement, mapInstance, setMapInstance } = useMapSelection()
  const { flyToEntity, flyToLatLng, easeFollowTo, programmaticMapMoveRef } = useMapCamera(mapInstance)
  const {
    recordViewportFetch,
    recordMoveEndStart,
    recordMarkersPainted,
    recordVehiclePollCommit,
  } = useMapInstrumentation()

  const selectedVehicleId =
    selectedElement?.type === 'vehicle' ? selectedElement.id : null

  const handleTrailLoaded = useCallback(({ vehicleId, trips, trailMeta }) => {
    setDetailsRef.current?.((prev) =>
      prev && prev.id === vehicleId ? { ...prev, recentTrips: trips, trailMeta } : prev,
    )
  }, [])

  const {
    trackedVehicles,
    vehicleTrail,
    followVehicleId,
    setFollowVehicleId,
    fetchVehiclePositions,
    fetchVehicleTrail,
    mergeViewportVehiclePins,
  } = useVehicleTracking({
    mapLayerVisibility,
    isLoading,
    selectedVehicleId,
    onTrailLoaded: handleTrailLoaded,
    recordVehiclePollCommit,
  })

  const { reloadViewport, clusters, mapZoom, viewportClustered } = useMapViewport({
    mapInstance,
    mapLayerVisibility,
    isLoading,
    setClients,
    onVehiclePins: mergeViewportVehiclePins,
    recordViewportFetch,
    recordMoveEndStart,
    recordMarkersPainted,
    enabled: USE_MAP_VIEWPORT_BUNDLE,
  })

  useMapBoundaries({
    mapInstance,
    isLoading,
    setRegions,
    setSectors,
    enabled: false,
  })

  const editSession = useMapEditSession({
    selectedElement,
    setSelectedElement,
    vehicles,
    trackedVehicles,
    regions,
    setRegions,
    setSectors,
    setVehicles,
    setDepots,
    setIndustries,
    setClients,
    canManageLogistics,
    canEditMapEntity,
    scopedDepotIds: mapEditScope.scopedDepotIds,
    mapInstance,
    setFollowVehicleId,
    onToast,
  })

  useEffect(() => {
    setDetailsRef.current = editSession.setDetails
  }, [editSession.setDetails])

  resetEditRef.current = editSession.resetEditForm

  const ccUrl = useCommandCenterUrl({
    hasPermission,
    canManageLogistics,
    canCreateMapEntity,
    mapLayerVisibility,
    selectedElement,
    setSelectedElement,
    setFollowVehicleId,
    onResetEditState: () => resetEditRef.current(),
  })

  const {
    panelState,
    missionsPanelActive,
    missionFocusActive,
    mapAdminPanelActive,
    focusedMissionDetail,
    mapLayerSearch,
    railOpen,
    setRailOpen,
    showErpPanel,
    handlePanelChange,
    handleMapLayerSearchChange,
    handleNavigate,
    isCreatingRegion,
    isCreatingIndustry,
    searchParams,
    setSearchParams,
  } = ccUrl

  useEffect(() => {
    if (!mapInstance) return undefined
    const run = () => {
      try {
        mapInstance.invalidateSize({ animate: false })
      } catch (err) {
        console.warn('[GlobalMapPage] invalidateSize failed:', err)
      }
    }
    run()
    const timer = setTimeout(run, 320)
    return () => clearTimeout(timer)
  }, [mapInstance, railOpen])

  const createSession = useMapCreateSession({
    canManageLogistics,
    canCreateMapEntity,
    regions,
    setMapLayerVisibility,
    setSelectedElement,
    onClearEdit: () => resetEditRef.current(),
    refreshMapData,
    onToast,
  })

  const vehiclePositionById = useMemo(() => {
    const map = {}
    for (const row of trackedVehicles) {
      if (row?.position) map[row.id] = row.position
    }
    return map
  }, [trackedVehicles])

  useMapDeepLinks({
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
  })

  const missionOverlayEnabled =
    !missionsPanelActive && isMissionOverlayEnabled(mapLayerVisibility) && !isLoading

  const mapBbox = useMemo(() => {
    if (!mapInstance || missionsPanelActive) return null
    const bounds = mapInstance.getBounds()
    return {
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    }
  }, [mapInstance, mapZoom, missionsPanelActive])

  const { missionRoutes, reloadMissionOverlay } = useMissionOverlay({
    enabled: missionOverlayEnabled,
    mapBbox,
    date: null,
    depotId: null,
    status: 'ACTIVE',
  })

  const { wialonPulseNonce } = useWialonFreshness({
    enabled: Boolean(mapLayerVisibility.vehicles),
  })

  useMapClients({
    mapInstance,
    mapLayerVisibility,
    isLoading,
    setClients,
    enabled: !USE_MAP_VIEWPORT_BUNDLE,
  })

  const layerVisibility = useMemo(() => {
    if (missionFocusActive) {
      return Object.fromEntries(
        Object.keys(DEFAULT_MAP_LAYER_VISIBILITY).map((id) => [id, false]),
      )
    }
    return mapLayerVisibility
  }, [missionFocusActive, mapLayerVisibility])

  const handleMapLayerVisibilityChange = useCallback((next) => {
    setMapLayerVisibility(next)
    writeMapLayerVisibility(next)
  }, [])

  const cameraContext = useMemo(
    () => ({
      regions,
      sectors,
      industries,
      depots,
      clients,
      vehicles,
      vehiclePositionById,
      buildVehicleMarkers,
    }),
    [regions, sectors, industries, depots, clients, vehicles, vehiclePositionById],
  )

  const displayedVehicleTrail = useSmoothVehicleTrail(
    vehicleTrail,
    selectedVehicleId || followVehicleId || null,
    trackedVehicles,
  )

  const renderedVehicleTrail = useMemo(
    () => simplifyLatLngTrail(displayedVehicleTrail, mapZoom),
    [displayedVehicleTrail, mapZoom],
  )

  const useServerClusters = viewportClustered && clusters.length > 0

  const isEditingRegion = editSession.isEditing && selectedElement?.type === 'region'

  const { hint: interactionModeHint, ...interactionMode } = useMapInteractionMode({
    isEditing: editSession.isEditing,
    isCreatingRegion,
    isCreatingIndustry,
    isPlacingPin: createSession.isPlacingIndustryPin,
    followVehicleId,
    selectedElement,
  })

  useEffect(() => {
    writeMapLayerVisibility(mapLayerVisibility)
  }, [mapLayerVisibility])

  useEffect(() => {
    if (!isLoading) setAutoFitNonce((n) => n + 1)
  }, [mapLayerVisibility, isLoading])

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) setAutoFitNonce((n) => n + 1)
    prevLoadingRef.current = isLoading
  }, [isLoading])

  useEffect(() => {
    if (!mapInstance || !followVehicleId) return undefined
    const stopFollow = () => {
      if (programmaticMapMoveRef.current) return
      setFollowVehicleId(null)
    }
    mapInstance.on('dragstart', stopFollow)
    mapInstance.on('zoomstart', stopFollow)
    return () => {
      mapInstance.off('dragstart', stopFollow)
      mapInstance.off('zoomstart', stopFollow)
    }
  }, [mapInstance, followVehicleId, setFollowVehicleId, programmaticMapMoveRef])

  useEffect(() => {
    if (!mapInstance || !followVehicleId || programmaticMapMoveRef.current) return
    const tracked = trackedVehicles.find((row) => row.id === followVehicleId)
    const pos = tracked?.position
    if (!pos || !hasGpsCoordinates(pos.lat, pos.lng)) return
    easeFollowTo(pos.lat, pos.lng)
  }, [mapInstance, followVehicleId, trackedVehicles, easeFollowTo, programmaticMapMoveRef])

  const handleClusterClick = useCallback(
    (cluster) => {
      if (!mapInstance) return
      flyToCluster(mapInstance, cluster)
    },
    [mapInstance],
  )

  const handleSelect = useCallback(
    (payload) => {
      if (isCreatingRegion || isCreatingIndustry) return
      if (payload?.type && MAP_PANEL_BY_ENTITY_TYPE[payload.type] && payload.id != null) {
        if (payload.type !== 'vehicle') {
          setFollowVehicleId(null)
        } else {
          setFollowVehicleId(payload.id)
        }
        flyToEntity(payload, cameraContext)
        navigate(buildGlobalMapEntityHref(payload.type, payload.id))
        return
      }
      setSelectedElement(payload)
      if (payload?.type !== 'vehicle') {
        setFollowVehicleId(null)
      } else {
        setFollowVehicleId(payload.id)
      }
      flyToEntity(payload, cameraContext)
    },
    [
      isCreatingRegion,
      isCreatingIndustry,
      flyToEntity,
      cameraContext,
      setFollowVehicleId,
      setSelectedElement,
      navigate,
    ],
  )

  const handleMapRefresh = useCallback(() => {
    refreshMapDataNow()
    if (USE_MAP_VIEWPORT_BUNDLE) reloadViewport()
    fetchVehiclePositions()
    reloadMissionOverlay()
    if (selectedVehicleId) fetchVehicleTrail(selectedVehicleId)
  }, [
    refreshMapDataNow,
    reloadViewport,
    fetchVehiclePositions,
    fetchVehicleTrail,
    selectedVehicleId,
    reloadMissionOverlay,
  ])

  const handleMapReady = useCallback(
    (map) => {
      setMapInstance(map)
    },
    [setMapInstance],
  )

  const showEntityDetail = Boolean(selectedElement) || (mapAdminPanelActive && Boolean(panelState.id))

  const mapEngineProps = {
    sectors,
    regions,
    industries,
    depots,
    clients,
    vehicles,
    vehiclePositionById,
    vehicleTrail: renderedVehicleTrail,
    missionRoutes: missionsPanelActive ? [] : missionRoutes,
    showMissionRoutes:
      missionFocusActive || (!missionsPanelActive && isMissionOverlayEnabled(mapLayerVisibility)),
    focusedMissionId: missionFocusActive ? panelState.id : null,
    focusedMissionDetail: missionFocusActive ? focusedMissionDetail : null,
    suppressVehicleLayer: missionFocusActive,
    autoFitNonce,
    selectedElement,
    layerVisibility,
    mapLayerVisibility,
    onMapLayerVisibilityChange: handleMapLayerVisibilityChange,
    mapLayerSearchScope: mapAdminPanelActive ? panelState.panel : null,
    mapLayerSearch,
    onMapLayerSearchChange: handleMapLayerSearchChange,
    onSelect: handleSelect,
    onMapReady: handleMapReady,
    onRefreshMap: handleMapRefresh,
    mapInstance,
    canvasRef: mapCanvasRef,
    editingBoundary: editSession.editingBoundaryPayload,
    onVertexDrag: editSession.handleVertexDrag,
    editingClientId: editSession.editingClientId,
    onClientMarkerDrag: editSession.handleClientMarkerDrag,
    clientEditPosition: editSession.clientEditPosition,
    editingDepotId: editSession.editingDepotId,
    onDepotMarkerDrag: editSession.handleDepotMarkerDrag,
    depotEditPosition: editSession.depotEditPosition,
    editingIndustryId: editSession.editingIndustryId,
    onIndustryMarkerDrag: editSession.handleIndustryMarkerDrag,
    industryEditPosition: editSession.industryEditPosition,
    isEditingMap: editSession.isEditing,
    isCreatingRegion,
    isCreatingIndustry,
    isEditingRegion,
    regionCreateDraw: createSession.regionCreateDraw,
    regionEditDraw: editSession.regionEditDraw,
    showWialonStatus: canManageLogistics,
    wialonPulseNonce,
    followVehicleId,
    onStopFollowVehicle: () => setFollowVehicleId(null),
    onReFollowVehicle: (vehicleId) => {
      const vehicle = vehicles.find((row) => row.id === vehicleId)
      handleSelect({
        type: 'vehicle',
        id: vehicleId,
        name: vehicle?.plate_number || 'Vehicle',
      })
    },
    useImperativeMarkers: USE_MAP_VIEWPORT_BUNDLE,
    interactionMode: { ...interactionMode, hint: interactionModeHint },
    onMapPlacePin: createSession.handleMapPlacePin,
    isPlacingPin: createSession.isPlacingIndustryPin && isCreatingIndustry,
    industryCreatePinPosition: createSession.industryCreatePinPosition,
    markerFadeInNew: USE_MAP_VIEWPORT_BUNDLE,
    mapZoom,
    viewportClusters: clusters,
    useServerClusters,
    onClusterClick: handleClusterClick,
  }

  return (
    <CommandCenterShell
      missionPeriod={missionPeriod}
      onMissionPeriodChange={setMissionPeriod}
      depotId={depotId}
      onDepotChange={setDepotId}
      missionStatus={missionStatus}
      onMissionStatusChange={setMissionStatus}
      railOpen={railOpen}
      onRailClose={() => setRailOpen(false)}
      toast={toast}
      onToastClose={() => setToast('')}
      wialonLinkVehicle={wialonLinkVehicle}
      onWialonClose={() => setWialonLinkVehicle(null)}
      onWialonLinked={() => {
        setWialonLinkVehicle(null)
        refreshMapData()
        fetchVehiclePositions()
      }}
      mapColumn={
        <MapColumn
          loadError={loadError}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefreshing}
          hudOffsetClass={hudOffsetClass}
          activePanel={panelState.panel}
          onPanelChange={handlePanelChange}
          railOpen={railOpen}
          onToggleRail={() => setRailOpen((open) => !open)}
          mapEngineProps={mapEngineProps}
          onFlyToCity={({ lat, lng }) => flyToLatLng(lat, lng)}
        />
      }
      railPanel={
        <RightRailRouter
          isCreatingRegion={isCreatingRegion}
          isCreatingIndustry={isCreatingIndustry}
          createSession={createSession}
          showEntityDetail={showEntityDetail}
          showErpPanel={showErpPanel}
          panelState={panelState}
          hasPermission={hasPermission}
          editSession={editSession}
          selectedElement={selectedElement}
          regions={regions}
          sectors={sectors}
          depots={depots}
          industries={industries}
          clients={clients}
          vehicles={vehicles}
          canManageLogistics={canManageLogistics}
          canEditMapEntity={canEditMapEntity}
          canCreateMapEntity={canCreateMapEntity}
          canUpdateClientCredit={canUpdateClientCredit}
          mapLayerSearch={mapLayerSearch}
          isLoading={isLoading}
          refreshMapData={refreshMapData}
          onSelect={handleSelect}
          onNavigate={handleNavigate}
          followVehicleId={followVehicleId}
          setFollowVehicleId={setFollowVehicleId}
          setWialonLinkVehicle={setWialonLinkVehicle}
          depotId={depotId}
          onDepotChange={setDepotId}
          missionPeriod={missionPeriod}
          onPeriodChange={setMissionPeriod}
          onMapLayerSearchChange={handleMapLayerSearchChange}
        />
      }
    />
  )
}

export default GlobalMapPage
