import React, { useState } from 'react'
import {
  Building2,
  Factory,
  Map,
  Truck,
  Store,
  User2,
  Warehouse,
} from 'lucide-react'
import { SectorBoundaryDrawer, isValidSectorPolygon } from '../SectorBoundaryDrawer'
import { hasGpsCoordinates } from '../LocationMap'
import apiInstance from '../../api/axiosInstance'
import { MapHomeSidePanel } from '../dashboard/MapHomeSidePanel'
import { MAP_FILTER_ALL } from './MapLayerFilterBar'
import {
  MapRailCell,
  MapRailCreateOverlay,
  MapRailLoading,
  MapRailRow,
  MapRailShell,
  MapRailTable,
  railInputClass,
} from './MapRailShell'
import {
  filterClientsForSearch,
  filterDepotsForSearch,
  filterIndustriesForSearch,
  filterRegionsForSearch,
  filterSectorsForSearch,
  filterVehiclesForSearch,
} from './mapLayerSearch'
import {
  EMPTY_INDUSTRY_FORM,
  IndustryFormFields,
  formatIndustryLocation,
  industryFormToPayload,
} from '../logistics/IndustryFormFields'
import { IndustryTypeBadge } from '../logistics/IndustryDetailsContent'
import {
  EntityStatusBadge,
  formatGpsLocation,
  LOGISTICS_MODULES,
} from '../logistics/logisticsModuleUi'

function RailTogglePair({ value, onChange, options }) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition ${
            value === opt.value
              ? 'border-zinc-100 bg-zinc-100 text-zinc-900'
              : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function RailFormFooter({ onCancel, submitLabel, isSubmitting }) {
  return (
    <div className="flex gap-2">
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex-1 rounded-lg bg-zinc-100 py-2.5 text-xs font-semibold text-zinc-900 disabled:opacity-40"
      >
        {isSubmitting ? 'Saving…' : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-xs font-medium text-zinc-400 hover:bg-zinc-800"
      >
        Cancel
      </button>
    </div>
  )
}

function RegionsMapRail({ regions, isLoading, onSelectItem, searchQuery = '', onStartRegionCreate }) {
  const filteredRegions = filterRegionsForSearch(regions, searchQuery)

  return (
    <MapRailShell
      title="Regions"
      subtitle="Same records as the Regions page — click a row to focus on the map."
      icon={Map}
      iconAccentClass={LOGISTICS_MODULES.region.accentDark}
      onAdd={() => onStartRegionCreate?.()}
      addLabel="Add Region"
    >
      {isLoading ? (
        <MapRailLoading />
      ) : (
        <MapRailTable
          columns={['Region', 'Code', 'Boundary', 'Status']}
          isEmpty={filteredRegions.length === 0}
        >
          {filteredRegions.map((region) => (
            <MapRailRow
              key={region.id}
              onClick={() =>
                onSelectItem?.({ type: 'region', id: region.id, name: region.region_name })
              }
            >
              <MapRailCell className="font-medium text-zinc-100">
                {region.region_name || '—'}
              </MapRailCell>
              <MapRailCell>{region.code || '—'}</MapRailCell>
              <MapRailCell>
                {region.boundary ? (
                  <span className="text-emerald-400">Defined</span>
                ) : (
                  '—'
                )}
              </MapRailCell>
              <MapRailCell>
                <EntityStatusBadge isActive={region.is_active !== false} compact />
              </MapRailCell>
            </MapRailRow>
          ))}
        </MapRailTable>
      )}
    </MapRailShell>
  )
}

function IndustriesMapRail({ industries, isLoading, onRefresh, onSelectItem, searchQuery = '' }) {
  const filteredIndustries = filterIndustriesForSearch(industries, searchQuery)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_INDUSTRY_FORM })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.industryName.trim()) {
      setFormError('Industry name is required.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/industries', industryFormToPayload(form))
      setIsCreateOpen(false)
      onRefresh?.()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create industry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title="Industries"
      subtitle="Same records as the Industries page — click a row to inspect on the map."
      icon={Factory}
      iconAccentClass={LOGISTICS_MODULES.industry.accentDark}
      onAdd={() => {
        setForm({ ...EMPTY_INDUSTRY_FORM })
        setFormError('')
        setIsCreateOpen(true)
      }}
      addLabel="Add Industry"
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay
            title="Add Industry"
            subtitle="Fields match the Industries page — GPS places the pin on this map."
            onClose={() => setIsCreateOpen(false)}
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              <IndustryFormFields
                form={form}
                onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                variant="dark"
              />
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <RailFormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel="Create Industry"
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <MapRailLoading />
      ) : (
        <MapRailTable
          columns={['Name', 'Type', 'Location', 'Status']}
          isEmpty={filteredIndustries.length === 0}
        >
          {filteredIndustries.map((row) => (
            <MapRailRow
              key={row.id}
              onClick={() =>
                onSelectItem?.({ type: 'industry', id: row.id, name: row.industry_name })
              }
            >
              <MapRailCell className="font-medium text-zinc-100">{row.industry_name}</MapRailCell>
              <MapRailCell>
                <IndustryTypeBadge isInternal={row.is_internal} compact />
              </MapRailCell>
              <MapRailCell className="font-mono text-[11px] text-zinc-500">
                {formatIndustryLocation(row)}
              </MapRailCell>
              <MapRailCell>
                <EntityStatusBadge isActive={row.is_active} compact />
              </MapRailCell>
            </MapRailRow>
          ))}
        </MapRailTable>
      )}
    </MapRailShell>
  )
}

