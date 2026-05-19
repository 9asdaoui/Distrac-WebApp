import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Login() {
  const [email, setEmail] = useState('admin@distrac.com')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { login } = useAuth()
  const { t } = useTranslation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-100 p-0 md:p-4 dark:bg-zinc-900">
      <div className="grid min-h-screen grid-cols-1 bg-white md:min-h-[calc(100vh-2rem)] md:grid-cols-2 md:rounded-3xl dark:bg-zinc-950">
        <div className="flex items-center justify-center px-6 py-12 md:px-16">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-lg font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                D
              </div>
              <div>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">DISTRAC</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Control Panel</p>
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{t('login.title')}</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{t('login.subtitle')}</p>
            </div>

            {error && (
              <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('login.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none ring-black/5 transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
                  placeholder="admin@distrac.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('login.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-zinc-900 outline-none ring-black/5 transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {isLoading ? t('login.signingIn') : t('login.signIn')}
              </button>
            </form>

            <p className="mt-8 text-xs text-zinc-500 dark:text-zinc-400">© 2026 DISTRAC. All rights reserved.</p>
          </div>
        </div>

        <div className="hidden md:block">
          <div className="relative m-4 h-[calc(100vh-4rem)] overflow-hidden rounded-2xl">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1400&q=80"
              alt="DISTRAC workspace"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-900/20 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/25 bg-white/15 p-5 backdrop-blur-md">
              <p className="text-sm font-medium text-white">
                “Operational clarity starts with one control surface. DISTRAC makes every delivery decision traceable.”
              </p>
              <p className="mt-2 text-xs text-zinc-200">Logistics Operations Team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
