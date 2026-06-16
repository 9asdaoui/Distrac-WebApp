import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, PanelRight } from 'lucide-react'
import { MapLayerRailRouter } from '../../components/map/MapLayerRailPanels'
import { WialonLinkModal } from '../../components/logistics/WialonLinkModal'
import {
  isValidRegionPolygon,
  useRegionBoundaryDraw,
} from '../../components/RegionBoundaryDrawer'
import { geometriesOverlap, parseRegionBoundary } from '../../utils/regionBoundaryClip'
import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  MAP_FILTER_ALL,
  readMapLayerFilter,
  visibilityFromFilter,
} from '../../components/map/MapLayerFilterBar'
import { useAuth } from '../../context/AuthContext'
import { hasGpsCoordinates } from '../../components/LocationMap'
import { geometryFromLatLngPairs, latLngPairsFromGeometry } from '../../components/SectorBoundaryDrawer'
import apiInstance from '../../api/axiosInstance'
import { useTranslation } from 'react-i18next'
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
import { flyToCluster } from '../../components/map/engine/MapClusterLayer'
import { simplifyLatLngTrail } from '../../components/map/engine/mapTrailSimplify'
import { MapEngine } from '../../components/map/engine/MapEngine'
import { buildRegionDrawSurface, boundaryFromPolygonRings, polygonRingsFromBoundary } from '../../components/map/engine/mapGeometryHelpers'
import { buildVehicleMarkers } from '../../components/map/engine/mapMarkerBuilders'
import { MAP_LAYER_FILTER_STORAGE_KEY } from '../../components/map/engine/mapEngineConstants'
import { useMapEdit, EMPTY_EDIT_FORM } from './hooks/useMapEdit'
import { dedupeById } from './hooks/mapUtils'
import { useMissionOverlay, isMissionOverlayEnabled } from './hooks/useMissionOverlay'
import { useWialonFreshness } from './hooks/useWialonFreshness'
import { MapMobileBottomSheet } from '../../components/map/MapMobileBottomSheet'
import { IndustryFormFields, EMPTY_INDUSTRY_FORM, industryFormToPayload } from '../../components/logistics/IndustryFormFields'
import {
  DetailPanel,
  EditToast,
  RegionCreateRail,
  IndustryCreateRail,
  EMPTY_CREATE_REGION_FORM,
} from './globalMap/GlobalMapPanels'
import {
  buildEditFormFromSector,
  buildEditFormFromRegion,
  buildEditFormFromClient,
  buildEditFormFromDepot,
  buildEditFormFromIndustry,
  buildEditFormFromVehicle,
  DETAIL_DATA_KEY,
  DETAIL_API_PATH,
  normalizeIndustryForMap,
} from './globalMap/globalMapEditForms'

