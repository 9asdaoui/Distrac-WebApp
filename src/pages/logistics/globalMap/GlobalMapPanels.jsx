import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Globe,
  Loader2,
  X,
  Building2,
  Warehouse,
  Factory,
  User2,
  MapPin,
  ExternalLink,
  Pencil,
  Save,
  CheckCircle2,
  Power,
  AlertCircle,
  Phone,
  Banknote,
  Box,
  FileText,
  Truck,
  Map as MapIcon,
  Store,
  UserCheck,
  Radio,
} from 'lucide-react'
import {
  getLogisticsModule,
  getEntityDisplayName,
  EntityBreadcrumb,
  EntityIconBadge,
  EntityPanelSubtitle,
} from '../../../components/logistics/logisticsModuleUi'
import { IndustryDetailsContent, IndustryTypeBadge } from '../../../components/logistics/IndustryDetailsContent'
import { IndustryFormFields } from '../../../components/logistics/IndustryFormFields'
import { DepotDetailsContent } from '../../../components/logistics/DepotDetailsContent'
import { SectorDetailsContent } from '../../../components/logistics/SectorDetailsContent'
import { ClientDetailsContent } from '../../../components/logistics/ClientDetailsContent'
import { VehicleDetailsContent } from '../../../components/logistics/VehicleDetailsContent'
import { EditVehicleForm } from '../../../components/logistics/EditVehicleForm'
import { RegionDetailsContent } from '../../../components/logistics/RegionDetailsContent'
import { isValidRegionPolygon } from '../../../components/RegionBoundaryDrawer'
import {
  FormField as EditFormField,
  FormInput,
  FormIntro,
  FormSection,
  FormSelect,
  FormTip,
  FormToggle,
  FormFooter,
  FormError,
  FormSegmented,
} from '../../../components/map/CommandCenterForm'

/* ------------------------------------------------------------------ */
/*  Region create rail — metadata only; draw tools live on the map     */
/* ------------------------------------------------------------------ */

export const EMPTY_CREATE_REGION_FORM = {
  regionName: '',
  code: '',
  isActive: true,
  boundary: null,
}

function regionBoundaryPointCount(boundary) {
  const ring = boundary?.coordinates?.[0]
  if (!Array.isArray(ring) || ring.length < 4) return 0
  return ring.length - 1
}

