import React, { useMemo, useState } from 'react'
import {
  Clock,
  Loader2,
  PackageCheck,
  PackageOpen,
  Search,
  Truck,
} from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { usePanelEmbed } from '../../components/map/CcPanelHost'
import {
  missionFilterToday,
  useCcMissionFilters,
} from '../../components/map/CcMissionFiltersContext'
import { useDepotOpsOverview } from '../../hooks/useDepotOpsOverview'
import { useWarehouseOpsOrders } from '../../hooks/useWarehouseOpsOrders'
import { useScopedDepots } from '../../hooks/useScopedDepots'
import { ShipmentPrepSlideOver } from './ShipmentPrepSlideOver'

const EMPTY_BUCKETS = {
  waiting_preparation: 0,
  ready_to_load: 0,
  loading: 0,
  departed: 0,
}

const KPI_CARDS = [
  {
    key: 'waiting_preparation',
    label: 'Waiting Preparation',
    icon: Clock,
    accent: 'bg-amber-500/15 text-amber-300',
  },
  {
    key: 'ready_to_load',
    label: 'Ready to Load',
    icon: PackageCheck,
    accent: 'bg-blue-500/15 text-blue-300',
  },
  {
    key: 'loading',
    label: 'Loading',
    icon: Loader2,
    accent: 'bg-indigo-500/15 text-indigo-300',
  },
  {
    key: 'departed',
    label: 'Departed',
    icon: Truck,
    accent: 'bg-emerald-500/15 text-emerald-300',
  },
]

