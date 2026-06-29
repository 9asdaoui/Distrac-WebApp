import L from 'leaflet'

const TRUCK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>'

export const clientMapIcon = L.divIcon({
  className: 'global-map-marker',
  html:
    '<div class="w-3.5 h-3.5 bg-zinc-100 border-2 border-zinc-950 ring-2 ring-zinc-400/50 rounded-full shadow-md"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

export const clientMapIconSelected = L.divIcon({
  className: 'global-map-marker',
  html:
    '<div class="w-4 h-4 bg-sky-300 border-2 border-zinc-950 ring-2 ring-sky-400/70 rounded-full shadow-md"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -12],
})

export const vehicleLiveMapIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-7 h-7 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-orange-500 text-white">${TRUCK_SVG}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

/** Live GPS, engine on, not moving (idling). */
export const vehicleIdleEngineMapIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-7 h-7 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-emerald-500 text-white">${TRUCK_SVG}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

/** Live GPS, engine off (parked). */
export const vehicleEngineOffMapIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-7 h-7 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-slate-500 text-white">${TRUCK_SVG}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

export const vehicleStaticMapIcon = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-7 h-7 flex items-center justify-center rounded-full border-2 border-zinc-900 shadow-md bg-zinc-500 text-white">${TRUCK_SVG}</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
})

export const vehicleLiveMapIconSelected = L.divIcon({
  className: 'global-map-marker',
  html: `<div class="w-8 h-8 flex items-center justify-center rounded-full border-2 border-sky-300 shadow-lg bg-orange-500 text-white ring-2 ring-sky-400/80">${TRUCK_SVG}</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
})

export function resolveVehicleMapIcon({ isLive = false, isSelected = false, ignition = null, speed = null } = {}) {
  if (isSelected) return vehicleLiveMapIconSelected
  if (!isLive) return vehicleStaticMapIcon

  const moving = Number(speed) > 0
  if (ignition === true && !moving) return vehicleIdleEngineMapIcon
  if (ignition === false && !moving) return vehicleEngineOffMapIcon
  return vehicleLiveMapIcon
}

export function iconForEntity(
  entityType,
  { isLive = false, isSelected = false, ignition = null, speed = null } = {},
) {
  if (entityType === 'client') {
    return isSelected ? clientMapIconSelected : clientMapIcon
  }
  if (entityType === 'vehicle') {
    return resolveVehicleMapIcon({ isLive, isSelected, ignition, speed })
  }
  return clientMapIcon
}
