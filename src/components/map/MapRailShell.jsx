import React from 'react'
import { Plus, X } from 'lucide-react'
import { ccFormInputClass as railInputClass } from './CommandCenterForm'

export { railInputClass, ccFormInputClass } from './CommandCenterForm'

export function MapRailShell({
  title,
  subtitle,
  icon: Icon,
  iconAccentClass = 'bg-zinc-800 text-zinc-300 ring-zinc-700',
  onAdd,
  addLabel = 'Add',
  children,
  overlay,
}) {
  return (
    <div className="relative flex h-full w-full flex-col">
      <div className="shrink-0 border-b border-zinc-800 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            {Icon && (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${iconAccentClass}`}
              >
                <Icon className="h-4 w-4" />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-100">{title}</p>
              {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{subtitle}</p>}
            </div>
          </div>
          {onAdd && (
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-semibold text-zinc-900 transition hover:bg-white"
            >
              <Plus className="h-3.5 w-3.5" />
              {addLabel}
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">{children}</div>

      {overlay && (
        <div className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#141416]/95 backdrop-blur-md">
          {overlay}
        </div>
      )}
    </div>
  )
}

export function MapRailCreateOverlay({ title, subtitle, onClose, children, footer, accent = 'amber' }) {
  const accentBar = {
    amber: 'via-amber-500',
    orange: 'via-orange-500',
    rose: 'via-rose-500',
    blue: 'via-blue-500',
    emerald: 'via-emerald-500',
  }[accent] || 'via-amber-500'

  return (
    <>
      <div className="relative shrink-0 border-b border-zinc-800/90 px-4 py-4">
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${accentBar} to-transparent`}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm font-bold tracking-tight text-zinc-100">{title}</h2>
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-zinc-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{children}</div>
      {footer && (
        <div className="shrink-0 border-t border-zinc-800/90 bg-zinc-950/60 px-4 py-3 backdrop-blur-sm">
          {footer}
        </div>
      )}
    </>
  )
}

export function MapRailTable({ columns, isEmpty, emptyMessage = 'No records.', children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      {isEmpty ? (
        <p className="px-3 py-8 text-center text-xs text-zinc-500">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-900/80">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="whitespace-nowrap px-3 py-2.5 font-medium text-zinc-400"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">{children}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export function MapRailRow({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e)
              }
            }
          : undefined
      }
      tabIndex={onClick ? 0 : undefined}
      className={onClick ? 'cursor-pointer transition hover:bg-zinc-800/60' : undefined}
    >
      {children}
    </tr>
  )
}

export function MapRailCell({ children, className = '' }) {
  return <td className={`px-3 py-2.5 text-zinc-300 ${className}`}>{children}</td>
}

export function MapRailLoading() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/80" />
      ))}
    </div>
  )
}

export { MapRailKpiLoading, MapRailKpiStrip } from './MapRailKpiStrip'
