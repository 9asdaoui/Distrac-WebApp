import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  Tooltip,
  ZoomControl,
  useMap,
} from 'react-leaflet'
import L from 'leaflet'
import {
  DARK_TILE_URL as TILE_URL,
  GLOBAL_MAP_TILE_OPTIONS,
} from '../../components/map/mapTileLayer'
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
  Copy,
  Check,
  Users,
  Store,
  UserCheck,
  Calendar,
  Pencil,
  Save,
  CheckCircle2,
  Power,
  AlertCircle,
  Phone,
  CreditCard,
  QrCode,
  Banknote,
  Box,
  FileText,
  Package,
  Truck,
  Map as MapIcon,
} from 'lucide-react'
import { MapLayerRailRouter } from '../../components/map/MapLayerRailPanels'
import { GlobalMapCommandBar } from '../../components/map/GlobalMapCommandBar'
import { IndustryDetailsContent, IndustryTypeBadge } from '../../components/logistics/IndustryDetailsContent'
import { IndustryFormFields } from '../../components/logistics/IndustryFormFields'
import {
  getLogisticsModule,
  getEntityDisplayName,
  EntityBreadcrumb,
  EntityIconBadge,
  EntityPanelSubtitle,
  EntitySegmentedControl,
} from '../../components/logistics/logisticsModuleUi'
import { DepotDetailsContent } from '../../components/logistics/DepotDetailsContent'
import { SectorDetailsContent } from '../../components/logistics/SectorDetailsContent'
import { ClientDetailsContent } from '../../components/logistics/ClientDetailsContent'
import { VehicleDetailsContent } from '../../components/logistics/VehicleDetailsContent'
import { RegionDetailsContent } from '../../components/logistics/RegionDetailsContent'
import {
  isValidRegionPolygon,
  RegionBoundaryDraftLayers,
  RegionBoundaryDrawControls,
  RegionBoundaryEditableVertices,
  RegionBoundaryMapInteraction,
  RegionBoundaryTraceHighlight,
  useRegionBoundaryDraw,
} from '../../components/RegionBoundaryDrawer'
import { geometriesOverlap, parseRegionBoundary } from '../../utils/regionBoundaryClip'
import {
  DEFAULT_MAP_LAYER_VISIBILITY,
  MAP_FILTER_ALL,
  readMapLayerFilter,
  visibilityFromFilter,
} from '../../components/map/MapLayerFilterBar'
import { applyMapLayerSearch } from '../../components/map/mapLayerSearch'
import { useAuth } from '../../context/AuthContext'
import { useMapHudOffsetClass } from '../../context/SidebarLayoutContext'
import { hasGpsCoordinates } from '../../components/LocationMap'
import { parseSectorBoundary } from '../../components/SectorBoundaryPreview'
import { geometryFromLatLngPairs, latLngPairsFromGeometry } from '../../components/SectorBoundaryDrawer'
import apiInstance from '../../api/axiosInstance'

const DEFAULT_CENTER = [33.5731, -7.5898]
const DEFAULT_ZOOM = 6

/** Leaflet fly duration (seconds) — filter changes + entity focus. */
const MAP_FLY_DURATION = 1.85
const MAP_FLY_OPTIONS = {
  duration: MAP_FLY_DURATION,
  easeLinearity: 0.38,
}

const DEPOT_SECTOR_PALETTE = [
  { color: '#34d399', fillColor: '#10b981' },
  { color: '#fbbf24', fillColor: '#d97706' },
  { color: '#60a5fa', fillColor: '#2563eb' },
  { color: '#c084fc', fillColor: '#9333ea' },
]

const UNASSIGNED_SECTOR_STYLE = { color: '#71717a', fillColor: '#52525b' }

const REGION_LAYER_STYLE = {
  color: '#fb923c',
  fillColor: '#f97316',
}

const MAP_LAYER_FILTER_STORAGE_KEY = 'distrac.globalMap.layerFilter'

const TRUCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>'

const vehicleIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-7 h-7 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-violet-500 text-white">${TRUCK_SVG}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

function buildDepotColorMap(depotIds) {
  const unique = [...new Set((depotIds || []).filter(Boolean))].sort()
  const map = new Map()
  unique.forEach((id, index) => {
    map.set(id, DEPOT_SECTOR_PALETTE[index % DEPOT_SECTOR_PALETTE.length])
  })
  return map
}

function getSectorColor(depotId, depotColorMap) {
  if (!depotId) return UNASSIGNED_SECTOR_STYLE
  return depotColorMap.get(depotId) || UNASSIGNED_SECTOR_STYLE
}

const FACTORY_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>'

const WAREHOUSE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><path d="M12 6v4"/></svg>'

