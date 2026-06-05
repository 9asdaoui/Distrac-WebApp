import React from 'react'
import { hasGpsCoordinates } from '../LocationMap'

export const EMPTY_INDUSTRY_FORM = {
  industryName: '',
  description: '',
  isInternal: false,
  isActive: true,
  gpsLatitude: '',
  gpsLongitude: '',
}

const LIGHT_INPUT =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20'

const DARK_INPUT =
  'w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 transition focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20'

const LIGHT_LABEL = 'mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400'
const DARK_LABEL = 'mb-1.5 block text-xs font-medium text-zinc-400'

export function IndustrySegmentedControl({ value, onChange, options, variant = 'light' }) {
  const isDark = variant === 'dark'
  return (
    <div
      className={`flex w-full rounded-lg p-1 ${
        isDark ? 'bg-zinc-900' : 'bg-zinc-100 dark:bg-zinc-900'
      }`}
    >
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              selected
                ? isDark
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                : isDark
                  ? 'text-zinc-400 hover:text-zinc-200'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function IndustryFormFields({ form, onChange, variant = 'light' }) {
  const inputClass = variant === 'dark' ? DARK_INPUT : LIGHT_INPUT
  const labelClass = variant === 'dark' ? DARK_LABEL : LIGHT_LABEL

  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>
          Industry Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.industryName}
          onChange={(e) => onChange({ industryName: e.target.value })}
          placeholder="e.g. Agroalimentaire Sarl"
          className={inputClass}
          maxLength={200}
        />
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional description…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>GPS Latitude</label>
          <input
            type="number"
            step="any"
            value={form.gpsLatitude}
            onChange={(e) => onChange({ gpsLatitude: e.target.value })}
            placeholder="33.5731"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>GPS Longitude</label>
          <input
            type="number"
            step="any"
            value={form.gpsLongitude}
            onChange={(e) => onChange({ gpsLongitude: e.target.value })}
            placeholder="-7.5898"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Type</label>
        <IndustrySegmentedControl
          value={form.isInternal}
          onChange={(v) => onChange({ isInternal: v })}
          variant={variant}
          options={[
            { value: false, label: 'External' },
            { value: true, label: 'Internal' },
          ]}
        />
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <IndustrySegmentedControl
          value={form.isActive}
          onChange={(v) => onChange({ isActive: v })}
          variant={variant}
          options={[
            { value: true, label: 'Active' },
            { value: false, label: 'Inactive' },
          ]}
        />
      </div>
    </div>
  )
}

export function formatIndustryLocation(industry) {
  const lat = industry?.gps_latitude
  const lng = industry?.gps_longitude
  if (!hasGpsCoordinates(lat, lng)) return '—'
  return `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}`
}

export function industryFormToPayload(form) {
  return {
    industryName: form.industryName.trim(),
    description: form.description?.trim() || undefined,
    isInternal: Boolean(form.isInternal),
    isActive: Boolean(form.isActive),
    gpsLatitude: form.gpsLatitude === '' ? undefined : Number(form.gpsLatitude),
    gpsLongitude: form.gpsLongitude === '' ? undefined : Number(form.gpsLongitude),
  }
}
