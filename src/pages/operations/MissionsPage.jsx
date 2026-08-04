import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useCcNavigation } from '../../hooks/useCcNavigation'
import {
  Truck,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  PackageCheck,
  Loader2,
  ChevronRight,
  PlayCircle,
  Route,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { DataTable } from '../../components/DataTable'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { CreateMissionSlideOver } from './CreateMissionSlideOver'
import { PlanMissionsModal } from './PlanMissionsModal'
import { usePanelEmbed } from '../../components/map/CcPanelHost'
import {
  useCcMissionFilters,
  missionFilterToday,
} from '../../components/map/CcMissionFiltersContext'
import { useScopedDepots } from '../../hooks/useScopedDepots'
import apiInstance from '../../api/axiosInstance'

const STATUS_PILLS = [
  { id: 'ALL', label: 'All' },
  { id: 'PROPOSED', label: 'Proposed' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'COMPLETED', label: 'Completed' },
]

const EMPTY_STATS = {
  proposed: 0,
  approved: 0,
  inProgress: 0,
  completed: 0,
}

const MISSION_TYPE_META = {
  INDUSTRY_PICKUP: { label: 'Industry Pickup', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  DELIVERY_ROUTE: { label: 'Delivery Route', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
}

const MISSION_STATUS_META = {
  PROPOSED: { label: 'Proposed', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
  APPROVED: { label: 'Approved', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
  IN_PROGRESS: { label: 'In progress', cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200' },
  COMPLETED: { label: 'Completed', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' },
}

function Badge({ label, cls }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  )
}

function KpiCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-cc-surface">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function MissionsPage() {
  const { openPanel } = useCcNavigation()
  const { t } = useTranslation()
  const embedded = usePanelEmbed()
  const ccFilters = useCcMissionFilters()
  const { depots } = useScopedDepots()

  const [localDate, setLocalDate] = useState(missionFilterToday)
  const [localDepotId, setLocalDepotId] = useState('')
  const [statusPill, setStatusPill] = useState('ALL')
  const [missions, setMissions] = useState([])
  const [stats, setStats] = useState(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const controllerRef = useRef(null)

  const filterDate = embedded && ccFilters ? ccFilters.date : localDate
  const filterDateFrom = embedded && ccFilters ? ccFilters.dateFrom : localDate
  const filterDateTo = embedded && ccFilters ? ccFilters.dateTo : localDate
  const selectedDepotId =
    embedded && ccFilters ? ccFilters.depotIdForApi : localDepotId || null
  const scopedIds = useMemo(() => new Set(depots.map((d) => String(d.id))), [depots])
  // Only pass a depot when it is in the user's assigned list; otherwise null → assigned aggregate
  const filterDepotId =
    selectedDepotId && scopedIds.has(String(selectedDepotId)) ? String(selectedDepotId) : null

  useEffect(() => {
    if (!embedded || !ccFilters?.setStatus) return
    ccFilters.setStatus(statusPill)
  }, [embedded, statusPill, ccFilters?.setStatus])

  const loadDashboard = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError('')
    try {
      const params = {
        date: filterDate,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
        status: statusPill,
      }
      if (filterDepotId) params.depotId = filterDepotId

      const res = await apiInstance.get('/missions/dashboard', {
        params,
        signal: controller.signal,
      })

      if (!controller.signal.aborted) {
        const data = res.data?.data || {}
        setMissions(data.missions || [])
        setStats(data.stats || EMPTY_STATS)
      }
    } catch (e) {
      if (e.name !== 'CanceledError') {
        setMissions([])
        setStats(EMPTY_STATS)
        setError(e?.response?.data?.message || 'Failed to load missions.')
      }
    } finally {
      if (!controllerRef.current?.signal.aborted) setIsLoading(false)
    }
  }, [filterDate, filterDateFrom, filterDateTo, filterDepotId, statusPill])

  useEffect(() => {
    loadDashboard()
    return () => controllerRef.current?.abort()
  }, [loadDashboard])

  const quickApprove = async (e, missionId) => {
    e.stopPropagation()
    setApprovingId(missionId)
    setError('')
    try {
      await apiInstance.post(`/missions/${missionId}/approve`)
      await loadDashboard()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to approve mission.')
    } finally {
      setApprovingId(null)
    }
  }

  const openMission = (row) => {
    openPanel('missions', row.id)
  }

  const headerActions = (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setIsPlanOpen(true)} className="btn-secondary">
        <Sparkles className="h-4 w-4" />
        Plan missions
      </button>
      <button type="button" onClick={() => setIsCreateOpen(true)} className="btn-primary">
        <Plus className="h-4 w-4" />
        {t('missions.createMissionBtn')}
      </button>
    </div>
  )

  const body = (
    <div className="space-y-6">
      {!embedded ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
              <Truck className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div>
              <h1 className="page-title">{t('missions.pageTitle')}</h1>
              <p className="page-subtitle">{t('missions.pageSubtitle')}</p>
            </div>
          </div>
          {headerActions}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Clock}
          label="Waiting Approval"
          value={stats.proposed ?? 0}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Approved"
          value={stats.approved ?? 0}
          accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
        />
        <KpiCard
          icon={PlayCircle}
          label="In Progress"
          value={stats.inProgress ?? 0}
          accent="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
        />
        <KpiCard
          icon={PackageCheck}
          label="Completed"
          value={stats.completed ?? 0}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-cc-surface">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          {!embedded ? (
            <div className="flex flex-wrap gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Date
                </label>
                <input
                  type="date"
                  value={localDate}
                  onChange={(e) => setLocalDate(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Depot
                </label>
                <select
                  value={localDepotId}
                  onChange={(e) => setLocalDepotId(e.target.value)}
                  className="min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  <option value="">My depots</option>
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.depot_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {STATUS_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setStatusPill(pill.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  statusPill === pill.id
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-32 items-center justify-center rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-zinc-900 dark:border-zinc-100" />
        </div>
      ) : (
        <DataTable
          data={missions}
          columns={[
            {
              header: 'Depot',
              accessor: 'depot',
              sortable: false,
              render: (row) => row.depot?.depot_name || '—',
            },
            {
              header: t('missions.driver'),
              accessor: 'livreur',
              sortable: false,
              render: (row) => row.livreur?.full_name || '—',
            },
            {
              header: 'Type',
              accessor: 'mission_type',
              sortable: true,
              render: (row) => {
                const tm = MISSION_TYPE_META[row.mission_type] || {
                  label: row.mission_type,
                  cls: 'bg-zinc-100 text-zinc-600',
                }
                return <Badge label={tm.label} cls={tm.cls} />
              },
            },
            {
              header: t('missions.status'),
              accessor: 'status',
              sortable: true,
              render: (row) => {
                const sm = MISSION_STATUS_META[row.status] || {
                  label: row.status,
                  cls: 'bg-zinc-100 text-zinc-600',
                }
                return <Badge label={sm.label} cls={sm.cls} />
              },
            },
            {
              header: 'Stops',
              accessor: 'stop_count',
              sortable: true,
              render: (row) => <span className="text-zinc-500">{row.stop_count ?? 0}</span>,
            },
            {
              header: 'Actions',
              accessor: 'actions',
              sortable: false,
              render: (row) => (
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {row.status === 'PROPOSED' && (
                    <button
                      type="button"
                      title="Quick approve"
                      onClick={(e) => quickApprove(e, row.id)}
                      disabled={approvingId === row.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                    >
                      {approvingId === row.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <ChevronRight className="h-4 w-4 text-zinc-400" />
                </div>
              ),
            },
          ]}
          searchPlaceholder={t('missions.searchPlaceholder', 'Search missions...')}
          onRowClick={openMission}
          emptyStateMessage={t('missions.noMissionsDesc')}
        />
      )}

      <CreateMissionSlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        depots={depots}
        onCreated={loadDashboard}
      />

      <PlanMissionsModal
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        depots={depots}
        onPlanned={loadDashboard}
      />
    </div>
  )

  if (embedded) {
    return (
      <DepotCcPageShell
        title={t('missions.pageTitle')}
        subtitle={t('missions.pageSubtitle')}
        icon={Route}
        actions={headerActions}
      >
        {body}
      </DepotCcPageShell>
    )
  }

  return (
    <DashboardLayout>
      <AnimatedPage>{body}</AnimatedPage>
    </DashboardLayout>
  )
}
