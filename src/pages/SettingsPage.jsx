import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sliders, Truck, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'
import { Unauthorized } from './Unauthorized'

const sections = [
  { id: 'general', label: 'General Settings', icon: Sliders },
  { id: 'logistics', label: 'Logistics Rules', icon: Truck },
  { id: 'inventory', label: 'Inventory Alerts', icon: Package },
]

const defaultForm = {
  company_name: 'DISTRAC',
  mission_dispatch_time: '19:00',
  default_currency: 'MAD',
  low_stock_threshold: 10,
  global_auto_approve_replenishment: false,
}

export function SettingsPage() {
  const { hasPermission } = useAuth()
  const canManageSettings = hasPermission('manage_settings')
  const [activeSection, setActiveSection] = useState('general')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState(defaultForm)

  const readOnly = !canManageSettings

  useEffect(() => {
    let mounted = true

    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const res = await apiInstance.get('/settings')
        const settings = res.data?.data?.settings || {}

        if (!mounted) return
        setForm({
          company_name: settings.company_name || 'DISTRAC',
          mission_dispatch_time: settings.mission_dispatch_time || '19:00',
          default_currency: settings.default_currency || 'MAD',
          low_stock_threshold: Number(settings.low_stock_threshold ?? 10),
          global_auto_approve_replenishment: Boolean(settings.global_auto_approve_replenishment),
        })
      } catch (error) {
        if (!mounted) return
        setMessage({
          type: 'error',
          text: error.response?.data?.message || 'Failed to load system settings',
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchSettings()
    return () => {
      mounted = false
    }
  }, [])

  const saveSettings = async () => {
    if (readOnly) return

    try {
      setIsSaving(true)
      setMessage(null)
      const payload = {
        company_name: form.company_name,
        mission_dispatch_time: form.mission_dispatch_time,
        default_currency: form.default_currency,
        low_stock_threshold: Number(form.low_stock_threshold),
        global_auto_approve_replenishment: Boolean(form.global_auto_approve_replenishment),
      }

      await apiInstance.put('/settings', payload)
      setMessage({ type: 'success', text: 'Settings updated successfully' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save settings',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const cardClass =
    'bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-6'

  const title = useMemo(() => {
    if (activeSection === 'general') return 'General Settings'
    if (activeSection === 'logistics') return 'Logistics Rules'
    return 'Inventory Alerts'
  }, [activeSection])

  if (!canManageSettings) {
    return <Unauthorized />
  }

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-6xl">
        <div className="px-2 py-2 md:px-4 md:py-4">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">System Settings</h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage global business configuration across the platform.
            </p>
          </div>

          {message && (
            <div
              className={`mb-6 flex items-start gap-3 rounded-xl border px-4 py-3 ${
                message.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/30'
                  : 'border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
              )}
              <p
                className={`text-sm ${
                  message.type === 'success'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-red-700 dark:text-red-300'
                }`}
              >
                {message.text}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <aside className="lg:col-span-1">
              <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3">
                <nav className="space-y-1">
                  {sections.map((section) => {
                    const Icon = section.icon
                    const active = activeSection === section.id
                    return (
                      <button
                        key={section.id}
                        type="button"
                        onClick={() => setActiveSection(section.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                          active
                            ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{section.label}</span>
                      </button>
                    )
                  })}
                </nav>
              </div>
            </aside>

            <section className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={cardClass}
                >
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                  </div>

                  {isLoading ? (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading settings...</p>
                  ) : (
                    <div className="space-y-6">
                      {activeSection === 'general' && (
                        <>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                              Company Name
                            </label>
                            <input
                              type="text"
                              value={form.company_name}
                              onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                              disabled={readOnly || isSaving}
                              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-zinc-300 focus:bg-white focus:ring-1 focus:ring-zinc-300/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100"
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                              Default Currency
                            </label>
                            <select
                              value={form.default_currency}
                              onChange={(e) => setForm((prev) => ({ ...prev, default_currency: e.target.value }))}
                              disabled={readOnly || isSaving}
                              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-zinc-300 focus:bg-white focus:ring-1 focus:ring-zinc-300/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100"
                            >
                              <option value="MAD">MAD</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                            </select>
                          </div>
                        </>
                      )}

                      {activeSection === 'logistics' && (
                        <>
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                              Mission Dispatch Time
                            </label>
                            <input
                              type="time"
                              value={form.mission_dispatch_time}
                              onChange={(e) =>
                                setForm((prev) => ({ ...prev, mission_dispatch_time: e.target.value }))
                              }
                              disabled={readOnly || isSaving}
                              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-zinc-300 focus:bg-white focus:ring-1 focus:ring-zinc-300/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100"
                            />
                          </div>
                          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
                            <div>
                              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                Global Auto-Approve Replenishment
                              </p>
                              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                                Automatically approve replenishment requests system-wide.
                              </p>
                            </div>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={form.global_auto_approve_replenishment}
                              onClick={() =>
                                !readOnly &&
                                !isSaving &&
                                setForm((prev) => ({
                                  ...prev,
                                  global_auto_approve_replenishment: !prev.global_auto_approve_replenishment,
                                }))
                              }
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                form.global_auto_approve_replenishment
                                  ? 'bg-zinc-900 dark:bg-zinc-100'
                                  : 'bg-zinc-300 dark:bg-zinc-700'
                              } ${readOnly || isSaving ? 'opacity-60' : ''}`}
                            >
                              <span
                                className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                                  form.global_auto_approve_replenishment ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                        </>
                      )}

                      {activeSection === 'inventory' && (
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Low Stock Alert Threshold
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={form.low_stock_threshold}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                low_stock_threshold: Number(e.target.value || 0),
                              }))
                            }
                            disabled={readOnly || isSaving}
                            className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 outline-none transition-all duration-200 focus:border-zinc-300 focus:bg-white focus:ring-1 focus:ring-zinc-300/30 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800/70 dark:text-zinc-100"
                          />
                        </div>
                      )}

                      <div className="flex justify-end border-t border-zinc-100 pt-6 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={saveSettings}
                          disabled={readOnly || isSaving}
                          className="rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                        >
                          {isSaving ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </section>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
