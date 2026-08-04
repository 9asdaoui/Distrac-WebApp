import React from 'react'
import {
  Banknote,
  CheckCircle2,
  ClipboardList,
  Truck,
  Warehouse,
} from 'lucide-react'
import { useCcNavigation } from '../../../hooks/useCcNavigation'
import { useDepotOpsOverviewContext } from './DepotOpsOverviewContext'
import {
  DepotOpsKpiStripSkeleton,
  isDepotOpsOverviewLoading,
} from './DepotOpsLoadingSkeletons'

const VALUE_TONE = {
  muted: 'text-[#9aa3b2]',
  orange: 'text-[#f5a524]',
  blue: 'text-[#4a90e2]',
  green: 'text-[#30a46c]',
  red: 'text-[#e5484d]',
  amber: 'text-[#f5a524]',
  teal: 'text-[#14b8a6]',
}

const CARD_ACCENT = {
  red: {
    iconBg: 'bg-[#e5484d]/15',
    icon: 'text-[#e5484d]',
    border: 'border-[#e5484d]/25',
    tint: 'bg-[#e5484d]/[0.07]',
  },
  blue: {
    iconBg: 'bg-[#4a90e2]/15',
    icon: 'text-[#4a90e2]',
    border: 'border-[#4a90e2]/25',
    tint: 'bg-[#4a90e2]/[0.07]',
  },
  teal: {
    iconBg: 'bg-[#14b8a6]/15',
    icon: 'text-[#14b8a6]',
    border: 'border-[#14b8a6]/25',
    tint: 'bg-[#14b8a6]/[0.07]',
  },
  amber: {
    iconBg: 'bg-[#f5a524]/15',
    icon: 'text-[#f5a524]',
    border: 'border-[#f5a524]/25',
    tint: 'bg-[#f5a524]/[0.07]',
  },
  violet: {
    iconBg: 'bg-[#8b5cf6]/15',
    icon: 'text-[#8b5cf6]',
    border: 'border-[#8b5cf6]/25',
    tint: 'bg-[#8b5cf6]/[0.07]',
  },
}

const EMPTY_KPI = {
  pendingApprovals: {
    title: 'Pending Approvals',
    total: 0,
    breakdown: [],
  },
  todaysMissions: {
    title: "Today's Missions",
    total: 0,
    breakdown: [],
  },
  warehouseOperations: {
    title: 'Shipment',
    total: 0,
    breakdown: [],
  },
  cashWaiting: {
    title: 'Revenue',
    total: '0',
    totalSuffix: 'MAD',
    breakdown: [],
  },
  warehouseHealth: {
    title: 'Stock Health',
    capacityPct: 0,
    breakdown: [],
  },
}

