import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import {
  LOGISTICS_MODULES,
  EntityIconBadge,
  EntityMapLink,
  EntityStatusBadge,
} from '../../components/logistics/logisticsModuleUi'
import apiInstance from '../../api/axiosInstance'

const REGION_MODULE = LOGISTICS_MODULES.region

function RegionsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Region</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Code</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Boundary</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-16 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-24 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function RegionsPage() {
  const navigate = useNavigate()
  const [regions, setRegions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const controllerRef = useRef(null)

  const load = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/regions', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setRegions(res.data?.data?.regions || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') setRegions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [])

  const openCreate = () => navigate('/global-map?create=region')

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <EntityIconBadge moduleKey="region" />
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{REGION_MODULE.plural}</h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Region territories on the Global Map — boundaries cannot overlap.
                </p>
              </div>
            </div>
            <button type="button" onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Region
            </button>
          </div>

          {isLoading ? (
            <RegionsSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Region</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Code</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Boundary</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Map</th>
                      <th className="w-10 px-2 py-3" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {regions.map((region) => (
                      <tr
                        key={region.id}
                        onClick={() => region.id && navigate(REGION_MODULE.mapDeepLink(region.id))}
                        className="group cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <EntityIconBadge moduleKey="region" size="sm" />
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {region.region_name || region.name || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{region.code || '—'}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                          {region.boundary ? (
                            <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                              Defined
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <EntityStatusBadge isActive={region.is_active !== false} />
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {region.id && <EntityMapLink moduleKey="region" entityId={region.id} className="text-orange-600 dark:text-orange-400" />}
                        </td>
                        <td className="px-2 py-4 text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600">
                          <ChevronRight className="h-4 w-4" />
                        </td>
                      </tr>
                    ))}
                    {regions.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={6}>
                          No regions available.
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
    </DashboardLayout>
  )
}
