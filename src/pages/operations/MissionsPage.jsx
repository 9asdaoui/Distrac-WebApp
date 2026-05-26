import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Truck,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  PackageCheck,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { CreateMissionSlideOver } from './CreateMissionSlideOver'
import { PlanMissionsModal } from './PlanMissionsModal'
import apiInstance from '../../api/axiosInstance'

function localToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const STATUS_PILLS = [
  { id: 'ALL', label: 'All' },
  { id: 'PROPOSED', label: 'Proposed' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'COMPLETED', label: 'Completed' },
]

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
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
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

function MissionsTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-gray-200 px-6 py-3 dark:border-zinc-800">
        <div className="h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      {[1, 2, 3, 4, 5].map((row) => (
        <div key={row} className="flex gap-4 border-b border-gray-200 px-6 py-4 dark:border-zinc-800">
          {[20, 24, 28, 16, 14, 8].map((w, i) => (
            <div key={i} className="h-4 flex-1 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" style={{ maxWidth: w * 8 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function MissionsPage() {
  const navigate = useNavigate()
  const [depots, setDepots] = useState([])
  const [filterDate, setFilterDate] = useState(localToday)
  const [filterDepotId, setFilterDepotId] = useState('')
  const [statusPill, setStatusPill] = useState('ALL')
  const [missions, setMissions] = useState([])
  const [stats, setStats] = useState({
    awaitingApproval: 0,
    activeMissions: 0,
    successfulDeliveries: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [approvingId, setApprovingId] = useState(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isPlanOpen, setIsPlanOpen] = useState(false)
  const controllerRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    apiInstance
      .get('/depots', { signal: controller.signal })
      .then((res) => {
        setDepots(res.data?.data?.depots || [])
      })
      .catch(() => {})
    return () => controller.abort()
  }, [])

  const loadDashboard = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError('')
    try {
      const params = {
        date: filterDate,
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
        setStats(data.stats || { awaitingApproval: 0, activeMissions: 0, successfulDeliveries: 0 })
      }
    } catch (e) {
      if (e.name !== 'CanceledError') {
        setMissions([])
        setStats({ awaitingApproval: 0, activeMissions: 0, successfulDeliveries: 0 })
        setError(e?.response?.data?.message || 'Failed to load missions.')
      }
    } finally {
      if (!controllerRef.current?.signal.aborted) setIsLoading(false)
    }
  }, [filterDate, filterDepotId, statusPill])

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

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Truck className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Mission Command Center</h1>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Today&apos;s operations across your depots — approve, plan, and track in one place.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsPlanOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                <Sparkles className="h-4 w-4" />
                Plan missions
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
              >
                <Plus className="h-4 w-4" />
                Create mission
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard
              icon={Clock}
              label="Awaiting approval"
              value={stats.awaitingApproval}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            />
            <KpiCard
              icon={Truck}
              label="Active missions"
              value={stats.activeMissions}
              accent="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            />
            <KpiCard
              icon={PackageCheck}
              label="Successful deliveries"
              value={stats.successfulDeliveries}
              accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Date</label>
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-zinc-500">Depot</label>
                  <select
                    value={filterDepotId}
                    onChange={(e) => setFilterDepotId(e.target.value)}
                    className="min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  >
                    <option value="">All depots</option>
                    {depots.map((d) => (
                      <option key={d.id} value={d.id}>{d.depot_name}</option>
                    ))}
                  </select>
                </div>
              </div>
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
            <MissionsTableSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Date</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Livreur</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Stops</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((mission, index) => {
                      const tm = MISSION_TYPE_META[mission.mission_type] || {
                        label: mission.mission_type,
                        cls: 'bg-zinc-100 text-zinc-600',
                      }
                      const sm = MISSION_STATUS_META[mission.status] || {
                        label: mission.status,
                        cls: 'bg-zinc-100 text-zinc-600',
                      }
                      return (
                        <motion.tr
                          key={mission.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.04, duration: 0.2 }}
                          onClick={() => navigate(`/missions/${mission.id}`)}
                          className="cursor-pointer border-b border-gray-200 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                        >
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{mission.date}</td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                            {mission.depot?.depot_name || '—'}
                          </td>
                          <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                            {mission.livreur?.full_name || '—'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge label={tm.label} cls={tm.cls} />
                          </td>
                          <td className="px-6 py-4">
                            <Badge label={sm.label} cls={sm.cls} />
                          </td>
                          <td className="px-6 py-4 text-zinc-500">{mission.stop_count ?? 0}</td>
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              {mission.status === 'PROPOSED' && (
                                <button
                                  type="button"
                                  title="Quick approve"
                                  onClick={(e) => quickApprove(e, mission.id)}
                                  disabled={approvingId === mission.id}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300"
                                >
                                  {approvingId === mission.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                  )}
                                </button>
                              )}
                              <ChevronRight className="h-4 w-4 text-zinc-400" />
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })}
                    {missions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-14 text-center text-zinc-500 dark:text-zinc-400">
                          No missions for {filterDate}
                          {filterDepotId ? ' in the selected depot' : ''}.
                          {statusPill !== 'ALL' ? ` Try the "${STATUS_PILLS.find((p) => p.id === statusPill)?.label}" filter or ` : ' '}
                          Use <strong>Plan missions</strong> to generate proposals.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AnimatedPage>

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
    </DashboardLayout>
  )
}
