/**
 * @deprecated Import from `./mapLayerVisibility` instead.
 * Thin re-export so older imports keep resolving during the uncouple.
 */
import {
  MAP_LAYER_IDS,
  visibilityFromLegacyFilter,
  readMapLayerVisibility,
} from './mapLayerVisibility'

export {
  MAP_LAYER_IDS,
  DEFAULT_MAP_LAYER_VISIBILITY,
  MAP_LAYER_VISIBILITY_STORAGE_KEY,
  LEGACY_MAP_LAYER_FILTER_STORAGE_KEY,
  readMapLayerVisibility,
  writeMapLayerVisibility,
  visibilityFromLegacyFilter,
  toggleMapLayerVisibility,
  isLayerVisible,
  viewportLayersFromVisibility,
} from './mapLayerVisibility'

/** @deprecated Use multi-toggle visibility; single-select filter is gone. */
export const MAP_FILTER_ALL = 'all'
export const DEFAULT_MAP_LAYER_FILTER = MAP_FILTER_ALL

/** @deprecated Prefer readMapLayerVisibility. */
export function visibilityFromFilter(filter) {
  return visibilityFromLegacyFilter(filter)
}

/** @deprecated Prefer readMapLayerVisibility. */
export function readMapLayerFilter() {
  const vis = readMapLayerVisibility()
  const on = Object.entries(vis)
    .filter(([, v]) => v)
    .map(([k]) => k)
  if (on.length === MAP_LAYER_IDS.length || on.length === 0) return MAP_FILTER_ALL
  if (on.length === 1) return on[0]
  return MAP_FILTER_ALL
}
