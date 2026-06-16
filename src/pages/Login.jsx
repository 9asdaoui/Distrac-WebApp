import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle, Eye, EyeOff, Loader2, Truck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setError(null)
    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: null }))
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    setError(null)
    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: null }))
  }

  const validate = () => {
    const errors = {}
    if (!email) errors.email = t('login.emailRequired')
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = t('login.emailInvalid')
    if (!password) errors.password = t('login.passwordRequired')
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = validate()
    if (Object.keys(errors).length) {
      setFieldErrors(errors)
      return
    }
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password)
      navigate('/global-map')
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('login.loginFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-4 dark:bg-zinc-950">
      <div className="grid min-h-screen grid-cols-1 bg-white md:min-h-[calc(100vh-2rem)] md:grid-cols-2 md:rounded-3xl dark:bg-zinc-900">

        {/* Left: form panel */}
        <div
          className="relative flex items-center justify-center px-6 py-12 md:px-16"
          style={{
            backgroundImage: 'radial-gradient(circle, #d4d4d8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-white/85 dark:bg-zinc-900/90" />

          <div className="relative z-10 w-full max-w-sm">

            {/* Logo */}
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff6b00] shadow-md">
                <Truck className="h-5 w-5 text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold tracking-widest text-zinc-900 dark:text-zinc-100">DISTRAC</p>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">Admin Console</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {t('login.title')}
              </h1>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{t('login.subtitle')}</p>
            </div>

            {/* Server error banner */}
            {error && (
              <div className="mb-5 alert-error">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>

              {/* Email */}
              <div>
                <label htmlFor="email" className="form-label">
                  {t('login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  disabled={isLoading}
                  autoComplete="email"
                  className={fieldErrors.email ? 'form-input-error' : 'form-input'}
                  placeholder="you@distrac.com"
                />
                {fieldErrors.email && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" /> {fieldErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="form-label">
                    {t('login.password')}
                  </label>
                  <button
                    type="button"
                    className="text-xs text-zinc-500 transition hover:text-[#ff6b00] dark:text-zinc-400 dark:hover:text-[#ff6b00]"
                    tabIndex={-1}
                  >
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    disabled={isLoading}
                    autoComplete="current-password"
                    className={`pr-11 ${fieldErrors.password ? 'form-input-error' : 'form-input'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-zinc-400 transition hover:text-[#ff6b00] dark:hover:text-[#ff6b00]"
                    tabIndex={-1}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" /> {fieldErrors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-primary-block mt-1 py-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('login.signingIn')}
                  </>
                ) : (
                  t('login.signIn')
                )}
              </button>
            </form>

            {/* Footer */}
            <p className="mt-10 border-t border-zinc-100 pt-5 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-500">
              &copy; 2026 DISTRAC. {t('login.allRightsReserved')}
            </p>
          </div>
        </div>

        {/* Right: hero panel */}
        <div className="hidden md:block">
          <div className="relative m-4 h-[calc(100vh-4rem)] overflow-hidden rounded-2xl bg-zinc-900">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80"
              alt="DISTRAC logistics operations"
              className="h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/20 via-transparent to-zinc-950/80" />

            {/* bottom quote */}
            <div className="absolute bottom-6 left-6 right-6">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-5 backdrop-blur-md">
                <p className="text-sm font-medium leading-relaxed text-white">
                  "{t('login.heroQuote')}"
                </p>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff6b00]/30 border border-[#ff6b00]/40">
                    <Truck className="h-3.5 w-3.5 text-[#ff6b00]" />
                  </div>
                  <span className="text-xs text-zinc-300">DISTRAC Logistics Intelligence</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}