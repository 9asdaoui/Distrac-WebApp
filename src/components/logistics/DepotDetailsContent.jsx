import React, { useEffect, useState } from 'react'
import apiInstance from '../../api/axiosInstance'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Banknote,
  Box,
  Package,
  PackageOpen,
  Users,
  Route,
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

const DEPOT_MODULE = LOGISTICS_MODULES.depot

const TABS = [
  { id: 'stock', label: 'Stock' },
  { id: 'livreurs', label: 'Assigned Livreurs' },
  { id: 'missions', label: 'Missions' },
  { id: 'vendor_loads', label: 'Vendor Loads' },
]

function VendorLoadRequestsPanel({ compact = false }) {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/depot/vendor-load-requests', { params: { status: 'PENDING_DEPOT' } })
      setRequests(res.data?.data?.requests || [])
    } catch {
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleReview = async (requestId, action) => {
    try {
      await apiInstance.patch(`/depot/vendor-load-requests/${requestId}/${action}`)
      await load()
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
  }

  if (requests.length === 0) {
    return <p className="text-sm text-zinc-500">No pending vendor load requests.</p>
  }

  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-gray-50 dark:bg-zinc-800/50">
          <tr>
            <th className={`${cellPad} font-medium text-zinc-600`}>Vendor</th>
            <th className={`${cellPad} font-medium text-zinc-600`}>Date</th>
            <th className={`${cellPad} font-medium text-zinc-600`}>Value</th>
            <th className={`${cellPad} font-medium text-zinc-600`}>Weight (kg)</th>
            <th className={`${cellPad} font-medium text-zinc-600`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className="border-t border-gray-200 dark:border-zinc-800">
              <td className={cellPad}>{request.vendor?.full_name || '—'}</td>
              <td className={cellPad}>{request.mission_date || '—'}</td>
              <td className={cellPad}>{Number(request.total_value || 0).toLocaleString()} MAD</td>
              <td className={cellPad}>{Number(request.total_weight_kg || 0).toLocaleString()}</td>
              <td className={cellPad}>
                <div className="flex gap-2">
                  <button type="button" onClick={() => handleReview(request.id, 'approve')} className="rounded-lg border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700">Approve</button>
                  <button type="button" onClick={() => handleReview(request.id, 'reject')} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-700">Reject</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatDa(value) {
  return `${Number(value || 0).toLocaleString()} DA`
}

function formatVolume(value) {
  const n = Number(value || 0)
  return n % 1 === 0 ? `${n.toLocaleString()} L` : `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })} L`
}

function DepotDetailsSkeleton({ compact = false }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

function CapacityCard({ icon: Icon, label, used, total, usedPercentage, formatValue, compact = false }) {
  const pct = Math.min(Math.max(usedPercentage || 0, 0), 100)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`font-medium text-zinc-500 dark:text-zinc-400 ${compact ? 'text-xs' : 'text-sm'}`}>
            {label}
          </p>
          <p className={`mt-1 font-semibold text-zinc-900 dark:text-zinc-100 ${compact ? 'text-base' : 'text-lg'}`}>
            {formatValue(used)}
            <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500"> / {formatValue(total)}</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-zinc-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-zinc-600 to-zinc-800 dark:from-zinc-400 dark:to-zinc-200"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">{pct}% utilized</p>
        </div>
      </div>
    </div>
  )
}

function ToneStatusBadge({ children, tone = 'default' }) {
  const toneClass = {
    default: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  }[tone] || 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  )
}

const MISSION_TYPE_LABELS = {
  INDUSTRY_PICKUP: 'Industry Pickup',
  DELIVERY_ROUTE: 'Delivery Route',
}

