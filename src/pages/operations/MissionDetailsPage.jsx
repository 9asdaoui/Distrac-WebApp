import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronDown,
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
import { MissionRouteMap } from '../../components/MissionRouteMap'
import apiInstance from '../../api/axiosInstance'

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

function CompactKpi({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50/80 px-3 py-2 dark:bg-zinc-800/50">
      <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
      </div>
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

function getDraftStopBase(depotId) {
  return {
    key: `${Date.now()}-${Math.random()}`,
    id: null,
    stopType: 'DELIVERY',
    entityId: '',
    customDescription: '',
    customTarget: 'depot',
    customClientId: '',
    metadata: {},
    location: null,
    entity_details: {},
    line_items: [],
    completed_at: null,
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
    return {
      key: stop.id || `existing-${index}`,
      id: stop.id,
      stopType: stop.stop_type,
      entityId: String(stop.entity_id || ''),
      customDescription: stop.custom_description || '',
      customTarget: isClientCustom ? 'client' : 'depot',
      customClientId: isClientCustom ? String(stop.entity_id || '') : '',
      metadata: { ...(stop.metadata || {}) },
      location: stop.location || null,
      entity_details: stop.entity_details || {},
      line_items: stop.line_items || [],
      completed_at: stop.completed_at,
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
    if (stop.customTarget === 'client') {
      const client = (options.clients || []).find((row) => row.id === stop.customClientId)
      if (!client) {
        return {
          ...stop,
          entityId: stop.customClientId || stop.entityId,
          metadata: { entity_type: 'CLIENT' },
        }
      }
      return {
        ...stop,
        entityId: client.id,
        metadata: { entity_type: 'CLIENT' },
        location: buildLocation(client.address, client.city, client.gpsLatitude, client.gpsLongitude, client.clientName),
        entity_details: {
          client_id: client.id,
          client_name: client.clientName,
          client_phone: client.phone,
        },
      }
    }

    return {
      ...stop,
      entityId: stop.depotId || stop.entityId,
      metadata: { entity_type: 'DEPOT' },
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
    const isClientTarget = stop.customTarget === 'client'
    return {
      stopType: 'CUSTOM',
      entityId: String(isClientTarget ? stop.customClientId : depotId),
      sequenceNumber: index + 1,
      customDescription: stop.customDescription.trim(),
      metadata: {
        entity_type: isClientTarget ? 'CLIENT' : 'DEPOT',
      },
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

function DraftStopEditor({
  stop,
  index,
  isLast,
  options,
  depotOrigin,
  usedDeliveryOrders,
  onMove,
  onRemove,
  onChange,
}) {
  const currentDeliveryLabel = stop.entityId && !(options.orders || []).some((row) => row.orderNumber === stop.entityId)
  const currentCollectionLabel = stop.entityId && !(options.collections || []).some((row) => row.ledgerId === stop.entityId)
  const currentPickupLabel = stop.entityId && !(options.pickups || []).some((row) => row.fulfillmentOrderId === stop.entityId)
  const currentClientLabel = stop.customClientId && !(options.clients || []).some((row) => row.id === stop.customClientId)

  const update = (patch) => onChange(index, patch)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className="rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900/90"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Stop #{index + 1}</span>
        <div className="flex gap-1">
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
      </div>

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
          <>
            <input
              type="text"
              value={stop.customDescription}
              onChange={(e) => update({ customDescription: e.target.value })}
              placeholder="Describe the custom task..."
              className={inputClass}
            />
            <select
              value={stop.customTarget}
              onChange={(e) => update({ customTarget: e.target.value, customClientId: '', entityId: '' })}
              className={inputClass}
            >
              <option value="depot">At depot</option>
              <option value="client">At client</option>
            </select>
            {stop.customTarget === 'client' && (
              <select
                value={stop.customClientId}
                onChange={(e) => update({ customClientId: e.target.value })}
                className={inputClass}
              >
                <option value="">Select client...</option>
                {currentClientLabel && <option value={stop.customClientId}>{stop.customClientId} (current)</option>}
                {(options.clients || []).map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.clientName}
                  </option>
                ))}
              </select>
            )}
          </>
        )}
      </div>

      <p className="mt-3 text-xs text-zinc-500">{getStopLabel(stop, options, depotOrigin)}</p>
    </motion.div>
  )
}

function ReadOnlyStopCard({ stop, index, isLast }) {
  const stopType = stop.stop_type
  const details = stop.entity_details || {}
  const badgeCls = STOP_TYPE_BADGES[stopType] || STOP_TYPE_BADGES.CUSTOM
  const clientName = details.client_name || stop.location?.name
  const orderId = details.order_id || (stopType === 'DELIVERY' ? stop.entity_id : null)
  const productsLine = formatProductsCompact(stop.line_items)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="relative flex gap-3"
    >
      <div className="flex w-6 shrink-0 flex-col items-center">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          {index + 1}
        </div>
        {!isLast && <div className="mt-1 w-px flex-1 bg-zinc-200 dark:bg-zinc-700" />}
      </div>

      <div className="min-w-0 flex-1 rounded-lg border border-zinc-200/80 bg-white px-3 py-2.5 dark:border-zinc-700/80 dark:bg-zinc-900/80">
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${badgeCls}`}>{stopType}</span>
            {stop.completed_at ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Done
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400">
                <Clock className="h-3 w-3" /> Pending
              </span>
            )}
          </div>
        </div>

        {stopType === 'CUSTOM' ? (
          <p className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {stop.custom_description || 'Custom task'}
          </p>
        ) : stopType === 'DELIVERY' ? (
          <div className="mt-1.5 space-y-1">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{clientName || 'Client'}</p>
            {details.client_phone && (
              <p className="flex items-center gap-1 text-xs text-zinc-500">
                <Phone className="h-3 w-3 shrink-0" />
                <a href={`tel:${details.client_phone}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                  {details.client_phone}
                </a>
              </p>
            )}
            {orderId && (
              <Link
                to={`/orders/${encodeURIComponent(orderId)}`}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                Order #{orderId}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {productsLine && (
              <p className="flex items-start gap-1 text-xs text-zinc-600 dark:text-zinc-400">
                <Package className="mt-0.5 h-3 w-3 shrink-0 text-zinc-400" />
                <span>{productsLine}</span>
              </p>
            )}
          </div>
        ) : stopType === 'COLLECTION' ? (
          <div className="mt-1.5 space-y-0.5">
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{clientName || 'Client'}</p>
            {details.client_phone && (
              <p className="flex items-center gap-1 text-xs text-zinc-500">
                <Phone className="h-3 w-3" />
                {details.client_phone}
              </p>
            )}
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Collect {Number(details.amount_due || 0).toLocaleString()} MAD
            </p>
          </div>
        ) : (
          <p className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {stop.location?.name || details.industry_name || 'Stop'}
          </p>
        )}

        {stop.location?.address && stopType !== 'CUSTOM' && (
          <p className="mt-1 flex items-start gap-1 text-[11px] text-zinc-500">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="line-clamp-2">{stop.location.address}</span>
          </p>
        )}
      </div>
    </motion.div>
  )
}

