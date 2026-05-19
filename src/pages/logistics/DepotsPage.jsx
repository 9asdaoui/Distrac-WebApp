import React, { useEffect, useRef, useState } from 'react'
import { Warehouse, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'

function DepotsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Address</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Capacity Utilization</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-56 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function DepotsPage() {
  const [depots, setDepots] = useState([])
  const [sectorsForAssign, setSectorsForAssign] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    depotName: '',
    address: '',
    gpsLatitude: '',
    gpsLongitude: '',
    totalPriceCapacity: '',
    totalVolumeCapacity: '',
    sectorIds: [],
    isActive: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const controllerRef = useRef(null)

  const load = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/depots', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setDepots(res.data?.data?.depots || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') setDepots([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    apiInstance.get('/sectors').then((r) => setSectorsForAssign(r.data?.data?.sectors || [])).catch(() => {})
    return () => controllerRef.current?.abort()
  }, [])

  const openCreate = () => {
    setForm({
      depotName: '',
      address: '',
      gpsLatitude: '',
      gpsLongitude: '',
      totalPriceCapacity: '',
      totalVolumeCapacity: '',
      sectorIds: [],
      isActive: true,
    })
    setFormError('')
    setIsCreateOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.depotName.trim()) { setFormError('Depot name is required.'); return }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/depots', {
        depotName: form.depotName,
        address: form.address,
        gpsLatitude: form.gpsLatitude === '' ? undefined : Number(form.gpsLatitude),
        gpsLongitude: form.gpsLongitude === '' ? undefined : Number(form.gpsLongitude),
        totalPriceCapacity: form.totalPriceCapacity ? Number(form.totalPriceCapacity) : 0,
        totalVolumeCapacity: form.totalVolumeCapacity ? Number(form.totalVolumeCapacity) : 0,
        sectorIds: form.sectorIds,
        isActive: form.isActive,
      })
      setIsCreateOpen(false)
      load()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create depot.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Depots</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage warehouse depots, addresses, and capacity utilization.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
              <Plus className="h-4 w-4" />
              Add Depot
            </button>
          </div>

          {isLoading ? (
            <DepotsSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Address</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Capacity Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {depots.map((depot) => {
                      const used = Math.min(depot.capacity_usage?.used_percentage || 0, 100)
                      return (
                        <tr key={depot.id} className="border-b border-gray-200 dark:border-zinc-800">
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{depot.depot_name}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{depot.address || '-'}</td>
                          <td className="px-6 py-4">
                            <div className="w-48 space-y-1">
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{used}%</span>
                              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-700">
                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600" style={{ width: `${used}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                    {depots.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>
                          No depots available.
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

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.div
              className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Add Depot</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create a new warehouse depot.</p>
                </div>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Depot Name <span className="text-red-500">*</span></label>
                  <input type="text" value={form.depotName} onChange={(e) => setForm({ ...form, depotName: e.target.value })}
                    placeholder="e.g. Depot Nord"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Address</label>
                  <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. Zone Industrielle, Alger"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Price Capacity (DA)</label>
                  <input type="number" min="0" value={form.totalPriceCapacity} onChange={(e) => setForm({ ...form, totalPriceCapacity: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Volume Capacity</label>
                  <input type="number" min="0" value={form.totalVolumeCapacity} onChange={(e) => setForm({ ...form, totalVolumeCapacity: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">GPS Latitude</label>
                    <input type="number" step="any" min="-90" max="90" value={form.gpsLatitude}
                      onChange={(e) => setForm({ ...form, gpsLatitude: e.target.value })}
                      placeholder="e.g. 36.7538"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">GPS Longitude</label>
                    <input type="number" step="any" min="-180" max="180" value={form.gpsLongitude}
                      onChange={(e) => setForm({ ...form, gpsLongitude: e.target.value })}
                      placeholder="e.g. 3.0588"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Assign Sectors</label>
                  <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3 dark:border-zinc-700">
                    {sectorsForAssign.map((sector) => {
                      const checked = form.sectorIds.includes(sector.id)
                      return (
                        <label key={sector.id} className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800">
                          <span>{sector.sector_name}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, sectorIds: [...form.sectorIds, sector.id] })
                              } else {
                                setForm({ ...form, sectorIds: form.sectorIds.filter((id) => id !== sector.id) })
                              }
                            }}
                          />
                        </label>
                      )
                    })}
                    {sectorsForAssign.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">No sectors found.</p>}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                  <div className="flex gap-3">
                    {[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }].map((opt) => (
                      <button key={String(opt.value)} type="button"
                        onClick={() => setForm({ ...form, isActive: opt.value })}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                          form.isActive === opt.value
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'border-gray-200 text-zinc-500 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-500'
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
                {formError && <p className="text-sm text-red-500">{formError}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900">
                    {isSubmitting ? 'Creating…' : 'Create Depot'}
                  </button>
                  <button type="button" onClick={() => setIsCreateOpen(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
