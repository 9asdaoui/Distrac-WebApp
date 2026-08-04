import React from 'react'
import { Plus, X } from 'lucide-react'
import { DepotCcPageShell } from '../dashboard/depotOps/DepotCcPageShell'
import { PanelEmbedContext } from './panelEmbedContext'
import { ccFormInputClass as railInputClass } from './CommandCenterForm'

export { railInputClass, ccFormInputClass } from './CommandCenterForm'

/**
 * Map-admin list chrome — reuses DepotCcPageShell + `.cc-panel-host` padding so the
 * Home/title card sits in the exact same place as Missions / Stock / etc.
 */
export function MapRailShell({
  title,
  subtitle,
  icon,
  iconAccentClass: _iconAccentClass,
  onAdd,
  addLabel = 'Add',
  children,
  overlay,
}) {
  const actions = onAdd ? (
    <button
      type="button"
      onClick={onAdd}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-distrac-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-distrac-hover"
    >
      <Plus className="h-3.5 w-3.5" />
      {addLabel}
    </button>
  ) : null

  return (
    <div className="relative flex h-full w-full flex-col bg-cc-bg text-cc-primary">
      <PanelEmbedContext.Provider value={true}>
        <div className="cc-panel-host h-full min-h-0 overflow-auto">
          <DepotCcPageShell title={title} subtitle={subtitle} icon={icon} actions={actions}>
            {children}
          </DepotCcPageShell>
        </div>
      </PanelEmbedContext.Provider>

      {overlay && (
        <div className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-cc-bg/95 backdrop-blur-md">
          {overlay}
        </div>
      )}
    </div>
  )
}

export function MapRailCreateOverlay({ title, subtitle, onClose, children, footer, accent = 'blue' }) {
  const accentBar = {
    amber: 'via-amber-500',
    orange: 'via-cc-accent',
    rose: 'via-rose-500',
    blue: 'via-cc-accent',
    emerald: 'via-emerald-500',
  }[accent] || 'via-cc-accent'

  return (
    <>
      <div className="relative shrink-0 border-b border-cc-border-subtle px-4 py-4">
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${accentBar} to-transparent`}
        />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 className="text-sm font-bold tracking-tight text-cc-primary">{title}</h2>
            {subtitle && <p className="mt-1 text-xs leading-relaxed text-cc-tertiary">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-cc-tertiary transition hover:bg-cc-surface-hover hover:text-cc-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">{children}</div>
      {footer ? (
        <div className="shrink-0 border-t border-cc-border-subtle px-4 py-3">{footer}</div>
      ) : null}
    </>
  )
}

export function MapRailTable({ columns, isEmpty, emptyMessage = 'No records.', children }) {
  return (
    <div className="overflow-hidden rounded-xl border border-cc-border-subtle bg-cc-surface">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-cc-border-subtle bg-cc-surface-alt/80">
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-cc-tertiary"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isEmpty ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-sm text-cc-tertiary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function MapRailRow({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-cc-border-subtle/80 last:border-0 ${
        onClick ? 'cursor-pointer transition hover:bg-cc-surface-hover/60' : ''
      }`}
    >
      {children}
    </tr>
  )
}

export function MapRailCell({ children, className = '' }) {
  return <td className={`px-3 py-2.5 text-cc-secondary ${className}`}>{children}</td>
}

export function MapRailLoading() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Loading">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/60" />
      ))}
    </div>
  )
}

export { MapRailKpiLoading, MapRailKpiStrip } from './MapRailKpiStrip'
