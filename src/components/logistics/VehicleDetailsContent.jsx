import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Printer, QrCode, Truck, UserRound, Warehouse } from 'lucide-react'
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
  if (!vehicle?.qr_code) return null

  return (
    <InfoCard title="Vehicle QR Code" icon={QrCode} compact={compact} dark={dark}>
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
          Print QR
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
  backLabel = 'Back to Vehicles',
}) {
  const compact = layout === 'panel'
  const dark = layout === 'panel'

  if (isLoading) {
    return <VehicleDetailsSkeleton compact={compact} />
  }

  if (error || !vehicle) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'Vehicle not found.'}</p>
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

  const depotNote = vehicle.depot?.depot_name
    ? `Plotted at depot: ${vehicle.depot.depot_name}`
    : 'No depot assigned — not visible on map.'

  if (layout === 'panel') {
    return (
      <div className="space-y-4">
        <p className="text-xs text-zinc-500">{depotNote}</p>
        <InfoCard title="Assignment" icon={Truck} compact dark>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Plate</span>
              <span className="font-medium text-zinc-100">{vehicle.plate_number || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Model</span>
              <span className="text-zinc-300">{vehicle.model || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Tonnage</span>
              <span className="text-zinc-300">{formatTonnage(vehicle.tonnage)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Volume</span>
              <span className="text-zinc-300">{formatVolume(vehicle.volume_capacity)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Depot</span>
              <span className="text-zinc-300">{vehicle.depot?.depot_name || '—'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Livreur</span>
              <span className="text-zinc-300">{vehicle.current_livreur?.full_name || 'Unassigned'}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-zinc-500">Status</span>
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
                  {vehicle.plate_number || 'Vehicle'}
                </h1>
                <EntityStatusBadge isActive={vehicle.is_active !== false} />
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {vehicle.model || 'No model'}
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
          {backLabel}
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <InfoCard title="Assignment" icon={Truck} compact={compact}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Tonnage</p>
                <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{formatTonnage(vehicle.tonnage)}</p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Volume</p>
                <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{formatVolume(vehicle.volume_capacity)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <Warehouse className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <span>{vehicle.depot?.depot_name || 'No depot assigned'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                <UserRound className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              </div>
              <span>{vehicle.current_livreur?.full_name || 'No livreur currently assigned'}</span>
            </div>
          </div>
        </InfoCard>
        <VehicleQrCard vehicle={vehicle} compact={compact} />
      </div>
    </div>
  )
}
