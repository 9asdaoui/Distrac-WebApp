import React, { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, Loader2, ArrowLeft, X } from 'lucide-react'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import apiInstance from '../../api/axiosInstance'
import {
  CustomStopEditorFields,
  buildCustomStopPayload,
  emptyCustomStopFields,
  validateCustomStopDraft,
} from '../../components/missions/CustomStopEditorFields'

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
    ...emptyCustomStopFields(),
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

/**
 * Create custom mission.
 * - variant="overlay" (default): portal slide-over for standalone /missions page
 * - variant="inline": fills the Command Center missions rail (no full-app empty gap)
 */
export function CreateMissionSlideOver({
  isOpen,
  onClose,
  depots,
  onCreated,
  variant = 'overlay',
}) {
  const [depotId, setDepotId] = useState('')
  const [missionDate, setMissionDate] = useState(addDaysIso(1))
  const [livreurId, setLivreurId] = useState('')
  const [missionType, setMissionType] = useState('DELIVERY_ROUTE')
  const [status, setStatus] = useState('PROPOSED')
  const [stops, setStops] = useState([emptyStop()])
  const [options, setOptions] = useState({
    livreurs: [],
    orders: [],
    collections: [],
    pickups: [],
    clients: [],
    templates: [],
    industries: [],
  })
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
        const [builderRes, templatesRes, industriesRes] = await Promise.all([
          apiInstance.get('/missions/builder-options', {
            params: { depotId, date: missionDate },
          }),
          apiInstance.get('/missions/custom-stop-templates'),
          apiInstance.get('/industries').catch(() => ({ data: { data: [] } })),
        ])
        if (!cancelled) {
          const data = builderRes.data?.data || {}
          const industriesPayload = industriesRes.data?.data || {}
          const industries = Array.isArray(industriesPayload)
            ? industriesPayload
            : industriesPayload.industries || []
          setOptions({
            ...data,
            templates: templatesRes.data?.data?.templates || [],
            industries,
          })
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
      return buildCustomStopPayload(stop, depotId)
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

  const title = 'Create custom mission'
  const description =
    'Build a mission manually: assign a livreur, add delivery, collection, pickup, or custom stops.'

  const footer = (
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
  )

  const formBody = (
    <div className="space-y-6">
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
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-cc-surface"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-cc-surface"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">Livreur</label>
          <select
            value={livreurId}
            onChange={(e) => setLivreurId(e.target.value)}
            disabled={isLoadingOptions}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-cc-surface"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-cc-surface"
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
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-zinc-700 dark:bg-cc-surface"
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
              className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-800 dark:bg-cc-surface"
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
                <CustomStopEditorFields
                  stop={stop}
                  onChange={(patch) => updateStop(index, patch)}
                  templates={options.templates || []}
                  clients={options.clients || []}
                  industries={options.industries || []}
                />
              )}

              <p className="mt-2 truncate text-xs text-zinc-500">{stopLabel(stop, options)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  if (variant === 'inline') {
    if (!isOpen) return null
    return (
      <div className="flex h-full min-h-0 flex-col bg-cc-bg dark:bg-cc-bg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-zinc-800">
          <div className="min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-cc-tertiary dark:hover:text-cc-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to missions
            </button>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {formBody}
        </div>
        <div className="shrink-0 border-t border-gray-200 px-4 py-3 dark:border-zinc-800">
          {footer}
        </div>
      </div>
    )
  }

  return (
    <SlideOverPanel
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      footer={footer}
    >
      {formBody}
    </SlideOverPanel>
  )
}
