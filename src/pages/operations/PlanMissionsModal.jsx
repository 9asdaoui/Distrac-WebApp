import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Play, Loader2 } from 'lucide-react'
import apiInstance from '../../api/axiosInstance'

function addDaysIso(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function PlanMissionsModal({ isOpen, onClose, depots, onPlanned }) {
  const [targetDate, setTargetDate] = useState(addDaysIso(1))
  const [depotId, setDepotId] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && !depotId && depots.length > 0) {
      setDepotId(depots[0].id)
    }
  }, [isOpen, depots, depotId])

  const runDispatcher = async () => {
    if (!depotId) {
      setError('Select a depot.')
      return
    }
    setIsRunning(true)
    setError('')
    try {
      await apiInstance.post('/missions/dispatcher/run', { targetDate, depotId })
      onPlanned?.()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to run mission dispatcher.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Plan missions</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Run the auto-dispatcher for a depot and date. New routes appear as PROPOSED.
                </p>
              </div>
              <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mission date</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Depot</label>
                <select
                  value={depotId}
                  onChange={(e) => setDepotId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                >
                  {depots.map((d) => (
                    <option key={d.id} value={d.id}>{d.depot_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runDispatcher}
                disabled={isRunning}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Generate
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