function KpiCard({
  title,
  value,
  valueSuffix,
  accent,
  icon: Icon,
  breakdown,
  onClick,
  breakdownClassName = 'mt-3.5',
}) {
  const a = CARD_ACCENT[accent] || CARD_ACCENT.blue

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${title}`}
      className={`relative flex min-h-[188px] w-full flex-col overflow-hidden rounded-[12px] border ${a.border} bg-[#0f131a] p-4 text-left shadow-[0_1px_0_rgba(255,255,255,0.02)] transition hover:border-cc-border-hover hover:bg-[#121821] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cc-accent/40`}
    >
      <div className={`pointer-events-none absolute inset-0 ${a.tint}`} aria-hidden />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${a.iconBg}`}>
            <Icon className={`h-3.5 w-3.5 ${a.icon}`} />
          </span>
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7a8494]">
            {title}
          </p>
        </div>

        <p className="mt-3.5 text-center text-[30px] font-bold leading-none tracking-tight text-white">
          {value}
          {valueSuffix ? (
            <span className="ml-1 text-[14px] font-semibold text-[#9aa3b2]">{valueSuffix}</span>
          ) : null}
        </p>

        <ul className={`${breakdownClassName} flex-1 space-y-2`}>
          {(breakdown || []).map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2 text-[12px]">
              <span className="truncate text-[#7a8494]">{row.label}</span>
              <span className={`shrink-0 font-semibold tabular-nums ${VALUE_TONE[row.tone] || VALUE_TONE.muted}`}>
                {row.value}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  )
}

/** True 180° semicircle gauge; teal/cyan progress on a dark track. */
function CapacityGauge({ pct }) {
  const clamped = Math.max(0, Math.min(100, Number(pct) || 0))
  const r = 42
  const c = 2 * Math.PI * r
  const half = c / 2
  const offset = half - (clamped / 100) * half
  const gradId = 'kpi-capacity-gauge-grad'

  return (
    <div className="relative mx-auto h-[66px] w-[116px]">
      <svg className="h-[66px] w-[116px]" viewBox="0 0 116 66" aria-hidden>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <g transform="translate(58 58)">
          <circle
            r={r}
            fill="none"
            stroke="#2a3140"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${half} ${c}`}
            transform="rotate(180)"
          />
          <circle
            r={r}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${half} ${c}`}
            strokeDashoffset={offset}
            transform="rotate(180)"
          />
        </g>
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[28px] flex items-center justify-center">
        <span className="text-[18px] font-bold tabular-nums leading-none text-white">
          {clamped}%
        </span>
      </div>
    </div>
  )
}

export function DepotOpsKpiStrip() {
  const overview = useDepotOpsOverviewContext()
  const { openPanel } = useCcNavigation()
  const healthAccent = CARD_ACCENT.violet
  const loading = isDepotOpsOverviewLoading(overview)

  if (loading) {
    return <DepotOpsKpiStripSkeleton />
  }

  const k = overview?.kpis || EMPTY_KPI
  const pending = k.pendingApprovals || EMPTY_KPI.pendingApprovals
  const missions = k.todaysMissions || EMPTY_KPI.todaysMissions
  const warehouse = k.warehouseOperations || EMPTY_KPI.warehouseOperations
  const cash = k.cashWaiting || EMPTY_KPI.cashWaiting
  const health = k.warehouseHealth || EMPTY_KPI.warehouseHealth

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
      <KpiCard
        title={pending.title}
        value={pending.total ?? 0}
        accent="red"
        icon={ClipboardList}
        breakdown={pending.breakdown || []}
        onClick={() => openPanel('exceptions')}
      />
      <KpiCard
        title={missions.title}
        value={missions.total ?? 0}
        accent="blue"
        icon={Truck}
        breakdown={missions.breakdown || []}
        onClick={() => openPanel('missions')}
      />
      <KpiCard
        title={warehouse.title}
        value={warehouse.total ?? 0}
        accent="teal"
        icon={Warehouse}
        breakdown={warehouse.breakdown || []}
        onClick={() => openPanel('shipments')}
      />
      <KpiCard
        title={cash.title}
        value={cash.total ?? '0'}
        valueSuffix={cash.totalSuffix}
        accent="amber"
        icon={Banknote}
        breakdown={cash.breakdown || []}
        onClick={() => openPanel('revenue')}
        breakdownClassName="mt-7"
      />

      <button
        type="button"
        onClick={() => openPanel('stock')}
        aria-label={`Open ${health.title}`}
        className={`relative col-span-2 flex min-h-[188px] w-full flex-col overflow-hidden rounded-[12px] border ${healthAccent.border} bg-[#0f131a] p-4 text-left transition hover:border-cc-border-hover hover:bg-[#121821] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cc-accent/40 xl:col-span-1`}
      >
        <div className={`pointer-events-none absolute inset-0 ${healthAccent.tint}`} aria-hidden />
        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${healthAccent.iconBg}`}>
              <CheckCircle2 className={`h-3.5 w-3.5 ${healthAccent.icon}`} />
            </span>
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.06em] text-[#7a8494]">
              {health.title}
            </p>
          </div>

          <div className="mt-4 flex flex-1 flex-col items-center justify-center">
            <CapacityGauge pct={health.capacityPct} />
          </div>

          <ul className="mt-2 space-y-2">
            {(health.breakdown || []).map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="truncate text-[#7a8494]">{row.label}</span>
                <span className={`shrink-0 font-semibold tabular-nums ${VALUE_TONE[row.tone]}`}>
                  {row.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </button>
    </div>
  )
}
