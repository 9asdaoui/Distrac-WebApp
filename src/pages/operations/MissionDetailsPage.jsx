import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Route,
  Save,
  Trash2,
  Truck,
  User,
  X,
} from 'lucide-react'
import { AnimatedPage } from '../../components/AnimatedPage'
import { usePanelEmbed } from '../../components/map/CcPanelHost'
import { buildGlobalMapPanelHref } from '../../components/map/ccPanelRegistry'
import { useCcNavigation } from '../../hooks/useCcNavigation'
import apiInstance from '../../api/axiosInstance'
import {
  CustomStopEditorFields,
  buildCustomStopPayload,
  emptyCustomStopFields,
  validateCustomStopDraft,
} from '../../components/missions/CustomStopEditorFields'

const STOP_TYPES = [
  { value: 'DELIVERY', label: 'Delivery (order)' },
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'PICKUP', label: 'Industry pickup' },
  { value: 'CUSTOM', label: 'Custom task' },
]

const STOP_TYPE_BADGES = {
  PICKUP: 'bg-orange-500/90 text-white',
  DELIVERY: 'bg-blue-600/90 text-white',
  COLLECTION: 'bg-emerald-600/90 text-white',
  CUSTOM: 'bg-violet-600/90 text-white',
  RETURN_PICKUP: 'bg-rose-600/90 text-white',
}

const MISSION_STATUS_META = {
  PROPOSED: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200',
  CANCELLED: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
}

const EDITABLE_MISSION_STATUSES = ['PROPOSED', 'APPROVED']

const inputClass =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100'

function CompactKpi({ icon: Icon, label, value, hint }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50/80 px-3 py-2 dark:bg-zinc-800/50">
      <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      <div className="min-w-0 flex-1">
        <p className="text-cc-label font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
        {hint ? <div className="mt-0.5 text-cc-caption text-zinc-500">{hint}</div> : null}
      </div>
    </div>
  )
}

function DetailRow({ label, children }) {
  if (children == null || children === '') return null
  return (
    <div className="space-y-0.5">
      <p className="text-cc-label font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="text-sm text-zinc-800 dark:text-zinc-200">{children}</div>
    </div>
  )
}

function formatProductsCompact(lineItems) {
  if (!lineItems?.length) return null
  return lineItems
    .map((item) => {
      const qty = Number(item.quantity || 0)
      const name = item.product_name || 'Item'
      return qty > 0 ? `${qty}x ${name}` : name
    })
    .join(', ')
}

function getStopKey(stop, index) {
  return stop?.key || stop?.id || `stop-${index}`
}

function getStopType(stop) {
  return stop?.stop_type || stop?.stopType || 'CUSTOM'
}

function getStopTitle(stop, options = {}, depotOrigin = null) {
  if (stop?.stopType) return getStopLabel(stop, options, depotOrigin)
  const stopType = getStopType(stop)
  const details = stop?.entity_details || {}
  if (stopType === 'CUSTOM') return stop?.custom_description || 'Custom task'
  if (stopType === 'DELIVERY') return details.client_name || stop?.location?.name || 'Delivery'
  if (stopType === 'COLLECTION') return details.client_name || stop?.location?.name || 'Collection'
  if (stopType === 'PICKUP') return details.industry_name || stop?.location?.name || 'Industry pickup'
  if (stopType === 'RETURN_PICKUP') return details.client_name || stop?.location?.name || 'Return pickup'
  return stop?.location?.name || 'Stop'
}

function getDraftStopBase(depotId) {
  return {
    key: `${Date.now()}-${Math.random()}`,
    id: null,
    stopType: 'DELIVERY',
    entityId: '',
    ...emptyCustomStopFields(),
    metadata: {},
    location: null,
    entity_details: {},
    line_items: [],
    completed_at: null,
    qr_verified_at: null,
    status: null,
    display_type: null,
    isNew: true,
    depotId,
  }
}

function buildDraftMission(mission) {
  return {
    depotId: mission?.depot_id || '',
    livreurId: mission?.livreur?.id || mission?.livreur_id || '',
    date: mission?.date || '',
  }
}

