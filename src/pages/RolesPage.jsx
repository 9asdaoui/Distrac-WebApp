import React, { useEffect, useMemo, useState, useRef } from 'react'
import { Loader2, Plus, Shield, ShieldCheck, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { DashboardLayout } from '../components/DashboardLayout'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'

const ROLE_BADGE_CLASS =
  'inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200'

const PERMISSION_BADGE_CLASS =
  'inline-flex items-center rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'

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
          <ShieldCheck className="h-4 w-4" />
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

function RolesTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Role</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Permissions</th>
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
                    className="h-5 w-36 rounded bg-gray-200 dark:bg-zinc-700"
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </td>
                <td className="px-6 py-4">
                  <motion.div
                    className="h-5 w-56 rounded bg-gray-200 dark:bg-zinc-700"
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

export function RolesPage() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [roleName, setRoleName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState([])
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const selectedPermissionSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions])
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
      const [rolesResponse, permissionsResponse] = await Promise.all([
        apiInstance.get('/roles', { signal: controller.signal }),
        apiInstance.get('/permissions', { signal: controller.signal }),
      ])

      // Only update state if request wasn't cancelled
      if (!controller.signal.aborted) {
        setRoles(rolesResponse.data?.data?.roles || [])
        setPermissions(permissionsResponse.data?.data?.permissions || [])
      }
    } catch (error) {
      // Only show error if it's not a cancellation
      if (error.name !== 'CanceledError' && !controller.signal.aborted) {
        setToast({
          message: getErrorMessage(error, 'Failed to load roles and permissions'),
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

  const resetForm = () => {
    setRoleName('')
    setSelectedPermissions([])
  }

  const closeCreatePanel = () => {
    setIsCreateOpen(false)
    resetForm()
  }

  const togglePermission = (permissionName) => {
    setSelectedPermissions((prev) => {
      if (prev.includes(permissionName)) {
        return prev.filter((item) => item !== permissionName)
      }

      return [...prev, permissionName]
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const normalizedName = roleName.trim()
    if (!normalizedName) {
      setToast({ message: 'Role name is required', type: 'error' })
      return
    }

    setIsSubmitting(true)
    try {
      await apiInstance.post('/roles', {
        name: normalizedName,
        permissions: selectedPermissions,
      })

      setToast({ message: 'Role created successfully', type: 'success' })
      closeCreatePanel()
      await loadData()
    } catch (error) {
      setToast({
        message: getErrorMessage(error, 'Failed to create role'),
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
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Roles & Permissions</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Define access levels by combining role names with permission sets.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Plus className="h-4 w-4" />
            Create role
          </button>
        </div>

        {isLoading ? (
          <RolesTableSkeleton />
        ) : roles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-zinc-800">
              <Shield className="h-7 w-7 text-zinc-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">No roles created yet</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Create your first role to start managing access control.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <Plus className="h-4 w-4" />
              Create your first role
            </button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Role</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Permissions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b border-gray-200 align-top dark:border-zinc-800">
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={ROLE_BADGE_CLASS}>{displayRoleName(role.name)}</span>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">{role.name}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {Array.isArray(role.permissions) && role.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {role.permissions.map((permission) => (
                              <span key={`${role.id}-${permission.id || permission.name}`} className={PERMISSION_BADGE_CLASS}>
                                {permission.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">No permissions assigned</p>
                        )}
                      </td>
                    </tr>
                  ))}
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
              onClick={closeCreatePanel}
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
                <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Create Role</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Choose a role name and assign the permissions this role should have.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreatePanel}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="roleName" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Role Name
                </label>
                <input
                  id="roleName"
                  type="text"
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value)}
                  placeholder="e.g. TEST_ROLE"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none ring-blue-500 transition placeholder:text-zinc-400 focus:border-blue-500 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Permissions</p>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {selectedPermissions.length} selected
                  </span>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-3 dark:border-zinc-800">
                  {permissions.length === 0 ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">No permissions available</p>
                  ) : (
                    permissions.map((permission) => {
                      const checked = selectedPermissionSet.has(permission.name)
                      return (
                        <label
                          key={permission.id || permission.name}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition ${
                            checked
                              ? 'border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10'
                              : 'border-gray-200 hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-900'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission.name)}
                            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{permission.name}</p>
                            {permission.description ? (
                              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{permission.description}</p>
                            ) : null}
                          </div>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={closeCreatePanel}
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
                  Create role
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
