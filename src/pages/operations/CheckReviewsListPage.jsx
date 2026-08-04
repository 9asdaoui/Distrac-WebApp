import React from 'react'
import { CreditCard } from 'lucide-react'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'

/** List stub — detail opened from approval queue (W-CC17 / W-L55). */
export function CheckReviewsListPage() {
  return (
    <DepotCcPageShell
      title="Check reviews"
      subtitle="Open a check review from the Pending Approval Queue on Home."
      icon={CreditCard}
    >
      <p className="p-4 text-sm text-cc-tertiary">
        No full inbox yet. Use Home → Pending Approval Queue → Check Review rows.
      </p>
    </DepotCcPageShell>
  )
}

export default CheckReviewsListPage