function stopsToDraft(stops, depotId) {
  return (stops || []).map((stop, index) => {
    const entityType = String(stop.metadata?.entity_type || '').toUpperCase()
    const isClientCustom = stop.stop_type === 'CUSTOM' && entityType === 'CLIENT'
    const isIndustryCustom = stop.stop_type === 'CUSTOM' && entityType === 'INDUSTRY'
    const validation = stop.metadata?.validation || {}
    const arrive = validation.arrive || {}
    const complete = validation.complete || {}
    return {
      key: stop.id || `existing-${index}`,
      id: stop.id,
      stopType: stop.stop_type,
      entityId: String(stop.entity_id || ''),
      customDescription: stop.custom_description || '',
      templateKey: validation.template_key || '',
      arriveMethod: arrive.method || (isClientCustom || isIndustryCustom ? 'scan' : 'none'),
      scanTarget:
        arrive.scan_target ||
        arrive.scanTarget ||
        (isClientCustom ? 'client' : isIndustryCustom ? 'industry' : 'depot'),
      requireImage: Boolean(complete.require_image ?? complete.requireImage),
      requireNote: Boolean(complete.require_note ?? complete.requireNote),
      customTarget: isClientCustom ? 'client' : 'depot',
      customClientId: isClientCustom ? String(stop.entity_id || '') : '',
      customIndustryId: isIndustryCustom ? String(stop.entity_id || '') : '',
      metadata: { ...(stop.metadata || {}) },
      location: stop.location || null,
      entity_details: stop.entity_details || {},
      line_items: stop.line_items || [],
      completed_at: stop.completed_at,
      qr_verified_at: stop.qr_verified_at || null,
      status: stop.status || null,
      display_type: stop.display_type || null,
      isNew: false,
      depotId,
    }
  })
}

function buildLocation(address, city, lat, lon, name) {
  const locationName = name || null
  const locationAddress = [address, city].filter(Boolean).join(' ').trim() || null
  return {
    name: locationName,
    address: locationAddress,
    lat: lat != null ? Number(lat) : null,
    lon: lon != null ? Number(lon) : null,
  }
}

function hydrateDraftStop(stop, options, depotOrigin) {
  if (!stop) return stop

  if (stop.stopType === 'DELIVERY') {
    const order = (options.orders || []).find((row) => row.orderNumber === stop.entityId)
    if (!order) return { ...stop, metadata: {} }
    return {
      ...stop,
      metadata: {},
      location: buildLocation(order.clientAddress, order.clientCity, order.gpsLatitude, order.gpsLongitude, order.clientName),
      entity_details: {
        order_id: order.orderNumber,
        client_id: order.clientId,
        client_name: order.clientName,
        client_phone: order.clientPhone,
        payment_method: order.paymentMethod,
        order_total: order.totalAmount,
      },
      line_items: stop.isNew ? [] : stop.line_items || [],
    }
  }

  if (stop.stopType === 'COLLECTION') {
    const collection = (options.collections || []).find((row) => row.ledgerId === stop.entityId)
    if (!collection) return { ...stop, metadata: {} }
    return {
      ...stop,
      metadata: {},
      location: buildLocation(
        collection.clientAddress,
        collection.clientCity,
        collection.gpsLatitude,
        collection.gpsLongitude,
        collection.clientName,
      ),
      entity_details: {
        ledger_id: collection.ledgerId,
        client_id: collection.clientId,
        client_name: collection.clientName,
        client_phone: collection.clientPhone,
        amount_due: collection.amountDue,
        due_date: collection.dueDate,
      },
    }
  }

  if (stop.stopType === 'PICKUP') {
    const pickup = (options.pickups || []).find((row) => row.fulfillmentOrderId === stop.entityId)
    if (!pickup) return { ...stop, metadata: {} }
    return {
      ...stop,
      metadata: {},
      location: {
        name: pickup.industryName || 'Industry',
        address: pickup.address || null,
        lat: pickup.gpsLatitude != null ? Number(pickup.gpsLatitude) : null,
        lon: pickup.gpsLongitude != null ? Number(pickup.gpsLongitude) : null,
      },
      entity_details: {
        fulfillment_order_id: pickup.fulfillmentOrderId,
        industry_name: pickup.industryName,
        status: pickup.status,
      },
    }
  }

  if (stop.stopType === 'CUSTOM') {
    const validationMeta = stop.metadata?.validation
      ? { validation: stop.metadata.validation }
      : {}
    if (stop.arriveMethod === 'scan' && stop.scanTarget === 'client') {
      const client = (options.clients || []).find((row) => row.id === stop.customClientId)
      if (!client) {
        return {
          ...stop,
          entityId: stop.customClientId || stop.entityId,
          metadata: { entity_type: 'CLIENT', ...validationMeta },
        }
      }
      return {
        ...stop,
        entityId: client.id,
        metadata: { entity_type: 'CLIENT', ...validationMeta },
        location: buildLocation(client.address, client.city, client.gpsLatitude, client.gpsLongitude, client.clientName),
        entity_details: {
          client_id: client.id,
          client_name: client.clientName,
          client_phone: client.phone,
        },
      }
    }

    if (stop.arriveMethod === 'scan' && stop.scanTarget === 'industry') {
      return {
        ...stop,
        entityId: stop.customIndustryId || stop.entityId,
        metadata: { entity_type: 'INDUSTRY', ...validationMeta },
      }
    }

    return {
      ...stop,
      entityId: stop.depotId || stop.entityId,
      metadata: { entity_type: 'DEPOT', ...validationMeta },
      location: depotOrigin
        ? {
            name: depotOrigin.name,
            address: depotOrigin.address || null,
            lat: depotOrigin.lat != null ? Number(depotOrigin.lat) : null,
            lon: depotOrigin.lon != null ? Number(depotOrigin.lon) : null,
          }
        : stop.location,
      entity_details: {
        depot_id: stop.depotId || stop.entityId,
        depot_name: depotOrigin?.name || 'Depot',
      },
    }
  }

  return stop
}

