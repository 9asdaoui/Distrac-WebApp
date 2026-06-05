import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Plus, X, Check, XCircle } from 'lucide-react'
import {
  LOGISTICS_MODULES,
  EntityIconBadge,
  EntityStatusBadge,
} from '../components/logistics/logisticsModuleUi'

const CLIENT_MODULE = LOGISTICS_MODULES.client
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

function ClientsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name & Store</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Phone</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">City</th>
              <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                <td className="px-6 py-4"><div className="h-5 w-44 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-32 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-28 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
                <td className="px-6 py-4"><div className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function OpeningHoursScheduler({ value, onChange }) {
  const handleToggle = (day) => {
    const current = value[day] || []
    if (current.length > 0) {
      const next = { ...value, [day]: [] }
      onChange(next)
    } else {
      const next = { ...value, [day]: [{ open: '09:00', close: '12:00' }, { open: '13:00', close: '18:00' }] }
      onChange(next)
    }
  }

  const handleShiftChange = (day, shiftIndex, field, newValue) => {
    const shifts = [...(value[day] || [])]
    if (!shifts[shiftIndex]) shifts[shiftIndex] = { open: '09:00', close: '18:00' }
    shifts[shiftIndex] = { ...shifts[shiftIndex], [field]: newValue }
    onChange({ ...value, [day]: shifts })
  }

  const addShift = (day) => {
    const shifts = [...(value[day] || [])]
    shifts.push({ open: '09:00', close: '18:00' })
    onChange({ ...value, [day]: shifts })
  }

  const removeShift = (day, shiftIndex) => {
    const shifts = (value[day] || []).filter((_, i) => i !== shiftIndex)
    if (shifts.length === 0) {
      const next = { ...value }
      delete next[day]
      onChange(next)
    } else {
      onChange({ ...value, [day]: shifts })
    }
  }

  return (
    <div className="space-y-2">
      {DAYS.map((day) => {
        const isEnabled = (value[day] || []).length > 0
        const shifts = value[day] || []
        return (
          <div key={day} className="rounded-lg border border-gray-200 p-2.5 dark:border-zinc-700">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => handleToggle(day)}
                  className="h-4 w-4 rounded border-gray-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800"
                />
                {DAY_LABELS[day]}
              </label>
            </div>
            {isEnabled && (
              <div className="mt-2 space-y-1.5 pl-6">
                {shifts.map((shift, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-12 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Shift {idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="time"
                        value={shift.open || '09:00'}
                        onChange={(e) => handleShiftChange(day, idx, 'open', e.target.value)}
                        className="w-28 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                      <span className="text-xs text-zinc-400">to</span>
                      <input
                        type="time"
                        value={shift.close || '18:00'}
                        onChange={(e) => handleShiftChange(day, idx, 'close', e.target.value)}
                        className="w-28 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                    {shifts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeShift(day, idx)}
                        className="rounded p-1 text-zinc-400 hover:text-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addShift(day)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  + Add another shift
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function ClientsPage() {
  const navigate = useNavigate()
  const [clients, setClients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [toast, setToast] = useState(null)
  const controllerRef = useRef(null)

  const [form, setForm] = useState({
    clientName: '',
    storeName: '',
    phone: '',
    email: '',
    qrCode: '',
    clientAddress: '',
    city: '',
    gpsLatitude: '',
    gpsLongitude: '',
    openingHours: {},
  })

  // Lock outer scroll when slide-over is open
  useEffect(() => {
    if (isCreateOpen) {
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
    }
    return () => { document.documentElement.style.overflow = '' }
  }, [isCreateOpen])

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  const load = useCallback(async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    try {
      const res = await apiInstance.get('/clients', { signal: controller.signal })
      if (!controller.signal.aborted) {
        setClients(res.data?.data?.clients || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError') setClients([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [load])

  const openCreate = () => {
    setForm({
      clientName: '',
      storeName: '',
      phone: '',
      email: '',
      qrCode: '',
      clientAddress: '',
      city: '',
      gpsLatitude: '',
      gpsLongitude: '',
      openingHours: {},
    })
    setFormError('')
    setIsCreateOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.clientName.trim()) { setFormError('Client name is required.'); return }
    if (!form.qrCode.trim()) { setFormError('QR Code is required.'); return }
    setIsSubmitting(true)
    setFormError('')
    try {
      const payload = {
        clientName: form.clientName,
        storeName: form.storeName || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        qrCode: form.qrCode,
        clientAddress: form.clientAddress || undefined,
        city: form.city || undefined,
        gpsLatitude: form.gpsLatitude === '' ? undefined : Number(form.gpsLatitude),
        gpsLongitude: form.gpsLongitude === '' ? undefined : Number(form.gpsLongitude),
        openingHours: Object.keys(form.openingHours).length > 0 ? form.openingHours : undefined,
      }
      const res = await apiInstance.post('/clients', payload)
      const created = res.data?.data?.client
      setIsCreateOpen(false)
      showToast('Client created successfully', 'success')
      await load()
      if (created?.id) navigate(CLIENT_MODULE.detailPath(created.id))
    } catch (err) {
      setFormError(err?.response?.data?.message || 'Failed to create client.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <AnimatedPage>
        {/* Toast notification */}
        <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed right-6 top-6 z-[70] flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                : 'bg-red-50 text-red-800 dark:bg-red-900/50 dark:text-red-200'
            }`}
          >
            {toast.type === 'success' ? <Check className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <EntityIconBadge moduleKey="client" />
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{CLIENT_MODULE.plural}</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Client stores linked to the Global Map and order history.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <Plus className="h-4 w-4" />
            Add Client
          </button>
        </div>

        {/* Data Table */}
        {isLoading ? (
          <ClientsSkeleton />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-zinc-800/50">
                  <tr>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Name & Store</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Phone</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">City</th>
                    <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                    <th className="w-10 px-2 py-3" aria-hidden />
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => navigate(CLIENT_MODULE.detailPath(client.id))}
                      className="group cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <EntityIconBadge moduleKey="client" size="sm" />
                          <div>
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">
                              {client.store_name || client.client_name}
                            </p>
                            {client.store_name && client.client_name && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400">{client.client_name}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-700 dark:text-zinc-300">{client.phone || '-'}</td>
                      <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{client.city || '-'}</td>
                      <td className="px-6 py-4">
                        {client.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <Check className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                        {client.is_verified === false && client.is_active && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                            Unverified
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-4 text-zinc-300 group-hover:text-zinc-500 dark:text-zinc-600">
                        <ChevronRight className="h-4 w-4" />
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={5}>
                        No clients available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Add Client Slide-Over — fixed h-screen flex layout */}
    </AnimatedPage>

    <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-[60]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsCreateOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
            >
              {/* Pinned Header */}
              <div className="flex-shrink-0 border-b border-gray-200 px-6 py-5 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Add Client</h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                      Register a new client with store information, location, and opening hours.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <form id="add-client-form" onSubmit={handleSubmit} className="space-y-8">
                  {/* Section 1: General Info */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      General Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Client Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.clientName}
                          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                          placeholder="Legal name of the client"
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Store Name
                        </label>
                        <input
                          type="text"
                          value={form.storeName}
                          onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                          placeholder="Commercial / signboard name"
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</label>
                          <input
                            type="text"
                            value={form.phone}
                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                            placeholder="+212 6 XX XX XX XX"
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
                          <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            placeholder="client@example.com"
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          QR Code <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={form.qrCode}
                          onChange={(e) => setForm({ ...form, qrCode: e.target.value })}
                          placeholder="e.g. SCN-QR-1779270580474-9"
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Location */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Location
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Address</label>
                        <input
                          type="text"
                          value={form.clientAddress}
                          onChange={(e) => setForm({ ...form, clientAddress: e.target.value })}
                          placeholder="Street address, landmark"
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">City</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          placeholder="e.g. Casablanca"
                          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">GPS Latitude</label>
                          <input
                            type="number"
                            step="any"
                            min="-90"
                            max="90"
                            value={form.gpsLatitude}
                            onChange={(e) => setForm({ ...form, gpsLatitude: e.target.value })}
                            placeholder="e.g. 33.571"
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">GPS Longitude</label>
                          <input
                            type="number"
                            step="any"
                            min="-180"
                            max="180"
                            value={form.gpsLongitude}
                            onChange={(e) => setForm({ ...form, gpsLongitude: e.target.value })}
                            placeholder="e.g. -7.581"
                            className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Opening Hours */}
                  <div>
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Opening Hours
                    </h3>
                    <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">
                      Configure daily opening hours. Check a day to enable, then set shift start and end times.
                    </p>
                    <OpeningHoursScheduler
                      value={form.openingHours}
                      onChange={(val) => setForm({ ...form, openingHours: val })}
                    />
                  </div>

                  {formError && (
                    <p className="text-sm text-red-500">{formError}</p>
                  )}
                </form>
              </div>

              {/* Pinned Footer */}
              <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 dark:border-zinc-800">
                <div className="flex gap-3">
                  <button
                    type="submit"
                    form="add-client-form"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-zinc-900 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    {isSubmitting ? 'Creating…' : 'Create Client'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}