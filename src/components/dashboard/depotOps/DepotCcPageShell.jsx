import React from 'react'
import { ArrowLeft } from 'lucide-react'
import { useCcNavigation } from '../../../hooks/useCcNavigation'
import { usePanelEmbed } from '../../map/CcPanelHost'
import { useCcMissionFilters } from '../../map/CcMissionFiltersContext'
import { getLogisticsModule } from '../../logistics/logisticsModuleUi'
import { AnimatedPage } from '../../AnimatedPage'

function ShellIcon({ moduleKey, icon: Icon }) {
  const ResolvedIcon = moduleKey ? getLogisticsModule(moduleKey)?.icon || Icon : Icon
  if (!ResolvedIcon) {
    return <span className="h-16 w-16 shrink-0" aria-hidden />
  }
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-100 ring-1 ring-zinc-700">
      <ResolvedIcon className="h-8 w-8" strokeWidth={2} />
    </span>
  )
}

/**
 * Shared layout for depot-manager ERP tabs embedded in Command Center.
 * Header: Home above icon | title+subtitle aligned to icon | actions right.
 * Standalone: AnimatedPage wrapper only (pages keep their own chrome).
 */
export function DepotCcPageShell({
  title,
  subtitle,
  actions = null,
  children,
  showMissionFilters = false,
  moduleKey = null,
  icon = null,
}) {
  const embedded = usePanelEmbed()
  const { clearPanel } = useCcNavigation()
  const missionFilters = useCcMissionFilters()

  if (!embedded) {
    return (
      <AnimatedPage>
        <div className="space-y-6">{children}</div>
      </AnimatedPage>
    )
  }

  const depotLabel =
    missionFilters?.depotId && missionFilters.depotId !== 'all'
      ? 'Selected depot'
      : 'All depots'

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-cc-surface px-5 py-5 sm:px-6">
          {/* Left content: Home above; icon + text side-by-side */}
          <div className="flex min-w-0 flex-col gap-2.5">
            <button
              type="button"
              onClick={() => clearPanel()}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-[#FF6B00] transition hover:text-orange-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>

            <div className="flex min-w-0 items-center gap-4">
              <ShellIcon moduleKey={moduleKey} icon={icon} />
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="truncate text-xl font-bold leading-tight text-white sm:text-2xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="truncate text-sm leading-snug text-zinc-400">{subtitle}</p>
                ) : null}
                {showMissionFilters && missionFilters ? (
                  <p className="truncate text-xs text-zinc-500">
                    {depotLabel}
                    {missionFilters.date ? ` · ${missionFilters.date}` : ''}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">{actions}</div>
          ) : null}
        </div>
        {children}
      </div>
    </AnimatedPage>
  )
}

export default DepotCcPageShell
