import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, Banknote, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { PERMISSIONS } from '../../config/permissions'
import { getAuthRoleName } from '../../components/map/ccPanelRegistry'
import apiInstance from '../../api/axiosInstance'
import { CashLedgerDetailSlideOver } from './CashLedgerDetailSlideOver'

const VARIANT = {
  cc: {
    section: 'rounded-cc-panel border border-cc-border-subtle bg-cc-surface p-5',
    title: 'text-lg font-semibold text-cc-primary',
    tableWrap: 'mt-4 overflow-x-auto rounded-xl border border-cc-border-subtle',
    thead: 'bg-cc-surface-alt text-cc-tertiary',
    row: 'border-t border-cc-border-subtle',
    cell: 'px-4 py-2.5 text-cc-secondary',
    messageOk: 'mt-3 text-sm text-cc-success',
    messageErr: 'mt-3 text-sm text-cc-error',
    icon: 'text-cc-success',
    empty:
      'mt-4 rounded-xl border border-dashed border-cc-border px-4 py-10 text-center text-sm text-cc-muted',
    filterBar:
      'mt-4 flex flex-col gap-3 rounded-xl border border-cc-border-subtle bg-cc-surface-alt p-3 sm:flex-row sm:flex-wrap sm:items-end',
    filterField: 'min-w-[10rem] flex-1 sm:max-w-[14rem]',
    filterLabel:
      'mb-1.5 block text-cc-label font-semibold uppercase tracking-cc-label text-cc-tertiary',
    filterSelect:
      'w-full rounded-cc-control border border-cc-border bg-cc-surface px-3 py-2 text-cc-body text-cc-primary outline-none transition hover:border-cc-border-hover focus:border-cc-accent',
    statusGroup:
      'inline-flex max-w-full flex-wrap gap-0.5 rounded-cc-control border border-cc-border bg-cc-surface p-0.5',
    statusBtn:
      'rounded-md px-2.5 py-1.5 text-cc-body-sm font-medium text-cc-muted transition hover:bg-cc-surface-hover hover:text-cc-primary',
    statusBtnActive:
      'rounded-md bg-cc-accent/15 px-2.5 py-1.5 text-cc-body-sm font-semibold text-cc-accent ring-1 ring-cc-accent/30',
    groupBtn:
      'inline-flex items-center gap-2 rounded-cc-control border border-cc-border bg-cc-surface px-3 py-2 text-cc-body text-cc-secondary transition hover:border-cc-border-hover hover:text-cc-primary',
    groupBtnActive:
      'inline-flex items-center gap-2 rounded-cc-control border border-cc-accent/40 bg-cc-accent/15 px-3 py-2 text-cc-body font-medium text-cc-accent',
    groupKnobOff: 'border-cc-border bg-cc-surface-hover',
    groupKnobOn: 'border-cc-accent/50 bg-cc-accent/30',
    skeleton: 'animate-pulse rounded bg-cc-surface-hover',
    refreshBtn:
      'inline-flex items-center gap-1.5 rounded-cc-control border border-cc-border px-3 py-1.5 text-cc-body-sm font-medium text-cc-secondary transition hover:border-cc-border-hover hover:bg-cc-surface-hover hover:text-cc-primary disabled:opacity-50',
  },
  page: {
    section:
      'rounded-2xl border border-gray-200 bg-white p-5 dark:border-cc-border-subtle dark:bg-cc-surface',
    title: 'text-lg font-semibold text-zinc-900 dark:text-cc-primary',
    tableWrap:
      'mt-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-cc-border-subtle',
    thead: 'bg-gray-50 text-zinc-500 dark:bg-cc-surface-alt dark:text-cc-tertiary',
    row: 'border-t border-gray-200 dark:border-cc-border-subtle',
    cell: 'px-4 py-2.5 text-zinc-700 dark:text-cc-secondary',
    messageOk: 'mt-3 text-sm text-emerald-600 dark:text-cc-success',
    messageErr: 'mt-3 text-sm text-red-600 dark:text-cc-error',
    icon: 'text-distrac-primary dark:text-cc-success',
    empty:
      'mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-cc-border dark:text-cc-muted',
    filterBar:
      'mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-cc-border-subtle dark:bg-cc-surface-alt sm:flex-row sm:flex-wrap sm:items-end',
    filterField: 'min-w-[10rem] flex-1 sm:max-w-[14rem]',
    filterLabel:
      'mb-1.5 block text-cc-label font-semibold uppercase tracking-cc-label text-zinc-500 dark:text-cc-tertiary',
    filterSelect:
      'w-full rounded-cc-control border border-gray-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-distrac-primary dark:border-cc-border dark:bg-cc-surface dark:text-cc-primary dark:focus:border-cc-accent',
    statusGroup:
      'inline-flex max-w-full flex-wrap gap-0.5 rounded-cc-control border border-gray-300 bg-white p-0.5 dark:border-cc-border dark:bg-cc-surface',
    statusBtn:
      'rounded-md px-2.5 py-1.5 text-cc-body-sm font-medium text-zinc-500 transition hover:text-zinc-800 dark:text-cc-muted dark:hover:bg-cc-surface-hover dark:hover:text-cc-primary',
    statusBtnActive:
      'rounded-md bg-distrac-muted px-2.5 py-1.5 text-cc-body-sm font-semibold text-distrac-primary ring-1 ring-distrac-ring dark:bg-cc-accent/15 dark:text-cc-accent dark:ring-cc-accent/30',
    groupBtn:
      'inline-flex items-center gap-2 rounded-cc-control border border-gray-300 bg-white px-3 py-2 text-sm text-zinc-600 transition hover:border-zinc-400 dark:border-cc-border dark:bg-cc-surface dark:text-cc-secondary',
    groupBtnActive:
      'inline-flex items-center gap-2 rounded-cc-control border border-distrac-ring bg-distrac-muted px-3 py-2 text-sm font-medium text-distrac-primary dark:border-cc-accent/40 dark:bg-cc-accent/15 dark:text-cc-accent',
    groupKnobOff: 'border-gray-300 bg-gray-200 dark:border-cc-border dark:bg-cc-surface-hover',
    groupKnobOn:
      'border-distrac-primary/40 bg-distrac-primary/25 dark:border-cc-accent/50 dark:bg-cc-accent/30',
    skeleton: 'animate-pulse rounded bg-zinc-200 dark:bg-cc-surface-hover',
    refreshBtn:
      'inline-flex items-center gap-1.5 rounded-cc-control border border-gray-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-gray-50 disabled:opacity-50 dark:border-cc-border dark:text-cc-secondary dark:hover:border-cc-border-hover dark:hover:bg-cc-surface-hover dark:hover:text-cc-primary',
  },
}

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'PENDING', label: 'To collect' },
  { id: 'DELAYED', label: 'Delayed' },
  { id: 'COLLECTED', label: 'Collected' },
  { id: 'RECEIVED', label: 'Received' },
]

