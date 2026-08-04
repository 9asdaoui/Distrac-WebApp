import React from 'react'
import { Bell, CheckCheck, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SlideOverPanel } from '../../SlideOverPanel'
import { getNotificationCopy } from '../../../utils/notificationCopy'

const SEVERITY_STYLES = {
  info: 'border-cc-border bg-cc-surface',
  warning: 'border-cc-warning/30 bg-cc-warning/10',
  critical: 'border-cc-error/30 bg-cc-error/10',
}

const BTN_SECONDARY =
  'inline-flex items-center gap-1.5 rounded-cc-control border border-cc-border bg-cc-surface px-3 py-2 text-sm font-medium text-cc-secondary transition hover:border-cc-border-hover hover:bg-cc-surface-hover hover:text-cc-primary'

function formatOccurredAt(value, language) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(language || undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Notification list as a global SlideOverPanel — CC dark tone for depot-ops home.
 * Placement stays viewport slide-over (theme only; see W-CC16).
 */
export function NotificationDrawer({
  open = false,
  notifications = [],
  isLoading = false,
  isError = false,
  onClose,
  onRetry,
  onMarkAllRead,
  onNotificationClick,
}) {
  const { t, i18n } = useTranslation()

  const footer = (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={onMarkAllRead} className={BTN_SECONDARY}>
        <CheckCheck className="h-4 w-4" />
        {t('commandCenter.notifications.markAllRead')}
      </button>
    </div>
  )

  return (
    <SlideOverPanel
      isOpen={open}
      onClose={onClose}
      title={t('commandCenter.notifications.title')}
      description={t('commandCenter.notifications.subtitle')}
      footer={footer}
      maxWidthClass="max-w-2xl"
      tone="cc"
    >
      {isLoading ? (
        <div className="py-10 text-center text-sm text-cc-tertiary">
          {t('commandCenter.notifications.loading')}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-cc-tertiary">
            {t('commandCenter.notifications.loadError')}
          </p>
          <button type="button" onClick={onRetry} className={BTN_SECONDARY}>
            <RefreshCw className="h-4 w-4" />
            {t('commandCenter.notifications.retry')}
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Bell className="h-6 w-6 text-cc-tertiary" />
          <p className="text-sm font-medium text-cc-primary">
            {t('commandCenter.notifications.emptyTitle')}
          </p>
          <p className="text-sm text-cc-secondary">
            {t('commandCenter.notifications.emptyBody')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const copy = getNotificationCopy(notification, t)
            const severityClass =
              SEVERITY_STYLES[notification.severity] || SEVERITY_STYLES.info
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => onNotificationClick?.(notification)}
                className={`w-full rounded-xl border p-3 text-left transition hover:border-cc-border-hover hover:bg-cc-surface-hover ${severityClass} ${
                  notification.isRead
                    ? 'opacity-70'
                    : 'ring-1 ring-cc-accent/25'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!notification.isRead ? (
                        <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-cc-accent" />
                      ) : null}
                      <p className="truncate text-sm font-semibold text-cc-primary">
                        {copy.title}
                      </p>
                    </div>
                    {copy.body ? (
                      <p className="mt-1 text-sm leading-5 text-cc-secondary">
                        {copy.body}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-cc-tertiary">
                    {formatOccurredAt(notification.occurredAt, i18n.language)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </SlideOverPanel>
  )
}

export default NotificationDrawer
