import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { SlideOverPanel } from '../../components/SlideOverPanel'
import { useCcNavigation } from '../../hooks/useCcNavigation'
import apiInstance from '../../api/axiosInstance'

const STATUS_META = {
  PENDING: {
    label: 'To collect',
    hint: 'Still due from the client — not collected yet.',
    className: 'bg-[color:var(--status-pending-bg)] text-[color:var(--status-pending)]',
  },
  DELAYED: {
    label: 'Delayed',
    hint: 'Collection postponed to this due date — recorded but not part of Expected.',
    className: 'bg-[color:var(--status-delayed-bg)] text-[color:var(--status-delayed)]',
  },
  COLLECTED: {
    label: 'Collected',
    hint: 'Agent already holds this cash — waiting for depot handoff.',
    className: 'bg-[color:var(--status-collected-bg)] text-[color:var(--status-collected)]',
  },
  RECEIVED: {
    label: 'Received',
    hint: 'Depot confirmed receipt — cash is closed for the agent.',
    className: 'bg-emerald-500/15 text-emerald-400',
  },
}

function formatMad(amount, currency = 'MAD') {
  const n = Number(amount)
  if (!Number.isFinite(n)) return null
  return `${Math.round(n).toLocaleString()} ${currency}`
}

function formatDay(value) {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(`${s.slice(0, 10)}T12:00:00`)
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    }
    return s.slice(0, 10)
  }
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function displayNotes(notes) {
  if (!notes) return null
  const cleaned = String(notes)
    .replace(/\|\s*prior_owner:[0-9a-f-]{36}/gi, '')
    .replace(/SEED_REV_CHAIN\s*\|?\s*/gi, '')
    .replace(/^Cleared by depot cash deposit on \S+\s*/i, '')
    .replace(/\|\s*/g, ' · ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return cleaned || null
}

function titleCaseStatus(value) {
  if (!value) return null
  return String(value)
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function EntityButton({ children, onClick, title }) {
  if (!onClick) {
    return <span className="break-words">{children}</span>
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title || 'Open'}
      className="max-w-full text-left text-sm font-medium text-cc-accent break-words underline-offset-2 hover:text-cc-accent-hover hover:underline"
    >
      {children}
    </button>
  )
}

/** One readable label / value line — value can be a clickable entity */
function Row({ label, value, onOpen }) {
  if (value == null || value === '') return null
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-x-3 gap-y-0.5 py-1.5 sm:grid-cols-[9rem_1fr]">
      <dt className="text-xs text-cc-tertiary">{label}</dt>
      <dd className="text-sm font-medium text-cc-primary">
        <EntityButton onClick={onOpen} title={`Open ${label.toLowerCase()}`}>
          {value}
        </EntityButton>
      </dd>
    </div>
  )
}

function StoryStep({ step, title, when, active = true, isLast = false, children }) {
  return (
    <li className="relative flex gap-3 pb-6 last:pb-0">
      {!isLast ? (
        <span
          className="absolute left-[11px] top-7 bottom-0 w-px bg-zinc-800"
          aria-hidden
        />
      ) : null}
      <div
        className={`relative z-[1] mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
          active
            ? 'bg-zinc-100 text-zinc-900'
            : 'bg-zinc-800 text-cc-tertiary'
        }`}
      >
        {step}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <h4 className="text-sm font-semibold text-cc-primary">{title}</h4>
          {when ? (
            <span className="text-xs text-cc-tertiary whitespace-nowrap">{when}</span>
          ) : null}
        </div>
        <dl className="mt-2 divide-y divide-zinc-800/60">{children}</dl>
      </div>
    </li>
  )
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-cc-tertiary">
        {title}
      </h3>
      {children}
    </section>
  )
}

/**
 * Revenue cash ledger detail — story timeline with clickable entities.
 */
