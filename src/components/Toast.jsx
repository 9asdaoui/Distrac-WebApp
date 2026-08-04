import React, { useEffect } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

/**
 * Lightweight top-right toast. Renders nothing when message is empty.
 */
export function Toast({ message, type = 'success', onClose, durationMs = 3000 }) {
  useEffect(() => {
    if (!message || !onClose || !durationMs) return undefined
    const timer = setTimeout(onClose, durationMs)
    return () => clearTimeout(timer)
  }, [message, onClose, durationMs])

  if (!message) return null

  const isSuccess = type === 'success'
  const Icon = isSuccess ? CheckCircle2 : XCircle

  return (
    <div className="fixed right-4 top-4 z-[70] max-w-sm">
      <div
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg ${
          isSuccess
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'
            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200'
        }`}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
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

export default Toast
