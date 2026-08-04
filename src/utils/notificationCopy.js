function withFallback(value, fallback = null) {
  return value == null || value === '' ? fallback : value
}

export function getNotificationCopy(notification, t) {
  const kind = notification?.kind || ''
  const payload = notification?.payload || {}
  const titleFallback = notification?.title || t('commandCenter.notifications.fallbackTitle')
  const bodyFallback = notification?.body || null

  switch (kind) {
    case 'mission.approved':
      return {
        title: t('commandCenter.notifications.kinds.missionApproved.title'),
        body: payload.assignedAgentName
          ? t('commandCenter.notifications.kinds.missionApproved.body', {
              name: payload.assignedAgentName,
            })
          : bodyFallback,
      }
    case 'exception.raised':
      return {
        title: t('commandCenter.notifications.kinds.exceptionRaised.title', {
          type: withFallback(payload.exceptionType, t('commandCenter.notifications.unknownType')),
        }),
        body: withFallback(payload.reason, bodyFallback),
      }
    case 'exception.approved':
      return {
        title: t('commandCenter.notifications.kinds.exceptionApproved.title'),
        body: withFallback(payload.notes, bodyFallback),
      }
    case 'exception.rejected':
      return {
        title: t('commandCenter.notifications.kinds.exceptionRejected.title'),
        body: withFallback(payload.notes, bodyFallback),
      }
    case 'vendor_load.approved':
      return {
        title: t('commandCenter.notifications.kinds.vendorLoadApproved.title'),
        body: payload.vendorName
          ? t('commandCenter.notifications.kinds.vendorLoadApproved.body', {
              name: payload.vendorName,
            })
          : bodyFallback,
      }
    case 'vendor_load.rejected':
      return {
        title: t('commandCenter.notifications.kinds.vendorLoadRejected.title'),
        body: payload.reason
          ? t('commandCenter.notifications.kinds.vendorLoadRejected.body', {
              reason: payload.reason,
            })
          : bodyFallback,
      }
    case 'credit_approval.requested':
      return {
        title: t('commandCenter.notifications.kinds.creditApprovalRequested.title'),
        body: payload.reason
          ? t('commandCenter.notifications.kinds.creditApprovalRequested.body', {
              reason: payload.reason,
            })
          : bodyFallback,
      }
    case 'credit_approval.approved':
      return {
        title: t('commandCenter.notifications.kinds.creditApprovalApproved.title'),
        body: withFallback(payload.note, bodyFallback),
      }
    case 'credit_approval.rejected':
      return {
        title: t('commandCenter.notifications.kinds.creditApprovalRejected.title'),
        body: withFallback(payload.note, bodyFallback),
      }
    default:
      return {
        title: titleFallback,
        body: bodyFallback,
      }
  }
}

export default getNotificationCopy