export function MissionDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
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
        const res = await apiInstance.get('/missions/builder-options', {
          params: {
            depotId: draftMission.depotId,
            date: draftMission.date,
          },
        })
        if (cancelled) return
        const data = res.data?.data || {}
        setBuilderOptions({
          depot: data.depot || null,
          date: data.date || draftMission.date,
          livreurs: data.livreurs || [],
          orders: data.orders || [],
          collections: data.collections || [],
          pickups: data.pickups || [],
          clients: data.clients || [],
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

  const usedDeliveryOrders = useMemo(
    () => new Set(draftStops.filter((stop) => stop.stopType === 'DELIVERY' && stop.entityId).map((stop) => stop.entityId)),
    [draftStops],
  )

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
      return next
    })
  }

  const removeStop = (index) => {
    setDraftStops((prev) => prev.filter((_, i) => i !== index))
  }

  const addStop = () => {
    setDraftStops((prev) => [...prev, getDraftStopBase(draftMission?.depotId || mission?.depot_id)])
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
        if (!String(stop.customDescription || '').trim()) {
          setError('Each custom stop needs a description.')
          return
        }
        if (stop.customTarget === 'client' && !stop.customClientId) {
          setError('Select a client for each custom client stop.')
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
      navigate('/missions')
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
        <Link
          to="/missions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Command center
        </Link>

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
                  ? 'border-blue-300 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/25'
                  : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900'
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
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
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
                        className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                      >
                        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Delete mission
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-600"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={savePlan}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
                    >
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
                          className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 disabled:opacity-50 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                        >
                          {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          Delete mission
                        </button>
                        <button
                          type="button"
                          onClick={enterEditMode}
                          className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                        >
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
                        className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
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
              <div className="flex flex-col gap-3 lg:col-span-1">
                <div className="space-y-2 rounded-xl bg-zinc-50/50 p-2 dark:bg-zinc-900/50">
                  {isEditMode ? (
                    <div className="space-y-2 rounded-lg border border-blue-200/60 bg-white/80 p-3 dark:border-blue-900/40 dark:bg-zinc-900/80">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
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
                        <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-zinc-500">
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

                  <CompactKpi
                    icon={User}
                    label="Livreur"
                    value={
                      isEditMode
                        ? (builderOptions.livreurs || availableLivreurs).find((livreur) => livreur.id === draftMission?.livreurId)
                            ?.full_name || 'Select livreur'
                        : mission.livreur?.full_name || '—'
                    }
                  />
                  <CompactKpi icon={Building2} label="Depot" value={mission.depot?.depot_name || '—'} />
                  <CompactKpi icon={Calendar} label="Date" value={isEditMode ? draftMission?.date || '—' : mission.date} />
                  <CompactKpi
                    icon={Route}
                    label="Load"
                    value={`${metrics.total_quantity ?? 0} units · ${displayStops.length} stops`}
                  />
                  <CompactKpi
                    icon={Truck}
                    label="Distance"
                    value={metrics.distance_km != null ? `~${metrics.distance_km} km` : '—'}
                  />
                </div>

                <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
                    <div>
                      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Task list</h2>
                      <p className="text-[10px] text-zinc-400">
                        {isEditMode
                          ? 'Edit mission info, change stop targets, add or remove stops, then save.'
                          : 'Sequential run sheet'}
                      </p>
                    </div>
                    {isEditMode && (
                      <button
                        type="button"
                        onClick={addStop}
                        className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-[11px] font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                      >
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
                          {displayStops.map((stop, index) =>
                            isEditMode ? (
                              <DraftStopEditor
                                key={stop.key || stop.id || `draft-${index}`}
                                stop={stop}
                                index={index}
                                isLast={index === displayStops.length - 1}
                                options={builderOptions}
                                depotOrigin={depotOrigin}
                                usedDeliveryOrders={usedDeliveryOrders}
                                onMove={moveStop}
                                onRemove={removeStop}
                                onChange={updateDraftStop}
                              />
                            ) : (
                              <ReadOnlyStopCard
                                key={stop.id || `stop-${index}`}
                                stop={stop}
                                index={index}
                                isLast={index === displayStops.length - 1}
                              />
                            ),
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:col-span-2">
                <div className="mb-2 flex items-center justify-between px-0.5">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Route map</h2>
                  <span className="text-[10px] text-zinc-400">
                    {depotOrigin?.lat != null ? 'Depot → stops' : 'Stops only (no depot GPS)'}
                  </span>
                </div>
                <MissionRouteMap stops={displayStops} depotOrigin={depotOrigin} compact />
              </div>
            </div>
          </>
        )}
      </div>
    </AnimatedPage>
  )
}
