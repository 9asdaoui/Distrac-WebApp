import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Building2,
  Factory,
  Map,
  MapPin,
  Phone,
  QrCode,
  Store,
  Truck,
  User2,
  Warehouse,
  Hash,
  Box,
} from 'lucide-react'
import { SectorBoundaryDrawer, isValidSectorPolygon } from '../SectorBoundaryDrawer'
import { hasGpsCoordinates } from '../LocationMap'
import apiInstance from '../../api/axiosInstance'
import { MapHomeSidePanel } from '../dashboard/MapHomeSidePanel'
import { MAP_FILTER_ALL } from './MapLayerFilterBar'
import {
  MapRailCell,
  MapRailCreateOverlay,
  MapRailKpiLoading,
  MapRailKpiStrip,
  MapRailLoading,
  MapRailRow,
  MapRailShell,
  MapRailTable,
} from './MapRailShell'
import {
  FormError,
  FormField,
  FormFooter,
  FormGrid,
  FormInput,
  FormIntro,
  FormSection,
  FormSelect,
  FormTip,
  FormToggle,
} from './CommandCenterForm'
import {
  clientRailKpis,
  depotRailKpis,
  industryRailKpis,
  regionRailKpis,
  sectorRailKpis,
  vehicleRailKpis,
} from './mapRailKpis'
import {
  filterClientsForSearch,
  filterDepotsForSearch,
  filterIndustriesForSearch,
  filterRegionsForSearch,
  filterSectorsForSearch,
  filterVehiclesForSearch,
} from './mapLayerSearch'
import { IndustryTypeBadge } from '../logistics/IndustryDetailsContent'
import { formatIndustryLocation } from '../logistics/IndustryFormFields'
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

function RegionsMapRail({
  regions,
  sectors = [],
  isLoading,
  onSelectItem,
  searchQuery = '',
  onStartRegionCreate,
  canManageLogistics = false,
}) {
  const { t } = useTranslation()
  const filteredRegions = filterRegionsForSearch(regions, searchQuery)

  return (
    <MapRailShell
      title={t('commandCenter.rail.regions.title')}
      subtitle={t('commandCenter.rail.regions.subtitle')}
      icon={Map}
      iconAccentClass={LOGISTICS_MODULES.region.accentDark}
      onAdd={canManageLogistics ? () => onStartRegionCreate?.() : undefined}
      addLabel={t('commandCenter.rail.regions.add')}
    >
      {isLoading ? (
        <>
          <MapRailKpiLoading />
          <MapRailLoading />
        </>
      ) : (
        <>
          <MapRailKpiStrip items={regionRailKpis(filteredRegions, { sectors })} />
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
        </>
      )}
    </MapRailShell>
  )
}

function IndustriesMapRail({
  industries,
  isLoading,
  onRefresh,
  onSelectItem,
  searchQuery = '',
  canManageLogistics = false,
  onStartIndustryCreate,
}) {
  const { t } = useTranslation()
  const filteredIndustries = filterIndustriesForSearch(industries, searchQuery)

  return (
    <MapRailShell
      title={t('commandCenter.rail.industries.title')}
      subtitle={t('commandCenter.rail.industries.subtitle')}
      icon={Factory}
      iconAccentClass={LOGISTICS_MODULES.industry.accentDark}
      onAdd={canManageLogistics ? () => onStartIndustryCreate?.() : undefined}
      addLabel={t('commandCenter.rail.industries.add')}
    >
      {isLoading ? (
        <>
          <MapRailKpiLoading />
          <MapRailLoading />
        </>
      ) : (
        <>
          <MapRailKpiStrip items={industryRailKpis(filteredIndustries)} />
          <MapRailTable
          columns={[
            t('commandCenter.rail.columns.name'),
            t('commandCenter.rail.columns.type'),
            t('commandCenter.rail.columns.location'),
            t('commandCenter.rail.columns.status'),
          ]}
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
        </>
      )}
    </MapRailShell>
  )
}

