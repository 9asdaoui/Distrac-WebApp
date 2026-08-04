import React, { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sliders, Truck, Package, CheckCircle2, AlertCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { AnimatedPage } from '../components/AnimatedPage'
import apiInstance from '../api/axiosInstance'
import { Unauthorized } from './Unauthorized'

const defaultForm = {
  company_name: 'DISTRAC',
  mission_dispatch_time: '19:00',
  default_currency: 'MAD',
  low_stock_threshold: 10,
  global_auto_approve_replenishment: false,
}

export function SettingsPage() {
  const { hasPermission } = useAuth()
  const { t } = useTranslation()
  const canManageSettings = hasPermission('manage_settings')
  const [activeSection, setActiveSection] = useState('general')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [form, setForm] = useState(defaultForm)

  const sections = [
    { id: 'general', label: t('settings.generalSettings'), icon: Sliders },
    { id: 'logistics', label: t('settings.logisticsRules'), icon: Truck },
    { id: 'inventory', label: t('settings.inventoryAlerts'), icon: Package },
  ]

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
          text: error.response?.data?.message || t('settings.loadError'),
        })
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    fetchSettings()
    return () => {
      mounted = false
    }
  }, [t])

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
      setMessage({ type: 'success', text: t('settings.saveSuccess') })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || t('settings.saveError'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const title = useMemo(() => {
    const section = sections.find(s => s.id === activeSection)
    return section ? section.label : ''
  }, [activeSection, sections])

  if (!canManageSettings) {
    return <Unauthorized />
  }

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('settings.pageTitle')}</h1>
            <p className="page-subtitle">{t('settings.pageSubtitle')}</p>
          </div>
        </div>

        {/* Alert banner */}
        {message && (
          <div className={message.type === 'success' ? 'alert-success' : 'alert-error'}>
            {message.type === 'success' 
              ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              : <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
            }
            <p className={`text-sm ${message.type === 'success' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="card-sm">
              <nav className="space-y-0.5">
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
                          ? 'bg-cc-accent/10 text-cc-accent dark:bg-cc-accent/15 dark:text-cc-accent'
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
                className="card"
              >
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
                </div>

                {isLoading ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('settings.loading')}</p>
                ) : (
                  <div className="space-y-6">
                    {activeSection === 'general' && (
                      <>
                        <div>
                          <label className="form-label-normal">
                            {t('settings.companyName')}
                          </label>
                          <input
                            type="text"
                            value={form.company_name}
                            onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                            disabled={readOnly || isSaving}
                            className="form-input"
                          />
                        </div>
                        <div>
                          <label className="form-label-normal">
                            {t('settings.defaultCurrency')}
                          </label>
                          <select
                            value={form.default_currency}
                            onChange={(e) => setForm((prev) => ({ ...prev, default_currency: e.target.value }))}
                            disabled={readOnly || isSaving}
                            className="form-select"
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
                          <label className="form-label-normal">
                            {t('settings.missionDispatchTime')}
                          </label>
                          <input
                            type="time"
                            value={form.mission_dispatch_time}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, mission_dispatch_time: e.target.value }))
                            }
                            disabled={readOnly || isSaving}
                            className="form-input"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
                          <div>
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                              {t('settings.autoApproveReplenishment')}
                            </p>
                            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                              {t('settings.autoApproveReplenishmentDesc')}
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
                                ? 'bg-distrac-primary'
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
                        <label className="form-label-normal">
                          {t('settings.lowStockThreshold')}
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
                          className="form-input"
                        />
                      </div>
                    )}

                    <div className="flex justify-end border-t border-zinc-100 pt-6 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={saveSettings}
                        disabled={readOnly || isSaving}
                        className="btn-primary"
                      >
                        {isSaving ? t('settings.saving') : t('settings.save')}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </section>
        </div>
      </div>
    </AnimatedPage>
  )
}
