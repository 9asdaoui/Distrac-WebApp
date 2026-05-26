import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2 } from 'lucide-react'
import { SmoothSlideOver } from '../../components/SmoothSlideOver'
import apiInstance from '../../api/axiosInstance'

function addDaysIso(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

const STOP_TYPES = [
  { value: 'DELIVERY', label: 'Delivery (order)' },
  { value: 'COLLECTION', label: 'Collection (ledger)' },
  { value: 'PICKUP', label: 'Industry pickup' },
  { value: 'CUSTOM', label: 'Custom task' },
]

function emptyStop() {
  return {
    key: `${Date.now()}-${Math.random()}`,
    stopType: 'DELIVERY',
    entityId: '',
    customDescription: '',
    customTarget: 'depot',
    customClientId: '',
  }
}

function stopLabel(stop, options) {
  if (stop.stopType === 'DELIVERY') {
    const order = options.orders?.find((o) => o.orderNumber === stop.entityId)
    return order ? `${order.orderNumber} — ${order.clientName || 'Client'}` : stop.entityId || 'Select order'
  }
  if (stop.stopType === 'COLLECTION') {
    const row = options.collections?.find((c) => c.ledgerId === stop.entityId)
    return row ? `${row.clientName || 'Client'} — ${row.amountDue} MAD` : stop.entityId || 'Select collection'
  }
  if (stop.stopType === 'PICKUP') {
    const row = options.pickups?.find((p) => p.fulfillmentOrderId === stop.entityId)
    return row ? `${row.industryName || 'Industry'} (${row.fulfillmentOrderId.slice(0, 8)}…)` : stop.entityId || 'Select pickup'
  }
  return stop.customDescription || 'Custom stop'
}

export function CreateMissionSlideOver({ isOpen, onClose, depots, onCreated }) {
  const [depotId, setDepotId] = useState('')
  const [missionDate, setMissionDate] = useState(addDaysIso(1))
  const [livreurId, setLivreurId] = useState('')
  const [missionType, setMissionType] = useState('DELIVERY_ROUTE')
  const [status, setStatus] = useState('PROPOSED')
  const [stops, setStops] = useState([emptyStop()])
  const [options, setOptions] = useState({ livreurs: [], orders: [], collections: [], pickups: [], clients: [] })
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!depotId && depots.length > 0) {
      setDepotId(depots[0].id)
    }
  }, [depots, depotId])

  useEffect(() => {
    if (!isOpen || !depotId || !missionDate) return
    let cancelled = false
    const load = async () => {
      setIsLoadingOptions(true)
      setError('')
      try {
        const res = await apiInstance.get('/missions/builder-options', {
          params: { depotId, date: missionDate },
        })
        if (!cancelled) {
          const data = res.data?.data || {}
          setOptions(data)
          if (!livreurId && data.livreurs?.length > 0) {
            setLivreurId(data.livreurs[0].id)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.message || 'Failed to load mission options.')
        }
      } finally {
        if (!cancelled) setIsLoadingOptions(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isOpen, depotId, missionDate])

  const usedDeliveryOrders = useMemo(
    () => new Set(stops.filter((s) => s.stopType === 'DELIVERY').map((s) => s.entityId)),
    [stops],
  )

  const moveStop = (index, direction) => {
    const next = [...stops]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setStops(next)
  }

  const updateStop = (index, patch) => {
    setStops((prev) => prev.map((stop, i) => (i === index ? { ...stop, ...patch } : stop)))
  }

  const removeStop = (index) => {
    setStops((prev) => prev.filter((_, i) => i !== index))
  }

  const addStop = () => {
    setStops((prev) => [...prev, emptyStop()])
  }

  const resolveStopPayload = (stop) => {
    if (stop.stopType === 'CUSTOM') {
      const entityId = stop.customTarget === 'client' ? stop.customClientId : depotId
      return {
        stopType: 'CUSTOM',
        entityId: String(entityId),
        customDescription: stop.customDescription.trim(),
        metadata: {
          entity_type: stop.customTarget === 'client' ? 'CLIENT' : 'DEPOT',
        },
      }
    }
    return {
      stopType: stop.stopType,
      entityId: String(stop.entityId),
      customDescription: null,
      metadata: {},
    }
  }

  const handleSubmit = async () => {
    if (!depotId || !livreurId) {
      setError('Depot and livreur are required.')
      return
    }
    if (stops.length === 0) {
      setError('Add at least one stop.')
      return
    }

    for (const stop of stops) {
      if (stop.stopType === 'CUSTOM') {
        if (!stop.customDescription.trim()) {
          setError('Each custom stop needs a description.')
          return
        }
        if (stop.customTarget === 'client' && !stop.customClientId) {
          setError('Select a client for the custom stop.')
          return
        }
      } else if (!stop.entityId) {
        setError('Each stop must have a selected entity.')
        return
      }
    }

    setIsSubmitting(true)
    setError('')
    try {
      const payloadStops = stops.map((stop, index) => {
        const resolved = resolveStopPayload(stop)
        return {
          ...resolved,
          sequenceNumber: index + 1,
        }
      })

      await apiInstance.post('/missions/custom', {
        depotId,
        livreurId,
        date: missionDate,
        missionType,
        status,
        stops: payloadStops,
      })

      onCreated?.()
      onClose()
      setStops([emptyStop()])
      setStatus('PROPOSED')
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to create mission.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SmoothSlideOver
      isOpen={isOpen}
      onClose={onClose}
      title="Create custom mission"
      description="Build a mission manually: assign a livreur, add delivery, collection, pickup, or custom stops."
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingOptions}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Create mission
          </button>
        </div>
      }
    >
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Depot</label>
          <select
            value={depotId}
            onChange={(e) => setDepotId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {depots.map((d) => (
              <option key={d.id} value={d.id}>{d.depot_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mission date</label>
          <input
            type="date"
            value={missionDate}
            onChange={(e) => setMissionDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Livreur</label>
          <select
            value={livreurId}
            onChange={(e) => setLivreurId(e.target.value)}
            disabled={isLoadingOptions}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select livreur…</option>
            {(options.livreurs || []).map((l) => (
              <option key={l.id} value={l.id}>{l.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Mission type</label>
          <select
            value={missionType}
            onChange={(e) => setMissionType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="DELIVERY_ROUTE">Delivery route (mixed stops)</option>
            <option value="INDUSTRY_PICKUP">Industry pickup only</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Initial status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="PROPOSED">PROPOSED (review in proposals tab)</option>
            <option value="APPROVED">APPROVED (livreur sees it immediately)</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Stops ({stops.length})</h3>
        <button
          type="button"
          onClick={addStop}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          <Plus className="h-3.5 w-3.5" />
          Add stop
        </button>
      </div>

      {isLoadingOptions ? (
        <p className="text-sm text-zinc-500">Loading orders, collections, and pickups…</p>
      ) : (
        <div className="space-y-3">
          {stops.map((stop, index) => (
            <div
              key={stop.key}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-zinc-500">#{index + 1}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => moveStop(index, -1)} disabled={index === 0} className="rounded p-1 text-zinc-500 disabled:opacity-30">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => moveStop(index, 1)} disabled={index === stops.length - 1} className="rounded p-1 text-zinc-500 disabled:opacity-30">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeStop(index)} className="rounded p-1 text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <select
                value={stop.stopType}
                onChange={(e) => updateStop(index, { stopType: e.target.value, entityId: '', customDescription: '' })}
                className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              >
                {STOP_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>

              {stop.stopType === 'DELIVERY' && (
                <select
                  value={stop.entityId}
                  onChange={(e) => updateStop(index, { entityId: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                >
                  <option value="">Select order for {missionDate}…</option>
                  {(options.orders || [])
                    .filter((o) => !usedDeliveryOrders.has(o.orderNumber) || o.orderNumber === stop.entityId)
                    .map((o) => (
                      <option key={o.orderNumber} value={o.orderNumber}>
                        {o.orderNumber} — {o.clientName} ({o.totalAmount} MAD)
                      </option>
                    ))}
                </select>
              )}

              {stop.stopType === 'COLLECTION' && (
                <>
                  <select
                    value={stop.entityId}
                    onChange={(e) => updateStop(index, { entityId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="">Select collection…</option>
                    {(options.collections || []).map((c) => (
                      <option key={c.ledgerId} value={c.ledgerId}>
                        {c.clientName || 'Client'} — {c.amountDue} MAD (due {c.dueDate})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={stop.entityId}
                    onChange={(e) => updateStop(index, { entityId: e.target.value })}
                    placeholder="Or paste ledger UUID"
                    className="mt-2 w-full rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </>
              )}

              {stop.stopType === 'PICKUP' && (
                <>
                  <select
                    value={stop.entityId}
                    onChange={(e) => updateStop(index, { entityId: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="">Select ready pickup…</option>
                    {(options.pickups || []).map((p) => (
                      <option key={p.fulfillmentOrderId} value={p.fulfillmentOrderId}>
                        {p.industryName || 'Industry'} — {p.status}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={stop.entityId}
                    onChange={(e) => updateStop(index, { entityId: e.target.value })}
                    placeholder="Or paste fulfillment order UUID"
                    className="mt-2 w-full rounded-lg border border-dashed border-gray-300 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                  />
                </>
              )}

              {stop.stopType === 'CUSTOM' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={stop.customDescription}
                    onChange={(e) => updateStop(index, { customDescription: e.target.value })}
                    placeholder="Task description (required)"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  />
                  <select
                    value={stop.customTarget}
                    onChange={(e) => updateStop(index, { customTarget: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="depot">At depot</option>
                    <option value="client">At client</option>
                  </select>
                  {stop.customTarget === 'client' && (
                    <select
                      value={stop.customClientId}
                      onChange={(e) => updateStop(index, { customClientId: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="">Select client…</option>
                      {(options.clients || []).map((c) => (
                        <option key={c.id} value={c.id}>{c.clientName}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <p className="mt-2 truncate text-xs text-zinc-500">{stopLabel(stop, options)}</p>
            </div>
          ))}
        </div>
      )}
    </SmoothSlideOver>
  )
}
