import React, { useEffect, useId, useRef, useState } from 'react'
import { Filter, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MAP_HUD_GLASS } from './engine/mapEngineConstants'
import { MAP_LAYER_IDS, toggleMapLayerVisibility } from './mapLayerVisibility'

/**
 * Map HUD control under the legend — multi-toggle show/hide for map layers.
 * Expands in-place like FloatingLegend (same open animation).
 */
export function MapLayerVisibilityControl({ visibility, onChange }) {
  const { t } = useTranslation()
  const panelId = useId()
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    // Use click (not mousedown) so sibling HUD buttons receive their click
    // before this panel collapses and shifts layout.
    document.addEventListener('click', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('click', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const label = t('commandCenter.layers.filter', { defaultValue: 'Map layers' })
  const title = t('commandCenter.layers.title', { defaultValue: 'Show on map' })

  return (
    <div
      ref={rootRef}
      className={`map-layer-filter pointer-events-auto ${MAP_HUD_GLASS}${open ? ' map-layer-filter--open' : ''}`}
    >
      <div className="map-layer-filter__chrome">
        {open ? (
          <p className="map-layer-filter__title">{title}</p>
        ) : (
          <span className="sr-only">{label}</span>
        )}
        <button
          type="button"
          className="map-layer-filter__toggle"
          aria-label={label}
          aria-expanded={open}
          aria-controls={panelId}
          title={label}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="relative flex h-4 w-4 items-center justify-center">
            <Filter
              className={`absolute h-4 w-4 transition-all duration-200 ease-out ${
                open ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
              }`}
              strokeWidth={2}
            />
            <X
              className={`absolute h-4 w-4 transition-all duration-200 ease-out ${
                open ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0'
              }`}
              strokeWidth={2}
            />
          </span>
        </button>
      </div>

      <div
        id={panelId}
        role="group"
        aria-label={label}
        className="map-layer-filter__body"
        aria-hidden={!open}
      >
        <ul className="map-layer-filter__list">
          {MAP_LAYER_IDS.map((id, index) => {
            const checked = Boolean(visibility?.[id])
            const rowLabel = t(`commandCenter.layers.${id}`)
            return (
              <li key={id} className="map-layer-filter__row-wrap" style={{ '--i': index }}>
                <div className="map-layer-filter__row">
                  <span className="map-layer-filter__row-label" id={`${panelId}-${id}`}>
                    {rowLabel}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-labelledby={`${panelId}-${id}`}
                    className={`map-layer-filter__switch${checked ? ' map-layer-filter__switch--on' : ''}`}
                    onClick={() => onChange?.(toggleMapLayerVisibility(visibility, id))}
                  >
                    <span className="map-layer-filter__switch-thumb" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

export default MapLayerVisibilityControl
