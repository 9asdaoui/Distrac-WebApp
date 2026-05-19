import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'

function SectorsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Sector</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Region</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SectorsPage() {
  const [sectors, setSectors] = useState([])
  const [regions, setRegions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    sectorName: '',
    regionId: '',
    boundary: '',
    assignedProfileId: '',
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
      const res = await apiInstance.get('/sectors', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setSectors(res.data?.data?.sectors || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') setSectors([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    apiInstance.get('/regions').then((r) => setRegions(r.data?.data?.regions || [])).catch(() => {})
    return () => controllerRef.current?.abort()
  }, [])

  const openCreate = () => {
    setForm({ sectorName: '', regionId: '', boundary: '', assignedProfileId: '', isActive: true })
    setFormError('')
    setIsCreateOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sectorName.trim()) {
      setFormError('Sector name is required.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/sectors', {
        sectorName: form.sectorName,
        regionId: form.regionId || undefined,
        boundary: form.boundary || undefined,
        assignedProfileId: form.assignedProfileId || null,
        isActive: form.isActive,
      })
      setIsCreateOpen(false)
      load()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create sector.')
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
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Sectors</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage sectors and link them to regions.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <Plus className="h-4 w-4" />
              Add Sector
            </button>
          </div>

          {isLoading ? (
            <SectorsSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Sector</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Region</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map((sector) => (
                      <tr key={sector.id} className="border-b border-gray-200 dark:border-zinc-800">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{sector.sector_name}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{sector.regions?.region_name || '-'}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{sector.depots?.depot_name || '-'}</td>
                      </tr>
                    ))}
                    {sectors.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>
                          No sectors available.
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Add Sector</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create a new sector and define its operational metadata.</p>
                </div>
                <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Sector Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.sectorName}
                    onChange={(e) => setForm({ ...form, sectorName: e.target.value })}
                    placeholder="e.g. Bab Ezzouar Nord"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Region</label>
                  <select
                    value={form.regionId}
                    onChange={(e) => setForm({ ...form, regionId: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    <option value="">No region</option>
                    {regions.map((region) => (
                      <option key={region.id} value={region.id}>{region.region_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Boundary (GeoJSON/Text)</label>
                  <textarea
                    rows={3}
                    value={form.boundary}
                    onChange={(e) => setForm({ ...form, boundary: e.target.value })}
                    placeholder="Optional boundary payload"
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Assigned Profile ID</label>
                  <input
                    type="text"
                    value={form.assignedProfileId}
                    onChange={(e) => setForm({ ...form, assignedProfileId: e.target.value })}
                    placeholder="Optional UUID"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
                  <div className="flex gap-3">
                    {[{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }].map((opt) => (
                      <button
                        key={String(opt.value)}
                        type="button"
                        onClick={() => setForm({ ...form, isActive: opt.value })}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                          form.isActive === opt.value
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'border-gray-200 text-zinc-500 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-500'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && <p className="text-sm text-red-500">{formError}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={isSubmitting} className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900">
                    {isSubmitting ? 'Creating…' : 'Create Sector'}
                  </button>
                  <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900">
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
