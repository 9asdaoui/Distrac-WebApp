import {
  AlertTriangle,
  Building2,
  Gauge,
  Map,
  MapPin,
  Package,
  Truck,
  UserCheck,
  Users,
  Warehouse,
} from 'lucide-react'
import { hasGpsCoordinates } from '../LocationMap'

function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

function ratio(part, total) {
  return `${part}/${total}`
}

function avg(nums) {
  if (!nums.length) return 0
  return nums.reduce((sum, n) => sum + n, 0) / nums.length
}

function hasBoundary(item) {
  return Boolean(item?.boundary)
}

function industryHasGps(item) {
  return hasGpsCoordinates(Number(item.gps_latitude), Number(item.gps_longitude))
}

/** @returns {import('./MapRailKpiStrip').MapRailKpiItem[]} */
export function industryRailKpis(items = []) {
  const total = items.length
  const mapped = items.filter(industryHasGps).length
  const internal = items.filter((item) => item.is_internal).length
  const activeNoGps = items.filter(
    (item) => item.is_active !== false && !industryHasGps(item),
  ).length
  const mapPct = pct(mapped, total)

  return [
    {
      label: 'Map coverage',
      value: ratio(mapped, total),
      subtitle: `${mapPct}% pinned on Global Map`,
      icon: MapPin,
      tone: 'rose',
      progress: mapPct,
    },
    {
      label: 'Internal',
      value: String(internal),
      subtitle: internal === 1 ? 'In-house supplier' : 'In-house suppliers',
      icon: Package,
      tone: 'violet',
    },
    {
      label: 'Needs GPS',
      value: String(activeNoGps),
      subtitle: activeNoGps ? 'Active but invisible on map' : 'All active industries mapped',
      icon: AlertTriangle,
      tone: activeNoGps ? 'amber' : 'emerald',
    },
  ]
}

/** @returns {import('./MapRailKpiStrip').MapRailKpiItem[]} */
export function depotRailKpis(items = []) {
  const usages = items
    .map((item) => Number(item.capacity_usage?.used_percentage))
    .filter((n) => Number.isFinite(n))
  const avgFill = Math.round(avg(usages))
  const highLoad = items.filter((item) => Number(item.capacity_usage?.used_percentage) >= 80).length
  const central = items.filter((item) => item.is_central).length
  const satellites = items.filter((item) => item.parent_depot_id).length

  return [
    {
      label: 'Avg fill',
      value: usages.length ? `${avgFill}%` : '—',
      subtitle: usages.length ? 'Mean price capacity used' : 'No capacity data',
      icon: Gauge,
      tone: avgFill >= 80 ? 'amber' : 'blue',
      progress: Math.min(avgFill, 100),
    },
    {
      label: 'High load',
      value: String(highLoad),
      subtitle: highLoad ? 'Depots at ≥80% capacity' : 'No depots near capacity',
      icon: AlertTriangle,
      tone: highLoad ? 'amber' : 'emerald',
    },
    {
      label: 'Network',
      value: String(central),
      subtitle:
        satellites > 0
          ? `${central} hub${central === 1 ? '' : 's'} · ${satellites} satellite`
          : 'Central distribution hubs',
      icon: Warehouse,
      tone: 'emerald',
    },
  ]
}

/** @returns {import('./MapRailKpiStrip').MapRailKpiItem[]} */
export function regionRailKpis(items = [], { sectors = [] } = {}) {
  const total = items.length
  const regionIds = new Set(items.map((item) => item.id))
  const sectorsInView = sectors.filter((sector) => regionIds.has(sector.region_id))
  const sectorTotal = sectorsInView.length
  const avgSectors = total ? (sectorTotal / total).toFixed(1) : '0'
  const emptyRegions = items.filter((region) => {
    const count = sectors.filter((s) => s.region_id === region.id).length
    return count === 0
  }).length
  const bounded = items.filter(hasBoundary).length
  const boundPct = pct(bounded, total)

  return [
    {
      label: 'Sectors',
      value: String(sectorTotal),
      subtitle: total ? `Avg ${avgSectors} per region` : 'No regions in view',
      icon: Building2,
      tone: 'orange',
    },
    {
      label: 'Coverage gaps',
      value: String(emptyRegions),
      subtitle: emptyRegions ? 'Regions without sectors' : 'Every region has sectors',
      icon: AlertTriangle,
      tone: emptyRegions ? 'amber' : 'emerald',
    },
    {
      label: 'Boundaries',
      value: ratio(bounded, total),
      subtitle: `${boundPct}% drawn on map`,
      icon: Map,
      tone: boundPct === 100 ? 'emerald' : 'sky',
      progress: boundPct,
    },
  ]
}

