/** Map layer ids that can be independently shown/hidden on the Command Center map. */
export const MAP_LAYER_IDS = ['industries', 'depots', 'regions', 'sectors', 'clients', 'vehicles']

export const DEFAULT_MAP_LAYER_VISIBILITY = Object.fromEntries(
  MAP_LAYER_IDS.map((id) => [id, true]),
)

/** @deprecated Old single-select filter storage — read once for migration. */
export const LEGACY_MAP_LAYER_FILTER_STORAGE_KEY = 'distrac.globalMap.layerFilter'

export const MAP_LAYER_VISIBILITY_STORAGE_KEY = 'distrac.globalMap.layerVisibility'

const LEGACY_FILTER_ALL = 'all'

function normalizeVisibility(raw) {
  const next = { ...DEFAULT_MAP_LAYER_VISIBILITY }
  if (!raw || typeof raw !== 'object') return next
  for (const id of MAP_LAYER_IDS) {
    if (typeof raw[id] === 'boolean') next[id] = raw[id]
  }
  return next
}

/** Convert legacy single-select filter string/object into a visibility map. */
export function visibilityFromLegacyFilter(filter) {
  if (filter === LEGACY_FILTER_ALL || filter == null) {
    return { ...DEFAULT_MAP_LAYER_VISIBILITY }
  }
  if (MAP_LAYER_IDS.includes(filter)) {
    return Object.fromEntries(MAP_LAYER_IDS.map((id) => [id, id === filter]))
  }
  if (filter && typeof filter === 'object') {
    return normalizeVisibility(filter)
  }
  return { ...DEFAULT_MAP_LAYER_VISIBILITY }
}

export function readMapLayerVisibility(
  storageKey = MAP_LAYER_VISIBILITY_STORAGE_KEY,
  legacyKey = LEGACY_MAP_LAYER_FILTER_STORAGE_KEY,
) {
  if (typeof window === 'undefined') return { ...DEFAULT_MAP_LAYER_VISIBILITY }

  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      return normalizeVisibility(JSON.parse(raw))
    }
  } catch {
    /* ignore */
  }

  try {
    const legacyRaw = localStorage.getItem(legacyKey)
    if (legacyRaw) {
      const migrated = visibilityFromLegacyFilter(JSON.parse(legacyRaw))
      writeMapLayerVisibility(migrated, storageKey)
      try {
        localStorage.removeItem(legacyKey)
      } catch {
        /* ignore */
      }
      return migrated
    }
  } catch {
    /* ignore */
  }

  return { ...DEFAULT_MAP_LAYER_VISIBILITY }
}

export function writeMapLayerVisibility(
  visibility,
  storageKey = MAP_LAYER_VISIBILITY_STORAGE_KEY,
) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(storageKey, JSON.stringify(normalizeVisibility(visibility)))
  } catch {
    /* ignore */
  }
}

export function toggleMapLayerVisibility(visibility, layerId) {
  if (!MAP_LAYER_IDS.includes(layerId)) return visibility
  return {
    ...visibility,
    [layerId]: !visibility[layerId],
  }
}

export function isLayerVisible(visibility, layerId) {
  return Boolean(visibility?.[layerId])
}

/** Viewport bundle layer list from multi-toggle visibility. */
export function viewportLayersFromVisibility(visibility) {
  const layers = []
  if (isLayerVisible(visibility, 'clients')) layers.push('clients')
  if (isLayerVisible(visibility, 'vehicles')) layers.push('vehicles')
  if (isLayerVisible(visibility, 'depots')) layers.push('depots')
  return layers
}
