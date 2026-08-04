import { isValidRegionPolygon } from '../../../components/RegionBoundaryDrawer'
import { geometryFromLatLngPairs } from '../../../components/SectorBoundaryDrawer'
import { geometriesOverlap, parseRegionBoundary } from '../../../utils/regionBoundaryClip'
import apiInstance from '../../../api/axiosInstance'
import { dedupeById, normalizeDepotForMap } from '../hooks/mapUtils'
import { boundaryFromPolygonRings } from '../../../components/map/engine/mapGeometryHelpers'
import { EMPTY_EDIT_FORM } from '../hooks/useMapEdit'
import {
  EMPTY_CLIENT_EDIT_FORM,
  EMPTY_DEPOT_EDIT_FORM,
  EMPTY_INDUSTRY_EDIT_FORM,
  EMPTY_REGION_EDIT_FORM,
  EMPTY_VEHICLE_EDIT_FORM,
  normalizeIndustryForMap,
} from '../globalMap/globalMapEditForms'

/**
 * Persists inline map entity edits (vehicle, depot, industry, client, region, sector).
 */
export async function saveMapEntityEdit({
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
}) {
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
      onToast(`Vehicle "${editForm.plateNumber.trim()}" saved.`)
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
      onToast(`Depot "${editForm.depotName.trim()}" saved.`)
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
      onToast(`Industry "${editForm.industryName.trim()}" saved.`)
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
      onToast(`Client "${editForm.storeName || editForm.clientName || 'updated'}" saved.`)
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
        console.warn('[saveMapEntityEdit] post-save region refresh failed:', refreshErr)
      }

      regionEditDrawHook.reset()
      setRegionEditSeed(null)
      setIsEditing(false)
      setEditForm(EMPTY_REGION_EDIT_FORM)
      setEditRings(null)
      onToast(`Region "${editForm.regionName.trim()}" updated.`)
    } catch (err) {
      setSaveError(err?.response?.data?.message || 'Failed to save region.')
    } finally {
      setIsSavingEdit(false)
    }
    return
  }

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
      console.warn('[saveMapEntityEdit] post-save refresh failed:', refreshErr)
    }

    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    onToast(`Sector "${editForm.sectorName.trim()}" updated.`)
  } catch (err) {
    setSaveError(err?.response?.data?.message || 'Failed to save sector.')
  } finally {
    setIsSavingEdit(false)
  }
}
