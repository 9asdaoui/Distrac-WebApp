export const CLUSTER_ZOOM_THRESHOLD = 12

/**
 * Layer-of-detail rules by zoom band for Command Center map.
 */
export function resolveLodForZoom(zoom) {
  const z = Number(zoom)
  const safe = Number.isFinite(z) ? z : 12

  return {
    zoom: safe,
    showClients: safe >= 10,
    showVehicles: safe >= 8,
    showIndustries: safe >= 11,
    showDepots: true,
    showRegions: true,
    showSectors: safe >= 7,
    useServerClusters: safe < CLUSTER_ZOOM_THRESHOLD,
    simplifyBoundaries: safe < 14,
    simplifyTrail: safe < 12,
    trailToleranceDeg: safe < 9 ? 0.0008 : safe < 11 ? 0.0004 : 0.00015,
  }
}

export function mergeLodWithFilter(lod, layerVisibility) {
  if (!layerVisibility) return lod
  return {
    ...lod,
    showClients: lod.showClients && layerVisibility.clients !== false,
    showVehicles: lod.showVehicles && layerVisibility.vehicles !== false,
    showIndustries: lod.showIndustries && layerVisibility.industries !== false,
    showDepots: lod.showDepots && layerVisibility.depots !== false,
    showRegions: lod.showRegions && layerVisibility.regions !== false,
    showSectors: lod.showSectors && layerVisibility.sectors !== false,
  }
}
