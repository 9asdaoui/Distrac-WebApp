import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Factory,
  Mail,
  MapPin,
  Package,
  Phone,
  Shield,
  Truck,
  Users,
  Warehouse,
} from 'lucide-react'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'

const ROLE_BADGE_CLASS =
  'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'

const STATUS_ACTIVE_CLASS =
  'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'

const STATUS_INACTIVE_CLASS =
  'inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

const TEMPLATE_LABELS = {
  field_ops: 'Field operations (Livreur)',
  field_sales: 'Field sales (Vendor / Prevendeur)',
  depot_ops: 'Depot operations',
  management: 'Management & supervision',
  generic: 'General profile',
}

const assignmentIcons = {
  SECTOR: MapPin,
  DEPOT: Warehouse,
  INDUSTRY: Factory,
}

const assignmentPaths = {
  SECTOR: (id) => `/sectors/${id}`,
  DEPOT: (id) => `/depots/${id}`,
  INDUSTRY: (id) => `/industries/${id}`,
}

function displayRoleName(name = '') {
  return String(name)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function avatarInitials(name = '') {
  const parts = String(name).trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function formatDate(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function PanelCard({ title, icon: Icon, children }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3 dark:border-zinc-800">
        {Icon && <Icon className="h-4 w-4 text-zinc-500" />}
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

function EmptyPanel({ message }) {
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
}

function VehiclePanel({ data }) {
  if (!data?.current && !data?.lastCheckin) {
    return <EmptyPanel message="No vehicle assigned and no recent pointage." />
  }

  return (
    <div className="space-y-4">
      {data.current && (
        <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Current vehicle</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {data.current.plate_number}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {[data.current.model, data.current.depot_name].filter(Boolean).join(' · ') || '—'}
          </p>
        </div>
      )}
      {data.lastCheckin && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Last pointage: {formatDate(data.lastCheckin.checkin_at)}
          {data.lastCheckin.plate_number ? ` · ${data.lastCheckin.plate_number}` : ''}
        </p>
      )}
    </div>
  )
}

function MissionsPanel({ data }) {
  if (!data?.items?.length) {
    return <EmptyPanel message="No missions scheduled for today." />
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-zinc-500">
          <tr>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Depot</th>
            <th className="pb-2 pr-4 font-medium">Status</th>
            <th className="pb-2 font-medium">Stops</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((row) => (
            <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="py-2.5 pr-4 font-medium text-zinc-900 dark:text-zinc-100">{row.mission_type}</td>
              <td className="py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">{row.depot_name || '—'}</td>
              <td className="py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">{row.status}</td>
              <td className="py-2.5 text-zinc-600 dark:text-zinc-400">
                {row.stops_completed}/{row.stops_total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ClientsPanel({ data }) {
  if (!data?.items?.length) {
    return <EmptyPanel message="No clients registered by this user yet." />
  }

  return (
    <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {data.items.map((client) => (
        <li key={client.id}>
          <Link
            to={`/clients/${client.id}`}
            className="flex items-center justify-between gap-3 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">{client.client_name}</p>
              <p className="text-xs text-zinc-500">
                {[client.city, client.sector_name].filter(Boolean).join(' · ') || client.phone || '—'}
              </p>
            </div>
            <span className="text-xs text-zinc-400">{formatDate(client.created_at)}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

function SimpleTablePanel({ rows, columns }) {
  if (!rows?.length) return <EmptyPanel message="No records to show." />

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-zinc-500">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="pb-2 pr-4 font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-zinc-200 dark:border-zinc-800">
              {columns.map((col) => (
                <td key={col.key} className="py-2.5 pr-4 text-zinc-600 dark:text-zinc-400">
                  {col.render ? col.render(row) : row[col.key] || '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EntityLinksPanel({ data }) {
  if (!data?.items?.length) return <EmptyPanel message="No linked entities." />

  const pathFn = assignmentPaths[data.entityType]

  return (
    <ul className="space-y-2">
      {data.items.map((item) => (
        <li key={item.id}>
          <Link
            to={pathFn ? pathFn(item.id) : '#'}
            className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5 transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800/50"
          >
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{item.label}</span>
            {item.sublabel && <span className="text-xs text-zinc-500">{item.sublabel}</span>}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function RolePanel({ panel }) {
  switch (panel.type) {
    case 'vehicle':
      return <VehiclePanel data={panel.data} />
    case 'missions':
      return <MissionsPanel data={panel.data} />
    case 'clients':
      return <ClientsPanel data={panel.data} />
    case 'stock_requests':
      return (
        <SimpleTablePanel
          rows={panel.data?.items || []}
          columns={[
            { key: 'status', label: 'Status' },
            { key: 'depot_name', label: 'Depot' },
            { key: 'industry_name', label: 'Industry' },
            {
              key: 'created_at',
              label: 'Created',
              render: (row) => formatDate(row.created_at),
            },
          ]}
        />
      )
    case 'fulfillment_orders':
      return (
        <SimpleTablePanel
          rows={panel.data?.items || []}
          columns={[
            { key: 'status', label: 'Status' },
            { key: 'depot_name', label: 'Source depot' },
            {
              key: 'created_at',
              label: 'Created',
              render: (row) => formatDate(row.created_at),
            },
          ]}
        />
      )
    case 'entity_links':
      return <EntityLinksPanel data={panel.data} />
    default:
      return <EmptyPanel message="Unsupported panel type." />
  }
}

function panelIcon(type) {
  if (type === 'vehicle') return Truck
  if (type === 'missions') return MapPin
  if (type === 'clients') return Users
  if (type === 'stock_requests') return Package
  if (type === 'fulfillment_orders') return Building2
  return Shield
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        ))}
      </div>
    </div>
  )
}

export function UserProfilePage() {
  const { id } = useParams()
  const controllerRef = useRef(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return undefined

    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await apiInstance.get(`/users/${id}`, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setProfile(res.data?.data || null)
        }
      } catch (err) {
        if (err.name === 'CanceledError' || controller.signal.aborted) return
        setProfile(null)
        setError(err?.response?.data?.message || 'Failed to load user profile.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controllerRef.current?.abort()
  }, [id])

  const user = profile?.user
  const assignments = profile?.assignments || []
  const permissions = profile?.permissions || []
  const roleInsights = profile?.roleInsights || {}
  const isActive = String(user?.status || '').toLowerCase() === 'active'

  const assignmentsByType = {
    SECTOR: assignments.filter((row) => row.entity_type === 'SECTOR'),
    DEPOT: assignments.filter((row) => row.entity_type === 'DEPOT'),
    INDUSTRY: assignments.filter((row) => row.entity_type === 'INDUSTRY'),
  }

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
        {isLoading ? (
          <DetailsSkeleton />
        ) : error || !user ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'User not found.'}</p>
            <Link
              to="/users"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Users
            </Link>
          </div>
        ) : (
          <>
            <header className="space-y-4">
              <Link
                to="/users"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Users
              </Link>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-zinc-100 text-xl font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                    {avatarInitials(user.full_name)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                      {user.full_name || 'Unnamed user'}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={ROLE_BADGE_CLASS}>{displayRoleName(user.role_name)}</span>
                      <span className={isActive ? STATUS_ACTIVE_CLASS : STATUS_INACTIVE_CLASS}>
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                      {roleInsights.template && (
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                          {TEMPLATE_LABELS[roleInsights.template] || roleInsights.template}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {user.email && (
                        <span className="inline-flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5" />
                          {user.email}
                        </span>
                      )}
                      {user.phone && (
                        <span className="inline-flex items-center gap-2">
                          <Phone className="h-3.5 w-3.5" />
                          {user.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-zinc-500">
                  Member since {formatDate(user.created_at)}
                </p>
              </div>
            </header>

            {roleInsights.stats?.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {roleInsights.stats.map((stat) => (
                  <div
                    key={stat.key}
                    className="rounded-xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{stat.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <PanelCard title="Operational scope" icon={MapPin}>
                {assignments.length === 0 ? (
                  <EmptyPanel message="No sector, depot, or industry assignments." />
                ) : (
                  <div className="space-y-4">
                    {['SECTOR', 'DEPOT', 'INDUSTRY'].map((type) => {
                      const rows = assignmentsByType[type]
                      if (!rows.length) return null
                      const Icon = assignmentIcons[type]
                      const toPath = assignmentPaths[type]
                      return (
                        <div key={type}>
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            <Icon className="h-3.5 w-3.5" />
                            {type === 'SECTOR' ? 'Sectors' : type === 'DEPOT' ? 'Depots' : 'Industries'}
                          </p>
                          <ul className="space-y-1.5">
                            {rows.map((row) => (
                              <li key={row.id}>
                                <Link
                                  to={toPath(row.entity_id)}
                                  className="block rounded-lg px-2 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800/60"
                                >
                                  {row.entity_name || row.entity_id}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                )}
              </PanelCard>

              <PanelCard title="Role permissions" icon={Shield}>
                {permissions.length === 0 ? (
                  <EmptyPanel message="No permissions mapped to this role." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((name) => (
                      <span
                        key={name}
                        className="inline-flex rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}
              </PanelCard>
            </div>

            {(roleInsights.panels || []).map((panel) => (
              <PanelCard key={panel.id} title={panel.title} icon={panelIcon(panel.type)}>
                <RolePanel panel={panel} />
              </PanelCard>
            ))}
          </>
        )}
      </div>
    </AnimatedPage>
  )
}
