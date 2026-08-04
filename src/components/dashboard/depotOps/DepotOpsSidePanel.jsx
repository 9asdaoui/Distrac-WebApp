import React from 'react'
import { DepotOpsKpiStrip } from './DepotOpsKpiStrip'
import { DepotOpsTimeline } from './DepotOpsTimeline'
import { DepotOpsApprovalQueue } from './DepotOpsApprovalQueue'
import { DepotOpsAlerts } from './DepotOpsAlerts'
import { useDepotOpsOverviewContext } from './DepotOpsOverviewContext'

/**
 * Depot Command Center home body — KPIs, timeline, queue, alerts.
 * Navbar lives in CommandCenterRailShell.
 */
export function DepotOpsSidePanel() {
  const overview = useDepotOpsOverviewContext()

  if (overview?.isError) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-cc-body text-cc-error">
          {overview.error?.response?.data?.message ||
            overview.error?.message ||
            'Failed to load depot ops'}
        </p>
        <button
          type="button"
          onClick={() => overview.refetch?.()}
          className="rounded-md border border-cc-border px-3 py-1.5 text-cc-body-sm text-cc-secondary transition hover:border-cc-border-hover hover:text-cc-primary"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 space-y-4 overflow-y-auto overflow-x-hidden pt-1 text-cc-primary no-scrollbar">
      <DepotOpsKpiStrip />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.65fr)] xl:items-stretch">
        <DepotOpsTimeline />
        <DepotOpsApprovalQueue />
      </div>

      <DepotOpsAlerts />
    </div>
  )
}

export default DepotOpsSidePanel
