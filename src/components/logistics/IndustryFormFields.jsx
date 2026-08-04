import React from 'react'
import { MapPin, Factory } from 'lucide-react'
import { hasGpsCoordinates } from '../LocationMap'
import {
  FormField,
  FormGrid,
  FormInput,
  FormIntro,
  FormSection,
  FormSegmented,
  FormTextarea,
  ccFormInputClass,
  ccFormTextareaClass,
} from '../map/CommandCenterForm'

export const EMPTY_INDUSTRY_FORM = {
  industryName: '',
  description: '',
  isInternal: false,
  isActive: true,
  gpsLatitude: '',
  gpsLongitude: '',
}

const LIGHT_INPUT =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-400/20 dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-100 dark:focus:border-zinc-500 dark:focus:ring-zinc-500/20'

const LIGHT_LABEL = 'mb-1.5 block text-xs font-medium text-zinc-600 dark:text-zinc-400'

export function IndustrySegmentedControl({ value, onChange, options, variant = 'light' }) {
  const isDark = variant === 'dark'
  if (isDark) {
    return <FormSegmented value={value} onChange={onChange} options={options} />
  }
  return (
    <div className="flex w-full rounded-lg p-1 bg-zinc-100 dark:bg-cc-surface">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              selected
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
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
  if (variant === 'dark') {
    return (
      <div className="space-y-4">
        <FormIntro
          accent="rose"
          title="Industry profile"
          description="Update identity, GPS pin, and operational flags. Drag the factory marker on the map to refine coordinates."
        />

        <FormSection title="Identity">
          <FormField
            icon={Factory}
            label="Industry name"
            required
            iconAccent="text-rose-300 bg-rose-500/10 ring-rose-500/20"
          >
            <FormInput
              type="text"
              value={form.industryName}
              onChange={(e) => onChange({ industryName: e.target.value })}
              placeholder="e.g. Agroalimentaire Sarl"
              maxLength={200}
            />
          </FormField>

          <FormField
            icon={Factory}
            label="Description"
            hint="Optional — shown in lists and map popups"
            iconAccent="text-zinc-300 bg-zinc-800/80 ring-zinc-700/50"
          >
            <FormTextarea
              rows={3}
              value={form.description}
              onChange={(e) => onChange({ description: e.target.value })}
              placeholder="What this industry produces or supplies…"
            />
          </FormField>
        </FormSection>

        <FormSection title="Map location" description="Coordinates place the rose pin on the command map.">
          <FormGrid>
            <FormField icon={MapPin} label="Latitude" iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20">
              <FormInput
                type="number"
                step="any"
                value={form.gpsLatitude}
                onChange={(e) => onChange({ gpsLatitude: e.target.value })}
                placeholder="33.5731"
              />
            </FormField>
            <FormField icon={MapPin} label="Longitude" iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20">
              <FormInput
                type="number"
                step="any"
                value={form.gpsLongitude}
                onChange={(e) => onChange({ gpsLongitude: e.target.value })}
                placeholder="-7.5898"
              />
            </FormField>
          </FormGrid>
        </FormSection>

        <FormSection title="Classification">
          <FormField label="Supply type" iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20">
            <FormSegmented
              value={form.isInternal}
              onChange={(v) => onChange({ isInternal: v })}
              options={[
                { value: false, label: 'External' },
                { value: true, label: 'Internal' },
              ]}
            />
          </FormField>
          <FormField label="Status" iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
            <FormSegmented
              value={form.isActive}
              onChange={(v) => onChange({ isActive: v })}
              options={[
                { value: true, label: 'Active' },
                { value: false, label: 'Inactive' },
              ]}
            />
          </FormField>
        </FormSection>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <label className={LIGHT_LABEL}>
          Industry Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.industryName}
          onChange={(e) => onChange({ industryName: e.target.value })}
          placeholder="e.g. Agroalimentaire Sarl"
          className={LIGHT_INPUT}
          maxLength={200}
        />
      </div>

      <div>
        <label className={LIGHT_LABEL}>Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Optional description…"
          className={`${LIGHT_INPUT} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={LIGHT_LABEL}>GPS Latitude</label>
          <input
            type="number"
            step="any"
            value={form.gpsLatitude}
            onChange={(e) => onChange({ gpsLatitude: e.target.value })}
            placeholder="33.5731"
            className={LIGHT_INPUT}
          />
        </div>
        <div>
          <label className={LIGHT_LABEL}>GPS Longitude</label>
          <input
            type="number"
            step="any"
            value={form.gpsLongitude}
            onChange={(e) => onChange({ gpsLongitude: e.target.value })}
            placeholder="-7.5898"
            className={LIGHT_INPUT}
          />
        </div>
      </div>

      <div>
        <label className={LIGHT_LABEL}>Type</label>
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
        <label className={LIGHT_LABEL}>Status</label>
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

// Re-export for any legacy imports
export const DARK_INPUT = ccFormInputClass
export const DARK_LABEL = LIGHT_LABEL
