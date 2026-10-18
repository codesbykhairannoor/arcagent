/**
 * ReputationPanel — ERC-8004 reputation write + read UI.
 *
 * Shown inside EscrowDetailModal when escrow is terminal (Completed/Refunded/Expired)
 * and the connected address is the CLIENT (feedback must come from a different wallet
 * than the agent — ERC-8004 rule).
 *
 * The panel has two modes:
 *   • "give feedback" — client submits a score 1–100 for the worker's agentId
 *   • "view score"    — read aggregate reputation summary for an agentId
 */
import { useState } from 'react'
import { Star, ChevronDown, ChevronUp, Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { keccak256, toBytes } from 'viem'
import { toast } from 'sonner'
import { ARC_TESTNET_CHAIN_ID } from './useEscrowData'
import {
  REPUTATION_REGISTRY,
  REPUTATION_ABI,
  useAgentClients,
  useReputationSummary,
} from './useReputation'
import { buildTxExplorerUrl } from '@/onchain-facts'

const EXPLORER = 'https://explorer.testnet.arc.io'

interface Props {
  /** Client's wallet — the caller of giveFeedback */
  clientAddress: `0x${string}`
  /** Worker's wallet (used to look up agentId) */
  workerAddress: `0x${string}`
  /** The escrow title — used as feedback context */
  escrowTitle: string
  /** Tag: 'job-completed' or 'job-refunded' */
  outcomeTag: 'job-completed' | 'job-refunded'
  chainId: number
}

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score))
  const color = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)'
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[20, 40, 60, 80, 100].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          onMouseEnter={() => setHover(v)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className="w-6 h-6"
            style={{
              fill: (hover || value) >= v ? 'var(--warning)' : 'transparent',
              color: (hover || value) >= v ? 'var(--warning)' : 'var(--subtle)',
            }}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReputationPanel({ escrowTitle, outcomeTag, chainId }: Props) {
  const { switchChain } = useSwitchChain()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  const [open, setOpen] = useState(false)
  const [agentIdInput, setAgentIdInput] = useState('')
  const [score, setScore] = useState(0)
  const [viewMode, setViewMode] = useState<'give' | 'view'>('give')

  const parsedAgentId = agentIdInput !== '' && /^\d+$/.test(agentIdInput)
    ? BigInt(agentIdInput) : undefined

  // For viewing: read all clients then summary
  const { clients } = useAgentClients(viewMode === 'view' ? parsedAgentId : undefined)
  const { count, score: summaryScore, isLoading: summaryLoading } =
    useReputationSummary(viewMode === 'view' ? parsedAgentId : undefined, clients)

  // For giving feedback
  const { writeContract: giveWriteContract, data: giveTxHash, isPending: givePending } = useWriteContract()
  const { isLoading: giveConfirming, isSuccess: giveSuccess } = useWaitForTransactionReceipt({ hash: giveTxHash })

  function handleGiveFeedback() {
    if (!parsedAgentId || score === 0) return
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }

    const body = JSON.stringify({ score, escrow: escrowTitle, outcome: outcomeTag })
    const feedbackHash = keccak256(toBytes(body))

    giveWriteContract({
      address: REPUTATION_REGISTRY,
      abi: REPUTATION_ABI,
      functionName: 'giveFeedback',
      args: [parsedAgentId, BigInt(score), 0, outcomeTag, '', '', '', feedbackHash],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  if (giveSuccess) {
    toast.success('Reputation score submitted onchain!')
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* header toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-white/5"
        style={{ background: open ? 'var(--surface)' : 'var(--surface-muted)' }}
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4" style={{ color: 'var(--warning)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>ERC-8004 Reputation</span>
          <span className="text-xs px-1.5 py-0.5 rounded-md" style={{ background: 'var(--violet-muted)', color: 'var(--violet)' }}>
            Onchain
          </span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--subtle)' }} />
               : <ChevronDown className="w-4 h-4" style={{ color: 'var(--subtle)' }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4" style={{ background: 'var(--surface)' }}>
          {/* mode switcher */}
          <div className="flex gap-1.5">
            {(['give', 'view'] as const).map((m) => (
              <button key={m} onClick={() => setViewMode(m)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: viewMode === m ? 'var(--violet-muted)' : 'var(--surface-muted)',
                  border: `1px solid ${viewMode === m ? 'var(--violet)' : 'var(--border)'}`,
                  color: viewMode === m ? 'var(--violet)' : 'var(--subtle)',
                }}>
                {m === 'give' ? 'Give Feedback' : 'View Score'}
              </button>
            ))}
          </div>

          {/* agent id input — shared */}
          <div>
            <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>
              Worker's ERC-8004 Agent ID
            </label>
            <div className="flex gap-2">
              <input
                value={agentIdInput}
                onChange={(e) => setAgentIdInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 42"
                className="mono flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
              />
              {parsedAgentId !== undefined && (
                <a
                  href={`${EXPLORER}/address/${REPUTATION_REGISTRY}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center justify-center w-10 h-10 rounded-xl"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--subtle)' }}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
              Worker registers their agent at{' '}
              <a href={`${EXPLORER}/address/0x8004A818BFB912233c491871b3d84c89A494BD9e`}
                target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--violet)' }}>
                Identity Registry
              </a>{' '}
              to get an ID.
            </p>
          </div>

          {viewMode === 'give' ? (
            /* ── GIVE FEEDBACK ── */
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--muted)' }}>
                  Score (1 star = 20, 5 stars = 100)
                </label>
                <StarRating value={score} onChange={setScore} />
                {score > 0 && (
                  <p className="text-xs mt-1 tabular-nums" style={{ color: 'var(--muted)' }}>
                    Score: {score}/100 · Tag: <span style={{ color: 'var(--violet)' }}>{outcomeTag}</span>
                  </p>
                )}
              </div>

              {giveSuccess ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
                  <CheckCircle className="w-4 h-4" />
                  Reputation submitted!
                  {giveTxHash && (
                    <a href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, giveTxHash)}
                      target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-xs"
                      style={{ color: 'var(--accent)' }}>
                      View tx <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleGiveFeedback}
                  disabled={!parsedAgentId || score === 0 || givePending || giveConfirming}
                  className="w-full rounded-2xl py-2.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--warning)', color: '#0d1b2f' }}
                >
                  {givePending
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm...</span>
                    : giveConfirming
                    ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Writing onchain...</span>
                    : <span className="flex items-center justify-center gap-1.5"><Star className="w-4 h-4" />Submit Score Onchain</span>}
                </button>
              )}

              <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                Score is written to Arc's ERC-8004 Reputation Registry (portable across all platforms).
                <br />Note: you cannot rate your own agent wallet.
              </p>
            </div>
          ) : (
            /* ── VIEW SCORE ── */
            <div className="space-y-3">
              {!parsedAgentId ? (
                <p className="text-xs" style={{ color: 'var(--subtle)' }}>Enter an agent ID above to view their score.</p>
              ) : summaryLoading ? (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />Loading reputation...
                </div>
              ) : summaryScore === null || count === 0n ? (
                <p className="text-xs" style={{ color: 'var(--subtle)' }}>No reputation data yet for agent #{agentIdInput}.</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-end justify-between">
                    <span className="display text-3xl font-black tabular-nums" style={{ color: 'var(--ink)' }}>
                      {summaryScore.toFixed(0)}
                      <span className="text-base font-normal ml-1" style={{ color: 'var(--subtle)' }}>/100</span>
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {count.toString()} rating{count === 1n ? '' : 's'}
                    </span>
                  </div>
                  <ScoreBar score={summaryScore} />
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                    Aggregate across {clients.length} client{clients.length === 1 ? '' : 's'} · ERC-8004 Registry
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