export function GlobalMapPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPermission } = useAuth()
  const canManageLogistics = hasPermission('manage_logistics')
  const detailsControllerRef = useRef(null)
  const mapCanvasRef = useRef(null)
  const prevLoadingRef = useRef(true)
  const deepLinkVehicleRef = useRef(null)

  const [mapLayerFilter, setMapLayerFilter] = useState(() =>
    readMapLayerFilter(MAP_LAYER_FILTER_STORAGE_KEY),
  )
  const [mapLayerSearch, setMapLayerSearch] = useState('')
  const [autoFitNonce, setAutoFitNonce] = useState(0)
  const [railOpen, setRailOpen] = useState(false)
  const [wialonLinkVehicle, setWialonLinkVehicle] = useState(null)
  

  const {
    sectors,
    depots,
    industries,
    regions,
    clients,
    vehicles,
    isLoading,
    loadError,
    refreshMapData,
    refreshMapDataNow,
    setRegions,
    setVehicles,
    setClients,
    setSectors,
  } = useMapData(mapLayerFilter)

  const { selectedElement, setSelectedElement, mapInstance, setMapInstance } = useMapSelection()

  const {
    flyToEntity,
    easeFollowTo,
    programmaticMapMoveRef,
  } = useMapCamera(mapInstance)

  const {
    recordViewportFetch,
    recordMoveEndStart,
    recordMarkersPainted,
    recordVehiclePollCommit,
  } = useMapInstrumentation()

  const [details, setDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  const handleTrailLoaded = useCallback(({ vehicleId, trips, trailMeta }) => {
    setDetails((prev) =>
      prev && prev.id === vehicleId
        ? { ...prev, recentTrips: trips, trailMeta }
        : prev,
    )
  }, [])

  const selectedVehicleId =
    selectedElement?.type === 'vehicle' ? selectedElement.id : null

  const {
    trackedVehicles,
    vehicleTrail,
    setVehicleTrail,
    followVehicleId,
    setFollowVehicleId,
    fetchVehiclePositions,
    fetchVehicleTrail,
    mergeViewportVehiclePins,
  } = useVehicleTracking({
    mapLayerFilter,
    isLoading,
    selectedVehicleId,
    onTrailLoaded: handleTrailLoaded,
    recordVehiclePollCommit,
  })

  const {
    reloadViewport, clusters, mapZoom, viewportClustered
  } = useMapViewport({
    mapInstance,
    mapLayerFilter,
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
  const missionOverlayEnabled = isMissionOverlayEnabled(mapLayerFilter) && !isLoading
  const mapBbox = useMemo(() => {
    if (!mapInstance) return null
    const bounds = mapInstance.getBounds()
    return {
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    }
  }, [mapInstance, mapZoom])
  const { missionRoutes, reloadMissionOverlay } = useMissionOverlay({
    enabled: missionOverlayEnabled,
    mapBbox,
  })
  const { wialonPulseNonce } = useWialonFreshness({
    enabled: mapLayerFilter === MAP_FILTER_ALL || mapLayerFilter === 'vehicles',
  })


  useMapClients({
    mapInstance,
    mapLayerFilter,
    isLoading,
    setClients,
    enabled: !USE_MAP_VIEWPORT_BUNDLE,
  })

  const {
    isEditing,
    setIsEditing,
    editForm,
    setEditForm,
    editRings,
    setEditRings,
    editDepots,
    setEditDepots,
    users,
    setUsers,
    editOptionsLoading,
    setEditOptionsLoading,
    editOptionsError,
    setEditOptionsError,
    isSavingEdit,
    setIsSavingEdit,
    saveError,
    setSaveError,
  } = useMapEdit()
  const layerVisibility = useMemo(
    () => visibilityFromFilter(mapLayerFilter),
    [mapLayerFilter],
  )

  const vehiclePositionById = useMemo(() => {
    const map = {}
    for (const row of trackedVehicles) {
      if (row?.position) {
        map[row.id] = row.position
      }
    }
    return map
  }, [trackedVehicles])

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

  const selectedVehicleIdForTrail =
    selectedElement?.type === 'vehicle' ? selectedElement.id : null

  const displayedVehicleTrail = useSmoothVehicleTrail(
    vehicleTrail,
    selectedVehicleIdForTrail,
    trackedVehicles,
  )

  const renderedVehicleTrail = useMemo(
    () => simplifyLatLngTrail(displayedVehicleTrail, mapZoom),
    [displayedVehicleTrail, mapZoom],
  )

  const useServerClusters = viewportClustered && clusters.length > 0

  const handleClusterClick = useCallback(
    (cluster) => {
      if (!mapInstance) return
      flyToCluster(mapInstance, cluster)
    },
    [mapInstance],
  )

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
  }, [mapInstance, followVehicleId])

  useEffect(() => {
    if (!mapInstance || !followVehicleId || programmaticMapMoveRef.current) return

    const tracked = trackedVehicles.find((row) => row.id === followVehicleId)
    const pos = tracked?.position
    if (!pos || !hasGpsCoordinates(pos.lat, pos.lng)) return

    easeFollowTo(pos.lat, pos.lng)
  }, [mapInstance, followVehicleId, trackedVehicles, easeFollowTo, programmaticMapMoveRef])

  useEffect(() => {
    if (!isLoading) {
      setAutoFitNonce((n) => n + 1)
    }
  }, [mapLayerFilter])

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      setAutoFitNonce((n) => n + 1)
    }
    prevLoadingRef.current = isLoading
  }, [isLoading])

  const [toast, setToast] = useState('')
  const deepLinkHandledRef = useRef(false)
  const createRegionSessionRef = useRef(null)
  const createIndustrySessionRef = useRef(null)

  const isCreatingRegion = canManageLogistics && searchParams.get('create') === 'region'
  const isCreatingIndustry = canManageLogistics && searchParams.get('create') === 'industry'
  const [isPlacingIndustryPin, setIsPlacingIndustryPin] = useState(false)

  const { hint: interactionModeHint, ...interactionMode } = useMapInteractionMode({
    isEditing,
    isCreatingRegion,
    isCreatingIndustry,
    isPlacingPin: isPlacingIndustryPin,
    followVehicleId,
    selectedElement,
  })

  const [createRegionForm, setCreateRegionForm] = useState(EMPTY_CREATE_REGION_FORM)
  const [createIndustryForm, setCreateIndustryForm] = useState({ ...EMPTY_INDUSTRY_FORM })
  const [createRegionError, setCreateRegionError] = useState('')
  const [createIndustryError, setCreateIndustryError] = useState('')
  const [isCreatingRegionSubmitting, setIsCreatingRegionSubmitting] = useState(false)
  const [isCreatingIndustrySubmitting, setIsCreatingIndustrySubmitting] = useState(false)

  useEffect(() => {
    setIsPlacingIndustryPin(isCreatingIndustry)
  }, [isCreatingIndustry])

  const industryCreatePinPosition = useMemo(() => {
    if (!isCreatingIndustry) return null
    const lat = Number(createIndustryForm.gps_latitude)
    const lng = Number(createIndustryForm.gps_longitude)
    if (!hasGpsCoordinates(lat, lng)) return null
    return [lat, lng]
  }, [isCreatingIndustry, createIndustryForm.gps_latitude, createIndustryForm.gps_longitude])

  const handleMapPlacePin = useCallback(
    async ({ lat, lng }) => {
      if (!isCreatingIndustry) return
      setCreateIndustryForm((prev) => ({
        ...prev,
        gps_latitude: String(lat),
        gps_longitude: String(lng),
      }))
      try {
        const res = await apiInstance.post('/logistics/geocode/reverse', { lat, lng })
        const displayName = res.data?.data?.displayName
        if (displayName) {
          setCreateIndustryForm((prev) =>
            prev.place_name ? prev : { ...prev, place_name: displayName },
          )
        }
      } catch {
        /* optional reverse geocode */
      }
    },
    [isCreatingIndustry],
  )

  const isEditingRegion = isEditing && selectedElement?.type === 'region'
  const editingRegionId = isEditingRegion ? selectedElement?.id || details?.id : null
  const [regionEditSeed, setRegionEditSeed] = useState(null)

  const regionDraw = useRegionBoundaryDraw({
    value: createRegionForm.boundary,
    onChange: (boundary) => setCreateRegionForm((prev) => ({ ...prev, boundary })),
    existingRegions: regions,
  })

  const regionEditDrawHook = useRegionBoundaryDraw({
    value: regionEditSeed,
    onChange: (boundary) => {
      setEditRings(boundary ? polygonRingsFromBoundary(boundary) : null)
    },
    existingRegions: regions,
    excludeRegionId: editingRegionId,
    enableVertexEditing: isEditingRegion,
  })

  const regionCreateDraw = useMemo(
    () => (isCreatingRegion ? buildRegionDrawSurface(regionDraw) : null),
    [isCreatingRegion, regionDraw],
  )

  const regionEditDraw = useMemo(
    () =>
      isEditingRegion
        ? buildRegionDrawSurface(regionEditDrawHook, { regionId: editingRegionId })
        : null,
    [isEditingRegion, regionEditDrawHook, editingRegionId],
  )

  useEffect(() => {
    if (!isEditingRegion) {
      setRegionEditSeed(null)
    }
  }, [isEditingRegion])

  useEffect(() => {
    localStorage.setItem(MAP_LAYER_FILTER_STORAGE_KEY, JSON.stringify(mapLayerFilter))
  }, [mapLayerFilter])

  const cancelRegionCreate = useCallback(() => {
    createRegionSessionRef.current = null
    regionDraw.reset()
    setCreateRegionForm({ ...EMPTY_CREATE_REGION_FORM })
    setCreateRegionError('')
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    setSearchParams(next, { replace: true })
  }, [regionDraw, searchParams, setSearchParams])

  const cancelIndustryCreate = useCallback(() => {
    createIndustrySessionRef.current = null
    setCreateIndustryForm({ ...EMPTY_INDUSTRY_FORM })
    setCreateIndustryError('')
    const next = new URLSearchParams(searchParams)
    next.delete('create')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  const startRegionCreate = useCallback(() => {
    if (!canManageLogistics) return
    createRegionSessionRef.current = 'started'
    regionDraw.reset()
    setCreateRegionForm({ ...EMPTY_CREATE_REGION_FORM })
    setCreateRegionError('')
    setSelectedElement(null)
    setIsEditing(false)
    setMapLayerFilter('regions')
    setSearchParams({ create: 'region' }, { replace: true })
  }, [canManageLogistics, regionDraw, setSearchParams])

  const startIndustryCreate = useCallback(() => {
    if (!canManageLogistics) return
    createIndustrySessionRef.current = 'started'
    setCreateIndustryForm({ ...EMPTY_INDUSTRY_FORM })
    setCreateIndustryError('')
    setSelectedElement(null)
    setIsEditing(false)
    setMapLayerFilter('industries')
    setSearchParams({ create: 'industry' }, { replace: true })
  }, [canManageLogistics, setSearchParams])

  useEffect(() => {
    if (!isCreatingRegion) {
      createRegionSessionRef.current = null
      return
    }
    setMapLayerFilter('regions')
    setSelectedElement(null)
    setIsEditing(false)
    if (!createRegionSessionRef.current) {
      createRegionSessionRef.current = 'url'
      regionDraw.reset()
      setCreateRegionForm({ ...EMPTY_CREATE_REGION_FORM })
      setCreateRegionError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when entering create mode via URL
  }, [isCreatingRegion])

  useEffect(() => {
    if (!isCreatingIndustry) {
      createIndustrySessionRef.current = null
      return
    }
    setMapLayerFilter('industries')
    setSelectedElement(null)
    setIsEditing(false)
    if (!createIndustrySessionRef.current) {
      createIndustrySessionRef.current = 'url'
      setCreateIndustryForm({ ...EMPTY_INDUSTRY_FORM })
      setCreateIndustryError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when entering create mode via URL
  }, [isCreatingIndustry])

  /* Deep-link from list/detail pages: /global-map?type=depot&id=… */
  useEffect(() => {
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    if (!type || !id || deepLinkHandledRef.current) return
    const mod = getLogisticsModule(type)
    if (mod?.mapFilter) setMapLayerFilter(mod.mapFilter)
  }, [searchParams])

  useEffect(() => {
    if (isLoading || deepLinkHandledRef.current) return

    const type = searchParams.get('type')
    const id = searchParams.get('id')
    if (!type || !id) return

    const mod = getLogisticsModule(type)
    if (!mod) return

    const collections = {
      industry: industries,
      depot: depots,
      sector: sectors,
      client: clients,
      region: regions,
      vehicle: vehicles,
    }
    const list = collections[type] || []
    const row = list.find((item) => item.id === id)

    if (!row) {
      if (list.length > 0) {
        deepLinkHandledRef.current = true
        setSearchParams({}, { replace: true })
      }
      return
    }

    deepLinkHandledRef.current = true
    setSearchParams({}, { replace: true })

    if (['industry', 'depot', 'sector', 'client', 'vehicle', 'region'].includes(type)) {
      setSelectedElement({
        type,
        id: row.id,
        name: getEntityDisplayName(type, row, mod.label),
        ...(type === 'depot' ? { isCentral: Boolean(row.is_central) } : {}),
      })
    }

    if (!mapInstance) return

    if (type === 'vehicle') {
      deepLinkVehicleRef.current = row.id
      setFollowVehicleId(row.id)
    }

    flyToEntity({ type, id: row.id, name: getEntityDisplayName(type, row, mod.label) }, {
      regions,
      sectors,
      industries,
      depots,
      clients,
      vehicles,
      vehiclePositionById,
      buildVehicleMarkers,
    })
  }, [
    isLoading,
    industries,
    depots,
    sectors,
    clients,
    regions,
    vehicles,
    vehiclePositionById,
    mapInstance,
    searchParams,
    setSearchParams,
    flyToEntity,
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

    flyToEntity({ type: 'vehicle', id: vehicleId }, {
      regions,
      sectors,
      industries,
      depots,
      clients,
      vehicles,
      vehiclePositionById,
      buildVehicleMarkers,
    })
    deepLinkVehicleRef.current = null
  }, [vehiclePositionById, vehicles, depots, mapInstance, flyToEntity, regions, sectors, industries, clients])

  

  const handleCreateRegionSubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!canManageLogistics) return
      if (!createRegionForm.regionName.trim()) {
        setCreateRegionError('Region name is required.')
        return
      }
      if (!isValidRegionPolygon(createRegionForm.boundary)) {
        setCreateRegionError('Draw the boundary on the map: Draw → corners → Save boundary.')
        return
      }
      setIsCreatingRegionSubmitting(true)
      setCreateRegionError('')
      try {
        await apiInstance.post('/regions', {
          regionName: createRegionForm.regionName.trim(),
          code: createRegionForm.code.trim() || undefined,
          boundary: createRegionForm.boundary,
          isActive: createRegionForm.isActive,
        })
        await refreshMapData()
        cancelRegionCreate()
        setToast(`Region "${createRegionForm.regionName.trim()}" created.`)
      } catch (err) {
        setCreateRegionError(err?.response?.data?.message || 'Failed to create region.')
      } finally {
        setIsCreatingRegionSubmitting(false)
      }
    },
    [canManageLogistics, createRegionForm, cancelRegionCreate, refreshMapData],
  )

  const handleCreateIndustrySubmit = useCallback(
    async (e) => {
      e.preventDefault()
      if (!canManageLogistics) return
      if (!createIndustryForm.industryName.trim()) {
        setCreateIndustryError('Industry name is required.')
        return
      }
      setIsCreatingIndustrySubmitting(true)
      setCreateIndustryError('')
      try {
        await apiInstance.post('/industries', industryFormToPayload(createIndustryForm))
        await refreshMapData()
        cancelIndustryCreate()
        setToast(`Industry "${createIndustryForm.industryName.trim()}" created.`)
      } catch (err) {
        setCreateIndustryError(err?.response?.data?.message || 'Failed to create industry.')
      } finally {
        setIsCreatingIndustrySubmitting(false)
      }
    },
    [canManageLogistics, createIndustryForm, cancelIndustryCreate, refreshMapData],
  )

  const handleMapRefresh = useCallback(() => {
    refreshMapDataNow()
    if (USE_MAP_VIEWPORT_BUNDLE) {
      reloadViewport()
    }
    fetchVehiclePositions()
    reloadMissionOverlay()
    if (selectedVehicleId) {
      fetchVehicleTrail(selectedVehicleId)
    }
  }, [refreshMapDataNow, reloadViewport, fetchVehiclePositions, fetchVehicleTrail, selectedVehicleId, reloadMissionOverlay])

  const handleMapLayerFilterChange = useCallback((filter) => {
    setMapLayerFilter(filter)
    setMapLayerSearch('')
    const keepVehicleSelection =
      selectedElement?.type === 'vehicle' &&
      (filter === MAP_FILTER_ALL || filter === 'vehicles')
    if (!keepVehicleSelection) {
      setSelectedElement(null)
      setFollowVehicleId(null)
    }
    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    setSaveError('')
  }, [selectedElement?.type, selectedElement?.id])

  const handleMapLayerSearchChange = useCallback((value) => {
    setMapLayerSearch(value)
  }, [])

  /* Side-panel detail fetching. */
  useEffect(() => {
    if (!selectedElement) {
      setDetails(null)
      setIsLoadingDetails(false)
      setDetailsError('')
      if (detailsControllerRef.current) {
        detailsControllerRef.current.abort()
        detailsControllerRef.current = null
      }
      return undefined
    }

    if (selectedElement.type === 'vehicle') {
      const vehicle = vehicles.find((row) => row.id === selectedElement.id) || null
      const tracked = trackedVehicles.find((row) => row.id === selectedElement.id) || null
      setDetails(
        vehicle
          ? {
              ...vehicle,
              wialon_unit_id: tracked?.wialon_unit_id ?? vehicle.wialon_unit_id,
              wialon_unit_name: tracked?.wialon_unit_name ?? vehicle.wialon_unit_name,
              wialon_sync_at: tracked?.wialon_sync_at ?? vehicle.wialon_sync_at,
              livePosition: tracked?.position || null,
            }
          : null,
      )
      setIsLoadingDetails(false)
      setDetailsError(vehicle ? '' : 'Vehicle not found.')
      return undefined
    }

    const supportedTypes = ['sector', 'client', 'depot', 'industry', 'region']
    if (!supportedTypes.includes(selectedElement.type)) {
      setDetails(null)
      setIsLoadingDetails(false)
      setDetailsError('')
      return undefined
    }

    if (detailsControllerRef.current) detailsControllerRef.current.abort()
    const controller = new AbortController()
    detailsControllerRef.current = controller

    setIsLoadingDetails(true)
    setDetailsError('')
    setDetails(null)

    const fetchDetail = async () => {
      try {
        const entityType = selectedElement.type
        const endpoint = `/${DETAIL_API_PATH[entityType]}/${selectedElement.id}`
        const res = await apiInstance.get(endpoint, {
          signal: controller.signal,
        })
        if (controller.signal.aborted) return
        const dataField = DETAIL_DATA_KEY[entityType]
        setDetails(res.data?.data?.[dataField] || null)
      } catch (err) {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        setDetails(null)
        setDetailsError(err?.response?.data?.message || 'Failed to load details.')
      } finally {
        if (!controller.signal.aborted) setIsLoadingDetails(false)
      }
    }

    fetchDetail()
    return () => controller.abort()
  }, [selectedElement, vehicles, trackedVehicles])

  /* When a new element is selected from the map, exit edit mode immediately */
  useEffect(() => {
    setIsEditing(false)
  }, [selectedElement?.id])

  /* Leaflet resize once map mount area is stable (right rail is always 1/3). */
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
  }, [mapInstance])

  const handleSelect = useCallback(
    (payload) => {
      if (isCreatingRegion || isCreatingIndustry) return
      setSelectedElement(payload)

      if (payload?.type !== 'vehicle') {
        setFollowVehicleId(null)
      } else {
        setFollowVehicleId(payload.id)
      }

      flyToEntity(payload, cameraContext)
    },
    [isCreatingRegion, isCreatingIndustry, flyToEntity, cameraContext, setFollowVehicleId],
  )

  const handleClose = useCallback(() => {
    regionEditDrawHook.reset()
    setRegionEditSeed(null)
    setSelectedElement(null)
    setFollowVehicleId(null)
    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    setSaveError('')
  }, [regionEditDrawHook])

  const handleNavigate = useCallback(
    (path) => {
      navigate(path)
    },
    [navigate],
  )

  const handleMapReady = useCallback((map) => {
    setMapInstance(map)
  }, [])

  /* ---------------- Edit mode handlers ---------------- */

  const enterEditMode = useCallback(async () => {
    if (!details || !canManageLogistics) return
    const entityType = selectedElement?.type
    setIsEditing(true)
    setSaveError('')
    setEditOptionsError('')
    setEditOptionsLoading(false)

    if (entityType === 'vehicle') {
      setEditForm(buildEditFormFromVehicle(details))
      setEditRings(null)
      return
    }
    if (entityType === 'client') {
      setEditForm(buildEditFormFromClient(details))
      setEditRings(null)
      return
    }
    if (entityType === 'depot') {
      setEditForm(buildEditFormFromDepot(details))
      setEditRings(null)
      return
    }
    if (entityType === 'industry') {
      setEditForm(buildEditFormFromIndustry(details))
      setEditRings(null)
      return
    }
    if (entityType === 'region') {
      setEditForm(buildEditFormFromRegion(details))
      setRegionEditSeed(details.boundary || null)
      setEditRings(polygonRingsFromBoundary(details.boundary))
      return
    }
    if (entityType === 'sector') {
      setEditForm(buildEditFormFromSector(details))
      setEditRings(polygonRingsFromBoundary(details.boundary))
      setEditOptionsLoading(true)
      try {
        const [regionsRes, depotsRes, usersRes] = await Promise.all([
          apiInstance.get('/regions'),
          apiInstance.get('/depots'),
          apiInstance.get('/users'),
        ])
        setRegions(regionsRes.data?.data?.regions || [])
        setEditDepots(depotsRes.data?.data?.depots || [])
        setUsers(usersRes.data?.data?.users || [])
      } catch (err) {
        console.warn('[GlobalMapPage] failed to load edit options:', err)
        setEditOptionsError(
          err?.response?.data?.message || 'Failed to load regions/depots/users for the form.',
        )
      } finally {
        setEditOptionsLoading(false)
      }
    }
  }, [details, selectedElement?.type, canManageLogistics])

  const handleClientMarkerDrag = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng()
    setEditForm((prev) => ({
      ...prev,
      gpsLatitude: lat,
      gpsLongitude: lng,
    }))
  }, [])

  const handleDepotMarkerDrag = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng()
    setEditForm((prev) => ({
      ...prev,
      gpsLatitude: lat,
      gpsLongitude: lng,
    }))
  }, [])

  const handleIndustryMarkerDrag = useCallback((e) => {
    const { lat, lng } = e.target.getLatLng()
    setEditForm((prev) => ({
      ...prev,
      gpsLatitude: String(lat),
      gpsLongitude: String(lng),
    }))
  }, [])

  const cancelEdit = useCallback(() => {
    regionEditDrawHook.reset()
    setRegionEditSeed(null)
    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    setSaveError('')
  }, [regionEditDrawHook])

  const handleEditFormChange = useCallback((patch) => {
    setEditForm((prev) => ({ ...prev, ...patch }))
  }, [])

  const handleVertexDrag = useCallback((ringIndex, vertexIndex, newLatLng) => {
    setEditRings((prev) => {
      if (!prev) return prev
      const next = prev.map((ring, ri) =>
        ri === ringIndex
          ? ring.map(([lat, lng], vi) => (vi === vertexIndex ? [newLatLng[0], newLatLng[1]] : [lat, lng]))
          : ring,
      )
      return next
    })
  }, [])

  const handleSaveEdit = useCallback(async () => {
    if (!details || !canManageLogistics) return
    const entityType = selectedElement?.type
    setIsSavingEdit(true)
    setSaveError('')

    if (entityType === 'vehicle') {
      const vehicleId = selectedElement?.id || details.id
      if (!editForm.plateNumber?.trim() || !editForm.model?.trim() || !editForm.depotId) {
        setSaveError('Plate number, model, and depot are required.')
        setIsSavingEdit(false)
        return
      }
      const tonnage = Number(editForm.tonnage)
      if (!Number.isFinite(tonnage) || tonnage <= 0) {
        setSaveError('Tonnage must be greater than zero.')
        setIsSavingEdit(false)
        return
      }
      try {
        const patchRes = await apiInstance.patch(`/logistics/vehicles/${vehicleId}`, {
          plate_number: editForm.plateNumber.trim(),
          model: editForm.model.trim(),
          depot_id: editForm.depotId,
          tonnage,
          volume_capacity: editForm.volumeCapacity !== '' ? Number(editForm.volumeCapacity) : null,
          is_active: Boolean(editForm.isActive),
        })
        const updated = patchRes.data?.data?.vehicle
        if (!updated?.id) throw new Error('Vehicle update did not return vehicle')
        setVehicles((prev) => prev.map((row) => (row.id === vehicleId ? { ...row, ...updated } : row)))
        setDetails(updated)
        setSelectedElement((prev) =>
          prev?.type === 'vehicle' && prev.id === vehicleId
            ? { ...prev, name: updated.plate_number || prev.name }
            : prev,
        )
        setIsEditing(false)
        setEditForm(EMPTY_VEHICLE_EDIT_FORM)
        setToast(`Vehicle "${editForm.plateNumber.trim()}" saved.`)
      } catch (err) {
        setSaveError(err?.response?.data?.message || 'Failed to save vehicle.')
      } finally {
        setIsSavingEdit(false)
      }
      return
    }

    if (entityType === 'depot') {
      const depotId = selectedElement?.id || details.id
      if (!editForm.depotName?.trim()) {
        setSaveError('Depot name is required.')
        setIsSavingEdit(false)
        return
      }
      if (editForm.gpsLatitude === '' || editForm.gpsLongitude === '') {
        setSaveError('Drag the depot pin on the map to set a location before saving.')
        setIsSavingEdit(false)
        return
      }
      try {
        const putRes = await apiInstance.put(`/depots/${depotId}`, {
          depotName: editForm.depotName.trim(),
          address: editForm.address?.trim() || '',
          gpsLatitude: Number(editForm.gpsLatitude),
          gpsLongitude: Number(editForm.gpsLongitude),
          totalPriceCapacity: Number(editForm.totalPriceCapacity) || 0,
          totalVolumeCapacity: Number(editForm.totalVolumeCapacity) || 0,
          autoApproveReplenishment: Boolean(editForm.autoApproveReplenishment),
        })
        const updated = putRes.data?.data?.depot
        if (!updated?.id || updated.id !== depotId) {
          throw new Error('Depot update did not return the expected depot id')
        }
        const listRes = await apiInstance.get('/depots')
        setDepots(
          dedupeById((listRes.data?.data?.depots || []).map(normalizeDepotForMap).filter(Boolean)),
        )
        setDetails(updated)
        setSelectedElement((prev) =>
          prev?.type === 'depot' && prev.id === depotId
            ? { ...prev, id: depotId, name: updated.depot_name || prev.name }
            : prev,
        )
        setIsEditing(false)
        setEditForm(EMPTY_DEPOT_EDIT_FORM)
        setToast(`Depot "${editForm.depotName.trim()}" saved.`)
      } catch (err) {
        setSaveError(err?.response?.data?.message || 'Failed to save depot.')
      } finally {
        setIsSavingEdit(false)
      }
      return
    }

    if (entityType === 'industry') {
      const industryId = selectedElement?.id || details.id
      if (!editForm.industryName?.trim()) {
        setSaveError('Industry name is required.')
        setIsSavingEdit(false)
        return
      }
      try {
        const putRes = await apiInstance.put(`/industries/${industryId}`, {
          industryName: editForm.industryName.trim(),
          description: editForm.description ?? '',
          isInternal: Boolean(editForm.isInternal),
          isActive: Boolean(editForm.isActive),
          gpsLatitude: editForm.gpsLatitude !== '' ? Number(editForm.gpsLatitude) : null,
          gpsLongitude: editForm.gpsLongitude !== '' ? Number(editForm.gpsLongitude) : null,
        })
        const updated = putRes.data?.data?.industry
        if (!updated?.id || updated.id !== industryId) {
          throw new Error('Industry update did not return the expected industry id')
        }
        const listRes = await apiInstance.get('/industries')
        setIndustries(
          dedupeById((listRes.data?.data?.industries || []).map(normalizeIndustryForMap).filter(Boolean)),
        )
        setDetails(updated)
        setSelectedElement((prev) =>
          prev?.type === 'industry' && prev.id === industryId
            ? { ...prev, id: industryId, name: updated.industry_name || prev.name }
            : prev,
        )
        setIsEditing(false)
        setEditForm(EMPTY_INDUSTRY_EDIT_FORM)
        setToast(`Industry "${editForm.industryName.trim()}" saved.`)
      } catch (err) {
        setSaveError(err?.response?.data?.message || 'Failed to save industry.')
      } finally {
        setIsSavingEdit(false)
      }
      return
    }

    if (entityType === 'client') {
      const clientId = selectedElement?.id || details.id
      if (editForm.gpsLatitude === '' || editForm.gpsLongitude === '') {
        setSaveError('Drag the client pin on the map to set a location before saving.')
        setIsSavingEdit(false)
        return
      }
      const payload = {
        storeName: editForm.storeName?.trim() || null,
        clientName: editForm.clientName?.trim() || null,
        phone: editForm.phone?.trim() || null,
        clientAddress: editForm.clientAddress?.trim() || null,
        city: editForm.city?.trim() || null,
        gpsLatitude: Number(editForm.gpsLatitude),
        gpsLongitude: Number(editForm.gpsLongitude),
      }
      try {
        const putRes = await apiInstance.put(`/clients/${clientId}`, payload)
        const updated = putRes.data?.data?.client
        if (!updated?.id || updated.id !== clientId) {
          throw new Error('Client update did not return the expected client id')
        }
        setClients((prev) =>
          dedupeById(
            prev.map((c) =>
              c.id === updated.id
                ? {
                    ...c,
                    client_name: updated.client_name,
                    store_name: updated.store_name,
                    phone: updated.phone,
                    client_address: updated.client_address,
                    city: updated.city,
                    gps_latitude: updated.gps_latitude,
                    gps_longitude: updated.gps_longitude,
                  }
                : c,
            ),
          ),
        )
        setDetails(updated)
        setSelectedElement((prev) =>
          prev?.type === 'client' && prev.id === clientId
            ? { ...prev, name: updated.store_name || updated.client_name || prev.name }
            : prev,
        )

        setIsEditing(false)
        setEditForm(EMPTY_CLIENT_EDIT_FORM)
        setToast(`Client "${editForm.storeName || editForm.clientName || 'updated'}" saved.`)
      } catch (err) {
        setSaveError(err?.response?.data?.message || 'Failed to save client.')
      } finally {
        setIsSavingEdit(false)
      }
      return
    }

    if (entityType === 'region') {
      if (!editForm.regionName?.trim()) {
        setSaveError('Region name is required.')
        setIsSavingEdit(false)
        return
      }
      const boundary = geometryFromLatLngPairs(regionEditDrawHook.points)
      if (!boundary || !isValidRegionPolygon(boundary)) {
        setSaveError('A valid boundary with at least 3 corners is required.')
        setIsSavingEdit(false)
        return
      }
      const existingForClip = regions
        .filter((r) => r.id !== details.id)
        .map((r) => parseRegionBoundary(r.boundary))
        .filter(Boolean)
      if (geometriesOverlap(boundary, existingForClip)) {
        setSaveError(
          'Boundary overlaps another region. Use Trace neighbor for shared edges, then free draw for open sides.',
        )
        setIsSavingEdit(false)
        return
      }
      try {
        await apiInstance.put(`/regions/${details.id}`, {
          regionName: editForm.regionName.trim(),
          code: editForm.code?.trim() || '',
          boundary,
          isActive: Boolean(editForm.isActive),
        })

        try {
          const res = await apiInstance.get(`/regions/${details.id}`)
          const refreshed = res.data?.data?.region
          if (refreshed) {
            setRegions((prev) =>
              prev.map((r) => (r.id === refreshed.id ? { ...r, ...refreshed } : r)),
            )
            setDetails(refreshed)
            setSelectedElement((prev) =>
              prev?.type === 'region' && prev.id === refreshed.id
                ? { ...prev, name: refreshed.region_name || prev.name }
                : prev,
            )
          }
        } catch (refreshErr) {
          console.warn('[GlobalMapPage] post-save region refresh failed:', refreshErr)
        }

        regionEditDrawHook.reset()
        setRegionEditSeed(null)
        setIsEditing(false)
        setEditForm(EMPTY_REGION_EDIT_FORM)
        setEditRings(null)
        setToast(`Region "${editForm.regionName.trim()}" updated.`)
      } catch (err) {
        setSaveError(err?.response?.data?.message || 'Failed to save region.')
      } finally {
        setIsSavingEdit(false)
      }
      return
    }

    // Sector save path
    if (entityType !== 'sector' || !editRings) {
      setIsSavingEdit(false)
      return
    }
    if (!editForm.sectorName.trim()) {
      setSaveError('Sector name is required.')
      setIsSavingEdit(false)
      return
    }
    const boundary = boundaryFromPolygonRings(editRings)
    if (!boundary) {
      setSaveError('A valid boundary with at least 3 corners is required.')
      setIsSavingEdit(false)
      return
    }
    try {
      await apiInstance.put(`/sectors/${details.id}`, {
        sectorName: editForm.sectorName.trim(),
        regionId: editForm.regionId || null,
        depotId: editForm.depotId || null,
        assignedProfileId: editForm.assignedProfileId || null,
        boundary,
        isActive: Boolean(editForm.isActive),
      })

      // Refresh the sector in the map list so its colors / data stay in sync
      try {
        const res = await apiInstance.get(`/sectors/${details.id}`)
        const refreshed = res.data?.data?.sector
        if (refreshed) {
          setSectors((prev) =>
            prev.map((s) => (s.id === refreshed.id ? { ...s, ...refreshed } : s)),
          )
          setDetails(refreshed)
        }
      } catch (refreshErr) {
        console.warn('[GlobalMapPage] post-save refresh failed:', refreshErr)
      }

      setIsEditing(false)
      setEditForm(EMPTY_EDIT_FORM)
      setEditRings(null)
      setToast(`Sector "${editForm.sectorName.trim()}" updated.`)
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to save sector.')
    } finally {
      setIsSavingEdit(false)
    }
  }, [details, editRings, editForm, selectedElement, canManageLogistics, regionEditDrawHook, regions])

  const editingBoundaryPayload = useMemo(() => {
    if (!isEditing || !details || !editRings || !selectedElement) return null
    if (selectedElement.type === 'region') return null
    if (selectedElement.type === 'sector') {
      return {
        entityType: 'sector',
        id: details.id,
        rings: editRings,
        previewDepotId: editForm.depotId || null,
      }
    }
    return null
  }, [isEditing, details, editRings, editForm.depotId, selectedElement])

  const editingClientId = useMemo(() => {
    if (!isEditing || !details || selectedElement?.type !== 'client') return null
    return details.id
  }, [isEditing, details, selectedElement?.type])

  const clientEditPosition = useMemo(() => {
    if (!editingClientId || editForm.gpsLatitude === '' || editForm.gpsLongitude === '') return null
    const lat = Number(editForm.gpsLatitude)
    const lng = Number(editForm.gpsLongitude)
    if (!hasGpsCoordinates(lat, lng)) return null
    return [lat, lng]
  }, [editingClientId, editForm.gpsLatitude, editForm.gpsLongitude])

  const editingDepotId = useMemo(() => {
    if (!isEditing || !details || selectedElement?.type !== 'depot') return null
    return details.id
  }, [isEditing, details, selectedElement?.type])

  const editingIndustryId = useMemo(() => {
    if (!isEditing || !details || selectedElement?.type !== 'industry') return null
    return details.id
  }, [isEditing, details, selectedElement?.type])

  const depotEditPosition = useMemo(() => {
    if (!editingDepotId || editForm.gpsLatitude === '' || editForm.gpsLongitude === '') return null
    const lat = Number(editForm.gpsLatitude)
    const lng = Number(editForm.gpsLongitude)
    if (!hasGpsCoordinates(lat, lng)) return null
    return [lat, lng]
  }, [editingDepotId, editForm.gpsLatitude, editForm.gpsLongitude])

  const industryEditPosition = useMemo(() => {
    if (!editingIndustryId || editForm.gpsLatitude === '' || editForm.gpsLongitude === '') return null
    const lat = Number(editForm.gpsLatitude)
    const lng = Number(editForm.gpsLongitude)
    if (!hasGpsCoordinates(lat, lng)) return null
    return [lat, lng]
  }, [editingIndustryId, editForm.gpsLatitude, editForm.gpsLongitude])

  const showEntityDetail = Boolean(selectedElement)

  const railPanelContent = isCreatingRegion ? (
    <RegionCreateRail
      form={createRegionForm}
      onChange={(patch) => setCreateRegionForm((prev) => ({ ...prev, ...patch }))}
      clipNotice={regionDraw.clipNotice}
      formError={createRegionError}
      isSubmitting={isCreatingRegionSubmitting}
      onSubmit={handleCreateRegionSubmit}
      onCancel={cancelRegionCreate}
    />
  ) : isCreatingIndustry ? (
    <IndustryCreateRail
      form={createIndustryForm}
      onChange={(patch) => setCreateIndustryForm((prev) => ({ ...prev, ...patch }))}
      formError={createIndustryError}
      isSubmitting={isCreatingIndustrySubmitting}
      onSubmit={handleCreateIndustrySubmit}
      onCancel={cancelIndustryCreate}
    />
  ) : showEntityDetail ? (
    <DetailPanel
      selectedElement={selectedElement}
      details={details}
      isLoadingDetails={isLoadingDetails}
      detailsError={detailsError}
      isEditing={isEditing}
      isSavingEdit={isSavingEdit}
      saveError={saveError}
      editForm={editForm}
      onEditFormChange={handleEditFormChange}
      regions={regions}
      depots={editDepots}
      users={users}
      editOptionsLoading={editOptionsLoading}
      editOptionsError={editOptionsError}
      canManageLogistics={canManageLogistics}
      onClose={handleClose}
      onNavigate={handleNavigate}
      onEnterEdit={enterEditMode}
      onSaveEdit={handleSaveEdit}
      onCancelEdit={cancelEdit}
      regionEditClipNotice={regionEditDrawHook.clipNotice}
      onClientDetailsUpdate={(updated) =>
        setDetails((prev) => (prev ? { ...prev, ...updated } : updated))
      }
      followVehicleId={followVehicleId}
      onReFollowVehicle={(vehicleId) => {
        const vehicle = vehicles.find((row) => row.id === vehicleId)
        handleSelect({
          type: 'vehicle',
          id: vehicleId,
          name: vehicle?.plate_number || 'Vehicle',
        })
      }}
      onStopFollowVehicle={() => setFollowVehicleId(null)}
      onLinkWialon={(vehicle) => setWialonLinkVehicle(vehicle)}
    />
  ) : (
    <MapLayerRailRouter
      filter={mapLayerFilter}
      searchQuery={mapLayerSearch}
      isLoading={isLoading}
      onRefresh={refreshMapData}
      onSelectItem={handleSelect}
      onStartRegionCreate={startRegionCreate}
      onStartIndustryCreate={startIndustryCreate}
      canManageLogistics={canManageLogistics}
      regions={regions}
      sectors={sectors}
      depots={depots}
      industries={industries}
      clients={clients}
      vehicles={vehicles}
    />
  )

  useEffect(() => {
    if (selectedElement || isCreatingRegion || isCreatingIndustry) {
      setRailOpen(true)
    }
  }, [selectedElement?.id, isCreatingRegion, isCreatingIndustry])

  return (
    <div className="relative flex h-full min-h-0 w-full overflow-hidden">
      <div className="relative h-full min-h-0 min-w-0 w-full shrink-0 overflow-hidden transition-all duration-300 lg:w-2/3">
        {loadError && (
          <div className="absolute left-1/2 top-4 z-[1001] w-full max-w-md -translate-x-1/2 px-4">
            <div className="rounded-xl border border-red-900/50 bg-red-950/80 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur-md">
              {loadError}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-zinc-950">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
            <p className="mt-4 text-sm font-medium text-zinc-400">{t('commandCenter.loading')}</p>
            <p className="mt-1 text-xs text-zinc-600">{t('commandCenter.loadingLayers')}</p>
          </div>
        ) : (
          <MapEngine
            sectors={sectors}
            regions={regions}
            industries={industries}
            depots={depots}
            clients={clients}
            vehicles={vehicles}
            vehiclePositionById={vehiclePositionById}
            vehicleTrail={renderedVehicleTrail}
            missionRoutes={missionRoutes}
            autoFitNonce={autoFitNonce}
            selectedElement={selectedElement}
            layerVisibility={layerVisibility}
            mapLayerFilter={mapLayerFilter}
            onMapLayerFilterChange={handleMapLayerFilterChange}
            mapLayerSearch={mapLayerSearch}
            onMapLayerSearchChange={handleMapLayerSearchChange}
            onSelect={handleSelect}
            onMapReady={handleMapReady}
            onRefreshMap={handleMapRefresh}
            mapInstance={mapInstance}
            canvasRef={mapCanvasRef}
            editingBoundary={editingBoundaryPayload}
            onVertexDrag={handleVertexDrag}
            editingClientId={editingClientId}
            onClientMarkerDrag={handleClientMarkerDrag}
            clientEditPosition={clientEditPosition}
            editingDepotId={editingDepotId}
            onDepotMarkerDrag={handleDepotMarkerDrag}
            depotEditPosition={depotEditPosition}
            editingIndustryId={editingIndustryId}
            onIndustryMarkerDrag={handleIndustryMarkerDrag}
            industryEditPosition={industryEditPosition}
            isEditingMap={isEditing}
            isCreatingRegion={isCreatingRegion}
            isCreatingIndustry={isCreatingIndustry}
            isEditingRegion={isEditingRegion}
            regionCreateDraw={regionCreateDraw}
            regionEditDraw={regionEditDraw}
            showWialonStatus={canManageLogistics}
            wialonPulseNonce={wialonPulseNonce}
            followVehicleId={followVehicleId}
            onStopFollowVehicle={() => setFollowVehicleId(null)}
            onReFollowVehicle={(vehicleId) => {
              const vehicle = vehicles.find((row) => row.id === vehicleId)
              handleSelect({
                type: 'vehicle',
                id: vehicleId,
                name: vehicle?.plate_number || 'Vehicle',
              })
            }}
            useImperativeMarkers={USE_MAP_VIEWPORT_BUNDLE}
            interactionMode={{ ...interactionMode, hint: interactionModeHint }}
            onMapPlacePin={handleMapPlacePin}
            isPlacingPin={isPlacingIndustryPin && isCreatingIndustry}
            industryCreatePinPosition={industryCreatePinPosition}
            markerFadeInNew={USE_MAP_VIEWPORT_BUNDLE}
            mapZoom={mapZoom}
            viewportClusters={clusters}
            useServerClusters={useServerClusters}
            onClusterClick={handleClusterClick}
          />
        )}
        <button
          type="button"
          onClick={() => setRailOpen((open) => !open)}
          className="absolute bottom-4 right-4 z-[1100] inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-lg backdrop-blur-md lg:hidden"
        >
          <PanelRight className="h-4 w-4" />
          {railOpen ? 'Hide panel' : 'Show panel'}
        </button>
      </div>

      <div className="hidden h-full min-w-0 shrink-0 flex-col overflow-hidden border-l border-zinc-800 bg-[#1c1c1e] shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] lg:flex lg:w-1/3">
        {railPanelContent}
      </div>

      <MapMobileBottomSheet
        open={railOpen}
        onClose={() => setRailOpen(false)}
        title={t('sidebar.commandCenter')}
      >
        {railPanelContent}
      </MapMobileBottomSheet>

      <EditToast message={toast} onClose={() => setToast('')} />
      {wialonLinkVehicle && (
        <WialonLinkModal
          vehicle={wialonLinkVehicle}
          onClose={() => setWialonLinkVehicle(null)}
          onLinked={() => {
            setWialonLinkVehicle(null)
            refreshMapData()
            fetchVehiclePositions()
          }}
        />
      )}
    </div>
  )
}

export default GlobalMapPage