function DepotsMapRail({ depots, isLoading, onRefresh, onSelectItem, searchQuery = '', canManageLogistics = false }) {
  const { t } = useTranslation()
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
      setFormError(t('commandCenter.rail.depots.nameRequired'))
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
      setFormError(err?.response?.data?.message || t('commandCenter.rail.depots.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title={t('commandCenter.rail.depots.title')}
      subtitle={t('commandCenter.rail.depots.subtitle')}
      icon={Warehouse}
      iconAccentClass={LOGISTICS_MODULES.depot.accentDark}
      onAdd={
        canManageLogistics
          ? () => {
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
            }
          : undefined
      }
      addLabel={t('commandCenter.rail.depots.add')}
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay
            title={t('commandCenter.rail.depots.add')}
            accent="blue"
            onClose={() => setIsCreateOpen(false)}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormIntro
                accent="blue"
                title={t('commandCenter.rail.depots.add')}
                description={t('commandCenter.rail.depots.subtitle')}
              />
              <FormSection title={t('commandCenter.rail.columns.location')}>
                <FormField
                  icon={Warehouse}
                  label={t('commandCenter.rail.form.name')}
                  required
                  iconAccent="text-blue-300 bg-blue-500/10 ring-blue-500/20"
                >
                  <FormInput
                    value={form.depotName}
                    onChange={(e) => setForm({ ...form, depotName: e.target.value })}
                    placeholder="e.g. Casablanca Hub"
                  />
                </FormField>
                <FormField
                  icon={MapPin}
                  label={t('commandCenter.rail.form.address')}
                  iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20"
                >
                  <FormInput
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="Street, city"
                  />
                </FormField>
                <FormGrid>
                  <FormField icon={MapPin} label={t('commandCenter.rail.form.latitude')} iconAccent="text-zinc-300 bg-zinc-800/80">
                    <FormInput
                      type="number"
                      step="any"
                      value={form.gpsLatitude}
                      onChange={(e) => setForm({ ...form, gpsLatitude: e.target.value })}
                      placeholder="33.57"
                    />
                  </FormField>
                  <FormField icon={MapPin} label={t('commandCenter.rail.form.longitude')} iconAccent="text-zinc-300 bg-zinc-800/80">
                    <FormInput
                      type="number"
                      step="any"
                      value={form.gpsLongitude}
                      onChange={(e) => setForm({ ...form, gpsLongitude: e.target.value })}
                      placeholder="-7.58"
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
              <FormTip variant="blue" title="Map pin">
                GPS coordinates place the warehouse marker on the command map immediately after save.
              </FormTip>
              <FormError>{formError}</FormError>
              <FormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel={t('commandCenter.rail.depots.create')}
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <>
          <MapRailKpiLoading />
          <MapRailLoading />
        </>
      ) : (
        <>
          <MapRailKpiStrip items={depotRailKpis(filteredDepots)} />
          <MapRailTable
            columns={[
              t('commandCenter.rail.columns.name'),
              t('commandCenter.rail.columns.location'),
              t('commandCenter.rail.columns.capacity'),
              t('commandCenter.rail.columns.status'),
            ]}
            isEmpty={filteredDepots.length === 0}
          >
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
        </>
      )}
    </MapRailShell>
  )
}

