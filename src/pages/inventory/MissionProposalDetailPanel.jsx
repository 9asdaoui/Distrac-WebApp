import React, { useEffect, useMemo, useState } from 'react'
import {
  X,
  ChevronUp,
  ChevronDown,
  Trash2,
  Plus,
  Save,
  CheckCircle2,
  Loader2,
  GripVertical,
} from 'lucide-react'
import { motion } from 'framer-motion'
import apiInstance from '../../api/axiosInstance'

const STOP_TYPE_LABELS = {
  PICKUP: 'Pickup',
  DELIVERY: 'Delivery',
  COLLECTION: 'Collection',
  CUSTOM: 'Custom',
}

function stopTitle(stop) {
  const details = stop.entity_details || {}
  if (stop.stop_type === 'DELIVERY') {
    return `${stop.location?.name || 'Client'} — Order ${details.order_id || stop.entity_id}`
  }
  if (stop.stop_type === 'COLLECTION') {
    return `${stop.location?.name || 'Client'} — ${Number(details.amount_due || 0).toLocaleString()} MAD`
  }
  if (stop.stop_type === 'PICKUP') {
    return stop.location?.name || details.fulfillment_order_id || 'Industry pickup'
  }
  return stop.custom_description || stop.entity_id
}

function stopsToPayload(stops) {
  return stops.map((stop, index) => ({
    stopType: stop.stop_type,
    entityId: stop.entity_id,
    sequenceNumber: index + 1,
    customDescription: stop.custom_description || null,
    metadata: stop.metadata || {},
  }))
}

