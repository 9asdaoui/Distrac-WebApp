import React from 'react'

/**
 * Shared CUSTOM stop editor fields for mission create/edit.
 */
export function emptyCustomStopFields() {
  return {
    customDescription: '',
    templateKey: '',
    arriveMethod: 'none',
    scanTarget: 'depot',
    requireImage: false,
    requireNote: false,
    customClientId: '',
    customIndustryId: '',
    customTarget: 'depot',
  }
}

export function applyTemplateToStop(stop, template) {
  if (!template) {
    return {
      ...stop,
      templateKey: '',
    }
  }
  const arrive = template.config?.arrive || {}
  const complete = template.config?.complete || {}
  const method = arrive.method || 'none'
  const scanTarget = arrive.scan_target || arrive.scanTarget || 'depot'
  return {
    ...stop,
    templateKey: template.key,
    customDescription: stop.customDescription || template.label || '',
    arriveMethod: method,
    scanTarget,
    requireImage: Boolean(complete.require_image ?? complete.requireImage),
    requireNote: Boolean(complete.require_note ?? complete.requireNote),
    customTarget: scanTarget === 'client' ? 'client' : 'depot',
  }
}

export function buildCustomStopPayload(stop, depotId) {
  const arriveMethod = stop.arriveMethod || 'none'
  const scanTarget = stop.scanTarget || 'depot'
  let entityId = depotId
  let entityType = 'DEPOT'

  if (arriveMethod === 'scan') {
    if (scanTarget === 'client') {
      entityId = stop.customClientId
      entityType = 'CLIENT'
    } else if (scanTarget === 'industry') {
      entityId = stop.customIndustryId
      entityType = 'INDUSTRY'
    } else {
      entityId = depotId
      entityType = 'DEPOT'
    }
  } else if (stop.customTarget === 'client' && stop.customClientId) {
    entityId = stop.customClientId
    entityType = 'CLIENT'
  }

  const validation = {
    arrive:
      arriveMethod === 'scan'
        ? { method: 'scan', scan_target: scanTarget }
        : { method: 'none' },
    complete: {
      require_image: Boolean(stop.requireImage),
      require_note: Boolean(stop.requireNote),
    },
  }

  return {
    stopType: 'CUSTOM',
    entityId: String(entityId || depotId || ''),
    customDescription: String(stop.customDescription || '').trim(),
    templateKey: stop.templateKey || undefined,
    validation,
    metadata: { entity_type: entityType },
  }
}

export function validateCustomStopDraft(stop) {
  if (!String(stop.customDescription || '').trim()) {
    return 'Each custom stop needs a description.'
  }
  if (stop.arriveMethod === 'scan') {
    if (stop.scanTarget === 'client' && !stop.customClientId) {
      return 'Select a client for the custom stop scan target.'
    }
    if (stop.scanTarget === 'industry' && !stop.customIndustryId) {
      return 'Select an industry for the custom stop scan target.'
    }
  }
  return null
}

export function CustomStopEditorFields({
  stop,
  onChange,
  templates = [],
  clients = [],
  industries = [],
  inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950',
}) {
  const update = (patch) => onChange(patch)

  return (
    <div className="space-y-2">
      <select
        value={stop.templateKey || ''}
        onChange={(e) => {
          const key = e.target.value
          const tpl = templates.find((t) => t.key === key)
          if (tpl) update(applyTemplateToStop(stop, tpl))
          else update({ templateKey: '' })
        }}
        className={inputClass}
      >
        <option value="">Template (optional)…</option>
        {templates.map((tpl) => (
          <option key={tpl.id || tpl.key} value={tpl.key}>
            {tpl.label} ({tpl.key})
          </option>
        ))}
      </select>

      <input
        type="text"
        value={stop.customDescription || ''}
        onChange={(e) => update({ customDescription: e.target.value })}
        placeholder="Task description (required)"
        className={inputClass}
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={stop.arriveMethod || 'none'}
          onChange={(e) => update({ arriveMethod: e.target.value })}
          className={inputClass}
        >
          <option value="none">Arrive: no scan</option>
          <option value="scan">Arrive: require scan</option>
        </select>
        {stop.arriveMethod === 'scan' ? (
          <select
            value={stop.scanTarget || 'depot'}
            onChange={(e) =>
              update({
                scanTarget: e.target.value,
                customTarget: e.target.value === 'client' ? 'client' : 'depot',
              })
            }
            className={inputClass}
          >
            <option value="depot">Scan depot QR</option>
            <option value="client">Scan client QR</option>
            <option value="industry">Scan industry QR</option>
          </select>
        ) : (
          <div />
        )}
      </div>

      {stop.arriveMethod === 'scan' && stop.scanTarget === 'client' && (
        <select
          value={stop.customClientId || ''}
          onChange={(e) => update({ customClientId: e.target.value })}
          className={inputClass}
        >
          <option value="">Select client…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.clientName || c.client_name || c.id}
            </option>
          ))}
        </select>
      )}

      {stop.arriveMethod === 'scan' && stop.scanTarget === 'industry' && (
        <select
          value={stop.customIndustryId || ''}
          onChange={(e) => update({ customIndustryId: e.target.value })}
          className={inputClass}
        >
          <option value="">Select industry…</option>
          {industries.map((row) => (
            <option key={row.id} value={row.id}>
              {row.industry_name || row.industryName || row.name || row.id}
            </option>
          ))}
        </select>
      )}

      <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={Boolean(stop.requireImage)}
          onChange={(e) => update({ requireImage: e.target.checked })}
        />
        Require proof image on complete
      </label>
      <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={Boolean(stop.requireNote)}
          onChange={(e) => update({ requireNote: e.target.checked })}
        />
        Require note on complete
      </label>
    </div>
  )
}
