import React from 'react'

const TONE = {
  emerald: {
    card: 'from-emerald-500/[0.14] via-emerald-500/[0.04] to-transparent ring-emerald-500/25',
    icon: 'bg-emerald-500/20 text-emerald-300 ring-emerald-400/30',
    bar: 'bg-emerald-400',
    label: 'text-emerald-200/70',
  },
  amber: {
    card: 'from-amber-500/[0.14] via-amber-500/[0.04] to-transparent ring-amber-500/25',
    icon: 'bg-amber-500/20 text-amber-300 ring-amber-400/30',
    bar: 'bg-amber-400',
    label: 'text-amber-200/70',
  },
  blue: {
    card: 'from-cc-accent/[0.18] via-cc-accent/[0.05] to-transparent ring-cc-accent/30',
    icon: 'bg-cc-accent/20 text-cc-accent-hover ring-cc-accent/35',
    bar: 'bg-cc-accent',
    label: 'text-cc-accent-hover/80',
  },
  sky: {
    card: 'from-cc-accent/[0.14] via-cc-accent/[0.04] to-transparent ring-cc-accent/25',
    icon: 'bg-cc-accent/20 text-cc-accent-hover ring-cc-accent/30',
    bar: 'bg-cc-accent-hover',
    label: 'text-cc-accent-hover/70',
  },
  rose: {
    card: 'from-rose-500/[0.14] via-rose-500/[0.04] to-transparent ring-rose-500/25',
    icon: 'bg-rose-500/20 text-rose-300 ring-rose-400/30',
    bar: 'bg-rose-400',
    label: 'text-rose-200/70',
  },
  violet: {
    card: 'from-violet-500/[0.14] via-violet-500/[0.04] to-transparent ring-violet-500/25',
    icon: 'bg-violet-500/20 text-violet-300 ring-violet-400/30',
    bar: 'bg-violet-400',
    label: 'text-violet-200/70',
  },
  orange: {
    card: 'from-cc-accent/[0.14] via-cc-accent/[0.04] to-transparent ring-cc-accent/25',
    icon: 'bg-cc-accent/20 text-cc-accent-hover ring-cc-accent/30',
    bar: 'bg-cc-accent',
    label: 'text-cc-accent-hover/70',
  },
}

/**
 * @typedef {Object} MapRailKpiItem
 * @property {string} label
 * @property {string} value
 * @property {string} [subtitle]
 * @property {import('lucide-react').LucideIcon} [icon]
 * @property {keyof typeof TONE} [tone]
 * @property {number} [progress] 0–100
 */

function MapRailKpiCard({ label, value, subtitle, icon: Icon, tone = 'blue', progress }) {
  const styles = TONE[tone] || TONE.blue
  const showBar = typeof progress === 'number' && Number.isFinite(progress)

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br p-3 ring-1 ring-inset ${styles.card}`}
    >
      <div className="pointer-events-none absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/[0.03] blur-xl" />

      <div className="relative flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={`text-[9px] font-bold uppercase tracking-[0.14em] ${styles.label}`}>
            {label}
          </p>
          <p className="mt-1.5 truncate text-xl font-bold tabular-nums tracking-tight text-zinc-50">
            {value}
          </p>
        </div>
        {Icon && (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${styles.icon}`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          </span>
        )}
      </div>

      {subtitle && (
        <p className="relative mt-2 line-clamp-2 text-cc-label leading-snug text-zinc-500">{subtitle}</p>
      )}

      {showBar && (
        <div className="relative mt-2.5 h-1 overflow-hidden rounded-full bg-zinc-800/80">
          <div
            className={`h-full rounded-full transition-all duration-500 ${styles.bar}`}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function MapRailKpiStrip({ items = [] }) {
  if (!items.length) return null
  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      {items.map((item) => (
        <MapRailKpiCard key={item.label} {...item} />
      ))}
    </div>
  )
}

export function MapRailKpiLoading() {
  return (
    <div className="mb-3 grid grid-cols-3 gap-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[5.5rem] animate-pulse rounded-xl border border-zinc-800/80 bg-zinc-900/50"
        />
      ))}
    </div>
  )
}
