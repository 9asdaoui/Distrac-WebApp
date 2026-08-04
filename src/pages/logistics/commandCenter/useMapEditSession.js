import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRegionBoundaryDraw } from '../../../components/RegionBoundaryDrawer'
import { hasGpsCoordinates } from '../../../components/LocationMap'
import apiInstance from '../../../api/axiosInstance'
import {
  buildRegionDrawSurface,
  polygonRingsFromBoundary,
} from '../../../components/map/engine/mapGeometryHelpers'
import { EMPTY_EDIT_FORM, useMapEdit } from '../hooks/useMapEdit'
import {
  buildEditFormFromClient,
  buildEditFormFromDepot,
  buildEditFormFromIndustry,
  buildEditFormFromRegion,
  buildEditFormFromSector,
  buildEditFormFromVehicle,
  DETAIL_API_PATH,
  DETAIL_DATA_KEY,
} from '../globalMap/globalMapEditForms'
import { saveMapEntityEdit } from '../globalMap/mapEditSave'
import { mapDetailLoadError } from '../../../utils/mapDetailLoadError'

/**
 * Entity detail fetch, inline edit session, and map overlay editing state.
 */
export function useMapEditSession({
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
  scopedDepotIds,
  mapInstance,
  setFollowVehicleId,
  onToast,
}) {
  const detailsControllerRef = useRef(null)
  const [details, setDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')
  const [regionEditSeed, setRegionEditSeed] = useState(null)

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

  const isEditingRegion = isEditing && selectedElement?.type === 'region'
  const editingRegionId = isEditingRegion ? selectedElement?.id || details?.id : null

  const regionEditDrawHook = useRegionBoundaryDraw({
    value: regionEditSeed,
    onChange: (boundary) => {
      setEditRings(boundary ? polygonRingsFromBoundary(boundary) : null)
    },
    existingRegions: regions,
    excludeRegionId: editingRegionId,
    enableVertexEditing: isEditingRegion,
  })

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
        const res = await apiInstance.get(endpoint, { signal: controller.signal })
        if (controller.signal.aborted) return
        const dataField = DETAIL_DATA_KEY[entityType]
        setDetails(res.data?.data?.[dataField] || null)
      } catch (err) {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        setDetails(null)
        setDetailsError(mapDetailLoadError(err, 'Failed to load details.'))
      } finally {
        if (!controller.signal.aborted) setIsLoadingDetails(false)
      }
    }

    fetchDetail()
    return () => controller.abort()
  }, [selectedElement, vehicles, trackedVehicles])

  useEffect(() => {
    setIsEditing(false)
  }, [selectedElement?.id, setIsEditing])

  const enterEditMode = useCallback(async () => {
    if (!details || !canManageLogistics) return
    const entityType = selectedElement?.type
    if (canEditMapEntity && !canEditMapEntity(entityType, details)) return
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
        const allDepots = depotsRes.data?.data?.depots || []
        const scopedDepots =
          scopedDepotIds && scopedDepotIds.size > 0
            ? allDepots.filter((row) => scopedDepotIds.has(row.id))
            : allDepots
        setEditDepots(scopedDepots)
        setUsers(usersRes.data?.data?.users || [])
      } catch (err) {
        console.warn('[useMapEditSession] failed to load edit options:', err)
        setEditOptionsError(
          err?.response?.data?.message || 'Failed to load regions/depots/users for the form.',
        )
      } finally {
        setEditOptionsLoading(false)
      }
    }
  }, [
    details,
    selectedElement?.type,
    canManageLogistics,
    canEditMapEntity,
    scopedDepotIds,
    setEditForm,
    setEditRings,
    setIsEditing,
    setSaveError,
    setEditOptionsError,
    setEditOptionsLoading,
    setRegions,
    setEditDepots,
    setUsers,
  ])

  const cancelEdit = useCallback(() => {
    regionEditDrawHook.reset()
    setRegionEditSeed(null)
    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    setSaveError('')
  }, [regionEditDrawHook, setIsEditing, setEditForm, setEditRings, setSaveError])

  const resetEditForm = useCallback(() => {
    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    setSaveError('')
  }, [setIsEditing, setEditForm, setEditRings, setSaveError])

  const handleClose = useCallback(() => {
    regionEditDrawHook.reset()
    setRegionEditSeed(null)
    setSelectedElement(null)
    setFollowVehicleId(null)
    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    setSaveError('')
  }, [
    regionEditDrawHook,
    setSelectedElement,
    setFollowVehicleId,
    setIsEditing,
    setEditForm,
    setEditRings,
    setSaveError,
  ])

  const handleEditFormChange = useCallback(
    (patch) => {
      setEditForm((prev) => ({ ...prev, ...patch }))
    },
    [setEditForm],
  )

  const handleClientMarkerDrag = useCallback(
    (e) => {
      const { lat, lng } = e.target.getLatLng()
      setEditForm((prev) => ({ ...prev, gpsLatitude: lat, gpsLongitude: lng }))
    },
    [setEditForm],
  )

  const handleDepotMarkerDrag = useCallback(
    (e) => {
      const { lat, lng } = e.target.getLatLng()
      setEditForm((prev) => ({ ...prev, gpsLatitude: lat, gpsLongitude: lng }))
    },
    [setEditForm],
  )

  const handleIndustryMarkerDrag = useCallback(
    (e) => {
      const { lat, lng } = e.target.getLatLng()
      setEditForm((prev) => ({
        ...prev,
        gpsLatitude: String(lat),
        gpsLongitude: String(lng),
      }))
    },
    [setEditForm],
  )

  const handleVertexDrag = useCallback(
    (ringIndex, vertexIndex, newLatLng) => {
      setEditRings((prev) => {
        if (!prev) return prev
        return prev.map((ring, ri) =>
          ri === ringIndex
            ? ring.map(([lat, lng], vi) =>
                vi === vertexIndex ? [newLatLng[0], newLatLng[1]] : [lat, lng],
              )
            : ring,
        )
      })
    },
    [setEditRings],
  )

  const handleSaveEdit = useCallback(() => {
    if (canEditMapEntity && selectedElement?.type && details) {
      if (!canEditMapEntity(selectedElement.type, details)) return
    }
    return saveMapEntityEdit({
      details,
      selectedElement,
      editForm,
      editRings,
      canManageLogistics,
      regionEditDrawHook,
      regions,
      setIsSavingEdit,
      setSaveError,
      setVehicles,
      setDepots,
      setIndustries,
      setClients,
      setRegions,
      setSectors,
      setDetails,
      setSelectedElement,
      setIsEditing,
      setEditForm,
      setEditRings,
      setRegionEditSeed,
      onToast,
    })
  }, [
    details,
    selectedElement,
    editForm,
    editRings,
    canManageLogistics,
    canEditMapEntity,
    regionEditDrawHook,
    regions,
    setIsSavingEdit,
    setSaveError,
    setVehicles,
    setDepots,
    setIndustries,
    setClients,
    setRegions,
    setSectors,
    setDetails,
    setSelectedElement,
    setIsEditing,
    setEditForm,
    setEditRings,
    onToast,
  ])

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

  return {
    details,
    setDetails,
    isLoadingDetails,
    detailsError,
    isEditing,
    editForm,
    editRings,
    editDepots,
    users,
    editOptionsLoading,
    editOptionsError,
    isSavingEdit,
    saveError,
    regionEditDrawHook,
    regionEditDraw,
    editingBoundaryPayload,
    editingClientId,
    clientEditPosition,
    editingDepotId,
    depotEditPosition,
    editingIndustryId,
    industryEditPosition,
    enterEditMode,
    cancelEdit,
    resetEditForm,
    handleClose,
    handleEditFormChange,
    handleClientMarkerDrag,
    handleDepotMarkerDrag,
    handleIndustryMarkerDrag,
    handleVertexDrag,
    handleSaveEdit,
  }
}
