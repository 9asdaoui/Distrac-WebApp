import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Loader2, Plus, MapPin, Factory, Warehouse, Zap, X } from 'lucide-react'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import { SmoothSlideOver } from '../components/SmoothSlideOver'
import apiInstance from '../api/axiosInstance'

const TABS = {
  INDUSTRIES: 'industries',
  DEPOTS: 'depots',
  REGIONS: 'regions',
  SECTORS: 'sectors',
}

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  )
}

const BADGE_CLASS = 'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'

const INTERNAL_BADGE = 'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'

const EXTERNAL_BADGE = 'inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200'

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null
  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
        }`}
      >
        <div className="pt-0.5">
          <Zap className="h-4 w-4" />
        </div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button type="button" onClick={onClose} className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="h-12 animate-pulse rounded-lg bg-gray-200 dark:bg-zinc-700" />
      ))}
    </div>
  )
}

function EmptyState({ title, description, onAdd }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800">
        <MapPin className="h-7 w-7 text-zinc-500" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      <button
        type="button"
        onClick={onAdd}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <Plus className="h-4 w-4" />
        Add {title.toLowerCase()}
      </button>
    </div>
  )
}

export function LogisticsPage() {
  const [activeTab, setActiveTab] = useState(TABS.INDUSTRIES)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [industries, setIndustries] = useState([])
  const [depots, setDepots] = useState([])
  const [regions, setRegions] = useState([])
  const [sectors, setSectors] = useState([])

  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createFormData, setCreateFormData] = useState({})
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const controllerRef = useRef(null)

  const loadData = async () => {
    // Cancel any previous requests
    if (controllerRef.current) {
      controllerRef.current.abort()
    }

    // Create new controller for this request
    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)

    try {
      const [industriesRes, depotsRes, regionsRes, sectorsRes] = await Promise.all([
        apiInstance.get('/industries', { signal: controller.signal }).catch(() => ({ data: { data: { industries: [] } } })),
        apiInstance.get('/depots', { signal: controller.signal }).catch(() => ({ data: { data: { depots: [] } } })),
        apiInstance.get('/regions', { signal: controller.signal }).catch(() => ({ data: { data: { regions: [] } } })),
        apiInstance.get('/sectors', { signal: controller.signal }).catch(() => ({ data: { data: { sectors: [] } } })),
      ])

      // Only update state if request wasn't cancelled
      if (!controller.signal.aborted) {
        setIndustries(industriesRes.data?.data?.industries || [])
        setDepots(depotsRes.data?.data?.depots || [])
        setRegions(regionsRes.data?.data?.regions || [])
        setSectors(sectorsRes.data?.data?.sectors || [])
      }
    } catch (error) {
      // Only show error if it's not a cancellation
      if (error.name !== 'CanceledError' && !controller.signal.aborted) {
        setToast({
          message: getErrorMessage(error, 'Failed to load logistics data'),
          type: 'error',
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    return () => {
      // Abort requests when component unmounts
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [])

  useEffect(() => {
    if (!toast.message) return undefined
    const timer = setTimeout(() => setToast({ message: '', type: 'success' }), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const closePanel = () => {
    setIsCreateOpen(false)
    setCreateFormData({})
  }

  const handleCreateIndustry = async (e) => {
    e.preventDefault()
    if (!createFormData.industryName) {
      setToast({ message: 'Industry name is required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/industries', {
        industryName: createFormData.industryName,
        description: createFormData.description || null,
        isInternal: Boolean(createFormData.isInternal),
        isActive: true,
      })

      setToast({ message: 'Industry created successfully', type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create industry'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateDepot = async (e) => {
    e.preventDefault()
    if (!createFormData.depotName) {
      setToast({ message: 'Depot name is required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/depots', {
        depotName: createFormData.depotName,
        address: createFormData.address || null,
        gpsLatitude: createFormData.gpsLatitude ? parseFloat(createFormData.gpsLatitude) : null,
        gpsLongitude: createFormData.gpsLongitude ? parseFloat(createFormData.gpsLongitude) : null,
        totalPriceCapacity: createFormData.totalPriceCapacity ? parseFloat(createFormData.totalPriceCapacity) : 0,
        isActive: true,
      })

      setToast({ message: 'Depot created successfully', type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create depot'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateSector = async (e) => {
    e.preventDefault()
    if (!createFormData.sectorName) {
      setToast({ message: 'Sector name is required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/sectors', {
        sectorName: createFormData.sectorName,
        regionId: createFormData.regionId || null,
        depotId: createFormData.depotId || null,
        isActive: true,
      })

      setToast({ message: 'Sector created successfully', type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create sector'),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderTabContent = () => {
    if (isLoading) return <LoadingSkeleton />

    switch (activeTab) {
      case TABS.INDUSTRIES:
        if (industries.length === 0) {
          return (
            <EmptyState
              title="Industries"
              description="Create your first industry to organize your logistics operations."
              onAdd={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
            />
          )
        }
        return (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {industries.map((industry) => (
                    <tr key={industry.id} className="border-b border-gray-200 dark:border-zinc-800">
                      <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{industry.industry_name}</td>
                      <td className="px-6 py-4">
                        <span className={industry.is_internal ? INTERNAL_BADGE : EXTERNAL_BADGE}>
                          {industry.is_internal ? 'Internal' : 'External'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{industry.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )

      case TABS.DEPOTS:
        if (depots.length === 0) {
          return (
            <EmptyState
              title="Depots"
              description="Create your first depot to manage inventory and operations."
              onAdd={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
            />
          )
        }
        return (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Address</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Capacity Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {depots.map((depot) => {
                    const capacity = depot.capacity_usage || { used_percentage: 0 }
                    return (
                      <tr key={depot.id} className="border-b border-gray-200 dark:border-zinc-800">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{depot.depot_name}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{depot.address || '-'}</td>
                        <td className="px-6 py-4">
                          <div className="w-48 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{capacity.used_percentage || 0}%</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-zinc-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all"
                                style={{ width: `${Math.min(capacity.used_percentage || 0, 100)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )

      case TABS.SECTORS:
        if (sectors.length === 0) {
          return (
            <EmptyState
              title="Sectors"
              description="Create your first sector to organize geographic areas."
              onAdd={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
            />
          )
        }
        return (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
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
                </tbody>
              </table>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const getCreateForm = () => {
    switch (activeTab) {
      case TABS.INDUSTRIES:
        return (
          <form className="space-y-6" onSubmit={handleCreateIndustry}>
            <div>
              <label htmlFor="industryName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Industry Name
              </label>
              <input
                id="industryName"
                type="text"
                value={createFormData.industryName || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, industryName: e.target.value })}
                placeholder="e.g. Electronics"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="description" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                id="description"
                value={createFormData.description || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                placeholder="Brief description of the industry"
                rows="3"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={Boolean(createFormData.isInternal)}
                onChange={(e) => setCreateFormData({ ...createFormData, isInternal: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Internal Industry</span>
            </label>
            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
              <button type="button" onClick={closePanel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-60">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )

      case TABS.DEPOTS:
        return (
          <form className="space-y-6" onSubmit={handleCreateDepot}>
            <div>
              <label htmlFor="depotName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Depot Name
              </label>
              <input
                id="depotName"
                type="text"
                value={createFormData.depotName || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, depotName: e.target.value })}
                placeholder="e.g. Main Warehouse"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="address" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Address
              </label>
              <input
                id="address"
                type="text"
                value={createFormData.address || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, address: e.target.value })}
                placeholder="Physical location"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="gpsLatitude" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  GPS Latitude
                </label>
                <input
                  id="gpsLatitude"
                  type="number"
                  step="0.0001"
                  value={createFormData.gpsLatitude || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, gpsLatitude: e.target.value })}
                  placeholder="e.g. 36.5"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
              <div>
                <label htmlFor="gpsLongitude" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  GPS Longitude
                </label>
                <input
                  id="gpsLongitude"
                  type="number"
                  step="0.0001"
                  value={createFormData.gpsLongitude || ''}
                  onChange={(e) => setCreateFormData({ ...createFormData, gpsLongitude: e.target.value })}
                  placeholder="e.g. 2.7"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>
            </div>
            <div>
              <label htmlFor="totalPriceCapacity" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Price Capacity
              </label>
              <input
                id="totalPriceCapacity"
                type="number"
                step="0.01"
                value={createFormData.totalPriceCapacity || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, totalPriceCapacity: e.target.value })}
                placeholder="Maximum price value in storage"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
              <button type="button" onClick={closePanel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-60">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )

      case TABS.SECTORS:
        return (
          <form className="space-y-6" onSubmit={handleCreateSector}>
            <div>
              <label htmlFor="sectorName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sector Name
              </label>
              <input
                id="sectorName"
                type="text"
                value={createFormData.sectorName || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, sectorName: e.target.value })}
                placeholder="e.g. North Zone"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            <div>
              <label htmlFor="depotId" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Assign to Depot
              </label>
              <select
                id="depotId"
                value={createFormData.depotId || ''}
                onChange={(e) => setCreateFormData({ ...createFormData, depotId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Select a depot</option>
                {depots.map((depot) => (
                  <option key={depot.id} value={depot.id}>
                    {depot.depot_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
              <button type="button" onClick={closePanel} className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary flex-1 disabled:opacity-60">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Create
              </button>
            </div>
          </form>
        )

      default:
        return null
    }
  }

  return (
    <DashboardLayout>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />

      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Logistics Management</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Manage industries, depots, regions, and sectors.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateFormData({})
                setIsCreateOpen(true)
              }}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Add item
            </button>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-zinc-800">
              {Object.values(TABS).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium transition ${
                    activeTab === tab
                      ? 'border-b-2 border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {renderTabContent()}
          </div>
        </div>
      </AnimatedPage>

      <SmoothSlideOver isOpen={isCreateOpen} onClose={closePanel} title={`Add ${activeTab.slice(0, -1)}`} description="Fill in the details below to create a new item.">
        {getCreateForm()}
      </SmoothSlideOver>
    </DashboardLayout>
  )
}
