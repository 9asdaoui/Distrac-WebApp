import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import apiInstance from '../../../api/axiosInstance'
import {
  buildGlobalMapPanelHref,
  hasCcPanelPermission,
  isMapAdminPanel,
  MAP_LAYER_LIST_REDIRECTS,
  readPanelFromPathname,
} from '../../../components/map/ccPanelRegistry'

/**
 * Pathname ↔ Command Center panel sync, mission focus fetch, rail visibility.
 */
export function useCommandCenterUrl({
  hasPermission,
  canManageLogistics,
  canCreateMapEntity = true,
  mapLayerVisibility,
  selectedElement,
  setSelectedElement,
  setFollowVehicleId,
  onResetEditState,
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [mapLayerSearch, setMapLayerSearch] = useState('')
  const [focusedMissionDetail, setFocusedMissionDetail] = useState(null)
  const [railOpen, setRailOpen] = useState(false)

  const isCreatingRegion =
    canManageLogistics && canCreateMapEntity && searchParams.get('create') === 'region'
  const isCreatingIndustry =
    canManageLogistics && canCreateMapEntity && searchParams.get('create') === 'industry'

  const panelState = useMemo(
    () => readPanelFromPathname(location.pathname, searchParams),
    [location.pathname, searchParams],
  )
  const missionsPanelActive = panelState.panel === 'missions'
  const missionFocusActive = missionsPanelActive && Boolean(panelState.id)
  const mapAdminPanelActive = isMapAdminPanel(panelState.panel)

  useEffect(() => {
    if (!missionsPanelActive || !panelState.id) {
      setFocusedMissionDetail(null)
      return undefined
    }
    const controller = new AbortController()
    apiInstance
      .get(`/missions/${panelState.id}`, { signal: controller.signal })
      .then((res) => {
        const mission = res.data?.data?.mission || res.data?.data || null
        if (!mission) {
          setFocusedMissionDetail(null)
          return
        }
        const points = []
        const origin = mission.depot_origin
        if (origin?.lat != null && origin?.lon != null) {
          points.push([origin.lat, origin.lon])
        }
        for (const stop of mission.stops || []) {
          const lat = stop.location?.lat
          const lon = stop.location?.lon
          if (lat != null && lon != null) points.push([lat, lon])
        }
        setFocusedMissionDetail({ ...mission, points })
      })
      .catch(() => {
        if (!controller.signal.aborted) setFocusedMissionDetail(null)
      })
    return () => controller.abort()
  }, [missionsPanelActive, panelState.id])

  const panelPermissionOk = useMemo(() => {
    if (!panelState.panel || !panelState.entry) return true
    return hasCcPanelPermission(hasPermission, panelState.entry.requiredPermission)
  }, [panelState.panel, panelState.entry, hasPermission])

  useEffect(() => {
    if (!panelState.panel || !panelState.entry) return
    if (!panelPermissionOk) {
      navigate('/unauthorized', { replace: true })
    }
  }, [panelState.panel, panelState.entry, panelPermissionOk, navigate])

  const resetEditState = useCallback(() => {
    onResetEditState?.()
  }, [onResetEditState])

  const handlePanelChange = useCallback(
    (panelKey) => {
      setSelectedElement(null)
      setFollowVehicleId(null)
      resetEditState()
      setMapLayerSearch('')
      navigate(buildGlobalMapPanelHref(panelKey || null), { replace: false })
      setRailOpen(true)
    },
    [setSelectedElement, setFollowVehicleId, resetEditState, navigate],
  )

  const handleMapLayerSearchChange = useCallback((value) => {
    setMapLayerSearch(value)
  }, [])

  const handleNavigate = useCallback(
    (path) => {
      if (!path) return
      if (path.startsWith('/global-map')) {
        navigate(path.replace(/^\/global-map/, '') || '/', { replace: false })
        return
      }
      const panel = MAP_LAYER_LIST_REDIRECTS[path]
      if (panel) {
        setSelectedElement(null)
        setFollowVehicleId(null)
        navigate(buildGlobalMapPanelHref(panel), { replace: false })
        return
      }
      navigate(path, { replace: false })
    },
    [navigate, setSelectedElement, setFollowVehicleId],
  )

  const showErpPanel =
    Boolean(panelState.panel) &&
    Boolean(panelState.entry) &&
    hasCcPanelPermission(hasPermission, panelState.entry.requiredPermission)

  useEffect(() => {
    if (selectedElement || isCreatingRegion || isCreatingIndustry || panelState.panel) {
      setRailOpen(true)
    }
  }, [selectedElement, isCreatingRegion, isCreatingIndustry, panelState.panel])

  // Clear vehicle selection when vehicles layer is hidden
  useEffect(() => {
    if (mapLayerVisibility?.vehicles) return
    if (selectedElement?.type === 'vehicle') {
      setSelectedElement(null)
      setFollowVehicleId(null)
    }
  }, [
    mapLayerVisibility?.vehicles,
    selectedElement?.type,
    setSelectedElement,
    setFollowVehicleId,
  ])

  return {
    searchParams,
    setSearchParams,
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
  }
}