function getStopLabel(stop, options, depotOrigin) {
  if (stop.stopType === 'DELIVERY') {
    const order = (options.orders || []).find((row) => row.orderNumber === stop.entityId)
    const orderId = order?.orderNumber || stop.entity_details?.order_id || stop.entityId
    const clientName = order?.clientName || stop.entity_details?.client_name || stop.location?.name || 'Client'
    return orderId ? `${clientName} - Order ${orderId}` : clientName
  }

  if (stop.stopType === 'COLLECTION') {
    const collection = (options.collections || []).find((row) => row.ledgerId === stop.entityId)
    const clientName = collection?.clientName || stop.entity_details?.client_name || stop.location?.name || 'Client'
    const amount = collection?.amountDue ?? stop.entity_details?.amount_due
    return amount != null ? `${clientName} - ${Number(amount).toLocaleString()} MAD` : clientName
  }

  if (stop.stopType === 'PICKUP') {
    const pickup = (options.pickups || []).find((row) => row.fulfillmentOrderId === stop.entityId)
    return pickup?.industryName || stop.entity_details?.industry_name || stop.location?.name || 'Industry pickup'
  }

  if (stop.customDescription) return stop.customDescription
  if (stop.customTarget === 'client') {
    const client = (options.clients || []).find((row) => row.id === stop.customClientId)
    return client?.clientName || 'Custom client task'
  }
  return depotOrigin?.name ? `Depot task - ${depotOrigin.name}` : 'Custom depot task'
}

function resolveStopPayload(stop, index, depotId) {
  if (stop.stopType === 'CUSTOM') {
    return {
      ...buildCustomStopPayload(stop, depotId),
      sequenceNumber: index + 1,
    }
  }

  return {
    stopType: stop.stopType,
    entityId: String(stop.entityId),
    sequenceNumber: index + 1,
    customDescription: null,
    metadata: {},
  }
}

