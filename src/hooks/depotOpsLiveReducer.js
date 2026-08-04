const TIMELINE_CAP = 30

function adjustTabCounts(tabs, kind, delta) {
  if (!Array.isArray(tabs) || !kind || !delta) return tabs
  const tabIdByKind = {
    vendor_load: 'vendor_loads',
    livreur_mission: 'livreur_missions',
    return: 'returns',
    payment_change: 'payment_changes',
    check_review: 'check_reviews',
  }
  const targetTab = tabIdByKind[kind]
  return tabs.map((tab) => {
    if (tab.id === 'all' || tab.id === targetTab) {
      return { ...tab, count: Math.max(0, Number(tab.count || 0) + delta) }
    }
    return tab
  })
}

/**
 * Apply a Command Center live WS message onto a depot-ops snapshot view.
 * @param {object|null} state - merged view (snapshot + live)
 * @param {object} action
 */
export function depotOpsLiveReducer(state, action) {
  if (!state) return state

  if (action.type === 'RESET') {
    return action.snapshot || null
  }

  const msg = action.message
  if (!msg?.type) return state

  switch (msg.type) {
    case 'timeline.append': {
      const event = msg.event
      if (!event?.id) return state
      const existing = state.timeline || []
      if (existing.some((row) => String(row.id) === String(event.id))) return state
      return {
        ...state,
        timeline: [event, ...existing].slice(0, TIMELINE_CAP),
      }
    }

    case 'alert.upsert': {
      const alert = msg.alert
      if (!alert?.id) return state
      const alerts = state.alerts || []
      const idx = alerts.findIndex((row) => String(row.id) === String(alert.id))
      const next =
        idx >= 0
          ? alerts.map((row, i) => (i === idx ? { ...row, ...alert } : row))
          : [...alerts, alert]
      return { ...state, alerts: next }
    }

    case 'alert.dismiss': {
      const alertId = msg.alertId
      if (!alertId) return state
      return {
        ...state,
        alerts: (state.alerts || []).filter((row) => String(row.id) !== String(alertId)),
      }
    }

    case 'kpi.patch': {
      if (msg.kpi !== 'pendingApprovals') return state
      const kpis = state.kpis || {}
      const prev = kpis.pendingApprovals || {}
      return {
        ...state,
        kpis: {
          ...kpis,
          pendingApprovals: {
            ...prev,
            total: msg.total ?? prev.total,
            breakdown: msg.breakdown || prev.breakdown,
          },
        },
      }
    }

    case 'notification.count': {
      return {
        ...state,
        notificationCount: Number(msg.count ?? state.notificationCount ?? 0),
        // Always bump so clients refetch inbox even when the numeric count is unchanged.
        notificationRevision: Number(state.notificationRevision || 0) + 1,
      }
    }

    case 'approval.queue': {
      const item = msg.item
      if (!item?.id) return state
      const queue = state.approvalQueue || { items: [], tabs: [], totalPending: 0 }
      const items = queue.items || []

      if (msg.action === 'remove') {
        const nextItems = items.filter((row) => String(row.id) !== String(item.id))
        if (nextItems.length === items.length) return state
        const removed = items.find((row) => String(row.id) === String(item.id))
        return {
          ...state,
          approvalQueue: {
            ...queue,
            items: nextItems,
            totalPending: Math.max(0, Number(queue.totalPending || items.length) - 1),
            tabs: adjustTabCounts(queue.tabs, removed?.kind || item.kind, -1),
          },
        }
      }

      if (msg.action === 'add') {
        if (items.some((row) => String(row.id) === String(item.id))) return state
        return {
          ...state,
          approvalQueue: {
            ...queue,
            items: [item, ...items],
            totalPending: Number(queue.totalPending || items.length) + 1,
            tabs: adjustTabCounts(queue.tabs, item.kind, 1),
          },
        }
      }

      return state
    }

    case 'exception':
      return state

    default:
      return state
  }
}

export default depotOpsLiveReducer