const SELECTABLE_STATUSES = new Set(['PENDING', 'DELAYED', 'COLLECTED'])

const STATUS_RANK = { DELAYED: 0, PENDING: 1, COLLECTED: 2, RECEIVED: 3 }

function normalizeStatus(status) {
  const key = String(status || '').toUpperCase()
  // Compat: older payloads used CLEARED for the same end state
  if (key === 'CLEARED') return 'RECEIVED'
  return key
}

function isRowSelectable(row) {
  // Only Received is non-actionable.
  const status = normalizeStatus(row.status)
  if (status === 'RECEIVED') return false
  return SELECTABLE_STATUSES.has(status)
}

function canDepositRow(row) {
  return isRowSelectable(row) && Boolean(row.agent_id)
}

function StatusBadge({ status }) {
  const key = normalizeStatus(status)
  const styleByStatus = {
    PENDING: {
      color: 'var(--status-pending)',
      background: 'var(--status-pending-bg)',
    },
    DELAYED: {
      color: 'var(--status-delayed)',
      background: 'var(--status-delayed-bg)',
    },
    COLLECTED: {
      color: 'var(--status-collected)',
      background: 'var(--status-collected-bg)',
    },
    RECEIVED: {
      color: 'var(--color-success)',
      background: 'color-mix(in srgb, var(--color-success) 18%, transparent)',
    },
  }
  const style = styleByStatus[key] || {
    color: 'var(--color-text-muted)',
    background: 'var(--color-bg-surface-hover)',
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide"
      style={style}
    >
      {key === 'RECEIVED' ? 'RECEIVED' : key || '—'}
    </span>
  )
}

function agentColumnLabel(row) {
  if (normalizeStatus(row.status) === 'RECEIVED') {
    return row.agent_name || 'Depot'
  }
  return row.agent_name || (row.agent_id ? row.agent_id : 'Unassigned')
}

