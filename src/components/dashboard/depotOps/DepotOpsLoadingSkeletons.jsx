import React from 'react'

const BONE = 'animate-pulse rounded-md bg-[#2a3140]'

function KpiFooterSkeleton() {
  return (
    <div className="relative mt-auto -mx-3 border-t border-white/10 px-3 pt-3 pb-1">
      <span className={`inline-block h-[13px] w-[120px] ${BONE}`} />
    </div>
  )
}

function KpiHeaderSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-6 w-6 shrink-0 rounded-md ${BONE}`} />
      <span className={`h-[11px] w-[88px] ${BONE}`} />
    </div>
  )
}

function KpiValueSkeleton() {
  return (
    <div className="mt-2.5 flex justify-center">
      <span className={`h-7 w-10 ${BONE}`} />
    </div>
  )
}

function KpiBreakdownSkeleton({ rows = 3, className = 'mt-2.5' }) {
  return (
    <ul className={`${className} flex-1 space-y-1.5`}>
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex min-h-[18px] items-center justify-between gap-2">
          <span className={`h-3 w-[72px] max-w-[65%] ${BONE}`} />
          <span className={`h-3 w-5 shrink-0 ${BONE}`} />
        </li>
      ))}
    </ul>
  )
}

/** Standard KPI card — matches KpiCard layout in DepotOpsKpiStrip */
function KpiCardSkeleton({ breakdownRows = 3, breakdownClassName = 'mt-3.5', colSpan = '' }) {
  return (
    <article
      className={`relative flex min-h-[188px] flex-col overflow-hidden rounded-[12px] border border-[#2a3140]/80 bg-[#0f131a] p-4 shadow-[0_1px_0_rgba(255,255,255,0.02)] ${colSpan}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-white/[0.02]" aria-hidden />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <KpiHeaderSkeleton />
        <KpiValueSkeleton />
        <KpiBreakdownSkeleton rows={breakdownRows} className={breakdownClassName} />
        <KpiFooterSkeleton />
      </div>
    </article>
  )
}

/** Stock health card — gauge + 3 breakdown rows, no center total */
function KpiHealthCardSkeleton({ colSpan = '' }) {
  return (
    <article
      className={`relative flex min-h-[188px] flex-col overflow-hidden rounded-[12px] border border-[#8b5cf6]/25 bg-[#0f131a] p-4 ${colSpan}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[#8b5cf6]/[0.07]" aria-hidden />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <KpiHeaderSkeleton />
        <div className="mt-4 flex flex-1 flex-col items-center justify-center">
          <span className={`h-[66px] w-[116px] rounded-full ${BONE}`} />
        </div>
        <ul className="mt-2 space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex min-h-[18px] items-center justify-between gap-2">
              <span className={`h-3 w-[72px] ${BONE}`} />
              <span className={`h-3 w-5 ${BONE}`} />
            </li>
          ))}
        </ul>
        <KpiFooterSkeleton />
      </div>
    </article>
  )
}

export function DepotOpsKpiStripSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5" aria-busy="true" aria-label="Loading KPIs">
      <KpiCardSkeleton breakdownRows={5} />
      <KpiCardSkeleton breakdownRows={4} />
      <KpiCardSkeleton breakdownRows={4} />
      <KpiCardSkeleton breakdownRows={2} breakdownClassName="mt-7" />
      <KpiHealthCardSkeleton colSpan="col-span-2 xl:col-span-1" />
    </div>
  )
}

export function DepotOpsTimelineSkeleton() {
  return (
    <ol className="min-h-0 flex-1 space-y-0 overflow-hidden pr-1" aria-busy="true" aria-label="Loading timeline">
      {Array.from({ length: 6 }).map((_, index) => (
        <li key={index} className="relative flex items-start gap-2.5 pb-4 last:pb-0">
          <span className={`w-10 shrink-0 pt-1.5 ${BONE} h-3`} />
          <div className="relative flex w-8 shrink-0 flex-col items-center">
            <span className={`relative z-[1] h-7 w-7 rounded-full ${BONE}`} />
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <span className={`block h-[15px] w-full max-w-[200px] ${BONE}`} />
                <span className={`block h-3 w-full max-w-[140px] ${BONE}`} />
              </div>
              <span className={`h-[18px] w-16 shrink-0 rounded-md ${BONE}`} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function DepotOpsApprovalQueueSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true" aria-label="Loading approval queue">
      <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
        {['All', 'Vendor Loads', 'Livreur Missions', 'Returns', 'Payment Changes', 'Check Reviews'].map(
          (label) => (
            <span
              key={label}
              className={`h-[30px] shrink-0 rounded-full px-3 py-1.5 ${BONE}`}
              style={{ width: `${Math.max(label.length * 7 + 32, 72)}px` }}
            />
          ),
        )}
      </div>

      <div className="h-[328px] shrink-0 overflow-hidden rounded-lg border border-cc-border-subtle">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
          <thead className="bg-cc-surface-alt">
            <tr className="h-10 border-b border-cc-border-subtle">
              {['Type', 'Reference', 'Details', 'Requested At', 'Priority', 'Actions'].map((col) => (
                <th key={col} className="px-3">
                  <span className={`inline-block h-3 w-16 ${BONE}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, row) => (
              <tr key={row} className="h-12 border-b border-cc-border-subtle last:border-b-0">
                <td className="px-3">
                  <span className={`inline-block h-5 w-[88px] rounded-md ${BONE}`} />
                </td>
                <td className="px-3">
                  <span className={`inline-block h-3.5 w-20 ${BONE}`} />
                </td>
                <td className="px-3">
                  <span className={`inline-block h-3.5 w-[140px] max-w-full ${BONE}`} />
                </td>
                <td className="px-3">
                  <span className={`inline-block h-3.5 w-24 ${BONE}`} />
                </td>
                <td className="px-3">
                  <span className={`inline-block h-5 w-14 rounded-full ${BONE}`} />
                </td>
                <td className="px-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-7 w-7 rounded-md ${BONE}`} />
                    <span className={`h-7 w-7 rounded-md ${BONE}`} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className={`mt-3 inline-block h-[14px] w-[140px] ${BONE}`} />
    </div>
  )
}

export function DepotOpsAlertsSkeleton() {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      aria-busy="true"
      aria-label="Loading alerts"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-[108px] flex-col rounded-cc-panel border border-cc-border-subtle bg-cc-surface-alt/40 p-3"
        >
          <div className="flex items-center gap-2">
            <span className={`h-4 w-4 shrink-0 rounded ${BONE}`} />
            <span className={`h-[14px] flex-1 max-w-[120px] ${BONE}`} />
          </div>
          <div className="mt-2 flex-1 space-y-1.5">
            <span className={`block h-[14px] w-full ${BONE}`} />
            <span className={`block h-[14px] w-4/5 ${BONE}`} />
          </div>
          <span className={`mt-2 h-[11px] w-24 ${BONE}`} />
        </div>
      ))}
    </div>
  )
}

/** True while the depot-ops overview has not arrived yet (initial load / filter change). */
export function isDepotOpsOverviewLoading(overview) {
  if (!overview?.canFetch || overview?.isError) return false
  return Boolean(overview?.isLoading || !overview?.data)
}