function StockTable({ stock, compact = false }) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'
  const headPad = compact ? 'px-3 py-2' : 'px-6 py-3'

  if (!stock?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-zinc-900/50">
        <PackageOpen className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No stock in this depot</p>
        <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Products appear once inventory is assigned.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Product</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Qty</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Min</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Value</th>
            </tr>
          </thead>
          <tbody>
            {stock.map((row) => {
              const product = row.product || {}
              const quantity = Number(row.quantity || 0)
              const minQty = Number(row.min_quantity || 0)
              const unitPrice = Number(product.base_price || 0)
              const totalValue = quantity * unitPrice
              const isLow = quantity <= minQty

              return (
                <tr key={row.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                  <td className={cellPad}>
                    <p className="font-medium text-zinc-900 dark:text-zinc-100">{product.name || '—'}</p>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{product.sku || '—'}</p>
                  </td>
                  <td className={cellPad}>
                    {isLow ? (
                      <span className="inline-flex rounded-md bg-red-50 px-2 py-0.5 text-sm font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                        {quantity.toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-zinc-900 dark:text-zinc-100">{quantity.toLocaleString()}</span>
                    )}
                  </td>
                  <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>{minQty.toLocaleString()}</td>
                  <td className={`${cellPad} font-medium text-zinc-900 dark:text-zinc-100`}>{formatDa(totalValue)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function LivreursTable({ livreurs, compact = false }) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'
  const headPad = compact ? 'px-3 py-2' : 'px-6 py-3'

  if (!livreurs?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-zinc-900/50">
        <Users className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No livreurs assigned</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Livreur</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Contact</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Vehicle</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {livreurs.map((livreur) => (
              <tr key={livreur.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                <td className={`${cellPad} font-medium text-zinc-900 dark:text-zinc-100`}>{livreur.full_name || '—'}</td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>
                  <p>{livreur.email || '—'}</p>
                  {livreur.phone && <p className="mt-0.5 text-xs">{livreur.phone}</p>}
                </td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>
                  {livreur.vehicle
                    ? `${livreur.vehicle.plate_number || '—'}${livreur.vehicle.model ? ` · ${livreur.vehicle.model}` : ''}`
                    : '—'}
                </td>
                <td className={cellPad}>
                  <ToneStatusBadge tone={livreur.status === 'active' ? 'success' : 'default'}>
                    {livreur.status || 'unknown'}
                  </ToneStatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MissionsTable({ missions, compact = false }) {
  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'
  const headPad = compact ? 'px-3 py-2' : 'px-6 py-3'

  if (!missions?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-zinc-900/50">
        <Route className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No missions for this depot</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Type</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Livreur</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Date</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Stops</th>
              <th className={`${headPad} font-medium text-zinc-600 dark:text-zinc-300`}>Status</th>
            </tr>
          </thead>
          <tbody>
            {missions.map((mission) => (
              <tr key={mission.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                <td className={`${cellPad} font-medium text-zinc-900 dark:text-zinc-100`}>
                  {MISSION_TYPE_LABELS[mission.mission_type] || mission.mission_type || '—'}
                </td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>{mission.livreur?.full_name || '—'}</td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>{mission.date || '—'}</td>
                <td className={`${cellPad} text-zinc-500 dark:text-zinc-400`}>{mission.stops_count ?? 0}</td>
                <td className={cellPad}>
                  <ToneStatusBadge
                    tone={
                      mission.status === 'COMPLETED'
                        ? 'success'
                        : mission.status === 'IN_PROGRESS'
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {mission.status || '—'}
                  </ToneStatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function DepotDetailsContent({
  depot,
  isLoading = false,
  error = '',
  layout = 'page',
  showMap = true,
  backTo = DEPOT_MODULE.listPath,
  backLabel = 'Back to Depots',
}) {
  const [activeTab, setActiveTab] = useState('stock')
  const compact = layout === 'panel'

  if (isLoading) {
    return <DepotDetailsSkeleton compact={compact} />
  }

  if (error || !depot) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/30 dark:bg-red-500/10">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'Depot not found.'}</p>
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

  const capacity = depot.capacity_usage || {}
  const stockCount = depot.stock?.length ?? 0

  return (
    <div className={compact ? 'space-y-4' : 'space-y-8'}>
      {layout === 'page' && (
        <header className="space-y-4">
          <EntityBreadcrumb moduleKey="depot" entityName={depot.depot_name} mode="page" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <EntityIconBadge moduleKey="depot" size="lg" />
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                    {depot.depot_name}
                  </h1>
                  {depot.is_central && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      Central
                    </span>
                  )}
                  <EntityStatusBadge isActive={depot.is_active} />
                </div>
                {depot.address && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{depot.address}</p>
                )}
              </div>
            </div>
            <EntityConnectedActions moduleKey="depot" entityId={depot.id} layout="page" />
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
        <div className="space-y-2">
          {depot.is_central && (
            <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              Central Depot
            </span>
          )}
          <EntityGpsStrip moduleKey="depot" record={depot} layout="panel" extra={depot.address || 'No address'} />
        </div>
      )}

      <div className={`grid gap-3 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <MapPin className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Location</p>
              <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{depot.address || '—'}</p>
            </div>
          </div>
        </div>

        <CapacityCard
          icon={Banknote}
          label="Price Capacity"
          used={capacity.used_price_capacity}
          total={capacity.total_price_capacity}
          usedPercentage={capacity.price_used_percentage}
          formatValue={formatDa}
          compact={compact}
        />

        <CapacityCard
          icon={Box}
          label="Volume Capacity"
          used={capacity.used_volume_capacity}
          total={capacity.total_volume_capacity}
          usedPercentage={capacity.volume_used_percentage}
          formatValue={formatVolume}
          compact={compact}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
              <Package className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Unique Products</p>
              <p className="mt-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {stockCount.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">SKUs in stock</p>
            </div>
          </div>
        </div>
      </div>

      {showMap && (
        <section>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Location Map</h2>
            {depot.id && <EntityMapLink moduleKey="depot" entityId={depot.id} className="text-blue-600 dark:text-blue-400" />}
          </div>
          {hasGpsCoordinates(depot.gps_latitude, depot.gps_longitude) ? (
            <LocationMap
              lat={depot.gps_latitude}
              lng={depot.gps_longitude}
              name={depot.depot_name}
              className="h-80"
            />
          ) : (
            <LocationMapEmpty />
          )}
        </section>
      )}

      <div>
        <nav className={`flex gap-4 border-b border-gray-200 dark:border-zinc-800 ${compact ? '' : 'gap-8'}`}>
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
          {activeTab === 'stock' && <StockTable stock={depot.stock} compact={compact} />}
          {activeTab === 'livreurs' && <LivreursTable livreurs={depot.livreurs} compact={compact} />}
          {activeTab === 'missions' && <MissionsTable missions={depot.missions} compact={compact} />}
          {activeTab === 'vendor_loads' && <VendorLoadRequestsPanel compact={compact} />}
        </div>
      </div>
    </div>
  )
}