function SectorsMapRail({ sectors, regions, isLoading, onRefresh, onSelectItem, searchQuery = '', canManageLogistics = false }) {
  const { t } = useTranslation()
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
      setFormError(err?.response?.data?.message || t('commandCenter.rail.sectors.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title={t('commandCenter.rail.sectors.title')}
      subtitle={t('commandCenter.rail.sectors.subtitle')}
      icon={Building2}
      iconAccentClass={LOGISTICS_MODULES.sector.accentDark}
      onAdd={
        canManageLogistics
          ? () => {
              setForm({ sectorName: '', regionId: '', boundary: null, isActive: true })
              setFormError('')
              setMapDrawerKey((k) => k + 1)
              setIsCreateOpen(true)
            }
          : undefined
      }
      addLabel={t('commandCenter.rail.sectors.add')}
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay
            title={t('commandCenter.rail.sectors.add')}
            accent="amber"
            onClose={() => setIsCreateOpen(false)}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormIntro
                accent="amber"
                title={t('commandCenter.rail.sectors.add')}
                description="Name the sector, link a region, then draw the delivery boundary below."
              />
              <FormSection title="Sector details">
                <FormField
                  icon={Building2}
                  label={t('commandCenter.rail.form.name')}
                  required
                  iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20"
                >
                  <FormInput
                    value={form.sectorName}
                    onChange={(e) => setForm({ ...form, sectorName: e.target.value })}
                    placeholder="e.g. Maarif"
                  />
                </FormField>
                <FormField
                  icon={Map}
                  label={t('commandCenter.rail.columns.region')}
                  iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20"
                >
                  <FormSelect
                    value={form.regionId}
                    onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                  >
                    <option value="">— None —</option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.region_name}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField
                  icon={MapPin}
                  label="Boundary"
                  required
                  hint="Click corners on the mini-map to outline the sector polygon."
                  iconAccent="text-orange-300 bg-orange-500/10 ring-orange-500/20"
                >
                  <div className="overflow-hidden rounded-xl border border-zinc-800">
                    <SectorBoundaryDrawer
                      key={mapDrawerKey}
                      className="h-[240px]"
                      value={form.boundary}
                      onChange={(boundary) => setForm((p) => ({ ...p, boundary }))}
                    />
                  </div>
                </FormField>
                <FormField icon={Building2} label={t('commandCenter.rail.form.active')} iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
                  <FormToggle
                    checked={form.isActive}
                    onChange={(v) => setForm({ ...form, isActive: v })}
                    labelOn={t('commandCenter.popup.active')}
                    labelOff={t('commandCenter.popup.inactive')}
                  />
                </FormField>
              </FormSection>
              <FormError>{formError}</FormError>
              <FormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel={t('commandCenter.rail.sectors.create')}
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <>
          <MapRailKpiLoading />
          <MapRailLoading />
        </>
      ) : (
        <>
          <MapRailKpiStrip items={sectorRailKpis(filteredSectors)} />
          <MapRailTable
            columns={[
              t('commandCenter.rail.columns.name'),
              t('commandCenter.rail.columns.region'),
              t('commandCenter.rail.columns.depot'),
              t('commandCenter.rail.columns.status'),
            ]}
            isEmpty={filteredSectors.length === 0}
          >
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
        </>
      )}
    </MapRailShell>
  )
}

