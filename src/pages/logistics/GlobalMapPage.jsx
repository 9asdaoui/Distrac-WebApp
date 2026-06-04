import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Globe,
  Loader2,
  X,
  Building2,
  Warehouse,
  Factory,
  User2,
  MapPin,
  ExternalLink,
} from 'lucide-react'
import { hasGpsCoordinates } from '../../components/LocationMap'
import { parseSectorBoundary } from '../../components/SectorBoundaryPreview'
import { latLngPairsFromGeometry } from '../../components/SectorBoundaryDrawer'
import apiInstance from '../../api/axiosInstance'

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const DEFAULT_CENTER = [33.5731, -7.5898]
const DEFAULT_ZOOM = 6

/** Border + fill pairs: Emerald, Amber, Blue, Purple (assigned per depot_id) */
const DEPOT_SECTOR_PALETTE = [
  { color: '#34d399', fillColor: '#10b981' },
  { color: '#fbbf24', fillColor: '#d97706' },
  { color: '#60a5fa', fillColor: '#2563eb' },
  { color: '#c084fc', fillColor: '#9333ea' },
]

const UNASSIGNED_SECTOR_STYLE = { color: '#71717a', fillColor: '#52525b' }

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

/* ------------------------------------------------------------------ */
/*  Map helpers (capture instance + fit-bounds)                        */
/* ------------------------------------------------------------------ */

function FitGlobalBounds({ positions }) {
  const map = useMap()

  useEffect(() => {
    if (!positions?.length) return
    if (positions.length === 1) {
      map.setView(positions[0], 13)
      return
    }
    map.fitBounds(L.latLngBounds(positions), { padding: [56, 56], maxZoom: 14 })
  }, [map, positions])

  return null
}

/**
 * Captures the live Leaflet map instance and bubbles it up to the parent
 * via `onMapReady`. This is the only way to access the map instance from
 * outside <MapContainer> in react-leaflet, and it powers the
 * `invalidateSize()` resize fix when the right-hand panel opens/closes.
 */
function MapInstanceBridge({ onMapReady }) {
  const map = useMap()
  useEffect(() => {
    onMapReady(map)
    return () => onMapReady(null)
  }, [map, onMapReady])
  return null
}

/* ------------------------------------------------------------------ */
/*  Floating UI overlays (header + legend)                             */
/* ------------------------------------------------------------------ */

function FloatingHeader({ sectors, depots, industries, clients }) {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-[1000] max-w-sm">
      <div className="pointer-events-auto rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-lg backdrop-blur-md">
        <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-100">
          <Globe className="h-5 w-5 text-zinc-400" />
          Global Map
        </h1>
        <p className="mt-1 text-xs text-zinc-500">Operational overview</p>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
          <span>
            <span className="font-medium text-zinc-200">{sectors}</span> sectors
          </span>
          <span>
            <span className="font-medium text-zinc-200">{depots}</span> depots
          </span>
          <span>
            <span className="font-medium text-zinc-200">{industries}</span> industries
          </span>
          <span>
            <span className="font-medium text-zinc-200">{clients}</span> clients
          </span>
        </div>
      </div>
    </div>
  )
}

