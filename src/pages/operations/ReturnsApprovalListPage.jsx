import React from 'react'
import { RotateCcw } from 'lucide-react'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'

/** List stub — detail opened from approval queue (W-CC17). */
export function ReturnsApprovalListPage() {
  return (
    <DepotCcPageShell
      title="Returns"
      subtitle="Open a return from the Pending Approval Queue on Home."
      icon={RotateCcw}
    >
      <p className="p-4 text-sm text-cc-tertiary">
        No list yet. Use Home → Pending Approval Queue → Return rows.
      </p>
    </DepotCcPageShell>
  )
}

export default ReturnsApprovalListPage
