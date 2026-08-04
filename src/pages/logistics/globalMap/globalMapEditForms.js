import { EMPTY_EDIT_FORM } from '../hooks/useMapEdit'

export function buildEditFormFromSector(sector) {
  if (!sector) return EMPTY_EDIT_FORM
  return {
    sectorName: sector.sector_name || '',
    regionId: sector.region_id || '',
    depotId: sector.depot_id || '',
    assignedProfileId: sector.assigned_profile_id || '',
    isActive: sector.is_active !== false,
  }
}

export const EMPTY_REGION_EDIT_FORM = {
  regionName: '',
  code: '',
  isActive: true,
}

export function buildEditFormFromRegion(region) {
  if (!region) return { ...EMPTY_REGION_EDIT_FORM }
  return {
    regionName: region.region_name || '',
    code: region.code || '',
    isActive: region.is_active !== false,
  }
}

/* Client edit form helpers */
export const EMPTY_CLIENT_EDIT_FORM = {
  storeName: '',
  clientName: '',
  phone: '',
  clientAddress: '',
  city: '',
  gpsLatitude: '',
  gpsLongitude: '',
}

export function buildEditFormFromClient(client) {
  if (!client) return { ...EMPTY_CLIENT_EDIT_FORM }
  return {
    storeName: client.store_name || '',
    clientName: client.client_name || '',
    phone: client.phone || '',
    clientAddress: client.client_address || '',
    city: client.city || '',
    gpsLatitude: client.gps_latitude || '',
    gpsLongitude: client.gps_longitude || '',
  }
}

export const EMPTY_DEPOT_EDIT_FORM = {
  depotName: '',
  address: '',
  totalPriceCapacity: '',
  totalVolumeCapacity: '',
  autoApproveReplenishment: false,
  gpsLatitude: '',
  gpsLongitude: '',
}

export function buildEditFormFromDepot(depot) {
  if (!depot) return { ...EMPTY_DEPOT_EDIT_FORM }
  return {
    depotName: depot.depot_name || '',
    address: depot.address || '',
    totalPriceCapacity: depot.total_price_capacity ?? '',
    totalVolumeCapacity: depot.total_volume_capacity ?? '',
    autoApproveReplenishment: Boolean(depot.auto_approve_replenishment),
    gpsLatitude: depot.gps_latitude ?? '',
    gpsLongitude: depot.gps_longitude ?? '',
  }
}

export const EMPTY_INDUSTRY_EDIT_FORM = {
  industryName: '',
  description: '',
  isInternal: false,
  isActive: true,
  gpsLatitude: '',
  gpsLongitude: '',
}

export function buildEditFormFromIndustry(industry) {
  if (!industry) return { ...EMPTY_INDUSTRY_EDIT_FORM }
  return {
    industryName: industry.industry_name || '',
    description: industry.description || '',
    isInternal: Boolean(industry.is_internal),
    isActive: industry.is_active !== false,
    gpsLatitude: industry.gps_latitude ?? '',
    gpsLongitude: industry.gps_longitude ?? '',
  }
}

export const EMPTY_VEHICLE_EDIT_FORM = {
  plateNumber: '',
  model: '',
  tonnage: '',
  volumeCapacity: '',
  depotId: '',
  isActive: true,
}

export function buildEditFormFromVehicle(vehicle) {
  if (!vehicle) return { ...EMPTY_VEHICLE_EDIT_FORM }
  return {
    plateNumber: vehicle.plate_number || '',
    model: vehicle.model || '',
    tonnage: vehicle.tonnage != null ? String(vehicle.tonnage) : '',
    volumeCapacity: vehicle.volume_capacity != null ? String(vehicle.volume_capacity) : '',
    depotId: vehicle.depot_id || '',
    isActive: vehicle.is_active !== false,
  }
}

export const DETAIL_DATA_KEY = {
  sector: 'sector',
  client: 'client',
  depot: 'depot',
  industry: 'industry',
  region: 'region',
}

export const DETAIL_API_PATH = {
  sector: 'sectors',
  client: 'clients',
  depot: 'depots',
  industry: 'industries',
  region: 'regions',
}

export function normalizeIndustryForMap(industry) {
  if (!industry?.id) return null
  return {
    id: industry.id,
    industry_name: industry.industry_name,
    description: industry.description,
    is_internal: industry.is_internal,
    is_active: industry.is_active,
    gps_latitude: industry.gps_latitude,
    gps_longitude: industry.gps_longitude,
  }
}