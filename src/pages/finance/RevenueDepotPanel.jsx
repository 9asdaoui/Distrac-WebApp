import React, { useMemo } from 'react'
import { Wallet } from 'lucide-react'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { useCcMissionFilters, missionFilterToday } from '../../components/map/CcMissionFiltersContext'
import { usePanelEmbed } from '../../components/map/CcPanelHost'
import { useDepotOpsOverview } from '../../hooks/useDepotOpsOverview'
import { useScopedDepots } from '../../hooks/useScopedDepots'
import { DepotCashHandoffSection } from './DepotCashHandoffSection'

function KpiCard({ label, value, emphasize = false, hint = null, isLoading }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-cc-surface p-5">
      <p className="text-xs uppercase tracking-wide text-cc-tertiary">{label}</p>
      <p
        className={`mt-2 font-semibold text-cc-primary ${emphasize ? 'text-3xl' : 'text-xl'}`}
      >
        {isLoading ? '—' : value}
      </p>
      {hint && !isLoading ? (
        <p className="mt-2 text-xs text-cc-tertiary">{hint}</p>
      ) : null}
    </div>
  )
}

export function RevenueDepotPanel() {
  const embedded = usePanelEmbed()
  const ccFilters = useCcMissionFilters()
  const { depots } = useScopedDepots()
  const filterDate = embedded && ccFilters ? ccFilters.date : missionFilterToday
  const filterDateFrom = embedded && ccFilters ? ccFilters.dateFrom : filterDate
  const filterDateTo = embedded && ccFilters ? ccFilters.dateTo : filterDate

  const selectedDepotId = embedded && ccFilters ? ccFilters.depotIdForApi : null
  const scopedIds = useMemo(() => new Set(depots.map((d) => String(d.id))), [depots])
  const filterDepotId =
    selectedDepotId && scopedIds.has(String(selectedDepotId)) ? String(selectedDepotId) : null

  const { data, isLoading, refetch } = useDepotOpsOverview({
    date: filterDate,
    dateFrom: filterDateFrom,
    dateTo: filterDateTo,
    depotId: filterDepotId,
    enabled: Boolean(filterDate),
  })

  const cashKpi = data?.kpis?.cashWaiting
  const expectedValue = `${cashKpi?.total || '0'} ${cashKpi?.totalSuffix || 'MAD'}`
  const delayedHint = cashKpi?.delayedLabel || null
  const breakdown = useMemo(() => cashKpi?.breakdown || [], [cashKpi])

  return (
    <DepotCcPageShell
      title="Revenue"
      subtitle="Depot cash collections and end-of-day handoff"
      icon={Wallet}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Expected"
          value={expectedValue}
          emphasize
          hint={delayedHint}
          isLoading={isLoading}
        />
        {breakdown.map((row) => (
          <KpiCard
            key={row.label}
            label={row.label}
            value={row.value}
            isLoading={isLoading}
          />
        ))}
      </div>

      <DepotCashHandoffSection
        variant="cc"
        depotId={filterDepotId || ''}
        dateFrom={filterDateFrom}
        dateTo={filterDateTo}
        onDeposited={() => refetch()}
      />
    </DepotCcPageShell>
  )
}

export default RevenueDepotPanel
