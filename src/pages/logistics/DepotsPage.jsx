import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import {
  LOGISTICS_MODULES,
  EntityIconBadge,
  EntitySegmentedControl,
  EntityStatusBadge,
  formatGpsLocation,
} from '../../components/logistics/logisticsModuleUi'
import apiInstance from '../../api/axiosInstance'

const DEPOT_MODULE = LOGISTICS_MODULES.depot

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
  const navigate = useNavigate()
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
      const res = await apiInstance.post('/depots', {
        depotName: form.depotName,
        address: form.address,
        gpsLatitude: form.gpsLatitude === '' ? undefined : Number(form.gpsLatitude),
        gpsLongitude: form.gpsLongitude === '' ? undefined : Number(form.gpsLongitude),
        totalPriceCapacity: form.totalPriceCapacity ? Number(form.totalPriceCapacity) : 0,
        totalVolumeCapacity: form.totalVolumeCapacity ? Number(form.totalVolumeCapacity) : 0,
        sectorIds: form.sectorIds,
        isActive: form.isActive,
      })
      const created = res.data?.data?.depot
      setIsCreateOpen(false)
      await load()
      if (created?.id) navigate(DEPOT_MODULE.detailPath(created.id))
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
            <div className="flex min-w-0 items-start gap-3">
              <EntityIconBadge moduleKey="depot" />
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{DEPOT_MODULE.plural}</h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Warehouse depots linked to the Global Map and capacity tracking.
                </p>
              </div>
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
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Location</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Capacity</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="w-10 px-2 py-3" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {depots.map((depot) => {
                      const used = Math.min(depot.capacity_usage?.used_percentage || 0, 100)
                      return (
                        <tr
                          key={depot.id}
                          onClick={() => navigate(DEPOT_MODULE.detailPath(depot.id))}
                          className="group cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <EntityIconBadge moduleKey="depot" size="sm" />
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">{depot.depot_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            {formatGpsLocation(depot.gps_latitude, depot.gps_longitude)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-32 space-y-1">
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{used}%</span>
                              <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-zinc-700">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${used}%` }} />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <EntityStatusBadge isActive={depot.is_active} />
                          </td>
                          <td className="px-2 py-4 text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600">
                            <ChevronRight className="h-4 w-4" />
                          </td>
                        </tr>
                      )
                    })}
                    {depots.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={5}>
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

      <SlideOverPanel
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        maxWidthClass="max-w-lg"
        title={
          <span className="inline-flex items-center gap-2.5">
            <EntityIconBadge moduleKey="depot" size="sm" />
            Add Depot
          </span>
        }
        description="GPS coordinates place this depot on the Global Map."
        footer={
          <div className="flex gap-2">
            <button type="submit" form="depot-create-form" disabled={isSubmitting} className="flex-1 rounded-lg bg-zinc-900 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900">
              {isSubmitting ? 'Creating…' : 'Create Depot'}
            </button>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
              Cancel
            </button>
          </div>
        }
      >
              <form id="depot-create-form" onSubmit={handleSubmit} className="space-y-5">
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
