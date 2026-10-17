/**
 * MilestoneJobDetailModal — shows all milestones of a job, inline actions per milestone.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Loader2, CheckCircle, Link2, Shield, AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toBytes } from 'viem'
import { toast } from 'sonner'
import { MILESTONE_ADDRESS, MILESTONE_ABI } from './MilestoneABI'
import { type JobData, type MilestoneData, useMilestones, milestoneStatusLabel, milestoneStatusColor } from './useMilestoneData'
import { ARC_TESTNET_CHAIN_ID, formatAmount } from './useEscrowData'
import { buildTxExplorerUrl } from '@/onchain-facts'
import AgentBadge from './AgentBadge'

interface Props {
  job: JobData
  onClose: () => void
  onAction: () => void
}

function formatDeadline(ts: bigint) {
  return new Date(Number(ts) * 1000).toLocaleString()
}

function MilestoneRow({
  milestone, job, address,
  onSuccess,
}: {
  milestone: MilestoneData
  job: JobData
  address: `0x${string}` | undefined
  onSuccess: () => void
}) {
  const [open, setOpen] = useState(milestone.status < 3)
  const [proofInput, setProofInput] = useState('')

  const { writeContract: submitTx, data: submitHash, isPending: submitPending } = useWriteContract()
  const { isLoading: submitConfirming, isSuccess: submitSuccess } = useWaitForTransactionReceipt({ hash: submitHash })

  const { writeContract: completeTx, data: completeHash, isPending: completePending } = useWriteContract()
  const { isLoading: completeConfirming, isSuccess: completeSuccess } = useWaitForTransactionReceipt({ hash: completeHash })

  const { writeContract: refundTx, data: refundHash, isPending: refundPending } = useWriteContract()
  const { isLoading: refundConfirming, isSuccess: refundSuccess } = useWaitForTransactionReceipt({ hash: refundHash })

  const { writeContract: disputeTx, data: disputeHash, isPending: disputePending } = useWriteContract()
  const { isLoading: disputeConfirming, isSuccess: disputeSuccess } = useWaitForTransactionReceipt({ hash: disputeHash })

  const anySuccess = submitSuccess || completeSuccess || refundSuccess || disputeSuccess
  useEffect(() => {
    if (anySuccess) { toast.success('Transaction confirmed!'); onSuccess() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anySuccess])

  const isClient = address?.toLowerCase() === job.client.toLowerCase()
  const isWorker = address?.toLowerCase() === job.worker.toLowerCase()
  const isEvaluator = address?.toLowerCase() === job.evaluator.toLowerCase()

  const isFunded = milestone.status === 0
  const isSubmitted = milestone.status === 1
  const isDisputed = milestone.status === 2
  const isTerminal = milestone.status >= 3

  const anyPending = submitPending || submitConfirming || completePending || completeConfirming ||
    refundPending || refundConfirming || disputePending || disputeConfirming

  const statusColor = milestoneStatusColor(milestone.status)
  const statusLabel = milestoneStatusLabel(milestone.status)
  const pastDeadline = Date.now() > Number(milestone.deadline) * 1000

  const mid = milestone.milestoneId
  const jid = job.jobId

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
        style={{ background: 'var(--surface)' }}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: statusColor }} />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold" style={{ color: 'var(--subtle)' }}>M{mid.toString()}</span>
            <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
              {milestone.title || `Milestone ${mid}`}
            </span>
            {isDisputed && (
              <span className="flex items-center gap-0.5 text-xs font-semibold px-1 py-0.5 rounded"
                style={{ background: 'rgba(232,109,122,0.15)', color: 'var(--danger)' }}>
                <AlertTriangle className="w-2.5 h-2.5" />Disputed
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{formatAmount(milestone.amount)} USDC</span>
            <span className="text-xs" style={{ color: pastDeadline && !isTerminal ? 'var(--danger)' : 'var(--subtle)' }}>
              <Clock className="w-2.5 h-2.5 inline mr-0.5" />{formatDeadline(milestone.deadline)}
            </span>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0"
          style={{ background: `color-mix(in srgb, ${statusColor} 15%, transparent)`, color: statusColor }}>
          {statusLabel}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--subtle)' }} />
               : <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--subtle)' }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-2 space-y-3" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
          {milestone.description && (
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{milestone.description}</p>
          )}

          {milestone.deliveryProof && (
            <div className="rounded-xl p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: 'var(--subtle)' }}>Delivery Proof</p>
              <a href={milestone.deliveryProof.startsWith('http') ? milestone.deliveryProof : `https://ipfs.io/ipfs/${milestone.deliveryProof}`}
                target="_blank" rel="noreferrer"
                className="mono text-xs flex items-center gap-1 break-all" style={{ color: 'var(--accent)' }}>
                <Link2 className="w-3 h-3 shrink-0" />{milestone.deliveryProof}
              </a>
              {milestone.deliveryHash && milestone.deliveryHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                <p className="mono text-xs mt-1" style={{ color: 'var(--subtle)' }}>hash: {milestone.deliveryHash.slice(0, 18)}…</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isWorker && isFunded && (
              <div className="space-y-2">
                <input value={proofInput} onChange={(e) => setProofInput(e.target.value)}
                  placeholder="IPFS CID or delivery URL..."
                  className="mono w-full px-3 py-2 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
                <button
                  onClick={() => {
                    if (!proofInput.trim()) return
                    const hash = keccak256(toBytes(proofInput.trim()))
                    submitTx({ address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'submitMilestone',
                      args: [jid, mid, proofInput.trim(), hash] })
                  }}
                  disabled={!proofInput.trim() || anyPending}
                  className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#0d1b2f' }}>
                  {submitPending || submitConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Submitting...</span>
                    : 'Submit Delivery'}
                </button>
              </div>
            )}

            {(isClient || isEvaluator) && isSubmitted && (
              <button onClick={() => completeTx({ address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'completeMilestone', args: [jid, mid] })}
                disabled={anyPending} className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
                style={{ background: 'var(--success)', color: '#0d1b2f' }}>
                {completePending || completeConfirming
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Releasing...</span>
                  : 'Release Milestone Funds'}
              </button>
            )}

            {isEvaluator && isDisputed && (
              <>
                <button onClick={() => completeTx({ address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'completeMilestone', args: [jid, mid] })}
                  disabled={anyPending} className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--success)', color: '#0d1b2f' }}>
                  {completePending || completeConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Processing...</span>
                    : 'Rule: Release to Worker'}
                </button>
                <button onClick={() => refundTx({ address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'refundMilestone', args: [jid, mid] })}
                  disabled={anyPending} className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
                  style={{ background: 'var(--surface)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                  Rule: Refund Client
                </button>
              </>
            )}

            {isClient && isFunded && (
              <button onClick={() => refundTx({ address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'refundMilestone', args: [jid, mid] })}
                disabled={anyPending} className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                Refund This Milestone
              </button>
            )}

            {isClient && isSubmitted && (
              <button onClick={() => disputeTx({ address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'raiseDispute', args: [jid, mid] })}
                disabled={anyPending} className="w-full rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40"
                style={{ background: 'rgba(232,109,122,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                {disputePending || disputeConfirming
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Raising dispute...</span>
                  : <span className="flex items-center justify-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" />Raise Dispute</span>}
              </button>
            )}
          </div>

          {(submitHash ?? completeHash ?? refundHash ?? disputeHash) && (
            <a href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, submitHash ?? completeHash ?? refundHash ?? disputeHash ?? '0x')}
              target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
              <CheckCircle className="w-3 h-3" style={{ color: 'var(--success)' }} />View on ArcScan
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}

export default function MilestoneJobDetailModal({ job, onClose, onAction }: Props) {
  const { address } = useAccount()
  const { milestones, isLoading, refetch } = useMilestones(job.jobId)

  const hasArbiter = job.evaluator.toLowerCase() !== job.client.toLowerCase()

  const { writeContract: withdrawTx, data: withdrawHash, isPending: withdrawPending } = useWriteContract()
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash })

  useEffect(() => {
    if (withdrawSuccess) { toast.success('Withdrawn!'); onAction() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withdrawSuccess])

  function handleWithdraw() {
    withdrawTx({ address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'withdraw', args: [] })
  }

  const totalCompleted = milestones.filter((m) => m.status === 3).length
  const totalMilestones = milestones.length
  const progressPct = totalMilestones > 0 ? (totalCompleted / totalMilestones) * 100 : 0

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          className="relative w-full max-w-lg mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden"
          style={{ background: 'rgba(13,27,47,0.97)', backdropFilter: 'blur(40px)', border: '1px solid var(--border)' }}
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-0.5 w-full"
            style={{ background: `linear-gradient(90deg, var(--accent-vivid) 0%, var(--accent-vivid) ${progressPct}%, var(--surface-muted) ${progressPct}%)` }} />

          <div className="px-6 pt-5 pb-7 max-h-[90dvh] overflow-y-auto">
            {/* header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--violet-muted)', color: 'var(--violet)' }}>
                    {totalCompleted}/{totalMilestones} milestones
                  </span>
                  {hasArbiter && (
                    <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
                      style={{ background: 'var(--violet-muted)', color: 'var(--violet)' }}>
                      <Shield className="w-2.5 h-2.5" />ERC-8183 Arbiter
                    </span>
                  )}
                </div>
                <h2 className="display text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  {job.jobTitle || `Job #${job.jobId}`}
                </h2>
              </div>
              <button onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors hover:bg-white/10 shrink-0"
                style={{ color: 'var(--subtle)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* amount hero */}
            <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--surface-muted)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Total Budget</p>
              <p className="display text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {formatAmount(job.totalAmount)} <span className="text-lg" style={{ color: 'var(--subtle)' }}>USDC</span>
              </p>
              {/* progress bar */}
              <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: 'var(--success)' }} />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
                {totalCompleted} of {totalMilestones} milestones completed
              </p>
            </div>

            {/* parties */}
            <div className="space-y-2 mb-4">
              {[
                { label: 'Client', addr: job.client },
                { label: 'Worker', addr: job.worker },
                ...(hasArbiter ? [{ label: 'Evaluator', addr: job.evaluator }] : []),
              ].map(({ label, addr }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <AgentBadge address={addr} label={label} />
                    {address?.toLowerCase() === addr.toLowerCase() && (
                      <span className="text-xs ml-20 mt-0.5 block" style={{ color: 'var(--accent)' }}>(you)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* milestones */}
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {milestones.map((m) => (
                  <MilestoneRow
                    key={m.milestoneId.toString()}
                    milestone={m}
                    job={job}
                    address={address}
                    onSuccess={() => { void refetch(); onAction() }}
                  />
                ))}
              </div>
            )}

            {/* withdraw */}
            {totalCompleted > 0 && (
              <button onClick={handleWithdraw} disabled={withdrawPending || withdrawConfirming}
                className="mt-4 w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                style={{ background: 'var(--violet)', color: '#fff' }}>
                {withdrawPending || withdrawConfirming
                  ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Withdrawing...</span>
                  : 'Withdraw Completed Milestone Funds'}
              </button>
            )}

            {withdrawHash && (
              <a href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, withdrawHash)} target="_blank" rel="noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
                <CheckCircle className="w-3 h-3" style={{ color: 'var(--success)' }} />View withdrawal on ArcScan
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