const clientIcon = L.divIcon({
  className: 'global-map-marker',
  html:
    '<div class="w-3.5 h-3.5 bg-zinc-100 border-2 border-zinc-950 ring-2 ring-zinc-400/50 rounded-full shadow-md"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

const industryIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-rose-500 text-white">${FACTORY_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

const normalDepotIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-blue-500 text-white">${WAREHOUSE_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

const centralDepotIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-amber-500 text-white">${WAREHOUSE_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

/* Small white-dot icon used as draggable vertex handle while editing. */
const vertexIcon = L.divIcon({
  className: 'global-map-vertex',
  html:
    '<div class="w-3 h-3 rounded-full bg-white border-2 border-zinc-900 shadow-[0_0_0_3px_rgba(255,255,255,0.35)] cursor-grab active:cursor-grabbing"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function polygonRingsFromBoundary(boundary) {
  const geometry = parseSectorBoundary(boundary)
  if (!geometry) return []

  if (geometry.type === 'Polygon') {
    const pairs = latLngPairsFromGeometry(geometry)
    if (pairs.length < 3) return []
    return [pairs.map(([lat, lng]) => [lat, lng])]
  }

  if (geometry.type === 'MultiPolygon') {
    return (geometry.coordinates || [])
      .map((polygonCoords) => {
        const ring = polygonCoords?.[0] || []
        if (ring.length < 4) return null
        const positions = ring.slice(0, -1).map(([lng, lat]) => [lat, lng])
        return positions.length >= 3 ? positions : null
      })
      .filter(Boolean)
  }

  return []
}

/** Reconstruct a GeoJSON Polygon from an array of rings (each ring is [[lat,lng], ...]). */
function boundaryFromPolygonRings(rings) {
  if (!rings || !rings.length) return null
  const closedRings = rings
    .filter((ring) => Array.isArray(ring) && ring.length >= 3)
    .map((ring) => {
      const coords = ring.map(([lat, lng]) => [Number(lng), Number(lat)])
      // Close the ring
      const first = coords[0]
      const last = coords[coords.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) coords.push([first[0], first[1]])
      return coords
    })
  if (!closedRings.length) return null
  return { type: 'Polygon', coordinates: closedRings }
}

/* ------------------------------------------------------------------ */
/*  Map helpers (capture instance + fit-bounds)                        */
/* ------------------------------------------------------------------ */

function FitGlobalBounds({ positions }) {
  const map = useMap()

  useEffect(() => {
    if (!positions?.length) return
    if (positions.length === 1) {
      map.flyTo(positions[0], 13, MAP_FLY_OPTIONS)
      return
    }
    map.flyToBounds(L.latLngBounds(positions), {
      ...MAP_FLY_OPTIONS,
      padding: [56, 56],
      maxZoom: 14,
    })
  }, [map, positions])

  return null
}

function MapInstanceBridge({ onMapReady }) {
  const map = useMap()
  useEffect(() => {
    onMapReady(map)
    return () => onMapReady(null)
  }, [map, onMapReady])
  return null
}

/** Keeps Leaflet in sync when the map pane resizes — debounced to avoid jank during CSS transitions. */
function MapCanvasResizeSync({ mapInstance, containerRef }) {
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

/* ------------------------------------------------------------------ */
/*  Floating UI overlays (control panel + legend)                      */
/* ------------------------------------------------------------------ */

const MAP_HUD_GLASS =
  'rounded-xl border border-white/[0.08] bg-[rgba(20,20,20,0.75)] shadow-[0_4px_24px_rgba(0,0,0,0.5)] backdrop-blur-[12px]'

function FloatingLegend({ depotColorEntries = [], isEditing = false }) {
  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-[1000]">
      <div className={`pointer-events-auto px-3 py-2.5 ${MAP_HUD_GLASS}`}>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Legend</p>
        <div className="flex flex-col gap-1.5">
          {depotColorEntries.length > 0 && (
            <>
              <p className="text-[10px] font-medium text-zinc-500">Sectors by depot</p>
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
            Industry
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-3 w-3 rounded-full border-2 border-zinc-900 bg-amber-500" />
            Central
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-3 w-3 rounded-full border-2 border-zinc-900 bg-blue-500" />
            Depot
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-zinc-400">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-zinc-100 ring-2 ring-zinc-400/50 shadow-md" />
            Client
          </span>
          {isEditing && (
            <span className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-amber-300">
              <span className="h-3 w-3 rounded-full bg-white shadow-[0_0_0_2px_rgba(245,158,11,0.5)]" />
              Draggable corner
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function buildRegionDrawSurface(draw, { regionId = null } = {}) {
  if (!draw) return null
  return {
    regionId,
    isDrawing: draw.isDrawing,
    interactionMode: draw.interactionMode,
    traceTarget: draw.traceTarget,
    tracePickRegionId: draw.tracePickRegionId,
    traceableRegions: draw.traceableRegions,
    tracePreviewArc: draw.tracePreviewArc,
    isMapInteractionActive: draw.isMapInteractionActive,
    enableVertexEdit: draw.canVertexEdit,
    points: draw.points,
    cursorPosition: draw.cursorPosition,
    isSaved: draw.isSaved,
    onPointAdd: draw.handlePointAdd,
    onCursorMove: draw.handleCursorMove,
    onCursorLeave: draw.handleCursorLeave,
    onVertexDrag: draw.handleVertexDrag,
    onVertexEditClick: draw.handleVertexEditClick,
    onToggleDraw: draw.handleToggleDraw,
    onStartTracePick: draw.handleStartTracePick,
    onLeaveTrace: draw.handleLeaveTrace,
    onCancelTracePick: draw.handleCancelTracePick,
    onTracePickRegionChange: draw.setTracePickRegionId,
    onUndo: draw.handleUndo,
    onClear: draw.handleClear,
    onSave: draw.handleSave,
  }
}

/* ------------------------------------------------------------------ */
/*  Map Canvas — supports draggable vertex handles in edit mode         */
/* ------------------------------------------------------------------ */

function GlobalMapCanvas({
  sectors,
  regions,
  industries,
  depots,
  clients,
  vehicles,
  layerVisibility,
  mapLayerFilter,
  onMapLayerFilterChange,
  mapLayerSearch,
  onMapLayerSearchChange,
  onSelect,
  onMapReady,
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
  isEditingRegion,
  regionCreateDraw,
  regionEditDraw,
}) {
  const hudOffsetClass = useMapHudOffsetClass()
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
    () => buildVehicleMarkers(mapData.vehicles, mapData.depots),
    [mapData.vehicles, mapData.depots],
  )

  const show = layerVisibility || DEFAULT_MAP_LAYER_VISIBILITY

  /* Fit the map to the saved geometry so the viewport stays stable while editing. */
  const editingId = editingBoundary?.entityType === 'sector' ? editingBoundary.id : null

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
      for (const marker of buildVehicleMarkers(fullData.vehicles, fullData.depots)) {
        points.push(marker.position)
      }
    }
    return points
  }, [show, mapLayerFilter, regions, sectors, depots, industries, clients, vehicles])

  return (
    <div
      ref={canvasRef}
      className={`global-map-canvas relative h-full min-h-0 w-full ${
        activeRegionDraw?.isMapInteractionActive ? 'sector-boundary-map--drawing' : ''
      } ${activeRegionDraw?.enableVertexEdit ? 'sector-boundary-map--vertex-edit' : ''}`}
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
        {fitPositions.length > 0 && <FitGlobalBounds positions={fitPositions} />}
        <MapInstanceBridge onMapReady={onMapReady} />
        <MapCanvasResizeSync mapInstance={mapInstance} containerRef={canvasRef} />

        {show.regions &&
          regionLayers.map(({ region, rings }) => {
            const isThisBeingEdited =
              editingBoundary?.entityType === 'region' && editingBoundary.id === region.id
            if (regionEditDraw?.regionId === region.id) return null
            const renderRings =
              isThisBeingEdited && editingBoundary?.rings ? editingBoundary.rings : rings
            const isClickable = !isThisBeingEdited && !isCreatingRegion && !isEditingRegion
            return renderRings.map((positions, ringIndex) => (
              <Polygon
                key={`region-${region.id}-${ringIndex}`}
                positions={positions}
                pathOptions={{
                  color: REGION_LAYER_STYLE.color,
                  weight: isThisBeingEdited ? 3 : 2,
                  fillColor: REGION_LAYER_STYLE.fillColor,
                  fillOpacity: isThisBeingEdited ? 0.14 : 0.06,
                  dashArray: isThisBeingEdited ? '6 4' : '10 8',
                }}
                eventHandlers={
                  isClickable
                    ? {
                        click: () =>
                          onSelect({
                            type: 'region',
                            id: region.id,
                            name: region.region_name || region.code,
                          }),
                      }
                    : {}
                }
              >
                {isClickable && (
                  <Tooltip sticky direction="top" className="global-map-sector-tooltip">
                    {region.region_name || region.code || 'Region'}
                  </Tooltip>
                )}
              </Polygon>
            ))
          })}

        {show.sectors &&
          sectorLayers.map(({ sector, rings, style }) => {
          const isThisBeingEdited = editingId && sector.id === editingId
          const renderRings =
            isThisBeingEdited && editingBoundary?.rings ? editingBoundary.rings : rings
          const isClickable = !isThisBeingEdited
          return renderRings.map((positions, ringIndex) => (
            <Polygon
              key={`${sector.id}-${ringIndex}`}
              positions={positions}
              pathOptions={{
                color: style.color,
                weight: isThisBeingEdited ? 3 : 2,
                fillColor: style.fillColor,
                fillOpacity: isThisBeingEdited ? 0.18 : 0.1,
                dashArray: isThisBeingEdited ? '6 4' : null,
              }}
              eventHandlers={
                isClickable
                  ? {
                      click: () =>
                        onSelect({ type: 'sector', id: sector.id, name: sector.sector_name }),
                    }
                  : {}
              }
            >
              {isClickable && (
                <Tooltip sticky direction="top" className="global-map-sector-tooltip">
                  {sector.sector_name}
                </Tooltip>
              )}
            </Polygon>
          ))
        })}

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
          return (
          <Marker
            key={marker.markerKey || `industry-${marker.id}`}
            position={marker.position}
            icon={industryIcon}
            draggable={isDraggable}
            eventHandlers={{
              click: () => onSelect({ type: 'industry', id: marker.id, name: marker.name }),
              ...(isDraggable && onIndustryMarkerDrag
                ? { drag: onIndustryMarkerDrag, dragend: onIndustryMarkerDrag }
                : {}),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-sm font-semibold text-zinc-900">{marker.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">Industry</p>
              </div>
            </Popup>
          </Marker>
          )
        })}

        {show.depots &&
          depotMarkers.map((marker) => {
          const isDraggable = editingDepotId && marker.id === editingDepotId
          return (
          <Marker
            key={marker.markerKey || `depot-${marker.id}`}
            position={marker.position}
            icon={marker.isCentral ? centralDepotIcon : normalDepotIcon}
            draggable={isDraggable}
            eventHandlers={{
              click: () =>
                onSelect({
                  type: 'depot',
                  id: marker.id,
                  name: marker.name,
                  isCentral: marker.isCentral,
                }),
              ...(isDraggable && onDepotMarkerDrag ? { dragend: onDepotMarkerDrag } : {}),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-sm font-semibold text-zinc-900">{marker.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {marker.isCentral ? 'Central Depot' : 'Depot'}
                </p>
              </div>
            </Popup>
          </Marker>
          )
        })}

        {show.clients &&
          clientMarkers.map((marker) => {
          const isDraggable = editingClientId && marker.id === editingClientId
          return (
            <Marker
              key={marker.markerKey || `client-${marker.id}`}
              position={marker.position}
              icon={clientIcon}
              draggable={isDraggable}
              eventHandlers={{
                click: () => onSelect({ type: 'client', id: marker.id, name: marker.name }),
                ...(isDraggable && onClientMarkerDrag
                  ? { dragend: onClientMarkerDrag }
                  : {}),
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="text-sm font-semibold text-zinc-900">{marker.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">Client</p>
                </div>
              </Popup>
            </Marker>
          )
        })}

        {show.vehicles &&
          vehicleMarkers.map((marker) => (
            <Marker
              key={marker.markerKey || `vehicle-${marker.id}`}
              position={marker.position}
              icon={vehicleIcon}
              eventHandlers={{
                click: () =>
                  onSelect({
                    type: 'vehicle',
                    id: marker.id,
                    name: marker.name,
                  }),
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <p className="text-sm font-semibold text-zinc-900">{marker.name}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {marker.model ? `${marker.model} · ` : ''}
                    {marker.depotName || 'Depot'}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {marker.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </Popup>
            </Marker>
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
        searchDisabled={isCreatingRegion}
      />
      {show.sectors && (
        <FloatingLegend depotColorEntries={depotColorEntries} isEditing={isEditingMap} />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Region create rail — metadata only; draw tools live on the map     */
/* ------------------------------------------------------------------ */

const EMPTY_CREATE_REGION_FORM = {
  regionName: '',
  code: '',
  isActive: true,
  boundary: null,
}

const createRailInputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20'

function regionBoundaryPointCount(boundary) {
  const ring = boundary?.coordinates?.[0]
  if (!Array.isArray(ring) || ring.length < 4) return 0
  return ring.length - 1
}

function RegionCreateRail({
  form,
  onChange,
  clipNotice,
  formError,
  isSubmitting,
  onSubmit,
  onCancel,
}) {
  const boundaryReady = isValidRegionPolygon(form.boundary)

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <EntityIconBadge moduleKey="region" size="md" variant="dark" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100">Add Region</p>
            <p className="mt-0.5 text-xs text-zinc-500">Use the map toolbar to trace or draw the boundary.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel create region"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 no-scrollbar">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Region name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.regionName}
              onChange={(e) => onChange({ regionName: e.target.value })}
              placeholder="e.g. Grand Alger"
              className={createRailInputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Code</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => onChange({ code: e.target.value })}
              placeholder="e.g. ALG-N"
              className={createRailInputClass}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Status</label>
            <EntitySegmentedControl
              value={form.isActive}
              onChange={(v) => onChange({ isActive: v })}
              options={[
                { value: true, label: 'Active' },
                { value: false, label: 'Inactive' },
              ]}
            />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Boundary</p>
            {boundaryReady ? (
              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                Boundary captured ({regionBoundaryPointCount(form.boundary)} points)
              </span>
            ) : (
              <p className="mt-2 text-sm text-zinc-400">
                Use the toolbar on the main map to draw the boundaries.
              </p>
            )}
          </div>

          {clipNotice && (
            <div
              className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
                clipNotice.includes('adjusted') || clipNotice.includes('saved')
                  ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200'
                  : 'border-amber-500/30 bg-amber-500/5 text-amber-200'
              }`}
            >
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{clipNotice}</span>
            </div>
          )}

          {formError && (
            <p className="text-sm text-red-400">{formError}</p>
          )}
        </div>

        <div className="border-t border-zinc-800 p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/60 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? 'Creating…' : 'Create Region'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail panel — entity meta + helpers + profile components          */
/* ------------------------------------------------------------------ */

const ENTITY_META = {
  sector: {
    label: 'Sector',
    icon: Building2,
    accent: 'text-amber-400 bg-amber-500/10 ring-amber-500/30',
    detailPath: (id) => `/sectors/${id}`,
  },
  depot: {
    label: 'Depot',
    icon: Warehouse,
    accent: 'text-blue-400 bg-blue-500/10 ring-blue-500/30',
    detailPath: (id) => `/depots/${id}`,
  },
  industry: {
    label: 'Industry',
    icon: Factory,
    accent: 'text-rose-400 bg-rose-500/10 ring-rose-500/30',
    detailPath: (id) => `/industries/${id}`,
  },
  client: {
    label: 'Client',
    icon: User2,
    accent: 'text-zinc-200 bg-zinc-100/10 ring-zinc-400/30',
    detailPath: (id) => `/clients/${id}`,
  },
  vehicle: {
    label: 'Vehicle',
    icon: Truck,
    accent: 'text-violet-400 bg-violet-500/10 ring-violet-500/30',
    detailPath: null,
  },
  region: {
    label: 'Region',
    icon: MapIcon,
    accent: 'text-orange-400 bg-orange-500/10 ring-orange-500/30',
    detailPath: null,
  },
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-zinc-800" />
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-zinc-800/70 py-3 last:border-0"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-800" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="h-8 w-full animate-pulse rounded-md bg-zinc-800" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EditSectorForm — controlled inputs for the editing flow            */
/* ------------------------------------------------------------------ */

function EditFormField({ icon: Icon, label, children, iconAccent = 'text-zinc-400 bg-zinc-800/70' }) {
  return (
    <label className="flex items-start gap-3 py-2">
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconAccent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</p>
        <div className="mt-1">{children}</div>
      </div>
    </label>
  )
}

const baseInputClass =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60'
const baseSelectClass = baseInputClass + ' appearance-none pr-8'

function EditRegionForm({ form, onChange, clipNotice = '' }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-orange-400">
          Editing Region
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Use the map toolbar to trace shared edges or free-draw open sides. Drag corners or click a
          boundary line to add a new one.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4">
        <EditFormField
          icon={MapIcon}
          label="Region Name"
          iconAccent="text-orange-300 bg-orange-500/10"
        >
          <input
            type="text"
            value={form.regionName}
            onChange={(e) => onChange({ regionName: e.target.value })}
            className={baseInputClass}
            placeholder="e.g. Casablanca North"
          />
        </EditFormField>

        <EditFormField icon={FileText} label="Code" iconAccent="text-zinc-400 bg-zinc-800/70">
          <input
            type="text"
            value={form.code}
            onChange={(e) => onChange({ code: e.target.value })}
            className={baseInputClass}
            placeholder="Short code (optional)"
          />
        </EditFormField>

        <EditFormField icon={Power} label="Status" iconAccent="text-zinc-400 bg-zinc-800/70">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={Boolean(form.isActive)}
              onChange={(e) => onChange({ isActive: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-orange-500 focus:ring-orange-500/30"
            />
            Active
          </label>
        </EditFormField>
      </div>

      <div className="flex items-start gap-2.5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2.5">
        <MapIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
        <p className="text-xs leading-relaxed text-zinc-400">
          <span className="text-zinc-300">Trace neighbor</span> for shared borders,{' '}
          <span className="text-zinc-300">Free draw</span> for open sides, drag orange handles to
          move corners, or click a line segment to insert a new corner.
        </p>
      </div>

      {clipNotice && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            clipNotice.includes('saved') || clipNotice.includes('added')
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          }`}
        >
          {clipNotice}
        </div>
      )}
    </div>
  )
}

function EditSectorForm({ form, onChange, regions, depots, users }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
          Editing Sector
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Update the metadata and drag any white corner on the map to reshape the boundary.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4">
        <EditFormField
          icon={Building2}
          label="Sector Name"
          iconAccent="text-amber-300 bg-amber-500/10"
        >
          <input
            type="text"
            value={form.sectorName}
            onChange={(e) => onChange({ sectorName: e.target.value })}
            placeholder="e.g. Casablanca North"
            className={baseInputClass}
            maxLength={120}
          />
        </EditFormField>

        <EditFormField icon={Globe} label="Region" iconAccent="text-sky-300 bg-sky-500/10">
          <select
            value={form.regionId}
            onChange={(e) => onChange({ regionId: e.target.value })}
            className={baseSelectClass}
          >
            <option value="">No region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.region_name}
              </option>
            ))}
          </select>
        </EditFormField>

        <EditFormField
          icon={Warehouse}
          label="Fulfillment Depot"
          iconAccent="text-blue-300 bg-blue-500/10"
        >
          <select
            value={form.depotId}
            onChange={(e) => onChange({ depotId: e.target.value })}
            className={baseSelectClass}
          >
            <option value="">No depot</option>
            {depots.map((depot) => (
              <option key={depot.id} value={depot.id}>
                {depot.depot_name}
              </option>
            ))}
          </select>
        </EditFormField>

        <EditFormField
          icon={UserCheck}
          label="Default Owner"
          iconAccent="text-violet-300 bg-violet-500/10"
        >
          <select
            value={form.assignedProfileId}
            onChange={(e) => onChange({ assignedProfileId: e.target.value })}
            className={baseSelectClass}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email || user.id}
              </option>
            ))}
          </select>
        </EditFormField>

        <EditFormField icon={Power} label="Status" iconAccent="text-emerald-300 bg-emerald-500/10">
          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => onChange({ isActive: !form.isActive })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition ${
              form.isActive
                ? 'border-emerald-500/40 bg-emerald-500/20'
                : 'border-zinc-700 bg-zinc-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                form.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
            <span className="sr-only">Toggle status</span>
          </button>
          <span className="ml-3 text-xs font-medium text-zinc-300">
            {form.isActive ? 'Active' : 'Inactive'}
          </span>
        </EditFormField>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          Tip — Editing on the map
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">
          Each white dot is a corner. Drag it to a new street or landmark. The polygon
          will stretch to follow.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EditClientForm — controlled inputs for the client editing flow    */
/* ------------------------------------------------------------------ */

function EditClientForm({ form, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
          Editing Client
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Update the profile fields below. Drag the white dot on the map to adjust the location.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4">
        <EditFormField
          icon={Store}
          label="Store Name"
          iconAccent="text-amber-300 bg-amber-500/10"
        >
          <input
            type="text"
            value={form.storeName}
            onChange={(e) => onChange({ storeName: e.target.value })}
            placeholder="e.g. Acme Store"
            className={baseInputClass}
            maxLength={120}
          />
        </EditFormField>

        <EditFormField
          icon={User2}
          label="Client Name"
          iconAccent="text-zinc-300 bg-zinc-500/10"
        >
          <input
            type="text"
            value={form.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="e.g. John Doe"
            className={baseInputClass}
            maxLength={120}
          />
        </EditFormField>

        <EditFormField
          icon={Phone}
          label="Phone"
          iconAccent="text-emerald-300 bg-emerald-500/10"
        >
          <input
            type="text"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="e.g. +212 6 XX XX XX XX"
            className={baseInputClass}
            maxLength={30}
          />
        </EditFormField>

        <EditFormField
          icon={MapPin}
          label="Address"
          iconAccent="text-sky-300 bg-sky-500/10"
        >
          <input
            type="text"
            value={form.clientAddress}
            onChange={(e) => onChange({ clientAddress: e.target.value })}
            placeholder="e.g. 123 Main St"
            className={baseInputClass}
            maxLength={255}
          />
        </EditFormField>

        <EditFormField
          icon={MapPin}
          label="City"
          iconAccent="text-violet-300 bg-violet-500/10"
        >
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="e.g. Casablanca"
            className={baseInputClass}
            maxLength={100}
          />
        </EditFormField>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
          Tip — Drag the marker on the map
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">
          The white client dot on the map is now draggable. Drag it to the correct location.
        </p>
      </div>
    </div>
  )
}

function EditDepotForm({ form, onChange }) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">Editing Depot</p>
        <p className="mt-1 text-xs text-zinc-500">
          Update fields below and drag the depot pin on the map to adjust GPS.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4">
        <EditFormField icon={Warehouse} label="Depot Name" iconAccent="text-blue-300 bg-blue-500/10">
          <input
            type="text"
            value={form.depotName}
            onChange={(e) => onChange({ depotName: e.target.value })}
            className={baseInputClass}
            maxLength={200}
          />
        </EditFormField>
        <EditFormField icon={MapPin} label="Address" iconAccent="text-sky-300 bg-sky-500/10">
          <input
            type="text"
            value={form.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className={baseInputClass}
            maxLength={255}
          />
        </EditFormField>
        <EditFormField icon={Banknote} label="Price Capacity (DA)" iconAccent="text-amber-300 bg-amber-500/10">
          <input
            type="number"
            min={0}
            value={form.totalPriceCapacity}
            onChange={(e) => onChange({ totalPriceCapacity: e.target.value })}
            className={baseInputClass}
          />
        </EditFormField>
        <EditFormField icon={Box} label="Volume Capacity (L)" iconAccent="text-blue-300 bg-blue-500/10">
          <input
            type="number"
            min={0}
            value={form.totalVolumeCapacity}
            onChange={(e) => onChange({ totalVolumeCapacity: e.target.value })}
            className={baseInputClass}
          />
        </EditFormField>
        <EditFormField icon={Power} label="Auto-Approve Replenishment" iconAccent="text-emerald-300 bg-emerald-500/10">
          <button
            type="button"
            role="switch"
            aria-checked={form.autoApproveReplenishment}
            onClick={() => onChange({ autoApproveReplenishment: !form.autoApproveReplenishment })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border transition ${
              form.autoApproveReplenishment
                ? 'border-emerald-500/40 bg-emerald-500/20'
                : 'border-zinc-700 bg-zinc-800'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                form.autoApproveReplenishment ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="ml-3 text-xs font-medium text-zinc-300">
            {form.autoApproveReplenishment ? 'Enabled' : 'Disabled'}
          </span>
        </EditFormField>
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">Tip — Drag the depot pin</p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-300">
          The warehouse marker on the map is draggable while editing.
        </p>
      </div>
    </div>
  )
}

function EditIndustryForm({ form, onChange }) {
  return (
    <div className="space-y-5">
      <IndustryFormFields form={form} onChange={onChange} variant="dark" />

      <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2.5">
        <Factory className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
        <p className="text-xs leading-relaxed text-zinc-400">
          Drag the <span className="text-zinc-300">rose factory pin</span> on the map — coordinates update live in the fields above.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DetailPanel — header + body + restyled footer (with edit buttons)  */
/* ------------------------------------------------------------------ */

function DetailPanel({
  selectedElement,
  details,
  isLoadingDetails,
  detailsError,
  isEditing,
  isSavingEdit,
  saveError,
  editForm,
  onEditFormChange,
  regions,
  depots,
  users,
  editOptionsLoading,
  editOptionsError,
  canManageLogistics,
  onClose,
  onNavigate,
  onEnterEdit,
  onSaveEdit,
  onCancelEdit,
  onClientDetailsUpdate,
  regionEditClipNotice = '',
}) {
  if (!selectedElement) return null
  const meta = ENTITY_META[selectedElement.type]
  if (!meta) return null
  const Icon = meta.icon
  const isSector = selectedElement.type === 'sector'
  const isClient = selectedElement.type === 'client'
  const isDepot = selectedElement.type === 'depot'
  const isVehicle = selectedElement.type === 'vehicle'
  const isRegion = selectedElement.type === 'region'
  const moduleKey = selectedElement.type
  const mod = getLogisticsModule(moduleKey)
  const isIndustry = moduleKey === 'industry'
  const editTitle =
    editForm?.depotName ||
    editForm?.industryName ||
    editForm?.storeName ||
    editForm?.clientName ||
    editForm?.sectorName ||
    editForm?.regionName

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {mod && (
            <EntityBreadcrumb
              moduleKey={moduleKey}
              entityName={
                !isEditing ? getEntityDisplayName(moduleKey, details, selectedElement.name) : undefined
              }
              mode="panel"
              onNavigate={onNavigate}
            />
          )}
          <div className="flex min-w-0 items-start gap-3">
            {mod ? (
              <EntityIconBadge moduleKey={moduleKey} size="md" variant="dark" />
            ) : (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.accent}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
            )}
            <div className="min-w-0">
              {!isEditing && details ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {getEntityDisplayName(moduleKey, details, selectedElement.name || meta.label)}
                    </p>
                    {isIndustry && <IndustryTypeBadge isInternal={details.is_internal} compact />}
                    {moduleKey === 'depot' && details.is_central && (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        Central
                      </span>
                    )}
                  </div>
                  <EntityPanelSubtitle moduleKey={moduleKey} details={details} />
                </>
              ) : isEditing ? (
                <>
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {editTitle || selectedElement.name || meta.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">Editing on map</p>
                </>
              ) : (
                <>
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {selectedElement.name || meta.label}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">{meta.label} Details</p>
                </>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 no-scrollbar">
        {editOptionsError && isEditing && (isSector || isDepot || isIndustry) && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{editOptionsError}</span>
          </div>
        )}
        {editOptionsLoading && isEditing && isSector ? (
          <ProfileSkeleton />
        ) : isSector ? (
          isEditing ? (
            <EditSectorForm
              form={editForm}
              onChange={onEditFormChange}
              regions={regions}
              depots={depots}
              users={users}
            />
          ) : (
            <SectorDetailsContent
              sector={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
            />
          )
        ) : isClient ? (
          isEditing ? (
            <EditClientForm form={editForm} onChange={onEditFormChange} />
          ) : (
            <ClientDetailsContent
              client={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
              onClientUpdate={onClientDetailsUpdate}
            />
          )
        ) : isDepot ? (
          isEditing ? (
            <EditDepotForm form={editForm} onChange={onEditFormChange} />
          ) : (
            <DepotDetailsContent
              depot={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
            />
          )
        ) : isIndustry ? (
          isEditing ? (
            <EditIndustryForm form={editForm} onChange={onEditFormChange} />
          ) : (
            <IndustryDetailsContent
              industry={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
            />
          )
        ) : isVehicle ? (
          <VehicleDetailsContent
            vehicle={details}
            isLoading={isLoadingDetails && !details}
            error={detailsError}
            layout="panel"
          />
        ) : isRegion ? (
          isEditing ? (
            <EditRegionForm
              form={editForm}
              onChange={onEditFormChange}
              clipNotice={regionEditClipNotice}
            />
          ) : (
            <RegionDetailsContent
              region={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
            />
          )
        ) : null}
      </div>

      {/* Footer action(s) */}
      <div className="border-t border-zinc-800 p-4">
        {saveError && isEditing && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-xs text-red-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {isEditing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSavingEdit}
              className="flex-1 rounded-xl border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/60 active:bg-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={isSavingEdit}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50"
            >
              {isSavingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSavingEdit ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {canManageLogistics && details && (isSector || isRegion || isClient || isDepot || isIndustry) && (
              <button
                type="button"
                onClick={onEnterEdit}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
                {isSector || isRegion ? 'Edit Location / Boundary' : 'Edit Location / Details'}
              </button>
            )}
            {mod?.hasDetailPage && (
              <button
                type="button"
                onClick={() => onNavigate(mod.detailPath(selectedElement.id))}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white"
              >
                <ExternalLink className="h-4 w-4" />
                Open Full Profile
              </button>
            )}
            {mod && (
              <button
                type="button"
                onClick={() => onNavigate(mod.listPath)}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
              >
                All {mod.plural}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Lightweight toast (success only — errors render inline above)     */
/* ------------------------------------------------------------------ */

function EditToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [message, onClose])
  if (!message) return null
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[1200] -translate-x-1/2">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-zinc-950/95 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-2xl backdrop-blur">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {message}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

async function fetchAllClients(signal) {
  const pageSize = 100
  let page = 1
  let totalPages = 1
  const all = []

  while (page <= totalPages) {
    const res = await apiInstance.get('/clients', {
      params: { page, limit: pageSize },
      signal,
    })
    const batch = res.data?.data?.clients || []
    all.push(...batch)
    totalPages = res.data?.data?.pagination?.pages || 1
    page += 1
  }

  return all
}

const EMPTY_EDIT_FORM = {
  sectorName: '',
  regionId: '',
  depotId: '',
  assignedProfileId: '',
  isActive: true,
}

function buildEditFormFromSector(sector) {
  if (!sector) return EMPTY_EDIT_FORM
  return {
    sectorName: sector.sector_name || '',
    regionId: sector.region_id || '',
    depotId: sector.depot_id || '',
    assignedProfileId: sector.assigned_profile_id || '',
    isActive: sector.is_active !== false,
  }
}

const EMPTY_REGION_EDIT_FORM = {
  regionName: '',
  code: '',
  isActive: true,
}

function buildEditFormFromRegion(region) {
  if (!region) return { ...EMPTY_REGION_EDIT_FORM }
  return {
    regionName: region.region_name || '',
    code: region.code || '',
    isActive: region.is_active !== false,
  }
}

/* Client edit form helpers */
const EMPTY_CLIENT_EDIT_FORM = {
  storeName: '',
  clientName: '',
  phone: '',
  clientAddress: '',
  city: '',
  gpsLatitude: '',
  gpsLongitude: '',
}

function buildEditFormFromClient(client) {
  if (!client) return { ...EMPTY_CLIENT_EDIT_FORM }
  return {
    storeName: client.store_name || '',
    clientName: client.client_name || '',
    phone: client.phone || '',
    clientAddress: client.client_address || '',
    city: client.city || '',
    gpsLatitude: client.gps_latitude || '',
    gpsLongitude: client.gps_longitude || '',
  }
}

const EMPTY_DEPOT_EDIT_FORM = {
  depotName: '',
  address: '',
  totalPriceCapacity: '',
  totalVolumeCapacity: '',
  autoApproveReplenishment: false,
  gpsLatitude: '',
  gpsLongitude: '',
}

function buildEditFormFromDepot(depot) {
  if (!depot) return { ...EMPTY_DEPOT_EDIT_FORM }
  return {
    depotName: depot.depot_name || '',
    address: depot.address || '',
    totalPriceCapacity: depot.total_price_capacity ?? '',
    totalVolumeCapacity: depot.total_volume_capacity ?? '',
    autoApproveReplenishment: Boolean(depot.auto_approve_replenishment),
    gpsLatitude: depot.gps_latitude ?? '',
    gpsLongitude: depot.gps_longitude ?? '',
  }
}

const EMPTY_INDUSTRY_EDIT_FORM = {
  industryName: '',
  description: '',
  isInternal: false,
  isActive: true,
  gpsLatitude: '',
  gpsLongitude: '',
}

function buildEditFormFromIndustry(industry) {
  if (!industry) return { ...EMPTY_INDUSTRY_EDIT_FORM }
  return {
    industryName: industry.industry_name || '',
    description: industry.description || '',
    isInternal: Boolean(industry.is_internal),
    isActive: industry.is_active !== false,
    gpsLatitude: industry.gps_latitude ?? '',
    gpsLongitude: industry.gps_longitude ?? '',
  }
}

const DETAIL_DATA_KEY = {
  sector: 'sector',
  client: 'client',
  depot: 'depot',
  industry: 'industry',
  region: 'region',
}

const DETAIL_API_PATH = {
  sector: 'sectors',
  client: 'clients',
  depot: 'depots',
  industry: 'industries',
  region: 'regions',
}

/** Keep map list rows small and stable — never spread full detail payloads into depots[]. */
function normalizeDepotForMap(depot) {
  if (!depot?.id) return null
  return {
    id: depot.id,
    depot_name: depot.depot_name,
    address: depot.address,
    gps_latitude: depot.gps_latitude,
    gps_longitude: depot.gps_longitude,
    total_price_capacity: depot.total_price_capacity,
    total_volume_capacity: depot.total_volume_capacity,
    is_active: depot.is_active,
    is_central: depot.is_central,
    parent_depot_id: depot.parent_depot_id,
    auto_approve_replenishment: depot.auto_approve_replenishment,
    capacity_usage: depot.capacity_usage,
  }
}

function normalizeIndustryForMap(industry) {
  if (!industry?.id) return null
  return {
    id: industry.id,
    industry_name: industry.industry_name,
    description: industry.description,
    is_internal: industry.is_internal,
    is_active: industry.is_active,
    gps_latitude: industry.gps_latitude,
    gps_longitude: industry.gps_longitude,
  }
}

/** Vehicles have no GPS — plot at assigned depot with a small offset when stacked. */
function buildVehicleMarkers(vehicles, depots) {
  const depotById = new Map((depots || []).map((d) => [d.id, d]))
  const perDepotCount = new Map()

  return dedupeById(vehicles)
    .map((vehicle) => {
      const depot = depotById.get(vehicle.depot_id)
      if (!depot) return null
      const lat = Number(depot.gps_latitude)
      const lng = Number(depot.gps_longitude)
      if (!hasGpsCoordinates(lat, lng)) return null

      const n = perDepotCount.get(vehicle.depot_id) || 0
      perDepotCount.set(vehicle.depot_id, n + 1)
      const angle = (n * 47 * Math.PI) / 180
      const offset = 0.00012 * (n + 1)

      return {
        id: vehicle.id,
        name: vehicle.plate_number || 'Vehicle',
        model: vehicle.model,
        depotName: depot.depot_name,
        isActive: vehicle.is_active !== false,
        position: [lat + Math.sin(angle) * offset, lng + Math.cos(angle) * offset],
        markerKey: `vehicle-${vehicle.id}-${n}`,
      }
    })
    .filter(Boolean)
}

function dedupeById(items) {
  const seen = new Set()
  return (items || []).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function GlobalMapPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasPermission } = useAuth()
  const canManageLogistics = hasPermission('manage_logistics')
  const controllerRef = useRef(null)
  const detailsControllerRef = useRef(null)
  const mapCanvasRef = useRef(null)

  const [sectors, setSectors] = useState([])
  const [depots, setDepots] = useState([])
  const [industries, setIndustries] = useState([])
  const [clients, setClients] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [mapLayerFilter, setMapLayerFilter] = useState(() =>
    readMapLayerFilter(MAP_LAYER_FILTER_STORAGE_KEY),
  )
  const [mapLayerSearch, setMapLayerSearch] = useState('')
  const layerVisibility = useMemo(
    () => visibilityFromFilter(mapLayerFilter),
    [mapLayerFilter],
  )

  // Explorer state
  const [selectedElement, setSelectedElement] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)

  // Side-panel detail state (real data fetched on demand)
  const [details, setDetails] = useState(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM)
  const [editRings, setEditRings] = useState(null) // array of rings [[lat,lng], ...]
  const [regions, setRegions] = useState([])
  const [editDepots, setEditDepots] = useState([])
  const [users, setUsers] = useState([])
  const [editOptionsLoading, setEditOptionsLoading] = useState(false)
  const [editOptionsError, setEditOptionsError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [toast, setToast] = useState('')
  const deepLinkHandledRef = useRef(false)
  const createRegionSessionRef = useRef(null)

  const isCreatingRegion = searchParams.get('create') === 'region'
  const [createRegionForm, setCreateRegionForm] = useState(EMPTY_CREATE_REGION_FORM)
  const [createRegionError, setCreateRegionError] = useState('')
  const [isCreatingRegionSubmitting, setIsCreatingRegionSubmitting] = useState(false)

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
    setSearchParams({}, { replace: true })
  }, [regionDraw, setSearchParams])

  const startRegionCreate = useCallback(() => {
    createRegionSessionRef.current = 'started'
    regionDraw.reset()
    setCreateRegionForm({ ...EMPTY_CREATE_REGION_FORM })
    setCreateRegionError('')
    setSelectedElement(null)
    setIsEditing(false)
    setMapLayerFilter('regions')
    setSearchParams({ create: 'region' }, { replace: true })
  }, [regionDraw, setSearchParams])

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
      const marker = buildVehicleMarkers(vehicles, depots).find((item) => item.id === row.id)
      if (marker) {
        mapInstance.flyTo(marker.position, 15, MAP_FLY_OPTIONS)
      }
      return
    }

    if ((type === 'sector' || type === 'region') && row.boundary) {
      const rings = polygonRingsFromBoundary(row.boundary)
      const points = rings.flat()
      if (points.length) {
        mapInstance.flyToBounds(points, {
          ...MAP_FLY_OPTIONS,
          padding: type === 'region' ? [40, 40] : [48, 48],
        })
      }
      return
    }

    const lat = row.gps_latitude
    const lng = row.gps_longitude
    if (hasGpsCoordinates(lat, lng)) {
      mapInstance.flyTo([Number(lat), Number(lng)], 14, MAP_FLY_OPTIONS)
    }
  }, [isLoading, industries, depots, sectors, clients, regions, vehicles, mapInstance, searchParams, setSearchParams])

  const refreshMapData = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setLoadError('')
    try {
      const [sectorsRes, depotsRes, industriesRes, regionsRes, vehiclesRes, clientsList] =
        await Promise.all([
          apiInstance.get('/sectors', { signal: controller.signal }),
          apiInstance.get('/depots', { signal: controller.signal }),
          apiInstance.get('/industries', { signal: controller.signal }),
          apiInstance.get('/regions', { signal: controller.signal }),
          apiInstance.get('/logistics/vehicles', { signal: controller.signal }),
          fetchAllClients(controller.signal),
        ])

      if (controller.signal.aborted) return

      setSectors(sectorsRes.data?.data?.sectors || [])
      setDepots(
        dedupeById((depotsRes.data?.data?.depots || []).map(normalizeDepotForMap).filter(Boolean)),
      )
      setIndustries(industriesRes.data?.data?.industries || [])
      setRegions(regionsRes.data?.data?.regions || [])
      setVehicles(vehiclesRes.data?.data?.vehicles || [])
      setClients(clientsList)
    } catch (error) {
      if (error.name === 'CanceledError' || controller.signal.aborted) return
      setLoadError(error.response?.data?.message || error.message || 'Failed to load map data')
      setSectors([])
      setDepots([])
      setIndustries([])
      setRegions([])
      setVehicles([])
      setClients([])
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshMapData()
    return () => controllerRef.current?.abort()
  }, [refreshMapData])

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

  const handleMapLayerFilterChange = useCallback((filter) => {
    setMapLayerFilter(filter)
    setMapLayerSearch('')
    setSelectedElement(null)
    setIsEditing(false)
    setEditForm(EMPTY_EDIT_FORM)
    setEditRings(null)
    setSaveError('')
  }, [])

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
      setDetails(vehicle)
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
  }, [selectedElement, vehicles])

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
      if (isCreatingRegion) return
      setSelectedElement(payload)

      if (!mapInstance) return

      if (payload?.type === 'region') {
        const region = regions.find((r) => r.id === payload.id)
        if (region?.boundary) {
          const rings = polygonRingsFromBoundary(region.boundary)
          const points = rings.flat()
          if (points.length) mapInstance.flyToBounds(points, { ...MAP_FLY_OPTIONS, padding: [40, 40] })
        }
        return
      }

      if (payload?.type === 'vehicle') {
        const marker = buildVehicleMarkers(vehicles, depots).find((item) => item.id === payload.id)
        if (marker) {
          mapInstance.flyTo(marker.position, 15, MAP_FLY_OPTIONS)
        }
      }

      if (payload?.type === 'sector') {
        const sector = sectors.find((s) => s.id === payload.id)
        if (sector?.boundary) {
          const rings = polygonRingsFromBoundary(sector.boundary)
          const points = rings.flat()
          if (points.length) mapInstance.flyToBounds(points, { ...MAP_FLY_OPTIONS, padding: [48, 48] })
        }
      }
    },
    [isCreatingRegion, regions, sectors, mapInstance, vehicles, depots],
  )

  const handleClose = useCallback(() => {
    regionEditDrawHook.reset()
    setRegionEditSeed(null)
    setSelectedElement(null)
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

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      {/* MAP — always 2/3; right rail is always visible (home or entity detail) */}
      <div className="relative h-full min-h-0 min-w-0 w-2/3 shrink-0 overflow-hidden transition-all duration-300">
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
            <p className="mt-4 text-sm font-medium text-zinc-400">Loading operational map…</p>
            <p className="mt-1 text-xs text-zinc-600">Fetching map layers…</p>
          </div>
        ) : (
          <GlobalMapCanvas
            sectors={sectors}
            regions={regions}
            industries={industries}
            depots={depots}
            clients={clients}
            vehicles={vehicles}
            layerVisibility={layerVisibility}
            mapLayerFilter={mapLayerFilter}
            onMapLayerFilterChange={handleMapLayerFilterChange}
            mapLayerSearch={mapLayerSearch}
            onMapLayerSearchChange={handleMapLayerSearchChange}
            onSelect={handleSelect}
            onMapReady={handleMapReady}
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
            isEditingRegion={isEditingRegion}
            regionCreateDraw={regionCreateDraw}
            regionEditDraw={regionEditDraw}
          />
        )}
      </div>

      {/* RIGHT RAIL — default: Home (Executive); on map click: entity detail */}
      <div className="flex h-full w-1/3 min-w-0 shrink-0 flex-col overflow-hidden border-l border-zinc-800 bg-[#1c1c1e] shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] z-[1100] transition-all duration-300">
        {isCreatingRegion ? (
          <RegionCreateRail
            form={createRegionForm}
            onChange={(patch) => setCreateRegionForm((prev) => ({ ...prev, ...patch }))}
            clipNotice={regionDraw.clipNotice}
            formError={createRegionError}
            isSubmitting={isCreatingRegionSubmitting}
            onSubmit={handleCreateRegionSubmit}
            onCancel={cancelRegionCreate}
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
          />
        ) : (
          <MapLayerRailRouter
            filter={mapLayerFilter}
            searchQuery={mapLayerSearch}
            isLoading={isLoading}
            onRefresh={refreshMapData}
            onSelectItem={handleSelect}
            onStartRegionCreate={startRegionCreate}
            regions={regions}
            sectors={sectors}
            depots={depots}
            industries={industries}
            clients={clients}
            vehicles={vehicles}
          />
        )}
      </div>

      <EditToast message={toast} onClose={() => setToast('')} />
    </div>
  )
}

export default GlobalMapPage
