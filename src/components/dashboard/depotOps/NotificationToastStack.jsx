import React, { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getNotificationCopy } from '../../../utils/notificationCopy'

const AUTO_DISMISS_MS = 5200
const MAX_VISIBLE = 3
/** Ignore inbox rows older than this relative to when the toast host mounted. */
const ARRIVAL_SLACK_MS = 8_000
const SEEN_STORAGE_KEY = 'cc.notificationToastSeen.v1'

function loadSeenIds() {
  try {
    const raw = sessionStorage.getItem(SEEN_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
  } catch {
    return new Set()
  }
}

function persistSeenIds(seen) {
  try {
    const ids = [...seen].slice(-300)
    sessionStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* ignore quota / private mode */
  }
}

function occurredAtMs(notification) {
  const raw = notification?.occurredAt || notification?.occurred_at || notification?.createdAt
  if (!raw) return 0
  const t = new Date(raw).getTime()
  return Number.isFinite(t) ? t : 0
}

/**
 * Top-right CC notification toast stack (framer-motion).
 */
export function NotificationToastStack({ toasts, onDismiss, onOpen }) {
  const { t } = useTranslation()

  if (!toasts?.length) return null

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[1300] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.slice(0, MAX_VISIBLE).map((toast) => {
          const copy = getNotificationCopy(toast.notification, t)
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 56, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 30 }}
              className="pointer-events-auto overflow-hidden rounded-xl border border-cc-border bg-cc-surface shadow-cc-panel"
            >
              <div className="flex items-start gap-3 px-3.5 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cc-accent/15 text-cc-accent">
                  <Bell className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => onOpen?.(toast.notification)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-cc-body-sm font-semibold text-cc-primary">
                    {copy.title}
                  </span>
                  {copy.body ? (
                    <span className="mt-0.5 line-clamp-2 block text-cc-caption text-cc-muted">
                      {copy.body}
                    </span>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => onDismiss?.(toast.id)}
                  className="rounded-md p-1 text-cc-tertiary hover:bg-cc-surface-alt hover:text-cc-primary"
                  aria-label={t('common.close', { defaultValue: 'Close' })}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <motion.div
                className="h-0.5 origin-left bg-cc-accent/70"
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: AUTO_DISMISS_MS / 1000, ease: 'linear' }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

/**
 * Track newly arrived notifications and expose toast queue.
 *
 * - Waits for first successful inbox load before priming (avoids empty→full spam)
 * - Marks the initial inbox as seen (no toast on page open)
 * - Age-gates: only toast rows that occurred after this host mounted
 * - Persists seen ids in sessionStorage across remounts
 */
export function useNotificationToasts(
  notifications,
  { enabled = true, ready = false } = {},
) {
  const [toasts, setToasts] = useState([])
  const seenRef = useRef(null)
  const primedRef = useRef(false)
  const bootAtRef = useRef(Date.now())
  const timerMapRef = useRef(new Map())

  const dismiss = useCallback((toastId) => {
    const timer = timerMapRef.current.get(toastId)
    if (timer) {
      window.clearTimeout(timer)
      timerMapRef.current.delete(toastId)
    }
    setToasts((current) => current.filter((row) => row.id !== toastId))
  }, [])

  const dismissByNotificationId = useCallback((notificationId) => {
    if (!notificationId) return
    setToasts((current) => {
      const next = []
      for (const row of current) {
        if (String(row.notification?.id) === String(notificationId)) {
          const timer = timerMapRef.current.get(row.id)
          if (timer) {
            window.clearTimeout(timer)
            timerMapRef.current.delete(row.id)
          }
          continue
        }
        next.push(row)
      }
      return next
    })
  }, [])

  const clear = useCallback(() => {
    for (const timer of timerMapRef.current.values()) {
      window.clearTimeout(timer)
    }
    timerMapRef.current.clear()
    setToasts([])
  }, [])

  useEffect(() => {
    if (!enabled) return
    if (!ready) return
    if (!Array.isArray(notifications)) return

    const ids = notifications.map((row) => String(row.id)).filter(Boolean)

    if (!primedRef.current) {
      const seen = loadSeenIds()
      for (const id of ids) seen.add(id)
      seenRef.current = seen
      persistSeenIds(seen)
      primedRef.current = true
      return
    }

    const seen = seenRef.current || loadSeenIds()
    seenRef.current = seen
    const fresh = []
    const minOccurredAt = bootAtRef.current - ARRIVAL_SLACK_MS

    for (const row of notifications) {
      const id = String(row.id || '')
      if (!id || seen.has(id)) continue

      // Always remember the id so polls / remounts never re-toast it.
      seen.add(id)

      const when = occurredAtMs(row)
      if (when && when < minOccurredAt) continue

      fresh.push(row)
    }

    persistSeenIds(seen)

    if (fresh.length === 0) return

    setToasts((current) => {
      const existingNotifIds = new Set(
        current.map((row) => String(row.notification?.id)).filter(Boolean),
      )
      const additions = []
      for (const notification of fresh) {
        const nid = String(notification.id)
        if (existingNotifIds.has(nid)) continue
        const toastId = `toast-${nid}`
        additions.push({ id: toastId, notification })
        if (!timerMapRef.current.has(toastId)) {
          timerMapRef.current.set(
            toastId,
            window.setTimeout(() => dismiss(toastId), AUTO_DISMISS_MS),
          )
        }
      }
      if (additions.length === 0) return current
      return [...additions, ...current].slice(0, MAX_VISIBLE + 2)
    })
  }, [enabled, ready, notifications, dismiss])

  useEffect(
    () => () => {
      for (const timer of timerMapRef.current.values()) {
        window.clearTimeout(timer)
      }
      timerMapRef.current.clear()
    },
    [],
  )

  return { toasts, dismiss, dismissByNotificationId, clear }
}

export default NotificationToastStack
