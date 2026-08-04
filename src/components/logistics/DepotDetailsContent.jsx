import React, { useEffect, useState } from 'react'
import apiInstance from '../../api/axiosInstance'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  Banknote,
  Box,
  MapPin,
  Package,
  PackageOpen,
  Users,
  Route,
  Truck,
  Warehouse,
} from 'lucide-react'
import { LocationMap, hasGpsCoordinates } from '../LocationMap'
import { LocationMapEmpty } from '../LocationMapEmpty'
import {
  LOGISTICS_MODULES,
  EntityBreadcrumb,
  EntityConnectedActions,
  EntityMapLink,
  EntityStatusBadge,
} from './logisticsModuleUi'

const DEPOT_MODULE = LOGISTICS_MODULES.depot

const TABS = [
  { id: 'stock', label: 'Stock', shortLabel: 'Stock', icon: Package },
  { id: 'livreurs', label: 'Assigned Livreurs', shortLabel: 'Livreurs', icon: Users },
  { id: 'missions', label: 'Missions', shortLabel: 'Missions', icon: Route },
  { id: 'vendor_loads', label: 'Vendor Loads', shortLabel: 'Vendor Loads', icon: Truck },
]

function getTabCount(tabId, depot) {
  if (!depot) return null
  if (tabId === 'stock') return depot.stock?.length ?? 0
  if (tabId === 'livreurs') return depot.livreurs?.length ?? 0
  if (tabId === 'missions') return depot.missions?.length ?? 0
  return null
}

function DepotProfileHero({ depot, compact = false }) {
  return (
    <section
      className={
        compact
          ? 'relative overflow-hidden border-b border-zinc-800 bg-zinc-950'
          : 'relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-cc-surface'
      }
    >
      <div
        className={`relative overflow-hidden ${
          compact ? 'h-32' : 'h-40'
        } bg-gradient-to-br from-blue-600/50 via-indigo-700/35 to-zinc-950`}
      >
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.15) 0, transparent 45%), radial-gradient(circle at 80% 0%, rgba(59,130,246,0.35) 0, transparent 40%)',
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(9,9,11,0.85)_100%)]" />
      </div>

      <div className={`relative ${compact ? 'px-5 pb-5' : 'px-6 pb-6'}`}>
        <div className={`-mt-12 flex items-end gap-4 ${compact ? 'mb-3' : 'mb-4'}`}>
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl border-4 bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-900/30 ${
              compact
                ? 'h-[4.5rem] w-[4.5rem] border-zinc-950'
                : 'h-20 w-20 border-white dark:border-zinc-900'
            }`}
          >
            <Warehouse className={`text-white ${compact ? 'h-8 w-8' : 'h-9 w-9'}`} strokeWidth={1.75} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className={`font-semibold tracking-tight ${
                compact
                  ? 'text-xl leading-tight text-zinc-100'
                  : 'text-2xl text-zinc-900 dark:text-zinc-100'
              }`}
            >
              {depot.depot_name}
            </h2>
            {depot.is_central && (
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  compact
                    ? 'border-amber-500/40 bg-amber-500/15 text-amber-200'
                    : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'
                }`}
              >
                Central
              </span>
            )}
            <EntityStatusBadge isActive={depot.is_active} compact />
          </div>

          <p
            className={`flex items-start gap-2 leading-relaxed ${
              compact ? 'text-sm text-zinc-300' : 'text-base text-zinc-600 dark:text-zinc-300'
            }`}
          >
            <MapPin
              className={`mt-0.5 h-4 w-4 shrink-0 ${compact ? 'text-blue-400/80' : 'text-blue-500 dark:text-blue-400/80'}`}
            />
            <span>{depot.address?.trim() || 'No address provided.'}</span>
          </p>
        </div>
      </div>
    </section>
  )
}

