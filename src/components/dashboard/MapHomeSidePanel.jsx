import React from 'react'
import { LayoutDashboard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ExecutiveHomeContent } from './ExecutiveHomeContent'

/**
 * Default Command Center right rail — executive overview KPIs.
 */
export function MapHomeSidePanel() {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-zinc-800 px-5 py-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 ring-1 ring-zinc-700">
          <LayoutDashboard className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">{t('sidebar.commandCenter')}</p>
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">{t('commandCenter.overview')}</p>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 scrollbar-thin">
        <ExecutiveHomeContent compact showIntro={false} variant="dark" />
      </div>
    </div>
  )
}