function DepotsMapRail({ depots, isLoading, onRefresh, onSelectItem, searchQuery = '' }) {
  const filteredDepots = filterDepotsForSearch(depots, searchQuery)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    depotName: '',
    address: '',
    gpsLatitude: '',
    gpsLongitude: '',
    totalPriceCapacity: '',
    totalVolumeCapacity: '',
    isActive: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.depotName.trim()) {
      setFormError('Depot name is required.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/depots', {
        depotName: form.depotName,
        address: form.address,
        gpsLatitude: form.gpsLatitude === '' ? undefined : Number(form.gpsLatitude),
        gpsLongitude: form.gpsLongitude === '' ? undefined : Number(form.gpsLongitude),
        totalPriceCapacity: form.totalPriceCapacity ? Number(form.totalPriceCapacity) : 0,
        totalVolumeCapacity: form.totalVolumeCapacity ? Number(form.totalVolumeCapacity) : 0,
        isActive: form.isActive,
      })
      setIsCreateOpen(false)
      onRefresh?.()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create depot.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title="Depots"
      subtitle="Same records as the Depots page — click a row to inspect on the map."
      icon={Warehouse}
      iconAccentClass={LOGISTICS_MODULES.depot.accentDark}
      onAdd={() => {
        setForm({
          depotName: '',
          address: '',
          gpsLatitude: '',
          gpsLongitude: '',
          totalPriceCapacity: '',
          totalVolumeCapacity: '',
          isActive: true,
        })
        setFormError('')
        setIsCreateOpen(true)
      }}
      addLabel="Add Depot"
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay title="Add Depot" onClose={() => setIsCreateOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Name *</label>
                <input
                  className={railInputClass}
                  value={form.depotName}
                  onChange={(e) => setForm({ ...form, depotName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Address</label>
                <input
                  className={railInputClass}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    className={railInputClass}
                    value={form.gpsLatitude}
                    onChange={(e) => setForm({ ...form, gpsLatitude: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    className={railInputClass}
                    value={form.gpsLongitude}
                    onChange={(e) => setForm({ ...form, gpsLongitude: e.target.value })}
                  />
                </div>
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <RailFormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel="Create Depot"
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <MapRailLoading />
      ) : (
        <MapRailTable columns={['Name', 'Location', 'Capacity', 'Status']} isEmpty={filteredDepots.length === 0}>
          {filteredDepots.map((depot) => {
            const used = Math.min(depot.capacity_usage?.used_percentage || 0, 100)
            return (
              <MapRailRow
                key={depot.id}
                onClick={() =>
                  onSelectItem?.({
                    type: 'depot',
                    id: depot.id,
                    name: depot.depot_name,
                    isCentral: depot.is_central,
                  })
                }
              >
                <MapRailCell className="font-medium text-zinc-100">{depot.depot_name}</MapRailCell>
                <MapRailCell className="font-mono text-[11px] text-zinc-500">
                  {formatGpsLocation(depot.gps_latitude, depot.gps_longitude)}
                </MapRailCell>
                <MapRailCell>{used.toFixed(0)}%</MapRailCell>
                <MapRailCell>
                  <EntityStatusBadge isActive={depot.is_active !== false} compact />
                </MapRailCell>
              </MapRailRow>
            )
          })}
        </MapRailTable>
      )}
    </MapRailShell>
  )
}

function SectorsMapRail({ sectors, regions, isLoading, onRefresh, onSelectItem, searchQuery = '' }) {
  const filteredSectors = filterSectorsForSearch(sectors, searchQuery)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    sectorName: '',
    regionId: '',
    boundary: null,
    isActive: true,
  })
  const [mapDrawerKey, setMapDrawerKey] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sectorName.trim()) {
      setFormError('Sector name is required.')
      return
    }
    if (!isValidSectorPolygon(form.boundary)) {
      setFormError('Draw the sector boundary.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/sectors', {
        sectorName: form.sectorName.trim(),
        regionId: form.regionId || undefined,
        boundary: form.boundary,
        isActive: form.isActive,
      })
      setIsCreateOpen(false)
      onRefresh?.()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create sector.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title="Sectors"
      subtitle="Same records as the Sectors page — click a row to inspect on the map."
      icon={Building2}
      iconAccentClass={LOGISTICS_MODULES.sector.accentDark}
      onAdd={() => {
        setForm({ sectorName: '', regionId: '', boundary: null, isActive: true })
        setFormError('')
        setMapDrawerKey((k) => k + 1)
        setIsCreateOpen(true)
      }}
      addLabel="Add Sector"
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay title="Add Sector" onClose={() => setIsCreateOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Name *</label>
                <input
                  className={railInputClass}
                  value={form.sectorName}
                  onChange={(e) => setForm({ ...form, sectorName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Region</label>
                <select
                  className={railInputClass}
                  value={form.regionId}
                  onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                >
                  <option value="">— None —</option>
                  {regions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.region_name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Boundary *</label>
                <SectorBoundaryDrawer
                  key={mapDrawerKey}
                  className="h-[240px]"
                  value={form.boundary}
                  onChange={(boundary) => setForm((p) => ({ ...p, boundary }))}
                />
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <RailFormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel="Create Sector"
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <MapRailLoading />
      ) : (
        <MapRailTable columns={['Sector', 'Region', 'Depot', 'Status']} isEmpty={filteredSectors.length === 0}>
          {filteredSectors.map((sector) => (
            <MapRailRow
              key={sector.id}
              onClick={() =>
                onSelectItem?.({ type: 'sector', id: sector.id, name: sector.sector_name })
              }
            >
              <MapRailCell className="font-medium text-zinc-100">{sector.sector_name}</MapRailCell>
              <MapRailCell>{sector.regions?.region_name || '—'}</MapRailCell>
              <MapRailCell>{sector.depots?.depot_name || '—'}</MapRailCell>
              <MapRailCell>
                <EntityStatusBadge isActive={sector.is_active !== false} compact />
              </MapRailCell>
            </MapRailRow>
          ))}
        </MapRailTable>
      )}
    </MapRailShell>
  )
}

function ClientsMapRail({ clients, isLoading, onRefresh, onSelectItem, searchQuery = '' }) {
  const filteredClients = filterClientsForSearch(clients, searchQuery)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    clientName: '',
    storeName: '',
    phone: '',
    qrCode: '',
    city: '',
    gpsLatitude: '',
    gpsLongitude: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientName.trim()) {
      setFormError('Client name is required.')
      return
    }
    if (!form.qrCode.trim()) {
      setFormError('QR code is required.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/clients', {
        clientName: form.clientName,
        storeName: form.storeName || undefined,
        phone: form.phone || undefined,
        qrCode: form.qrCode,
        city: form.city || undefined,
        gpsLatitude: form.gpsLatitude === '' ? undefined : Number(form.gpsLatitude),
        gpsLongitude: form.gpsLongitude === '' ? undefined : Number(form.gpsLongitude),
      })
      setIsCreateOpen(false)
      onRefresh?.()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create client.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title="Clients"
      subtitle="Same records as the Clients page — click a row to inspect on the map."
      icon={Store}
      iconAccentClass={LOGISTICS_MODULES.client.accentDark}
      onAdd={() => {
        setForm({
          clientName: '',
          storeName: '',
          phone: '',
          qrCode: '',
          city: '',
          gpsLatitude: '',
          gpsLongitude: '',
        })
        setFormError('')
        setIsCreateOpen(true)
      }}
      addLabel="Add Client"
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay title="Add Client" onClose={() => setIsCreateOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Client name *</label>
                <input
                  className={railInputClass}
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Store name</label>
                <input
                  className={railInputClass}
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">QR code *</label>
                <input
                  className={railInputClass}
                  value={form.qrCode}
                  onChange={(e) => setForm({ ...form, qrCode: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Phone</label>
                <input
                  className={railInputClass}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">City</label>
                <input
                  className={railInputClass}
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Lat"
                  className={railInputClass}
                  value={form.gpsLatitude}
                  onChange={(e) => setForm({ ...form, gpsLatitude: e.target.value })}
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Lng"
                  className={railInputClass}
                  value={form.gpsLongitude}
                  onChange={(e) => setForm({ ...form, gpsLongitude: e.target.value })}
                />
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <RailFormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel="Create Client"
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <MapRailLoading />
      ) : (
        <MapRailTable columns={['Name', 'City', 'Status']} isEmpty={filteredClients.length === 0}>
          {filteredClients.map((client) => (
              <MapRailRow
                key={client.id}
                onClick={() =>
                  onSelectItem?.({
                    type: 'client',
                    id: client.id,
                    name: client.store_name || client.client_name || client.place_name,
                  })
                }
              >
                <MapRailCell className="font-medium text-zinc-100">
                  {client.store_name || client.client_name || client.place_name || '—'}
                </MapRailCell>
                <MapRailCell>{client.city || '—'}</MapRailCell>
                <MapRailCell>
                  <EntityStatusBadge isActive={client.is_active !== false} compact />
                </MapRailCell>
              </MapRailRow>
          ))}
        </MapRailTable>
      )}
    </MapRailShell>
  )
}

function VehiclesMapRail({ vehicles, depots, isLoading, onRefresh, searchQuery = '' }) {
  const filteredVehicles = filterVehiclesForSearch(vehicles, searchQuery)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ plate_number: '', model: '', depot_id: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.plate_number.trim() || !form.model.trim() || !form.depot_id) {
      setFormError('Plate, model, and depot are required.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/logistics/vehicles', {
        plate_number: form.plate_number.trim(),
        model: form.model.trim(),
        depot_id: form.depot_id,
      })
      setIsCreateOpen(false)
      onRefresh?.()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create vehicle.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title="Vehicles"
      subtitle="Fleet vehicles assigned to depots — click a row to inspect on the map."
      icon={Truck}
      onAdd={() => {
        setForm({
          plate_number: '',
          model: '',
          depot_id: depots[0]?.id || '',
        })
        setFormError('')
        setIsCreateOpen(true)
      }}
      addLabel="Add Vehicle"
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay title="Add Vehicle" onClose={() => setIsCreateOpen(false)}>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Plate *</label>
                <input
                  className={railInputClass}
                  value={form.plate_number}
                  onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Model *</label>
                <input
                  className={railInputClass}
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Depot *</label>
                <select
                  className={railInputClass}
                  value={form.depot_id}
                  onChange={(e) => setForm({ ...form, depot_id: e.target.value })}
                >
                  <option value="">Select depot</option>
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.depot_name}
                    </option>
                  ))}
                </select>
              </div>
              {formError && <p className="text-xs text-red-400">{formError}</p>}
              <RailFormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel="Create Vehicle"
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <MapRailLoading />
      ) : (
        <MapRailTable columns={['Plate', 'Model', 'Depot', 'Status']} isEmpty={filteredVehicles.length === 0}>
          {filteredVehicles.map((v) => (
            <MapRailRow
              key={v.id}
              onClick={() =>
                onSelectItem?.({
                  type: 'vehicle',
                  id: v.id,
                  name: v.plate_number,
                })
              }
            >
              <MapRailCell className="font-medium text-zinc-100">{v.plate_number}</MapRailCell>
              <MapRailCell>{v.model || '—'}</MapRailCell>
              <MapRailCell>{v.depot?.depot_name || '—'}</MapRailCell>
              <MapRailCell>{v.is_active === false ? 'Inactive' : 'Active'}</MapRailCell>
            </MapRailRow>
          ))}
        </MapRailTable>
      )}
    </MapRailShell>
  )
}

export function MapLayerRailRouter({
  filter,
  isLoading,
  onRefresh,
  onSelectItem,
  onStartRegionCreate,
  searchQuery = '',
  regions,
  sectors,
  depots,
  industries,
  clients,
  vehicles,
}) {
  if (filter === MAP_FILTER_ALL) {
    return <MapHomeSidePanel />
  }

  const shared = { isLoading, onRefresh, onSelectItem, searchQuery }

  switch (filter) {
    case 'regions':
      return <RegionsMapRail regions={regions} {...shared} onStartRegionCreate={onStartRegionCreate} />
    case 'industries':
      return <IndustriesMapRail industries={industries} {...shared} />
    case 'depots':
      return <DepotsMapRail depots={depots} {...shared} />
    case 'sectors':
      return <SectorsMapRail sectors={sectors} regions={regions} {...shared} />
    case 'clients':
      return <ClientsMapRail clients={clients} {...shared} />
    case 'vehicles':
      return <VehiclesMapRail vehicles={vehicles} depots={depots} {...shared} />
    default:
      return <MapHomeSidePanel />
  }
}
