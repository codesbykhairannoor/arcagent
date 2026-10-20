import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, CheckCircle, ExternalLink, Shield, BookmarkPlus, BookOpen, Trash2 } from 'lucide-react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi'
import { erc20Abi, isAddress } from 'viem'
import { toast } from 'sonner'
import { ESCROW_ADDRESS, ESCROW_ABI } from './EscrowABI'
import { useUsdcBalance, useUsdcAllowance, ARC_TESTNET_CHAIN_ID, formatAmount } from './useEscrowData'
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts'
import { useEscrowTemplates } from './useEscrowTemplates'

const USDC_ADDRESS = getUsdc(ARC_TESTNET_CHAIN_ID)!.address as `0x${string}`

interface Props {
  onClose: () => void
  onCreated: () => void
  initialWorker?: string
}

export default function CreateEscrowModal({ onClose, onCreated, initialWorker }: Props) {
  const { address, chainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const wrongChain = chainId !== ARC_TESTNET_CHAIN_ID

  const [worker, setWorker] = useState(initialWorker ?? '')
  const [evaluatorMode, setEvaluatorMode] = useState<'self' | 'custom'>('self')
  const [evaluatorAddr, setEvaluatorAddr] = useState('')
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [splitEnabled, setSplitEnabled] = useState(false)
  const [step, setStep] = useState<'approve' | 'create'>('approve')
  const [showTemplates, setShowTemplates] = useState(false)
  const [saveTemplateName, setSaveTemplateName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  const { templates, save: saveTemplate, remove: removeTemplate, apply: applyTemplate } = useEscrowTemplates()

  const { raw: balance, formatted: balanceFmt, refetch: refetchBalance } = useUsdcBalance(address)
  const { allowance, refetch: refetchAllowance } = useUsdcAllowance(address)

  const { writeContract: approve, data: approveHash, isPending: approvePending } = useWriteContract()
  const { isLoading: approveConfirming, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash })

  const { writeContract: create, data: createHash, isPending: createPending } = useWriteContract()
  const { isLoading: createConfirming, isSuccess: createSuccess } = useWaitForTransactionReceipt({ hash: createHash })

  useEffect(() => {
    if (approveSuccess) {
      void refetchAllowance()
      setStep('create')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [approveSuccess])

  useEffect(() => {
    if (createSuccess) {
      void refetchBalance()
      toast.success('Escrow created!')
      onCreated()
      onClose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createSuccess])

  function reset() {
    setWorker(''); setEvaluatorMode('self'); setEvaluatorAddr(''); setAmount('')
    setTitle(''); setDescription(''); setDeadline(''); setSplitEnabled(false); setStep('approve')
    setShowTemplates(false); setSaveTemplateName(''); setShowSaveInput(false)
  }

  function handleApplyTemplate(id: string) {
    const t = templates.find((x) => x.id === id)
    if (!t) return
    const fields = applyTemplate(t)
    setWorker(fields.worker)
    setEvaluatorMode(fields.evaluatorMode)
    setEvaluatorAddr(fields.evaluatorAddr)
    setDescription(fields.description)
    setSplitEnabled(fields.splitEnabled)
    setAmount(fields.amount)
    setDeadline(fields.deadline)
    setShowTemplates(false)
    toast.success(`Template "${t.name}" applied`)
  }

  function handleSaveTemplate() {
    if (!saveTemplateName.trim()) return
    saveTemplate(saveTemplateName.trim(), {
      worker, evaluatorMode, evaluatorAddr, description, splitEnabled,
      defaultAmount: amount || undefined,
      defaultDeadlineHours: undefined,
    })
    setSaveTemplateName('')
    setShowSaveInput(false)
    toast.success('Template saved!')
  }

  const cleanWorker = worker.trim()
  const cleanEvaluator = evaluatorMode === 'self'
    ? (address ?? '0x0000000000000000000000000000000000000000')
    : evaluatorAddr.trim()

  const isWorkerValid = isAddress(cleanWorker, { strict: false })
  const isEvaluatorValid = evaluatorMode === 'self' || isAddress(cleanEvaluator, { strict: false })

  const targetEscrowAddress = (chainId === 5042
    ? '0x65152f15482856ca9cf279e65696fa5e430ba9ac'
    : '0x761e00783fd733332a0506208413983e1e729493') as `0x${string}`

  function parsedAmount(): bigint | null {
    const n = parseFloat(amount)
    if (!isFinite(n) || n <= 0) return null
    return BigInt(Math.round(n * 1_000_000))
  }

  const overBalance = (() => {
    const amt = parsedAmount(); if (!amt || !balance) return false; return amt > balance
  })()

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nowMs = useMemo(() => Date.now(), [deadline])

  const formValid =
    isWorkerValid && !!parsedAmount() && !overBalance &&
    title.trim().length > 0 && deadline !== '' &&
    !isNaN(new Date(deadline).getTime()) &&
    new Date(deadline).getTime() > nowMs &&
    isEvaluatorValid &&
    (evaluatorMode === 'self' || cleanEvaluator.toLowerCase() !== cleanWorker.toLowerCase())

  const needsApprove = (() => { const amt = parsedAmount(); if (!amt) return false; return allowance < amt })()

  function handleApprove() {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    const amt = parsedAmount(); if (!amt) return
    try {
      approve({
        address: USDC_ADDRESS,
        abi: erc20Abi,
        functionName: 'approve',
        args: [targetEscrowAddress, amt],
      }, {
        onError: (err) => {
          toast.error(err.message?.slice(0, 80) ?? 'Approval failed in wallet')
        }
      })
    } catch (e: any) {
      toast.error(e?.message ?? 'Approval error')
    }
  }

  function handleCreate() {
    if (wrongChain) { switchChain({ chainId: ARC_TESTNET_CHAIN_ID }); return }
    const amt = parsedAmount(); if (!amt || !formValid) return
    const deadlineTs = BigInt(Math.floor(new Date(deadline).getTime() / 1000))
    const evalAddr = evaluatorMode === 'self'
      ? '0x0000000000000000000000000000000000000000' as `0x${string}`
      : cleanEvaluator as `0x${string}`
    try {
      create({
        address: targetEscrowAddress, abi: ESCROW_ABI, functionName: 'createEscrow',
        args: [cleanWorker as `0x${string}`, evalAddr, amt, title.trim(), description.trim(), deadlineTs, splitEnabled],
      }, {
        onError: (err) => {
          toast.error(err.message?.slice(0, 80) ?? 'Creation failed in wallet')
        }
      })
    } catch (e: any) {
      toast.error(e?.message ?? 'Creation error')
    }
  }

  const isLoading = approvePending || approveConfirming || createPending || createConfirming
  const steps = ['approve', 'create'] as const

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
          <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, var(--violet) 0%, var(--accent-vivid) 100%)' }} />

          <div className="px-6 pt-5 pb-7 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="display text-xl font-bold" style={{ color: 'var(--ink)' }}>New Escrow</h2>
                <p className="text-xs mt-0.5" style={{ color: 'var(--subtle)' }}>Fund work · assign evaluator · release on approval</p>
              </div>
              <button onClick={() => { reset(); onClose() }}
                className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors hover:bg-white/10"
                style={{ color: 'var(--subtle)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* template picker */}
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: showTemplates ? 'var(--violet-muted)' : 'var(--surface)',
                    border: `1px solid ${showTemplates ? 'var(--violet)' : 'var(--border)'}`,
                    color: showTemplates ? 'var(--violet)' : 'var(--subtle)',
                  }}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Templates {templates.length > 0 && `(${templates.length})`}
                </button>
                <button
                  onClick={() => { setShowSaveInput(!showSaveInput); setShowTemplates(false) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: showSaveInput ? 'var(--violet-muted)' : 'var(--surface)',
                    border: `1px solid ${showSaveInput ? 'var(--violet)' : 'var(--border)'}`,
                    color: showSaveInput ? 'var(--violet)' : 'var(--subtle)',
                  }}
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  Save as Template
                </button>
              </div>

              {/* save input */}
              {showSaveInput && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={saveTemplateName}
                    onChange={(e) => setSaveTemplateName(e.target.value)}
                    placeholder="Template name..."
                    className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                  />
                  <button
                    onClick={handleSaveTemplate}
                    disabled={!saveTemplateName.trim()}
                    className="px-3 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                    style={{ background: 'var(--violet)', color: '#fff' }}
                  >
                    Save
                  </button>
                </div>
              )}

              {/* template list */}
              {showTemplates && templates.length === 0 && (
                <p className="mt-2 text-xs" style={{ color: 'var(--subtle)' }}>No templates saved yet. Fill in a form and click "Save as Template".</p>
              )}
              {showTemplates && templates.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-40 overflow-y-auto">
                  {templates.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                      <button
                        onClick={() => handleApplyTemplate(t.id)}
                        className="flex-1 text-left text-xs font-semibold hover:opacity-80 transition-opacity"
                        style={{ color: 'var(--ink)' }}
                      >
                        {t.name}
                        <span className="ml-2 font-normal" style={{ color: 'var(--subtle)' }}>
                          {t.worker ? `${t.worker.slice(0, 8)}…` : 'no worker'}
                        </span>
                      </button>
                      <button onClick={() => removeTemplate(t.id)} className="shrink-0 hover:opacity-80">
                        <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--subtle)' }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* step indicator */}
            <div className="flex gap-2 mb-5">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                    style={{
                      background: step === s ? 'var(--violet)' : (i < steps.indexOf(step) ? 'var(--success)' : 'var(--surface-muted)'),
                      color: step === s || i < steps.indexOf(step) ? '#fff' : 'var(--subtle)',
                    }}>
                    {i < steps.indexOf(step) ? '✓' : i + 1}
                  </div>
                  <span className="text-xs" style={{ color: step === s ? 'var(--ink)' : 'var(--subtle)' }}>
                    {s === 'approve' ? 'Approve USDC' : 'Create'}
                  </span>
                  {i < 1 && <div className="w-8 h-px mx-1" style={{ background: 'var(--border)' }} />}
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Service Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Market research report on DeFi protocols"
                  className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
              </div>

              {/* Worker */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Worker Address</label>
                <input value={worker} onChange={(e) => setWorker(e.target.value)} placeholder="0x..."
                  className="mono w-full px-3 py-2.5 rounded-xl text-xs outline-none"
                  style={{ background: 'var(--surface)', border: `1px solid ${cleanWorker && !isWorkerValid ? 'var(--danger)' : 'var(--border)'}`, color: 'var(--ink)' }} />
              </div>

              {/* Evaluator */}
              <div>
                <label className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                  <Shield className="w-3 h-3" style={{ color: 'var(--violet)' }} />
                  Evaluator / Arbiter
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
                    style={{ background: 'var(--surface)', border: `1px solid ${evaluatorAddr.trim() && !isEvaluatorValid ? 'var(--danger)' : 'var(--border)'}`, color: 'var(--ink)' }} />
                )}
                <p className="text-xs mt-1.5" style={{ color: 'var(--subtle)' }}>
                  {evaluatorMode === 'self'
                    ? 'You approve or reject delivered work directly without third parties'
                    : 'Only the arbiter address can complete or reject · ERC-8183 pattern'}
                </p>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Escrow Amount</label>
                <div className="relative">
                  <input inputMode="decimal" value={amount}
                    onChange={(e) => { const v = e.target.value.replace(/[^0-9.]/g, ''); if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v) }}
                    placeholder="0.00"
                    className="display w-full px-3 pr-28 py-3 rounded-xl text-2xl font-bold tabular-nums outline-none"
                    style={{ background: 'var(--surface)', border: `1px solid ${overBalance ? 'var(--danger)' : 'var(--border)'}`, color: 'var(--ink)' }} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
                    <button onClick={() => balance && setAmount(formatAmount(balance))}
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{ background: 'var(--violet-muted)', color: 'var(--violet)' }}>MAX</button>
                  </div>
                </div>
                <p className="text-xs mt-1 tabular-nums" style={{ color: overBalance ? 'var(--danger)' : 'var(--subtle)' }}>
                  {overBalance ? 'Exceeds balance' : `Balance: ${balanceFmt ?? '0.00'} USDC`}
                </p>
              </div>

              {/* Description + Deadline */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Task Description</label>
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                    rows={3} placeholder="Describe the deliverables..."
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)' }} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>Deadline</label>
                  <input type="datetime-local" value={deadline}
                    min={new Date(nowMs + 60_000).toISOString().slice(0, 16)}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink)', colorScheme: 'dark' }} />
                </div>
              </div>

              {/* Split toggle */}
              <button onClick={() => setSplitEnabled(!splitEnabled)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
                style={{
                  background: splitEnabled ? 'var(--violet-muted)' : 'var(--surface)',
                  border: `1px solid ${splitEnabled ? 'var(--violet)' : 'var(--border)'}`,
                }}>
                <div className="text-left">
                  <p className="text-sm font-semibold" style={{ color: splitEnabled ? 'var(--violet)' : 'var(--ink)' }}>Protocol Protection</p>
                  <p className="text-xs" style={{ color: 'var(--subtle)' }}>Automated on-chain escrow & arbitration coverage</p>
                </div>
                <div className="w-10 h-5 rounded-full relative transition-all"
                  style={{ background: splitEnabled ? 'var(--violet)' : 'var(--surface-muted)' }}>
                  <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: splitEnabled ? '1.35rem' : '0.125rem' }} />
                </div>
              </button>

              {!formValid && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 font-medium text-center">
                  {!isWorkerValid ? '⚠️ Masukkan alamat Worker (0x...) yang valid' :
                   !parsedAmount() ? '⚠️ Masukkan jumlah USDC' :
                   overBalance ? '⚠️ Jumlah melebihi saldo dompet' :
                   title.trim().length === 0 ? '⚠️ Masukkan judul tugas' :
                   deadline === '' || isNaN(new Date(deadline).getTime()) || new Date(deadline).getTime() <= nowMs ? '⚠️ Pilih tanggal deadline masa depan' :
                   !isEvaluatorValid ? '⚠️ Alamat Evaluator / Arbiter tidak valid' :
                   '⚠️ Mohon lengkapi formulir'}
                </div>
              )}

              {/* Action buttons */}
              {step === 'approve' ? (
                needsApprove ? (
                  <button onClick={handleApprove} disabled={!formValid || isLoading}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--violet)', color: '#fff' }}>
                    {wrongChain ? 'Switch to Arc Testnet'
                      : approvePending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet...</span>
                      : approveConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirming...</span>
                      : 'Approve USDC'}
                  </button>
                ) : (
                  <button onClick={() => setStep('create')} disabled={!formValid}
                    className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: 'var(--accent)', color: '#0d1b2f' }}>
                    Already Approved (Continue)
                  </button>
                )
              ) : (
                <button onClick={handleCreate} disabled={!formValid || isLoading}
                  className="w-full rounded-2xl py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--accent)', color: '#0d1b2f' }}>
                  {wrongChain ? 'Switch to Arc Testnet'
                    : createPending ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet...</span>
                    : createConfirming ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating escrow...</span>
                    : 'Create Escrow'}
                </button>
              )}

              {/* receipts */}
              {approveHash && (
                <a href={buildTxExplorerUrl(ARC_TESTNET_CHAIN_ID, approveHash)} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs"
                  style={{ color: 'var(--accent)' }}>
                  <CheckCircle className="w-3 h-3" style={{ color: 'var(--success)' }} />
                  Approval confirmed · View tx
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