function SortIcon({ active, dir }) {
  if (!active) return <ArrowUpDown className="ml-1 inline h-3 w-3 opacity-50" />
  return dir === 'asc' ? (
    <ArrowUp className="ml-1 inline h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 inline h-3 w-3" />
  )
}

function RowToggle({ checked, disabled = false, onChange, 'aria-label': ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => {
        if (disabled) return
        onChange(!checked)
      }}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition ${
        disabled
          ? 'cursor-not-allowed border-cc-border bg-cc-surface-hover opacity-40'
          : checked
            ? 'cursor-pointer border-[color:var(--color-success)]/50 bg-[color:var(--color-success)]/25'
            : 'cursor-pointer border-cc-border bg-cc-surface-hover hover:border-cc-border-hover'
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
          checked ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function TableSkeleton({ styles, showDepotColumn, rows = 5 }) {
  return (
    <div className={`${styles.tableWrap} mt-4`} aria-busy="true" aria-label="Loading deposits">
      <table className="min-w-full text-left text-sm">
        <thead className={styles.thead}>
          <tr>
            <th className="px-4 py-2 w-12" />
            {showDepotColumn ? <th className="px-4 py-2">Depot</th> : null}
            <th className="px-4 py-2">Agent</th>
            <th className="px-4 py-2">Client</th>
            <th className="px-4 py-2 text-right">Amount</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className={styles.row}>
              <td className={styles.cell}>
                <div className={`h-5 w-9 rounded-full ${styles.skeleton}`} />
              </td>
              {showDepotColumn ? (
                <td className={styles.cell}>
                  <div className={`h-3.5 w-24 ${styles.skeleton}`} />
                </td>
              ) : null}
              <td className={styles.cell}>
                <div className={`h-3.5 w-28 ${styles.skeleton}`} />
              </td>
              <td className={styles.cell}>
                <div className={`h-3.5 w-32 ${styles.skeleton}`} />
              </td>
              <td className={`${styles.cell} text-right`}>
                <div className={`ml-auto h-3.5 w-16 ${styles.skeleton}`} />
              </td>
              <td className={styles.cell}>
                <div className={`h-5 w-20 rounded-full ${styles.skeleton}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Depot cash deposits: open held cash + optional CLEARED history in date range.
 * Navbar depot acts as a filter (omit = all scoped depots).
 * Optional agent filter. dateFrom/dateTo from CC picker (omit → open-only).
 */
export function DepotCashHandoffSection({
  variant = 'cc',
  onDeposited,
  depotId = '',
  dateFrom = '',
  dateTo = '',
}) {
  const { hasPermission, user } = useAuth()
  const role = getAuthRoleName(user)
  const canDeposit =
    hasPermission(PERMISSIONS.DEPOSIT_CASH) ||
    role === 'DEPOT_SUPERVISOR' ||
    role === 'GENERAL_MANAGEMENT'

  const [teamAgents, setTeamAgents] = useState([])
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [sortKey, setSortKey] = useState(null) // 'amount' | 'status'
  const [sortDir, setSortDir] = useState('desc')
  const [groupByAgent, setGroupByAgent] = useState(false)
  const [heldRows, setHeldRows] = useState([])
  const [selectedLedgerIds, setSelectedLedgerIds] = useState(new Set())
  const [isLoadingHeld, setIsLoadingHeld] = useState(false)
  const [isDepositing, setIsDepositing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageTone, setMessageTone] = useState('ok')
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [detailLedgerId, setDetailLedgerId] = useState(null)
  const [detailSummaryRow, setDetailSummaryRow] = useState(null)

  const styles = VARIANT[variant] || VARIANT.cc
  const filterDepotId = depotId || ''

  useEffect(() => {
    let cancelled = false
    apiInstance
      .get('/users')
      .then((res) => {
        if (cancelled) return
        const users = res.data?.data?.users || []
        setTeamAgents(
          users.filter((u) => {
            const r = String(u.role_name || '').toUpperCase()
            return r === 'LIVREUR' || r === 'VENDOR'
          }),
        )
      })
      .catch(() => {
        if (!cancelled) setTeamAgents([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const loadHeldCash = useCallback(async () => {
    setIsLoadingHeld(true)
    setMessage('')
    try {
      const params = {}
      if (filterDepotId) params.depotId = filterDepotId
      if (selectedAgentId) params.agentId = selectedAgentId
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
      const res = await apiInstance.get('/depot/livreur-held-cash', { params })
      const payload = res.data?.data || {}
      const rows = Array.isArray(payload.rows) ? payload.rows : []
      setHeldRows(rows)
      setSelectedLedgerIds(new Set())
    } catch (err) {
      setHeldRows([])
      setMessageTone('err')
      setMessage(err.response?.data?.message || 'Failed to load deposits')
    } finally {
      setIsLoadingHeld(false)
      setHasLoadedOnce(true)
    }
  }, [filterDepotId, selectedAgentId, dateFrom, dateTo])

  useEffect(() => {
    if (!canDeposit) return undefined
    loadHeldCash()
    return undefined
  }, [canDeposit, loadHeldCash])

  const uniqueDepots = useMemo(() => {
    const map = new Map()
    for (const row of heldRows) {
      const id = row.depot_id || filterDepotId
      if (!id) continue
      if (!map.has(id)) {
        map.set(id, row.depot_name || id)
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }))
  }, [heldRows, filterDepotId])

  const singleDepotContext = Boolean(filterDepotId) || uniqueDepots.length === 1
  const showDepotColumn = !singleDepotContext

  const filteredRows = useMemo(() => {
    let rows = heldRows
    if (statusFilter !== 'ALL') {
      rows = rows.filter((row) => normalizeStatus(row.status) === statusFilter)
    }

    if (sortKey === 'amount') {
      rows = [...rows].sort((a, b) => {
        const diff = Number(a.amount ?? 0) - Number(b.amount ?? 0)
        return sortDir === 'asc' ? diff : -diff
      })
    } else if (sortKey === 'status') {
      rows = [...rows].sort((a, b) => {
        const ra = STATUS_RANK[normalizeStatus(a.status)] ?? 99
        const rb = STATUS_RANK[normalizeStatus(b.status)] ?? 99
        const diff = ra - rb
        return sortDir === 'asc' ? diff : -diff
      })
    }

    return rows
  }, [heldRows, statusFilter, sortKey, sortDir])

  const selectableVisibleIds = useMemo(
    () => filteredRows.filter(isRowSelectable).map((row) => row.id),
    [filteredRows],
  )

  const depositableVisibleIds = useMemo(
    () => filteredRows.filter(canDepositRow).map((row) => row.id),
    [filteredRows],
  )

  const agentOptions = useMemo(() => {
    const fromTeam = teamAgents.map((u) => ({
      id: u.id,
      name: u.full_name || u.email || u.id,
    }))
    const fromRows = heldRows
      .filter((row) => row.agent_id)
      .map((row) => ({
        id: row.agent_id,
        name: row.agent_name || row.agent_id,
      }))
    const byId = new Map()
    for (const row of [...fromTeam, ...fromRows]) {
      if (!byId.has(row.id)) byId.set(row.id, row)
    }
    return [...byId.values()].sort((a, b) => String(a.name).localeCompare(String(b.name)))
  }, [teamAgents, heldRows])

  const groupedRows = useMemo(() => {
    if (!groupByAgent) {
      return [{ key: 'all', label: null, rows: filteredRows }]
    }
    const groups = new Map()
    for (const row of filteredRows) {
      const key = row.agent_id || 'unassigned'
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: row.agent_name || (row.agent_id ? row.agent_id : agentColumnLabel(row)),
          rows: [],
        })
      }
      groups.get(key).rows.push(row)
    }
    return [...groups.values()].sort((a, b) =>
      String(a.label).localeCompare(String(b.label)),
    )
  }, [filteredRows, groupByAgent])

  if (!canDeposit) return null

  const selectedSelectableCount = selectableVisibleIds.filter((id) =>
    selectedLedgerIds.has(id),
  ).length
  const selectedDepositableCount = depositableVisibleIds.filter((id) =>
    selectedLedgerIds.has(id),
  ).length
  const allSelectableSelected =
    selectableVisibleIds.length > 0 &&
    selectableVisibleIds.every((id) => selectedLedgerIds.has(id))

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir(key === 'amount' ? 'desc' : 'asc')
  }

  const toggleLedger = (row) => {
    if (!isRowSelectable(row)) return
    setSelectedLedgerIds((prev) => {
      const next = new Set(prev)
      if (next.has(row.id)) next.delete(row.id)
      else next.add(row.id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      setSelectedLedgerIds((prev) => {
        const next = new Set(prev)
        for (const id of selectableVisibleIds) next.delete(id)
        return next
      })
      return
    }
    setSelectedLedgerIds((prev) => {
      const next = new Set(prev)
      for (const id of selectableVisibleIds) next.add(id)
      return next
    })
  }

  const depositSelected = async () => {
    const selected = filteredRows.filter(
      (row) => selectedLedgerIds.has(row.id) && canDepositRow(row),
    )
    const selectedUnassigned = filteredRows.filter(
      (row) =>
        selectedLedgerIds.has(row.id) && isRowSelectable(row) && !row.agent_id,
    )
    if (selected.length === 0) {
      if (selectedUnassigned.length > 0) {
        setMessageTone('err')
        setMessage('Selected rows have no agent — assign an agent before deposit')
      }
      return
    }

    setIsDepositing(true)
    setMessage('')
    try {
      const byDepot = new Map()
      for (const row of selected) {
        const id = row.depot_id || filterDepotId
        if (!id) continue
        if (!byDepot.has(id)) byDepot.set(id, [])
        byDepot.get(id).push(row.id)
      }

      if (byDepot.size === 0) {
        setMessageTone('err')
        setMessage('Could not resolve depot for selected rows')
        return
      }

      let cleared = 0
      let total = 0
      for (const [depId, ledgerIds] of byDepot) {
        const body = { depotId: depId, ledgerIds }
        if (selectedAgentId) body.agentId = selectedAgentId
        const res = await apiInstance.post('/depot/deposit-cash', body)
        const result = res.data?.data || {}
        cleared += Number(result.cleared_count ?? ledgerIds.length)
        total += Number(result.total_cleared_amount ?? 0)
      }

      setMessageTone('ok')
      setMessage(
        `Deposited ${cleared} row${cleared === 1 ? '' : 's'} · ${total.toLocaleString()} MAD`,
      )
      await loadHeldCash()
      onDeposited?.({ cleared_count: cleared, total_cleared_amount: total })
    } catch (err) {
      setMessageTone('err')
      setMessage(err.response?.data?.message || 'Deposit failed')
    } finally {
      setIsDepositing(false)
    }
  }

  const confirmEnabled = selectedDepositableCount > 0 && !isDepositing

  return (
    <section className={styles.section}>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Banknote className={`h-5 w-5 shrink-0 ${styles.icon}`} />
          <h2 className={styles.title}>Pending deposits</h2>
        </div>
        <button
          type="button"
          onClick={loadHeldCash}
          disabled={isLoadingHeld}
          className={styles.refreshBtn}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoadingHeld ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className={styles.filterBar}>
        <label className={styles.filterField}>
          <span className={styles.filterLabel}>Agent</span>
          <select
            className={styles.filterSelect}
            value={selectedAgentId}
            onChange={(e) => setSelectedAgentId(e.target.value)}
          >
            <option value="">All agents</option>
            {agentOptions.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>

        <div className="min-w-0 flex-[2]">
          <span className={styles.filterLabel}>Status</span>
          <div className={styles.statusGroup} role="group" aria-label="Filter by status">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                className={
                  statusFilter === f.id ? styles.statusBtnActive : styles.statusBtn
                }
                aria-pressed={statusFilter === f.id}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:ml-auto">
          <span className={styles.filterLabel}>Layout</span>
          <button
            type="button"
            onClick={() => setGroupByAgent((v) => !v)}
            className={groupByAgent ? styles.groupBtnActive : styles.groupBtn}
            aria-pressed={groupByAgent}
          >
            <span
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition ${
                groupByAgent ? styles.groupKnobOn : styles.groupKnobOff
              }`}
              aria-hidden
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
                  groupByAgent ? 'translate-x-[1.125rem]' : 'translate-x-0.5'
                }`}
              />
            </span>
            Group by agent
          </button>
        </div>
      </div>

      {isLoadingHeld ? (
        <TableSkeleton styles={styles} showDepotColumn={showDepotColumn} />
      ) : filteredRows.length > 0 ? (
        <div className={`${styles.tableWrap} mt-4`}>
          <table className="min-w-full text-left text-sm">
            <thead className={styles.thead}>
              <tr>
                <th className="px-4 py-2 w-12">
                  <RowToggle
                    checked={allSelectableSelected}
                    disabled={selectableVisibleIds.length === 0}
                    onChange={toggleSelectAll}
                    aria-label="Select all confirmable rows"
                  />
                </th>
                {showDepotColumn ? <th className="px-4 py-2">Depot</th> : null}
                {!groupByAgent ? <th className="px-4 py-2">Agent</th> : null}
                <th className="px-4 py-2">Client</th>
                <th className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => toggleSort('amount')}
                    className="inline-flex items-center font-medium text-cc-tertiary hover:text-cc-primary"
                  >
                    Amount
                    <SortIcon active={sortKey === 'amount'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-2">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center font-medium text-cc-tertiary hover:text-cc-primary"
                  >
                    Status
                    <SortIcon active={sortKey === 'status'} dir={sortDir} />
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {groupedRows.map((group) => (
                <React.Fragment key={group.key}>
                  {group.label ? (
                    <tr className="border-t border-cc-border-subtle bg-cc-surface-alt">
                      <td
                        colSpan={4 + (showDepotColumn ? 1 : 0)}
                        className="px-4 py-2 text-cc-label font-semibold uppercase tracking-cc-label text-cc-tertiary"
                      >
                        {group.label}
                        <span className="ml-2 font-normal normal-case text-cc-muted">
                          {group.rows.length} row{group.rows.length === 1 ? '' : 's'}
                        </span>
                      </td>
                    </tr>
                  ) : null}
                  {group.rows.map((row) => {
                    const selectable = isRowSelectable(row)
                    const selected = selectedLedgerIds.has(row.id)
                    return (
                      <tr
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setDetailLedgerId(row.id)
                          setDetailSummaryRow(row)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setDetailLedgerId(row.id)
                            setDetailSummaryRow(row)
                          }
                        }}
                        className={`${styles.row} cursor-pointer transition hover:bg-cc-surface-hover ${!selectable ? 'opacity-60' : ''}`}
                        style={
                          selected
                            ? { backgroundColor: 'var(--row-selected-bg)' }
                            : undefined
                        }
                      >
                        <td
                          className={styles.cell}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <RowToggle
                            checked={selected}
                            disabled={!selectable}
                            onChange={() => toggleLedger(row)}
                            aria-label={
                              selectable
                                ? `Select deposit ${row.id}`
                                : 'Received — already at depot'
                            }
                          />
                        </td>
                        {showDepotColumn ? (
                          <td className={`${styles.cell} max-w-[9rem]`}>
                            <span className="block truncate" title={row.depot_name || ''}>
                              {row.depot_name || '—'}
                            </span>
                          </td>
                        ) : null}
                        {!groupByAgent ? (
                          <td className={styles.cell}>{agentColumnLabel(row)}</td>
                        ) : null}
                        <td className={styles.cell}>{row.client_name || '—'}</td>
                        <td
                          className={`${styles.cell} text-right tabular-nums font-medium`}
                        >
                          {Number(row.amount ?? 0).toLocaleString()} MAD
                        </td>
                        <td className={styles.cell}>
                          <StatusBadge status={row.status} />
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : hasLoadedOnce ? (
        <p className={styles.empty}>
          {dateFrom || dateTo
            ? 'No open deposits or cleared cash in this date range'
            : 'No pending deposits'}
        </p>
      ) : null}

      {filteredRows.length > 0 ? (
        <button
          type="button"
          onClick={depositSelected}
          disabled={!confirmEnabled}
          className={
            confirmEnabled
              ? 'mt-4 inline-flex items-center gap-2 rounded-cc-control bg-cc-success px-4 py-2 text-sm font-semibold text-white shadow-cc-subtle ring-1 ring-cc-success-hover hover:bg-cc-success-hover'
              : 'mt-4 inline-flex items-center gap-2 rounded-cc-control border border-cc-border bg-cc-surface-alt px-4 py-2 text-sm font-semibold text-cc-muted opacity-60'
          }
        >
          {isDepositing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Confirm deposit ({selectedDepositableCount})
        </button>
      ) : null}

      {message ? (
        <p className={messageTone === 'err' ? styles.messageErr : styles.messageOk}>
          {message}
        </p>
      ) : null}

      <CashLedgerDetailSlideOver
        open={Boolean(detailLedgerId)}
        ledgerId={detailLedgerId}
        summaryRow={detailSummaryRow}
        onClose={() => {
          setDetailLedgerId(null)
          setDetailSummaryRow(null)
        }}
      />
    </section>
  )
}

export default DepotCashHandoffSection
