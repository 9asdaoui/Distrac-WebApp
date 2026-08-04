import React from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  ChevronRight,
  ExternalLink,
  Factory,
  Globe,
  Map,
  MapPin,
  Store,
  Truck,
  Warehouse,
} from 'lucide-react'
import { hasGpsCoordinates } from '../LocationMap'

export const LOGISTICS_MODULES = {
  industry: {
    type: 'industry',
    label: 'Industry',
    plural: 'Industries',
    listPath: '/industries',
    detailPath: (id) => `/industries/${id}`,
    mapDeepLink: (id) => `/industries/${id}`,
    mapFilter: 'industries',
    icon: Factory,
    accentDark: 'bg-rose-500/10 text-rose-400 ring-rose-500/30',
    accentLight: 'bg-rose-50 text-rose-600 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:ring-rose-500/30',
    hasDetailPage: true,
    nameField: 'industry_name',
  },
  depot: {
    type: 'depot',
    label: 'Depot',
    plural: 'Depots',
    listPath: '/depots',
    detailPath: (id) => `/depots/${id}`,
    mapDeepLink: (id) => `/depots/${id}`,
    mapFilter: 'depots',
    icon: Warehouse,
    accentDark: 'bg-cc-accent/15 text-cc-accent ring-cc-accent/30',
    accentLight: 'bg-cc-accent/10 text-cc-accent ring-cc-accent/25 dark:bg-cc-accent/15 dark:text-cc-accent-hover dark:ring-cc-accent/30',
    hasDetailPage: true,
    nameField: 'depot_name',
  },
  sector: {
    type: 'sector',
    label: 'Sector',
    plural: 'Sectors',
    listPath: '/sectors',
    detailPath: (id) => `/sectors/${id}`,
    mapDeepLink: (id) => `/sectors/${id}`,
    mapFilter: 'sectors',
    icon: Building2,
    accentDark: 'bg-amber-500/10 text-amber-400 ring-amber-500/30',
    accentLight: 'bg-amber-50 text-amber-600 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
    hasDetailPage: true,
    nameField: 'sector_name',
  },
  client: {
    type: 'client',
    label: 'Client',
    plural: 'Clients',
    listPath: '/clients',
    detailPath: (id) => `/clients/${id}`,
    mapDeepLink: (id) => `/clients/${id}`,
    mapFilter: 'clients',
    icon: Store,
    accentDark: 'bg-zinc-100/10 text-zinc-200 ring-zinc-400/30',
    accentLight: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:ring-zinc-600',
    hasDetailPage: true,
    nameField: 'client_name',
  },
  region: {
    type: 'region',
    label: 'Region',
    plural: 'Regions',
    listPath: '/regions',
    detailPath: (id) => `/regions/${id}`,
    mapDeepLink: (id) => `/regions/${id}`,
    mapFilter: 'regions',
    icon: Map,
    accentDark: 'bg-cc-accent/15 text-cc-accent ring-cc-accent/30',
    accentLight: 'bg-cc-accent/10 text-cc-accent ring-cc-accent/25 dark:bg-cc-accent/15 dark:text-cc-accent-hover dark:ring-cc-accent/30',
    hasDetailPage: true,
    nameField: 'region_name',
  },
  vehicle: {
    type: 'vehicle',
    label: 'Vehicle',
    plural: 'Vehicles',
    listPath: '/vehicles',
    detailPath: (id) => `/vehicles/${id}`,
    mapDeepLink: (id) => `/vehicles/${id}`,
    mapFilter: 'vehicles',
    icon: Truck,
    accentDark: 'bg-violet-500/10 text-violet-400 ring-violet-500/30',
    accentLight: 'bg-violet-50 text-violet-600 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:ring-violet-500/30',
    hasDetailPage: true,
    nameField: 'plate_number',
  },
}

export function getLogisticsModule(type) {
  return LOGISTICS_MODULES[type] || null
}

export function getEntityDisplayName(type, record, fallback = '') {
  if (!record) return fallback
  const mod = getLogisticsModule(type)
  if (!mod) return fallback
  if (type === 'client') {
    return record.store_name || record.client_name || record.place_name || fallback
  }
  return record[mod.nameField] || fallback
}

export function formatGpsLocation(lat, lng) {
  if (!hasGpsCoordinates(lat, lng)) return '—'
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
}

export function EntityStatusBadge({ isActive, compact = false }) {
  const sizeClass = compact ? 'px-2 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'
  return isActive !== false ? (
    <span
      className={`inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200 ${sizeClass}`}
    >
      Active
    </span>
  ) : (
    <span
      className={`inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 ${sizeClass}`}
    >
      Inactive
    </span>
  )
}

export function EntityIconBadge({ moduleKey, size = 'md', variant = 'light' }) {
  const mod = getLogisticsModule(moduleKey)
  if (!mod) return null
  const Icon = mod.icon
  const isDark = variant === 'dark'
  const sizeClass =
    size === 'sm' ? 'h-7 w-7 rounded-md' : size === 'lg' ? 'h-11 w-11 rounded-xl' : 'h-9 w-9 rounded-lg'
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  const accent = isDark ? mod.accentDark : mod.accentLight

  return (
    <span className={`flex shrink-0 items-center justify-center ring-1 ${sizeClass} ${accent}`}>
      <Icon className={iconSize} />
    </span>
  )
}