function DraftStopFields({
  stop,
  options,
  usedDeliveryOrders,
  onChange,
}) {
  const currentDeliveryLabel = stop.entityId && !(options.orders || []).some((row) => row.orderNumber === stop.entityId)
  const currentCollectionLabel = stop.entityId && !(options.collections || []).some((row) => row.ledgerId === stop.entityId)
  const currentPickupLabel = stop.entityId && !(options.pickups || []).some((row) => row.fulfillmentOrderId === stop.entityId)

  const update = (patch) => onChange(patch)

  return (
    <div className="space-y-3">
      <select
        value={stop.stopType}
        onChange={(e) =>
          update({
            stopType: e.target.value,
            entityId: '',
            customDescription: '',
            customTarget: 'depot',
            customClientId: '',
            metadata: {},
            location: null,
            entity_details: {},
            line_items: [],
          })
        }
        className={inputClass}
      >
        {STOP_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </select>

      {stop.stopType === 'DELIVERY' && (
        <select
          value={stop.entityId}
          onChange={(e) => update({ entityId: e.target.value })}
          className={inputClass}
        >
          <option value="">Select order...</option>
          {currentDeliveryLabel && <option value={stop.entityId}>{stop.entityId} (current)</option>}
          {(options.orders || [])
            .filter((row) => !usedDeliveryOrders.has(row.orderNumber) || row.orderNumber === stop.entityId)
            .map((row) => (
              <option key={row.orderNumber} value={row.orderNumber}>
                {row.orderNumber} - {row.clientName || 'Client'} ({row.totalAmount} MAD)
              </option>
            ))}
        </select>
      )}

      {stop.stopType === 'COLLECTION' && (
        <select
          value={stop.entityId}
          onChange={(e) => update({ entityId: e.target.value })}
          className={inputClass}
        >
          <option value="">Select collection...</option>
          {currentCollectionLabel && <option value={stop.entityId}>{stop.entityId} (current)</option>}
          {(options.collections || []).map((row) => (
            <option key={row.ledgerId} value={row.ledgerId}>
              {row.clientName || 'Client'} - {row.amountDue} MAD
            </option>
          ))}
        </select>
      )}

      {stop.stopType === 'PICKUP' && (
        <select
          value={stop.entityId}
          onChange={(e) => update({ entityId: e.target.value })}
          className={inputClass}
        >
          <option value="">Select pickup...</option>
          {currentPickupLabel && <option value={stop.entityId}>{stop.entityId} (current)</option>}
          {(options.pickups || []).map((row) => (
            <option key={row.fulfillmentOrderId} value={row.fulfillmentOrderId}>
              {row.industryName || 'Industry'} - {row.status}
            </option>
          ))}
        </select>
      )}

      {stop.stopType === 'CUSTOM' && (
        <CustomStopEditorFields
          stop={stop}
          onChange={update}
          templates={options.templates || []}
          clients={options.clients || []}
          industries={options.industries || []}
          inputClass={inputClass}
        />
      )}
    </div>
  )
}

function StopListCard({
  stop,
  index,
  isLast,
  selected,
  onSelect,
  isEditMode,
  options,
  depotOrigin,
  onMove,
  onRemove,
}) {
  const stopType = getStopType(stop)
  const badgeCls = STOP_TYPE_BADGES[stopType] || STOP_TYPE_BADGES.CUSTOM
  const title = getStopTitle(stop, options, depotOrigin)
  const completed = Boolean(stop.completed_at)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="relative flex gap-3"
    >
      <div className="flex w-6 shrink-0 flex-col items-center">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-cc-label font-bold ${
            selected
              ? 'bg-distrac-primary text-white'
              : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
          }`}
        >
          {index + 1}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />}
      </div>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onSelect}
          className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
            selected
              ? 'border-distrac-primary/40 bg-distrac-primary/5 ring-1 ring-distrac-primary/50 dark:bg-distrac-primary/10'
              : 'border-zinc-200/80 bg-white hover:border-zinc-300 dark:border-zinc-700/80 dark:bg-cc-surface/80 dark:hover:border-zinc-600'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-cc-label font-bold uppercase ${badgeCls}`}>
                  {stopType}
                </span>
                {completed ? (
                  <span className="inline-flex items-center gap-0.5 text-cc-label text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" /> Done
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-cc-label text-zinc-400">
                    <Clock className="h-3 w-3" /> Pending
                  </span>
                )}
              </div>
              <p className="mt-1.5 truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
              {stop.location?.address ? (
                <p className="mt-0.5 line-clamp-1 text-cc-caption text-zinc-500">{stop.location.address}</p>
              ) : null}
            </div>
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-0.5 text-cc-caption font-medium text-zinc-400">
              {selected ? 'Open' : 'View'}
              <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </button>

        {isEditMode ? (
          <div className="mt-1 flex items-center justify-end gap-1 px-0.5">
            <button
              type="button"
              onClick={() => onMove(index, -1)}
              disabled={index === 0}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              title="Move up"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, 1)}
              disabled={isLast}
              className="rounded p-1 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 dark:hover:bg-zinc-800"
              title="Move down"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              title="Remove stop"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}

