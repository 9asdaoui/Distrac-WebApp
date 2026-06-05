import 'leaflet-edgebuffer'

export const DARK_TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
export const DARK_TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

/**
 * Tile layer tuning for smooth pan/zoom on large map canvases.
 * edgeBufferTiles (plugin) preloads tiles outside the viewport.
 */
export const GLOBAL_MAP_TILE_OPTIONS = {
  attribution: DARK_TILE_ATTRIBUTION,
  /** Extra tile rings loaded beyond each edge of the viewport. */
  edgeBufferTiles: 5,
  /** Keep recently visible tiles in memory while panning. */
  keepBuffer: 8,
  /** Fetch tiles during pan/zoom, not only when movement stops. */
  updateWhenIdle: false,
  updateWhenZooming: true,
  maxNativeZoom: 19,
  maxZoom: 19,
}
