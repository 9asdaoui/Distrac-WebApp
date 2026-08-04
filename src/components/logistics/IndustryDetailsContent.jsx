import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  PackageCheck,
  Users,
  PackageOpen,
} from 'lucide-react'
import { LocationMap, hasGpsCoordinates } from '../LocationMap'
import { LocationMapEmpty } from '../LocationMapEmpty'
import {
  LOGISTICS_MODULES,
  EntityBreadcrumb,
  EntityConnectedActions,
  EntityGpsStrip,
  EntityIconBadge,
  EntityMapLink,
  EntityStatusBadge,
} from './logisticsModuleUi'

const INDUSTRY_MODULE = LOGISTICS_MODULES.industry

const TABS = [
  { id: 'orders', label: 'Fulfillment Orders' },
  { id: 'staff', label: 'Assigned Staff' },
]

const ORDER_STATUS_META = {
  PENDING:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  APPROVED:
    'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200',
  READY:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  SHIPPED:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  FULFILLED:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  CANCELLED:
    'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-400',
}

function OrderStatusBadge({ status }) {
  const cls =
    ORDER_STATUS_META[status] ||
    'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-300'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status || '—'}
    </span>
  )
}

export function IndustryTypeBadge({ isInternal, compact = false }) {
  const sizeClass = compact
    ? 'px-2 py-0.5 text-[10px]'
    : 'px-2.5 py-0.5 text-xs'
  return isInternal ? (
    <span
      className={`inline-flex items-center rounded-full border border-violet-200 bg-violet-50 font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200 ${sizeClass}`}
    >
      Internal
    </span>
  ) : (
    <span
      className={`inline-flex items-center rounded-full border border-sky-200 bg-sky-50 font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200 ${sizeClass}`}
    >
      External
    </span>
  )
}

function IndustryDetailsSkeleton({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {!compact && <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />}
      <div className="grid grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-40 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-cc-surface/60">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">{value}</p>
      {sublabel && <p className="mt-0.5 text-[10px] text-zinc-400">{sublabel}</p>}
    </div>
  )
}

function FulfillmentOrdersTable({ orders, compact = false }) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'
  const headPad = compact ? 'px-3 py-2' : 'px-6 py-3'

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-cc-surface/50">
        <PackageOpen className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No fulfillment orders</p>
        <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Orders appear when stock requests are approved for this industry.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Order ID</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Target Depot</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Date</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                <td className={`${cellPad} font-mono text-xs text-zinc-700 dark:text-zinc-300`}>
                  {order.id ? `${order.id.slice(0, 8)}…` : '—'}
                </td>
                <td className={`${cellPad} font-medium text-zinc-900 dark:text-zinc-100`}>
                  {order.depots?.depot_name || '—'}
                </td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                </td>
                <td className={cellPad}>
                  <OrderStatusBadge status={order.status} />
                </td>
              </tr>
            ))}
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-cc-surface/50">
        <Users className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No staff assigned</p>
        <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Assign users to this industry via user management.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
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
              <tr key={member.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                <td className={`${cellPad} font-medium text-zinc-900 dark:text-zinc-100`}>
                  {member.full_name || '—'}
                </td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>{member.role || '—'}</td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>
                  <p>{member.email || '—'}</p>
                  {member.phone && <p className="mt-0.5 text-xs">{member.phone}</p>}
                </td>
                <td className={`${cellPad} capitalize text-zinc-500 dark:text-zinc-400`}>
                  {member.status || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Shared industry detail body — used on the Command Center detail rail.
 * @param {'page' | 'panel'} layout — full page vs compact right rail
 * @param {boolean} showMap — location map section (off for Global Map panel)
 */
export function IndustryDetailsContent({
  industry,
  isLoading = false,
  error = '',
  layout = 'page',
  showMap = true,
  backTo = INDUSTRY_MODULE.listPath,
  backLabel = 'Back to Industries',
}) {
  const [activeTab, setActiveTab] = useState('orders')
  const compact = layout === 'panel'

  if (isLoading) {
    return <IndustryDetailsSkeleton compact={compact} />
  }

  if (error || !industry) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          {error || 'Industry not found.'}
        </p>
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

  const stats = industry.workload_stats || {}

  const descriptionText = industry.description?.trim()

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {layout === 'page' && (
        <header className="space-y-4">
          <EntityBreadcrumb moduleKey="industry" entityName={industry.industry_name} mode="page" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <EntityIconBadge moduleKey="industry" size="lg" />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {industry.industry_name}
                  </h1>
                  <IndustryTypeBadge isInternal={industry.is_internal} />
                  <EntityStatusBadge isActive={industry.is_active} />
                </div>
                {descriptionText ? (
                  <p className="max-w-prose text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {descriptionText}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400 dark:text-zinc-500">No description provided.</p>
                )}
              </div>
            </div>
            <EntityConnectedActions moduleKey="industry" entityId={industry.id} layout="page" />
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

      {layout === 'panel' && <EntityGpsStrip moduleKey="industry" record={industry} layout="panel" />}

      <div className="grid grid-cols-2 gap-4">
        <KpiCard
          icon={Clock}
          label="Pending Orders"
          value={stats.pending_count?.toLocaleString() ?? '0'}
          sublabel="PENDING"
        />
        <KpiCard
          icon={PackageCheck}
          label="Completed"
          value={stats.completed_count?.toLocaleString() ?? '0'}
          sublabel="SHIPPED / FULFILLED"
        />
      </div>

      {showMap && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Location Map</h2>
            {industry.id && <EntityMapLink moduleKey="industry" entityId={industry.id} className="text-rose-600 dark:text-rose-400" />}
          </div>
          {hasGpsCoordinates(industry.gps_latitude, industry.gps_longitude) ? (
            <LocationMap
              lat={industry.gps_latitude}
              lng={industry.gps_longitude}
              name={industry.industry_name}
              className="h-80"
            />
          ) : (
            <LocationMapEmpty />
          )}
        </section>
      )}

      <div>
        <nav className={`flex gap-6 border-b border-gray-200 dark:border-zinc-800 ${compact ? 'gap-4' : 'gap-8'}`}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-zinc-900 dark:text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
              )}
            </button>
          ))}
        </nav>

        <div className={compact ? 'mt-4' : 'mt-6'}>
          {activeTab === 'orders' && (
            <FulfillmentOrdersTable orders={industry.fulfillment_orders} compact={compact} />
          )}
          {activeTab === 'staff' && <StaffTable staff={industry.staff} compact={compact} />}
        </div>
      </div>
    </div>
  )
}
