import React from 'react'
import { useTranslation } from 'react-i18next'
import { MapPopupShell } from './MapPopupShell'
import { Warehouse } from 'lucide-react'

export function DepotMapPopupCard({ depot, sectorCount = 0 }) {
  const { t } = useTranslation()
  const lat = depot?.gps_latitude
  const lng = depot?.gps_longitude
  const hasGps = lat != null && lng != null

  return (
    <MapPopupShell>
      <div className="flex items-start gap-3 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <Warehouse className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{depot?.depot_name || 'Depot'}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {depot?.is_central ? t('commandCenter.popup.centralDepot') : t('commandCenter.popup.depot')}
          </p>
          {depot?.address && <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{depot.address}</p>}
        </div>
      </div>
      <div className="border-t border-zinc-800 px-3 py-2 text-[11px] text-zinc-400">
        {hasGps ? (
          <p className="font-mono text-zinc-300">
            {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
          </p>
        ) : (
          <p>{t('commandCenter.popup.noGps')}</p>
        )}
        {sectorCount > 0 && (
          <p className="mt-1">{t('commandCenter.popup.linkedSectors', { count: sectorCount })}</p>
        )}
      </div>
    </MapPopupShell>
  )
}
