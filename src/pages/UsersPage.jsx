import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Loader2, Plus, UserPlus, Users, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'

const ROLE_BADGE_CLASS =
  'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'

const STATUS_ACTIVE_CLASS =
  'inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'

const STATUS_INACTIVE_CLASS =
  'inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

const assignmentLabels = {
  SECTOR: 'Sectors',
  DEPOT: 'Depots',
  INDUSTRY: 'Industries',
}

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

const summarizeAssignments = (assignments = []) => {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return 'No assignments'
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
  if (counts.SECTOR > 0) parts.push(`${counts.SECTOR} Sector${counts.SECTOR > 1 ? 's' : ''}`)
  if (counts.DEPOT > 0) parts.push(`${counts.DEPOT} Depot${counts.DEPOT > 1 ? 's' : ''}`)
  if (counts.INDUSTRY > 0) parts.push(`${counts.INDUSTRY} Industr${counts.INDUSTRY > 1 ? 'ies' : 'y'}`)

  return parts.length > 0 ? parts.join(', ') : 'No assignments'
}

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

function UsersTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">User</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Role</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Assignments</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <motion.tr
                key={row}
                className="border-b border-gray-200 dark:border-zinc-800"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: row * 0.1, duration: 0.4 }}
              >
                <td className="px-6 py-4">
                  <motion.div
                    className="h-5 w-52 rounded bg-gray-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
                <td className="px-6 py-4">
                  <motion.div
                    className="h-5 w-24 rounded bg-gray-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
                <td className="px-6 py-4">
                  <motion.div
                    className="h-5 w-16 rounded bg-gray-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
                <td className="px-6 py-4">
                  <motion.div
                    className="h-5 w-44 rounded bg-gray-200 dark:bg-zinc-700"
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
      const [usersRes, rolesRes, sectorsRes, depotsRes, industriesRes] = await Promise.all([
        apiInstance.get('/users', { signal: controller.signal }),
        apiInstance.get('/roles', { signal: controller.signal }),
        apiInstance.get('/sectors', { signal: controller.signal }),
        apiInstance.get('/depots', { signal: controller.signal }),
        apiInstance.get('/industries', { signal: controller.signal }),
      ])

      // Only update state if request wasn't cancelled
      if (!controller.signal.aborted) {
        setUsers(usersRes.data?.data?.users || [])
        setRoles(rolesRes.data?.data?.roles || [])
        setSectors(sectorsRes.data?.data?.sectors || [])
        setDepots(depotsRes.data?.data?.depots || [])
        setIndustries(industriesRes.data?.data?.industries || [])
      }
    } catch (error) {
      // Only show error if it's not a cancellation
      if (error.name !== 'CanceledError' && !controller.signal.aborted) {
        setToast({
          message: getErrorMessage(error, 'Failed to load users and metadata'),
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
      setToast({ message: 'Name, email, password, and role are required', type: 'error' })
      return
    }

    const { firstName, lastName } = splitName(normalizedName)

    if (!firstName || !lastName) {
      setToast({ message: 'Please provide a valid full name', type: 'error' })
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

      setToast({ message: 'User created successfully', type: 'success' })
      closePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create user'),
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
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Users & Scope Assignment</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create users, assign roles, and define sector/depot/industry scope.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Plus className="h-4 w-4" />
            Create user
          </button>
        </div>

        {isLoading ? (
          <UsersTableSkeleton />
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800">
              <Users className="h-7 w-7 text-zinc-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No users yet</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create your first user and assign operational scope.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Create your first user
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">User</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Role</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Assignments</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isActive = String(user.status || '').toLowerCase() === 'active'

                    return (
                      <tr key={user.id} className="border-b border-gray-200 align-top dark:border-zinc-800">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                              {avatarInitials(user.full_name)}
                            </div>
                            <div>
                              <p className="font-medium text-zinc-900 dark:text-zinc-100">{user.full_name || 'Unnamed User'}</p>
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email || 'No email'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={ROLE_BADGE_CLASS}>{displayRoleName(user.role_name || 'UNASSIGNED')}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={isActive ? STATUS_ACTIVE_CLASS : STATUS_INACTIVE_CLASS}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">
                          {summarizeAssignments(user.assignments)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
              className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create User</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Add identity details, role, and assignment scope.
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
              <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Identity</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Name
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      value={form.fullName}
                      onChange={(event) => setField('fullName', event.target.value)}
                      placeholder="e.g. Oussama Admin"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-blue-500 transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      placeholder="name@distrac.com"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-blue-500 transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Phone
                    </label>
                    <input
                      id="phone"
                      type="text"
                      value={form.phone}
                      onChange={(event) => setField('phone', event.target.value)}
                      placeholder="+213 ..."
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-blue-500 transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={form.password}
                      onChange={(event) => setField('password', event.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-blue-500 transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Role</h3>
                <div>
                  <label htmlFor="role" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Select role
                  </label>
                  <select
                    id="role"
                    value={form.role}
                    onChange={(event) => setField('role', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Choose a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>
                        {displayRoleName(role.name)}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section className="space-y-4 rounded-xl border border-gray-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Scope / Assignments</h3>

                <div>
                  <label htmlFor="entityType" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Entity Type
                  </label>
                  <select
                    id="entityType"
                    value={form.activeEntityType}
                    onChange={(event) => setField('activeEntityType', event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-blue-500 transition focus:border-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="SECTOR">Sector</option>
                    <option value="DEPOT">Depot</option>
                    <option value="INDUSTRY">Industry</option>
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Select assignments</p>
                  <div className="max-h-52 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-zinc-800">
                    {activeEntityOptions.length === 0 ? (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        No {assignmentLabels[form.activeEntityType].toLowerCase()} available.
                      </p>
                    ) : (
                      activeEntityOptions.map((option) => {
                        const checked = activeSelectionSet.has(option.id)
                        return (
                          <label
                            key={option.id}
                            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition ${
                              checked
                                ? 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                                : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEntitySelection(option.id)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-zinc-800 dark:text-zinc-200">{option.label}</span>
                          </label>
                        )
                      })
                    )}
                  </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(form.selectionsByType).map(([type, ids]) => {
                    if (!ids || ids.length === 0) return null
                    return (
                      <span
                        key={type}
                        className="inline-flex items-center rounded-full border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {ids.length} {assignmentLabels[type]}
                      </span>
                    )
                  })}
                </div>
              </div>
            </section>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closePanel}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create user
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