export function CashLedgerDetailSlideOver({ open, ledgerId, summaryRow = null, onClose }) {
  const { openPanel, openMapEntity } = useCcNavigation()
  const [detail, setDetail] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const go = useCallback(
    (navigateFn) => {
      if (typeof onClose === 'function') onClose()
      navigateFn()
    },
    [onClose],
  )

  const openUser = useCallback(
    (userId) => {
      if (!userId) return
      go(() => openPanel('users', userId))
    },
    [go, openPanel],
  )

  const openOrder = useCallback(
    (orderKey) => {
      if (!orderKey) return
      go(() => openPanel('orders', orderKey))
    },
    [go, openPanel],
  )

  const openClient = useCallback(
    (clientId) => {
      if (!clientId) return
      go(() => openMapEntity('client', clientId))
    },
    [go, openMapEntity],
  )

  const openMission = useCallback(
    (missionId) => {
      if (!missionId) return
      go(() => openPanel('missions', missionId))
    },
    [go, openPanel],
  )

  useEffect(() => {
    if (!open || !ledgerId) {
      setDetail(null)
      setError('')
      return undefined
    }

    const controller = new AbortController()
    setIsLoading(true)
    setError('')
    setDetail(null)

    apiInstance
      .get(`/depot/cash-ledger/${ledgerId}`, { signal: controller.signal })
      .then((res) => {
        setDetail(res.data?.data || null)
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return
        setError(err.response?.data?.message || 'Failed to load deposit detail')
        setIsLoading(false)
      })

    return () => controller.abort()
  }, [open, ledgerId])

  const statusKey = String(detail?.status || summaryRow?.status || '').toUpperCase()
  const statusMeta = STATUS_META[statusKey] || {
    label: statusKey || 'Unknown',
    hint: '',
    className: 'bg-zinc-800 text-zinc-300',
  }

  const titleClient =
    detail?.client?.name || summaryRow?.client_name || 'Cash deposit'

  const noteBody = useMemo(() => displayNotes(detail?.notes), [detail?.notes])
  const currency = detail?.currency || 'MAD'
  const origin = detail?.origin || null
  const credit = origin?.credit_approval || null
  const order = origin?.order || null
  const installment = origin?.installment || null
  const collection = origin?.collection_stop || null
  const orderKey = order?.order_number || order?.id || null

  const storySteps = useMemo(() => {
    if (!detail) return []
    const steps = []

    if (credit) {
      steps.push({
        key: 'requested',
        title: 'Credit requested',
        when: null,
        rows: [
          {
            label: 'Raised by',
            value: credit.raised_by?.name,
            onOpen: credit.raised_by?.id
              ? () => openUser(credit.raised_by.id)
              : null,
          },
          {
            label: 'Role',
            value: credit.raised_by?.role
              ? titleCaseStatus(credit.raised_by.role)
              : null,
          },
          {
            label: 'Amount',
            value: formatMad(credit.amount, currency),
          },
          {
            label: 'Type',
            value: credit.payment_type
              ? titleCaseStatus(credit.payment_type)
              : null,
          },
        ],
      })

      steps.push({
        key: 'approved',
        title: 'Credit approved',
        when: formatDay(credit.resolved_at),
        rows: [
          {
            label: 'Approved by',
            value: credit.resolved_by?.name || '—',
            onOpen: credit.resolved_by?.id
              ? () => openUser(credit.resolved_by.id)
              : null,
          },
          {
            label: 'Status',
            value: titleCaseStatus(credit.status),
          },
          {
            label: 'Due date',
            value: formatDay(credit.due_date),
          },
        ],
      })
    }

    if (order) {
      steps.push({
        key: 'order',
        title: 'Order placed',
        when: null,
        rows: [
          {
            label: 'Order',
            value: order.order_number,
            onOpen: orderKey ? () => openOrder(orderKey) : null,
          },
          { label: 'Status', value: titleCaseStatus(order.status) },
          {
            label: 'Amount',
            value: formatMad(detail.amount, currency),
          },
        ],
      })
    }

    if (installment) {
      steps.push({
        key: 'installment',
        title: 'Installment scheduled',
        when: formatDay(installment.date),
        rows: [
          {
            label: 'Amount',
            value: formatMad(installment.amount, currency),
          },
          {
            label: 'Type',
            value: titleCaseStatus(
              installment.credit_type || installment.type,
            ),
          },
          {
            label: 'Status',
            value: titleCaseStatus(installment.status),
          },
        ],
      })
    }

    if (statusKey === 'PENDING' || statusKey === 'DELAYED') {
      steps.push({
        key: 'due',
        title: statusKey === 'DELAYED' ? 'Collection delayed' : 'Waiting to collect',
        when: formatDay(detail.due_date),
        rows: [
          { label: 'Due', value: formatDay(detail.due_date) },
          {
            label: 'Assigned to',
            value: detail.agent?.name || 'Unassigned',
            onOpen: detail.agent?.id ? () => openUser(detail.agent.id) : null,
          },
          {
            label: 'Amount',
            value: formatMad(detail.amount, currency),
          },
        ],
      })
    }

    if (statusKey === 'COLLECTED' || collection) {
      const holder =
        detail.agent || collection?.agent || detail.current_owner || null
      steps.push({
        key: 'collected',
        title: 'Cash collected',
        when:
          formatDay(collection?.mission_date) || formatDay(detail.due_date),
        rows: [
          {
            label: 'Held by',
            value: holder?.name || 'Agent',
            onOpen: holder?.id ? () => openUser(holder.id) : null,
          },
          {
            label: 'Mission',
            value: collection
              ? [
                  formatDay(collection.mission_date),
                  titleCaseStatus(collection.mission_status || collection.status),
                ]
                  .filter(Boolean)
                  .join(' · ')
              : null,
            onOpen: collection?.mission_id
              ? () => openMission(collection.mission_id)
              : null,
          },
          {
            label: 'Stop',
            value: collection?.status
              ? titleCaseStatus(collection.status)
              : null,
          },
          {
            label: 'Amount',
            value: formatMad(detail.amount, currency),
          },
        ],
      })
    }

    if (statusKey === 'RECEIVED') {
      steps.push({
        key: 'received',
        title: 'Received at depot',
        when: formatDay(detail.received_at),
        rows: [
          {
            label: 'Confirmed by',
            value: detail.received_by?.name || 'Depot',
            onOpen: detail.received_by?.id
              ? () => openUser(detail.received_by.id)
              : null,
          },
          {
            label: 'Previous agent',
            value: detail.agent?.name,
            onOpen: detail.agent?.id ? () => openUser(detail.agent.id) : null,
          },
          {
            label: 'Amount',
            value: formatMad(detail.amount, currency),
          },
          {
            label: 'Due was',
            value: formatDay(detail.due_date),
          },
        ],
      })
    }

    return steps.filter((step) =>
      step.rows.some((row) => row.value != null && row.value !== ''),
    )
  }, [
    detail,
    credit,
    order,
    orderKey,
    installment,
    collection,
    statusKey,
    currency,
    openUser,
    openOrder,
    openMission,
  ])

  return (
    <SlideOverPanel
      isOpen={open}
      onClose={onClose}
      title={titleClient}
      description="Cash story"
      tone="cc"
      maxWidthClass="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-cc-tertiary">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading details…
        </div>
      ) : error ? (
        <p className="py-10 text-center text-sm text-red-400">{error}</p>
      ) : detail ? (
        <div className="space-y-8">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>
              <span className="text-xs text-cc-tertiary">
                {detail.depositable ? 'Can confirm deposit' : 'Not depositable'}
              </span>
            </div>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-cc-primary">
              {formatMad(detail.amount, currency)}
            </p>
            {detail.client?.id && detail.client?.name ? (
              <p className="mt-2">
                <EntityButton
                  onClick={() => openClient(detail.client.id)}
                  title="Open client"
                >
                  {detail.client.name}
                </EntityButton>
              </p>
            ) : null}
            {statusMeta.hint ? (
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-cc-secondary">
                {statusMeta.hint}
              </p>
            ) : null}
          </header>

          <Section title="Client & place">
            <dl className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-1.5">
              <Row
                label="Client"
                value={detail.client?.name}
                onOpen={
                  detail.client?.id
                    ? () => openClient(detail.client.id)
                    : null
                }
              />
              <Row label="Store" value={detail.client?.store_name} />
              <Row label="Place" value={detail.client?.place_name} />
              <Row label="Sector" value={detail.sector?.name} />
              <Row label="Depot" value={detail.depot?.name} />
            </dl>
          </Section>

          <Section title="Story">
            {origin?.match === 'probable' ? (
              <p className="mb-3 text-xs text-cc-tertiary">
                Some links were matched by client and due date.
              </p>
            ) : null}

            {storySteps.length > 0 ? (
              <ol className="m-0 list-none p-0">
                {storySteps.map((step, index) => (
                  <StoryStep
                    key={step.key}
                    step={index + 1}
                    title={step.title}
                    when={step.when}
                    isLast={index === storySteps.length - 1}
                  >
                    {step.rows.map((row) => (
                      <Row
                        key={`${step.key}-${row.label}`}
                        label={row.label}
                        value={row.value}
                        onOpen={row.onOpen}
                      />
                    ))}
                  </StoryStep>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-cc-secondary">
                No order or credit approval linked to this cash row.
              </p>
            )}
          </Section>

          <Section title="Cash handoff">
            <dl className="rounded-lg border border-zinc-800/80 bg-zinc-900/40 px-3 py-1.5">
              <Row
                label="Agent"
                value={detail.agent?.name || 'Unassigned'}
                onOpen={
                  detail.agent?.id ? () => openUser(detail.agent.id) : null
                }
              />
              <Row
                label="Current holder"
                value={
                  detail.current_owner?.name ||
                  (statusKey === 'RECEIVED' ? 'Depot' : null)
                }
                onOpen={
                  detail.current_owner?.id
                    ? () => openUser(detail.current_owner.id)
                    : null
                }
              />
              <Row
                label="Confirmed by"
                value={detail.received_by?.name}
                onOpen={
                  detail.received_by?.id
                    ? () => openUser(detail.received_by.id)
                    : null
                }
              />
              <Row label="Due" value={formatDay(detail.due_date)} />
              <Row label="Received on" value={formatDay(detail.received_at)} />
              <Row label="Record created" value={formatDay(detail.created_at)} />
            </dl>
          </Section>

          {noteBody ? (
            <Section title="Notes">
              <p className="text-sm leading-relaxed text-cc-secondary whitespace-pre-wrap">
                {noteBody}
              </p>
            </Section>
          ) : null}

          <footer className="border-t border-zinc-800/80 pt-4">
            <p className="font-mono text-[11px] leading-5 text-cc-tertiary break-all">
              Ledger {detail.id}
            </p>
          </footer>
        </div>
      ) : null}
    </SlideOverPanel>
  )
}

export default CashLedgerDetailSlideOver
