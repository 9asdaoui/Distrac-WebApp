import React from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const ACCENT_BAR = {
  amber: 'via-amber-500',
  orange: 'via-orange-500',
  rose: 'via-rose-500',
  blue: 'via-blue-500',
  emerald: 'via-emerald-500',
  sky: 'via-sky-500',
  violet: 'via-violet-500',
}

const ACCENT_TEXT = {
  amber: 'text-amber-400',
  orange: 'text-orange-400',
  rose: 'text-rose-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  sky: 'text-sky-400',
  violet: 'text-violet-400',
}

export const ccFormInputClass =
  'w-full rounded-xl border border-zinc-700/80 bg-zinc-950/70 px-3.5 py-2.5 text-sm text-zinc-100 shadow-inner shadow-black/20 placeholder:text-zinc-600 outline-none transition focus:border-orange-500/50 focus:bg-zinc-950 focus:ring-2 focus:ring-orange-500/15 disabled:cursor-not-allowed disabled:opacity-50'

export const ccFormSelectClass = `${ccFormInputClass} appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-10`

export const ccFormTextareaClass = `${ccFormInputClass} resize-none`

/** @deprecated use ccFormInputClass */
export const railInputClass = ccFormInputClass

export function FormIntro({ accent = 'amber', title, description, badge }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-800/90 bg-gradient-to-br from-zinc-900/90 via-zinc-950/80 to-black/40 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${ACCENT_BAR[accent] || ACCENT_BAR.amber} to-transparent`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-[0.14em] ${ACCENT_TEXT[accent] || ACCENT_TEXT.amber}`}>
            {title}
          </p>
          {description && (
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{description}</p>
          )}
        </div>
        {badge}
      </div>
    </div>
  )
}

export function FormSection({ title, description, children, className = '' }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-zinc-800/90 bg-zinc-900/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] ${className}`}
    >
      {(title || description) && (
        <div className="border-b border-zinc-800/80 px-4 py-3">
          {title && <p className="text-xs font-semibold text-zinc-200">{title}</p>}
          {description && <p className="mt-0.5 text-[11px] text-zinc-500">{description}</p>}
        </div>
      )}
      <div className="space-y-1 p-2">{children}</div>
    </div>
  )
}

export function FormField({
  icon: Icon,
  label,
  hint,
  required = false,
  children,
  iconAccent = 'text-zinc-300 bg-zinc-800/80 ring-zinc-700/50',
}) {
  return (
    <div className="group rounded-xl border border-transparent p-2 transition hover:border-zinc-800/60 hover:bg-zinc-900/40">
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${iconAccent}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-200">{label}</p>
            {required && (
              <span className="shrink-0 rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-300">
                Required
              </span>
            )}
          </div>
          {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">{hint}</p>}
          <div className="mt-2">{children}</div>
        </div>
      </div>
    </div>
  )
}

export function FormInput({ className = '', ...props }) {
  return <input className={`${ccFormInputClass} ${className}`} {...props} />
}

export function FormSelect({ className = '', children, ...props }) {
  return (
    <select className={`${ccFormSelectClass} ${className}`} {...props}>
      {children}
    </select>
  )
}

export function FormTextarea({ className = '', ...props }) {
  return <textarea className={`${ccFormTextareaClass} ${className}`} {...props} />
}

export function FormGrid({ cols = 2, children, className = '' }) {
  const gridClass = cols === 2 ? 'grid-cols-1 sm:grid-cols-2' : `grid-cols-${cols}`
  return <div className={`grid gap-2 ${gridClass} ${className}`}>{children}</div>
}

export function FormToggle({ checked, onChange, labelOn = 'On', labelOff = 'Off', accent = 'emerald' }) {
  const onClass =
    accent === 'emerald'
      ? 'border-emerald-500/40 bg-emerald-500/20'
      : 'border-orange-500/40 bg-orange-500/20'

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border transition ${
          checked ? onClass : 'border-zinc-700 bg-zinc-800/80'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
        <span className="sr-only">Toggle</span>
      </button>
      <span className="text-xs font-medium text-zinc-300">{checked ? labelOn : labelOff}</span>
    </div>
  )
}

export function FormSegmented({ value, onChange, options }) {
  return (
    <div className="flex w-full rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-1">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              selected
                ? 'bg-gradient-to-b from-zinc-700 to-zinc-800 text-zinc-100 shadow-sm ring-1 ring-zinc-600/50'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function FormTip({ icon: Icon, title, children, variant = 'amber' }) {
  const borderClass = {
    amber: 'border-amber-500/25 bg-amber-500/[0.06]',
    orange: 'border-orange-500/25 bg-orange-500/[0.06]',
    rose: 'border-rose-500/25 bg-rose-500/[0.06]',
    blue: 'border-blue-500/25 bg-blue-500/[0.06]',
    emerald: 'border-emerald-500/25 bg-emerald-500/[0.06]',
  }[variant] || 'border-amber-500/25 bg-amber-500/[0.06]'

  const titleClass = ACCENT_TEXT[variant] || ACCENT_TEXT.amber

  return (
    <div className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${borderClass}`}>
      {Icon && <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${titleClass}`} />}
      <div className="min-w-0">
        {title && (
          <p className={`text-[10px] font-bold uppercase tracking-wider ${titleClass}`}>{title}</p>
        )}
        <div className="mt-1 text-xs leading-relaxed text-zinc-400">{children}</div>
      </div>
    </div>
  )
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
      {children}
    </div>
  )
}

export function FormFooter({ onCancel, submitLabel, isSubmitting, cancelLabel, savingLabel }) {
  const { t } = useTranslation()
  const resolvedCancel = cancelLabel || t('commandCenter.rail.cancel')
  const resolvedSaving = savingLabel || t('commandCenter.rail.saving')

  return (
    <div className="flex gap-2.5">
      <button
        type="button"
        onClick={onCancel}
        disabled={isSubmitting}
        className="flex-1 rounded-xl border border-zinc-700/80 bg-zinc-900/50 px-4 py-2.5 text-xs font-semibold text-zinc-400 transition hover:border-zinc-600 hover:bg-zinc-800/80 hover:text-zinc-200 disabled:opacity-40"
      >
        {resolvedCancel}
      </button>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-zinc-100 to-zinc-200 px-4 py-2.5 text-xs font-bold text-zinc-900 shadow-lg shadow-black/20 transition hover:from-white hover:to-zinc-100 disabled:opacity-40"
      >
        {isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {isSubmitting ? resolvedSaving : submitLabel}
      </button>
    </div>
  )
}
