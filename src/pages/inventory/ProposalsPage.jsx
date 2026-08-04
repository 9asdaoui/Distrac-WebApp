import React from 'react'
import { ClipboardList } from 'lucide-react'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { usePanelEmbed } from '../../components/map/CcPanelHost'
import { ProposalsInboxPanel } from '../../components/inventory/ProposalsInboxPanel'

/**
 * Standalone route still works; depot CC uses Proposals inside Stock tabs instead of a rail entry.
 */
export function ProposalsPage() {
  const embedded = usePanelEmbed()

  if (embedded) {
    return (
      <DepotCcPageShell
        title="Proposal Inbox"
        subtitle="Review replenishment proposals before conversion to stock requests"
        icon={ClipboardList}
      >
        <ProposalsInboxPanel showIntro={false} />
      </DepotCcPageShell>
    )
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-cc-surface md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <ClipboardList className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Proposal Inbox</h1>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Review system-generated replenishment proposals before conversion to stock requests.
                </p>
              </div>
            </div>
          </div>
          <ProposalsInboxPanel showIntro={false} />
        </div>
      </AnimatedPage>
    </DashboardLayout>
  )
}

export default ProposalsPage
