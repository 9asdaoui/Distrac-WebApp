import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Bell, Check, ChevronDown, Landmark, Search, X } from 'lucide-react'
import { useScopedDepots } from '../../../hooks/useScopedDepots'
import { DEPOT_FILTER_ALL } from '../../map/CcMissionFiltersContext'
import { DatePickerPopover } from './DatePickerPopover'
import { createDayPeriod, normalizePeriod } from './datePeriod'

/**
 * Sticky navbar: Depot (left) · Date (center) · Search · Bell · Profile (right).
 */
export function DepotOpsRailHeader({
  depotId = DEPOT_FILTER_ALL,
  onDepotChange,
  period,
  onPeriodChange,
  date,
  onDateChange,
  searchQuery = '',
  onSearchChange,
  searchVisible = false,
  searchDisabled = false,
  notificationCount = 0,
  notificationOpen = false,
  onNotificationClick,
}) {
  const { t, i18n } = useTranslation()
  const { depots, isLoading: depotsLoading } = useScopedDepots()
  const [depotOpen, setDepotOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const depotMenuId = useId()
  const depotRef = useRef(null)
  const searchInputRef = useRef(null)

  const depotOptions = useMemo(() => {
    const rows = [
      { id: DEPOT_FILTER_ALL, name: t('commandCenter.allDepots', { defaultValue: 'All depots' }) },
      ...depots.map((d) => ({ id: d.id, name: d.depot_name || d.name || d.id })),
    ]
    return rows
  }, [depots, t])

  const depot =
    depotOptions.find((d) => d.id === depotId) || depotOptions[0]

  const canSearch = searchVisible && !searchDisabled

  useEffect(() => {
    if (!depotOpen) return undefined
    const onPointerDown = (e) => {
      if (!depotRef.current?.contains(e.target)) setDepotOpen(false)
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDepotOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [depotOpen])

  useEffect(() => {
    if (!canSearch) {
      setSearchOpen(false)
      onSearchChange?.('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSearch])

  useEffect(() => {
    if (searchOpen) {
      const id = window.setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [searchOpen])

  const openSearch = () => {
    if (!canSearch) return
    setSearchOpen(true)
  }

  const closeSearch = () => {
    setSearchOpen(false)
    onSearchChange?.('')
  }

  return (
    <header className="sticky top-0 z-20 shrink-0 bg-cc-bg/95 backdrop-blur-md">
      <div className="grid h-[56px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4">
        <div ref={depotRef} className="relative justify-self-start">
          <button
            type="button"
            onClick={() => setDepotOpen((open) => !open)}
            aria-haspopup="listbox"
            aria-expanded={depotOpen}
            aria-controls={depotMenuId}
            aria-label="Depot"
            disabled={depotsLoading}
            className={`flex h-9 w-[240px] items-center gap-2 rounded-cc-control border bg-cc-surface py-0 pl-3 pr-3 text-cc-body font-medium text-cc-primary outline-none transition hover:border-cc-border-hover ${
              depotOpen ? 'border-cc-accent' : 'border-cc-border'
            }`}
          >
            <Landmark className="h-4 w-4 shrink-0 text-cc-primary" strokeWidth={1.75} />
            <span className="min-w-0 flex-1 truncate text-left">{depot.name}</span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-cc-tertiary transition ${depotOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {depotOpen ? (
            <ul
              id={depotMenuId}
              role="listbox"
              aria-label="Depots"
              className="absolute left-0 top-[calc(100%+6px)] z-30 max-h-72 min-w-full overflow-auto rounded-xl border border-cc-border bg-cc-surface py-1 shadow-cc-panel"
            >
              {depotOptions.map((d) => {
                const selected = d.id === depot.id
                return (
                  <li key={d.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => {
                        onDepotChange?.(d.id)
                        setDepotOpen(false)
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-cc-body transition ${
                        selected
                          ? 'bg-cc-accent/15 font-semibold text-cc-primary'
                          : 'font-medium text-cc-secondary hover:bg-cc-surface-hover hover:text-cc-primary'
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">{d.name}</span>
                      {selected ? <Check className="h-3.5 w-3.5 shrink-0 text-cc-accent" /> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>

        <div className="justify-self-center">
          <DatePickerPopover
            period={
              period !== undefined
                ? normalizePeriod(period)
                : date
                  ? createDayPeriod(date)
                  : createDayPeriod()
            }
            onPeriodChange={(next) => {
              if (onPeriodChange) {
                onPeriodChange(next)
                return
              }
              if (next?.value) onDateChange?.(next.value)
            }}
            locale={i18n.language}
          />
        </div>

        <div className="flex items-center justify-end gap-2 justify-self-end sm:gap-3">
          {canSearch ? (
            <div
              className={`cc-nav-search${searchOpen ? ' cc-nav-search--open' : ''}`}
              onClick={() => {
                if (!searchOpen) openSearch()
              }}
            >
              <button
                type="button"
                className="cc-nav-search__icon"
                aria-label={t('commandCenter.search')}
                aria-expanded={searchOpen}
                tabIndex={searchOpen ? -1 : 0}
                onClick={(e) => {
                  e.stopPropagation()
                  if (searchOpen) {
                    searchInputRef.current?.focus()
                    return
                  }
                  openSearch()
                }}
              >
                <Search className="h-4 w-4" strokeWidth={2} />
              </button>
              <input
                ref={searchInputRef}
                type="search"
                className="cc-nav-search__input"
                value={searchQuery}
                disabled={!searchOpen}
                tabIndex={searchOpen ? 0 : -1}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') closeSearch()
                }}
                placeholder={t('commandCenter.search')}
                aria-label={t('commandCenter.filterList')}
                aria-hidden={!searchOpen}
              />
              <button
                type="button"
                className="cc-nav-search__close"
                onClick={(e) => {
                  e.stopPropagation()
                  closeSearch()
                }}
                tabIndex={searchOpen ? 0 : -1}
                aria-label="Close search"
                aria-hidden={!searchOpen}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onNotificationClick}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-cc-control border border-cc-border bg-cc-surface text-cc-secondary transition hover:border-cc-border-hover hover:text-white"
            aria-label={`${notificationCount} notifications`}
            aria-expanded={notificationOpen}
          >
            <Bell className="h-4 w-4" />
            {notificationCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-cc-error px-1 text-cc-label font-bold text-white">
                {notificationCount > 99 ? '99+' : notificationCount}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  )
}
