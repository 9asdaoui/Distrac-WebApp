/**
 * Fixed approval priorities + CC display tones.
 * high = orange · medium = yellow · low = grey
 */

export const APPROVAL_KIND_PRIORITY = Object.freeze({
  vendor_load: 'medium',
  livreur_mission: 'low',
  return: 'high',
  payment_change: 'high',
  check_review: 'high',
})

/** Badge classes for Pending Approval Queue. */
export const PRIORITY_BADGE = Object.freeze({
  high: 'bg-[#f97316]/15 text-[#fdba74] border-[#f97316]/30',
  medium: 'bg-cc-warning/15 text-cc-warning-hover border-cc-warning/30',
  low: 'bg-[#94a3b8]/15 text-[#94a3b8] border-[#94a3b8]/30',
  High: 'bg-[#f97316]/15 text-[#fdba74] border-[#f97316]/30',
  Medium: 'bg-cc-warning/15 text-cc-warning-hover border-cc-warning/30',
  Low: 'bg-[#94a3b8]/15 text-[#94a3b8] border-[#94a3b8]/30',
})

/** Card tones for Alerts & Notifications. */
export const PRIORITY_TONES = Object.freeze({
  high: {
    border: 'border-[#f97316]/35',
    bg: 'bg-[#f97316]/10',
    icon: 'text-[#f97316]',
    link: 'text-[#f97316] hover:text-[#fb923c]',
  },
  medium: {
    border: 'border-cc-warning/35',
    bg: 'bg-cc-warning/10',
    icon: 'text-cc-warning',
    link: 'text-cc-warning hover:text-cc-warning-hover',
  },
  low: {
    border: 'border-[#94a3b8]/35',
    bg: 'bg-[#94a3b8]/10',
    icon: 'text-[#94a3b8]',
    link: 'text-[#94a3b8] hover:text-[#cbd5e1]',
  },
})

/**
 * Map inbox / derived severity → display priority when not approval-linked.
 * critical|high → high · warning|medium|low_stock → medium · else → low
 */
export function severityToPriority(severity) {
  const value = String(severity || '').toLowerCase()
  if (value === 'critical' || value === 'high') return 'high'
  if (value === 'warning' || value === 'medium' || value === 'low_stock') return 'medium'
  return 'low'
}

/**
 * Resolve approval kind from an inbox notification (sourceType / kind / payload).
 * @returns {keyof typeof APPROVAL_KIND_PRIORITY | null}
 */
export function resolveApprovalKindFromNotification(notification) {
  if (!notification) return null

  const sourceType = String(notification.sourceType || '').toLowerCase()
  const kind = String(notification.kind || '').toLowerCase()
  const payload = notification.payload && typeof notification.payload === 'object'
    ? notification.payload
    : {}
  const exceptionType = String(
    payload.exceptionType || payload.exception_type || '',
  ).toUpperCase()

  if (sourceType === 'vendor_load' || kind.includes('vendor_load')) return 'vendor_load'
  if (sourceType === 'return' || kind.startsWith('return')) return 'return'
  if (sourceType === 'check_review' || kind.includes('check_review')) return 'check_review'
  if (
    sourceType === 'payment_change' ||
    kind.includes('payment_change') ||
    exceptionType.includes('PAYMENT')
  ) {
    return 'payment_change'
  }
  if (sourceType === 'mission' || kind.startsWith('mission')) return 'livreur_mission'

  return null
}

/** Display priority for an Alerts card from inbox notification. */
export function resolveNotificationDisplayPriority(notification) {
  const approvalKind = resolveApprovalKindFromNotification(notification)
  if (approvalKind && APPROVAL_KIND_PRIORITY[approvalKind]) {
    return APPROVAL_KIND_PRIORITY[approvalKind]
  }
  return severityToPriority(notification?.severity)
}

/** Display priority for derived ops alert fallback rows. */
export function resolveDerivedAlertDisplayPriority(alert) {
  return severityToPriority(alert?.severity)
}

export function priorityTone(priority) {
  return PRIORITY_TONES[priority] || PRIORITY_TONES.low
}
