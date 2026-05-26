import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Play, RefreshCw, CheckCircle2, Truck, Loader2, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import apiInstance from '../../api/axiosInstance'
import { MissionProposalDetailPanel } from './MissionProposalDetailPanel'

function addDaysIso(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const MISSION_TYPE_LABELS = {
  INDUSTRY_PICKUP: 'Industry pickup',
  DELIVERY_ROUTE: 'Delivery route',
}

function MissionProposalsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
      ))}
    </div>
  )
}

export function MissionProposalsTab({ depots, refreshToken = 0 }) {
  const [targetDate, setTargetDate] = useState(addDaysIso(1))
  const [depotId, setDepotId] = useState('')
  const [missions, setMissions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDispatching, setIsDispatching] = useState(false)
  const [approvingId, setApprovingId] = useState(null)
  const [selectedMissionId, setSelectedMissionId] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const controllerRef = useRef(null)

  const depotsById = useMemo(() => Object.fromEntries(depots.map((d) => [d.id, d])), [depots])

  useEffect(() => {
    if (!depotId && depots.length > 0) {
      setDepotId(depots[0].id)
    }
  }, [depots, depotId])

  const loadProposed = async () => {
    if (!depotId) return
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get('/missions/proposed', {
        params: { depotId, date: targetDate, status: 'PROPOSED' },
        signal: controller.signal,
      })
      if (!controller.signal.aborted) {
        setMissions(res.data?.data?.missions || [])
      }
    } catch (e) {
      if (e.name !== 'CanceledError') {
        setMissions([])
        setError(e?.response?.data?.message || 'Failed to load proposed missions.')
      }
    } finally {
      if (!controllerRef.current?.signal.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadProposed()
    return () => controllerRef.current?.abort()
  }, [depotId, targetDate, refreshToken])

  const runDispatcher = async () => {
    if (!depotId) {
      setError('Select a depot first.')
      return
    }
    setIsDispatching(true)
    setError('')
    setSuccess('')
    try {
      const res = await apiInstance.post('/missions/dispatcher/run', {
        targetDate,
        depotId,
      })
      const report = res.data?.data?.report || {}
      const created = (report.reports || []).reduce(
        (sum, row) => sum + Number(row.createdMissions || 0),
        0,
      )
      const deliveries = (report.reports || []).reduce(
        (sum, row) => sum + Number(row.deliveries || 0),
        0,
      )
      setSuccess(
        res.data?.message ||
          `Generated ${created} mission(s) for ${targetDate} (${deliveries} deliveries queued).`,
      )
      await loadProposed()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to run mission dispatcher.')
    } finally {
      setIsDispatching(false)
    }
  }

  const approveMission = async (missionId) => {
    setApprovingId(missionId)
    setError('')
    try {
      await apiInstance.post(`/missions/${missionId}/approve`)
      setSuccess('Mission approved — livreur can see it on their app.')
      await loadProposed()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to approve mission.')
    } finally {
      setApprovingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Manually run the same dispatcher as the 7 PM job. It builds <strong>PROPOSED</strong> missions for the
          selected date (orders due that day + collections + pickups). Existing PROPOSED missions for that depot and
          date are replaced.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mission date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Depot</label>
            <select
              value={depotId}
              onChange={(e) => setDepotId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            >
              {depots.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.depot_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button
              type="button"
              onClick={runDispatcher}
              disabled={isDispatching || !depotId}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {isDispatching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {isDispatching ? 'Running…' : 'Generate proposals'}
            </button>
            <button
              type="button"
              onClick={loadProposed}
              disabled={isLoading}
              title="Refresh list"
              className="rounded-lg border border-gray-300 p-2.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-200">
          {success}
        </div>
      )}

      {isLoading ? (
        <MissionProposalsSkeleton />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Livreur</th>
                  <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                  <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Stops</th>
                  <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                  <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Action</th>
                </tr>
              </thead>
              <tbody>
                {missions.map((mission) => (
                  <tr
                    key={mission.id}
                    onClick={() => setSelectedMissionId(mission.id)}
                    className="cursor-pointer border-b border-gray-200 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {mission.livreur?.full_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {MISSION_TYPE_LABELS[mission.mission_type] || mission.mission_type}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {(mission.stops || []).length}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                        PROPOSED
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => approveMission(mission.id)}
                          disabled={approvingId === mission.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
                        >
                          {approvingId === mission.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </button>
                        <ChevronRight className="h-4 w-4 text-zinc-400" />
                      </div>
                    </td>
                  </tr>
                ))}
                {missions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                      <Truck className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      No proposed missions for {depotsById[depotId]?.depot_name || 'this depot'} on {targetDate}.
                      <br />
                      <span className="text-xs">Click &quot;Generate proposals&quot; to run the dispatcher.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AnimatePresence>
        {selectedMissionId && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedMissionId(null)}
              aria-hidden="true"
            />
            <MissionProposalDetailPanel
              missionId={selectedMissionId}
              depotId={depotId}
              targetDate={targetDate}
              onClose={() => setSelectedMissionId(null)}
              onSaved={() => loadProposed()}
              onApproved={() => {
                setSuccess('Mission approved — conflicting stops removed from other proposals.')
                loadProposed()
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
