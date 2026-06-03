import React, { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Truck, Plus, X, QrCode, Printer, Warehouse, UserRound, CheckCircle2, CircleOff } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import QRCode from 'react-qr-code'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'

function VehiclesSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              {['Plate', 'Model', 'Depot', 'QR Code', 'Livreur', 'Status', ''].map((label) => (
                <th key={label} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                {[160, 220, 200, 180, 200, 100, 120].map((width, index) => (
                  <td key={index} className="px-6 py-4">
                    <div className="h-4 animate-pulse rounded bg-gray-200 dark:bg-zinc-700" style={{ width: `${width}px` }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Badge({ children, tone = 'default' }) {
  const toneClass = {
    default: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
    danger: 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200',
  }[tone] || 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  )
}

function PrintPreviewModal({ vehicle, onClose }) {
  if (!vehicle) return null

  const printVehicleQr = () => {
    const qrMarkup = renderToStaticMarkup(<QRCode value={vehicle.qr_code || ''} size={240} />)
    const printWindow = window.open('', '_blank', 'width=900,height=900')

    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Vehicle QR - ${vehicle.plate_number || ''}</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              display: flex;
              min-height: 100vh;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
              color: #0f172a;
            }
            .sheet {
              width: 420px;
              padding: 32px;
              background: white;
              border: 1px solid #e2e8f0;
              border-radius: 20px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
            }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 6px; }
            .meta { font-size: 14px; color: #475569; margin-bottom: 18px; }
            .qr { display: inline-flex; padding: 18px; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; }
            .code { margin-top: 18px; font-size: 12px; letter-spacing: 0.12em; color: #334155; }
            .footer { margin-top: 18px; font-size: 12px; color: #64748b; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="title">DISTRAC Vehicle QR</div>
            <div class="meta">${vehicle.plate_number || 'Unknown Plate'}${vehicle.depot?.depot_name ? ` • ${vehicle.depot.depot_name}` : ''}</div>
            <div class="qr">${qrMarkup}</div>
            <div class="code">${vehicle.qr_code || ''}</div>
            <div class="footer">Scan this code to pointage the vehicle at the start of the day.</div>
          </div>
          <script>
            window.onload = function () {
              window.print();
              window.onafterprint = function () { window.close(); };
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <motion.div
      className="fixed inset-0 z-[70]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Vehicle QR Code</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Print and attach this QR to the vehicle.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{vehicle.plate_number || '-'}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{vehicle.model || '-'}</p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {vehicle.depot?.depot_name || 'Unassigned depot'}
              </p>
            </div>
            <Badge tone={vehicle.is_active === false ? 'danger' : 'success'}>
              {vehicle.is_active === false ? 'Inactive' : 'Active'}
            </Badge>
          </div>

          <div className="mt-6 flex flex-col items-center gap-4 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-950">
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800">
              <QRCode value={vehicle.qr_code || ''} size={240} />
            </div>
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">QR Code</p>
              <p className="mt-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">{vehicle.qr_code}</p>
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={printVehicleQr}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              <Printer className="h-4 w-4" />
              Print QR
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export function VehiclesPage() {
  const [vehicles, setVehicles] = useState([])
  const [depots, setDepots] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [createdVehicle, setCreatedVehicle] = useState(null)
  const [form, setForm] = useState({
    plate_number: '',
    model: '',
    depot_id: '',
  })
  const [formError, setFormError] = useState('')
  const [pageError, setPageError] = useState('')
  const controllerRef = useRef(null)

  const depotOptions = useMemo(() => depots.slice().sort((a, b) => String(a.depot_name || '').localeCompare(String(b.depot_name || ''))), [depots])

  const loadData = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setPageError('')

    try {
      const [vehiclesRes, depotsRes] = await Promise.all([
        apiInstance.get('/logistics/vehicles', { signal: controller.signal }),
        apiInstance.get('/depots', { signal: controller.signal }),
      ])

      if (!controller.signal.aborted) {
        setVehicles(vehiclesRes.data?.data?.vehicles || [])
        setDepots(depotsRes.data?.data?.depots || [])
      }
    } catch (error) {
      if (error.name !== 'CanceledError' && !controller.signal.aborted) {
        setPageError(error?.response?.data?.message || 'Failed to load vehicles.')
        setVehicles([])
        setDepots([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    return () => controllerRef.current?.abort()
  }, [])

  const openCreate = () => {
    setForm({ plate_number: '', model: '', depot_id: depotOptions[0]?.id || '' })
    setFormError('')
    setIsCreateOpen(true)
  }

  const closeCreate = () => {
    setIsCreateOpen(false)
    setFormError('')
  }

  const handleCreateVehicle = async (e) => {
    e.preventDefault()

    if (!form.plate_number.trim()) {
      setFormError('Plate number is required.')
      return
    }

    if (!form.model.trim()) {
      setFormError('Vehicle model is required.')
      return
    }

    if (!form.depot_id) {
      setFormError('Please assign the vehicle to a depot.')
      return
    }

    setIsSubmitting(true)
    setFormError('')

    try {
      const response = await apiInstance.post('/logistics/vehicles', {
        plate_number: form.plate_number.trim(),
        model: form.model.trim(),
        depot_id: form.depot_id,
      })

      const vehicle = response.data?.data?.vehicle || null
      setCreatedVehicle(vehicle)
      closeCreate()
      await loadData()
    } catch (error) {
      setFormError(error?.response?.data?.message || 'Failed to create vehicle.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openQrPreview = (vehicle) => {
    setCreatedVehicle(vehicle)
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Vehicles</h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Create vehicles, assign them to depots, and print the QR used for daily pointage.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="btn-primary"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle
            </button>
          </div>

          {pageError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {pageError}
            </div>
          )}

          {isLoading ? (
            <VehiclesSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Plate</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Model</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Assigned Livreur</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">QR Code</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Status</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicles.map((vehicle) => {
                      const isActive = vehicle.is_active !== false
                      return (
                        <tr key={vehicle.id} className="border-b border-gray-200 dark:border-zinc-800">
                          <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{vehicle.plate_number || '-'}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{vehicle.model || '-'}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{vehicle.depot?.depot_name || '-'}</td>
                          <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{vehicle.current_livreur?.full_name || '-'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex max-w-[180px] items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                              <QrCode className="h-3.5 w-3.5" />
                              <span className="truncate font-mono">{vehicle.qr_code || '-'}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Badge tone={isActive ? 'success' : 'danger'}>
                              {isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              type="button"
                              onClick={() => openQrPreview(vehicle)}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              Print QR
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {vehicles.length === 0 && (
                      <tr>
                        <td className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400" colSpan={7}>
                          No vehicles available.
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

      <AnimatePresence>
        {isCreateOpen && (
          <motion.div
            className="fixed inset-0 z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/45 backdrop-blur-sm"
              onClick={closeCreate}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full w-full max-w-lg overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Add Vehicle</h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create a vehicle, assign it to a depot, and generate its QR code.</p>
                </div>
                <button type="button" onClick={closeCreate} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateVehicle} className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Plate Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.plate_number}
                    onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                    placeholder="e.g. 12345-TR-01"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.model}
                    onChange={(e) => setForm({ ...form, model: e.target.value })}
                    placeholder="e.g. Renault Master"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Depot <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.depot_id}
                    onChange={(e) => setForm({ ...form, depot_id: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  >
                    <option value="">Select depot…</option>
                    {depotOptions.map((depot) => (
                      <option key={depot.id} value={depot.id}>
                        {depot.depot_name}
                      </option>
                    ))}
                  </select>
                  {depotOptions.length === 0 && (
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      No depots found. Create a depot first.
                    </p>
                  )}
                </div>

                {formError && <p className="text-sm text-red-500">{formError}</p>}

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary-flex disabled:opacity-40"
                  >
                    {isSubmitting ? 'Creating…' : 'Create Vehicle'}
                  </button>
                  <button
                    type="button"
                    onClick={closeCreate}
                    className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {createdVehicle && (
          <PrintPreviewModal vehicle={createdVehicle} onClose={() => setCreatedVehicle(null)} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
