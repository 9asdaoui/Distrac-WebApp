import { REGION_LAYER_STYLE } from './mapEngineConstants'

/** Below this zoom, skip custom boundary hover labels (basemap labels dominate). */
export const BOUNDARY_LABEL_MIN_ZOOM = 9

const ROUND_LINE = { lineJoin: 'round', lineCap: 'round' }

/** View mode: always solid — dashes cause blob artifacts on Leaflet paths. */
export function regionPathOptions({ isBeingEdited = false } = {}) {
  return {
    color: REGION_LAYER_STYLE.color,
    weight: isBeingEdited ? 3 : 2,
    fillColor: REGION_LAYER_STYLE.fillColor,
    fillOpacity: isBeingEdited ? 0.14 : 0.06,
    dashArray: null,
    ...ROUND_LINE,
  }
}

export function sectorPathOptions({ style, isBeingEdited = false } = {}) {
  return {
    color: style?.color || '#71717a',
    weight: isBeingEdited ? 3 : 2,
    fillColor: style?.fillColor || '#52525b',
    fillOpacity: isBeingEdited ? 0.18 : 0.1,
    dashArray: null,
    ...ROUND_LINE,
  }
}

export const BOUNDARY_TOOLTIP_OPTIONS = {
  sticky: false,
  permanent: false,
  direction: 'top',
  className: 'global-map-boundary-tooltip',
  opacity: 1,
}

function ringFingerprint(rings) {
  if (!rings?.length) return ''
  return rings
    .map((ring) =>
      (ring || [])
        .map(([lat, lng]) => `${Number(lat).toFixed(5)},${Number(lng).toFixed(5)}`)
        .join(';'),
    )
    .join('|')
}

export function boundaryGeometryKey(entityType, entityId, rings) {
  return `${entityType}:${entityId}:${ringFingerprint(rings)}`
}
