import React from 'react'
import { Loader2, PanelRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CommandCenterSidebar } from '../../../components/map/CommandCenterSidebar'
import { MapCitySearch } from '../../../components/map/MapCitySearch'
import { MapEngine } from '../../../components/map/engine/MapEngine'

export function MapColumn({
  loadError,
  isInitialLoading,
  isRefreshing,
  hudOffsetClass,
  activePanel,
  onPanelChange,
  railOpen,
  onToggleRail,
  mapEngineProps,
  onFlyToCity,
}) {
  const { t } = useTranslation()

  return (
    <div className="map-hud-host relative h-full min-h-0 min-w-0 w-full shrink-0 overflow-hidden rounded-cc-panel border border-cc-border-subtle bg-cc-surface shadow-cc-subtle transition-all duration-300 lg:w-[42%]">
      {loadError && (
        <div className="absolute left-1/2 top-4 z-[1001] w-full max-w-md -translate-x-1/2 px-4">
          <div className="rounded-xl border border-red-900/50 bg-red-950/80 px-4 py-3 text-sm text-red-200 shadow-lg backdrop-blur-md">
            {loadError}
          </div>
        </div>
      )}

      {isRefreshing && !isInitialLoading && (
        <div className="pointer-events-none absolute right-4 top-4 z-[1001]">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700/80 bg-zinc-900/85 px-3 py-1.5 text-[11px] font-medium text-zinc-300 shadow-lg backdrop-blur-md">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Updating map…
          </div>
        </div>
      )}

      <CommandCenterSidebar
        hudOffsetClass={hudOffsetClass}
        activePanel={activePanel}
        onPanelChange={onPanelChange}
      />

      <MapCitySearch
        hudOffsetClass={hudOffsetClass}
        onFlyToCity={onFlyToCity}
        disabled={isInitialLoading}
      />

      {isInitialLoading && (
        <div className="pointer-events-none absolute inset-0 z-[900] flex flex-col items-center justify-center bg-cc-surface/80">
          <Loader2 className="h-10 w-10 animate-spin text-zinc-500" />
          <p className="mt-4 text-sm font-medium text-zinc-400">{t('commandCenter.loading')}</p>
          <p className="mt-1 text-xs text-zinc-600">{t('commandCenter.loadingLayers')}</p>
        </div>
      )}

      <MapEngine {...mapEngineProps} />

      <button
        type="button"
        onClick={onToggleRail}
        className="absolute bottom-4 right-4 z-[1100] inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-lg backdrop-blur-md lg:hidden"
      >
        <PanelRight className="h-4 w-4" />
        {railOpen ? 'Hide panel' : 'Show panel'}
      </button>
    </div>
  )
}
