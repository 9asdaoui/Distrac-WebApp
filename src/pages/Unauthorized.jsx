import React from 'react'
import { useNavigate } from 'react-router-dom'
import { LockIcon } from 'lucide-react'

export function Unauthorized() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-8">
          <LockIcon className="w-20 h-20 text-red-600 mx-auto" />
        </div>

        <h1 className="text-4xl font-bold text-red-600 mb-2">Access Denied</h1>
        <p className="mb-6 text-zinc-700 dark:text-zinc-300">
          You do not have the required permissions to access this page. Please contact your administrator if you
          believe this is a mistake.
        </p>

        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="text-sm text-red-800">
            <strong>Error 403:</strong> Insufficient permissions
          </p>
        </div>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-block rounded-lg bg-zinc-900 px-6 py-3 font-medium text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  )
}
