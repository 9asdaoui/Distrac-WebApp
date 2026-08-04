import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, Bell, PackageX, Timer } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCcNavigation } from '../../../hooks/useCcNavigation'
import { useDepotOpsOverviewContext } from './DepotOpsOverviewContext'
import { useNotifications } from '../../../hooks/useNotifications'
import { getNotificationCopy } from '../../../utils/notificationCopy'
import { useNotificationDrawer } from './NotificationDrawerContext'
import {
  navigateApprovalTarget,
  resolveNotificationNavTarget,
} from './approvalNav'
import {
  DepotOpsAlertsSkeleton,
  isDepotOpsOverviewLoading,
} from './DepotOpsLoadingSkeletons'
import {
  priorityTone,
  resolveDerivedAlertDisplayPriority,
  resolveNotificationDisplayPriority,
} from './approvalPriority'

function toneIcon(priority) {
  if (priority === 'high') return AlertTriangle
  if (priority === 'medium') return Timer
  return PackageX
}

export function DepotOpsAlerts() {
  const { t, i18n } = useTranslation()
  const nav = useCcNavigation()
  const { openPanel } = nav
  const overview = useDepotOpsOverviewContext()
  const alerts = overview?.alerts || []
  const notificationRevision = overview?.notificationRevision ?? 0
  const { openNotificationDrawer } = useNotificationDrawer()
  const {
    notifications,
    isLoading,
    isError,
    markRead,
    setNotifications,
  } = useNotifications({
    enabled: true,
    limit: 4,
    liveSignal: notificationRevision,
    pollIntervalMs: 3000,
  })

  // Inbox is primary. Derived ops alerts (stock/delay/exceptions) only when /notifications fails.
  const useNotificationPreview = !isError && notifications.length > 0
  const useDerivedFallback = isError && alerts.length > 0
  const overviewLoading = isDepotOpsOverviewLoading(overview)
  const showAlertsSkeleton =
    (isLoading && !isError && notifications.length === 0) ||
    (isError && overviewLoading && alerts.length === 0)
  // Newest first; keep a fixed window so a new arrival drops the oldest card.
  const previewNotifications = notifications.slice(0, 4)

  const formatOccurredAt = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString(i18n.language || undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleNotificationClick = async (notification) => {
    const wasUnread = !notification?.isRead
    try {
      await markRead(notification?.id)
      if (wasUnread) {
        setNotifications((current) =>
          current.map((row) =>
            String(row.id) === String(notification.id) ? { ...row, isRead: true } : row,
          ),
        )
      }
    } catch {
      /* still navigate */
    }
    const target = resolveNotificationNavTarget(notification)
    if (target) {
      navigateApprovalTarget(nav, target)
    }
  }

  const handleFallbackAlertClick = (alert) => {
    if (alert?.panel) openPanel(alert.panel)
  }

  return (
    <section className="rounded-cc-panel border border-cc-border-subtle bg-cc-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-cc-caption font-semibold uppercase tracking-cc-section text-cc-tertiary">
          {t('commandCenter.notifications.previewTitle', { defaultValue: 'Alerts & Notifications' })}
        </h3>
        {useNotificationPreview ? (
          <button
            type="button"
            onClick={openNotificationDrawer}
            className="text-xs font-medium text-cc-accent transition hover:text-cc-accent-hover"
          >
            {t('commandCenter.notifications.seeAll', { defaultValue: 'See all' })}
          </button>
        ) : null}
      </div>
      {useNotificationPreview ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <AnimatePresence initial={false}>
            {previewNotifications.map((notification) => {
              const copy = getNotificationCopy(notification, t)
              const priority = resolveNotificationDisplayPriority(notification)
              const tone = priorityTone(priority)
              const Icon = Bell
              return (
                <motion.button
                  key={notification.id}
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex min-w-0 flex-col rounded-cc-panel border p-3 text-left transition hover:border-cc-border-hover hover:bg-cc-surface-hover ${
                    notification.isRead
                      ? `${tone.border} ${tone.bg} opacity-75`
                      : `ring-1 ring-cc-accent/25 ${tone.border} ${tone.bg}`
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${tone.icon}`} />
                    <p
                      className={`min-w-0 truncate text-cc-body-sm font-semibold ${tone.icon}`}
                      title={copy.title || undefined}
                    >
                      {copy.title}
                    </p>
                  </div>
                  {copy.body ? (
                    <p
                      className="mt-2 min-w-0 truncate text-cc-body-sm leading-snug text-cc-secondary"
                      title={copy.body}
                    >
                      {copy.body}
                    </p>
                  ) : (
                    <div className="mt-2" />
                  )}
                  <p className="mt-2 text-[11px] text-cc-tertiary">
                    {formatOccurredAt(notification.occurredAt)}
                  </p>
                </motion.button>
              )
            })}
          </AnimatePresence>
        </div>
      ) : showAlertsSkeleton ? (
        <DepotOpsAlertsSkeleton />
      ) : useDerivedFallback ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {alerts.map((alert) => {
            const priority = resolveDerivedAlertDisplayPriority(alert)
            const tone = priorityTone(priority)
            const Icon = toneIcon(priority)
            const clickable = Boolean(alert.panel)
            const className = `flex min-w-0 flex-col rounded-cc-panel border ${tone.border} ${tone.bg} p-3 text-left ${
              clickable
                ? 'transition hover:border-cc-border-hover hover:bg-cc-surface-hover'
                : ''
            }`
            const label = alert.badge || alert.severity
            const detail = alert.text || alert.title
            if (clickable) {
              return (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => handleFallbackAlertClick(alert)}
                  className={className}
                  aria-label={`Open ${alert.title || alert.badge}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className={`h-4 w-4 shrink-0 ${tone.icon}`} />
                    <p
                      className={`min-w-0 truncate text-cc-body-sm font-semibold ${tone.icon}`}
                      title={label || undefined}
                    >
                      {label}
                    </p>
                  </div>
                  {detail ? (
                    <p
                      className="mt-2 min-w-0 truncate text-cc-body-sm leading-snug text-cc-secondary"
                      title={detail}
                    >
                      {detail}
                    </p>
                  ) : null}
                </button>
              )
            }
            return (
              <article key={alert.id} className={className}>
                <div className="flex min-w-0 items-center gap-2">
                  <Icon className={`h-4 w-4 shrink-0 ${tone.icon}`} />
                  <p
                    className={`min-w-0 truncate text-cc-body-sm font-semibold ${tone.icon}`}
                    title={label || undefined}
                  >
                    {label}
                  </p>
                </div>
                {detail ? (
                  <p
                    className="mt-2 min-w-0 truncate text-cc-body-sm leading-snug text-cc-secondary"
                    title={detail}
                  >
                    {detail}
                  </p>
                ) : null}
              </article>
            )
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-cc-body-sm text-cc-tertiary">
          {t('commandCenter.notifications.emptyInbox', {
            defaultValue: 'No notifications',
          })}
        </p>
      )}
    </section>
  )
}
