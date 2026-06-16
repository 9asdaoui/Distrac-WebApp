import React from 'react'
import { useTranslation } from 'react-i18next'

export function MapFollowHud({
  followVehicleId,
  selectedVehicleId,
  onStopFollow,
  onReFollow,
  className = '',
}) {
  const { t } = useTranslation()

  if (!selectedVehicleId || selectedVehicleId !== followVehicleId) {
    if (!selectedVehicleId) return null
    return (
      <div
        className={`pointer-events-auto absolute bottom-4 left-4 z-[1000] ${className}`}
      >
        <button
          type="button"
          onClick={() => onReFollow?.(selectedVehicleId)}
          className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-zinc-950/90 px-3 py-1.5 text-xs font-semibold text-orange-300 shadow-lg backdrop-blur-md transition hover:bg-orange-500/10"
        >
          {t('commandCenter.recenterVehicle')}
        </button>
      </div>
    )
  }

  return (
    <div className={`pointer-events-auto absolute bottom-4 left-4 z-[1000] ${className}`}>
      <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/40 bg-zinc-950/90 px-3 py-1.5 text-xs shadow-lg backdrop-blur-md">
        <span className="inline-flex items-center gap-1.5 font-medium text-orange-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
          {t('commandCenter.following')}
        </span>
        <span className="text-zinc-600">|</span>
        <button
          type="button"
          onClick={onStopFollow}
          className="font-semibold text-zinc-400 transition hover:text-zinc-200"
        >
          {t('commandCenter.stopFollow')}
        </button>
      </div>
    </div>
  )
}
