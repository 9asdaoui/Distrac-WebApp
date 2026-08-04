import React, { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { Toast } from '../../components/Toast'
import apiInstance from '../../api/axiosInstance'

const emptyForm = () => ({
  key: '',
  label: '',
  description: '',
  arriveMethod: 'scan',
  scanTarget: 'depot',
  requireImage: true,
  requireNote: false,
  isActive: true,
})

function templateToForm(tpl) {
  const arrive = tpl.config?.arrive || {}
  const complete = tpl.config?.complete || {}
  return {
    key: tpl.key || '',
    label: tpl.label || '',
    description: tpl.description || '',
    arriveMethod: arrive.method || 'none',
    scanTarget: arrive.scan_target || arrive.scanTarget || 'depot',
    requireImage: Boolean(complete.require_image ?? complete.requireImage),
    requireNote: Boolean(complete.require_note ?? complete.requireNote),
    isActive: tpl.is_active !== false,
  }
}

function formToConfig(form) {
  return {
    arrive:
      form.arriveMethod === 'scan'
        ? { method: 'scan', scan_target: form.scanTarget }
        : { method: 'none' },
    complete: {
      require_image: Boolean(form.requireImage),
      require_note: Boolean(form.requireNote),
    },
  }
}

function TemplateFormPanel({ open, initial, onClose, onSaved }) {
  const [form, setForm] = useState(emptyForm())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setForm(initial ? templateToForm(initial) : emptyForm())
    setError('')
  }, [open, initial])

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.label.trim()) {
      setError('Label is required.')
      return
    }
    if (!initial?.id && !form.key.trim()) {
      setError('Key is required.')
      return
    }
    setIsSubmitting(true)
    setError('')
    try {
      const config = formToConfig(form)
      if (initial?.id) {
        await apiInstance.patch(`/missions/custom-stop-templates/${initial.id}`, {
          label: form.label.trim(),
          description: form.description.trim() || null,
          config,
          is_active: form.isActive,
        })
      } else {
        await apiInstance.post('/missions/custom-stop-templates', {
          key: form.key.trim().toLowerCase(),
          label: form.label.trim(),
          description: form.description.trim() || null,
          config,
          is_active: form.isActive,
        })
      }
      onSaved()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to save template.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-cc-surface">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {initial?.id ? 'Edit custom stop template' : 'New custom stop template'}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!initial?.id && (
            <div>
              <label className="form-label-normal">Key</label>
              <input
                className="form-input"
                value={form.key}
                onChange={(e) => setForm((p) => ({ ...p, key: e.target.value }))}
                placeholder="bank"
              />
            </div>
          )}
          <div>
            <label className="form-label-normal">Label</label>
            <input
              className="form-input"
              value={form.label}
              onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              placeholder="Bank deposit"
            />
          </div>
          <div>
            <label className="form-label-normal">Description</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label-normal">Arrive</label>
              <select
                className="form-input"
                value={form.arriveMethod}
                onChange={(e) => setForm((p) => ({ ...p, arriveMethod: e.target.value }))}
              >
                <option value="none">No scan</option>
                <option value="scan">Require scan</option>
              </select>
            </div>
            {form.arriveMethod === 'scan' && (
              <div>
                <label className="form-label-normal">Scan target</label>
                <select
                  className="form-input"
                  value={form.scanTarget}
                  onChange={(e) => setForm((p) => ({ ...p, scanTarget: e.target.value }))}
                >
                  <option value="depot">Depot</option>
                  <option value="client">Client</option>
                  <option value="industry">Industry</option>
                </select>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.requireImage}
              onChange={(e) => setForm((p) => ({ ...p, requireImage: e.target.checked }))}
            />
            Require proof image
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.requireNote}
              onChange={(e) => setForm((p) => ({ ...p, requireNote: e.target.checked }))}
            />
            Require note
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            Active
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={onClose}>
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

export function CustomStopTemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await apiInstance.get('/missions/custom-stop-templates', {
        params: { includeInactive: true },
      })
      setTemplates(data?.data?.templates || [])
    } catch (err) {
      setToast({ type: 'error', message: err?.response?.data?.message || 'Failed to load templates' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="mx-auto max-w-4xl space-y-6 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
                Custom stop templates
              </h1>
              <p className="mt-1 text-sm text-zinc-500">
                Presets for Bank, CashPlus, and other CUSTOM mission tasks.
              </p>
            </div>
            <button
              type="button"
              className="btn-primary inline-flex items-center gap-2"
              onClick={() => {
                setEditing(null)
                setEditorOpen(true)
              }}
            >
              <Plus className="h-4 w-4" />
              New template
            </button>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-zinc-500">No templates yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/80">
                  <tr>
                    <th className="px-4 py-3">Key</th>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">Arrive</th>
                    <th className="px-4 py-3">Complete</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {templates.map((tpl) => {
                    const arrive = tpl.config?.arrive || {}
                    const complete = tpl.config?.complete || {}
                    return (
                      <tr key={tpl.id} className="border-t border-zinc-100 dark:border-zinc-800">
                        <td className="px-4 py-3 font-mono text-xs">{tpl.key}</td>
                        <td className="px-4 py-3">{tpl.label}</td>
                        <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                          {arrive.method === 'scan'
                            ? `scan → ${arrive.scan_target || arrive.scanTarget}`
                            : 'none'}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-300">
                          {[
                            complete.require_image || complete.requireImage ? 'image' : null,
                            complete.require_note || complete.requireNote ? 'note' : null,
                          ]
                            .filter(Boolean)
                            .join(', ') || '—'}
                        </td>
                        <td className="px-4 py-3">{tpl.is_active ? 'Yes' : 'No'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-xs text-indigo-600"
                            onClick={() => {
                              setEditing(tpl)
                              setEditorOpen(true)
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <TemplateFormPanel
          open={editorOpen}
          initial={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={() => {
            setToast({ type: 'success', message: 'Template saved' })
            load()
          }}
        />
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatedPage>
    </DashboardLayout>
  )
}