/** @returns {import('./MapRailKpiStrip').MapRailKpiItem[]} */
export function sectorRailKpis(items = []) {
  const total = items.length
  const fullyLinked = items.filter(
    (item) => (item.region_id || item.regions?.id) && (item.depot_id || item.depots?.id),
  ).length
  const noRep = items.filter((item) => !item.assigned_profile_id && !item.profiles?.full_name).length
  const mapped = items.filter(hasBoundary).length
  const linkPct = pct(fullyLinked, total)
  const mapPct = pct(mapped, total)

  return [
    {
      label: 'Fully linked',
      value: ratio(fullyLinked, total),
      subtitle: `${linkPct}% with region & depot`,
      icon: Building2,
      tone: linkPct === 100 ? 'emerald' : 'amber',
      progress: linkPct,
    },
    {
      label: 'No assignee',
      value: String(noRep),
      subtitle: noRep ? 'Missing field representative' : 'All sectors staffed',
      icon: UserCheck,
      tone: noRep ? 'amber' : 'emerald',
    },
    {
      label: 'Mapped',
      value: ratio(mapped, total),
      subtitle: `${mapPct}% boundary on map`,
      icon: Map,
      tone: 'sky',
      progress: mapPct,
    },
  ]
}

/** @returns {import('./MapRailKpiStrip').MapRailKpiItem[]} */
export function clientRailKpis(items = []) {
  const total = items.length
  const inSector = items.filter((item) => item.sector_id).length
  const mapped = items.filter((item) =>
    hasGpsCoordinates(Number(item.gps_latitude), Number(item.gps_longitude)),
  ).length
  const cities = new Set(items.map((item) => item.city?.trim()).filter(Boolean)).size
  const sectorPct = pct(inSector, total)
  const mapPct = pct(mapped, total)

  return [
    {
      label: 'Territory',
      value: ratio(inSector, total),
      subtitle: `${sectorPct}% assigned to a sector`,
      icon: Building2,
      tone: sectorPct >= 90 ? 'emerald' : 'amber',
      progress: sectorPct,
    },
    {
      label: 'Deliverable',
      value: ratio(mapped, total),
      subtitle: `${mapPct}% with GPS coordinates`,
      icon: MapPin,
      tone: 'rose',
      progress: mapPct,
    },
    {
      label: 'Cities',
      value: String(cities),
      subtitle: cities === 1 ? 'Delivery city in view' : 'Distinct delivery cities',
      icon: Users,
      tone: 'violet',
    },
  ]
}

/** @returns {import('./MapRailKpiStrip').MapRailKpiItem[]} */
export function vehicleRailKpis(items = [], { depots = [] } = {}) {
  const total = items.length
  const active = items.filter((item) => item.is_active !== false)
  const withDriver = active.filter((item) => item.current_livreur?.id).length
  const idle = active.length - withDriver
  const depotIds = new Set(
    items.map((item) => item.depot_id || item.depot?.id).filter(Boolean),
  )
  const depotCount = depotIds.size || depots.length || 0
  const avgPerDepot = depotCount ? (total / depotCount).toFixed(1) : '0'
  const driverPct = pct(withDriver, active.length || total)

  return [
    {
      label: 'On road',
      value: ratio(withDriver, active.length || total),
      subtitle: `${driverPct}% with checked-in driver`,
      icon: UserCheck,
      tone: driverPct >= 75 ? 'emerald' : 'blue',
      progress: driverPct,
    },
    {
      label: 'Idle fleet',
      value: String(idle),
      subtitle: idle ? 'Active vehicles, no driver' : 'All active vehicles staffed',
      icon: Truck,
      tone: idle ? 'amber' : 'emerald',
    },
    {
      label: 'Density',
      value: avgPerDepot,
      subtitle: depotCount ? `Vehicles per depot (${depotCount})` : 'Vehicles per depot',
      icon: Warehouse,
      tone: 'sky',
    },
  ]
}
