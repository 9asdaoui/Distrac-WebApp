import React, { useEffect, useRef, useState } from 'react'
import { Factory, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'

function IndustriesSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Industry</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Description</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-56 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function IndustriesPage() {
  const [industries, setIndustries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ industryName: '', description: '', isInternal: false, isActive: true })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const controllerRef = useRef(null)

  const load = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/industries', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setIndustries(res.data?.data?.industries || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') {
        setIndustries([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [])

  const openCreate = () => {
    setForm({ industryName: '', description: '', isInternal: false, isActive: true })
    setFormError('')
    setIsCreateOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.industryName.trim()) { setFormError('Industry name is required.'); return }
    setIsSubmitting(true)
    setFormError('')
    try {
      await apiInstance.post('/industries', form)
      setIsCreateOpen(false)
      load()
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create industry.')
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
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Industries</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Manage internal and external industries used in logistics operations.</p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
              <Plus className="h-4 w-4" />
              Add Industry
            </button>
          </div>

          {isLoading ? (
            <IndustriesSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Industry</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {industries.map((industry) => (
                      <tr key={industry.id} className="border-b border-gray-200 dark:border-zinc-800">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{industry.industry_name}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{industry.is_internal ? 'Internal' : 'External'}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{industry.description || '-'}</td>
                      </tr>
                    ))}
                    {industries.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>
                          No industries available.
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

      {/* Create slide-over */}
      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            className="fixed inset-0 z-[60]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsCreateOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Add Industry</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create a new industry entry for logistics operations.</p>
                </div>
                <button type="button" onClick={() => setIsCreateOpen(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Industry Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.industryName}
                    onChange={(e) => setForm({ ...form, industryName: e.target.value })}
                    placeholder="e.g. Agroalimentaire Sarl"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Description</label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Optional description…"
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Type</label>
                  <div className="flex gap-3">
                    {[{ value: false, label: 'External' }, { value: true, label: 'Internal' }].map((opt) => (
                      <button key={String(opt.value)} type="button"
                        onClick={() => setForm({ ...form, isInternal: opt.value })}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                          form.isInternal === opt.value
                            ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                            : 'border-gray-200 text-zinc-500 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-500'
                        }`}
                      >{opt.label}</button>
                    ))}
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
                    className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                    {isSubmitting ? 'Creating…' : 'Create Industry'}
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
