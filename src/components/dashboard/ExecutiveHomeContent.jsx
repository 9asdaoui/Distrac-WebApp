import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  DollarSign,
  Package,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react'
import { useOperationsBoard } from '../../hooks/useOperationsBoard'
import { SectionSkeleton } from './OperationsInsightCard'

function HudDivider() {
  return <div className="border-t border-zinc-800" />
}

function HudSection({ title, icon: Icon, children }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-3.5 w-3.5 text-zinc-500" /> : null}
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</h3>
      </div>
      {children}
    </section>
  )
}

function ActionInboxRow({ icon: Icon, label, count, badgeClass, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-2 text-left transition hover:border-zinc-700 hover:bg-zinc-800/80"
    >
      <span className="flex min-w-0 items-center gap-2 text-xs text-zinc-200">
        <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="truncate">{label}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
        {count}
      </span>
    </button>
  )
}

function DepotHealthRow({ depot }) {
  const barColor = depot.overCapacity ? 'bg-red-500' : depot.usageRaw >= 90 ? 'bg-amber-500' : 'bg-orange-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="truncate text-zinc-300">{depot.name}</span>
        <span className={`shrink-0 font-semibold ${depot.overCapacity ? 'text-red-400' : 'text-zinc-400'}`}>
          {depot.overCapacity
            ? '100% (OVER CAPACITY)'
            : `${Math.round(depot.usageRaw)}%`}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${depot.usageDisplay}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Command Center / Executive Home — high-density operational HUD.
 */
export function ExecutiveHomeContent({ compact = false, showIntro = false, variant }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const forceDark = variant === 'dark'

  const {
    error,
    sectionLoading,
    actionRequiredCount,
    pendingExceptionsCount,
    pendingProposalsCount,
    todayRevenue,
    isRevenueUp,
    missionStopsTotal,
    missionStopsCompleted,
    missionProgressPercent,
    criticalDepots,
    livreursCheckedIn,
    livreursTotal,
    unassignedOrdersTomorrow,
    systemHealthy,
  } = useOperationsBoard()

  const stackClass = compact ? 'space-y-3' : 'space-y-4'

  return (
    <div className={stackClass}>
      {showIntro && (
        <div className={forceDark ? 'rounded-xl border border-zinc-800 bg-zinc-900/80 p-3' : 'card'}>
          <h1 className={`text-xl font-semibold ${forceDark ? 'text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {t('executiveHome.introTitle')}
          </h1>
          <p className={`mt-1 text-xs ${forceDark ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {t('executiveHome.introSubtitle')}
          </p>
        </div>
      )}

      {error && (
        <div className={forceDark ? 'rounded-lg border border-red-500/30 bg-red-500/10 p-2.5' : 'alert-error'}>
          <p className={`text-xs ${forceDark ? 'text-red-300' : 'text-red-700 dark:text-red-300'}`}>
            {t('executiveHome.loadError')}
          </p>
        </div>
      )}

      {sectionLoading.pulse ? (
        <SectionSkeleton lines={3} />
      ) : (
        <HudSection title={t('operationsHud.todaysPulse')} icon={Activity}>
          <div className="grid grid-cols-[auto_1fr] items-center gap-3">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 36 36" aria-hidden>
                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-zinc-800" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15.5"
                  fill="none"
                  className="stroke-orange-500"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${missionProgressPercent} 100`}
                />
              </svg>
              <span className="text-lg font-bold text-zinc-100">{missionProgressPercent}%</span>
            </div>
            <div className="min-w-0 space-y-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                  {t('operationsHud.missionStatus')}
                </p>
                <p className="text-xs text-zinc-400">
                  {t('operationsHud.stopsCompleted', {
                    completed: missionStopsCompleted,
                    total: missionStopsTotal,
                  })}
                </p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-zinc-500">
                  <DollarSign className="h-3 w-3" />
                  {t('operationsHud.todaysSales')}
                </p>
                <p className="flex items-center gap-1.5 text-xl font-bold text-emerald-400">
                  {Math.round(todayRevenue).toLocaleString()} DA
                  {isRevenueUp ? <TrendingUp className="h-4 w-4 text-emerald-300" /> : null}
                </p>
              </div>
            </div>
          </div>
        </HudSection>
      )}

      {!sectionLoading.action && actionRequiredCount > 0 && (
        <>
          <HudDivider />
          <HudSection title={t('operationsHud.actionInbox')} icon={ClipboardList}>
            <div className="space-y-1.5">
              {pendingExceptionsCount > 0 && (
                <ActionInboxRow
                  icon={AlertTriangle}
                  label={t('operationsHud.pendingExceptions', { count: pendingExceptionsCount })}
                  count={pendingExceptionsCount}
                  badgeClass="bg-amber-500/20 text-amber-300"
                  onClick={() => navigate('/exceptions')}
                />
              )}
              {pendingProposalsCount > 0 && (
                <ActionInboxRow
                  icon={Package}
                  label={t('operationsHud.stockProposals', { count: pendingProposalsCount })}
                  count={pendingProposalsCount}
                  badgeClass="bg-blue-500/20 text-blue-300"
                  onClick={() => navigate('/inventory/proposals')}
                />
              )}
            </div>
          </HudSection>
        </>
      )}

      {sectionLoading.inventory ? (
        <SectionSkeleton lines={2} />
      ) : criticalDepots.length > 0 ? (
        <>
          <HudDivider />
          <HudSection title={t('operationsHud.criticalInventory')} icon={Package}>
            <div className="space-y-2.5">
              {criticalDepots.map((depot) => (
                <DepotHealthRow key={depot.id} depot={depot} />
              ))}
            </div>
          </HudSection>
        </>
      ) : null}

      {sectionLoading.fleet ? (
        <SectionSkeleton lines={2} />
      ) : (
        <>
          <HudDivider />
          <HudSection title={t('operationsHud.fleetStatus')} icon={Truck}>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <Users className="h-3.5 w-3.5" />
                  {t('operationsHud.livreursOnline')}
                </span>
                <span className="font-semibold text-zinc-100">
                  {livreursCheckedIn} / {livreursTotal}
                </span>
              </div>
              {unassignedOrdersTomorrow > 0 && (
                <button
                  type="button"
                  onClick={() => navigate('/missions')}
                  className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-2.5 py-2 text-left transition hover:bg-amber-500/10"
                >
                  <span className="flex items-center gap-1.5 text-xs text-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {t('operationsHud.unassignedOrders', { count: unassignedOrdersTomorrow })}
                  </span>
                </button>
              )}
            </div>
          </HudSection>
        </>
      )}

      {systemHealthy && (
        <>
          <HudDivider />
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-emerald-300">{t('operationsHud.systemHealthy')}</p>
          </div>
        </>
      )}
    </div>
  )
}
