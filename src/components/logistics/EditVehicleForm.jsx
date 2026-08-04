import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Hash, Power, Truck, Warehouse } from 'lucide-react'
import {
  FormField,
  FormInput,
  FormIntro,
  FormSection,
  FormSelect,
  FormTip,
  FormToggle,
} from '../map/CommandCenterForm'

export function EditVehicleForm({ form, onChange, depots = [] }) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <FormIntro
        accent="blue"
        title={t('commandCenter.detail.editVehicle')}
        description={t('commandCenter.vehicleDetails.assignment')}
      />

      <FormSection title={t('commandCenter.vehicleDetails.assignment')}>
        <FormField
          icon={Hash}
          label={t('commandCenter.rail.form.plate')}
          required
          iconAccent="text-cc-accent-hover bg-cc-accent/15 ring-cc-accent/25"
        >
          <FormInput
            type="text"
            value={form.plateNumber}
            onChange={(e) => onChange({ plateNumber: e.target.value })}
            placeholder="e.g. 12345-A-67"
          />
        </FormField>

        <FormField
          icon={Truck}
          label={t('commandCenter.rail.form.model')}
          required
          iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20"
        >
          <FormInput
            type="text"
            value={form.model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="e.g. Mercedes Sprinter"
          />
        </FormField>

        <FormField
          icon={Warehouse}
          label={t('commandCenter.rail.form.depot')}
          required
          hint={t('commandCenter.vehicleDetails.noDepot')}
          iconAccent="text-blue-300 bg-blue-500/10 ring-blue-500/20"
        >
          <FormSelect
            value={form.depotId}
            onChange={(e) => onChange({ depotId: e.target.value })}
          >
            <option value="">{t('commandCenter.popup.unassigned')}</option>
            {depots.map((depot) => (
              <option key={depot.id} value={depot.id}>
                {depot.depot_name}
              </option>
            ))}
          </FormSelect>
        </FormField>
      </FormSection>

      <FormSection title={t('commandCenter.vehicleDetails.tonnage')}>
        <FormField
          icon={Box}
          label={t('commandCenter.rail.form.tonnage')}
          required
          iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20"
        >
          <FormInput
            type="number"
            min="0.01"
            step="0.01"
            value={form.tonnage}
            onChange={(e) => onChange({ tonnage: e.target.value })}
            placeholder="3.5"
          />
        </FormField>

        <FormField
          icon={Box}
          label={t('commandCenter.rail.form.volume')}
          iconAccent="text-violet-300 bg-violet-500/10 ring-violet-500/20"
        >
          <FormInput
            type="number"
            min="0"
            step="1"
            value={form.volumeCapacity}
            onChange={(e) => onChange({ volumeCapacity: e.target.value })}
            placeholder="Optional"
          />
        </FormField>

        <FormField
          icon={Power}
          label={t('commandCenter.rail.form.active')}
          iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20"
        >
          <FormToggle
            checked={Boolean(form.isActive)}
            onChange={(v) => onChange({ isActive: v })}
            labelOn={t('commandCenter.popup.active')}
            labelOff={t('commandCenter.popup.inactive')}
          />
        </FormField>
      </FormSection>

      <FormTip variant="blue" title={t('commandCenter.vehicleDetails.livePosition')}>
        {t('commandCenter.vehicleDetails.liveGpsFromWialon')}
      </FormTip>
    </div>
  )
}
