import React, { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Factory,
  LayoutDashboard,
  LayoutGrid,
  Map,
  RefreshCw,
  Search,
  Truck,
  User2,
  Warehouse,
} from 'lucide-react'
import { MAP_FILTER_ALL } from './MapLayerFilterBar'
import { WialonStatusChip } from './WialonStatusChip'

const FILTER_TAB_IDS = [
  MAP_FILTER_ALL,
  'industries',
  'depots',
  'regions',
  'sectors',
  'clients',
  'vehicles',
]

const FILTER_TAB_ICONS = {
  [MAP_FILTER_ALL]: LayoutGrid,
  industries: Factory,
  depots: Warehouse,
  regions: Map,
  sectors: Building2,
  clients: User2,
  vehicles: Truck,
}

function useNarrowCommandBar() {
  const [narrow, setNarrow] = useState(false)

  useLayoutEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)')
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  return narrow
}

export function GlobalMapCommandBar({
  hudOffsetClass = '',
  filter,
  onFilterChange,
  searchQuery = '',
  onSearchChange,
  searchDisabled = false,
  onRefresh,
  showWialonStatus = false,
  wialonPulseNonce = 0,
  modeHint = '',
  modeBadge = null,
}) {
  const { t } = useTranslation()
  const narrow = useNarrowCommandBar()
  const tabsContainerRef = useRef(null)
  const tabRefs = useRef({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const updateIndicator = () => {
    const activeEl = tabRefs.current[filter]
    if (!activeEl) return
    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
    })
  }

  const showSearch = filter !== MAP_FILTER_ALL && !searchDisabled

  useLayoutEffect(() => {
    updateIndicator()
    const onResize = () => updateIndicator()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [filter, narrow, showSearch])

  return (
    <div
      className={`pointer-events-none absolute left-4 top-4 z-[1000] flex max-w-[calc(100%-2rem)] flex-col items-start overflow-visible ${hudOffsetClass}`}
    >
      <div className="global-map-command-bar pointer-events-auto max-w-full">
        <div className="flex shrink-0 items-center gap-2 pl-1">
          <LayoutDashboard className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
          <span className="whitespace-nowrap text-[13px] font-semibold text-white">
            {t('sidebar.commandCenter')}
          </span>
          {modeBadge?.label ? (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${modeBadge.className || ''}`}
            >
              {modeBadge.label}
            </span>
          ) : null}
        </div>

        <div className="global-map-command-divider mx-2" aria-hidden />

        <div
          ref={tabsContainerRef}
          className="global-map-command-tabs relative"
          role="radiogroup"
          aria-label="Map layer filter"
        >
          <span
            className="global-map-command-indicator pointer-events-none absolute top-1/2 -translate-y-1/2"
            style={{
              left: indicator.left,
              width: indicator.width,
            }}
            aria-hidden
          />
          {FILTER_TAB_IDS.map((id) => {
            const Icon = FILTER_TAB_ICONS[id]
            const label = t(`commandCenter.layers.${id === MAP_FILTER_ALL ? 'all' : id}`)
            const active = filter === id
            return (
              <button
                key={id}
                ref={(el) => {
                  tabRefs.current[id] = el
                }}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={label}
                title={label}
                onClick={() => onFilterChange(id)}
                className={`global-map-command-tab relative z-[1] inline-flex shrink-0 items-center gap-1 rounded-full transition-colors duration-200 ${
                  active ? 'global-map-command-tab--active' : 'global-map-command-tab--idle'
                }`}
              >
                <Icon className="h-3 w-3 shrink-0" strokeWidth={2} />
                <span
                  className={`global-map-command-tab-label whitespace-nowrap ${
                    narrow ? 'global-map-command-tab-label--hidden' : ''
                  }`}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        <div
          className={`global-map-command-search-slot ${showSearch ? 'global-map-command-search-slot--open' : ''}`}
          aria-hidden={!showSearch}
        >
          <div className="global-map-command-search-slot-inner">
            <div className="global-map-command-divider mx-2" aria-hidden />
            <label className="global-map-command-search">
              <Search className="global-map-command-search-icon h-3 w-3 shrink-0" strokeWidth={2} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={t('commandCenter.search')}
                disabled={!showSearch}
                tabIndex={showSearch ? 0 : -1}
                aria-label={t('commandCenter.filterList')}
              />
            </label>
          </div>
        </div>

        {onRefresh && (
          <>
            <div className="global-map-command-divider mx-2" aria-hidden />
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
              aria-label={t('commandCenter.refreshMap')}
              title={t('commandCenter.refreshMap')}
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </>
        )}

        {showWialonStatus && (
          <>
            <div className="global-map-command-divider mx-2" aria-hidden />
            <WialonStatusChip pulseNonce={wialonPulseNonce} />
          </>
        )}
      </div>
      {modeHint ? (
        <p className="pointer-events-none mt-2 max-w-xs rounded-full border border-zinc-700/80 bg-zinc-900/80 px-3 py-1 text-[11px] text-zinc-400 backdrop-blur-sm">
          {modeHint}
        </p>
      ) : null}
    </div>
  )
}
