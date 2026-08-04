import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion } from 'framer-motion'
import {
  User,
  Lock,
  Globe,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
  Building2,
  Warehouse,
  Factory,
} from 'lucide-react'
import apiInstance from '../api/axiosInstance'
import { AnimatedPage } from '../components/AnimatedPage'

export function ProfilePage() {
  const { user, permissions, fetchUserContext } = useAuth()
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState('personal')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  const [personalForm, setPersonalForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar_url: user?.avatar_url || null,
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  const [assignments, setAssignments] = useState({
    sectors: [],
    depots: [],
    industries: [],
  })

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await apiInstance.get('/assignments/my-assignments')
        const data = res.data?.data || {}
        setAssignments({
          sectors: data.sectors || [],
          depots: data.depots || [],
          industries: data.industries || [],
        })
      } catch (err) {
        console.error('Failed to fetch assignments:', err)
      }
    }
    fetchAssignments()
  }, [])

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    setMessage(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await apiInstance.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const uploadItems = Array.isArray(uploadRes.data?.data) ? uploadRes.data.data : []
      const imageUrl = uploadItems[0]?.url || uploadRes.data?.data?.imageUrl || uploadRes.data?.imageUrl
      if (!imageUrl) throw new Error('No imageUrl returned from upload')
      await apiInstance.put('/users/profile', { avatar_url: imageUrl })
      setPersonalForm((prev) => ({ ...prev, avatar_url: imageUrl }))
      await fetchUserContext()
      setMessage({ type: 'success', text: t('profile.profileUpdated') })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('profile.uploadError') })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePersonalInfoSave = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)
    try {
      await apiInstance.put('/users/profile', {
        full_name: personalForm.full_name,
        phone: personalForm.phone,
      })
      await fetchUserContext()
      setMessage({ type: 'success', text: t('profile.profileUpdated') })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('profile.updateError') })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordErrors({})
    setMessage(null)
    const errors = {}
    if (!passwordForm.currentPassword) errors.currentPassword = t('profile.fieldRequired')
    if (!passwordForm.newPassword) errors.newPassword = t('profile.fieldRequired')
    if (passwordForm.newPassword.length < 8) errors.newPassword = t('profile.passwordTooShort')
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = t('profile.passwordMismatch')
    }
    if (Object.keys(errors).length) {
      setPasswordErrors(errors)
      return
    }
    setIsLoading(true)
    try {
      await apiInstance.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setMessage({ type: 'success', text: t('profile.passwordChanged') })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setIsLoading(false)
    }
  }

  const sections = [
    { id: 'personal', label: t('profile.personalInfo'), icon: User },
    { id: 'security', label: t('profile.security'), icon: Lock },
    { id: 'workspace', label: t('profile.myScope'), icon: Globe },
  ]

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-6xl space-y-6">

        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('profile.pageTitle')}</h1>
            <p className="page-subtitle">{t('profile.pageSubtitle')}</p>
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
          {/* Sidebar nav */}
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

          {/* Content panel */}
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
                {/* ── Personal Info ── */}
                {activeSection === 'personal' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('profile.personalInfo')}</h2>
                      <p className="page-subtitle">{t('profile.personalInfoDesc')}</p>
                    </div>

                    <form onSubmit={handlePersonalInfoSave} className="space-y-5">
                      {/* Avatar */}
                      <div>
                        <label className="form-label-normal">{t('profile.avatar')}</label>
                        <div className="flex items-center gap-4">
                          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ring-2 ring-zinc-200 dark:ring-zinc-700">
                            {personalForm.avatar_url ? (
                              <img src={personalForm.avatar_url} alt={personalForm.full_name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-2xl font-bold text-zinc-400 dark:text-zinc-500">
                                {(personalForm.full_name || 'U').charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isLoading}
                              className="btn-secondary btn-secondary-sm"
                            >
                              <Upload className="h-4 w-4" />
                              {t('profile.uploadPhoto')}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="full_name" className="form-label-normal">{t('profile.fullName')}</label>
                        <input
                          id="full_name"
                          type="text"
                          value={personalForm.full_name}
                          onChange={(e) => setPersonalForm({ ...personalForm, full_name: e.target.value })}
                          disabled={isLoading}
                          className="form-input"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="form-label-normal">{t('profile.email')}</label>
                        <input
                          id="email"
                          type="email"
                          value={personalForm.email}
                          readOnly
                          className="form-input opacity-60 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="form-label-normal">{t('profile.phone')}</label>
                        <input
                          id="phone"
                          type="tel"
                          value={personalForm.phone}
                          onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                          disabled={isLoading}
                          className="form-input"
                        />
                      </div>

                      <div className="flex justify-end border-t border-zinc-100 pt-5 dark:border-zinc-800">
                        <button type="submit" disabled={isLoading} className="btn-primary">
                          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{t('profile.saving')}</> : t('profile.saveChanges')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── Security ── */}
                {activeSection === 'security' && (
                  <div>
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('profile.security')}</h2>
                      <p className="page-subtitle">{t('profile.securityDesc')}</p>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-5">
                      {(['currentPassword', 'newPassword', 'confirmPassword']).map((field) => (
                        <div key={field}>
                          <label htmlFor={field} className="form-label-normal">
                            {t(`profile.${field}`)}
                          </label>
                          <input
                            id={field}
                            type="password"
                            value={passwordForm[field]}
                            onChange={(e) => setPasswordForm({ ...passwordForm, [field]: e.target.value })}
                            disabled={isLoading}
                            className={passwordErrors[field] ? 'form-input-error' : 'form-input'}
                          />
                          {passwordErrors[field] && (
                            <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{passwordErrors[field]}</p>
                          )}
                        </div>
                      ))}

                      <div className="flex justify-end border-t border-zinc-100 pt-5 dark:border-zinc-800">
                        <button type="submit" disabled={isLoading} className="btn-primary">
                          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" />{t('profile.changing')}</> : t('profile.changePassword')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* ── Workspace ── */}
                {activeSection === 'workspace' && (
                  <div className="space-y-5">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{t('profile.myScope')}</h2>
                      <p className="page-subtitle">{t('profile.myScopeDesc')}</p>
                    </div>

                    {/* Role */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        <Shield className="h-4 w-4" />
                        <span>{t('profile.role')}</span>
                      </div>
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{user?.role || 'N/A'}</p>
                    </div>

                    {/* Permissions */}
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                      <p className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('profile.permissions')}</p>
                      {permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {permissions.map((perm) => (
                            <span key={perm} className="badge badge-zinc">{perm}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('profile.noPermissions')}</p>
                      )}
                    </div>

                    {/* Assignments */}
                    <div className="space-y-3">
                      {assignments.sectors.map((sector) => (
                        <div key={sector.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <Building2 className="h-4 w-4" /><span>{t('profile.assignedSector')}</span>
                          </div>
                          <p className="text-sm text-zinc-900 dark:text-zinc-100">{sector.name}</p>
                        </div>
                      ))}
                      {assignments.depots.map((depot) => (
                        <div key={depot.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <Warehouse className="h-4 w-4" /><span>{t('profile.assignedDepot')}</span>
                          </div>
                          <p className="text-sm text-zinc-900 dark:text-zinc-100">{depot.depot_name}</p>
                        </div>
                      ))}
                      {assignments.industries.map((industry) => (
                        <div key={industry.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            <Factory className="h-4 w-4" /><span>{t('profile.assignedIndustry')}</span>
                          </div>
                          <p className="text-sm text-zinc-900 dark:text-zinc-100">{industry.name}</p>
                        </div>
                      ))}
                      {assignments.sectors.length === 0 && assignments.depots.length === 0 && assignments.industries.length === 0 && (
                        <div className="empty-state py-10">
                          <Globe className="mx-auto mb-2 h-8 w-8 text-zinc-400 dark:text-zinc-600" />
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{t('profile.noAssignments')}</p>
                        </div>
                      )}
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
