import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Plus, UserPlus, Users, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import { DataTable } from '../components/DataTable'
import apiInstance from '../api/axiosInstance'

const emptyFormState = {
  fullName: '',
  email: '',
  password: '',
  phone: '',
  role: '',
  activeEntityType: 'SECTOR',
  selectionsByType: {
    SECTOR: [],
    DEPOT: [],
    INDUSTRY: [],
  },
}

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  )
}

const displayRoleName = (name = '') => {
  return String(name)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const avatarInitials = (name = '') => {
  const parts = String(name).trim().split(' ').filter(Boolean)
  if (parts.length === 0) return 'U'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

const splitName = (fullName = '') => {
  const parts = String(fullName).trim().split(' ').filter(Boolean)
  if (parts.length === 0) {
    return { firstName: '', lastName: '' }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

const summarizeAssignments = (assignments = [], t) => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return t('users.noAssignments')
  }

  const counts = assignments.reduce(
    (acc, row) => {
      const type = row.entity_type
      if (type === 'SECTOR') acc.SECTOR += 1
      if (type === 'DEPOT') acc.DEPOT += 1
      if (type === 'INDUSTRY') acc.INDUSTRY += 1
      return acc
    },
    { SECTOR: 0, DEPOT: 0, INDUSTRY: 0 }
  )

  const parts = []
  if (counts.SECTOR > 0) parts.push(`${counts.SECTOR} ${t('users.sector')}${counts.SECTOR > 1 ? 's' : ''}`)
  if (counts.DEPOT > 0) parts.push(`${counts.DEPOT} ${t('users.depot')}${counts.DEPOT > 1 ? 's' : ''}`)
  if (counts.INDUSTRY > 0) parts.push(`${counts.INDUSTRY} ${t('users.industry')}${counts.INDUSTRY > 1 ? 's' : ''}`)

  return parts.length > 0 ? parts.join(', ') : t('users.noAssignments')
}

function Toast({ message, type = 'success', onClose }) {
  if (!message) return null

  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm">
      <div className={type === 'success' ? 'alert-success shadow-lg' : 'alert-error shadow-lg'}>
        <div className="pt-0.5">
          <UserPlus className="h-4 w-4" />
        </div>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/5"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function UsersTableSkeleton({ t }) {
  return (
    <div className="table-container">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="table-head">
            <tr>
              <th className="table-th">{t('users.user')}</th>
              <th className="table-th">{t('users.role')}</th>
              <th className="table-th">{t('users.status')}</th>
              <th className="table-th">{t('users.assignments')}</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <motion.tr
                key={row}
                className="border-b border-zinc-200 dark:border-zinc-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: row * 0.1, duration: 0.4 }}
              >
                <td className="table-td">
                  <motion.div
                    className="h-5 w-52 rounded bg-zinc-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
                <td className="table-td">
                  <motion.div
                    className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
                <td className="table-td">
                  <motion.div
                    className="h-5 w-16 rounded bg-zinc-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
                <td className="table-td">
                  <motion.div
                    className="h-5 w-44 rounded bg-zinc-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function UsersPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [sectors, setSectors] = useState([])
  const [depots, setDepots] = useState([])
  const [industries, setIndustries] = useState([])

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyFormState)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const activeEntityOptions = useMemo(() => {
    if (form.activeEntityType === 'SECTOR') {
      return sectors.map((sector) => ({
        id: sector.id,
        label: sector.sector_name,
      }))
    }

    if (form.activeEntityType === 'DEPOT') {
      return depots.map((depot) => ({
        id: depot.id,
        label: depot.depot_name,
      }))
    }

    return industries.map((industry) => ({
      id: industry.id,
      label: industry.industry_name,
    }))
  }, [depots, form.activeEntityType, industries, sectors])

  const activeSelections = form.selectionsByType[form.activeEntityType] || []
  const activeSelectionSet = useMemo(() => new Set(activeSelections), [activeSelections])
  const controllerRef = useRef(null)

  const assignmentLabels = {
    SECTOR: t('users.sectors'),
    DEPOT: t('users.depots'),
    INDUSTRY: t('users.industries'),
  }

  const loadData = async () => {
    if (controllerRef.current) {
      controllerRef.current.abort()
    }
    const controller = new AbortController()
    controllerRef.current = controller

    setIsLoading(true)

    try {
      const [usersRes, rolesRes, sectorsRes, depotsRes, industriesRes] = await Promise.all([
        apiInstance.get('/users', { signal: controller.signal }),
        apiInstance.get('/roles', { signal: controller.signal }),
        apiInstance.get('/sectors', { signal: controller.signal }),
        apiInstance.get('/depots', { signal: controller.signal }),
        apiInstance.get('/industries', { signal: controller.signal }),
      ])

      if (!controller.signal.aborted) {
        setUsers(usersRes.data?.data?.users || [])
        setRoles(rolesRes.data?.data?.roles || [])
        setSectors(sectorsRes.data?.data?.sectors || [])
        setDepots(depotsRes.data?.data?.depots || [])
        setIndustries(industriesRes.data?.data?.industries || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && !controller.signal.aborted) {
        setToast({
          message: getErrorMessage(error, t('users.loadError')),
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
      if (controllerRef.current) {
        controllerRef.current.abort()
      }
    }
  }, [t])

  useEffect(() => {
    if (!toast.message) return undefined

    const timer = setTimeout(() => setToast({ message: '', type: 'success' }), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const closePanel = () => {
    setIsCreateOpen(false)
    setForm(emptyFormState)
  }

  const setField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleEntitySelection = (entityId) => {
    const type = form.activeEntityType
    setForm((prev) => {
      const current = prev.selectionsByType[type] || []
      const nextForType = current.includes(entityId)
        ? current.filter((id) => id !== entityId)
        : [...current, entityId]

      return {
        ...prev,
        selectionsByType: {
          ...prev.selectionsByType,
          [type]: nextForType,
        },
      }
    })
  }

  const buildAssignments = () => {
    return Object.entries(form.selectionsByType).flatMap(([entityType, ids]) =>
      (ids || []).map((entityId) => ({ entityType, entityId }))
    )
  }

  const handleCreateUser = async (event) => {
    event.preventDefault()

    const normalizedName = form.fullName.trim()
    const normalizedEmail = form.email.trim().toLowerCase()

    if (!normalizedName || !normalizedEmail || !form.password || !form.role) {
      setToast({ message: t('users.validationRequired'), type: 'error' })
      return
    }

    const { firstName, lastName } = splitName(normalizedName)

    if (!firstName || !lastName) {
      setToast({ message: t('users.validationName'), type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/users', {
        firstName,
        lastName,
        email: normalizedEmail,
        password: form.password,
        phone: form.phone.trim() || undefined,
        role: form.role,
        assignments: buildAssignments(),
      })

      setToast({ message: t('users.createSuccess'), type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, t('users.createError')),
        type: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <AnimatedPage>
        <div className="space-y-6">
          <div className="page-header">
            <div>
              <h1 className="page-title">{t('users.pageTitle')}</h1>
              <p className="page-subtitle">
                {t('users.pageSubtitle')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              {t('users.createUserBtn')}
            </button>
          </div>

          {isLoading ? (
            <UsersTableSkeleton t={t} />
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Users className="h-7 w-7 text-zinc-500" />
              </div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('users.noUsers')}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {t('users.noUsersDesc')}
              </p>
              <button
                type="button"
                onClick={() => setIsCreateOpen(true)}
                className="btn-secondary mt-6"
              >
                <Plus className="h-4 w-4" />
                {t('users.createFirstUser')}
              </button>
            </div>
          ) : (
            <DataTable
              data={users}
              columns={[
                {
                  header: t('users.user'),
                  accessor: 'full_name',
                  sortable: true,
                  render: (row) => (
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                        {avatarInitials(row.full_name)}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100">
                          {row.full_name || 'Unnamed User'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          {row.email || 'No email'}
                        </p>
                      </div>
                    </div>
                  ),
                },
                {
                  header: t('users.role'),
                  accessor: 'role_name',
                  sortable: true,
                  render: (row) => (
                    <span className="badge-blue">
                      {displayRoleName(row.role_name || 'UNASSIGNED')}
                    </span>
                  ),
                },
                {
                  header: t('users.status'),
                  accessor: 'status',
                  sortable: true,
                  render: (row) => {
                    const isActive = String(row.status || '').toLowerCase() === 'active'
                    return (
                      <span className={isActive ? 'badge-green' : 'badge-zinc'}>
                        {isActive ? t('users.active') : t('users.inactive')}
                      </span>
                    )
                  },
                },
                {
                  header: t('users.assignments'),
                  accessor: 'assignments',
                  sortable: false,
                  render: (row) => summarizeAssignments(row.assignments, t),
                },
              ]}
              searchPlaceholder={t('users.searchPlaceholder', 'Search users...')}
              onRowClick={(row) => navigate(`/users/${row.id}`)}
              emptyStateMessage={t('users.noResults', 'No users found matching your search.')}
            />
          )}
        </div>
      </AnimatedPage>

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
              onClick={closePanel}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t('users.createUserTitle')}</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {t('users.createUserDesc')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form className="mt-6 space-y-6" onSubmit={handleCreateUser}>
                <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('users.identity')}</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label htmlFor="fullName" className="form-label-normal">
                        {t('users.name')}
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={(event) => setField('fullName', event.target.value)}
                        placeholder="e.g. Oussama Admin"
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="form-label-normal">
                        {t('users.email')}
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setField('email', event.target.value)}
                        placeholder="name@distrac.com"
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="form-label-normal">
                        {t('users.phone')}
                      </label>
                      <input
                        id="phone"
                        type="text"
                        value={form.phone}
                        onChange={(event) => setField('phone', event.target.value)}
                        placeholder="+213 ..."
                        className="form-input"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="password" className="form-label-normal">
                        {t('users.password')}
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={form.password}
                        onChange={(event) => setField('password', event.target.value)}
                        placeholder={t('users.passwordPlaceholder')}
                        className="form-input"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('users.role')}</h3>
                  <div>
                    <label htmlFor="role" className="form-label-normal">
                      {t('users.selectRole')}
                    </label>
                    <select
                      id="role"
                      value={form.role}
                      onChange={(event) => setField('role', event.target.value)}
                      className="form-select"
                    >
                      <option value="">{t('users.chooseRole')}</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.name}>
                          {displayRoleName(role.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </section>

                <section className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                  <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('users.scope')}</h3>

                  <div>
                    <label htmlFor="entityType" className="form-label-normal">
                      {t('users.entityType')}
                    </label>
                    <select
                      id="entityType"
                      value={form.activeEntityType}
                      onChange={(event) => setField('activeEntityType', event.target.value)}
                      className="form-select"
                    >
                      <option value="SECTOR">{t('users.sector')}</option>
                      <option value="DEPOT">{t('users.depot')}</option>
                      <option value="INDUSTRY">{t('users.industry')}</option>
                    </select>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{t('users.selectAssignments')}</p>
                    <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                      {activeEntityOptions.length === 0 ? (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          {t('users.noAvailable', { entity: assignmentLabels[form.activeEntityType].toLowerCase() })}
                        </p>
                      ) : (
                        activeEntityOptions.map((option) => {
                          const checked = activeSelectionSet.has(option.id)
                          return (
                            <label
                              key={option.id}
                              className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                                checked
                                  ? 'border-[#ff6b00]/30 bg-orange-50 dark:border-[#ff6b00]/30 dark:bg-[#ff6b00]/10'
                                  : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleEntitySelection(option.id)}
                                className="h-4 w-4 rounded border-zinc-300 text-[#ff6b00] focus:ring-[#ff6b00]"
                              />
                              <span className="text-sm text-zinc-800 dark:text-zinc-200">{option.label}</span>
                            </label>
                          )
                        })
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {Object.entries(form.selectionsByType).map(([type, ids]) => {
                        if (!ids || ids.length === 0) return null
                        return (
                          <span
                            key={type}
                            className="badge-zinc"
                          >
                            {ids.length} {assignmentLabels[type]}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                </section>

                <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={closePanel}
                    className="btn-secondary"
                  >
                    {t('users.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t('users.createUserSubmit')}
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
