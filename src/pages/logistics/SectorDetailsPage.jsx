import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, X } from 'lucide-react'
import { AnimatedPage } from '../../components/AnimatedPage'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import { SectorDetailsContent } from '../../components/logistics/SectorDetailsContent'
import { parseSectorBoundary } from '../../components/SectorBoundaryPreview'
import { SectorBoundaryDrawer, isValidSectorPolygon } from '../../components/SectorBoundaryDrawer'
import { useAuth } from '../../context/AuthContext'
import apiInstance from '../../api/axiosInstance'

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
          <CheckCircle2 className="h-4 w-4" />
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

function sectorToEditForm(sector) {
  return {
    sectorName: sector.sector_name || '',
    regionId: sector.region_id || '',
    depotId: sector.depot_id || '',
    assignedProfileId: sector.assigned_profile_id || '',
    fulfillmentMode: sector.fulfillment_mode || 'LIVREUR',
    isActive: sector.is_active !== false,
    boundary: parseSectorBoundary(sector.boundary),
  }
}

export function SectorDetailsPage() {
  const { id } = useParams()
  const { hasPermission } = useAuth()
  const canManageLogistics = hasPermission('manage_logistics')

  const [sector, setSector] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const controllerRef = useRef(null)

  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    sectorName: '',
    regionId: '',
    depotId: '',
    assignedProfileId: '',
    isActive: true,
    boundary: null,
  })
  const [editFormError, setEditFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mapDrawerKey, setMapDrawerKey] = useState(0)
  const [regions, setRegions] = useState([])
  const [depots, setDepots] = useState([])
  const [users, setUsers] = useState([])

  const fetchSector = useCallback(
    async (signal) => {
      const res = await apiInstance.get(`/sectors/${id}`, { signal })
      return res.data?.data?.sector || null
    },
    [id],
  )

  useEffect(() => {
    if (!id) return undefined

    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller

    const load = async () => {
      setIsLoading(true)
      setError('')
      try {
        const data = await fetchSector(controller.signal)
        if (!controller.signal.aborted) setSector(data)
      } catch (err) {
        if (err.name !== 'CanceledError' && !controller.signal.aborted) {
          setSector(null)
          setError(err?.response?.data?.message || 'Failed to load sector details.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    load()
    return () => controllerRef.current?.abort()
  }, [id, fetchSector])

  useEffect(() => {
    if (!canManageLogistics) return undefined

    const controller = new AbortController()

    Promise.all([
      apiInstance.get('/regions', { signal: controller.signal }),
      apiInstance.get('/depots', { signal: controller.signal }),
      apiInstance.get('/users', { signal: controller.signal }),
    ])
      .then(([regionsRes, depotsRes, usersRes]) => {
        if (controller.signal.aborted) return
        setRegions(regionsRes.data?.data?.regions || [])
        setDepots(depotsRes.data?.data?.depots || [])
        setUsers(usersRes.data?.data?.users || [])
      })
      .catch(() => {})

    return () => controller.abort()
  }, [canManageLogistics])

  const openEdit = () => {
    if (!sector) return
    setEditForm(sectorToEditForm(sector))
    setEditFormError('')
    setMapDrawerKey((key) => key + 1)
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()

    if (!editForm.sectorName.trim()) {
      setEditFormError('Sector name is required.')
      return
    }

    if (!isValidSectorPolygon(editForm.boundary)) {
      setEditFormError('A valid boundary is required. Use Draw to place corners, then Save on the map.')
      return
    }

    setIsSubmitting(true)
    setEditFormError('')

    try {
      await apiInstance.put(`/sectors/${id}`, {
        sectorName: editForm.sectorName.trim(),
        regionId: editForm.regionId || null,
        depotId: editForm.depotId || null,
        assignedProfileId: editForm.assignedProfileId || null,
        fulfillmentMode: editForm.fulfillmentMode || 'LIVREUR',
        boundary: editForm.boundary,
        isActive: editForm.isActive,
      })

      const refreshed = await fetchSector()
      setSector(refreshed)
      setIsEditOpen(false)
      setToast({ message: 'Sector updated successfully.', type: 'success' })
    } catch (err) {
      setEditFormError(err?.response?.data?.message || 'Failed to update sector.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'success' })}
      />

      <AnimatedPage>
        <div className="mx-auto max-w-7xl space-y-8 p-8">
          {isLoading || sector || error ? (
            <SectorDetailsContent
              sector={sector}
              isLoading={isLoading}
              error={error}
              layout="page"
              showMap
              onEdit={canManageLogistics ? openEdit : undefined}
            />
          ) : (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-500/30 dark:bg-red-500/10">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Sector not found.</p>
              <Link
                to="/sectors"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sectors
              </Link>
            </div>
          )}
        </div>
      </AnimatedPage>

      <SlideOverPanel
        isOpen={isEditOpen && Boolean(sector)}
        onClose={() => setIsEditOpen(false)}
        disableClose={isSubmitting}
        title="Edit Sector"
        description="Update metadata and redraw the coverage boundary if needed."
        footer={
          <div className="space-y-3">
            {editFormError ? <p className="text-sm text-red-500">{editFormError}</p> : null}
            <div className="flex gap-3">
              <button
                type="submit"
                form="edit-sector-form"
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isSubmitting ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setIsEditOpen(false)}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                Cancel
              </button>
            </div>
          </div>
        }
      >
        <form id="edit-sector-form" onSubmit={handleEditSubmit} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={editForm.sectorName}
              onChange={(e) => setEditForm({ ...editForm, sectorName: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Region</label>
            <select
              value={editForm.regionId}
              onChange={(e) => setEditForm({ ...editForm, regionId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">No region</option>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>
                  {region.region_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Fulfillment Depot
            </label>
            <select
              value={editForm.depotId}
              onChange={(e) => setEditForm({ ...editForm, depotId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">No depot</option>
              {depots.map((depot) => (
                <option key={depot.id} value={depot.id}>
                  {depot.depot_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Delivery mode</label>
            <select
              value={editForm.fulfillmentMode}
              onChange={(e) => setEditForm({ ...editForm, fulfillmentMode: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="LIVREUR">Livreur delivery</option>
              <option value="VENDOR">Vendor-exclusive (out of livreur range)</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Default Owner</label>
            <select
              value={editForm.assignedProfileId}
              onChange={(e) => setEditForm({ ...editForm, assignedProfileId: e.target.value })}
              className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              <option value="">None</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email || user.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</label>
            <div className="flex gap-3">
              {[
                { value: true, label: 'Active' },
                { value: false, label: 'Inactive' },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setEditForm({ ...editForm, isActive: opt.value })}
                  className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition ${
                    editForm.isActive === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-gray-200 text-zinc-500 hover:border-gray-400 dark:border-zinc-700 dark:hover:border-zinc-500'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Sector boundary <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Existing boundary is pre-loaded. Use Clear to redraw, or Draw to adjust corners.
            </p>
            <SectorBoundaryDrawer
              key={mapDrawerKey}
              value={editForm.boundary}
              onChange={(boundary) => setEditForm((prev) => ({ ...prev, boundary }))}
            />
          </div>
        </form>
      </SlideOverPanel>
    </>
  )
}
