import fs from 'fs'

const srcPath = new URL('../src/pages/logistics/GlobalMapPage.jsx', import.meta.url)
const src = fs.readFileSync(srcPath, 'utf8')
const lines = src.split(/\r?\n/)

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n')
}

const mapEngineHeader = `import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Tooltip,
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
import { useMapHudOffsetClass } from '../../context/SidebarLayoutContext'
import { hasGpsCoordinates } from '../LocationMap'
import { USE_MAP_VIEWPORT_BUNDLE } from '../../pages/logistics/hooks/useMapViewport'
import { dedupeById } from '../../pages/logistics/hooks/mapUtils'
import { MapEntityLayer } from './MapEntityLayer'
import { MapPlacePinLayer } from './MapPlacePinLayer'
import { MapClusterLayer } from './MapClusterLayer'
import { iconForEntity } from './mapEntityIcons'
import { mergeLodWithFilter, resolveLodForZoom } from './mapLod'
import { MAP_FLY_OPTIONS } from './cameraController'
import {
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  REGION_LAYER_STYLE,
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

`

let helpers = slice(287, 411)
helpers = helpers
  .replace(/^function FitGlobalBounds/, 'export function FitGlobalBounds')
  .replace(/^function MapInstanceBridge/, 'export function MapInstanceBridge')
  .replace(/^function MapCanvasResizeSync/, 'export function MapCanvasResizeSync')
  .replace(/^function FloatingLegend/, 'export function FloatingLegend')

let canvas = slice(448, 1148)
canvas = canvas.replace(/^function GlobalMapCanvas\(/, 'export function MapEngine(')

const mapEnginePath = new URL('../src/components/map/engine/MapEngine.jsx', import.meta.url)
fs.writeFileSync(mapEnginePath, mapEngineHeader + helpers + '\n' + canvas)

const railsHeader = `import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Globe,
  Loader2,
  X,
  Building2,
  Warehouse,
  Factory,
  User2,
  MapPin,
  ExternalLink,
  Pencil,
  Save,
  CheckCircle2,
  Power,
  AlertCircle,
  Phone,
  Banknote,
  Box,
  FileText,
  Truck,
  Map as MapIcon,
  Store,
  UserCheck,
  Radio,
} from 'lucide-react'
import {
  getLogisticsModule,
  getEntityDisplayName,
  EntityBreadcrumb,
  EntityIconBadge,
  EntityPanelSubtitle,
} from '../../components/logistics/logisticsModuleUi'
import { IndustryDetailsContent, IndustryTypeBadge } from '../../components/logistics/IndustryDetailsContent'
import { IndustryFormFields } from '../../components/logistics/IndustryFormFields'
import { DepotDetailsContent } from '../../components/logistics/DepotDetailsContent'
import { SectorDetailsContent } from '../../components/logistics/SectorDetailsContent'
import { ClientDetailsContent } from '../../components/logistics/ClientDetailsContent'
import { VehicleDetailsContent } from '../../components/logistics/VehicleDetailsContent'
import { EditVehicleForm } from '../../components/logistics/EditVehicleForm'
import { RegionDetailsContent } from '../../components/logistics/RegionDetailsContent'
import { isValidRegionPolygon } from '../../components/RegionBoundaryDrawer'
import {
  FormField as EditFormField,
  FormInput,
  FormIntro,
  FormSection,
  FormSelect,
  FormTip,
  FormToggle,
  FormFooter,
  FormError,
  FormSegmented,
} from '../../components/map/CommandCenterForm'

`

let rails = slice(1150, 2098)
rails = rails
  .replace(/^const EMPTY_CREATE_REGION_FORM/, 'export const EMPTY_CREATE_REGION_FORM')
  .replace(/^function RegionCreateRail/, 'export function RegionCreateRail')
  .replace(/^function IndustryCreateRail/, 'export function IndustryCreateRail')
  .replace(/^function EditRegionForm/, 'export function EditRegionForm')
  .replace(/^function EditSectorForm/, 'export function EditSectorForm')
  .replace(/^function EditClientForm/, 'export function EditClientForm')
  .replace(/^function EditDepotForm/, 'export function EditDepotForm')
  .replace(/^function EditIndustryForm/, 'export function EditIndustryForm')
  .replace(/^function DetailPanel/, 'export function DetailPanel')
  .replace(/^function EditToast/, 'export function EditToast')

const panelsPath = new URL('../src/pages/logistics/globalMap/GlobalMapPanels.jsx', import.meta.url)
fs.mkdirSync(new URL('../src/pages/logistics/globalMap/', import.meta.url), { recursive: true })
fs.writeFileSync(panelsPath, railsHeader + rails)

const editHeader = `import { EMPTY_EDIT_FORM } from '../hooks/useMapEdit'

`
let editForms = slice(2104, 2246)
editForms = editForms
  .replace(/^function buildEditFormFromSector/, 'export function buildEditFormFromSector')
  .replace(/^const EMPTY_REGION_EDIT_FORM/, 'export const EMPTY_REGION_EDIT_FORM')
  .replace(/^function buildEditFormFromRegion/, 'export function buildEditFormFromRegion')
  .replace(/^const EMPTY_CLIENT_EDIT_FORM/, 'export const EMPTY_CLIENT_EDIT_FORM')
  .replace(/^function buildEditFormFromClient/, 'export function buildEditFormFromClient')
  .replace(/^const EMPTY_DEPOT_EDIT_FORM/, 'export const EMPTY_DEPOT_EDIT_FORM')
  .replace(/^function buildEditFormFromDepot/, 'export function buildEditFormFromDepot')
  .replace(/^const EMPTY_INDUSTRY_EDIT_FORM/, 'export const EMPTY_INDUSTRY_EDIT_FORM')
  .replace(/^function buildEditFormFromIndustry/, 'export function buildEditFormFromIndustry')
  .replace(/^const EMPTY_VEHICLE_EDIT_FORM/, 'export const EMPTY_VEHICLE_EDIT_FORM')
  .replace(/^function buildEditFormFromVehicle/, 'export function buildEditFormFromVehicle')
  .replace(/^const DETAIL_DATA_KEY/, 'export const DETAIL_DATA_KEY')
  .replace(/^const DETAIL_API_PATH/, 'export const DETAIL_API_PATH')
  .replace(/^function normalizeIndustryForMap/, 'export function normalizeIndustryForMap')

const editFormsPath = new URL('../src/pages/logistics/globalMap/globalMapEditForms.js', import.meta.url)
fs.writeFileSync(editFormsPath, editHeader + editForms)

console.log('Done')
