import React, { useState } from 'react'
import {
  Banknote,
  CheckCircle2,
  CircleDot,
  Clock3,
  Factory,
  Truck,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { SlideOverPanel } from '../../SlideOverPanel'
import { useCcNavigation } from '../../../hooks/useCcNavigation'
import { useDepotOpsOverviewContext } from './DepotOpsOverviewContext'
import {
  DepotOpsTimelineSkeleton,
  isDepotOpsOverviewLoading,
} from './DepotOpsLoadingSkeletons'
import { navigateApprovalTarget, resolveTimelineNavTarget } from './approvalNav'

const PREVIEW_LIMIT = 7

const STATUS_CLASS = {
  info: 'bg-cc-info/15 text-cc-info-hover',
  success: 'bg-cc-success/15 text-cc-success-hover',
  warning: 'bg-cc-warning/15 text-cc-warning-hover',
  danger: 'bg-cc-error/15 text-cc-error-hover',
}

const ICONS = {
  truck: Truck,
  check: CheckCircle2,
  depart: Truck,
  factory: Factory,
  cash: Banknote,
  clock: Clock3,
}

const ICON_DISC = {
  truck: 'bg-cc-accent',
  depart: 'bg-cc-accent',
  check: 'bg-cc-success',
  cash: 'bg-cc-success',
  factory: 'bg-cc-warning',
  clock: 'bg-cc-error',
}

function iconForEvent(row) {
  const kind = String(row.kind || '').toLowerCase()
  if (kind.includes('cash')) return 'cash'
  if (kind.includes('mission') || kind.includes('approved')) return 'check'
  if (kind.includes('depart')) return 'depart'
  if (kind.includes('vendor') || kind.includes('load')) return 'truck'
  if (kind.includes('pickup') || kind.includes('industry')) return 'factory'
  if (kind.includes('wait') || kind.includes('pending')) return 'clock'
  return 'truck'
}

function TimelineRow({ row, isLast, onOpen }) {
  const iconKey = row.icon || iconForEvent(row)
  const Icon = ICONS[iconKey] || CircleDot
  const discClass = ICON_DISC[iconKey] || 'bg-cc-accent'
  const target = resolveTimelineNavTarget(row)
  const clickable = Boolean(target)

  return (
    <li
      className={`relative flex items-start gap-2.5 pb-4 last:pb-0 ${
        clickable
          ? 'cursor-pointer rounded-lg -mx-1 px-1 hover:bg-cc-surface-hover/60 focus-visible:bg-cc-surface-hover/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cc-accent/40'
          : ''
      }`}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'link' : undefined}
      aria-label={clickable ? `Open ${row.title}` : undefined}
      onClick={() => {
        if (clickable) onOpen(row)
      }}
      onKeyDown={(e) => {
        if (!clickable) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(row)
        }
      }}
    >
      <span className="w-10 shrink-0 pt-1.5 text-cc-caption font-medium tabular-nums text-cc-tertiary">
        {row.time}
      </span>

      <div className="relative flex w-8 shrink-0 flex-col items-center">
        {!isLast ? (
          <span
            className="absolute left-1/2 top-7 bottom-[-16px] w-px -translate-x-1/2 bg-cc-border"
            aria-hidden
          />
        ) : null}
        <span
          className={`relative z-[1] flex h-7 w-7 items-center justify-center rounded-full ${discClass}`}
        >
          <Icon className="h-3.5 w-3.5 text-white" strokeWidth={2.25} />
        </span>
      </div>

      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-cc-body font-medium leading-snug text-cc-primary">{row.title}</p>
            <p className="mt-0.5 text-cc-caption text-cc-tertiary">{row.subtitle}</p>
          </div>
          <span
            className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              STATUS_CLASS[row.tone] || STATUS_CLASS.info
            }`}
          >
            {row.status}
          </span>
        </div>
      </div>
    </li>
  )
}

function TimelineList({ rows, onOpen }) {
  return (
    <ol className="min-h-0 flex-1 space-y-0 overflow-y-auto pr-1 no-scrollbar">
      {rows.map((row, index) => (
        <TimelineRow
          key={row.id}
          row={row}
          isLast={index === rows.length - 1}
          onOpen={onOpen}
        />
      ))}
    </ol>
  )
}

export function DepotOpsTimeline() {
  const { t } = useTranslation()
  const overview = useDepotOpsOverviewContext()
  const nav = useCcNavigation()
  const rows = overview?.timeline || []
  const loading = isDepotOpsOverviewLoading(overview)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const openRow = (row) => {
    const target = resolveTimelineNavTarget(row)
    if (!target) return
    setDrawerOpen(false)
    navigateApprovalTarget(nav, target)
  }

  const previewRows = rows.slice(0, PREVIEW_LIMIT)
  const hasMore = rows.length > PREVIEW_LIMIT

  return (
    <>
      <section className="flex h-full min-h-[320px] flex-col rounded-cc-panel border border-cc-border-subtle bg-cc-surface p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-cc-caption font-semibold uppercase tracking-cc-section text-cc-tertiary">
            {t('commandCenter.timeline.title', { defaultValue: 'Operations Timeline' })}
          </h3>
          {!loading ? (
            <span className="inline-flex items-center gap-1.5 text-cc-caption font-semibold text-cc-success">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cc-success opacity-50" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cc-success" />
              </span>
              {t('commandCenter.timeline.live', { defaultValue: 'Live' })}
            </span>
          ) : (
            <span className="inline-block h-3 w-10 animate-pulse rounded bg-[#2a3140]" aria-hidden />
          )}
        </div>

        {loading ? (
          <DepotOpsTimelineSkeleton />
        ) : rows.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-cc-body-sm text-cc-tertiary">
            {t('commandCenter.timeline.empty', { defaultValue: 'No activity yet' })}
          </div>
        ) : (
          <>
            <TimelineList rows={previewRows} onOpen={openRow} />
            {hasMore ? (
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="mt-3 w-full rounded-cc-control border border-cc-border bg-cc-surface px-3 py-2 text-cc-body-sm font-medium text-cc-secondary transition hover:border-cc-border-hover hover:bg-cc-surface-hover hover:text-cc-primary"
              >
                {t('commandCenter.timeline.viewAll', {
                  defaultValue: 'View all ({{count}})',
                  count: rows.length,
                })}
              </button>
            ) : null}
          </>
        )}
      </section>

      <SlideOverPanel
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('commandCenter.timeline.title', { defaultValue: 'Operations Timeline' })}
        description={t('commandCenter.timeline.drawerSubtitle', {
          defaultValue: 'All activity for the selected depot and date',
        })}
        maxWidthClass="max-w-2xl"
        tone="cc"
      >
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-cc-tertiary">
            {t('commandCenter.timeline.empty', { defaultValue: 'No activity yet' })}
          </div>
        ) : (
          <TimelineList rows={rows} onOpen={openRow} />
        )}
      </SlideOverPanel>
    </>
  )
}
