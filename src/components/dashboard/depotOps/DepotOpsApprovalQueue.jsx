import React, { useMemo, useState } from 'react'
import { useCcNavigation } from '../../../hooks/useCcNavigation'
import { useDepotOpsOverviewContext } from './DepotOpsOverviewContext'
import {
  DepotOpsApprovalQueueSkeleton,
  isDepotOpsOverviewLoading,
} from './DepotOpsLoadingSkeletons'
import { navigateApprovalTarget, resolveApprovalNavTarget } from './approvalNav'
import { PRIORITY_BADGE } from './approvalPriority'

const TYPE_BADGE = {
  cyan: 'bg-[#22d3ee]/12 text-[#67e8f9] border-[#22d3ee]/25',
  teal: 'bg-cc-teal/12 text-cc-teal-hover border-cc-teal/25',
  orange: 'bg-[#f97316]/12 text-[#fdba74] border-[#f97316]/25',
  amber: 'bg-cc-warning/12 text-cc-warning-hover border-cc-warning/25',
}

const VISIBLE_ROWS = 6

function priorityLabel(priority) {
  if (!priority) return 'Low'
  return String(priority).charAt(0).toUpperCase() + String(priority).slice(1).toLowerCase()
}

export function DepotOpsApprovalQueue() {
  const overview = useDepotOpsOverviewContext()
  const nav = useCcNavigation()
  const { openPanel } = nav
  const [tab, setTab] = useState('all')
  const loading = isDepotOpsOverviewLoading(overview)

  const tabs = overview?.approvalQueue?.tabs || [{ id: 'all', label: 'All', count: 0 }]
  const items = overview?.approvalQueue?.items || []

  const rows = useMemo(() => {
    const base = tab === 'all' ? items : items.filter((row) => row.tab === tab || row.kind === tab)
    return base.slice(0, VISIBLE_ROWS)
  }, [tab, items])

  const openRow = (row) => {
    const target = resolveApprovalNavTarget(row)
    if (!target) return
    navigateApprovalTarget(nav, target)
  }

  return (
    <section className="flex h-full min-h-[320px] flex-col rounded-cc-panel border border-cc-border-subtle bg-cc-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-cc-caption font-semibold uppercase tracking-cc-section text-cc-tertiary">
          Pending Approval Queue
        </h3>
      </div>

      {loading ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <DepotOpsApprovalQueueSkeleton />
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {tabs.map((item) => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-cc-caption font-semibold transition ${
                    active
                      ? 'bg-distrac-primary text-white shadow-[0_0_0_1px_rgba(255,107,0,0.4)]'
                      : 'border border-cc-border bg-transparent text-cc-muted hover:border-cc-border-hover hover:text-cc-primary'
                  }`}
                >
                  {item.label} ({item.count ?? 0})
                </button>
              )
            })}
          </div>

          <div className="h-[328px] shrink-0 overflow-hidden rounded-lg border border-cc-border-subtle">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-left">
              <thead className="bg-cc-surface-alt">
                <tr className="h-10 border-b border-cc-border-subtle text-cc-label font-semibold uppercase tracking-cc-label text-cc-tertiary">
                  <th className="px-3 font-semibold">Type</th>
                  <th className="px-3 font-semibold">Reference</th>
                  <th className="px-3 font-semibold">Details</th>
                  <th className="px-3 font-semibold">Requested At</th>
                  <th className="px-3 font-semibold">Priority</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="h-[288px] px-3 text-center align-middle text-cc-body-sm text-cc-tertiary"
                    >
                      No pending items in this tab
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const priority = priorityLabel(row.priority)
                    const target = resolveApprovalNavTarget(row)
                    const clickable = Boolean(target)
                    return (
                      <tr
                        key={`${row.kind}:${row.id}`}
                        tabIndex={clickable ? 0 : undefined}
                        role={clickable ? 'link' : undefined}
                        aria-label={
                          clickable
                            ? `Open ${row.type} ${row.reference}`
                            : undefined
                        }
                        onClick={() => {
                          if (clickable) openRow(row)
                        }}
                        onKeyDown={(e) => {
                          if (!clickable) return
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openRow(row)
                          }
                        }}
                        className={`h-12 border-b border-cc-border-subtle transition last:border-b-0 ${
                          clickable
                            ? 'cursor-pointer hover:bg-[#161b24] focus-visible:bg-[#161b24] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cc-accent/40'
                            : ''
                        }`}
                      >
                        <td className="px-3">
                          <span
                            className={`inline-flex rounded-md border px-2 py-0.5 text-cc-label font-semibold ${
                              TYPE_BADGE[row.typeTone] || TYPE_BADGE.cyan
                            }`}
                          >
                            {row.type}
                          </span>
                        </td>
                        <td className="px-3 text-cc-body-sm font-semibold text-cc-primary">
                          {row.reference}
                        </td>
                        <td className="max-w-[220px] truncate px-3 text-cc-body-sm text-cc-muted">
                          {row.details || row.subtitle}
                        </td>
                        <td className="px-3 text-cc-body-sm tabular-nums text-cc-muted">
                          {row.requestedAtLabel || ''}
                        </td>
                        <td className="px-3">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-cc-label font-bold ${
                              PRIORITY_BADGE[row.priority] ||
                              PRIORITY_BADGE[priority] ||
                              PRIORITY_BADGE.Low
                            }`}
                          >
                            {priority}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => openPanel('exceptions')}
            className="mt-3 self-start text-cc-body-sm font-medium text-cc-accent transition hover:text-cc-accent-hover"
          >
            View all approvals →
          </button>
        </>
      )}
    </section>
  )
}