export function RegionCreateRail({
  form,
  onChange,
  clipNotice,
  formError,
  isSubmitting,
  onSubmit,
  onCancel,
}) {
  const { t } = useTranslation()
  const boundaryReady = isValidRegionPolygon(form.boundary)

  return (
    <div className="flex h-full w-full flex-col bg-cc-bg">
      <div className="relative shrink-0 border-b border-cc-border-subtle px-5 py-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cc-accent to-transparent" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <EntityIconBadge moduleKey="region" size="md" variant="dark" />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-zinc-100">
                {t('commandCenter.rail.regions.add')}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                {t('commandCenter.rail.regions.createSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel create region"
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 no-scrollbar">
          <FormSection title="Region metadata">
            <EditFormField
              icon={MapIcon}
              label="Region name"
              required
              iconAccent="text-cc-accent-hover bg-cc-accent/15 ring-cc-accent/25"
            >
              <FormInput
                type="text"
                value={form.regionName}
                onChange={(e) => onChange({ regionName: e.target.value })}
                placeholder="e.g. Grand Alger"
              />
            </EditFormField>

            <EditFormField
              icon={FileText}
              label="Code"
              hint="Short identifier for reports and filters"
              iconAccent="text-zinc-300 bg-zinc-800/80 ring-zinc-700/50"
            >
              <FormInput
                type="text"
                value={form.code}
                onChange={(e) => onChange({ code: e.target.value })}
                placeholder="e.g. ALG-N"
              />
            </EditFormField>

            <EditFormField
              icon={Power}
              label="Status"
              iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20"
            >
              <FormSegmented
                value={form.isActive}
                onChange={(v) => onChange({ isActive: v })}
                options={[
                  { value: true, label: t('commandCenter.popup.active') },
                  { value: false, label: t('commandCenter.popup.inactive') },
                ]}
              />
            </EditFormField>
          </FormSection>

          <FormSection
            title="Boundary"
            description="Draw on the main map — the polygon appears here when ready."
          >
            <div className="px-2 pb-2">
              {boundaryReady ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  Boundary captured ({regionBoundaryPointCount(form.boundary)} points)
                </span>
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/50 px-3 py-3 text-xs leading-relaxed text-zinc-500">
                  No boundary yet. Use <span className="text-zinc-300">Trace neighbor</span> or{' '}
                  <span className="text-zinc-300">Free draw</span> on the map toolbar, then save the boundary.
                </p>
              )}
            </div>
          </FormSection>

          <FormTip icon={MapIcon} variant="blue" title="Map toolbar">
            Trace shared borders with neighboring regions, or free-draw open sides. Drag blue handles to adjust corners.
          </FormTip>

          {clipNotice && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs ${
                clipNotice.includes('adjusted') || clipNotice.includes('saved')
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                  : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
              }`}
            >
              {clipNotice}
            </div>
          )}

          <FormError>{formError}</FormError>
        </div>

        <div className="shrink-0 border-t border-zinc-800/90 bg-zinc-950/60 p-4 backdrop-blur-sm">
          <FormFooter
            onCancel={onCancel}
            submitLabel={t('commandCenter.rail.regions.create')}
            isSubmitting={isSubmitting}
            savingLabel={t('commandCenter.rail.saving')}
          />
        </div>
      </form>
    </div>
  )
}

export function IndustryCreateRail({
  form,
  onChange,
  formError,
  isSubmitting,
  onSubmit,
  onCancel,
}) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full w-full flex-col bg-cc-bg">
      <div className="relative shrink-0 border-b border-zinc-800/90 px-5 py-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500 to-transparent" />
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <EntityIconBadge moduleKey="industry" size="md" variant="dark" />
            <div className="min-w-0">
              <p className="text-sm font-bold tracking-tight text-zinc-100">
                {t('commandCenter.rail.industries.add')}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                {t('commandCenter.rail.industries.createSubtitle')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel create industry"
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-2 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 no-scrollbar">
          <IndustryFormFields form={form} onChange={onChange} variant="dark" />
          <FormTip icon={Factory} variant="rose" title="Map pin">
            Click anywhere on the map to drop a pin, or enter GPS coordinates in the fields above.
          </FormTip>
          <FormError>{formError}</FormError>
        </div>

        <div className="shrink-0 border-t border-zinc-800/90 bg-zinc-950/60 p-4 backdrop-blur-sm">
          <FormFooter
            onCancel={onCancel}
            submitLabel={t('commandCenter.rail.industries.create')}
            isSubmitting={isSubmitting}
            savingLabel={t('commandCenter.rail.saving')}
          />
        </div>
      </form>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Detail panel — entity meta + helpers + profile components          */
/* ------------------------------------------------------------------ */

const ENTITY_META = {
  sector: {
    label: 'Sector',
    icon: Building2,
    accent: 'text-amber-400 bg-amber-500/10 ring-amber-500/30',
    detailPath: (id) => `/sectors/${id}`,
  },
  depot: {
    label: 'Depot',
    icon: Warehouse,
    accent: 'text-blue-400 bg-blue-500/10 ring-blue-500/30',
    detailPath: (id) => `/depots/${id}`,
  },
  industry: {
    label: 'Industry',
    icon: Factory,
    accent: 'text-rose-400 bg-rose-500/10 ring-rose-500/30',
    detailPath: (id) => `/industries/${id}`,
  },
  client: {
    label: 'Client',
    icon: User2,
    accent: 'text-zinc-200 bg-zinc-100/10 ring-zinc-400/30',
    detailPath: (id) => `/clients/${id}`,
  },
  vehicle: {
    label: 'Vehicle',
    icon: Truck,
    accent: 'text-violet-400 bg-violet-500/10 ring-violet-500/30',
    detailPath: null,
  },
  region: {
    label: 'Region',
    icon: MapIcon,
    accent: 'text-cc-accent bg-cc-accent/15 ring-cc-accent/30',
    detailPath: null,
  },
}

function ProfileSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-3 w-28 animate-pulse rounded bg-zinc-800" />
        <div className="h-6 w-3/4 animate-pulse rounded bg-zinc-800" />
        <div className="h-4 w-20 animate-pulse rounded-full bg-zinc-800" />
      </div>
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border-b border-zinc-800/70 py-3 last:border-0"
          >
            <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-800" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-20 animate-pulse rounded bg-zinc-800" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
        <div className="h-8 w-full animate-pulse rounded-md bg-zinc-800" />
        <div className="grid grid-cols-2 gap-2">
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-16 animate-pulse rounded bg-zinc-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-zinc-800" />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Edit forms — shared primitives from CommandCenterForm              */
/* ------------------------------------------------------------------ */

function EditRegionForm({ form, onChange, clipNotice = '' }) {
  return (
    <div className="space-y-4">
      <FormIntro
        accent="blue"
        title="Editing Region"
        description="Use the map toolbar to trace shared edges or free-draw open sides. Drag corners or click a boundary line to add a new one."
      />

      <FormSection title="Region metadata">
        <EditFormField
          icon={MapIcon}
          label="Region Name"
          required
          iconAccent="text-cc-accent-hover bg-cc-accent/15 ring-cc-accent/25"
        >
          <FormInput
            type="text"
            value={form.regionName}
            onChange={(e) => onChange({ regionName: e.target.value })}
            placeholder="e.g. Casablanca North"
          />
        </EditFormField>

        <EditFormField icon={FileText} label="Code" iconAccent="text-zinc-300 bg-zinc-800/80 ring-zinc-700/50">
          <FormInput
            type="text"
            value={form.code}
            onChange={(e) => onChange({ code: e.target.value })}
            placeholder="Short code (optional)"
          />
        </EditFormField>

        <EditFormField icon={Power} label="Status" iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
          <FormToggle
            checked={Boolean(form.isActive)}
            onChange={(v) => onChange({ isActive: v })}
            labelOn="Active"
            labelOff="Inactive"
          />
        </EditFormField>
      </FormSection>

      <FormTip icon={MapIcon} variant="blue" title="Map editing">
        <span className="text-zinc-300">Trace neighbor</span> for shared borders,{' '}
        <span className="text-zinc-300">Free draw</span> for open sides, drag blue handles to move corners,
        or click a line segment to insert a new corner.
      </FormTip>

      {clipNotice && (
        <div
          className={`rounded-xl border px-3.5 py-2.5 text-xs ${
            clipNotice.includes('saved') || clipNotice.includes('added')
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          }`}
        >
          {clipNotice}
        </div>
      )}
    </div>
  )
}

function EditSectorForm({ form, onChange, regions, depots, users }) {
  return (
    <div className="space-y-4">
      <FormIntro
        accent="amber"
        title="Editing Sector"
        description="Update metadata and drag any white corner on the map to reshape the boundary."
      />

      <FormSection title="Sector assignment">
        <EditFormField
          icon={Building2}
          label="Sector Name"
          required
          iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20"
        >
          <FormInput
            type="text"
            value={form.sectorName}
            onChange={(e) => onChange({ sectorName: e.target.value })}
            placeholder="e.g. Casablanca North"
            maxLength={120}
          />
        </EditFormField>

        <EditFormField icon={Globe} label="Region" iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20">
          <FormSelect
            value={form.regionId}
            onChange={(e) => onChange({ regionId: e.target.value })}
          >
            <option value="">No region</option>
            {regions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.region_name}
              </option>
            ))}
          </FormSelect>
        </EditFormField>

        <EditFormField
          icon={Warehouse}
          label="Fulfillment Depot"
          iconAccent="text-blue-300 bg-blue-500/10 ring-blue-500/20"
        >
          <FormSelect
            value={form.depotId}
            onChange={(e) => onChange({ depotId: e.target.value })}
          >
            <option value="">No depot</option>
            {depots.map((depot) => (
              <option key={depot.id} value={depot.id}>
                {depot.depot_name}
              </option>
            ))}
          </FormSelect>
        </EditFormField>

        <EditFormField
          icon={UserCheck}
          label="Default Owner"
          iconAccent="text-violet-300 bg-violet-500/10 ring-violet-500/20"
        >
          <FormSelect
            value={form.assignedProfileId}
            onChange={(e) => onChange({ assignedProfileId: e.target.value })}
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email || user.id}
              </option>
            ))}
          </FormSelect>
        </EditFormField>

        <EditFormField icon={Power} label="Status" iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
          <FormToggle
            checked={form.isActive}
            onChange={(v) => onChange({ isActive: v })}
            labelOn="Active"
            labelOff="Inactive"
          />
        </EditFormField>
      </FormSection>

      <FormTip variant="amber" title="Tip — Editing on the map">
        Each white dot is a corner. Drag it to a new street or landmark. The polygon will stretch to follow.
      </FormTip>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  EditClientForm — controlled inputs for the client editing flow    */
/* ------------------------------------------------------------------ */

function EditClientForm({ form, onChange }) {
  return (
    <div className="space-y-4">
      <FormIntro
        accent="emerald"
        title="Editing Client"
        description="Update the profile fields below. Drag the white dot on the map to adjust the location."
      />

      <FormSection title="Store profile">
        <EditFormField
          icon={Store}
          label="Store Name"
          iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20"
        >
          <FormInput
            type="text"
            value={form.storeName}
            onChange={(e) => onChange({ storeName: e.target.value })}
            placeholder="e.g. Acme Store"
            maxLength={120}
          />
        </EditFormField>

        <EditFormField icon={User2} label="Client Name" iconAccent="text-zinc-300 bg-zinc-500/10 ring-zinc-600/30">
          <FormInput
            type="text"
            value={form.clientName}
            onChange={(e) => onChange({ clientName: e.target.value })}
            placeholder="e.g. John Doe"
            maxLength={120}
          />
        </EditFormField>

        <EditFormField icon={Phone} label="Phone" iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
          <FormInput
            type="text"
            value={form.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="e.g. +212 6 XX XX XX XX"
            maxLength={30}
          />
        </EditFormField>

        <EditFormField icon={MapPin} label="Address" iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20">
          <FormInput
            type="text"
            value={form.clientAddress}
            onChange={(e) => onChange({ clientAddress: e.target.value })}
            placeholder="e.g. 123 Main St"
            maxLength={255}
          />
        </EditFormField>

        <EditFormField icon={MapPin} label="City" iconAccent="text-violet-300 bg-violet-500/10 ring-violet-500/20">
          <FormInput
            type="text"
            value={form.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder="e.g. Casablanca"
            maxLength={100}
          />
        </EditFormField>
      </FormSection>

      <FormTip variant="amber" title="Tip — Drag the marker on the map">
        The white client dot on the map is now draggable. Drag it to the correct location.
      </FormTip>
    </div>
  )
}

function EditDepotForm({ form, onChange }) {
  return (
    <div className="space-y-4">
      <FormIntro
        accent="blue"
        title="Editing Depot"
        description="Update fields below and drag the depot pin on the map to adjust GPS."
      />

      <FormSection title="Depot capacity">
        <EditFormField icon={Warehouse} label="Depot Name" required iconAccent="text-blue-300 bg-blue-500/10 ring-blue-500/20">
          <FormInput
            type="text"
            value={form.depotName}
            onChange={(e) => onChange({ depotName: e.target.value })}
            maxLength={200}
          />
        </EditFormField>
        <EditFormField icon={MapPin} label="Address" iconAccent="text-sky-300 bg-sky-500/10 ring-sky-500/20">
          <FormInput
            type="text"
            value={form.address}
            onChange={(e) => onChange({ address: e.target.value })}
            maxLength={255}
          />
        </EditFormField>
        <EditFormField icon={Banknote} label="Price Capacity (DA)" iconAccent="text-amber-300 bg-amber-500/10 ring-amber-500/20">
          <FormInput
            type="number"
            min={0}
            value={form.totalPriceCapacity}
            onChange={(e) => onChange({ totalPriceCapacity: e.target.value })}
          />
        </EditFormField>
        <EditFormField icon={Box} label="Volume Capacity (L)" iconAccent="text-blue-300 bg-blue-500/10 ring-blue-500/20">
          <FormInput
            type="number"
            min={0}
            value={form.totalVolumeCapacity}
            onChange={(e) => onChange({ totalVolumeCapacity: e.target.value })}
          />
        </EditFormField>
        <EditFormField icon={Power} label="Auto-Approve Replenishment" iconAccent="text-emerald-300 bg-emerald-500/10 ring-emerald-500/20">
          <FormToggle
            checked={form.autoApproveReplenishment}
            onChange={(v) => onChange({ autoApproveReplenishment: v })}
            labelOn="Enabled"
            labelOff="Disabled"
          />
        </EditFormField>
      </FormSection>

      <FormTip variant="amber" title="Tip — Drag the depot pin">
        The warehouse marker on the map is draggable while editing.
      </FormTip>
    </div>
  )
}

function EditIndustryForm({ form, onChange }) {
  return (
    <div className="space-y-4">
      <IndustryFormFields form={form} onChange={onChange} variant="dark" />

      <FormTip icon={Factory} variant="rose" title="Map pin">
        Drag the <span className="text-zinc-200">rose factory pin</span> on the map — coordinates update live in the fields above.
      </FormTip>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DetailPanel — header + body + restyled footer (with edit buttons)  */
/* ------------------------------------------------------------------ */

export function DetailPanel({
  selectedElement,
  details,
  isLoadingDetails,
  detailsError,
  isEditing,
  isSavingEdit,
  saveError,
  editForm,
  onEditFormChange,
  regions,
  depots,
  users,
  editOptionsLoading,
  editOptionsError,
  canManageLogistics,
  canEditMapEntity,
  canUpdateClientCredit,
  onClose,
  onNavigate,
  onEnterEdit,
  onSaveEdit,
  onCancelEdit,
  onClientDetailsUpdate,
  regionEditClipNotice = '',
  followVehicleId,
  onReFollowVehicle,
  onStopFollowVehicle,
  onLinkWialon,
}) {
  const { t } = useTranslation()
  if (!selectedElement) return null
  const meta = ENTITY_META[selectedElement.type]
  if (!meta) return null
  const Icon = meta.icon
  const isSector = selectedElement.type === 'sector'
  const isClient = selectedElement.type === 'client'
  const isDepot = selectedElement.type === 'depot'
  const isVehicle = selectedElement.type === 'vehicle'

  const canEditSelected =
    canManageLogistics &&
    details &&
    (canEditMapEntity ? canEditMapEntity(selectedElement.type, details) : true)
  const isRegion = selectedElement.type === 'region'
  const moduleKey = selectedElement.type
  const mod = getLogisticsModule(moduleKey)
  const isIndustry = moduleKey === 'industry'
  const editTitle =
    editForm?.depotName ||
    editForm?.industryName ||
    editForm?.storeName ||
    editForm?.clientName ||
    editForm?.sectorName ||
    editForm?.regionName

  return (
    <div className="flex h-full w-full flex-col bg-cc-bg text-cc-primary">
      {/* Header */}
      <div
        className={`flex items-start justify-between gap-3 border-b border-cc-border-subtle ${
          isDepot && !isEditing && details ? 'px-5 py-3' : 'px-5 py-4'
        }`}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {mod && (
            <EntityBreadcrumb
              moduleKey={moduleKey}
              entityName={
                isEditing || (isDepot && details)
                  ? undefined
                  : getEntityDisplayName(moduleKey, details, selectedElement.name)
              }
              mode="panel"
              onNavigate={onNavigate}
            />
          )}
          {!(isDepot && !isEditing && details) && (
            <div className="flex min-w-0 items-start gap-3">
            {mod ? (
              <EntityIconBadge moduleKey={moduleKey} size="md" variant="dark" />
            ) : (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ${meta.accent}`}
              >
                <Icon className="h-4.5 w-4.5" />
              </span>
            )}
            <div className="min-w-0">
              {!isEditing && details ? (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-100">
                      {getEntityDisplayName(moduleKey, details, selectedElement.name || meta.label)}
                    </p>
                    {isIndustry && <IndustryTypeBadge isInternal={details.is_internal} compact />}
                    {moduleKey === 'depot' && details.is_central && (
                      <span className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                        Central
                      </span>
                    )}
                  </div>
                  <EntityPanelSubtitle moduleKey={moduleKey} details={details} />
                </>
              ) : isEditing ? (
                <>
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {editTitle || selectedElement.name || meta.label}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">Editing on map</p>
                </>
              ) : (
                <>
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    {selectedElement.name || meta.label}
                  </p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wider text-zinc-500">{meta.label} Details</p>
                </>
              )}
            </div>
          </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isVehicle && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800 px-5 py-2">
          {followVehicleId === selectedElement.id ? (
            <>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-cc-accent">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cc-accent" />
                {t('commandCenter.following')}
              </span>
              <button
                type="button"
                onClick={onStopFollowVehicle}
                className="text-xs font-medium text-zinc-400 transition hover:text-zinc-200"
              >
                {t('commandCenter.stopFollow')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => onReFollowVehicle?.(selectedElement.id)}
              className="text-xs font-semibold text-cc-accent transition hover:text-cc-accent-hover"
            >
              {t('commandCenter.recenterVehicle')}
            </button>
          )}
        </div>
      )}

      {/* Body */}
      <div
        className={`flex-1 overflow-y-auto no-scrollbar ${
          isDepot && !isEditing ? 'px-0 py-0' : 'px-5 py-5'
        }`}
      >
        {editOptionsError && isEditing && (isSector || isDepot || isIndustry) && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{editOptionsError}</span>
          </div>
        )}
        {editOptionsLoading && isEditing && isSector ? (
          <ProfileSkeleton />
        ) : isSector ? (
          isEditing ? (
            <EditSectorForm
              form={editForm}
              onChange={onEditFormChange}
              regions={regions}
              depots={depots}
              users={users}
            />
          ) : (
            <SectorDetailsContent
              sector={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
            />
          )
        ) : isClient ? (
          isEditing ? (
            <EditClientForm form={editForm} onChange={onEditFormChange} />
          ) : (
            <ClientDetailsContent
              client={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
              onClientUpdate={
                canUpdateClientCredit?.(details) ? onClientDetailsUpdate : undefined
              }
            />
          )
        ) : isDepot ? (
          isEditing ? (
            <EditDepotForm form={editForm} onChange={onEditFormChange} />
          ) : (
            <DepotDetailsContent
              depot={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
              initialTab={selectedElement?.tab || null}
              highlightRequestId={selectedElement?.focusId || null}
            />
          )
        ) : isIndustry ? (
          isEditing ? (
            <EditIndustryForm form={editForm} onChange={onEditFormChange} />
          ) : (
            <IndustryDetailsContent
              industry={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
            />
          )
        ) : isVehicle ? (
          isEditing ? (
            <EditVehicleForm form={editForm} onChange={onEditFormChange} depots={depots} />
          ) : (
            <VehicleDetailsContent
              vehicle={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
            />
          )
        ) : isRegion ? (
          isEditing ? (
            <EditRegionForm
              form={editForm}
              onChange={onEditFormChange}
              clipNotice={regionEditClipNotice}
            />
          ) : (
            <RegionDetailsContent
              region={details}
              isLoading={isLoadingDetails && !details}
              error={detailsError}
              layout="panel"
              showMap={false}
            />
          )
        ) : null}
      </div>

      {/* Footer action(s) */}
      <div className="border-t border-zinc-800 p-4">
        {saveError && isEditing && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-900/50 bg-red-950/40 p-2.5 text-xs text-red-200">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        {isEditing ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSavingEdit}
              className="flex-1 rounded-xl border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:bg-zinc-800/60 active:bg-zinc-800 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={isSavingEdit}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-sm transition hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50"
            >
              {isSavingEdit ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {isSavingEdit ? t('commandCenter.detail.saving') : t('commandCenter.detail.saveChanges')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {canEditSelected && isVehicle && details && (
              <button
                type="button"
                onClick={() => onLinkWialon?.(details)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-cc-accent/40 bg-cc-accent/10 px-4 py-2.5 text-sm font-medium text-cc-accent-hover transition hover:bg-cc-accent/20"
              >
                <Radio className="h-4 w-4" />
                {details.wialon_unit_id ? t('commandCenter.detail.manageWialon') : t('commandCenter.detail.linkWialon')}
              </button>
            )}
            {canEditSelected && details && (isSector || isRegion || isClient || isDepot || isIndustry || isVehicle) && (
              <button
                type="button"
                onClick={onEnterEdit}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-700 bg-transparent px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-zinc-800"
              >
                <Pencil className="h-4 w-4" />
                {isVehicle
                  ? t('commandCenter.detail.editVehicle')
                  : isSector || isRegion
                    ? t('commandCenter.detail.editLocationBoundary')
                    : t('commandCenter.detail.editLocationDetails')}
              </button>
            )}
            {mod?.hasDetailPage && (
              <button
                type="button"
                onClick={() => onNavigate(mod.mapDeepLink(selectedElement.id))}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-white"
              >
                <ExternalLink className="h-4 w-4" />
                {t('commandCenter.detail.openFullProfile')}
              </button>
            )}
            {mod && (
              <button
                type="button"
                onClick={() => onNavigate(mod.listPath)}
                className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-medium text-zinc-500 transition hover:text-zinc-300"
              >
                All {mod.plural}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Lightweight toast (success only — errors render inline above)     */
/* ------------------------------------------------------------------ */

export function EditToast({ message, onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [message, onClose])
  if (!message) return null
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[1200] -translate-x-1/2">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-zinc-950/95 px-4 py-2.5 text-sm font-medium text-emerald-200 shadow-2xl backdrop-blur">
        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        {message}
      </div>
    </div>
  )
}