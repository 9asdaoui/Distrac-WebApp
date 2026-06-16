export const MAP_FILTER_ALL = 'all'

export const MAP_LAYER_IDS = ['industries', 'depots', 'regions', 'sectors', 'clients', 'vehicles']

export const DEFAULT_MAP_LAYER_FILTER = MAP_FILTER_ALL

export const DEFAULT_MAP_LAYER_VISIBILITY = Object.fromEntries(
  MAP_LAYER_IDS.map((id) => [id, true]),
)

/** Single layer id, or all layers at once. */
export function visibilityFromFilter(filter) {
  if (filter === MAP_FILTER_ALL) {
    return { ...DEFAULT_MAP_LAYER_VISIBILITY }
  }
  if (MAP_LAYER_IDS.includes(filter)) {
    return Object.fromEntries(MAP_LAYER_IDS.map((id) => [id, id === filter]))
  }
  return { ...DEFAULT_MAP_LAYER_VISIBILITY }
}

export function readMapLayerFilter(storageKey) {
  if (typeof window === 'undefined') return DEFAULT_MAP_LAYER_FILTER
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return DEFAULT_MAP_LAYER_FILTER

    const parsed = JSON.parse(raw)
    if (parsed === MAP_FILTER_ALL || MAP_LAYER_IDS.includes(parsed)) {
      return parsed
    }

    if (parsed && typeof parsed === 'object') {
      const on = MAP_LAYER_IDS.filter((id) => parsed[id])
      if (on.length === MAP_LAYER_IDS.length) return MAP_FILTER_ALL
      if (on.length === 1) return on[0]
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_MAP_LAYER_FILTER
}
