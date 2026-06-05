export function matchesMapLayerSearch(query, ...parts) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return parts.some((part) => String(part ?? '').toLowerCase().includes(q))
}

export function filterRegionsForSearch(regions, query) {
  if (!query.trim()) return regions
  return (regions || []).filter((region) =>
    matchesMapLayerSearch(
      query,
      region.region_name,
      region.code,
      region.is_active === false ? 'inactive' : 'active',
    ),
  )
}

export function filterIndustriesForSearch(industries, query) {
  if (!query.trim()) return industries
  return (industries || []).filter((row) =>
    matchesMapLayerSearch(
      query,
      row.industry_name,
      row.description,
      row.is_internal ? 'internal' : 'external',
    ),
  )
}

export function filterDepotsForSearch(depots, query) {
  if (!query.trim()) return depots
  return (depots || []).filter((depot) =>
    matchesMapLayerSearch(query, depot.depot_name, depot.address),
  )
}

export function filterSectorsForSearch(sectors, query) {
  if (!query.trim()) return sectors
  return (sectors || []).filter((sector) =>
    matchesMapLayerSearch(
      query,
      sector.sector_name,
      sector.regions?.region_name,
      sector.depots?.depot_name,
      sector.is_active === false ? 'inactive' : 'active',
    ),
  )
}

export function filterClientsForSearch(clients, query) {
  if (!query.trim()) return clients
  return (clients || []).filter((client) =>
    matchesMapLayerSearch(
      query,
      client.client_name,
      client.place_name,
      client.store_name,
      client.city,
      client.phone,
      client.qr_code,
    ),
  )
}

export function filterVehiclesForSearch(vehicles, query) {
  if (!query.trim()) return vehicles
  return (vehicles || []).filter((v) =>
    matchesMapLayerSearch(
      query,
      v.plate_number,
      v.model,
      v.depot?.depot_name,
      v.is_active === false ? 'inactive' : 'active',
    ),
  )
}

/** Apply search to the active layer only; other layers pass through unchanged. */
export function applyMapLayerSearch(filter, searchQuery, data) {
  const {
    regions = [],
    sectors = [],
    depots = [],
    industries = [],
    clients = [],
    vehicles = [],
  } = data

  if (!searchQuery?.trim()) {
    return { regions, sectors, depots, industries, clients, vehicles }
  }

  switch (filter) {
    case 'regions':
      return {
        regions: filterRegionsForSearch(regions, searchQuery),
        sectors,
        depots,
        industries,
        clients,
        vehicles,
      }
    case 'sectors':
      return {
        regions,
        sectors: filterSectorsForSearch(sectors, searchQuery),
        depots,
        industries,
        clients,
        vehicles,
      }
    case 'depots':
      return {
        regions,
        sectors,
        depots: filterDepotsForSearch(depots, searchQuery),
        industries,
        clients,
        vehicles,
      }
    case 'industries':
      return {
        regions,
        sectors,
        depots,
        industries: filterIndustriesForSearch(industries, searchQuery),
        clients,
        vehicles,
      }
    case 'clients':
      return {
        regions,
        sectors,
        depots,
        industries,
        clients: filterClientsForSearch(clients, searchQuery),
        vehicles,
      }
    case 'vehicles':
      return {
        regions,
        sectors,
        depots,
        industries,
        clients,
        vehicles: filterVehiclesForSearch(vehicles, searchQuery),
      }
    default:
      return { regions, sectors, depots, industries, clients, vehicles }
  }
}