export function EntityBreadcrumb({ moduleKey, entityName, mode = 'page', onNavigate, className = '' }) {
  const mod = getLogisticsModule(moduleKey)
  if (!mod) return null

  return (
    <nav
      className={`flex min-w-0 items-center gap-1 text-xs text-zinc-500 ${className}`}
      aria-label={`${mod.label} navigation`}
    >
      {mode === 'panel' && onNavigate ? (
        <button
          type="button"
          onClick={() => onNavigate(mod.listPath)}
          className="shrink-0 transition hover:text-zinc-300"
        >
          {mod.plural}
        </button>
      ) : (
        <Link to={mod.listPath} className="shrink-0 hover:text-zinc-700 dark:hover:text-zinc-300">
          {mod.plural}
        </Link>
      )}
      {entityName && (
        <>
          <ChevronRight className="h-3 w-3 shrink-0 opacity-60" />
          <span className="truncate text-zinc-400">{entityName}</span>
        </>
      )}
    </nav>
  )
}

export function EntityMapLink({ moduleKey, entityId, layout = 'page', className = '' }) {
  const mod = getLogisticsModule(moduleKey)
  if (!mod || !entityId) return null

  const linkClass =
    layout === 'panel'
      ? 'inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-400 transition hover:text-zinc-200'
      : `inline-flex items-center gap-1.5 text-xs font-medium transition hover:opacity-80 ${className || 'text-zinc-600 dark:text-zinc-400'}`

  return (
    <Link to={mod.mapDeepLink(entityId)} className={linkClass}>
      <Globe className="h-3.5 w-3.5" />
      {layout === 'panel' ? 'View on map' : 'Open in Command Center'}
    </Link>
  )
}

export function EntityConnectedActions({ moduleKey, entityId, layout = 'page' }) {
  const mod = getLogisticsModule(moduleKey)
  if (!mod || !entityId) return null

  const mapLinkClass =
    layout === 'page'
      ? 'inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
      : 'inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:bg-zinc-800'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link to={mod.mapDeepLink(entityId)} className={mapLinkClass}>
        <Globe className="h-3.5 w-3.5" />
        View on Map
      </Link>
      {mod.hasDetailPage && layout === 'panel' && (
        <Link
          to={mod.mapDeepLink(entityId)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-white"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Profile
        </Link>
      )}
    </div>
  )
}

export function EntityGpsStrip({ moduleKey, record, layout = 'panel', extra }) {
  const mod = getLogisticsModule(moduleKey)
  if (!record) return null

  const lat = record.gps_latitude
  const lng = record.gps_longitude
  const hasGps = hasGpsCoordinates(lat, lng)
  const isActive = record.is_active

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
        layout === 'panel'
          ? 'border-zinc-800 bg-zinc-900/40'
          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-cc-surface/40'
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
        <span className="truncate font-mono text-xs text-zinc-400">
          {hasGps ? formatGpsLocation(lat, lng) : extra || 'No GPS set'}
        </span>
      </div>
      {isActive !== undefined && <EntityStatusBadge isActive={isActive} compact />}
    </div>
  )
}

export function EntitySegmentedControl({ value, onChange, options, variant = 'light' }) {
  const isDark = variant === 'dark'
  return (
    <div className={`flex w-full rounded-lg p-1 ${isDark ? 'bg-zinc-900' : 'bg-zinc-100 dark:bg-cc-surface'}`}>
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              selected
                ? isDark
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function EntityPanelSubtitle({ moduleKey, details }) {
  if (!details) return null
  if (moduleKey === 'industry') {
    return (
      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
        {details.description?.trim() || 'No description provided.'}
      </p>
    )
  }
  if (moduleKey === 'depot') {
    return (
      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">{details.address?.trim() || 'No address provided.'}</p>
    )
  }
  if (moduleKey === 'sector') {
    const region = details.regions?.region_name
    const depot = details.depots?.depot_name
    return (
      <p className="mt-1 text-sm text-zinc-400">
        {[region, depot].filter(Boolean).join(' · ') || 'No region or depot linked.'}
      </p>
    )
  }
  if (moduleKey === 'client') {
    return (
      <p className="mt-1 line-clamp-2 text-sm text-zinc-400">
        {details.client_name}
        {details.city ? ` · ${details.city}` : ''}
      </p>
    )
  }
  if (moduleKey === 'vehicle') {
    return (
      <p className="mt-1 text-sm text-zinc-400">
        {details.model || 'No model'}
        {details.depot?.depot_name ? ` · ${details.depot.depot_name}` : ''}
      </p>
    )
  }
  if (moduleKey === 'region') {
    const parts = []
    if (details.code) parts.push(`Code: ${details.code}`)
    if (details.stats?.sector_count != null) {
      parts.push(`${details.stats.sector_count} sector${details.stats.sector_count === 1 ? '' : 's'}`)
    }
    return (
      <p className="mt-1 text-sm text-zinc-400">
        {parts.join(' · ') || 'Regional boundary on map.'}
      </p>
    )
  }
  return null
}