function ClientsMapRail({ clients, isLoading, onRefresh, onSelectItem, searchQuery = '', canManageLogistics = false }) {
  const { t } = useTranslation()
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
      setFormError(err?.response?.data?.message || t('commandCenter.rail.clients.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title={t('commandCenter.rail.clients.title')}
      subtitle={t('commandCenter.rail.clients.subtitle')}
      icon={Store}
      iconAccentClass={LOGISTICS_MODULES.client.accentDark}
      onAdd={
        canManageLogistics
          ? () => {
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
            }
          : undefined
      }
      addLabel={t('commandCenter.rail.clients.add')}
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay
            title={t('commandCenter.rail.clients.add')}
            accent="emerald"
            onClose={() => setIsCreateOpen(false)}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormIntro
                accent="emerald"
                title={t('commandCenter.rail.clients.add')}
                description={t('commandCenter.rail.clients.subtitle')}
              />
              <FormSection title="Store profile">
                <FormField icon={User2} label="Client name" required iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
                  <FormInput
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    placeholder="Legal or contact name"
                  />
                </FormField>
                <FormField icon={Store} label="Store name" iconAccent="text-zinc-300 bg-zinc-800/80 ring-zinc-700/50">
                  <FormInput
                    value={form.storeName}
                    onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                    placeholder="Displayed on map & orders"
                  />
                </FormField>
                <FormField icon={QrCode} label="QR code" required hint="Scanned at delivery and check-in." iconAccent="text-violet-300 bg-violet-500/10 ring-violet-500/20">
                  <FormInput
                    value={form.qrCode}
                    onChange={(e) => setForm({ ...form, qrCode: e.target.value })}
                    placeholder="Unique client QR"
                  />
                </FormField>
                <FormField icon={Phone} label="Phone" iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20">
                  <FormInput
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+212 6 XX XX XX XX"
                  />
                </FormField>
                <FormField icon={MapPin} label={t('commandCenter.rail.columns.location')} iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20">
                  <FormInput
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                  />
                </FormField>
              </FormSection>
              <FormSection title="GPS coordinates">
                <FormGrid>
                  <FormField icon={MapPin} label={t('commandCenter.rail.form.latitude')}>
                    <FormInput
                      type="number"
                      step="any"
                      value={form.gpsLatitude}
                      onChange={(e) => setForm({ ...form, gpsLatitude: e.target.value })}
                      placeholder="33.57"
                    />
                  </FormField>
                  <FormField icon={MapPin} label={t('commandCenter.rail.form.longitude')}>
                    <FormInput
                      type="number"
                      step="any"
                      value={form.gpsLongitude}
                      onChange={(e) => setForm({ ...form, gpsLongitude: e.target.value })}
                      placeholder="-7.58"
                    />
                  </FormField>
                </FormGrid>
              </FormSection>
              <FormError>{formError}</FormError>
              <FormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel={t('commandCenter.rail.clients.create')}
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <>
          <MapRailKpiLoading />
          <MapRailLoading />
        </>
      ) : (
        <>
          <MapRailKpiStrip items={clientRailKpis(filteredClients)} />
          <MapRailTable
            columns={[
              t('commandCenter.rail.columns.name'),
              t('commandCenter.rail.columns.location'),
              t('commandCenter.rail.columns.status'),
            ]}
            isEmpty={filteredClients.length === 0}
          >
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
        </>
      )}
    </MapRailShell>
  )
}

