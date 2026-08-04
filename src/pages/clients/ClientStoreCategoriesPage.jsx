/**
 * Admin UI for global client store categories (Grao, Normal store, etc.)
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Pencil, Store } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { Toast } from '../../components/Toast'
import apiInstance from '../../api/axiosInstance'

const emptyForm = () => ({
  name: '',
  code: '',
  isActive: true,
  sortOrder: 0,
  allowedUserIds: [],
})

function CategoryFormPanel({ open, initial, fieldSalesUsers, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        name: initial.name || '',
        code: initial.code || '',
        isActive: initial.is_active !== false,
        sortOrder: initial.sort_order ?? 0,
        allowedUserIds: initial.allowedUserIds || initial.allowed_user_ids || [],
      })
    } else {
      setForm(emptyForm())
    }
    setError('')
  }, [open, initial])

  const toggleUser = (userId) => {
    setForm((prev) => {
      const set = new Set(prev.allowedUserIds)
      if (set.has(userId)) set.delete(userId)
      else set.add(userId)
      return { ...prev, allowedUserIds: [...set] }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        isActive: form.isActive,
        sortOrder: Number(form.sortOrder) || 0,
        allowedUserIds: form.allowedUserIds,
      }
      if (initial?.id) {
        await apiInstance.patch(`/client-store-categories/${initial.id}`, payload)
      } else {
        await apiInstance.post('/client-store-categories', payload)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save category.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-cc-surface">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {initial?.id ? 'Edit store category' : 'New store category'}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Vendors and prevendeurs only see categories you assign to them.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="form-label-normal">Name</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Grao"
            />
          </div>
          <div>
            <label className="form-label-normal">Code (optional)</label>
            <input
              className="form-input"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
              placeholder="grao"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label-normal">Sort order</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                />
                Active
              </label>
            </div>
          </div>

          <div>
            <label className="form-label-normal">Allowed vendors / prevendeurs</label>
            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-700">
              {fieldSalesUsers.length === 0 ? (
                <p className="text-sm text-zinc-500">No VENDOR or SELLER users found.</p>
              ) : (
                fieldSalesUsers.map((user) => (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200"
                  >
                    <input
                      type="checkbox"
                      checked={form.allowedUserIds.includes(user.id)}
                      onChange={() => toggleUser(user.id)}
                    />
                    <span>
                      {user.full_name || user.email}{' '}
                      <span className="text-zinc-500">({user.role})</span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ClientStoreCategoriesPage() {
  const [categories, setCategories] = useState([])
  const [fieldSalesUsers, setFieldSalesUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [panelOpen, setPanelOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [catRes, usersRes] = await Promise.all([
        apiInstance.get('/client-store-categories'),
        apiInstance.get('/client-store-categories/field-sales-users'),
      ])
      setCategories(catRes.data?.data?.categories || [])
      setFieldSalesUsers(usersRes.data?.data?.users || [])
    } catch {
      setCategories([])
      setFieldSalesUsers([])
      setToast({ message: 'Failed to load categories.', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categories],
  )

  const openCreate = () => {
    setEditing(null)
    setPanelOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setPanelOpen(true)
  }

  return (
    <DashboardLayout>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'success' })} />
      <AnimatedPage>
        <div className="space-y-6">
          <div className="page-header">
            <div>
              <h1 className="page-title">Client store categories</h1>
              <p className="page-subtitle">
                Define store types (e.g. Grao, normal store) and control which field agents can use each one.
              </p>
            </div>
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add category
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="table-th">Name</th>
                  <th className="table-th">Code</th>
                  <th className="table-th">Agents</th>
                  <th className="table-th">Status</th>
                  <th className="table-th w-24" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                      Loading…
                    </td>
                  </tr>
                ) : sortedCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Store className="mx-auto h-8 w-8 text-zinc-400" />
                      <p className="mt-2 text-zinc-500">No store categories yet.</p>
                    </td>
                  </tr>
                ) : (
                  sortedCategories.map((row) => (
                    <tr key={row.id} className="border-t border-zinc-100 dark:border-zinc-800">
                      <td className="table-td font-medium">{row.name}</td>
                      <td className="table-td text-zinc-500">{row.code || '—'}</td>
                      <td className="table-td">{(row.allowedUserIds || []).length}</td>
                      <td className="table-td">
                        <span
                          className={
                            row.is_active
                              ? 'rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800'
                              : 'rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600'
                          }
                        >
                          {row.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-td">
                        <button
                          type="button"
                          className="btn-ghost p-2"
                          onClick={() => openEdit(row)}
                          aria-label="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <CategoryFormPanel
          open={panelOpen}
          initial={editing}
          fieldSalesUsers={fieldSalesUsers}
          onClose={() => setPanelOpen(false)}
          onSaved={() => {
            setToast({ message: 'Category saved.', type: 'success' })
            load()
          }}
        />
      </AnimatedPage>
    </DashboardLayout>
  )
}
