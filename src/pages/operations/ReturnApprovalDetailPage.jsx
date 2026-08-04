import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { RotateCcw } from 'lucide-react'
import apiInstance from '../../api/axiosInstance'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { useCcNavigation } from '../../hooks/useCcNavigation'
import { usePanelEmbed } from '../../components/map/CcPanelHost'

/**
 * Dedicated return approval detail (W-CC17 Option B).
 * Loads pending depot returns and resolves the requested id.
 */
export function ReturnApprovalDetailPage() {
  const { id } = useParams()
  const embedded = usePanelEmbed()
  const { openPanel, clearPanel } = useCcNavigation()
  const [row, setRow] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get('/returns', {
        params: { status: 'PENDING_DEPOT', limit: 100, page: 1 },
      })
      const list = res.data?.data?.returns || []
      const found = list.find((item) => String(item.id) === String(id)) || null
      setRow(found)
      if (!found) setError('Return not found or no longer pending depot approval.')
    } catch (e) {
      setRow(null)
      setError(e?.response?.data?.message || 'Failed to load return.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const lines = useMemo(() => {
    if (!row) return []
    if (Array.isArray(row.items) && row.items.length) return row.items
    if (Array.isArray(row.reasons)) {
      return row.reasons.flatMap((reason) => reason.items || [])
    }
    return []
  }, [row])

  const decide = async (approved) => {
    if (!row?.id) return
    setBusy(true)
    setError('')
    try {
      await apiInstance.post(`/returns/${row.id}/approve-depot`, {
        approved,
        rejectionReason: approved ? undefined : 'Rejected from Command Center',
      })
      if (embedded) clearPanel()
      else openPanel('exceptions')
    } catch (e) {
      setError(e?.response?.data?.message || `Failed to ${approved ? 'approve' : 'reject'} return.`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DepotCcPageShell
      title="Return approval"
      subtitle={row ? `RT-${String(row.id).slice(0, 8).toUpperCase()}` : 'Depot return review'}
      icon={RotateCcw}
    >
      <div className="space-y-4 p-4">
        {isLoading ? (
          <p className="text-sm text-cc-tertiary">Loading return…</p>
        ) : error && !row ? (
          <p className="text-sm text-cc-error">{error}</p>
        ) : row ? (
          <>
            <div className="rounded-xl border border-cc-border bg-cc-surface p-4 space-y-2 text-sm text-cc-secondary">
              <p>
                <span className="font-medium text-cc-primary">Client:</span>{' '}
                {row.client?.client_name || '—'}
              </p>
              <p>
                <span className="font-medium text-cc-primary">Status:</span> {row.status || '—'}
              </p>
              <p>
                <span className="font-medium text-cc-primary">Lines:</span> {lines.length}
              </p>
              {row.reason ? (
                <p>
                  <span className="font-medium text-cc-primary">Reason:</span> {row.reason}
                </p>
              ) : null}
            </div>

            {lines.length > 0 ? (
              <ul className="space-y-2 rounded-xl border border-cc-border bg-cc-surface p-3 text-sm">
                {lines.map((item) => (
                  <li
                    key={item.id || `${item.product_id}-${item.quantity}`}
                    className="flex justify-between gap-2 text-cc-secondary"
                  >
                    <span className="truncate text-cc-primary">
                      {item.product_name || item.product?.name || item.product_id || 'Item'}
                    </span>
                    <span className="shrink-0 tabular-nums">
                      ×{item.quantity ?? item.qty ?? '—'}
                      {item.disposition ? ` · ${item.disposition}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {error ? <p className="text-sm text-cc-error">{error}</p> : null}

            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(true)}
                className="flex-1 rounded-cc-control border border-cc-success/40 bg-cc-success/15 px-3 py-2.5 text-sm font-semibold text-cc-success-hover disabled:opacity-40"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => decide(false)}
                className="flex-1 rounded-cc-control border border-cc-error/40 bg-cc-error/15 px-3 py-2.5 text-sm font-semibold text-cc-error-hover disabled:opacity-40"
              >
                Reject
              </button>
            </div>
          </>
        ) : null}
      </div>
    </DepotCcPageShell>
  )
}

export default ReturnApprovalDetailPage
