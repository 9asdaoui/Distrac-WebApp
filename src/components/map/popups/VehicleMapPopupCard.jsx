import React from 'react'
import { useTranslation } from 'react-i18next'
import { MapPopupShell } from './MapPopupShell'
import { DriverAvatar } from './DriverAvatar'
import { SpeedGauge } from './SpeedGauge'

function headingLabel(degrees) {
  const value = Number(degrees)
  if (!Number.isFinite(value)) return '—'
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(value / 45) % 8]
}

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

export function VehicleMapPopupCard({ vehicle, livePosition, isLive }) {
  const { t } = useTranslation()
  const livreur = vehicle?.current_livreur
  const speed = livePosition?.speed
  const isActive = vehicle?.is_active !== false

  return (
    <MapPopupShell>
      <div className="border-b border-zinc-800 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-bold tracking-wide text-white">
            {vehicle?.plate_number || 'Vehicle'}
          </p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
              isActive ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
            }`}
          >
            {isActive ? t('commandCenter.popup.active') : t('commandCenter.popup.inactive')}
          </span>
        </div>
        {vehicle?.model && <p className="mt-0.5 truncate text-xs text-zinc-500">{vehicle.model}</p>}
      </div>

      <div className="flex items-center gap-3 px-3 py-3">
        <DriverAvatar livreur={livreur} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-zinc-100">
            {livreur?.full_name || t('commandCenter.popup.unassigned')}
          </p>
          <p className="mt-0.5 truncate text-xs text-zinc-500">
            {vehicle?.depot?.depot_name || 'No depot'}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 border-t border-zinc-800 px-3 py-2">
        <SpeedGauge speed={isLive ? speed : 0} size={88} />
        <div className="space-y-1.5 pb-1 text-right text-[11px]">
          <p className={isLive ? 'font-medium text-orange-400' : 'text-zinc-500'}>
            {isLive ? `● ${t('commandCenter.popup.liveGps')}` : `○ ${t('commandCenter.popup.depotProxy')}`}
          </p>
          <p className="text-zinc-400">
            {t('commandCenter.popup.heading')}{' '}
            <span className="font-semibold text-zinc-200">{headingLabel(livePosition?.heading)}</span>
          </p>
          {livePosition?.ignition != null && (
            <p className="text-zinc-400">
              {t('commandCenter.popup.ignition')}{' '}
              <span className="font-semibold text-zinc-200">
                {livePosition.ignition
                  ? t('commandCenter.popup.ignitionOn')
                  : t('commandCenter.popup.ignitionOff')}
              </span>
            </p>
          )}
          {isLive && livePosition?.gps_time && (
            <p className="text-zinc-500">{formatRelativeTime(livePosition.gps_time)}</p>
          )}
        </div>
      </div>
    </MapPopupShell>
  )
}
