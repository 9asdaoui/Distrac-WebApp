import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isValidRegionPolygon, useRegionBoundaryDraw } from '../../../components/RegionBoundaryDrawer'
import { hasGpsCoordinates } from '../../../components/LocationMap'
import { EMPTY_INDUSTRY_FORM, industryFormToPayload } from '../../../components/logistics/IndustryFormFields'
import apiInstance from '../../../api/axiosInstance'
import { buildRegionDrawSurface } from '../../../components/map/engine/mapGeometryHelpers'
import { writeMapLayerVisibility } from '../../../components/map/mapLayerVisibility'
import { EMPTY_CREATE_REGION_FORM } from '../globalMap/GlobalMapPanels'

function ensureLayerOn(setMapLayerVisibility, layerId) {
  setMapLayerVisibility((prev) => {
    if (prev?.[layerId]) return prev
    const next = { ...prev, [layerId]: true }
    writeMapLayerVisibility(next)
    return next
  })
}

/**
 * Region/industry create sessions and ?create= URL sync.
 */
export function useMapCreateSession({
  canManageLogistics,
  canCreateMapEntity = true,
  regions,
  setMapLayerVisibility,
  setSelectedElement,
  onClearEdit,
  refreshMapData,
  onToast,
}) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const createRegionSessionRef = useRef(null)
  const createIndustrySessionRef = useRef(null)

  const isCreatingRegion =
    canManageLogistics && canCreateMapEntity && searchParams.get('create') === 'region'
  const isCreatingIndustry =
    canManageLogistics && canCreateMapEntity && searchParams.get('create') === 'industry'

  const [isPlacingIndustryPin, setIsPlacingIndustryPin] = useState(false)
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

  const regionDraw = useRegionBoundaryDraw({
    value: createRegionForm.boundary,
    onChange: (boundary) => setCreateRegionForm((prev) => ({ ...prev, boundary })),
    existingRegions: regions,
  })

  const regionCreateDraw = useMemo(
    () => (isCreatingRegion ? buildRegionDrawSurface(regionDraw) : null),
    [isCreatingRegion, regionDraw],
  )

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
    onClearEdit?.()
    ensureLayerOn(setMapLayerVisibility, 'regions')
    navigate('/?create=region')
  }, [canManageLogistics, regionDraw, navigate, setSelectedElement, onClearEdit, setMapLayerVisibility])

  const startIndustryCreate = useCallback(() => {
    if (!canManageLogistics) return
    createIndustrySessionRef.current = 'started'
    setCreateIndustryForm({ ...EMPTY_INDUSTRY_FORM })
    setCreateIndustryError('')
    setSelectedElement(null)
    onClearEdit?.()
    ensureLayerOn(setMapLayerVisibility, 'industries')
    navigate('/?create=industry')
  }, [canManageLogistics, navigate, setSelectedElement, onClearEdit, setMapLayerVisibility])

  useEffect(() => {
    if (!isCreatingRegion) {
      createRegionSessionRef.current = null
      return
    }
    ensureLayerOn(setMapLayerVisibility, 'regions')
    setSelectedElement(null)
    onClearEdit?.()
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
    ensureLayerOn(setMapLayerVisibility, 'industries')
    setSelectedElement(null)
    onClearEdit?.()
    if (!createIndustrySessionRef.current) {
      createIndustrySessionRef.current = 'url'
      setCreateIndustryForm({ ...EMPTY_INDUSTRY_FORM })
      setCreateIndustryError('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when entering create mode via URL
  }, [isCreatingIndustry])

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
        onToast(`Region "${createRegionForm.regionName.trim()}" created.`)
      } catch (err) {
        setCreateRegionError(err?.response?.data?.message || 'Failed to create region.')
      } finally {
        setIsCreatingRegionSubmitting(false)
      }
    },
    [canManageLogistics, createRegionForm, cancelRegionCreate, refreshMapData, onToast],
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
        onToast(`Industry "${createIndustryForm.industryName.trim()}" created.`)
      } catch (err) {
        setCreateIndustryError(err?.response?.data?.message || 'Failed to create industry.')
      } finally {
        setIsCreatingIndustrySubmitting(false)
      }
    },
    [canManageLogistics, createIndustryForm, cancelIndustryCreate, refreshMapData, onToast],
  )

  return {
    isCreatingRegion,
    isCreatingIndustry,
    isPlacingIndustryPin,
    industryCreatePinPosition,
    regionCreateDraw,
    regionDraw,
    createRegionForm,
    setCreateRegionForm,
    createIndustryForm,
    setCreateIndustryForm,
    createRegionError,
    createIndustryError,
    isCreatingRegionSubmitting,
    isCreatingIndustrySubmitting,
    handleMapPlacePin,
    cancelRegionCreate,
    cancelIndustryCreate,
    startRegionCreate,
    startIndustryCreate,
    handleCreateRegionSubmit,
    handleCreateIndustrySubmit,
  }
}
