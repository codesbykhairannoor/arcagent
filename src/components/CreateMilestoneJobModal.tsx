/**
 * CreateMilestoneJobModal — multi-milestone job creation UI
 * Supports up to 20 milestones, each with title, USDC amount, description, deadline.
 * Two-step: approve total USDC → create job.
 */
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Loader2, CheckCircle, ExternalLink, Shield, ChevronDown, ChevronUp } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { toast } from 'sonner'
import { MILESTONE_ADDRESS, MILESTONE_ABI } from './MilestoneABI'
import { useUsdcBalance, ARC_TESTNET_CHAIN_ID } from './useEscrowData'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'

const USDC_ADDRESS = getUsdc(ARC_TESTNET_CHAIN_ID)!.address as `0x${string}`
const MAX_MILESTONES = 20

interface MilestoneForm {
  title: string
  amount: string
  description: string
  deadline: string
}

function emptyMilestone(): MilestoneForm {
  return { title: '', amount: '', description: '', deadline: '' }
}

interface Props {
  onClose: () => void
  onCreated: () => void
}

export default function CreateMilestoneJobModal({ onClose, onCreated }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  const [worker, setWorker] = useState('')
  const [evaluatorMode, setEvaluatorMode] = useState<'self' | 'custom'>('self')
  const [evaluatorAddr, setEvaluatorAddr] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [milestones, setMilestones] = useState<MilestoneForm[]>([emptyMilestone(), emptyMilestone()])
  const [expanded, setExpanded] = useState<number | null>(0)
  const [step, setStep] = useState<'approve' | 'create'>('approve')

  const nowMs = useMemo(() => Date.now(), [])
  const { raw: balance, formatted: balanceFmt, refetch: refetchBalance } = useUsdcBalance(address)

  // Allowance check specifically for MILESTONE_ADDRESS spender
  const { data: milestoneAllowance, refetch: refetchMilestoneAllowance } = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'allowance',
    args: address ? [address, MILESTONE_ADDRESS] : undefined,
    query: { enabled: !!address }, chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { writeContract: approve, data: approveHash, isPending: approvePending } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  const { writeContract: create, data: createHash, isPending: createPending } = useWriteContract()
  const { isLoading: createConfirming, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createHash })

  useEffect(() => {
    if (approveSuccess) { void refetchMilestoneAllowance(); setStep('create') }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveSuccess])

  useEffect(() => {
    if (createSuccess) { void refetchBalance(); toast.success('Job created!'); onCreated(); onClose() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSuccess])

  function parseMilestoneAmount(s: string): bigint | null {
    const n = parseFloat(s)
    if (!isFinite(n) || n <= 0) return null
    return BigInt(Math.round(n * 1_000_000))
  }

  const totalAmount: bigint = milestones.reduce((acc, m) => {
    const a = parseMilestoneAmount(m.amount)
    return a ? acc + a : acc
  }, 0n)

  const overBalance = balance !== undefined && totalAmount > balance

  const milestonesValid = milestones.every((m) =>
    m.title.trim().length > 0 &&
    parseMilestoneAmount(m.amount) !== null &&
    m.deadline !== '' &&
    new Date(m.deadline).getTime() > nowMs
  )

  const formValid =
    isAddress(worker) &&
    jobTitle.trim().length > 0 &&
    milestones.length >= 1 &&
    milestonesValid && !overBalance &&
    (evaluatorMode === 'self' || (isAddress(evaluatorAddr) && evaluatorAddr.toLowerCase() !== worker.toLowerCase()))

  const needsApprove = (milestoneAllowance ?? 0n) < totalAmount

  function handleApprove() {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    if (totalAmount === 0n) return
    approve({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve', args: [MILESTONE_ADDRESS, totalAmount] })
  }

  function handleCreate() {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    if (!formValid) return
    const evalAddr = evaluatorMode === 'self'
      ? '0x0000000000000000000000000000000000000000' as `0x${string}`
      : evaluatorAddr as `0x${string}`

    const milestoneInputs = milestones.map((m) => ({
      amount: parseMilestoneAmount(m.amount)!,
      title: m.title,
      description: m.description,
      deadline: BigInt(Math.floor(new Date(m.deadline).getTime() / 1000)),
    }))

    create({
      address: MILESTONE_ADDRESS, abi: MILESTONE_ABI, functionName: 'createJob',
      args: [
        { worker: worker, evaluator: evalAddr, jobTitle, splitEnabled },
        milestoneInputs,
      ],
    })
  }

  function addMilestone() {
    if (milestones.length >= MAX_MILESTONES) return
    setMilestones([...milestones, emptyMilestone()])
    setExpanded(milestones.length)
  }

  function removeMilestone(i: number) {
    if (milestones.length <= 1) return
    setMilestones(milestones.filter((_, idx) => idx !== i))
    setExpanded(null)
  }

  function updateMilestone(i: number, field: keyof MilestoneForm, value: string) {
    setMilestones(milestones.map((m, idx) => idx === i ? { ...m, [field]: value } : m))
  }

  const isLoading = approvePending || approveConfirming || createPending || createConfirming

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
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, var(--accent-vivid) 0%, var(--violet) 100%)' }} />

          <div className="px-6 pt-5 pb-7 max-h-[90dvh] overflow-y-auto">
            {/* header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>New Multi-Milestone Job</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>
                  Up to {MAX_MILESTONES} milestones · ERC-8183 aligned · USDC released per milestone
                </p>
              </div>
              <button onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors hover:bg-white/10"
                style={{ color: 'var(--subtle)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Job title */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Job Title</label>
                <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Full DeFi protocol audit — 3 phases"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
              </div>

              {/* Worker */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Worker Address</label>
                <input value={worker} onChange={(e) => setWorker(e.target.value)} placeholder="0x..."
                  className="mono w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--surface)', border: `1px solid ${worker && !isAddress(worker) ? 'var(--danger)' : 'var(--border)'}`, color: 'var(--ink)' }} />
              </div>

              {/* Evaluator */}
              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                  <Shield className="w-3 h-3" style={{ color: 'var(--violet)' }} />Evaluator / Arbiter
                </label>
                <div className="flex gap-2 mb-2">
                  {(['self', 'custom'] as const).map((m) => (
                    <button key={m} onClick={() => setEvaluatorMode(m)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: evaluatorMode === m ? 'var(--violet-muted)' : 'var(--surface)',
                        border: `1px solid ${evaluatorMode === m ? 'var(--violet)' : 'var(--border)'}`,
                        color: evaluatorMode === m ? 'var(--violet)' : 'var(--subtle)',
                      }}>
                      {m === 'self' ? 'I am the evaluator' : 'Third-party arbiter'}
                    </button>
                  ))}
                </div>
                {evaluatorMode === 'custom' && (
                  <input value={evaluatorAddr} onChange={(e) => setEvaluatorAddr(e.target.value)}
                    placeholder="Arbiter address 0x..."
                    className="mono w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--surface)', border: `1px solid ${evaluatorAddr && !isAddress(evaluatorAddr) ? 'var(--danger)' : 'var(--border)'}`, color: 'var(--ink)' }} />
                )}
              </div>

              {/* Milestones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    Milestones ({milestones.length}/{MAX_MILESTONES})
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold tabular-nums" style={{ color: 'var(--violet)' }}>
                      Total: {(Number(totalAmount) / 1_000_000).toFixed(2)} USDC
                    </span>
                    {overBalance && <span className="text-xs" style={{ color: 'var(--danger)' }}>Exceeds balance</span>}
                  </div>
                </div>

                <div className="space-y-2">
                  {milestones.map((m, i) => (
                    <div key={i} className="rounded-2xl overflow-hidden"
                      style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <button
                        onClick={() => setExpanded(expanded === i ? null : i)}
                        className="w-full flex items-center gap-2 px-3 py-2.5 transition-colors hover:bg-white/5"
                      >
                        <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ background: m.title ? 'var(--violet)' : 'var(--surface-muted)', color: m.title ? '#fff' : 'var(--subtle)' }}>
                          {i + 1}
                        </span>
                        <span className="flex-1 text-xs text-left truncate" style={{ color: m.title ? 'var(--ink)' : 'var(--subtle)' }}>
                          {m.title || `Milestone ${i + 1}`}
                        </span>
                        {m.amount && <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>{m.amount} USDC</span>}
                        {milestones.length > 1 && (
                          <button onClick={(e) => { e.stopPropagation(); removeMilestone(i) }}
                            className="p-1 rounded-lg transition-colors hover:bg-white/10"
                            style={{ color: 'var(--subtle)' }}>
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                        {expanded === i
                          ? <ChevronUp className="w-3 h-3 shrink-0" style={{ color: 'var(--subtle)' }} />
                          : <ChevronDown className="w-3 h-3 shrink-0" style={{ color: 'var(--subtle)' }} />}
                      </button>

                      {expanded === i && (
                        <div className="px-3 pb-3 space-y-2 pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                          <input value={m.title} onChange={(e) => updateMilestone(i, 'title', e.target.value)}
                            placeholder="Milestone title"
                            className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
                          <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                              <input inputMode="decimal" value={m.amount}
                                onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); updateMilestone(i, 'amount', v) }}
                                placeholder="0.00"
                                className="display w-full px-3 pr-16 py-2 rounded-xl text-lg font-bold tabular-nums outline-none"
                                style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
                            </div>
                            <input type="datetime-local" value={m.deadline}
                              min={new Date(nowMs + 60_000).toISOString().slice(0, 16)}
                              onChange={(e) => updateMilestone(i, 'deadline', e.target.value)}
                              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)', colorScheme: 'dark' }} />
                          </div>
                          <textarea value={m.description} onChange={(e) => updateMilestone(i, 'description', e.target.value)}
                            rows={2} placeholder="Deliverables for this milestone..."
                            className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none"
                            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {milestones.length < MAX_MILESTONES && (
                  <button onClick={addMilestone}
                    className="mt-2 w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-colors hover:bg-white/5"
                    style={{ border: '1px dashed var(--border)', color: 'var(--subtle)' }}>
                    <Plus className="w-3 h-3" />Add Milestone
                  </button>
                )}
              </div>

              {/* Split toggle */}
              <button onClick={() => setSplitEnabled(!splitEnabled)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: splitEnabled ? 'var(--violet-muted)' : 'var(--surface)',
                  border: `1px solid ${splitEnabled ? 'var(--violet)' : 'var(--border)'}`,
                }}>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: splitEnabled ? 'var(--violet)' : 'var(--ink)' }}>Protocol Split</p>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>90% Worker · 10% Treasury per milestone</p>
                </div>
                <div className="w-10 h-5 rounded-full relative transition-all"
                  style={{ background: splitEnabled ? 'var(--violet)' : 'var(--surface-muted)' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: splitEnabled ? '1.35rem' : '0.125rem' }} />
                </div>
              </button>

              {/* Balance info */}
              <p className="text-xs tabular-nums" style={{ color: overBalance ? 'var(--danger)' : 'var(--subtle)' }}>
                {overBalance ? 'Total exceeds balance' : `Wallet: ${balanceFmt ?? '—'} USDC`}
              </p>

              {/* Step indicator + action */}
              <div className="flex gap-2 mb-2">
                {(['approve', 'create'] as const).map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{
                        background: step === s ? 'var(--violet)' : (i < (['approve', 'create']).indexOf(step) ? 'var(--success)' : 'var(--surface-muted)'),
                        color: step === s || i < (['approve', 'create']).indexOf(step) ? '#fff' : 'var(--subtle)',
                      }}>
                      {i < (['approve', 'create']).indexOf(step) ? '✓' : i + 1}
                    </div>
                    <span className="text-xs" style={{ color: step === s ? 'var(--ink)' : 'var(--subtle)' }}>
                      {s === 'approve' ? 'Approve USDC' : 'Create Job'}
                    </span>
                    {i < 1 && <div className="w-8 h-px mx-1" style={{ background: 'var(--border)' }} />}
                  </div>
                ))}
              </div>

              {step === 'approve' ? (
                needsApprove ? (
                  <button onClick={handleApprove} disabled={!formValid || isLoading || totalAmount === 0n}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--violet)', color: '#fff' }}>
                    {wrongChain ? 'Switch to Arc Testnet'
                      : approvePending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet...</span>
                      : approveConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirming...</span>
                      : `Approve ${(Number(totalAmount) / 1_000_000).toFixed(2)} USDC`}
                  </button>
                ) : (
                  <button onClick={() => setStep('create')} disabled={!formValid}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40"
                    style={{ background: 'var(--accent)', color: '#0d1b2f' }}>
                    Already Approved — Continue
                  </button>
                )
              ) : (
                <button onClick={handleCreate} disabled={!formValid || isLoading}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#0d1b2f' }}>
                  {wrongChain ? 'Switch to Arc Testnet'
                    : createPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet...</span>
                    : createConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating job...</span>
                    : `Create ${milestones.length}-Milestone Job`}
                </button>
              )}

              {approveHash && (
                <a href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, approveHash)} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs" style={{ color: 'var(--accent)' }}>
                  <CheckCircle className="w-3 h-3" style={{ color: 'var(--success)' }} />
                  Approval confirmed · View tx <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
