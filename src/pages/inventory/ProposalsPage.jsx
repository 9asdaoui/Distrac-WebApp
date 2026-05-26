import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ClipboardList, CheckCircle2, XCircle, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { DashboardLayout } from '../../components/DashboardLayout'
import { AnimatedPage } from '../../components/AnimatedPage'
import apiInstance from '../../api/axiosInstance'

const TYPE_LABELS = {
  DEPOT_TRANSFER_PROPOSAL: 'Transfer',
  STOCK_REQUEST_PROPOSAL: 'Industry Request',
}

function typeLabel(type) {
  return TYPE_LABELS[type] || type || 'Unknown'
}

function reasonLabel(proposal) {
  return proposal?.notes || 'Stock below min'
}

function ProposalsSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              {['Depot Name', 'Type', 'Product Count', 'Reason', 'Action'].map((h) => (
                <th key={h} className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4].map((row) => (
              <tr key={row} className="border-b border-gray-200 dark:border-zinc-800">
                {[36, 24, 20, 40, 24].map((w, i) => (
                  <td key={i} className="px-6 py-4">
                    <div className={`h-4 w-${w} animate-pulse rounded bg-gray-200 dark:bg-zinc-700`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReviewPanel({ proposal, depotsById, industriesById, onClose, onAccept, onReject, isSubmitting }) {
  const items = proposal?.items || []

  const resolveSource = (item) => {
    const depotSourceId = item.source_depot_id || proposal.source_depot_id
    if (depotSourceId) {
      return depotsById[depotSourceId]?.depot_name || 'Depot source'
    }
    if (item.target_industry_id) {
      return industriesById[item.target_industry_id]?.industry_name || 'Industry supplier'
    }
    return 'System selected source'
  }

  return (
    <motion.div
      className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-gray-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Review Proposal</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {typeLabel(proposal.proposal_type)} for {depotsById[proposal.depot_id]?.depot_name || 'target depot'}
          </p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        <p><span className="font-medium">Reason:</span> {reasonLabel(proposal)}</p>
        <p className="mt-1"><span className="font-medium">Items:</span> {items.length}</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-zinc-800/50">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-300">Product</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-300">Qty</th>
              <th className="px-4 py-3 font-medium text-zinc-600 dark:text-zinc-300">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-gray-200 dark:border-zinc-800">
                <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">{item.products?.name || item.product_id}</td>
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{Number(item.quantity || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">{resolveSource(item)}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400" colSpan={3}>No proposal items available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onAccept}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <CheckCircle2 className="h-4 w-4" />
          {isSubmitting ? 'Accepting...' : 'Accept'}
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <XCircle className="h-4 w-4" />
          Reject
        </button>
      </div>
    </motion.div>
  )
}

export function ProposalsPage() {
  const [proposals, setProposals] = useState([])
  const [depots, setDepots] = useState([])
  const [industries, setIndustries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [dismissedIds, setDismissedIds] = useState([])
  const controllerRef = useRef(null)

  const load = async () => {
    if (controllerRef.current) controllerRef.current.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setIsLoading(true)
    setError('')
    try {
      const [proposalRes, depotsRes, industriesRes] = await Promise.all([
        apiInstance.get('/depot/proposals', { signal: controller.signal }),
        apiInstance.get('/depots', { signal: controller.signal }),
        apiInstance.get('/industries', { signal: controller.signal }),
      ])
      if (!controller.signal.aborted) {
        setProposals(proposalRes.data?.data?.proposals || [])
        setDepots(depotsRes.data?.data?.depots || [])
        setIndustries(industriesRes.data?.data?.industries || [])
      }
    } catch (e) {
      if (e.name !== 'CanceledError') {
        setProposals([])
        setError('Failed to load proposal inbox.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => controllerRef.current?.abort()
  }, [])

  const depotsById = useMemo(() => Object.fromEntries(depots.map((d) => [d.id, d])), [depots])
  const industriesById = useMemo(() => Object.fromEntries(industries.map((i) => [i.id, i])), [industries])

  const visibleProposals = proposals.filter((p) => p.status === 'PENDING' && !dismissedIds.includes(p.id))

  const acceptProposal = async (proposal) => {
    setIsSubmitting(true)
    try {
      await apiInstance.post(`/depot/proposals/${proposal.id}/accept`)
      setSelectedProposal(null)
      await load()
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to accept proposal.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const rejectProposal = (proposal) => {
    setDismissedIds((prev) => [...prev, proposal.id])
    setSelectedProposal(null)
  }

  return (
    <DashboardLayout>
      <AnimatedPage>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800">
                <ClipboardList className="h-5 w-5 text-zinc-600 dark:text-zinc-300" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Proposal Inbox</h1>
                <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Review system-generated replenishment proposals before conversion to stock requests.
                </p>
              </div>
            </div>
            {!isLoading && (
              <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{visibleProposals.length} pending</span>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </div>
          )}

          {isLoading ? (
            <ProposalsSkeleton />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-zinc-800/50">
                    <tr>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Depot Name</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Type</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Product Count</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Reason</th>
                      <th className="px-6 py-3 font-medium text-zinc-600 dark:text-zinc-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProposals.map((proposal) => (
                      <tr key={proposal.id} className="border-b border-gray-200 dark:border-zinc-800">
                        <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{depotsById[proposal.depot_id]?.depot_name || proposal.depot_id}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{typeLabel(proposal.proposal_type)}</td>
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-300">{proposal.items?.length || 0}</td>
                        <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">{reasonLabel(proposal)}</td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() => setSelectedProposal(proposal)}
                            className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
                          >
                            Review Proposal
                          </button>
                        </td>
                      </tr>
                    ))}
                    {visibleProposals.length === 0 && (
                      <tr>
                        <td className="px-6 py-10 text-center text-zinc-500 dark:text-zinc-400" colSpan={5}>No pending proposals.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AnimatedPage>

      <AnimatePresence>
        {selectedProposal && (
          <motion.div className="fixed inset-0 z-[60]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedProposal(null)} aria-hidden="true" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <ReviewPanel
              proposal={selectedProposal}
              depotsById={depotsById}
              industriesById={industriesById}
              onClose={() => setSelectedProposal(null)}
              onAccept={() => acceptProposal(selectedProposal)}
              onReject={() => rejectProposal(selectedProposal)}
              isSubmitting={isSubmitting}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  )
}
