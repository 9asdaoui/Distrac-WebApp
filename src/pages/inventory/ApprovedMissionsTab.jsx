import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react'
import apiInstance from '../../api/axiosInstance'

function addDaysIso(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const MISSION_TYPE_LABELS = {
  INDUSTRY_PICKUP: 'Industry pickup',
  DELIVERY_ROUTE: 'Delivery route',
}

function ApprovedMissionsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
      ))}
    </div>
  )
}

export function ApprovedMissionsTab({ depots, refreshToken = 0 }) {
  const navigate = useNavigate()
  const [depotId, setDepotId] = useState('')
  const [fromDate, setFromDate] = useState(addDaysIso(-30))
  const [toDate, setToDate] = useState(addDaysIso(14))
  const [missions, setMissions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  const depotsById = useMemo(() => Object.fromEntries(depots.map((d) => [d.id, d])), [depots])

  useEffect(() => {
    if (!depotId && depots.length > 0) {
      setDepotId(depots[0].id)
    }
  }, [depots, depotId])

  const loadApproved = async () => {
    if (!depotId) return
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get('/missions/approved', {
        params: { depotId, fromDate, toDate },
        signal: controller.signal,
      })
      if (!controller.signal.aborted) {
        setMissions(res.data?.data?.missions || [])
      }
    } catch (e) {
      if (e.name !== 'CanceledError') {
        setMissions([])
        setError(e?.response?.data?.message || 'Failed to load approved missions.')
      }
    } finally {
      if (!controllerRef.current?.signal.aborted) setIsLoading(false)
    }
  }

  useEffect(() => {
    loadApproved()
    return () => controllerRef.current?.abort()
  }, [depotId, fromDate, toDate, refreshToken])

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Approved missions ready for livreur execution. Click a row to open the full mission detail page.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">From date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">To date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Depot</label>
            <div className="flex gap-2">
              <select
                value={depotId}
                onChange={(e) => setDepotId(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.depot_name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={loadApproved}
                disabled={isLoading}
                title="Refresh"
                className="rounded-lg border border-gray-300 p-2.5 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <ApprovedMissionsSkeleton />
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
                  <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Stops</th>
                  <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {missions.map((mission) => (
                  <tr
                    key={mission.id}
                    onClick={() => navigate(`/missions/${mission.id}`)}
                    className="cursor-pointer border-b border-gray-200 transition hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40"
                  >
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{mission.date}</td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {mission.depot?.depot_name || depotsById[mission.depot_id]?.depot_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {mission.livreur?.full_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {MISSION_TYPE_LABELS[mission.mission_type] || mission.mission_type}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                      {(mission.stops || []).length}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        APPROVED
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
                    </td>
                  </tr>
                ))}
                {missions.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400">
                      No approved missions for this depot in the selected date range.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
