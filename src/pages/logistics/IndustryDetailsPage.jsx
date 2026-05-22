import React, { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Factory,
  FileText,
  Clock,
  PackageCheck,
  Users,
  PackageOpen,
} from 'lucide-react'
import { AnimatedPage } from '../../components/AnimatedPage'
import { LocationMap, hasGpsCoordinates } from '../../components/LocationMap'
import { LocationMapEmpty } from '../../components/LocationMapEmpty'
import apiInstance from '../../api/axiosInstance'

const TABS = [
  { id: 'orders', label: 'Fulfillment Orders' },
  { id: 'staff', label: 'Assigned Staff' },
]

const STATUS_META = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  APPROVED: 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200',
  READY: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200',
  SHIPPED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  FULFILLED: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  CANCELLED: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400',
}

function StatusBadge({ status }) {
  const cls = STATUS_META[status] || 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status || '—'}
    </span>
  )
}

function TypeBadge({ isInternal }) {
  return isInternal ? (
    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
      Internal
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200">
      External
    </span>
  )
}

function DetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="h-10 w-72 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, sublabel }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
          <Icon className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
          {sublabel && <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">{sublabel}</p>}
        </div>
      </div>
    </div>
  )
}

function FulfillmentOrdersTable({ orders }) {
  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-16 dark:border-zinc-700 dark:bg-zinc-900/50">
        <PackageOpen className="mb-3 h-10 w-10 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No fulfillment orders</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Orders will appear here when stock requests are approved for this industry.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Order ID</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Target Depot</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Date</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                <td className="px-6 py-4 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                  {order.id ? `${order.id.slice(0, 8)}…` : '—'}
                </td>
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                  {order.depots?.depot_name || '—'}
                </td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StaffTable({ staff }) {
  if (!staff?.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-16 dark:border-zinc-700 dark:bg-zinc-900/50">
        <Users className="mb-3 h-10 w-10 text-zinc-400 dark:text-zinc-500" />
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">No staff assigned</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Assign users to this industry via user management assignments.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Role</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Contact</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => (
              <tr key={member.id} className="border-b border-gray-200 last:border-0 dark:border-zinc-800">
                <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{member.full_name || '—'}</td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{member.role || '—'}</td>
                <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                  <p>{member.email || '—'}</p>
                  {member.phone && <p className="mt-0.5 text-xs">{member.phone}</p>}
                </td>
                <td className="px-6 py-4 capitalize text-zinc-500 dark:text-zinc-400">{member.status || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function IndustryDetailsPage() {
  const { id } = useParams()
  const [industry, setIndustry] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('orders')
  const controllerRef = useRef(null)

  useEffect(() => {
    if (!id) return undefined

    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const res = await apiInstance.get(`/industries/${id}`, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setIndustry(res.data?.data?.industry || null)
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && !controller.signal.aborted) {
          setIndustry(null)
          setError(err?.response?.data?.message || 'Failed to load industry details.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controllerRef.current?.abort()
  }, [id])

  const stats = industry?.workload_stats || {}

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-7xl space-y-8 p-8">
        {isLoading ? (
          <DetailsSkeleton />
        ) : error || !industry ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-500/30 dark:bg-red-500/10">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error || 'Industry not found.'}</p>
            <Link
              to="/industries"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Industries
            </Link>
          </div>
        ) : (
          <>
            <header className="space-y-4">
              <Link
                to="/industries"
                className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Industries
              </Link>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {industry.industry_name}
                </h1>
                <TypeBadge isInternal={industry.is_internal} />
                {!industry.is_active && (
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                    Inactive
                  </span>
                )}
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <Factory className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Type</p>
                    <div className="mt-2">
                      <TypeBadge isInternal={industry.is_internal} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:col-span-2 lg:col-span-1">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    <FileText className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Description</p>
                    <p className="mt-1 line-clamp-3 text-sm text-zinc-900 dark:text-zinc-100">
                      {industry.description || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <KpiCard
                icon={Clock}
                label="Pending Orders"
                value={stats.pending_count?.toLocaleString() ?? '0'}
                sublabel="Status: PENDING"
              />

              <KpiCard
                icon={PackageCheck}
                label="Completed / Shipped"
                value={stats.completed_count?.toLocaleString() ?? '0'}
                sublabel="Status: SHIPPED or FULFILLED"
              />
            </div>

            <section>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Location Map</h2>
              {hasGpsCoordinates(industry.gps_latitude, industry.gps_longitude) ? (
                <LocationMap
                  lat={industry.gps_latitude}
                  lng={industry.gps_longitude}
                  name={industry.industry_name}
                  className="h-80"
                />
              ) : (
                <LocationMapEmpty />
              )}
            </section>

            <div>
              <nav className="flex gap-8 border-b border-gray-200 dark:border-zinc-800">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-zinc-900 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                    )}
                  </button>
                ))}
              </nav>

              <div className="mt-6">
                {activeTab === 'orders' && (
                  <FulfillmentOrdersTable orders={industry.fulfillment_orders} />
                )}
                {activeTab === 'staff' && <StaffTable staff={industry.staff} />}
              </div>
            </div>
          </>
        )}
      </div>
    </AnimatedPage>
  )
}