function FloatingLegend({ depotColorEntries = [] }) {
  const items = [
    { label: 'Industry', dot: 'h-3 w-3 rounded-full border-2 border-zinc-900 bg-rose-500' },
    { label: 'Central', dot: 'h-3 w-3 rounded-full border-2 border-zinc-900 bg-amber-500' },
    { label: 'Depot', dot: 'h-3 w-3 rounded-full border-2 border-zinc-900 bg-blue-500' },
    {
      label: 'Client',
      dot: 'h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-zinc-100 ring-2 ring-zinc-400/50 shadow-md',
    },
  ]

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-[1000]">
      <div className="pointer-events-auto rounded-xl border border-zinc-800 bg-zinc-900/80 px-3 py-2.5 shadow-lg backdrop-blur-md">
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
          {items.map((item) => (
            <span key={item.label} className="inline-flex items-center gap-2 text-xs text-zinc-400">
              <span className={item.dot} />
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Map Canvas — extracted so it can be re-mounted cleanly              */
/* ------------------------------------------------------------------ */

function GlobalMapCanvas({ sectors, industries, depots, clients, onSelect, onMapReady }) {
  const depotColorMap = useMemo(() => {
    const ids = [
      ...(depots || []).map((row) => row.id),
      ...(sectors || []).map((row) => row.depot_id),
    ]
    return buildDepotColorMap(ids)
  }, [depots, sectors])

  const depotColorEntries = useMemo(() => {
    const depotById = new Map((depots || []).map((row) => [row.id, row.depot_name || 'Depot']))
    return [...depotColorMap.entries()].map(([depotId, style]) => ({
      depotId,
      depotName: depotById.get(depotId) || `Depot ${depotId.slice(0, 8)}…`,
      style,
    }))
  }, [depotColorMap, depots])

  const sectorLayers = useMemo(
    () =>
      (sectors || []).map((sector) => {
        const rings = polygonRingsFromBoundary(sector.boundary)
        const style = getSectorColor(sector.depot_id, depotColorMap)
        return { sector, rings, style }
      }),
    [sectors, depotColorMap],
  )

  const industryMarkers = useMemo(
    () =>
      (industries || [])
        .filter((row) => hasGpsCoordinates(row.gps_latitude, row.gps_longitude))
        .map((row) => ({
          id: row.id,
          name: row.industry_name,
          position: [Number(row.gps_latitude), Number(row.gps_longitude)],
        })),
    [industries],
  )

  const depotMarkers = useMemo(
    () =>
      (depots || [])
        .filter((row) => hasGpsCoordinates(row.gps_latitude, row.gps_longitude))
        .map((row) => ({
          id: row.id,
          name: row.depot_name,
          isCentral: Boolean(row.is_central),
          position: [Number(row.gps_latitude), Number(row.gps_longitude)],
        })),
    [depots],
  )

  const clientMarkers = useMemo(
    () =>
      (clients || [])
        .filter((row) => hasGpsCoordinates(row.gps_latitude, row.gps_longitude))
        .map((row) => ({
          id: row.id,
          name: row.client_name || row.place_name || 'Client',
          position: [Number(row.gps_latitude), Number(row.gps_longitude)],
        })),
    [clients],
  )

  const fitPositions = useMemo(() => {
    const points = []
    for (const layer of sectorLayers) {
      for (const ring of layer.rings) {
        points.push(...ring)
      }
    }
    for (const marker of [...industryMarkers, ...depotMarkers, ...clientMarkers]) {
      points.push(marker.position)
    }
    return points
  }, [sectorLayers, industryMarkers, depotMarkers, clientMarkers])

  return (
    <div className="global-map-canvas relative h-full w-full">
      <MapContainer
        center={fitPositions[0] || DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="absolute inset-0 z-0 h-full w-full"
        scrollWheelZoom
        zoomControl={false}
      >
        <ZoomControl position="topright" />
        <TileLayer attribution={TILE_ATTRIBUTION} url={TILE_URL} />
        {fitPositions.length > 0 && <FitGlobalBounds positions={fitPositions} />}
        <MapInstanceBridge onMapReady={onMapReady} />

        {sectorLayers.map(({ sector, rings, style }) =>
          rings.map((positions, ringIndex) => (
            <Polygon
              key={`${sector.id}-${ringIndex}`}
              positions={positions}
              pathOptions={{
                color: style.color,
                weight: 2,
                fillColor: style.fillColor,
                fillOpacity: 0.1,
              }}
              eventHandlers={{
                click: () => onSelect({ type: 'sector', id: sector.id, name: sector.sector_name }),
              }}
            >
              <Tooltip sticky direction="top" className="global-map-sector-tooltip">
                {sector.sector_name}
              </Tooltip>
            </Polygon>
          )),
        )}

        {industryMarkers.map((marker) => (
          <Marker
            key={`industry-${marker.id}`}
            position={marker.position}
            icon={industryIcon}
            eventHandlers={{
              click: () => onSelect({ type: 'industry', id: marker.id, name: marker.name }),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-sm font-semibold text-zinc-900">{marker.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">Industry</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {depotMarkers.map((marker) => (
          <Marker
            key={`depot-${marker.id}`}
            position={marker.position}
            icon={marker.isCentral ? centralDepotIcon : normalDepotIcon}
            eventHandlers={{
              click: () =>
                onSelect({
                  type: 'depot',
                  id: marker.id,
                  name: marker.name,
                  isCentral: marker.isCentral,
                }),
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
        ))}

        {clientMarkers.map((marker) => (
          <Marker
            key={`client-${marker.id}`}
            position={marker.position}
            icon={clientIcon}
            eventHandlers={{
              click: () => onSelect({ type: 'client', id: marker.id, name: marker.name }),
            }}
          >
            <Popup>
              <div className="min-w-[160px]">
                <p className="text-sm font-semibold text-zinc-900">{marker.name}</p>
                <p className="mt-0.5 text-xs text-zinc-500">Client</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <FloatingHeader
        sectors={sectors.length}
        depots={depots.length}
        industries={industries.length}
        clients={clients.length}
      />
      <FloatingLegend depotColorEntries={depotColorEntries} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail Panel (right-hand sliding sidebar)                          */
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
}

function DetailPanel({ selectedElement, onClose, onNavigate }) {
  if (!selectedElement) return null
  const { type, id, name } = selectedElement
  const meta = ENTITY_META[type]
  if (!meta) return null
  const Icon = meta.icon

  return (
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-zinc-800 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.accent}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-zinc-100">
              {name || meta.label}
            </p>
            <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">
              {meta.label} Details
            </p>
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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            {meta.label} ID
          </p>
          <p className="mt-1 break-all font-mono text-xs text-zinc-300">{id}</p>

          <div className="mt-4 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500" />
            <p className="text-xs leading-relaxed text-zinc-400">
              Detailed information for this {meta.label.toLowerCase()} will appear here. The
              map on the left stays fully interactive while you explore.
            </p>
          </div>

          <p className="mt-4 text-[11px] text-zinc-500">
            {meta.label} Details for ID: <span className="font-mono text-zinc-300">{id}</span>
          </p>
        </div>
      </div>

      {/* Footer action */}
      <div className="border-t border-zinc-800 p-4">
        <button
          type="button"
          onClick={() => onNavigate(meta.detailPath(id))}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 active:bg-blue-700"
        >
          <ExternalLink className="h-4 w-4" />
          Go to Detailed Page
        </button>
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

export function GlobalMapPage() {
  const navigate = useNavigate()
  const controllerRef = useRef(null)

  const [sectors, setSectors] = useState([])
  const [depots, setDepots] = useState([])
  const [industries, setIndustries] = useState([])
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Explorer state
  const [selectedElement, setSelectedElement] = useState(null)
  const [mapInstance, setMapInstance] = useState(null)

  /* Data fetching */
  useEffect(() => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoading(true)
      setLoadError('')
      try {
        const [sectorsRes, depotsRes, industriesRes, clientsList] = await Promise.all([
          apiInstance.get('/sectors', { signal: controller.signal }),
          apiInstance.get('/depots', { signal: controller.signal }),
          apiInstance.get('/industries', { signal: controller.signal }),
          fetchAllClients(controller.signal),
        ])

        if (controller.signal.aborted) return

        setSectors(sectorsRes.data?.data?.sectors || [])
        setDepots(depotsRes.data?.data?.depots || [])
        setIndustries(industriesRes.data?.data?.industries || [])
        setClients(clientsList)
      } catch (error) {
        if (error.name === 'CanceledError' || controller.signal.aborted) return
        setLoadError(error.response?.data?.message || error.message || 'Failed to load map data')
        setSectors([])
        setDepots([])
        setIndustries([])
        setClients([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controller.abort()
  }, [])

  /* CRITICAL: Leaflet resize fix.
     When the right-hand panel opens or closes, the map's container width
     changes. We wait for the 300ms CSS transition to finish, then tell
     Leaflet to recalculate its tile size so the canvas does not distort. */
  useEffect(() => {
    if (!mapInstance) return
    const timer = setTimeout(() => {
      try {
        mapInstance.invalidateSize()
      } catch (err) {
        // map may have been torn down between scheduling and execution
        console.warn('[GlobalMapPage] invalidateSize failed:', err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [selectedElement, mapInstance])

  const handleSelect = useCallback((payload) => {
    setSelectedElement(payload)
  }, [])

  const handleClose = useCallback(() => {
    setSelectedElement(null)
  }, [])

  const handleNavigate = useCallback(
    (path) => {
      navigate(path)
    },
    [navigate],
  )

  // Stable callback for MapInstanceBridge so we don't churn the effect above
  const handleMapReady = useCallback((map) => {
    setMapInstance(map)
  }, [])

  const isOpen = Boolean(selectedElement)

  return (
    <div className="flex h-[calc(100vh-100px)] w-full overflow-hidden relative rounded-xl">
      {/* MAP — left, shrinks to 2/3 when panel is open */}
      <div
        className={`relative h-full overflow-hidden ${
          isOpen ? 'w-2/3' : 'w-full'
        } transition-all duration-300 ease-in-out`}
      >
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
            <p className="mt-1 text-xs text-zinc-600">Fetching sectors, depots, industries & clients</p>
          </div>
        ) : (
          <GlobalMapCanvas
            sectors={sectors}
            industries={industries}
            depots={depots}
            clients={clients}
            onSelect={handleSelect}
            onMapReady={handleMapReady}
          />
        )}
      </div>

      {/* DETAIL PANEL — right, slides in as 1/3 */}
      <div
        className={`h-full overflow-hidden bg-[#1c1c1e] border-l border-zinc-800 flex flex-col shadow-[inset_1px_0_0_rgba(255,255,255,0.05)] z-[1001] ${
          isOpen ? 'w-1/3' : 'w-0'
        } transition-all duration-300 ease-in-out`}
        aria-hidden={!isOpen}
      >
        <DetailPanel
          selectedElement={selectedElement}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      </div>
    </div>
  )
}

export default GlobalMapPage
