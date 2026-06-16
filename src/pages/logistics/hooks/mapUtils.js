import apiInstance from '../../../api/axiosInstance'

export const VEHICLE_POSITION_POLL_MS = 20_000
export const GPS_TRAIL_POINT_EPSILON = 0.00003

export function dedupeById(items) {
  const seen = new Set()
  return (items || []).filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export function gpsTrailPointsNear(a, b, epsilon = GPS_TRAIL_POINT_EPSILON) {
  if (!a || !b) return false
  return Math.abs(a[0] - b[0]) < epsilon && Math.abs(a[1] - b[1]) < epsilon
}

export function buildDisplayedVehicleTrail(historyTrail, vehicleId, trackedVehicles) {
  const base = Array.isArray(historyTrail) ? historyTrail : []
  if (!vehicleId) return base

  const tracked = (trackedVehicles || []).find((row) => row.id === vehicleId)
  const live = tracked?.position
  if (!live || live.lat == null || live.lng == null) {
    return base
  }

  const livePoint = [Number(live.lat), Number(live.lng)]
  if (!base.length) return [livePoint]

  const last = base[base.length - 1]
  if (gpsTrailPointsNear(last, livePoint)) return base
  return [...base, livePoint]
}

export function mergeVehiclePositionDeltas(prev, deltas) {
  if (!deltas?.length) return prev || []
  const byId = new Map((prev || []).map((row) => [row.id, row]))
  for (const row of deltas) {
    const existing = byId.get(row.id)
    if (existing) {
      byId.set(row.id, { ...existing, ...row, position: row.position || existing.position })
    } else {
      byId.set(row.id, row)
    }
  }
  return [...byId.values()]
}

export function trackedVehiclesChanged(prev, next) {
  if ((prev?.length || 0) !== (next?.length || 0)) return true
  for (const row of next || []) {
    const old = (prev || []).find((item) => item.id === row.id)
    if (!old) return true
    const a = old.position
    const b = row.position
    if (!a && !b) continue
    if (!a || !b) return true
    const latDiff = Math.abs(Number(a.lat) - Number(b.lat))
    const lngDiff = Math.abs(Number(a.lng) - Number(b.lng))
    if (latDiff > 0.00005 || lngDiff > 0.00005) return true
    if (Number(a.speed ?? 0) !== Number(b.speed ?? 0)) return true
  }
  return false
}

export function normalizeDepotForMap(depot) {
  if (!depot?.id) return null
  return {
    id: depot.id,
    depot_name: depot.depot_name,
    address: depot.address,
    gps_latitude: depot.gps_latitude ?? depot.gps_lat ?? null,
    gps_longitude: depot.gps_longitude ?? depot.gps_lon ?? null,
    total_price_capacity: depot.total_price_capacity,
    total_volume_capacity: depot.total_volume_capacity,
    is_active: depot.is_active,
    is_central: depot.is_central,
    parent_depot_id: depot.parent_depot_id,
    auto_approve_replenishment: depot.auto_approve_replenishment,
    capacity_usage: depot.capacity_usage,
  }
}

export async function fetchClientsInBounds(bounds, signal) {
  const res = await apiInstance.get('/clients', {
    params: {
      page: 1,
      limit: 500,
      minLat: bounds.minLat,
      maxLat: bounds.maxLat,
      minLng: bounds.minLng,
      maxLng: bounds.maxLng,
    },
    signal,
  })
  return res.data?.data?.clients || []
}

export async function fetchAllClients(signal) {
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
