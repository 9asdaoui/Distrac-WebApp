import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Loader2, MapPinned, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import apiInstance from '../../api/axiosInstance'
import { CC_HUD_GLASS } from '../../styles/designTokens'

const DEBOUNCE_MS = 280
const CITY_SEARCH_LIMIT = 6

function splitPlaceName(displayName = '') {
  const parts = String(displayName)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  return {
    primary: parts[0] || displayName,
    secondary: parts.slice(1, 3).join(', '),
  }
}

/**
 * Map HUD city search — left-aligned command field; geocode → flyTo.
 */
export function MapCitySearch({ hudOffsetClass = '', onFlyToCity, disabled = false }) {
  const { t } = useTranslation()
  const listId = useId()
  const rootRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)
  const debounceRef = useRef(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [listOpen, setListOpen] = useState(false)
  const [focused, setFocused] = useState(false)

  const clearQuery = useCallback(() => {
    setQuery('')
    setResults([])
    setError('')
    setActiveIndex(-1)
    setLoading(false)
    setListOpen(false)
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    abortRef.current?.abort()
    abortRef.current = null
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!listOpen) return undefined
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setListOpen(false)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [listOpen])

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setError('')
      setLoading(false)
      setActiveIndex(-1)
      setListOpen(false)
      abortRef.current?.abort()
      return undefined
    }

    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(async () => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setLoading(true)
      setError('')
      setResults([])
      setActiveIndex(-1)
      setListOpen(true)
      try {
        const res = await apiInstance.get('/logistics/geocode/search', {
          params: { q: term, limit: CITY_SEARCH_LIMIT },
          signal: controller.signal,
        })
        const rows = res.data?.data?.results
        const next = Array.isArray(rows) ? rows : []
        setResults(next)
        setActiveIndex(next.length > 0 ? 0 : -1)
        if (next.length === 0) {
          setError(
            t('commandCenter.citySearch.noResults', {
              defaultValue: 'No places found in Morocco',
            }),
          )
        }
      } catch (err) {
        if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return
        setResults([])
        setActiveIndex(-1)
        setError(
          t('commandCenter.citySearch.error', {
            defaultValue: 'Couldn’t search. Try again.',
          }),
        )
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [query, t])

  const pickResult = useCallback(
    (item) => {
      if (!item || item.lat == null || item.lng == null) return
      const { primary } = splitPlaceName(item.displayName)
      setQuery(primary)
      setResults([])
      setError('')
      setListOpen(false)
      setActiveIndex(-1)
      onFlyToCity?.({
        lat: Number(item.lat),
        lng: Number(item.lng),
        displayName: item.displayName,
      })
    },
    [onFlyToCity],
  )

  const showPanel = listOpen && query.trim().length >= 2
  const hasQuery = query.length > 0

  const panelRows = useMemo(
    () =>
      results.map((item) => ({
        ...item,
        ...splitPlaceName(item.displayName),
      })),
    [results],
  )

  return (
    <div
      ref={rootRef}
      className={`map-hud-search pointer-events-auto absolute ${hudOffsetClass}${
        focused || showPanel ? ' map-hud-search--active' : ''
      }${showPanel ? ' map-hud-search--open' : ''}`}
    >
      <div className={`map-city-search ${CC_HUD_GLASS}`}>
        <div className="map-city-search__field">
          <span className="map-city-search__leading" aria-hidden>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-orange-400" strokeWidth={2} />
            ) : (
              <Search className="h-4 w-4" strokeWidth={2} />
            )}
          </span>
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            className="map-city-search__input"
            value={query}
            disabled={disabled}
            placeholder={t('commandCenter.citySearch.placeholder', {
              defaultValue: 'Go to a city…',
            })}
            aria-label={t('commandCenter.citySearch.label', { defaultValue: 'Search cities' })}
            aria-autocomplete="list"
            aria-controls={listId}
            aria-expanded={showPanel}
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
            }
            onFocus={() => {
              setFocused(true)
              if (query.trim().length >= 2 && (results.length > 0 || error || loading)) {
                setListOpen(true)
              }
            }}
            onBlur={() => setFocused(false)}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault()
                if (showPanel) {
                  setListOpen(false)
                  return
                }
                if (hasQuery) clearQuery()
                return
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (panelRows.length === 0) return
                setListOpen(true)
                setActiveIndex((i) => (i + 1) % panelRows.length)
                return
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                if (panelRows.length === 0) return
                setListOpen(true)
                setActiveIndex((i) => (i <= 0 ? panelRows.length - 1 : i - 1))
                return
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                const pick = activeIndex >= 0 ? panelRows[activeIndex] : panelRows[0]
                if (pick) pickResult(pick)
              }
            }}
          />
          {hasQuery ? (
            <button
              type="button"
              className="map-city-search__clear"
              onClick={clearQuery}
              aria-label={t('commandCenter.citySearch.clear', { defaultValue: 'Clear' })}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          ) : null}
        </div>

        {showPanel ? (
          <div id={listId} role="listbox" className="map-city-search__panel">
            {loading && panelRows.length === 0 && !error ? (
              <div className="map-city-search__empty map-city-search__empty--muted">
                {t('commandCenter.citySearch.searching', { defaultValue: 'Searching places…' })}
              </div>
            ) : null}

            {!loading && error && panelRows.length === 0 ? (
              <div className="map-city-search__empty map-city-search__empty--muted">{error}</div>
            ) : null}

            {panelRows.map((item, index) => (
              <button
                key={`${item.lat}-${item.lng}-${item.displayName}`}
                id={`${listId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                className={`map-city-search__option${
                  index === activeIndex ? ' map-city-search__option--active' : ''
                }`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickResult(item)}
              >
                <span className="map-city-search__option-icon" aria-hidden>
                  <MapPinned className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <span className="map-city-search__option-text">
                  <span className="map-city-search__option-primary">{item.primary}</span>
                  {item.secondary ? (
                    <span className="map-city-search__option-secondary">{item.secondary}</span>
                  ) : null}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MapCitySearch
