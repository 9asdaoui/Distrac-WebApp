import React, { useEffect, useRef, useState } from 'react'
import { DollarSign, TrendingDown, Users, Truck } from 'lucide-react'
import { motion } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import {
  getAuthRoleName,
  isDepotSupervisorRole,
} from '../../components/map/ccPanelRegistry'
import { useAuth } from '../../context/AuthContext'
import { PERMISSIONS } from '../../config/permissions'
import { RevenueDepotPanel } from './RevenueDepotPanel'
import { DepotCashHandoffSection } from './DepotCashHandoffSection'
import apiInstance from '../../api/axiosInstance'

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-cc-surface">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
        {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500">{sub}</p>}
      </div>
    </div>
  )
}

function TableSkeleton({ cols }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              {cols.map((c) => (
                <th key={c} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3].map((row) => (
              <motion.tr key={row} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: row * 0.06 }}
                className="border-b border-gray-200 dark:border-zinc-800">
                {cols.map((_, i) => (
                  <td key={i} className="px-6 py-4">
                    <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" />
                  </td>
                ))}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SupervisorDebtView() {
  const { user, hasPermission } = useAuth()
  const role = getAuthRoleName(user)
  const showCashHandoff =
    role === 'GENERAL_MANAGEMENT' || hasPermission(PERMISSIONS.DEPOSIT_CASH)

  const [supervisors, setSupervisors] = useState([])
  const [livreurs, setLivreurs] = useState([])
  const [isLoadingSup, setIsLoadingSup] = useState(true)
  const [isLoadingLiv, setIsLoadingLiv] = useState(true)
  const controllerRef = useRef(null)

  useEffect(() => {
    const controller = new AbortController()
    controllerRef.current = controller

    const loadSupervisors = async () => {
      setIsLoadingSup(true)
      try {
        const res = await apiInstance.get('/reports/debt/summary', { signal: controller.signal })
        if (!controller.signal.aborted) {
          setSupervisors(res.data?.data?.summary || [])
        }
      } catch (e) {
        if (e.name !== 'CanceledError') setSupervisors([])
      } finally {
        setIsLoadingSup(false)
      }
    }

    const loadLivreurs = async () => {
      setIsLoadingLiv(true)
      try {
        const res = await apiInstance.get('/reports/debt/livreurs', { signal: controller.signal })
        if (!controller.signal.aborted) {
          setLivreurs(res.data?.data?.livreurs || [])
        }
      } catch (e) {
        if (e.name !== 'CanceledError') setLivreurs([])
      } finally {
        setIsLoadingLiv(false)
      }
    }

    loadSupervisors()
    loadLivreurs()
    return () => controller.abort()
  }, [])

  const totalSupervisorDebt = supervisors.reduce((sum, s) => sum + (s.total_responsibility_amount || 0), 0)
  const totalCarriedCash   = livreurs.reduce((sum, l) => sum + (l.carried_cash_amount || 0), 0)

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-cc-surface md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Revenue</h1>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Responsibility ledger and carried cash overview.</p>
              </div>
            </div>
          </div>

          {showCashHandoff ? (
            <DepotCashHandoffSection variant="page" />
          ) : null}

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Supervisors with Debt"
              value={isLoadingSup ? '—' : supervisors.length}
              sub="active responsibility entries"
              color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
            />
            <StatCard
              icon={TrendingDown}
              label="Total Supervisor Debt"
              value={isLoadingSup ? '—' : `${Number(totalSupervisorDebt).toLocaleString()} DA`}
              sub="pending + delayed + collected"
              color="bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
            />
            <StatCard
              icon={Truck}
              label="Livreurs Carrying Cash"
              value={isLoadingLiv ? '—' : livreurs.length}
              sub="with collected status"
              color="bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
            />
            <StatCard
              icon={DollarSign}
              label="Total Carried Cash"
              value={isLoadingLiv ? '—' : `${Number(totalCarriedCash).toLocaleString()} DA`}
              sub="awaiting depot deposit"
              color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
            />
          </div>

          {/* Supervisor debt table */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Supervisor Responsibility</h2>
            {isLoadingSup ? (
              <TableSkeleton cols={['Supervisor', 'Email', 'Active Entries', 'Total Responsibility']} />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Supervisor</th>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Email</th>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Active Entries</th>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Total Responsibility</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisors.map((s, i) => (
                        <motion.tr
                          key={s.supervisor_id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-gray-200 dark:border-zinc-800"
                        >
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                            {s.supervisor_name || '—'}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{s.supervisor_email || '—'}</td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{s.active_entries}</td>
                          <td className="px-6 py-4 font-semibold text-red-600 dark:text-red-400">
                            {Number(s.total_responsibility_amount).toLocaleString()} DA
                          </td>
                        </motion.tr>
                      ))}
                      {supervisors.length === 0 && (
                        <tr>
                          <td className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={4}>
                            No active supervisor debts found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Livreur carried cash table */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Livreur Carried Cash</h2>
            {isLoadingLiv ? (
              <TableSkeleton cols={['Livreur', 'Email', 'Collected Entries', 'Cash Carried']} />
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-zinc-800/50">
                      <tr>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Livreur</th>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Email</th>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Collected Entries</th>
                        <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Cash Carried</th>
                      </tr>
                    </thead>
                    <tbody>
                      {livreurs.map((l, i) => (
                        <motion.tr
                          key={l.livreur_id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-gray-200 dark:border-zinc-800"
                        >
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                            {l.livreur_name || '—'}
                          </td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{l.livreur_email || '—'}</td>
                          <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{l.collected_entries}</td>
                          <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                            {Number(l.carried_cash_amount).toLocaleString()} DA
                          </td>
                        </motion.tr>
                      ))}
                      {livreurs.length === 0 && (
                        <tr>
                          <td className="px-6 py-12 text-center text-zinc-500 dark:text-zinc-400" colSpan={4}>
                            No livreurs currently carrying cash.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}

export function DebtPage() {
  const { user } = useAuth()
  if (isDepotSupervisorRole(user)) {
    return (
      <DashboardLayout>
        <RevenueDepotPanel />
      </DashboardLayout>
    )
  }
  return <SupervisorDebtView />
}
