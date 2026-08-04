import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Warehouse,
  Globe2,
  User,
  Users,
  Building2,
  Phone,
  Pencil,
} from 'lucide-react'
import { SectorBoundaryPreview } from '../SectorBoundaryPreview'
import {
  LOGISTICS_MODULES,
  EntityBreadcrumb,
  EntityConnectedActions,
  EntityIconBadge,
  EntityMapLink,
  EntityStatusBadge,
} from './logisticsModuleUi'

const SECTOR_MODULE = LOGISTICS_MODULES.sector

const TABS = [
  { id: 'clients', label: 'Clients' },
  { id: 'staff', label: 'Assigned Staff' },
]

export function SectorStatusBadge({ isActive }) {
  return isActive ? (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
      Active
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
      Inactive
    </span>
  )
}

function SectorDetailsSkeleton({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-8'}>
      <div className="h-8 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
      <div className="h-48 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

function SidebarRow({ icon: Icon, label, children, compact = false }) {
  return (
    <div className={`flex gap-3 border-b border-gray-100 py-3 last:border-0 dark:border-zinc-800 ${compact ? 'py-2.5' : 'py-4'}`}>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
        <Icon className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{label}</p>
        <div className="mt-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">{children}</div>
      </div>
    </div>
  )
}

function EmptyTab({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-cc-surface/40">
      <Icon className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      <p className="mt-1 max-w-sm text-center text-xs text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
  )
}

function ClientsTable({ clients, compact = false }) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'
  const headPad = compact ? 'px-3 py-2' : 'px-6 py-3'

  if (!clients?.length) {
    return (
      <EmptyTab
        icon={Building2}
        title="No clients in this sector"
        description="Clients registered to this sector will appear here."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-cc-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Client</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Phone</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Address</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>GPS</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const hasGps =
                client.gps_latitude != null &&
                client.gps_longitude != null &&
                Number.isFinite(Number(client.gps_latitude)) &&
                Number.isFinite(Number(client.gps_longitude))

              return (
                <tr key={client.id} className="border-b border-gray-100 last:border-0 dark:border-zinc-800">
                  <td className={cellPad}>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{client.client_name}</p>
                    {client.place_name && (
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{client.place_name}</p>
                    )}
                  </td>
                  <td className={`${cellPad} text-zinc-600 dark:text-zinc-300`}>{client.phone || '—'}</td>
                  <td className={`${cellPad} text-zinc-600 dark:text-zinc-300`}>
                    <p>{client.client_address || '—'}</p>
                    {client.city && <p className="mt-0.5 text-xs text-zinc-500">{client.city}</p>}
                  </td>
                  <td className={cellPad}>
                    {hasGps ? (
                      <span className="inline-flex rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                        On map
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StaffTable({ staff, compact = false }) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'
  const headPad = compact ? 'px-3 py-2' : 'px-6 py-3'

  if (!staff?.length) {
    return (
      <EmptyTab
        icon={Users}
        title="No staff assigned"
        description="Assign vendors or supervisors via User Management."
      />
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-cc-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Name</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Role</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Contact</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-gray-100 last:border-0 dark:border-zinc-800">
                <td className={`${cellPad} font-medium text-zinc-900 dark:text-zinc-100`}>{member.full_name || '—'}</td>
                <td className={`${cellPad} text-zinc-600 dark:text-zinc-300`}>{member.role || '—'}</td>
                <td className={`${cellPad} text-zinc-600 dark:text-zinc-300`}>
                  <p>{member.email || '—'}</p>
                  {member.phone && <p className="mt-0.5 text-xs text-zinc-500">{member.phone}</p>}
                </td>
                <td className={`${cellPad} capitalize text-zinc-500 dark:text-zinc-400`}>{member.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function AboutSectorCard({ sector, clients, staff, compact = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-cc-surface">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">About this sector</h2>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Operational context for this coverage area.</p>

      <div className="mt-2">
        <SidebarRow icon={MapPin} label="Status" compact={compact}>
          <SectorStatusBadge isActive={sector.is_active !== false} />
        </SidebarRow>
        <SidebarRow icon={Globe2} label="Region" compact={compact}>
          {sector.regions?.region_name ? (
            <Link to="/regions" className="text-blue-600 hover:underline dark:text-blue-400">
              {sector.regions.region_name}
            </Link>
          ) : (
            '—'
          )}
        </SidebarRow>
        <SidebarRow icon={Warehouse} label="Fulfillment depot" compact={compact}>
          {sector.depots?.depot_name ? (
            <Link to={`/depots/${sector.depot_id}`} className="text-blue-600 hover:underline dark:text-blue-400">
              {sector.depots.depot_name}
            </Link>
          ) : (
            '—'
          )}
        </SidebarRow>
        <SidebarRow icon={MapPin} label="Delivery mode" compact={compact}>
          {sector.fulfillment_mode === 'VENDOR' ? 'Vendor-exclusive' : 'Livreur'}
        </SidebarRow>
        <SidebarRow icon={User} label="Default owner" compact={compact}>
          {sector.profiles?.full_name || '—'}
        </SidebarRow>
        <SidebarRow icon={Users} label="Field staff" compact={compact}>
          <span>{staff.length} assigned</span>
        </SidebarRow>
        <SidebarRow icon={Phone} label="Clients registered" compact={compact}>
          <span>{clients.length} in this sector</span>
        </SidebarRow>
      </div>

      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Administrative</p>
        <dl className="mt-2 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex justify-between gap-4">
            <dt>Sector ID</dt>
            <dd className="max-w-[140px] truncate font-mono text-zinc-600 dark:text-zinc-300" title={sector.id}>
              {sector.id}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Created</dt>
            <dd className="text-right text-zinc-600 dark:text-zinc-300">{formatDate(sector.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Updated</dt>
            <dd className="text-right text-zinc-600 dark:text-zinc-300">{formatDate(sector.updated_at)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

export function SectorDetailsContent({
  sector,
  isLoading = false,
  error = '',
  layout = 'page',
  showMap = true,
  onEdit,
  backTo = SECTOR_MODULE.listPath,
  backLabel = 'Back to Sectors',
}) {
  const [activeTab, setActiveTab] = useState('clients')
  const compact = layout === 'panel'

  if (isLoading) {
    return <SectorDetailsSkeleton compact={compact} />
  }

  if (error || !sector) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'Sector not found.'}</p>
        {layout === 'page' && (
          <Link
            to={backTo}
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}
      </div>
    )
  }

  const clients = sector.clients || []
  const staff = sector.staff || []
  const stats = sector.stats || {}

  return (
    <div className={compact ? 'space-y-4' : 'space-y-8'}>
      {layout === 'page' && (
        <header className="space-y-4">
          <EntityBreadcrumb moduleKey="sector" entityName={sector.sector_name} mode="page" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <EntityIconBadge moduleKey="sector" size="lg" />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {sector.sector_name}
                  </h1>
                  <EntityStatusBadge isActive={sector.is_active !== false} />
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  {stats.client_count ?? clients.length} client
                  {(stats.client_count ?? clients.length) === 1 ? '' : 's'}
                  {' · '}
                  {stats.staff_count ?? staff.length} staff
                  {sector.regions?.region_name ? ` · ${sector.regions.region_name}` : ''}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <EntityConnectedActions moduleKey="sector" entityId={sector.id} layout="page" />
              {onEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>
          </div>
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </header>
      )}

      {layout === 'panel' && (
        <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <EntityStatusBadge isActive={sector.is_active !== false} compact />
            <span className="text-xs text-zinc-500">
              {stats.client_count ?? clients.length} clients · {stats.staff_count ?? staff.length} staff
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            {sector.regions?.region_name || 'No region'}
            {sector.depots?.depot_name ? ` · ${sector.depots.depot_name}` : ''}
          </p>
        </div>
      )}

      {layout === 'page' ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {showMap && (
              <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-cc-surface">
                <div className="border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      <MapPin className="h-4 w-4 text-zinc-500" />
                      Coverage map
                    </h2>
                    {sector.id && (
                      <EntityMapLink moduleKey="sector" entityId={sector.id} className="text-amber-600 dark:text-amber-400" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Sector boundary and client locations with GPS coordinates.
                  </p>
                </div>
                <div className="p-4">
                  <SectorBoundaryPreview
                    key={`preview-${sector.id}-${sector.updated_at || ''}`}
                    boundary={sector.boundary}
                    clients={clients}
                    mapClassName="h-[400px]"
                  />
                </div>
              </section>
            )}

            <SectorTabsSection
              activeTab={activeTab}
              onTabChange={setActiveTab}
              clients={clients}
              staff={staff}
              compact={false}
            />
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-8">
              <AboutSectorCard sector={sector} clients={clients} staff={staff} />
            </div>
          </aside>
        </div>
      ) : (
        <>
          <AboutSectorCard sector={sector} clients={clients} staff={staff} compact />
          <SectorTabsSection
            activeTab={activeTab}
            onTabChange={setActiveTab}
            clients={clients}
            staff={staff}
            compact
          />
        </>
      )}
    </div>
  )
}

function SectorTabsSection({ activeTab, onTabChange, clients, staff, compact }) {
  return (
    <section>
      <nav className={`flex gap-4 border-b border-gray-200 dark:border-zinc-800 ${compact ? '' : 'gap-8'}`}>
        {TABS.map((tab) => {
          const count = tab.id === 'clients' ? clients.length : staff.length
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-zinc-400">({count})</span>
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          )
        })}
      </nav>

      <div className={compact ? 'mt-4' : 'mt-6'}>
        {activeTab === 'clients' ? (
          <ClientsTable clients={clients} compact={compact} />
        ) : (
          <StaffTable staff={staff} compact={compact} />
        )}
      </div>
    </section>
  )
}
