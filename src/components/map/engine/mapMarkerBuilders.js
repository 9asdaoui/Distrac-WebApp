import L from 'leaflet'
import { hasGpsCoordinates } from '../../LocationMap'
import { dedupeById } from '../../../pages/logistics/hooks/mapUtils'

const TRUCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>'

export const vehicleLiveIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-7 h-7 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-orange-500 text-white">${TRUCK_SVG}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

export const vehicleStaticIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-7 h-7 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-zinc-500 text-white">${TRUCK_SVG}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

const FACTORY_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>'

const WAREHOUSE_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35A2 2 0 0 1 3.26 6.5l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z"/><path d="M6 18h12"/><path d="M6 14h12"/><path d="M12 6v4"/></svg>'

export const clientIcon = L.divIcon({
  className: 'global-map-marker',
  html:
    '<div class="w-3.5 h-3.5 bg-zinc-100 border-2 border-zinc-950 ring-2 ring-zinc-400/50 rounded-full shadow-md"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

export const industryIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-rose-500 text-white">${FACTORY_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

export const normalDepotIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-blue-500 text-white">${WAREHOUSE_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

export const centralDepotIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-amber-500 text-white">${WAREHOUSE_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

export const vertexIcon = L.divIcon({
  className: 'global-map-vertex',
  html:
    '<div class="w-3 h-3 rounded-full bg-white border-2 border-zinc-900 shadow-[0_0_0_3px_rgba(255,255,255,0.35)] cursor-grab active:cursor-grabbing"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

/** Live GPS from Wialon when linked; otherwise depot proxy with offset when stacked. */
export function buildVehicleMarkers(vehicles, depots, vehiclePositionById = {}) {
  const depotById = new Map((depots || []).map((d) => [d.id, d]))
  const perDepotCount = new Map()

  return dedupeById(vehicles)
    .map((vehicle) => {
      const live = vehiclePositionById[vehicle.id]
      const liveLat = live?.lat != null ? Number(live.lat) : null
      const liveLng = live?.lng != null ? Number(live.lng) : null

      if (hasGpsCoordinates(liveLat, liveLng)) {
        return {
          id: vehicle.id,
          name: vehicle.plate_number || 'Vehicle',
          model: vehicle.model,
          depotName: depotById.get(vehicle.depot_id)?.depot_name,
          isActive: vehicle.is_active !== false,
          isLive: true,
          speed: live?.speed,
          ignition: live?.ignition,
          gpsTime: live?.gps_time,
          position: [liveLat, liveLng],
          markerKey: `vehicle-${vehicle.id}`,
        }
      }

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
        isLive: false,
        position: [lat + Math.sin(angle) * offset, lng + Math.cos(angle) * offset],
        markerKey: `vehicle-${vehicle.id}`,
      }
    })
    .filter(Boolean)
}
