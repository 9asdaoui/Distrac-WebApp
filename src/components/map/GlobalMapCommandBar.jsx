import React, { useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  Building2,
  Factory,
  Globe,
  LayoutGrid,
  Map,
  Search,
  Truck,
  User2,
  Warehouse,
} from 'lucide-react'
import { MAP_FILTER_ALL } from './MapLayerFilterBar'

const FILTER_TABS = [
  { id: MAP_FILTER_ALL, label: 'All', icon: LayoutGrid },
  { id: 'industries', label: 'Industries', icon: Factory },
  { id: 'depots', label: 'Depots', icon: Warehouse },
  { id: 'regions', label: 'Regions', icon: Map },
  { id: 'sectors', label: 'Sectors', icon: Building2 },
  { id: 'clients', label: 'Clients', icon: User2 },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
]

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
  sectors,
  depots,
  industries,
  clients,
  regions,
  vehicles,
  filter,
  onFilterChange,
  searchQuery = '',
  onSearchChange,
  searchDisabled = false,
}) {
  const narrow = useNarrowCommandBar()
  const tabsContainerRef = useRef(null)
  const tabRefs = useRef({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const statsLine = useMemo(
    () =>
      [
        `${sectors} sectors`,
        `${depots} depots`,
        `${industries} industries`,
        `${clients} clients`,
        `${regions} regions`,
        `${vehicles} vehicles`,
      ].join(' • '),
    [sectors, depots, industries, clients, regions, vehicles],
  )

  const updateIndicator = () => {
    const activeEl = tabRefs.current[filter]
    if (!activeEl) return
    setIndicator({
      left: activeEl.offsetLeft,
      width: activeEl.offsetWidth,
    })
  }

  useLayoutEffect(() => {
    updateIndicator()
    const onResize = () => updateIndicator()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [filter, narrow])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col items-center overflow-visible px-3">
      <div className="global-map-command-bar pointer-events-auto">
        <div className="flex shrink-0 items-center gap-2 pl-1">
          <Globe className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
          <span className="whitespace-nowrap text-[13px] font-semibold text-white">Global Map</span>
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
          {FILTER_TABS.map(({ id, label, icon: Icon }) => {
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

        <div className="global-map-command-divider mx-2" aria-hidden />

        <label
          className={`global-map-command-search ${searchDisabled ? 'global-map-command-search--disabled' : ''}`}
        >
          <Search className="global-map-command-search-icon h-3 w-3 shrink-0" strokeWidth={2} />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Search…"
            disabled={searchDisabled}
            aria-label="Filter active layer list"
          />
        </label>
      </div>

      <p className="global-map-command-stats pointer-events-auto" title={statsLine}>
        {statsLine}
      </p>
    </div>
  )
}
