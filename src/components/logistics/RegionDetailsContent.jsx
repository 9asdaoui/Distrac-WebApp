import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Building2, Map, MapPin } from 'lucide-react'
import { SectorBoundaryPreview } from '../SectorBoundaryPreview'
import {
  LOGISTICS_MODULES,
  EntityBreadcrumb,
  EntityConnectedActions,
  EntityIconBadge,
  EntityStatusBadge,
} from './logisticsModuleUi'

const REGION_MODULE = LOGISTICS_MODULES.region

function RegionDetailsSkeleton({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="h-40 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
      <div className="h-56 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

function InfoCard({ title, icon: Icon, children, compact = false, dark = false }) {
  const shellClass = dark
    ? 'rounded-xl border border-zinc-800 bg-zinc-900'
    : 'rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface'
  const headerClass = dark
    ? `border-b border-zinc-800 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`
    : `border-b border-gray-200 dark:border-zinc-800 ${compact ? 'px-4 py-3' : 'px-5 py-4'}`
  const bodyClass = compact ? 'px-4 py-3' : 'px-5 py-4'

  return (
    <div className={shellClass}>
      <div className={headerClass}>
        <h3 className="flex items-center gap-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
          <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
          {title}
        </h3>
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  )
}

function hasBoundary(boundary) {
  if (!boundary) return false
  if (typeof boundary === 'object' && boundary.type) return true
  if (typeof boundary === 'string' && boundary.trim()) return true
  return false
}

export function RegionDetailsContent({
  region,
  isLoading = false,
  error = '',
  layout = 'page',
  backTo = REGION_MODULE.listPath,
  backLabel = 'Back to Regions',
  showMap = true,
}) {
  const compact = layout === 'panel'
  const dark = layout === 'panel'

  if (isLoading) {
    return <RegionDetailsSkeleton compact={compact} />
  }

  if (error || !region) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'Region not found.'}</p>
        {layout === 'page' && (
          <Link
            to={backTo}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}
      </div>
    )
  }

  const sectorCount = region.stats?.sector_count
  const boundaryDefined = hasBoundary(region.boundary)

  if (layout === 'panel') {
    return (
      <div className="space-y-4">
        <InfoCard title="Overview" icon={Map} compact dark>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Code</span>
              <span className="font-medium text-zinc-100">{region.code || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Boundary</span>
              <span className="text-zinc-300">{boundaryDefined ? 'Defined' : 'Not set'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Sectors</span>
              <span className="text-zinc-300">
                {sectorCount != null ? sectorCount : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Status</span>
              <EntityStatusBadge isActive={region.is_active !== false} compact />
            </div>
          </div>
        </InfoCard>

        {showMap && boundaryDefined && (
          <InfoCard title="Boundary" icon={MapPin} compact dark>
            <SectorBoundaryPreview
              boundary={region.boundary}
              mapClassName="h-[180px]"
            />
          </InfoCard>
        )}
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-8'}>
      <header className="space-y-4">
        <EntityBreadcrumb moduleKey="region" entityName={region.region_name} mode="page" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <EntityIconBadge moduleKey="region" size="lg" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {region.region_name || 'Region'}
                </h1>
                <EntityStatusBadge isActive={region.is_active !== false} />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {region.code ? `Code: ${region.code}` : 'No code'}
                {sectorCount != null ? ` · ${sectorCount} sectors` : ''}
              </p>
            </div>
          </div>
          <EntityConnectedActions moduleKey="region" entityId={region.id} layout="page" />
        </div>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Overview" icon={Building2} compact={compact}>
          <div className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Code</span>
              <span>{region.code || '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Active sectors</span>
              <span>{sectorCount != null ? sectorCount : '—'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500">Boundary</span>
              <span>{boundaryDefined ? 'Defined on map' : 'Not set'}</span>
            </div>
          </div>
        </InfoCard>
        {showMap && boundaryDefined && (
          <InfoCard title="Boundary preview" icon={MapPin} compact={compact}>
            <SectorBoundaryPreview boundary={region.boundary} mapClassName="h-[280px]" />
          </InfoCard>
        )}
      </div>
    </div>
  )
}
