import React from 'react'
import { useTranslation } from 'react-i18next'
import { Factory } from 'lucide-react'
import { MapPopupShell } from './MapPopupShell'

export function IndustryMapPopupCard({ industry }) {
  const { t } = useTranslation()
  const lat = industry?.gps_latitude
  const lng = industry?.gps_longitude
  const hasGps = lat != null && lng != null

  return (
    <MapPopupShell>
      <div className="flex items-start gap-3 p-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
          <Factory className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{industry?.industry_name || 'Industry'}</p>
          <p className="mt-0.5 text-xs text-zinc-500">
            {industry?.is_internal ? t('commandCenter.popup.internal') : t('commandCenter.popup.external')}
            {industry?.is_active === false ? ` · ${t('commandCenter.popup.inactive')}` : ''}
          </p>
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
      </div>
    </MapPopupShell>
  )
}