function KpiCard({ icon: Icon, label, value, accent, isLoading, active, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-5 text-left transition ${
        active
          ? 'border-cc-accent bg-cc-surface-elevated ring-1 ring-cc-accent/40'
          : 'border-zinc-800 bg-cc-surface hover:border-zinc-700'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-cc-tertiary">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-cc-primary">
            {isLoading ? '—' : value}
          </p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </button>
  )
}

function resolveBucketCounts(warehouseKpi) {
  const breakdown = warehouseKpi?.breakdown || []
  if (breakdown.length >= 4) {
    const byLabel = Object.fromEntries(breakdown.map((row) => [row.label, row.value]))
    return {
      waiting_preparation: byLabel['Waiting Preparation'] ?? 0,
      ready_to_load: byLabel['Ready to Load'] ?? 0,
      loading: byLabel['Loading'] ?? 0,
      departed: byLabel['Departed'] ?? 0,
    }
  }
  return { ...EMPTY_BUCKETS }
}

export function ShipmentsPage() {
  const embedded = usePanelEmbed()
  const ccFilters = useCcMissionFilters()
  const { depots } = useScopedDepots()
  const [activeBucket, setActiveBucket] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [search, setSearch] = useState('')

  const filterDate = embedded && ccFilters ? ccFilters.date : missionFilterToday
  const filterDateFrom = embedded && ccFilters ? ccFilters.dateFrom : filterDate
  const filterDateTo = embedded && ccFilters ? ccFilters.dateTo : filterDate
  const selectedDepotId = embedded && ccFilters ? ccFilters.depotIdForApi : null
  const scopedIds = useMemo(() => new Set(depots.map((d) => String(d.id))), [depots])
  // Only pass a depot when it is in the user's assigned list; otherwise null → assigned aggregate
  const filterDepotId =
    selectedDepotId && scopedIds.has(String(selectedDepotId)) ? String(selectedDepotId) : null

  const {
    data,
    isLoading: kpiLoading,
    isError: kpiError,
    refetch: refetchKpis,
  } = useDepotOpsOverview({
    date: filterDate,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    depotId: filterDepotId,
    enabled: Boolean(filterDate),
  })

  const {
    orders,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
  } = useWarehouseOpsOrders({
    date: filterDate,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    depotId: filterDepotId,
    bucket: activeBucket,
    enabled: Boolean(filterDate),
  })

  const warehouseKpi = data?.kpis?.warehouseOperations
  const bucketCounts = useMemo(() => resolveBucketCounts(warehouseKpi), [warehouseKpi])
  const total = warehouseKpi?.total ?? Object.values(bucketCounts).reduce((s, n) => s + n, 0)

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return orders
    return orders.filter((order) => {
      const haystack = [
        order.orderNumber,
        order.id,
        order.clientName,
        order.livreurName,
        order.bucketLabel,
        order.bucket,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(term)
    })
  }, [orders, search])

  const subtitle = 'Pull from depot stock so agents find their loads ready'

  const handleMarkedReady = () => {
    refetchOrders()
    refetchKpis()
  }

  const body = (
    <>
      {kpiError ? (
        <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-300">
          Failed to load prep KPIs. Try again from the Command Center home rail.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <button
          type="button"
          onClick={() => setActiveBucket(null)}
          className={`rounded-2xl border p-5 text-left transition ${
            activeBucket === null
              ? 'border-cc-accent bg-cc-surface-elevated ring-1 ring-cc-accent/40'
              : 'border-zinc-800 bg-cc-surface hover:border-zinc-700'
          }`}
        >
          <p className="text-sm font-medium text-cc-tertiary">All stages</p>
          <p className="mt-2 text-3xl font-semibold text-cc-primary">{kpiLoading ? '—' : total}</p>
        </button>
        {KPI_CARDS.map((card) => (
          <KpiCard
            key={card.key}
            icon={card.icon}
            label={card.label}
            value={bucketCounts[card.key] ?? 0}
            accent={card.accent}
            isLoading={kpiLoading}
            active={activeBucket === card.key}
            onSelect={() => setActiveBucket((prev) => (prev === card.key ? null : card.key))}
          />
        ))}
      </div>

      <section className="rounded-2xl border border-zinc-800 bg-cc-surface">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-cc-primary">Today&apos;s prep</h2>
            <p className="text-sm text-cc-tertiary">
              {activeBucket
                ? KPI_CARDS.find((c) => c.key === activeBucket)?.label
                : 'All warehouse stages'}
              {' · '}
              {ordersLoading ? '…' : `${filteredOrders.length} shipments`}
              {' · '}
              Click a row for the pick list
            </p>
          </div>
          <div className="relative min-w-[14rem] flex-1 sm:max-w-xs sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order, client, agent…"
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 py-2 pl-10 pr-3 text-sm text-cc-primary placeholder:text-zinc-500"
            />
          </div>
        </div>

        {ordersError ? (
          <p className="px-5 py-8 text-sm text-red-300">Failed to load orders for this filter.</p>
        ) : ordersLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-cc-tertiary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading shipments…
          </div>
        ) : filteredOrders.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-cc-tertiary">
            {orders.length === 0
              ? `No shipments to prepare for ${filterDate}.`
              : 'No shipments match your search.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-zinc-900/60 text-xs uppercase tracking-wide text-cc-tertiary">
                <tr>
                  <th className="px-5 py-3 font-medium">Order #</th>
                  <th className="px-5 py-3 font-medium">Client</th>
                  <th className="px-5 py-3 font-medium">Units</th>
                  <th className="px-5 py-3 font-medium">Agent</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="cursor-pointer border-t border-zinc-800 transition hover:bg-zinc-900/40"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-3 font-medium text-cc-primary">
                      {order.orderNumber || order.id?.slice(0, 8)}
                    </td>
                    <td className="px-5 py-3 text-cc-secondary">{order.clientName || '—'}</td>
                    <td className="px-5 py-3 tabular-nums text-cc-secondary">
                      {order.itemCount ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-cc-secondary">{order.livreurName || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs font-semibold text-zinc-300">
                        {order.bucketLabel || order.bucket}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ShipmentPrepSlideOver
        open={Boolean(selectedOrder)}
        orderSummary={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onMarkedReady={handleMarkedReady}
      />
    </>
  )

  if (embedded) {
    return (
      <DepotCcPageShell
        title="Today's prep"
        subtitle={subtitle}
        icon={PackageOpen}
      >
        {body}
      </DepotCcPageShell>
    )
  }

  return (
    <DashboardLayout>
      <DepotCcPageShell title="Today's prep" subtitle={subtitle}>
        {body}
      </DepotCcPageShell>
    </DashboardLayout>
  )
}

export default ShipmentsPage