function DepotTabNav({ activeTab, onChange, depot, compact = false }) {
  return (
    <nav
      className={`rounded-xl border p-1.5 ${
        compact
          ? 'border-zinc-800/90 bg-zinc-900/70'
          : 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-cc-surface/60'
      }`}
      aria-label="Depot sections"
    >
      <div className={`grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const count = getTabCount(tab.id, depot)
          const label = compact ? tab.shortLabel : tab.label

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`group relative flex min-h-[3.25rem] flex-col items-start justify-center rounded-lg px-3 py-2.5 text-left transition-all ${
                isActive
                  ? compact
                    ? 'bg-zinc-800 text-zinc-50 shadow-md ring-1 ring-distrac-primary/50'
                    : 'bg-white text-zinc-900 shadow-sm ring-1 ring-distrac-primary/40 dark:bg-zinc-800 dark:text-zinc-50'
                  : compact
                    ? 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                    : 'text-zinc-500 hover:bg-white/80 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
                    isActive
                      ? 'bg-distrac-primary/20 text-distrac-primary'
                      : 'bg-zinc-800/50 text-zinc-500 group-hover:text-zinc-300 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                {count != null && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-distrac-primary/20 text-orange-200'
                        : 'bg-zinc-800 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </div>
              <span className={`mt-1.5 font-medium leading-tight ${compact ? 'text-xs' : 'text-sm'}`}>
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 left-3 right-3 h-0.5 rounded-full bg-distrac-primary/80" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function KpiStat({ icon: Icon, label, value, hint, compact = false }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-zinc-800 dark:bg-cc-surface">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-3.5 w-3.5 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="min-w-0">
          <p className={`font-medium text-zinc-500 dark:text-zinc-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {label}
          </p>
          <p className={`mt-0.5 font-semibold text-zinc-900 dark:text-zinc-100 ${compact ? 'text-sm' : 'text-base'}`}>
            {value}
          </p>
          {hint ? (
            <p className="mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{hint}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function TabKpiRow({ children, compact = false }) {
  return (
    <div className={`mb-3 grid gap-2 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
      {children}
    </div>
  )
}

function StockTabKpis({ depot, compact = false }) {
  const capacity = depot.capacity_usage || {}
  const stock = depot.stock || []
  const stockCount = stock.length
  const lowStockCount = stock.filter((row) => {
    const quantity = Number(row.quantity || 0)
    const minQty = Number(row.min_quantity || 0)
    return quantity <= minQty
  }).length

  return (
    <TabKpiRow compact={compact}>
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
      <KpiStat icon={Package} label="Unique Products" value={stockCount.toLocaleString()} hint="SKUs in stock" compact={compact} />
      <KpiStat
        icon={PackageOpen}
        label="Low Stock"
        value={lowStockCount.toLocaleString()}
        hint={lowStockCount > 0 ? 'At or below minimum' : 'All above minimum'}
        compact={compact}
      />
    </TabKpiRow>
  )
}

function LivreursTabKpis({ livreurs, compact = false }) {
  const list = livreurs || []
  const activeCount = list.filter((row) => row.status === 'active').length
  const withVehicleCount = list.filter((row) => row.vehicle).length

  return (
    <TabKpiRow compact={compact}>
      <KpiStat icon={Users} label="Assigned" value={list.length.toLocaleString()} compact={compact} />
      <KpiStat icon={Users} label="Active" value={activeCount.toLocaleString()} compact={compact} />
      <KpiStat
        icon={Truck}
        label="With Vehicle"
        value={withVehicleCount.toLocaleString()}
        hint="Checked-in vehicle linked"
        compact={compact}
      />
      <KpiStat
        icon={Users}
        label="Unassigned Vehicle"
        value={Math.max(list.length - withVehicleCount, 0).toLocaleString()}
        compact={compact}
      />
    </TabKpiRow>
  )
}

function MissionsTabKpis({ missions, compact = false }) {
  const list = missions || []
  const inProgress = list.filter((row) => row.status === 'IN_PROGRESS').length
  const completed = list.filter((row) => row.status === 'COMPLETED').length
  const scheduled = list.filter((row) => ['PROPOSED', 'APPROVED'].includes(row.status)).length

  return (
    <TabKpiRow compact={compact}>
      <KpiStat icon={Route} label="Total Missions" value={list.length.toLocaleString()} compact={compact} />
      <KpiStat icon={Route} label="In Progress" value={inProgress.toLocaleString()} compact={compact} />
      <KpiStat icon={Route} label="Completed" value={completed.toLocaleString()} compact={compact} />
      <KpiStat icon={Route} label="Scheduled" value={scheduled.toLocaleString()} hint="Proposed or approved" compact={compact} />
    </TabKpiRow>
  )
}

function VendorLoadsTabKpis({ requests, compact = false }) {
  const totalValue = requests.reduce((sum, row) => sum + Number(row.total_value || 0), 0)
  const totalWeight = requests.reduce((sum, row) => sum + Number(row.total_weight_kg || 0), 0)

  return (
    <TabKpiRow compact={compact}>
      <KpiStat icon={Package} label="Pending" value={requests.length.toLocaleString()} compact={compact} />
      <KpiStat icon={Banknote} label="Total Value" value={formatDa(totalValue)} compact={compact} />
      <KpiStat
        icon={Box}
        label="Total Weight"
        value={`${totalWeight.toLocaleString()} kg`}
        compact={compact}
      />
      <KpiStat
        icon={Users}
        label="Vendors"
        value={new Set(requests.map((row) => row.vendor_id).filter(Boolean)).size.toLocaleString()}
        compact={compact}
      />
    </TabKpiRow>
  )
}

function VendorLoadRequestsPanel({ depotId, compact = false, highlightRequestId = null }) {
  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const load = async () => {
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/depot/vendor-load-requests', { params: { status: 'PENDING_DEPOT' } })
      let rows = res.data?.data?.requests || []

      // Timeline deep-link: ensure focused request is visible even if not PENDING_DEPOT
      if (highlightRequestId && !rows.some((r) => String(r.id) === String(highlightRequestId))) {
        try {
          const focused = await apiInstance.get(`/depot/vendor-load-requests`, {
            params: { status: 'APPROVED' },
          })
          const approved = focused.data?.data?.requests || []
          const match = approved.find((r) => String(r.id) === String(highlightRequestId))
          if (match) rows = [match, ...rows]
          else {
            const loadedRes = await apiInstance.get(`/depot/vendor-load-requests`, {
              params: { status: 'LOADED' },
            })
            const loaded = loadedRes.data?.data?.requests || []
            const loadedMatch = loaded.find((r) => String(r.id) === String(highlightRequestId))
            if (loadedMatch) rows = [loadedMatch, ...rows]
          }
        } catch {
          // keep pending-only list
        }
      }

      setRequests(rows)
    } catch {
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [depotId, highlightRequestId])

  const filteredRequests = depotId
    ? requests.filter((row) => String(row.depot_id) === String(depotId))
    : requests

  const handleReview = async (requestId, action) => {
    try {
      await apiInstance.patch(`/depot/vendor-load-requests/${requestId}/${action}`)
      await load()
    } catch {
      // ignore
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-4'}`}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
      </div>
    )
  }

  const cellPad = compact ? 'px-3 py-2.5' : 'px-6 py-4'

  return (
    <div className="space-y-3">
      <VendorLoadsTabKpis requests={filteredRequests} compact={compact} />
      {filteredRequests.length === 0 ? (
        <p className="text-sm text-zinc-500">No pending vendor load requests.</p>
      ) : (
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
              {filteredRequests.map((request) => {
                const highlighted =
                  highlightRequestId && String(request.id) === String(highlightRequestId)
                return (
                <tr
                  key={request.id}
                  className={`border-t border-gray-200 dark:border-zinc-800 ${
                    highlighted ? 'bg-distrac-primary/10 ring-1 ring-inset ring-distrac-primary/40' : ''
                  }`}
                >
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
              )})}
            </tbody>
          </table>
        </div>
      )}
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
  if (compact) {
    return (
      <div className="space-y-4">
        <div className="border-b border-zinc-800 bg-zinc-950">
          <div className="h-32 animate-pulse bg-zinc-900" />
          <div className="space-y-3 px-5 pb-5">
            <div className="-mt-12 h-[4.5rem] w-[4.5rem] animate-pulse rounded-2xl bg-zinc-800" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-800" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-800/80" />
          </div>
        </div>
        <div className="px-5">
          <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-800 p-1.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-zinc-800/80" />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-zinc-800/80" />
            ))}
          </div>
          <div className="mt-4 h-40 animate-pulse rounded-xl bg-zinc-800/80" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div className="h-40 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
        <div className="space-y-3 p-6">
          <div className="h-20 w-20 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-7 w-2/3 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-zinc-200 p-1.5 dark:border-zinc-800">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

function CapacityCard({ icon: Icon, label, used, total, usedPercentage, formatValue, compact = false }) {
  const pct = Math.min(Math.max(usedPercentage || 0, 0), 100)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-cc-surface">
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
    default: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  }[tone] || 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-300'

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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-cc-surface/50">
        <PackageOpen className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No stock in this depot</p>
        <p className="mt-1 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Products appear once inventory is assigned.
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-cc-surface/50">
        <Users className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No livreurs assigned</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-4 py-12 dark:border-zinc-700 dark:bg-cc-surface/50">
        <Route className="mb-3 h-8 w-8 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No missions for this depot</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
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
  initialTab = null,
  highlightRequestId = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab || 'stock')
  const compact = layout === 'panel'

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
  }, [initialTab, depot?.id])

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

  return (
    <div className={compact ? '' : 'space-y-8'}>
      {layout === 'page' && (
        <header className="space-y-4">
          <EntityBreadcrumb moduleKey="depot" entityName={depot.depot_name} mode="page" />
          <Link
            to={backTo}
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        </header>
      )}

      <div className={compact ? 'space-y-4' : 'space-y-6'}>
        <DepotProfileHero depot={depot} compact={compact} />

        <div className={compact ? 'space-y-4 px-5 pb-5' : 'space-y-6'}>
          {layout === 'page' && (
            <div className="flex justify-end">
              <EntityConnectedActions moduleKey="depot" entityId={depot.id} layout="page" />
            </div>
          )}

          <DepotTabNav activeTab={activeTab} onChange={setActiveTab} depot={depot} compact={compact} />

          <div className={compact ? '' : ''}>
            {activeTab === 'stock' && (
              <>
                <StockTabKpis depot={depot} compact={compact} />
                <StockTable stock={depot.stock} compact={compact} />
              </>
            )}
            {activeTab === 'livreurs' && (
              <>
                <LivreursTabKpis livreurs={depot.livreurs} compact={compact} />
                <LivreursTable livreurs={depot.livreurs} compact={compact} />
              </>
            )}
            {activeTab === 'missions' && (
              <>
                <MissionsTabKpis missions={depot.missions} compact={compact} />
                <MissionsTable missions={depot.missions} compact={compact} />
              </>
            )}
            {activeTab === 'vendor_loads' && (
              <VendorLoadRequestsPanel
                depotId={depot.id}
                compact={compact}
                highlightRequestId={highlightRequestId}
              />
            )}
          </div>
        </div>
      </div>

      {showMap && (
        <section className={compact ? 'px-5' : ''}>
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
    </div>
  )
}
