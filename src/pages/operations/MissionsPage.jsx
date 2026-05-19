import React, { useEffect, useRef, useState } from 'react'
import { Truck, ChevronRight, X, UserCheck, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { useAuth } from '../../context/AuthContext'
import apiInstance from '../../api/axiosInstance'

const MISSION_TYPE_META = {
  INDUSTRY_PICKUP: { label: 'Industry Pickup', cls: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  DELIVERY_ROUTE:  { label: 'Delivery Route',  cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
}

const MISSION_STATUS_META = {
  PENDING:    { label: 'Pending',    cls: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  IN_PROGRESS:{ label: 'In Progress',cls: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' },
  COMPLETED:  { label: 'Completed',  cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  CANCELLED:  { label: 'Cancelled',  cls: 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400' },
}

const STOP_TYPE_META = {
  PICKUP:   { label: 'Pickup',   icon: '📦', cls: 'text-orange-600 dark:text-orange-400' },
  DELIVERY: { label: 'Delivery', icon: '🚚', cls: 'text-blue-600 dark:text-blue-400' },
  COLLECTION:{ label: 'Collection', icon: '💰', cls: 'text-green-600 dark:text-green-400' },
}

function Badge({ label, cls }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
}

function MissionsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              {['Type', 'Livreur', 'Depot', 'Stops', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <motion.tr key={row} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: row * 0.05 }}
                className="border-b border-gray-200 dark:border-zinc-800">
                {[24, 32, 28, 10, 20, 24, 12].map((w, i) => (
                  <td key={i} className="px-6 py-4">
                    <div className={`h-4 w-${w} animate-pulse rounded bg-gray-200 dark:bg-zinc-700`} />
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StopExplorerPanel({ mission, onClose, onSwapLivreur, canSwap }) {
  const [swapOpen, setSwapOpen] = useState(false)
  const [newLivreurId, setNewLivreurId] = useState('')
  const [livreurs, setLivreurs] = useState([])
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapError, setSwapError] = useState('')

  useEffect(() => {
    if (canSwap) {
      apiInstance.get('/users?role=LIVREUR').then((res) => {
        setLivreurs(res.data?.data?.users || [])
      }).catch(() => {})
    }
  }, [canSwap])

  const handleSwap = async () => {
    if (!newLivreurId) return
    setIsSwapping(true)
    setSwapError('')
    try {
      await onSwapLivreur(mission.id, newLivreurId)
      setSwapOpen(false)
      onClose()
    } catch (e) {
      setSwapError(e?.response?.data?.message || 'Failed to reassign mission.')
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <motion.div
      className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Mission Stops</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {mission.livreur?.full_name || 'Unknown Livreur'} • {mission.depot?.depot_name || '—'}
          </p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Mission summary badges */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(() => {
          const tm = MISSION_TYPE_META[mission.mission_type] || { label: mission.mission_type, cls: 'bg-zinc-100 text-zinc-500' }
          const sm = MISSION_STATUS_META[mission.status] || { label: mission.status, cls: 'bg-zinc-100 text-zinc-500' }
          return (<><Badge label={tm.label} cls={tm.cls} /><Badge label={sm.label} cls={sm.cls} /></>)
        })()}
        <span className="text-sm text-zinc-400">{mission.stops?.length || 0} stops</span>
      </div>

      {/* Stop list */}
      <div className="space-y-3 mb-6">
        {(mission.stops || []).length === 0 && (
          <p className="text-sm text-zinc-400 text-center py-8">No stops found for this mission.</p>
        )}
        {(mission.stops || []).map((stop, i) => {
          const stm = STOP_TYPE_META[stop.stop_type] || { label: stop.stop_type, icon: '•', cls: '' }
          const isVerified = !!stop.qr_verified_at
          const isComplete = !!stop.completed_at
          return (
            <div
              key={stop.id}
              className="flex items-start gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg shadow-sm dark:bg-zinc-800">
                {stop.sequence_number || i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-sm font-medium ${stm.cls}`}>{stm.icon} {stm.label}</span>
                  <span className="text-xs text-zinc-400 font-mono truncate max-w-[120px]">{stop.entity_id?.slice(0, 8)}…</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  {isComplete ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock className="h-3.5 w-3.5" /> Pending
                    </span>
                  )}
                  {isVerified ? (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3.5 w-3.5" /> QR Verified
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-zinc-400">
                      <XCircle className="h-3.5 w-3.5" /> QR Pending
                    </span>
                  )}
                </div>
                {stop.completed_at && (
                  <p className="mt-1 text-xs text-zinc-400">
                    Completed: {new Date(stop.completed_at).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Swap livreur */}
      {canSwap && (
        <div className="border-t border-gray-200 pt-5 dark:border-zinc-800">
          {!swapOpen ? (
            <button
              type="button"
              onClick={() => setSwapOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <UserCheck className="h-4 w-4" />
              Swap Livreur
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Reassign to another livreur:</p>
              <select
                value={newLivreurId}
                onChange={(e) => setNewLivreurId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 px-4 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
              >
                <option value="">Select livreur…</option>
                {livreurs.map((l) => (
                  <option key={l.id} value={l.id}>{l.full_name || `${l.first_name} ${l.last_name}`}</option>
                ))}
              </select>
              {swapError && <p className="text-xs text-red-500">{swapError}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSwap}
                  disabled={!newLivreurId || isSwapping}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                >
                  {isSwapping ? 'Reassigning…' : 'Confirm Swap'}
                </button>
                <button
                  type="button"
                  onClick={() => setSwapOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export function MissionsPage() {
  const { hasPermission } = useAuth()
  const [missions, setMissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMission, setSelectedMission] = useState(null)
  const controllerRef = useRef(null)

  const canSwap = hasPermission('manage_missions') || hasPermission('manage_logistics')

  const load = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/missions/today', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setMissions(res.data?.data?.missions || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') setMissions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwapLivreur = async (missionId, newLivreurId) => {
    await apiInstance.post(`/missions/${missionId}/reassign`, { newLivreurId })
    load()
  }

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [])

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <Truck className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Missions</h1>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Today's generated missions and delivery fleet tracking.</p>
              </div>
            </div>
            {!isLoading && (
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{missions.length} missions today</span>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <MissionsSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Livreur</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Stops</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Date</th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((mission, i) => {
                      const tm = MISSION_TYPE_META[mission.mission_type] || { label: mission.mission_type, cls: 'bg-zinc-100 text-zinc-500' }
                      const sm = MISSION_STATUS_META[mission.status] || { label: mission.status, cls: 'bg-zinc-100 text-zinc-500' }
                      const completedStops = (mission.stops || []).filter((s) => s.completed_at).length
                      return (
                        <motion.tr
                          key={mission.id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-gray-200 hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/30 cursor-pointer"
                          onClick={() => setSelectedMission(mission)}
                        >
                          <td className="px-6 py-4">
                            <Badge label={tm.label} cls={tm.cls} />
                          </td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">
                            {mission.livreur?.full_name || '—'}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                            {mission.depot?.depot_name || '—'}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                            {completedStops}/{(mission.stops || []).length}
                          </td>
                          <td className="px-6 py-4">
                            <Badge label={sm.label} cls={sm.cls} />
                          </td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                            {mission.date ? new Date(mission.date).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-6 py-4">
                            <ChevronRight className="h-4 w-4 text-zinc-400" />
                          </td>
                        </motion.tr>
                      )
                    })}
                    {missions.length === 0 && (
                      <tr>
                        <td className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={7}>
                          No missions found for today.
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

      {/* Stop Explorer slide-over — outside AnimatedPage to avoid transform clipping */}
      <AnimatePresence>
        {selectedMission && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setSelectedMission(null)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <StopExplorerPanel
              mission={selectedMission}
              onClose={() => setSelectedMission(null)}
              onSwapLivreur={handleSwapLivreur}
              canSwap={canSwap}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
