import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Loader2, CheckCircle, Link2, Shield, AlertTriangle, Clock } from 'lucide-react'
// buildAddressExplorerUrl removed — AgentBadge handles address links internally
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { keccak256, toBytes } from 'viem'
import { toast } from 'sonner'
import { ESCROW_ADDRESS, ESCROW_ABI } from './EscrowABI'
import { type EscrowData, statusLabel, statusColor, formatAmount, ARC_TESTNET_CHAIN_ID } from './useEscrowData'
import { buildTxExplorerUrl } from '@/onchain-facts'
import ReputationPanel from './ReputationPanel'
import DeliveryVerifier from './DeliveryVerifier'
import AgentBadge from './AgentBadge'

interface Props {
  escrow: EscrowData | null
  onClose: () => void
  onAction: () => void
}


export default function EscrowDetailModal({ escrow, onClose, onAction }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  const [proofInput, setProofInput] = useState('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [escrow?.id])

  // submit delivery
  const { writeContract: submitTx, data: submitHash, isPending: submitPending } = useWriteContract()
  const { isLoading: submitConfirming, isSuccess: submitSuccess } = useWaitForTransactionReceipt({ hash: submitHash })

  // complete escrow
  const { writeContract: completeTx, data: completeHash, isPending: completePending } = useWriteContract()
  const { isLoading: completeConfirming, isSuccess: completeSuccess } = useWaitForTransactionReceipt({ hash: completeHash })

  // refund client
  const { writeContract: refundTx, data: refundHash, isPending: refundPending } = useWriteContract()
  const { isLoading: refundConfirming, isSuccess: refundSuccess } = useWaitForTransactionReceipt({ hash: refundHash })

  // raise dispute
  const { writeContract: disputeTx, data: disputeHash, isPending: disputePending } = useWriteContract()
  const { isLoading: disputeConfirming, isSuccess: disputeSuccess } = useWaitForTransactionReceipt({ hash: disputeHash })

  // auto expire
  const { writeContract: expireTx, data: expireHash, isPending: expirePending } = useWriteContract()
  const { isLoading: expireConfirming, isSuccess: expireSuccess } = useWaitForTransactionReceipt({ hash: expireHash })

  // withdraw
  const { writeContract: withdrawTx, data: withdrawHash, isPending: withdrawPending } = useWriteContract()
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash })

  const anySuccess = submitSuccess || completeSuccess || refundSuccess || disputeSuccess || expireSuccess || withdrawSuccess

  useEffect(() => {
    if (anySuccess) {
      toast.success('Transaction confirmed!')
      onAction()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anySuccess])

  if (!escrow) return null

  const isClient = address?.toLowerCase() === escrow.client.toLowerCase()
  const isWorker = address?.toLowerCase() === escrow.worker.toLowerCase()
  const isEvaluator = address?.toLowerCase() === escrow.evaluator.toLowerCase()
  const hasArbiter = escrow.evaluator.toLowerCase() !== escrow.client.toLowerCase()
  const status = statusLabel(escrow.status)
  const color = statusColor(escrow.status)
  const deadlineDate = new Date(Number(escrow.deadline) * 1000)
  const pastDeadline = now > deadlineDate.getTime()
  const amountFormatted = formatAmount(escrow.amount)

  // Status codes: 0=Funded 1=Submitted 2=Disputed 3=Completed 4=Refunded 5=Expired
  const isFunded = escrow.status === 0
  const isSubmitted = escrow.status === 1
  const isDisputed = escrow.status === 2
  const isTerminal = escrow.status >= 3

  function switchOrRun(fn: () => void) {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    fn()
  }

  function handleSubmit() {
    if (!proofInput.trim() || !escrow) return
    const hash = keccak256(toBytes(proofInput.trim()))
    const eid = escrow.id
    switchOrRun(() => submitTx({
      address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: 'submitDelivery',
      args: [eid, proofInput.trim(), hash],
    }))
  }

  function handleComplete() {
    if (!escrow) return
    const eid = escrow.id
    switchOrRun(() => completeTx({
      address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: 'completeEscrow',
      args: [eid, '0x0000000000000000000000000000000000000000000000000000000000000000'],
    }))
  }

  function handleRefund() {
    if (!escrow) return
    const eid = escrow.id
    switchOrRun(() => refundTx({
      address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: 'refundClient',
      args: [eid, '0x0000000000000000000000000000000000000000000000000000000000000000'],
    }))
  }

  function handleDispute() {
    if (!escrow) return
    const eid = escrow.id
    switchOrRun(() => disputeTx({
      address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: 'raiseDispute',
      args: [eid],
    }))
  }

  function handleAutoExpire() {
    if (!escrow) return
    const eid = escrow.id
    switchOrRun(() => expireTx({
      address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: 'autoExpire',
      args: [eid],
    }))
  }

  function handleWithdraw() {
    switchOrRun(() => withdrawTx({
      address: ESCROW_ADDRESS, abi: ESCROW_ABI, functionName: 'withdraw', args: [],
    }))
  }

  const anyPending = submitPending || submitConfirming || completePending || completeConfirming ||
    refundPending || refundConfirming || disputePending || disputeConfirming ||
    expirePending || expireConfirming || withdrawPending || withdrawConfirming

  const latestHash = withdrawHash ?? expireHash ?? disputeHash ?? refundHash ?? completeHash ?? submitHash

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <motion.div
          className="relative w-full max-w-lg mx-auto rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: 'var(--bg-secondary)', backdropFilter: 'blur(40px)', border: '1px solid var(--border)' }}
          initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* status strip */}
          <div className="h-0.5 w-full transition-all" style={{ background: color }} />

          <div className="px-6 pt-5 pb-7 max-h-[90dvh] overflow-y-auto">
            {/* header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                    {status}
                  </span>
                  {hasArbiter && (
                    <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
                      style={{ background: 'var(--violet-muted)', color: 'var(--violet)' }}>
                      <Shield className="w-2.5 h-2.5" />ERC-8183 Arbiter
                    </span>
                  )}
                  {isDisputed && (
                    <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md"
                      style={{ background: 'rgba(232,109,122,0.15)', color: 'var(--danger)' }}>
                      <AlertTriangle className="w-3 h-3" />Under Dispute
                    </span>
                  )}
                </div>
                <h2 className="display text-lg font-bold leading-tight" style={{ color: 'var(--ink)' }}>
                  {escrow.title || `Escrow #${escrow.id}`}
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
              <p className="text-xs mb-1" style={{ color: 'var(--subtle)' }}>Escrowed</p>
              <p className="display text-3xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {amountFormatted} <span className="text-lg" style={{ color: 'var(--subtle)' }}>USDC</span>
              </p>
              {escrow.splitEnabled && (
                <p className="text-xs mt-1" style={{ color: 'var(--violet)' }}>Protocol split enabled · 90% worker / 10% treasury</p>
              )}
            </div>

            {/* parties */}
            <div className="space-y-2 mb-4">
              {[
                { label: 'Client', addr: escrow.client, isMe: isClient },
                { label: 'Worker', addr: escrow.worker, isMe: isWorker },
                ...(hasArbiter ? [{ label: 'Evaluator', addr: escrow.evaluator, isMe: isEvaluator }] : []),
              ].map(({ label, addr, isMe }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <AgentBadge address={addr} label={label} />
                    {isMe && <span className="text-xs ml-20 mt-0.5 block" style={{ color: 'var(--accent)' }}>(you)</span>}
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold w-20" style={{ color: 'var(--subtle)' }}>Deadline</span>
                <span className="text-xs flex items-center gap-1"
                  style={{ color: pastDeadline && !isTerminal ? 'var(--danger)' : 'var(--muted)' }}>
                  <Clock className="w-3 h-3" />
                  {deadlineDate.toLocaleString()}
                  {pastDeadline && !isTerminal && ' · Overdue'}
                </span>
              </div>
            </div>

            {/* description */}
            {escrow.description && (
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{escrow.description}</p>
            )}

            {/* delivery proof */}
            {escrow.deliveryProof && (
              <div className="rounded-xl p-3 mb-3" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: 'var(--subtle)' }}>Delivery Proof</p>
                <a href={escrow.deliveryProof.startsWith('http') ? escrow.deliveryProof : `https://ipfs.io/ipfs/${escrow.deliveryProof}`}
                  target="_blank" rel="noreferrer"
                  className="mono text-xs flex items-center gap-1 break-all"
                  style={{ color: 'var(--accent)' }}>
                  <Link2 className="w-3 h-3 shrink-0" />
                  {escrow.deliveryProof}
                </a>
                {escrow.deliveryHash && escrow.deliveryHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
                  <p className="mono text-xs mt-1 break-all" style={{ color: 'var(--subtle)' }}>
                    hash: {escrow.deliveryHash.slice(0, 18)}…
                  </p>
                )}
              </div>
            )}

            {/* delivery hash verifier */}
            {escrow.deliveryHash && escrow.deliveryHash !== '0x0000000000000000000000000000000000000000000000000000000000000000' && (
              <div className="mb-4">
                <DeliveryVerifier onchainHash={escrow.deliveryHash} />
              </div>
            )}

            {/* dispute info panel */}
            {isDisputed && (
              <div className="rounded-xl p-3 mb-4" style={{ background: 'rgba(232,109,122,0.08)', border: '1px solid rgba(232,109,122,0.3)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                  <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Dispute Active</p>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {hasArbiter
                    ? 'Only the assigned evaluator can now complete or refund this escrow.'
                    : 'You are both client and evaluator — you can complete or refund.'}
                </p>
              </div>
            )}

            {/* ── Action buttons ── */}
            <div className="space-y-2">

              {/* Worker: submit delivery */}
              {isWorker && isFunded && (
                <div className="space-y-2">
                  <input value={proofInput} onChange={(e) => setProofInput(e.target.value)}
                    placeholder="IPFS CID or delivery URL..."
                    className="mono w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
                  <button onClick={handleSubmit} disabled={!proofInput.trim() || anyPending}
                    className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--accent)', color: '#0d1b2f' }}>
                    {submitPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm...</span>
                      : submitConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Submitting...</span>
                      : 'Submit Delivery'}
                  </button>
                </div>
              )}

              {/* Client or Evaluator: complete when Submitted */}
              {(isClient || isEvaluator) && isSubmitted && (
                <button onClick={handleComplete} disabled={anyPending}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                  style={{ background: 'var(--success)', color: '#0d1b2f' }}>
                  {completePending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm...</span>
                    : completeConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Releasing funds...</span>
                    : 'Release Funds'}
                </button>
              )}

              {/* Evaluator only: complete when Disputed */}
              {isEvaluator && isDisputed && (
                <button onClick={handleComplete} disabled={anyPending}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                  style={{ background: 'var(--success)', color: '#0d1b2f' }}>
                  {completePending || completeConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Releasing...</span>
                    : 'Rule: Release to Worker'}
                </button>
              )}

              {/* Evaluator: refund when Disputed. Client: refund when Funded */}
              {((isClient && isFunded) || (isEvaluator && isDisputed)) && (
                <button onClick={handleRefund} disabled={anyPending}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                  style={{ background: 'var(--surface)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                  {refundPending || refundConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Refunding...</span>
                    : isEvaluator && isDisputed ? 'Rule: Refund Client' : 'Refund (Cancel)'}
                </button>
              )}

              {/* Client: raise dispute when Submitted */}
              {isClient && isSubmitted && (
                <button onClick={handleDispute} disabled={anyPending}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                  style={{ background: 'rgba(232,109,122,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
                  {disputePending || disputeConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Raising dispute...</span>
                    : <span className="flex items-center justify-center gap-1.5"><AlertTriangle className="w-4 h-4" />Raise Dispute</span>}
                </button>
              )}

              {/* Anyone: auto-expire when Submitted + past deadline (not disputed) */}
              {isSubmitted && pastDeadline && (
                <button onClick={handleAutoExpire} disabled={anyPending}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                  {expirePending || expireConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Processing...</span>
                    : 'Auto-Release (Deadline Passed)'}
                </button>
              )}

              {/* Withdraw queued funds */}
              {isTerminal && (isWorker || isClient) && (
                <button onClick={handleWithdraw} disabled={anyPending}
                  className="w-full rounded-2xl py-3 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                  style={{ background: 'var(--violet)', color: '#fff' }}>
                  {withdrawPending || withdrawConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Withdrawing...</span>
                    : 'Withdraw Funds'}
                </button>
              )}
            </div>

            {/* tx receipt */}
            {latestHash && (
              <a href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, latestHash)} target="_blank" rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 text-xs"
                style={{ color: 'var(--accent)' }}>
                <CheckCircle className="w-3 h-3" style={{ color: 'var(--success)' }} />
                View transaction on ArcScan
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

            {/* ERC-8004 reputation — shown to client after terminal state */}
            {isTerminal && isClient && (
              <div className="mt-4">
                <ReputationPanel
                  clientAddress={address}
                  workerAddress={escrow.worker}
                  escrowTitle={escrow.title || `Escrow #${escrow.id}`}
                  outcomeTag={escrow.status === 3 ? 'job-completed' : 'job-refunded'}
                  chainId={chainId ?? ARC_TESTNET_CHAIN_ID}
                />
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
