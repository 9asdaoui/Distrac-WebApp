import fs from 'fs'

const path = 'c:/Users/hhp/Desktop/Oussama/Distrac_Backend/distrac_admin_web/src/pages/logistics/GlobalMapPage.jsx'
const src = fs.readFileSync(path, 'utf8')
const lines = src.split(/\r?\n/)

const newImports = `import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
`

const body = lines.slice(2299).join('\n')
let out = newImports + '\n' + body

out = out.replace(/const \[missionRoutes, setMissionRoutes\] = useState\(\[\]\)/, '')
out = out.replace(
  /useEffect\(\(\) => \{\s*const showVehicles = mapLayerFilter === MAP_FILTER_ALL \|\| mapLayerFilter === 'vehicles'\s*if \(!showVehicles \|\| isLoading\) \{\s*setMissionRoutes\(\[\]\)\s*return undefined\s*\}\s*const controller = new AbortController\(\)\s*apiInstance\s*\.get\('\/missions\/map-overlay', \{ signal: controller\.signal \}\)\s*\.then\(\(res\) => \{\s*if \(!controller\.signal\.aborted\) \{\s*setMissionRoutes\(res\.data\?\.data\?\.routes \|\| \[\]\)\s*\}\s*\}\)\s*\.catch\(\(err\) => \{\s*if \(err\.name === 'CanceledError' \|\| controller\.signal\.aborted\) return\s*console\.warn\('\[GlobalMapPage\] mission overlay fetch failed:', err\?\.message \|\| err\)\s*\}\)\s*return \(\) => controller\.abort\(\)\s*\}, \[mapLayerFilter, isLoading\]\)/s,
  '',
)

const missionHook = `
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
`

out = out.replace(
  /const \{\s*reloadViewport, clusters, mapZoom, viewportClustered \} = useMapViewport\(/,
  `const {
    reloadViewport, clusters, mapZoom, viewportClustered
  } = useMapViewport(`,
)

// Insert mission hook after useMapViewport block - find useMapBoundaries
out = out.replace(
  /useMapBoundaries\(\{[\s\S]*?enabled: USE_MAP_VIEWPORT_BUNDLE,\s*\}\)/,
  (match) => match + missionHook,
)

out = out.replace(/<GlobalMapCanvas/g, '<MapEngine')
out = out.replace(/wialonPulseNonce=\{wialonPulseNonce\}/g, '') // add prop properly below

// Add wialonPulseNonce to MapEngine if showWialonStatus exists
out = out.replace(
  /showWialonStatus=\{[^}]+\}/,
  (m) => m + '\n            wialonPulseNonce={wialonPulseNonce}',
)

out = out.replace(
  /const handleMapRefresh = useCallback\(\(\) => \{[\s\S]*?\}, \[refreshMapDataNow, reloadViewport, fetchVehiclePositions, fetchVehicleTrail, selectedVehicleId\]\)/,
  `const handleMapRefresh = useCallback(() => {
    refreshMapDataNow()
    if (USE_MAP_VIEWPORT_BUNDLE) {
      reloadViewport()
    }
    fetchVehiclePositions()
    reloadMissionOverlay()
    if (selectedVehicleId) {
      fetchVehicleTrail(selectedVehicleId)
    }
  }, [refreshMapDataNow, reloadViewport, fetchVehiclePositions, fetchVehicleTrail, selectedVehicleId, reloadMissionOverlay])`,
)

fs.writeFileSync(path, out)
console.log('GlobalMapPage slimmed, lines:', out.split(/\r?\n/).length)
