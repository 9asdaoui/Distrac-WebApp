import React from 'react'
import { useTranslation } from 'react-i18next'
import { Store } from 'lucide-react'
import { MapPopupShell } from './MapPopupShell'

export function ClientMapPopupCard({ client }) {
  const { t } = useTranslation()
  const lat = client?.gps_latitude
  const lng = client?.gps_longitude
  const hasGps = lat != null && lng != null

  return (
    <MapPopupShell>
      <div className="flex items-start gap-3 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
          <Store className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {client?.client_name || client?.store_name || 'Client'}
          </p>
          {client?.store_name && client?.client_name && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">{client.store_name}</p>
          )}
          {client?.city && <p className="mt-0.5 text-xs text-zinc-500">{client.city}</p>}
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
        {client?.phone && <p className="mt-1 text-zinc-300">{client.phone}</p>}
      </div>
    </MapPopupShell>
  )
}