export function MissionProposalDetailPanel({
  missionId,
  depotId,
  targetDate,
  onClose,
  onSaved,
  onApproved,
}) {
  const [mission, setMission] = useState(null)
  const [livreurs, setLivreurs] = useState([])
  const [livreurId, setLivreurId] = useState('')
  const [stops, setStops] = useState([])
  const [availableOrders, setAvailableOrders] = useState([])
  const [orderToAdd, setOrderToAdd] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [error, setError] = useState('')

  const deliveryEntityIds = useMemo(
    () => new Set(stops.filter((s) => s.stop_type === 'DELIVERY').map((s) => String(s.entity_id))),
    [stops],
  )

  const loadMission = async () => {
    setIsLoading(true)
    setError('')
    try {
      const [missionRes, ordersRes] = await Promise.all([
        apiInstance.get(`/missions/${missionId}`),
        apiInstance.get('/orders', {
          params: { depotId, fromDate: targetDate, toDate: targetDate, limit: 200 },
        }),
      ])
      const payload = missionRes.data?.data || {}
      const loaded = payload.mission
      setMission(loaded)
      setLivreurs(payload.availableLivreurs || [])
      setLivreurId(loaded?.livreur_id || '')
      setStops([...(loaded?.stops || [])].sort((a, b) => a.sequence_number - b.sequence_number))

      const orders = ordersRes.data?.data?.orders || ordersRes.data?.data?.items || []
      setAvailableOrders(orders)
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load mission details.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadMission()
  }, [missionId])

  const addableOrders = useMemo(
    () =>
      availableOrders.filter((order) => {
        const key = String(order.order_number || order.order_id || order.id)
        return key && !deliveryEntityIds.has(key)
      }),
    [availableOrders, deliveryEntityIds],
  )

  const moveStop = (index, direction) => {
    const next = [...stops]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setStops(next.map((stop, i) => ({ ...stop, sequence_number: i + 1 })))
  }

  const removeStop = (index) => {
    setStops((prev) => prev.filter((_, i) => i !== index).map((stop, i) => ({ ...stop, sequence_number: i + 1 })))
  }

  const addDeliveryStop = () => {
    if (!orderToAdd) return
    const order = addableOrders.find(
      (row) => String(row.order_number || row.order_id) === String(orderToAdd),
    )
    if (!order) return

    const orderKey = String(order.order_number || order.order_id)
    setStops((prev) => [
      ...prev,
      {
        id: `draft-${orderKey}`,
        stop_type: 'DELIVERY',
        entity_id: orderKey,
        sequence_number: prev.length + 1,
        status: 'PENDING',
        entity_details: {
          order_id: orderKey,
          client_id: order.client_id,
          order_total: order.total_amount,
          payment_method: order.payment_method,
        },
        location: {
          name: order.client_name || order.client?.client_name || null,
          address: order.client_address || null,
        },
      },
    ])
    setOrderToAdd('')
  }

  const persistMission = async () => {
    const res = await apiInstance.patch(`/missions/${missionId}`, {
      livreurId,
      stops: stopsToPayload(stops),
    })
    const updated = res.data?.data?.mission
    setMission(updated)
    setStops([...(updated?.stops || [])])
    onSaved?.(updated)
    return updated
  }

  const saveMission = async () => {
    setIsSaving(true)
    setError('')
    try {
      await persistMission()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to save mission.')
    } finally {
      setIsSaving(false)
    }
  }

  const approveMission = async () => {
    setIsApproving(true)
    setError('')
    try {
      await persistMission()
      await apiInstance.post(`/missions/${missionId}/approve`)
      onApproved?.()
      onClose()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to approve mission.')
    } finally {
      setIsApproving(false)
    }
  }

  return (
    <motion.div
      className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="flex items-start justify-between border-b border-gray-200 p-6 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Mission details</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {mission?.depot?.depot_name || 'Depot'} • {mission?.date || targetDate}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-zinc-800" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Livreur</label>
              <select
                value={livreurId}
                onChange={(e) => setLivreurId(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-cc-surface dark:text-zinc-100"
              >
                {livreurs.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Stops ({stops.length})
                </h3>
                <span className="text-xs text-zinc-500">
                  Reorder, remove, or add deliveries before approving
                </span>
              </div>

              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div
                    key={stop.id || `${stop.stop_type}-${stop.entity_id}-${index}`}
                    className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-zinc-800 dark:bg-cc-surface"
                  >
                    <GripVertical className="h-4 w-4 shrink-0 text-zinc-400" />
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold dark:bg-zinc-800">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        {STOP_TYPE_LABELS[stop.stop_type] || stop.stop_type}
                      </p>
                      <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {stopTitle(stop)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => moveStop(index, -1)}
                        disabled={index === 0}
                        className="rounded p-1 text-zinc-500 hover:bg-white disabled:opacity-30 dark:hover:bg-zinc-800"
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStop(index, 1)}
                        disabled={index === stops.length - 1}
                        className="rounded p-1 text-zinc-500 hover:bg-white disabled:opacity-30 dark:hover:bg-zinc-800"
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeStop(index)}
                        className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Remove stop"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {stops.length === 0 && (
                  <p className="py-6 text-center text-sm text-zinc-500">No stops — add deliveries below.</p>
                )}
              </div>
            </div>

            {mission?.mission_type === 'DELIVERY_ROUTE' && (
              <div className="rounded-xl border border-dashed border-gray-300 p-4 dark:border-zinc-700">
                <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Add delivery stop</p>
                <div className="flex gap-2">
                  <select
                    value={orderToAdd}
                    onChange={(e) => setOrderToAdd(e.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-cc-surface"
                  >
                    <option value="">Select order…</option>
                    {addableOrders.map((order) => {
                      const key = String(order.order_number || order.order_id)
                      return (
                        <option key={key} value={key}>
                          {key} — {order.client?.name || 'Client'}
                        </option>
                      )
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={addDeliveryStop}
                    disabled={!orderToAdd}
                    className="inline-flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!isLoading && mission?.status === 'PROPOSED' && (
        <div className="flex gap-3 border-t border-gray-200 p-6 dark:border-zinc-800">
          <button
            type="button"
            onClick={saveMission}
            disabled={isSaving || isApproving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </button>
          <button
            type="button"
            onClick={approveMission}
            disabled={isSaving || isApproving || stops.length === 0}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isApproving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Approve mission
          </button>
        </div>
      )}
    </motion.div>
  )
}
