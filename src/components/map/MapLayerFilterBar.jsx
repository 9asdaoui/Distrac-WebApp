import React from 'react'
import { Building2, Factory, Map, Truck, User2, Warehouse } from 'lucide-react'

export const MAP_FILTER_ALL = 'all'

export const MAP_LAYER_IDS = ['industries', 'depots', 'regions', 'sectors', 'clients', 'vehicles']

export const DEFAULT_MAP_LAYER_FILTER = MAP_FILTER_ALL

export const DEFAULT_MAP_LAYER_VISIBILITY = Object.fromEntries(
  MAP_LAYER_IDS.map((id) => [id, true]),
)

const LAYER_CONFIG = [
  { id: 'industries', label: 'Industries', icon: Factory },
  { id: 'depots', label: 'Depots', icon: Warehouse },
  { id: 'regions', label: 'Regions', icon: Map },
  { id: 'sectors', label: 'Sectors', icon: Building2 },
  { id: 'clients', label: 'Clients', icon: User2 },
  { id: 'vehicles', label: 'Vehicles', icon: Truck },
]

const FILTER_ACTIVE =
  'border border-zinc-200 bg-white font-medium text-zinc-900 shadow-sm'
const FILTER_INACTIVE =
  'border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'

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

function FilterPills({ filter, onChange }) {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar"
      role="radiogroup"
      aria-label="Map layer filter"
    >
      <button
        type="button"
        role="radio"
        aria-checked={filter === MAP_FILTER_ALL}
        onClick={() => onChange(MAP_FILTER_ALL)}
        className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-all ${
          filter === MAP_FILTER_ALL ? FILTER_ACTIVE : FILTER_INACTIVE
        }`}
      >
        All
      </button>
      {LAYER_CONFIG.map(({ id, label, icon: Icon }) => {
        const selected = filter === id
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-all ${
              selected ? FILTER_ACTIVE : FILTER_INACTIVE
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Standalone bar or embedded pills inside the Global Map control panel. */
export function MapLayerFilterBar({ filter, onChange, embedded = false, className = '' }) {
  if (embedded) {
    return <FilterPills filter={filter} onChange={onChange} />
  }

  return (
    <div
      className={`pointer-events-auto rounded-xl border border-zinc-800 bg-zinc-950/85 p-3 shadow-2xl backdrop-blur-md ${className}`}
    >
      <FilterPills filter={filter} onChange={onChange} />
    </div>
  )
}