function StopDetailPanel({
  stop,
  index,
  isEditMode,
  options,
  depotOrigin,
  usedDeliveryOrders,
  onClose,
  onChange,
}) {
  if (!stop) return null

  const stopType = getStopType(stop)
  const badgeCls = STOP_TYPE_BADGES[stopType] || STOP_TYPE_BADGES.CUSTOM
  const details = stop.entity_details || {}
  const location = stop.location || {}
  const lineItems = stop.line_items || []
  const orderId = details.order_id || (stopType === 'DELIVERY' ? stop.entity_id || stop.entityId : null)
  const customDescription = stop.custom_description || stop.customDescription
  const validation = stop.metadata?.validation

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex items-start justify-between gap-2 px-0.5">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Stop details</h2>
          <p className="mt-0.5 text-cc-caption text-zinc-400">#{index + 1} · {stopType}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          aria-label="Close stop details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-cc-surface">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-cc-label font-bold uppercase ${badgeCls}`}>{stopType}</span>
          {stop.completed_at ? (
            <span className="inline-flex items-center gap-0.5 text-cc-label text-emerald-600">
              <CheckCircle2 className="h-3 w-3" /> Done
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 text-cc-label text-zinc-400">
              <Clock className="h-3 w-3" /> Pending
            </span>
          )}
          {stop.display_type ? (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-cc-label font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {String(stop.display_type).replace(/_/g, ' ')}
            </span>
          ) : null}
        </div>

        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {getStopTitle(stop, options, depotOrigin)}
        </p>

        {isEditMode ? (
          <div className="space-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <p className="text-cc-caption font-semibold uppercase tracking-wide text-distrac-primary">
              Edit this stop
            </p>
            <DraftStopFields
              stop={stop}
              options={options}
              usedDeliveryOrders={usedDeliveryOrders}
              onChange={onChange}
            />
          </div>
        ) : (
          <div className="space-y-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <DetailRow label="Location">{location.name}</DetailRow>
            <DetailRow label="Address">{location.address}</DetailRow>
            {(location.lat != null || location.lon != null) && (
              <DetailRow label="Coordinates">
                {location.lat != null && location.lon != null
                  ? `${Number(location.lat).toFixed(5)}, ${Number(location.lon).toFixed(5)}`
                  : 'â€”'}
              </DetailRow>
            )}

            {stopType === 'DELIVERY' && (
              <>
                <DetailRow label="Client">{details.client_name}</DetailRow>
                <DetailRow label="Phone">
                  {details.client_phone ? (
                    <a href={`tel:${details.client_phone}`} className="inline-flex items-center gap-1 hover:text-distrac-primary">
                      <Phone className="h-3 w-3" />
                      {details.client_phone}
                    </a>
                  ) : null}
                </DetailRow>
                <DetailRow label="Order">
                  {orderId ? (
                    <Link
                      to={buildGlobalMapPanelHref('orders', orderId)}
                      className="inline-flex items-center gap-1 font-medium text-distrac-primary hover:underline"
                    >
                      #{orderId}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null}
                </DetailRow>
                <DetailRow label="Payment">{details.payment_method}</DetailRow>
                <DetailRow label="Order total">
                  {details.order_total != null ? `${Number(details.order_total).toLocaleString()} MAD` : null}
                </DetailRow>
                <DetailRow label="Products">
                  {lineItems.length > 0 ? (
                    <ul className="space-y-1">
                      {lineItems.map((item, i) => (
                        <li key={`${item.product_id || item.product_name}-${i}`} className="flex items-start gap-1.5">
                          <Package className="mt-0.5 h-3 w-3 shrink-0 text-zinc-400" />
                          <span>
                            {Number(item.quantity || 0)}x {item.product_name || 'Item'}
                            {item.unit ? ` (${item.unit})` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    formatProductsCompact(lineItems)
                  )}
                </DetailRow>
              </>
            )}

            {stopType === 'COLLECTION' && (
              <>
                <DetailRow label="Client">{details.client_name}</DetailRow>
                <DetailRow label="Phone">{details.client_phone}</DetailRow>
                <DetailRow label="Amount due">
                  {details.amount_due != null ? `${Number(details.amount_due).toLocaleString()} MAD` : null}
                </DetailRow>
                <DetailRow label="Due date">{details.due_date}</DetailRow>
              </>
            )}

            {stopType === 'PICKUP' && (
              <>
                <DetailRow label="Industry">{details.industry_name || location.name}</DetailRow>
                <DetailRow label="Fulfillment order">{details.fulfillment_order_id}</DetailRow>
                <DetailRow label="Stock request">{details.stock_request_id}</DetailRow>
                <DetailRow label="Status">{details.status || stop.status}</DetailRow>
              </>
            )}

            {stopType === 'RETURN_PICKUP' && (
              <>
                <DetailRow label="Client">{details.client_name}</DetailRow>
                <DetailRow label="Phone">{details.client_phone}</DetailRow>
                <DetailRow label="Return">{details.return_id}</DetailRow>
                <DetailRow label="Reason">{details.reason}</DetailRow>
                <DetailRow label="Status">{details.status || stop.status}</DetailRow>
              </>
            )}

            {stopType === 'CUSTOM' && (
              <>
                <DetailRow label="Description">{customDescription}</DetailRow>
                {validation ? (
                  <DetailRow label="Validation">
                    <pre className="whitespace-pre-wrap break-words text-cc-caption text-zinc-500">
                      {JSON.stringify(validation, null, 2)}
                    </pre>
                  </DetailRow>
                ) : null}
              </>
            )}

            <DetailRow label="Stop status">{stop.status}</DetailRow>
            <DetailRow label="QR verified">
              {stop.qr_verified_at ? new Date(stop.qr_verified_at).toLocaleString() : null}
            </DetailRow>
            <DetailRow label="Completed">
              {stop.completed_at ? new Date(stop.completed_at).toLocaleString() : null}
            </DetailRow>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        className="self-start text-cc-caption font-medium text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        Back to mission details
      </button>
    </div>
  )
}

export function MissionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { openPanel } = useCcNavigation()
  const embedded = usePanelEmbed()
  const [mission, setMission] = useState(null)
  const [availableLivreurs, setAvailableLivreurs] = useState([])
  const [builderOptions, setBuilderOptions] = useState({
    depot: null,
    date: '',
    livreurs: [],
    orders: [],
    collections: [],
    pickups: [],
    clients: [],
  })
  const [draftMission, setDraftMission] = useState(null)
  const [draftStops, setDraftStops] = useState([])
  const [selectedStopKey, setSelectedStopKey] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [error, setError] = useState('')

  const loadMission = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get(`/missions/${id}`)
      const data = res.data?.data || {}
      const loadedMission = data.mission || null
      setMission(loadedMission)
      setAvailableLivreurs(data.availableLivreurs || [])
      setDraftMission(loadedMission ? buildDraftMission(loadedMission) : null)
      setDraftStops(stopsToDraft(loadedMission?.stops, loadedMission?.depot_id))
      setSelectedStopKey(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load mission.')
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadMission()
  }, [loadMission])

  const canEdit = mission && EDITABLE_MISSION_STATUSES.includes(mission.status)
  const metrics = mission?.route_metrics || {}

  const depotOrigin = useMemo(() => {
    if (mission?.depot_origin) return mission.depot_origin
    const depot = mission?.depot
    if (!depot) return null
    return {
      id: mission.depot_id,
      name: depot.depot_name,
      address: depot.address,
      lat: depot.gps_latitude != null ? Number(depot.gps_latitude) : null,
      lon: depot.gps_longitude != null ? Number(depot.gps_longitude) : null,
    }
  }, [mission])

  useEffect(() => {
    if (!isEditMode || !draftMission?.depotId || !draftMission?.date) return undefined

    let cancelled = false
    const loadOptions = async () => {
      setIsLoadingOptions(true)
      try {
        const [res, templatesRes, industriesRes] = await Promise.all([
          apiInstance.get('/missions/builder-options', {
            params: {
              depotId: draftMission.depotId,
              date: draftMission.date,
            },
          }),
          apiInstance.get('/missions/custom-stop-templates'),
          apiInstance.get('/industries').catch(() => ({ data: { data: [] } })),
        ])
        if (cancelled) return
        const data = res.data?.data || {}
        const industriesPayload = industriesRes.data?.data || {}
        const industries = Array.isArray(industriesPayload)
          ? industriesPayload
          : industriesPayload.industries || []
        setBuilderOptions({
          depot: data.depot || null,
          date: data.date || draftMission.date,
          livreurs: data.livreurs || [],
          orders: data.orders || [],
          collections: data.collections || [],
          pickups: data.pickups || [],
          clients: data.clients || [],
          templates: templatesRes.data?.data?.templates || [],
          industries,
        })
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || 'Failed to load mission options.')
        }
      } finally {
        if (!cancelled) setIsLoadingOptions(false)
      }
    }

    loadOptions()
    return () => {
      cancelled = true
    }
  }, [isEditMode, draftMission?.depotId, draftMission?.date])

  useEffect(() => {
    if (!isEditMode) return
    setDraftStops((prev) => prev.map((stop) => hydrateDraftStop(stop, builderOptions, depotOrigin)))
  }, [builderOptions, depotOrigin, isEditMode])

  const displayStops = useMemo(() => {
    if (isEditMode) {
      return draftStops
        .map((stop, index) => ({
          ...stop,
          sequence_number: index + 1,
          stop_type: stop.stopType,
        }))
        .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
    }

    return [...(mission?.stops || [])].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
  }, [draftStops, isEditMode, mission?.stops])

  const selectedStopIndex = useMemo(() => {
    if (!selectedStopKey) return -1
    return displayStops.findIndex((stop, index) => getStopKey(stop, index) === selectedStopKey)
  }, [displayStops, selectedStopKey])

  const selectedStop = selectedStopIndex >= 0 ? displayStops[selectedStopIndex] : null

  const usedDeliveryOrders = useMemo(
    () => new Set(draftStops.filter((stop) => stop.stopType === 'DELIVERY' && stop.entityId).map((stop) => stop.entityId)),
    [draftStops],
  )

  const backToMissions = () => {
    // Always land on CC missions list. Avoid setSearchParams here — this page is
    openPanel('missions')
  }

  const enterEditMode = () => {
    setDraftMission(buildDraftMission(mission))
    setDraftStops(stopsToDraft(mission?.stops, mission?.depot_id))
    setError('')
    setIsEditMode(true)
  }

  const cancelEdit = () => {
    setDraftMission(buildDraftMission(mission))
    setDraftStops(stopsToDraft(mission?.stops, mission?.depot_id))
    setError('')
    setIsEditMode(false)
  }

  const moveStop = (index, direction) => {
    setDraftStops((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      const movedKey = getStopKey(next[target], target)
      setSelectedStopKey(movedKey)
      return next
    })
  }

  const removeStop = (index) => {
    const removingKey = getStopKey(draftStops[index], index)
    setDraftStops((prev) => prev.filter((_, i) => i !== index))
    setSelectedStopKey((prev) => (prev === removingKey ? null : prev))
  }

  const addStop = () => {
    const next = getDraftStopBase(draftMission?.depotId || mission?.depot_id)
    setDraftStops((prev) => [...prev, next])
    setSelectedStopKey(next.key)
  }

  const updateDraftStop = (index, patch) => {
    setDraftStops((prev) =>
      prev.map((stop, i) => {
        if (i !== index) return stop
        return hydrateDraftStop(
          {
            ...stop,
            ...patch,
            depotId: draftMission?.depotId || mission?.depot_id,
          },
          builderOptions,
          depotOrigin,
        )
      }),
    )
  }

  const savePlan = async () => {
    if (!draftMission?.livreurId) {
      setError('Select a livreur before saving.')
      return
    }

    if (!draftMission?.date) {
      setError('Mission date is required.')
      return
    }

    if (draftStops.length === 0) {
      setError('Mission must have at least one stop.')
      return
    }

    for (const stop of draftStops) {
      if (stop.stopType === 'CUSTOM') {
        const customError = validateCustomStopDraft(stop)
        if (customError) {
          setError(customError)
          return
        }
      } else if (!stop.entityId) {
        setError('Each stop must have a selected entity.')
        return
      }
    }

    setIsSaving(true)
    setError('')
    try {
      const payloadStops = draftStops.map((stop, index) =>
        resolveStopPayload(stop, index, draftMission.depotId || mission?.depot_id),
      )
      const res = await apiInstance.patch(`/missions/${id}`, {
        livreurId: draftMission.livreurId,
        date: draftMission.date,
        stops: payloadStops,
      })
      const data = res.data?.data || {}
      setMission(data.mission || null)
      setAvailableLivreurs(data.availableLivreurs || [])
      setDraftMission(data.mission ? buildDraftMission(data.mission) : null)
      setDraftStops(stopsToDraft(data.mission?.stops, data.mission?.depot_id))
      setIsEditMode(false)
      setSelectedStopKey(null)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save mission changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const approveMission = async () => {
    setIsApproving(true)
    setError('')
    try {
      await apiInstance.post(`/missions/${id}/approve`)
      await loadMission()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to approve mission.')
    } finally {
      setIsApproving(false)
    }
  }

  const deleteMission = async () => {
    if (!mission) return

    const confirmed = window.confirm(
      `Delete mission #${mission.id.slice(0, 8).toUpperCase()}? This will remove the whole mission and all its stops.`,
    )
    if (!confirmed) return

    setIsDeleting(true)
    setError('')
    try {
      await apiInstance.delete(`/missions/${id}`)
      backToMissions()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to delete mission.')
    } finally {
      setIsDeleting(false)
    }
  }

  const missionTitle = mission
    ? `#${mission.id.slice(0, 8).toUpperCase()} · ${mission.livreur?.full_name || 'Unassigned'}`
    : 'Mission'

  return (
    <AnimatedPage>
      <div className="mx-auto max-w-7xl space-y-3 p-4 md:p-5">
        <button
          type="button"
          onClick={backToMissions}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-cc-tertiary dark:hover:text-cc-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {embedded ? 'Missions' : 'Back to missions'}
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-zinc-400" />
          </div>
        ) : error && !mission ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : !mission ? (
          <p className="text-center text-sm text-zinc-500">Mission not found.</p>
        ) : (
          <>
            <header
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 ${
                isEditMode
                  ? 'border-distrac-primary/30 bg-distrac-primary/5 dark:border-distrac-primary/40 dark:bg-distrac-primary/10'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-cc-surface'
              }`}
            >
              <div className="min-w-0">
                <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">{missionTitle}</h1>
                <p className="text-xs text-zinc-500">
                  {mission.mission_type?.replace('_', ' ')} · {mission.date}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-cc-label font-bold uppercase ${
                    MISSION_STATUS_META[mission.status] || MISSION_STATUS_META.PROPOSED
                  }`}
                >
                  {mission.status}
                </span>
                {isEditMode ? (
                  <>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={deleteMission}
                        disabled={isDeleting || isSaving}
                        className="btn-danger px-3 py-2 text-xs"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Delete
                      </button>
                    )}
                    <button type="button" onClick={cancelEdit} className="btn-secondary-sm">
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button type="button" onClick={savePlan} disabled={isSaving} className="btn-primary-sm">
                      {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save changes
                    </button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <>
                        <button
                          type="button"
                          onClick={deleteMission}
                          disabled={isDeleting}
                          className="btn-danger px-3 py-2 text-xs"
                        >
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete
                        </button>
                        <button type="button" onClick={enterEditMode} className="btn-primary-sm">
                          <Pencil className="h-3.5 w-3.5" />
                          Edit mission
                        </button>
                      </>
                    )}
                    {mission.status === 'PROPOSED' && (
                      <button
                        type="button"
                        onClick={approveMission}
                        disabled={isApproving}
                        className="btn-primary-sm"
                      >
                        {isApproving ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        )}
                        Approve
                      </button>
                    )}
                  </>
                )}
              </div>
            </header>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid gap-3 lg:grid-cols-3">
              <div className="flex min-h-0 flex-col lg:col-span-2">
                {isEditMode ? (
                  <div className="mb-3 space-y-2 rounded-lg border border-distrac-primary/20 bg-white/80 p-3 dark:border-distrac-primary/30 dark:bg-cc-surface/80">
                    <div>
                      <label className="mb-1 block text-cc-caption font-medium uppercase tracking-wide text-zinc-500">
                        Livreur
                      </label>
                      <select
                        value={draftMission?.livreurId || ''}
                        onChange={(e) => setDraftMission((prev) => ({ ...prev, livreurId: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="">Select livreur...</option>
                        {(builderOptions.livreurs?.length ? builderOptions.livreurs : availableLivreurs).map((livreur) => (
                          <option key={livreur.id} value={livreur.id}>
                            {livreur.full_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-cc-caption font-medium uppercase tracking-wide text-zinc-500">
                        Mission date
                      </label>
                      <input
                        type="date"
                        value={draftMission?.date || ''}
                        onChange={(e) => setDraftMission((prev) => ({ ...prev, date: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-cc-surface">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Task list</h2>
                      <p className="text-cc-label text-zinc-400">
                        {isEditMode
                          ? 'Select a stop to edit it in the side panel. Reorder or remove from the list.'
                          : 'Click a stop to view its details'}
                      </p>
                    </div>
                    {isEditMode && (
                      <button type="button" onClick={addStop} className="btn-secondary-sm">
                        <Plus className="h-3.5 w-3.5" />
                        Add stop
                      </button>
                    )}
                  </div>

                  <div className="max-h-[min(620px,65vh)] overflow-y-auto px-3 py-3">
                    {isEditMode && isLoadingOptions && (
                      <div className="mb-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500 dark:bg-zinc-800/60">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading orders, collections, pickups, and clients for {draftMission?.date}...
                      </div>
                    )}

                    {displayStops.length === 0 ? (
                      <p className="py-8 text-center text-xs text-zinc-500">No stops on this mission.</p>
                    ) : (
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {displayStops.map((stop, index) => {
                            const key = getStopKey(stop, index)
                            return (
                              <StopListCard
                                key={key}
                                stop={stop}
                                index={index}
                                isLast={index === displayStops.length - 1}
                                selected={selectedStopKey === key}
                                onSelect={() => setSelectedStopKey(key)}
                                isEditMode={isEditMode}
                                options={builderOptions}
                                depotOrigin={depotOrigin}
                                onMove={moveStop}
                                onRemove={removeStop}
                              />
                            )
                          })}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:col-span-1">
                {selectedStop ? (
                  <StopDetailPanel
                    stop={selectedStop}
                    index={selectedStopIndex}
                    isEditMode={isEditMode}
                    options={builderOptions}
                    depotOrigin={depotOrigin}
                    usedDeliveryOrders={usedDeliveryOrders}
                    onClose={() => setSelectedStopKey(null)}
                    onChange={(patch) => updateDraftStop(selectedStopIndex, patch)}
                  />
                ) : (
                  <>
                    <h2 className="px-0.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                      Mission details
                    </h2>
                    <div className="space-y-2 rounded-xl bg-zinc-50/50 p-2 dark:bg-cc-surface/50">
                      <CompactKpi
                        icon={User}
                        label="Livreur"
                        value={
                          isEditMode
                            ? (builderOptions.livreurs || availableLivreurs).find(
                                (livreur) => livreur.id === draftMission?.livreurId,
                              )?.full_name || 'Select livreur'
                            : mission.livreur?.full_name || 'â€”'
                        }
                        hint={
                          mission.livreur?.phone ? (
                            <a
                              href={`tel:${mission.livreur.phone}`}
                              className="inline-flex items-center gap-1 hover:text-distrac-primary"
                            >
                              <Phone className="h-3 w-3" />
                              {mission.livreur.phone}
                            </a>
                          ) : null
                        }
                      />
                      <CompactKpi icon={Building2} label="Depot" value={mission.depot?.depot_name || 'â€”'} />
                      <CompactKpi
                        icon={Calendar}
                        label="Date"
                        value={isEditMode ? draftMission?.date || 'â€”' : mission.date}
                      />
                      <CompactKpi
                        icon={Route}
                        label="Load"
                        value={`${metrics.total_quantity ?? 0} units · ${displayStops.length} stops`}
                      />
                      <CompactKpi
                        icon={Truck}
                        label="Distance"
                        value={metrics.distance_km != null ? `~${metrics.distance_km} km` : 'â€”'}
                      />
                      <CompactKpi
                        icon={Clock}
                        label="Created"
                        value={mission.created_at ? new Date(mission.created_at).toLocaleString() : 'â€”'}
                      />
                      <CompactKpi
                        icon={Clock}
                        label="Updated"
                        value={mission.updated_at ? new Date(mission.updated_at).toLocaleString() : 'â€”'}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AnimatedPage>
  )
}
