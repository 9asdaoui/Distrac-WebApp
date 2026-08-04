/**
 * Resolve Pending Approval Queue row → Command Center navigation target (W-CC17 Option B).
 * @returns {{ mode: 'panel'|'entity'|'href', panel?: string, id?: string, focus?: string, type?: string, tab?: string, href?: string } | null}
 */
export function resolveApprovalNavTarget(row) {
  if (!row?.kind || !row?.id) return null

  switch (row.kind) {
    case 'livreur_mission':
      return { mode: 'panel', panel: 'missions', id: row.id }
    case 'payment_change':
      return { mode: 'panel', panel: 'exceptions', id: row.id }
    case 'vendor_load': {
      const depotId = row.depotId || row.depot_id
      if (!depotId) return null
      return {
        mode: 'entity',
        type: 'depot',
        id: depotId,
        tab: 'vendor_loads',
        focus: row.id,
      }
    }
    case 'return':
      return { mode: 'panel', panel: 'returns', id: row.id }
    case 'check_review':
      return { mode: 'panel', panel: 'check-reviews', id: row.id }
    default:
      return null
  }
}

/**
 * Resolve Operations Timeline row → navigation (W-CC18).
 * Uses sourceType / sourceId / depotId from mapTimelineEvent.
 */
export function resolveTimelineNavTarget(row) {
  const sourceType = String(row?.sourceType || '').toLowerCase()
  const sourceId = row?.sourceId || null
  const depotId = row?.depotId || row?.depot_id || null

  switch (sourceType) {
    case 'mission':
      if (!sourceId) return null
      return { mode: 'panel', panel: 'missions', id: sourceId }
    case 'exception':
      if (!sourceId) return null
      return { mode: 'panel', panel: 'exceptions', id: sourceId }
    case 'vendor_load': {
      if (!depotId || !sourceId) return null
      return {
        mode: 'entity',
        type: 'depot',
        id: depotId,
        tab: 'vendor_loads',
        focus: sourceId,
      }
    }
    case 'return':
      if (!sourceId) return null
      return { mode: 'panel', panel: 'returns', id: sourceId }
    case 'cash_deposit':
      return { mode: 'panel', panel: 'revenue' }
    case 'fulfillment_order':
      return { mode: 'panel', panel: 'fulfillment' }
    default:
      return null
  }
}

/**
 * Resolve inbox / toast notification → CC navigation.
 * Prefers sourceType/sourceId (works when navUrl is null); falls back to navUrl.
 */
export function resolveNotificationNavTarget(notification) {
  if (!notification) return null

  const fromSource = resolveTimelineNavTarget({
    sourceType: notification.sourceType,
    sourceId: notification.sourceId,
    depotId: notification.depotId || notification.depot_id,
  })
  if (fromSource) return fromSource

  const kind = String(notification.kind || '').toLowerCase()
  if (kind.startsWith('mission.') && notification.sourceId) {
    return { mode: 'panel', panel: 'missions', id: notification.sourceId }
  }
  if (kind.startsWith('exception.') && notification.sourceId) {
    return { mode: 'panel', panel: 'exceptions', id: notification.sourceId }
  }
  if (kind.startsWith('vendor_load.') && notification.sourceId) {
    const depotId = notification.depotId || notification.depot_id
    if (depotId) {
      return {
        mode: 'entity',
        type: 'depot',
        id: depotId,
        tab: 'vendor_loads',
        focus: notification.sourceId,
      }
    }
  }

  const href = notification.navUrl || notification.nav_url
  if (!href) return null

  const exceptionMatch = String(href).match(/^\/exceptions\/([^/?#]+)/)
  if (exceptionMatch) {
    return { mode: 'panel', panel: 'exceptions', id: exceptionMatch[1] }
  }
  const missionMatch = String(href).match(/^\/missions\/([^/?#]+)/)
  if (missionMatch) {
    return { mode: 'panel', panel: 'missions', id: missionMatch[1] }
  }
  if (/vendor[-_]?loads/i.test(href)) {
    const depotId = notification.depotId || notification.depot_id
    if (depotId) {
      return {
        mode: 'entity',
        type: 'depot',
        id: depotId,
        tab: 'vendor_loads',
        focus: notification.sourceId || null,
      }
    }
  }
  if (/exceptions/i.test(href)) {
    return { mode: 'panel', panel: 'exceptions' }
  }

  return { mode: 'href', href: String(href) }
}

export function navigateApprovalTarget(nav, target) {
  if (!target || !nav) return false
  if (target.mode === 'panel') {
    nav.openPanel(target.panel, target.id || null, target.focus || null)
    return true
  }
  if (target.mode === 'entity') {
    nav.openMapEntity(target.type, target.id, {
      tab: target.tab,
      focus: target.focus,
    })
    return true
  }
  if (target.mode === 'href' && target.href && typeof nav.navigate === 'function') {
    nav.navigate(target.href, { replace: false })
    return true
  }
  return false
}
