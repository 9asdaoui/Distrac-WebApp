import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link2, Loader2, Unlink, X } from 'lucide-react'
import apiInstance from '../../api/axiosInstance'

export function WialonLinkModal({ vehicle, onClose, onLinked }) {
  const [units, setUnits] = useState([])
  const [suggestion, setSuggestion] = useState(null)
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const selectedUnit = useMemo(
    () => units.find((unit) => String(unit.id) === String(selectedUnitId)) || null,
    [units, selectedUnitId],
  )

  useEffect(() => {
    if (!vehicle?.id) return undefined

    let cancelled = false

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const [unitsRes, suggestionsRes] = await Promise.all([
          apiInstance.get('/wialon/units'),
          apiInstance.get('/wialon/suggestions'),
        ])
        if (cancelled) return

        const nextUnits = unitsRes.data?.data?.units || []
        const row =
          (suggestionsRes.data?.data?.suggestions || []).find((item) => item.vehicle_id === vehicle.id) ||
          null

        setUnits(nextUnits)
        setSuggestion(row)

        const initialId =
          vehicle.wialon_unit_id ||
          row?.suggested_unit_id ||
          row?.wialon_unit_id ||
          nextUnits[0]?.id ||
          ''
        setSelectedUnitId(initialId ? String(initialId) : '')
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Failed to load Wialon units.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [vehicle?.id, vehicle?.wialon_unit_id])

  const handleLink = async (e) => {
    e.preventDefault()
    if (!vehicle?.id || !selectedUnitId) return

    setIsSubmitting(true)
    setError('')
    try {
      await apiInstance.post('/wialon/link', {
        vehicle_id: vehicle.id,
        wialon_unit_id: Number(selectedUnitId),
        wialon_unit_name: selectedUnit?.nm || selectedUnit?.sys_name || null,
      })
      onLinked?.()
      onClose?.()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to link vehicle.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnlink = async () => {
    if (!vehicle?.id) return
    setIsSubmitting(true)
    setError('')
    try {
      await apiInstance.delete(`/wialon/link/${vehicle.id}`)
      onLinked?.()
      onClose?.()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to unlink vehicle.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!vehicle) return null

  return (
    <motion.div
      className="fixed inset-0 z-[80]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        className="absolute left-1/2 top-1/2 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Link Wialon GPS</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {vehicle.plate_number} · {vehicle.model || 'No model'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading Wialon units…
          </div>
        ) : (
          <form onSubmit={handleLink} className="mt-5 space-y-4">
            {suggestion?.suggested_unit_name && !vehicle.wialon_unit_id && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                Suggested match: <strong>{suggestion.suggested_unit_name}</strong>
              </p>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Wialon unit</label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select a unit…</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {(unit.nm || unit.sys_name || `Unit ${unit.id}`) + ` (ID ${unit.id})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button type="submit" disabled={!selectedUnitId || isSubmitting} className="btn-primary">
                <Link2 className="h-4 w-4" />
                {vehicle.wialon_unit_id ? 'Update link' : 'Link unit'}
              </button>
              {vehicle.wialon_unit_id && (
                <button type="button" onClick={handleUnlink} disabled={isSubmitting} className="btn-secondary">
                  <Unlink className="h-4 w-4" />
                  Unlink
                </button>
              )}
              <button type="button" onClick={onClose} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
