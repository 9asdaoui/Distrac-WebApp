import React from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, DollarSign, Activity, ShoppingCart } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from 'recharts'
import { useTheme } from '../../context/ThemeContext'
import { useExecutiveKpis } from '../../hooks/useExecutiveKpis'

function KpiCard({ title, value, subtitle, icon: Icon, colorClass, forceDark = false }) {
  return (
    <div className={forceDark ? 'rounded-xl border border-zinc-800 bg-zinc-900/80 p-4' : 'card-sm'}>
      <div className="mb-3 flex items-center justify-between">
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${forceDark ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{title}</p>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${forceDark ? 'text-zinc-100' : 'text-zinc-900 dark:text-zinc-100'}`}>
        {value}
      </p>
      <p className={`mt-1 text-[11px] ${forceDark ? 'text-zinc-400' : 'text-zinc-500 dark:text-zinc-400'}`}>{subtitle}</p>
    </div>
  )
}

/**
 * Executive Home dashboard body (KPIs + 7-day orders chart).
 * Shared by /dashboard and Global Map default side panel.
 */
export function ExecutiveHomeContent({ compact = false, showIntro = true, variant }) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const forceDark = variant === 'dark'
  const isDark = forceDark || theme === 'dark'

  const {
    isLoading,
    error,
    totalDailySales,
    avgDepotHealth,
    activeDebt,
    pendingExceptionsCount,
    ordersChartData,
  } = useExecutiveKpis()

  // Theme-aware chart colors
  const chartColors = {
    grid:    isDark ? '#3f3f46' : '#e4e4e7',
    tick:    isDark ? '#a1a1aa' : '#71717a',
    tooltipBg:     isDark ? '#18181b' : '#ffffff',
    tooltipBorder: isDark ? '#3f3f46' : '#e4e4e7',
    tooltipText:   isDark ? '#fafafa' : '#18181b',
    bar:     '#ff6b00',
    line:    '#ff9548',
    cursor:  isDark ? 'rgba(113,113,122,0.12)' : 'rgba(228,228,231,0.7)',
  }

  const chartHeight = compact ? 'h-52' : 'h-80'
  const gridClass = compact
    ? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
    : 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'

  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {showIntro && (
        <div className="card">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{t('executiveHome.introTitle')}</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {t('executiveHome.introSubtitle')}
          </p>
        </div>
      )}

      {error && (
        <div className={forceDark ? 'rounded-lg border border-red-500/30 bg-red-500/10 p-3' : 'alert-error'}>
          <p className={`text-sm ${forceDark ? 'text-red-300' : 'text-red-700 dark:text-red-300'}`}>
            {t('executiveHome.loadError')}
          </p>
        </div>
      )}

      <div className={gridClass}>
        <KpiCard
          forceDark={forceDark}
          title={t('executiveHome.dailySales')}
          value={isLoading ? '—' : `${Math.round(totalDailySales).toLocaleString()} DA`}
          subtitle={t('executiveHome.ordersTodaySubtitle')}
          icon={ShoppingCart}
          colorClass="bg-emerald-500/15 text-emerald-500"
        />
        <KpiCard
          forceDark={forceDark}
          title={t('executiveHome.pendingExceptions')}
          value={isLoading ? '—' : pendingExceptionsCount}
          subtitle={t('executiveHome.pendingSubtitle')}
          icon={AlertTriangle}
          colorClass="bg-amber-500/15 text-amber-500"
        />
        <KpiCard
          forceDark={forceDark}
          title={t('executiveHome.depotHealth')}
          value={isLoading ? '—' : `${avgDepotHealth.toFixed(1)}%`}
          subtitle={t('executiveHome.depotHealthSubtitle')}
          icon={Activity}
          colorClass="bg-[rgba(255,107,0,0.15)] text-[#ff6b00]"
        />
        <KpiCard
          forceDark={forceDark}
          title={t('executiveHome.activeDebt')}
          value={isLoading ? '—' : `${Math.round(activeDebt).toLocaleString()} DA`}
          subtitle={t('executiveHome.activeDebtSubtitle')}
          icon={DollarSign}
          colorClass="bg-rose-500/15 text-rose-500"
        />
      </div>

      <div className={forceDark ? 'rounded-xl border border-zinc-800 bg-zinc-900/80 p-4' : 'card'}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className={`font-semibold ${forceDark ? 'text-sm text-zinc-100' : `text-zinc-900 dark:text-zinc-100 ${compact ? 'text-sm' : 'text-lg'}`}`}>
            {t('executiveHome.ordersLast7Days')}
          </h3>
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${forceDark ? 'text-zinc-500' : 'text-zinc-500 dark:text-zinc-400'}`}>
            {t('executiveHome.orders')}
          </span>
        </div>

        {ordersChartData.every((d) => d.orders === 0) && !isLoading ? (
          <div className={`flex h-40 items-center justify-center text-sm ${forceDark ? 'text-zinc-500' : 'text-zinc-400 dark:text-zinc-600'}`}>
            {t('executiveHome.noOrders')}
          </div>
        ) : (
          <div className={`${chartHeight} w-full`}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={ordersChartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis dataKey="label" tick={{ fill: chartColors.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: chartColors.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: chartColors.cursor }}
                  contentStyle={{
                    borderRadius: '8px',
                    border: `1px solid ${chartColors.tooltipBorder}`,
                    background: chartColors.tooltipBg,
                    color: chartColors.tooltipText,
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} fill={chartColors.bar} />
                <Line type="monotone" dataKey="orders" stroke={chartColors.line} strokeWidth={2} dot={{ r: 2, fill: chartColors.line }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
