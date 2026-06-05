import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import { SectorBoundaryDrawer, isValidSectorPolygon } from '../../components/SectorBoundaryDrawer'
import {
  LOGISTICS_MODULES,
  EntityIconBadge,
  EntitySegmentedControl,
  EntityStatusBadge,
} from '../../components/logistics/logisticsModuleUi'
import apiInstance from '../../api/axiosInstance'

const SECTOR_MODULE = LOGISTICS_MODULES.sector

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
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function SectorsPage() {
  const navigate = useNavigate()
  const [sectors, setSectors] = useState([])
  const [regions, setRegions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState({
    sectorName: '',
    regionId: '',
    boundary: null,
    assignedProfileId: '',
    isActive: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [mapDrawerKey, setMapDrawerKey] = useState(0)
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
    setForm({ sectorName: '', regionId: '', boundary: null, assignedProfileId: '', isActive: true })
    setFormError('')
    setMapDrawerKey((key) => key + 1)
    setIsCreateOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sectorName.trim()) {
      setFormError('Sector name is required.')
      return
    }
    if (!isValidSectorPolygon(form.boundary)) {
      setFormError('Draw the sector boundary: Start drawing → click corners → Done.')
      return
    }
    setIsSubmitting(true)
    setFormError('')
    try {
      const res = await apiInstance.post('/sectors', {
        sectorName: form.sectorName.trim(),
        regionId: form.regionId || undefined,
        boundary: form.boundary,
        assignedProfileId: form.assignedProfileId || null,
        isActive: form.isActive,
      })
      const created = res.data?.data?.sector
      setIsCreateOpen(false)
      await load()
      if (created?.id) navigate(SECTOR_MODULE.detailPath(created.id))
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
            <div className="flex min-w-0 items-start gap-3">
              <EntityIconBadge moduleKey="sector" />
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{SECTOR_MODULE.plural}</h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Coverage sectors with boundaries on the Global Map.
                </p>
              </div>
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
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="w-10 px-2 py-3" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map((sector) => (
                      <tr
                        key={sector.id}
                        onClick={() => navigate(SECTOR_MODULE.detailPath(sector.id))}
                        className="group cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <EntityIconBadge moduleKey="sector" size="sm" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{sector.sector_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{sector.regions?.region_name || '—'}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{sector.depots?.depot_name || '—'}</td>
                        <td className="px-6 py-4">
                          <EntityStatusBadge isActive={sector.is_active !== false} />
                        </td>
                        <td className="px-2 py-4 text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600">
                          <ChevronRight className="h-4 w-4" />
                        </td>
                      </tr>
                    ))}
                    {sectors.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={5}>
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

      <SlideOverPanel
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidthClass="max-w-2xl"
        title={
          <span className="inline-flex items-center gap-2.5">
            <EntityIconBadge moduleKey="sector" size="sm" />
            Add Sector
          </span>
        }
        description="Draw the boundary — it appears on the Global Map."
        footer={
          <div className="flex gap-2">
            <button type="submit" form="sector-create-form" disabled={isSubmitting} className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900">
              {isSubmitting ? 'Creating…' : 'Create Sector'}
            </button>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              Cancel
            </button>
          </div>
        }
      >
              <form id="sector-create-form" onSubmit={handleSubmit} className="space-y-5">
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
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Sector boundary <span className="text-red-500">*</span>
                  </label>
                  <SectorBoundaryDrawer
                    key={mapDrawerKey}
                    value={form.boundary}
                    onChange={(boundary) => setForm((prev) => ({ ...prev, boundary }))}
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
                  <EntitySegmentedControl
                    value={form.isActive}
                    onChange={(v) => setForm({ ...form, isActive: v })}
                    options={[
                      { value: true, label: 'Active' },
                      { value: false, label: 'Inactive' },
                    ]}
                  />
                </div>

                {formError && <p className="text-sm text-red-500">{formError}</p>}
              </form>
      </SlideOverPanel>
    </DashboardLayout>
  )
}
