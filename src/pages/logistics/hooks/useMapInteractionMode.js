import { useMemo } from 'react'

export const MAP_MODES = {
  EXPLORE: 'explore',
  INSPECT: 'inspect',
  FOLLOW: 'follow',
  EDIT: 'edit',
  CREATE: 'create',
}

const MODE_RULES = {
  explore: {
    canPan: true,
    canSelectEntities: true,
    canDragMarkers: false,
    canPlacePin: false,
    mapClass: 'global-map-mode--explore',
    cursor: 'default',
  },
  inspect: {
    canPan: true,
    canSelectEntities: true,
    canDragMarkers: false,
    canPlacePin: false,
    mapClass: 'global-map-mode--inspect',
    cursor: 'pointer',
  },
  follow: {
    canPan: true,
    canSelectEntities: false,
    canDragMarkers: false,
    canPlacePin: false,
    mapClass: 'global-map-mode--follow',
    cursor: 'grab',
  },
  edit: {
    canPan: true,
    canSelectEntities: false,
    canDragMarkers: true,
    canPlacePin: false,
    mapClass: 'global-map-mode--edit',
    cursor: 'crosshair',
  },
  create: {
    canPan: true,
    canSelectEntities: false,
    canDragMarkers: false,
    canPlacePin: true,
    mapClass: 'global-map-mode--create',
    cursor: 'crosshair',
  },
}

const MODE_HINTS = {
  explore: 'Explore — click a pin to inspect',
  inspect: 'Inspect — detail in the side panel',
  follow: 'Following — pan the map to exit follow',
  edit: 'Edit — drag handles to adjust geometry',
  create: 'Create — click the map to place a pin, or use the form',
}

const MODE_BADGE = {
  explore: { label: 'Explore', className: 'bg-zinc-800 text-zinc-300 ring-zinc-600' },
  inspect: { label: 'Inspect', className: 'bg-sky-950/80 text-sky-300 ring-sky-700/60' },
  follow: { label: 'Follow', className: 'bg-orange-950/80 text-orange-300 ring-orange-700/60' },
  edit: { label: 'Edit', className: 'bg-amber-950/80 text-amber-300 ring-amber-700/60' },
  create: { label: 'Create', className: 'bg-rose-950/80 text-rose-300 ring-rose-700/60' },
}

/**
 * Interaction mode controller — rules, hints, and map affordances.
 */
export function useMapInteractionMode({
  isEditing = false,
  isCreatingRegion = false,
  isCreatingIndustry = false,
  isPlacingPin = false,
  followVehicleId = null,
  selectedElement = null,
}) {
  const mode = useMemo(() => {
    if (followVehicleId) return MAP_MODES.FOLLOW
    if (isEditing) return MAP_MODES.EDIT
    if (isCreatingRegion || isCreatingIndustry || isPlacingPin) return MAP_MODES.CREATE
    if (selectedElement?.id) return MAP_MODES.INSPECT
    return MAP_MODES.EXPLORE
  }, [
    followVehicleId,
    isEditing,
    isCreatingRegion,
    isCreatingIndustry,
    isPlacingPin,
    selectedElement?.id,
  ])

  const rules = MODE_RULES[mode] || MODE_RULES.explore
  const hint = MODE_HINTS[mode] || MODE_HINTS.explore
  const badge = MODE_BADGE[mode] || MODE_BADGE.explore

  return {
    mode,
    hint,
    badge,
    ...rules,
  }
}