function VehiclesMapRail({ vehicles, depots, isLoading, onRefresh, onSelectItem, searchQuery = '', canManageLogistics = false }) {
  const { t } = useTranslation()
  const filteredVehicles = filterVehiclesForSearch(vehicles, searchQuery)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ plate_number: '', model: '', depot_id: '', tonnage: '', volume_capacity: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.plate_number.trim() || !form.model.trim() || !form.depot_id) {
      setFormError('Plate, model, and depot are required.')
      return
    }

    const tonnage = Number(form.tonnage)
    if (!Number.isFinite(tonnage) || tonnage <= 0) {
      setFormError('Tonnage is required and must be greater than zero.')
      return
    }

    const volumeCapacity = form.volume_capacity === '' ? null : Number(form.volume_capacity)
    if (volumeCapacity !== null && (!Number.isFinite(volumeCapacity) || volumeCapacity < 0)) {
      setFormError('Volume must be a valid non-negative number.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/logistics/vehicles', {
        plate_number: form.plate_number.trim(),
        model: form.model.trim(),
        depot_id: form.depot_id,
        tonnage,
        volume_capacity: volumeCapacity,
      })
      setIsCreateOpen(false)
      onRefresh?.()
    } catch (err) {
      setFormError(err?.response?.data?.message || t('commandCenter.rail.vehicles.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <MapRailShell
      title={t('commandCenter.rail.vehicles.title')}
      subtitle={t('commandCenter.rail.vehicles.subtitle')}
      icon={Truck}
      onAdd={
        canManageLogistics
          ? () => {
              setForm({
                plate_number: '',
                model: '',
                depot_id: depots[0]?.id || '',
                tonnage: '',
                volume_capacity: '',
              })
              setFormError('')
              setIsCreateOpen(true)
            }
          : undefined
      }
      addLabel={t('commandCenter.rail.vehicles.add')}
      overlay={
        isCreateOpen ? (
          <MapRailCreateOverlay
            title={t('commandCenter.rail.vehicles.add')}
            accent="blue"
            onClose={() => setIsCreateOpen(false)}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormIntro
                accent="blue"
                title={t('commandCenter.rail.vehicles.add')}
                description={t('commandCenter.rail.vehicles.subtitle')}
              />
              <FormSection title={t('commandCenter.vehicleDetails.assignment')}>
                <FormField icon={Hash} label={t('commandCenter.rail.form.plate')} required iconAccent="text-orange-300 bg-orange-500/10 ring-orange-500/20">
                  <FormInput
                    value={form.plate_number}
                    onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                    placeholder="12345-A-67"
                  />
                </FormField>
                <FormField icon={Truck} label={t('commandCenter.rail.form.model')} required iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20">
                  <FormInput
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="Van, truck…"
                  />
                </FormField>
                <FormField icon={Warehouse} label={t('commandCenter.rail.form.depot')} required iconAccent="text-blue-300 bg-blue-500/10 ring-blue-500/20">
                  <FormSelect
                    value={form.depot_id}
                    onChange={(e) => setForm({ ...form, depot_id: e.target.value })}
                  >
                    <option value="">Select depot</option>
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.depot_name}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
              </FormSection>
              <FormSection title="Capacity">
                <FormField icon={Box} label={t('commandCenter.rail.form.tonnage')} required iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20">
                  <FormInput
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.tonnage}
                    onChange={(e) => setForm({ ...form, tonnage: e.target.value })}
                    placeholder="3.5"
                  />
                </FormField>
                <FormField icon={Box} label={t('commandCenter.rail.form.volume')} iconAccent="text-violet-300 bg-violet-500/10 ring-violet-500/20">
                  <FormInput
                    type="number"
                    min="0"
                    step="1"
                    value={form.volume_capacity}
                    onChange={(e) => setForm({ ...form, volume_capacity: e.target.value })}
                    placeholder="Optional"
                  />
                </FormField>
              </FormSection>
              <FormError>{formError}</FormError>
              <FormFooter
                onCancel={() => setIsCreateOpen(false)}
                submitLabel={t('commandCenter.rail.vehicles.create')}
                isSubmitting={isSubmitting}
              />
            </form>
          </MapRailCreateOverlay>
        ) : null
      }
    >
      {isLoading ? (
        <>
          <MapRailKpiLoading />
          <MapRailLoading />
        </>
      ) : (
        <>
          <MapRailKpiStrip items={vehicleRailKpis(filteredVehicles, { depots })} />
          <MapRailTable
            columns={[
              t('commandCenter.rail.columns.plate'),
              t('commandCenter.rail.columns.model'),
              t('commandCenter.rail.columns.depot'),
              t('commandCenter.rail.columns.status'),
            ]}
            isEmpty={filteredVehicles.length === 0}
          >
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
              <MapRailCell>{v.is_active === false ? t('commandCenter.popup.inactive') : t('commandCenter.popup.active')}</MapRailCell>
            </MapRailRow>
          ))}
        </MapRailTable>
        </>
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
  onStartIndustryCreate,
  canManageLogistics = false,
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

  const shared = { isLoading, onRefresh, onSelectItem, searchQuery, canManageLogistics }

  switch (filter) {
    case 'regions':
      return (
        <RegionsMapRail
          regions={regions}
          sectors={sectors}
          {...shared}
          onStartRegionCreate={onStartRegionCreate}
        />
      )
    case 'industries':
      return (
        <IndustriesMapRail
          industries={industries}
          {...shared}
          onStartIndustryCreate={onStartIndustryCreate}
        />
      )
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
