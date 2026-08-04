import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CreditCard } from 'lucide-react'
import apiInstance from '../../api/axiosInstance'
import { DepotCcPageShell } from '../../components/dashboard/depotOps/DepotCcPageShell'
import { useCcNavigation } from '../../hooks/useCcNavigation'
import { usePanelEmbed } from '../../components/map/CcPanelHost'

const REJECTION_REASONS = [
  { value: 'BLURRY', label: 'Blurry image' },
  { value: 'WRONG_AMOUNT', label: 'Wrong amount' },
  { value: 'POST_DATED', label: 'Post-dated' },
  { value: 'NOT_PAYABLE', label: 'Not payable' },
  { value: 'OTHER', label: 'Other' },
]

/**
 * Dedicated check-review detail (W-CC17 Option B / W-L55 detail path).
 */
export function CheckReviewDetailPage() {
  const { id } = useParams()
  const embedded = usePanelEmbed()
  const { clearPanel } = useCcNavigation()
  const [row, setRow] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('BLURRY')
  const [rejectionNote, setRejectionNote] = useState('')

  const load = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await apiInstance.get('/depot/check-reviews', {
        params: { status: 'PENDING' },
      })
      const list = res.data?.data?.checkReviews || []
      const found = list.find((item) => String(item.id) === String(id)) || null
      setRow(found)
      if (!found) setError('Check review not found or no longer pending.')
    } catch (e) {
      setRow(null)
      setError(e?.response?.data?.message || 'Failed to load check review.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const decide = async (approved) => {
    if (!row?.id) return
    setBusy(true)
    setError('')
    try {
      const body = approved
        ? { approved: true }
        : {
            approved: false,
            rejectionReason,
            rejectionNote: rejectionNote || undefined,
          }
      await apiInstance.patch(`/depot/check-reviews/${row.id}`, body)
      if (embedded) clearPanel()
    } catch (e) {
      setError(e?.response?.data?.message || `Failed to ${approved ? 'approve' : 'reject'} check.`)
    } finally {
      setBusy(false)
    }
  }

  const imageUrl = row?.checkImageUrl || row?.checkImageUrls?.[0]

  return (
    <DepotCcPageShell
      title="Check review"
      subtitle={row ? `CR-${String(row.id).slice(0, 8).toUpperCase()}` : 'Pending check approval'}
      icon={CreditCard}
    >
      <div className="space-y-4 p-4">
        {isLoading ? (
          <p className="text-sm text-cc-tertiary">Loading check review…</p>
        ) : error && !row ? (
          <p className="text-sm text-cc-error">{error}</p>
        ) : row ? (
          <>
            <div className="rounded-xl border border-cc-border bg-cc-surface p-4 space-y-2 text-sm text-cc-secondary">
              <p>
                <span className="font-medium text-cc-primary">Client:</span>{' '}
                {row.clientName || '—'}
              </p>
              <p>
                <span className="font-medium text-cc-primary">Order:</span>{' '}
                {row.orderNumber || String(row.orderId || '').slice(0, 8) || '—'}
              </p>
              <p>
                <span className="font-medium text-cc-primary">Amount:</span>{' '}
                {Number(row.amount || 0).toLocaleString()} MAD
              </p>
              <p>
                <span className="font-medium text-cc-primary">Attempt:</span>{' '}
                {row.attemptNumber || 1}
              </p>
            </div>

            {imageUrl ? (
              <a
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-xl border border-cc-border"
              >
                <img src={imageUrl} alt="Check" className="max-h-64 w-full object-contain bg-cc-bg" />
              </a>
            ) : (
              <p className="text-sm text-cc-tertiary">No check image available.</p>
            )}

            <div className="space-y-2 rounded-xl border border-cc-border bg-cc-surface p-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-cc-tertiary">
                Reject reason
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full rounded-cc-control border border-cc-border bg-cc-bg px-3 py-2 text-sm text-cc-primary"
              >
                {REJECTION_REASONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Optional note"
                className="w-full rounded-cc-control border border-cc-border bg-cc-bg px-3 py-2 text-sm text-cc-primary"
              />
            </div>

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

export default CheckReviewDetailPage
