import React, { useCallback, useState } from 'react'
import { DEPOT_FILTER_ALL } from '../../map/CcMissionFiltersContext'
import { DepotOpsRailHeader } from './DepotOpsRailHeader'
import { DepotOpsOverviewProvider, useDepotOpsOverviewContext } from './DepotOpsOverviewContext'
import { CC_BG } from '../../map/ccTheme'
import { useCcNavigation } from '../../../hooks/useCcNavigation'
import { useNotifications } from '../../../hooks/useNotifications'
import { useNotificationUnreadCount } from '../../../hooks/useNotificationUnreadCount'
import { NotificationDrawer } from './NotificationDrawer'
import { NotificationDrawerProvider } from './NotificationDrawerContext'
import {
  NotificationToastStack,
  useNotificationToasts,
} from './NotificationToastStack'
import {
  navigateApprovalTarget,
  resolveNotificationNavTarget,
} from './approvalNav'

function RailHeaderWithBell(props) {
  const overview = useDepotOpsOverviewContext()
  const nav = useCcNavigation()
  const [notificationOpen, setNotificationOpen] = useState(false)
  const notificationRevision = overview?.notificationRevision ?? 0
  const { count, setCount, refetch: refetchUnreadCount } = useNotificationUnreadCount({
    enabled: true,
    initialCount: 0,
    liveSignal: notificationRevision,
    pollIntervalMs: 3000,
  })
  // Always poll a small inbox slice so arrival toasts work with the drawer closed.
  const {
    notifications: toastSource,
    isLoading: toastSourceLoading,
  } = useNotifications({
    enabled: true,
    limit: 10,
    liveSignal: notificationRevision,
    pollIntervalMs: 3000,
  })
  const {
    notifications,
    isLoading,
    isError,
    refetch: refetchNotifications,
    markRead,
    markAllRead,
  } = useNotifications({
    enabled: notificationOpen,
    limit: 20,
    liveSignal: notificationOpen ? notificationRevision : null,
    pollIntervalMs: notificationOpen ? 3000 : 0,
  })

  const { toasts, dismiss, dismissByNotificationId } = useNotificationToasts(toastSource, {
    enabled: true,
    // Wait until first inbox fetch finishes — never prime on the initial []
    ready: !toastSourceLoading,
  })

  const handleNotificationClick = useCallback(() => {
    setNotificationOpen((open) => !open)
  }, [])

  const handleClose = useCallback(() => {
    setNotificationOpen(false)
  }, [])

  const handleOpenDrawer = useCallback(() => {
    setNotificationOpen(true)
  }, [])

  const handleMarkAllRead = useCallback(async () => {
    await markAllRead()
    setCount(0)
  }, [markAllRead, setCount])

  const handleOpenNotification = useCallback(
    async (notification) => {
      const wasUnread = !notification?.isRead
      try {
        await markRead(notification?.id)
        if (wasUnread) {
          setCount((current) => Math.max(0, Number(current || 0) - 1))
        }
      } catch {
        /* navigation is still allowed even if marking read fails */
      }

      setNotificationOpen(false)
      const target = resolveNotificationNavTarget(notification)
      if (target) {
        navigateApprovalTarget(nav, target)
      }
    },
    [markRead, nav, setCount],
  )

  const handleToastOpen = useCallback(
    (notification) => {
      dismissByNotificationId(notification?.id)
      handleOpenNotification(notification)
    },
    [dismissByNotificationId, handleOpenNotification],
  )

  return (
    <NotificationDrawerProvider value={{ openNotificationDrawer: handleOpenDrawer }}>
      <DepotOpsRailHeader
        {...props}
        notificationCount={count}
        notificationOpen={notificationOpen}
        onNotificationClick={handleNotificationClick}
      />
      <NotificationToastStack
        toasts={toasts}
        onDismiss={dismiss}
        onOpen={handleToastOpen}
      />
      <NotificationDrawer
        open={notificationOpen}
        notifications={notifications}
        isLoading={isLoading}
        isError={isError}
        onClose={handleClose}
        onRetry={() => {
          refetchNotifications()
          refetchUnreadCount().catch(() => {})
        }}
        onMarkAllRead={handleMarkAllRead}
        onNotificationClick={handleOpenNotification}
      />
      {props.children}
    </NotificationDrawerProvider>
  )
}

/**
 * Shared Command Center right-rail chrome: depot ops navbar + body.
 * When fetchDepotOps is true (home rail), loads GET /command-center/depot-ops.
 */
export function CommandCenterRailShell({
  children,
  depotId = DEPOT_FILTER_ALL,
  onDepotChange,
  period,
  onPeriodChange,
  date,
  onDateChange,
  searchQuery = '',
  onSearchChange,
  searchVisible = false,
  searchDisabled = false,
  fetchDepotOps = false,
}) {
  const headerProps = {
    depotId,
    onDepotChange,
    period,
    onPeriodChange,
    date,
    onDateChange,
    searchQuery,
    onSearchChange,
    searchVisible,
    searchDisabled,
  }

  const body = fetchDepotOps ? (
    <RailHeaderWithBell {...headerProps}>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </RailHeaderWithBell>
  ) : (
    <>
      <DepotOpsRailHeader {...headerProps} notificationCount={0} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </>
  )

  return (
    <div
      className="relative flex h-full w-full flex-col overflow-hidden text-cc-primary"
      style={{ backgroundColor: CC_BG }}
    >
      {fetchDepotOps ? (
        <DepotOpsOverviewProvider enabled>{body}</DepotOpsOverviewProvider>
      ) : (
        body
      )}
    </div>
  )
}

export default CommandCenterRailShell
