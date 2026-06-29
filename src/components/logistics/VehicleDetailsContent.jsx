import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, MapPin, Printer, QrCode, Radio, Route, Truck, UserRound, Warehouse } from 'lucide-react'
import QRCode from 'react-qr-code'
import { printVehicleQr } from './vehicleQrPrint'
import {
  LOGISTICS_MODULES,
  EntityBreadcrumb,
  EntityConnectedActions,
  EntityIconBadge,
  EntityStatusBadge,
} from './logisticsModuleUi'

const VEHICLE_MODULE = LOGISTICS_MODULES.vehicle

const formatTonnage = (value) => (value != null && value !== '' && Number(value) > 0 ? `${Number(value)} t` : '—')
const formatVolume = (value) => (value != null && value !== '' ? `${Number(value)} L` : '—')

function formatRelativeTime(iso) {
  if (!iso) return '—'
  const diffMs = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diffMs)) return '—'
  const seconds = Math.max(0, Math.round(diffMs / 1000))
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  return `${hours}h ago`
}

function headingLabel(degrees) {
  const value = Number(degrees)
  if (!Number.isFinite(value)) return '—'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(value / 45) % 8]
}

function formatDuration(startIso, endIso) {
  if (!startIso || !endIso) return '—'
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime()
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

function formatDateTime(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function VehicleDetailsSkeleton({ compact = false }) {
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
    : 'rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
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

function VehicleQrCard({ vehicle, compact = false, dark = false }) {
  const { t } = useTranslation()
  if (!vehicle?.qr_code) return null

  return (
    <InfoCard title={t('commandCenter.vehicleDetails.vehicleQr')} icon={QrCode} compact={compact} dark={dark}>
      <div className={`flex flex-col items-center ${compact ? 'gap-3 py-1' : 'gap-4 py-2'}`}>
        <div className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-950">
          <QRCode value={vehicle.qr_code} size={compact ? 160 : 200} />
        </div>
        <p className="break-all text-center font-mono text-xs text-zinc-600 dark:text-zinc-300">{vehicle.qr_code}</p>
        <button
          type="button"
          onClick={() => printVehicleQr(vehicle)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          <Printer className="h-4 w-4" />
          {t('commandCenter.vehicleDetails.printQr')}
        </button>
      </div>
    </InfoCard>
  )
}

export function VehicleDetailsContent({
  vehicle,
  isLoading = false,
  error = '',
  layout = 'page',
  backTo = VEHICLE_MODULE.listPath,
  backLabel,
}) {
  const { t } = useTranslation()
  const resolvedBackLabel = backLabel || t('commandCenter.vehicleDetails.backToVehicles')
  const compact = layout === 'panel'
  const dark = layout === 'panel'

  if (isLoading) {
    return <VehicleDetailsSkeleton compact={compact} />
  }

  if (error || !vehicle) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || t('commandCenter.vehicleDetails.notFound')}</p>
        {layout === 'page' && (
          <Link
            to={backTo}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {resolvedBackLabel}
          </Link>
        )}
      </div>
    )
  }

  const live = vehicle.livePosition
  const hasLiveGps = live?.lat != null && live?.lng != null
  const depotNote = hasLiveGps
    ? t('commandCenter.vehicleDetails.liveGpsFromWialon')
    : vehicle.depot?.depot_name
      ? t('commandCenter.vehicleDetails.noLiveGpsAtDepot', { name: vehicle.depot.depot_name })
      : t('commandCenter.vehicleDetails.noDepotAssigned')

  if (layout === 'panel') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">{depotNote}</p>
        {hasLiveGps && (
          <InfoCard title={t('commandCenter.vehicleDetails.livePosition')} icon={MapPin} compact dark>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">{t('commandCenter.vehicleDetails.coordinates')}</span>
                <span className="font-mono text-xs text-zinc-200">
                  {Number(live.lat).toFixed(5)}, {Number(live.lng).toFixed(5)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">{t('commandCenter.vehicleDetails.speed')}</span>
                <span className="text-zinc-300">
                  {live.speed != null ? `${Number(live.speed).toFixed(0)} km/h` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">{t('commandCenter.vehicleDetails.heading')}</span>
                <span className="text-zinc-300">{headingLabel(live.heading)}</span>
              </div>
              {live.ignition != null && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-zinc-500">{t('commandCenter.vehicleDetails.ignition')}</span>
                  <span
                    className={
                      live.ignition
                        ? 'font-medium text-emerald-400'
                        : 'font-medium text-zinc-400'
                    }
                  >
                    {live.ignition
                      ? t('commandCenter.vehicleDetails.ignitionOn')
                      : t('commandCenter.vehicleDetails.ignitionOff')}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">{t('commandCenter.vehicleDetails.lastGps')}</span>
                <span className="text-zinc-300">{formatRelativeTime(live.gps_time)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">{t('commandCenter.vehicleDetails.synced')}</span>
                <span className="text-zinc-300">{formatRelativeTime(live.synced_at)}</span>
              </div>
            </div>
          </InfoCard>
        )}
        {vehicle.trailMeta?.pointCount > 0 && (
          <InfoCard title={t('commandCenter.vehicleDetails.recentTrail')} icon={Route} compact dark>
            <div className="space-y-2 text-sm">
              <p className="text-zinc-300">
                {t('commandCenter.vehicleDetails.trailPoints', { count: vehicle.trailMeta.pointCount })}{' '}
                {t('commandCenter.vehicleDetails.trailWindow')}
              </p>
              <p className="text-xs text-zinc-500">
                {formatDateTime(vehicle.trailMeta.from)} → {formatDateTime(vehicle.trailMeta.to)}
              </p>
              <p className="text-xs text-zinc-500">{t('commandCenter.vehicleDetails.trailMapHint')}</p>
            </div>
          </InfoCard>
        )}
        {vehicle.recentTrips?.length > 0 && (
          <InfoCard title={t('commandCenter.vehicleDetails.recentTrips')} icon={Route} compact dark>
            <div className="space-y-3 text-sm">
              {vehicle.recentTrips.map((trip) => (
                <div key={trip.id} className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-zinc-200">{formatDateTime(trip.started_at)}</span>
                    <span className="text-xs text-zinc-500">{formatDuration(trip.started_at, trip.ended_at)}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-zinc-500">
                    <span>{trip.distance_km != null ? `${Number(trip.distance_km).toFixed(1)} km` : '—'}</span>
                    <span>
                      {trip.max_speed != null
                        ? t('commandCenter.vehicleDetails.maxSpeed', { speed: Number(trip.max_speed).toFixed(0) })
                        : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </InfoCard>
        )}
        {(vehicle.wialon_unit_id || vehicle.wialon_unit_name) && (
          <InfoCard title={t('commandCenter.vehicleDetails.wialonLink')} icon={Radio} compact dark>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">{t('commandCenter.vehicleDetails.unit')}</span>
                <span className="text-zinc-300">{vehicle.wialon_unit_name || vehicle.wialon_unit_id}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-zinc-500">{t('commandCenter.vehicleDetails.lastSync')}</span>
                <span className="text-zinc-300">{formatRelativeTime(vehicle.wialon_sync_at)}</span>
              </div>
            </div>
          </InfoCard>
        )}
        <InfoCard title={t('commandCenter.vehicleDetails.assignment')} icon={Truck} compact dark>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{t('commandCenter.vehicleDetails.plate')}</span>
              <span className="font-medium text-zinc-100">{vehicle.plate_number || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{t('commandCenter.vehicleDetails.model')}</span>
              <span className="text-zinc-300">{vehicle.model || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{t('commandCenter.vehicleDetails.tonnage')}</span>
              <span className="text-zinc-300">{formatTonnage(vehicle.tonnage)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{t('commandCenter.vehicleDetails.volume')}</span>
              <span className="text-zinc-300">{formatVolume(vehicle.volume_capacity)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{t('commandCenter.vehicleDetails.depot')}</span>
              <span className="text-zinc-300">{vehicle.depot?.depot_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{t('commandCenter.vehicleDetails.livreur')}</span>
              <span className="text-zinc-300">{vehicle.current_livreur?.full_name || t('commandCenter.vehicleDetails.unassigned')}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">{t('commandCenter.vehicleDetails.status')}</span>
              <EntityStatusBadge isActive={vehicle.is_active !== false} compact />
            </div>
          </div>
        </InfoCard>
        <VehicleQrCard vehicle={vehicle} compact dark />
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-4' : 'space-y-8'}>
      <header className="space-y-4">
        <EntityBreadcrumb moduleKey="vehicle" entityName={vehicle.plate_number} mode="page" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <EntityIconBadge moduleKey="vehicle" size="lg" />
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                  {vehicle.plate_number || t('commandCenter.rail.vehicles.title')}
                </h1>
                <EntityStatusBadge isActive={vehicle.is_active !== false} />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {vehicle.model || t('commandCenter.vehicleDetails.noModel')}
                {vehicle.depot?.depot_name ? ` · ${vehicle.depot.depot_name}` : ''}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{depotNote}</p>
            </div>
          </div>
          <EntityConnectedActions moduleKey="vehicle" entityId={vehicle.id} layout="page" />
        </div>
        <Link
          to={backTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          {resolvedBackLabel}
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title={t('commandCenter.vehicleDetails.assignment')} icon={Truck} compact={compact}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('commandCenter.vehicleDetails.tonnage')}</p>
                <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{formatTonnage(vehicle.tonnage)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('commandCenter.vehicleDetails.volume')}</p>
                <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{formatVolume(vehicle.volume_capacity)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Warehouse className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <span>{vehicle.depot?.depot_name || t('commandCenter.vehicleDetails.noDepot')}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <UserRound className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <span>{vehicle.current_livreur?.full_name || t('commandCenter.vehicleDetails.noLivreur')}</span>
            </div>
          </div>
        </InfoCard>
        <VehicleQrCard vehicle={vehicle} compact={compact} />
      </div>
    </div>
  )
}
