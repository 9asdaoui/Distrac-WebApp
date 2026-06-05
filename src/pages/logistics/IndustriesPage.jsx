import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, Search } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import {
  EMPTY_INDUSTRY_FORM,
  IndustryFormFields,
  formatIndustryLocation,
  industryFormToPayload,
} from '../../components/logistics/IndustryFormFields'
import { IndustryTypeBadge } from '../../components/logistics/IndustryDetailsContent'
import {
  LOGISTICS_MODULES,
  EntityIconBadge,
  EntityStatusBadge,
} from '../../components/logistics/logisticsModuleUi'

const INDUSTRY_MODULE = LOGISTICS_MODULES.industry
import apiInstance from '../../api/axiosInstance'

function IndustriesSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-800/50">
            <tr>
              {['Name', 'Type', 'Location', 'Status'].map((col) => (
                <th key={col} className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-4 w-36 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-4 w-28 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-4 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function IndustriesPage() {
  const navigate = useNavigate()
  const [industries, setIndustries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_INDUSTRY_FORM })
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

  const filteredIndustries = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return industries
    return industries.filter((row) =>
      [row.industry_name, row.description, row.is_internal ? 'internal' : 'external']
        .some((part) => String(part ?? '').toLowerCase().includes(q)),
    )
  }, [industries, search])

  const openCreate = () => {
    setForm({ ...EMPTY_INDUSTRY_FORM })
    setFormError('')
    setIsCreateOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.industryName.trim()) {
      setFormError('Industry name is required.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      const res = await apiInstance.post('/industries', industryFormToPayload(form))
      const created = res.data?.data?.industry
      setIsCreateOpen(false)
      await load()
      if (created?.id) {
        navigate(INDUSTRY_MODULE.detailPath(created.id))
      }
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
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <EntityIconBadge moduleKey="industry" size="md" />
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{INDUSTRY_MODULE.plural}</h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Manage internal and external industries — linked to the Global Map.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              <Plus className="h-4 w-4" />
              Add Industry
            </button>
          </div>

          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search industries…"
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
            />
          </div>

          {isLoading ? (
            <IndustriesSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Name</th>
                      <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Type</th>
                      <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Location</th>
                      <th className="px-6 py-3 text-xs font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                      <th className="w-10 px-2 py-3" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIndustries.map((industry) => (
                      <tr
                        key={industry.id}
                        onClick={() => navigate(INDUSTRY_MODULE.detailPath(industry.id))}
                        className="group cursor-pointer border-t border-zinc-100 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <EntityIconBadge moduleKey="industry" size="sm" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {industry.industry_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <IndustryTypeBadge isInternal={industry.is_internal} />
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                          {formatIndustryLocation(industry)}
                        </td>
                        <td className="px-6 py-4">
                          <EntityStatusBadge isActive={industry.is_active} />
                        </td>
                        <td className="px-2 py-4 text-zinc-300 transition group-hover:text-zinc-500 dark:text-zinc-600 dark:group-hover:text-zinc-400">
                          <ChevronRight className="h-4 w-4" />
                        </td>
                      </tr>
                    ))}
                    {filteredIndustries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                          {search.trim() ? 'No industries match your search.' : 'No industries available.'}
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

      <SlideOverPanel
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidthClass="max-w-md"
        title={
          <span className="inline-flex items-center gap-2.5">
            <EntityIconBadge moduleKey="industry" size="sm" />
            Add Industry
          </span>
        }
        description="GPS coordinates place this industry on the Global Map."
        footer={
          <div className="flex gap-2">
            <button
              type="submit"
              form="industry-create-form"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {isSubmitting ? 'Creating…' : 'Create Industry'}
            </button>
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
          </div>
        }
      >
        <form id="industry-create-form" onSubmit={handleSubmit} className="space-y-5">
          <IndustryFormFields
            form={form}
            onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
          />
          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </form>
      </SlideOverPanel>
    </DashboardLayout>
  )
}
