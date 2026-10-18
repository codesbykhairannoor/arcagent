import { useState } from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  Hash,
  ExternalLink,
  Search,
  FileCheck,
  Lock,
  Copy,
  Check,
  Terminal,
  Sparkles,
} from 'lucide-react'
import { keccak256, toBytes } from 'viem'
import { useReadContract } from 'wagmi'
import { ESCROW_ADDRESS, ESCROW_ABI } from '../components/EscrowABI'
import { ARC_TESTNET_CHAIN_ID } from '../components/useEscrowData'
import { toast } from 'sonner'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

const SAMPLE_DELIVERABLE_VALID = `### ArcPact Smart Contract Audit Report
Version: 1.0.0
Commit: 8f4a21e0b9c372

Findings:
- Reentrancy: None detected
- Transient Storage: Compliant with EIP-1153
- Gas Optimization: 14% reduction achieved via packed struct layout.

Status: APPROVED for production deployment.`

export default function VerifierPage() {
  const [escrowIdQuery, setEscrowIdQuery] = useState('1')
  const [activeLookupId, setActiveLookupId] = useState<bigint | null>(1n)
  const [deliverableText, setDeliverableText] = useState(SAMPLE_DELIVERABLE_VALID)
  const [manualHash, setManualHash] = useState('')
  const [copiedHash, setCopiedHash] = useState(false)

  // Fetch escrow data if ID is entered
  const { data: escrowData, isLoading: escrowLoading } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEscrow',
    args: activeLookupId ? [activeLookupId] : undefined,
    query: { enabled: !!activeLookupId },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  // Target hash from on-chain struct or manual input
  const targetOnChainHash =
    escrowData?.deliveryHash && escrowData.deliveryHash !== ZERO_HASH
      ? escrowData.deliveryHash
      : manualHash.trim().startsWith('0x')
      ? (manualHash.trim() as `0x${string}`)
      : null

  // Compute local hash
  const computedHash = deliverableText.trim() ? keccak256(toBytes(deliverableText.trim())) : null

  const isMatch =
    computedHash !== null &&
    targetOnChainHash !== null &&
    computedHash.toLowerCase() === targetOnChainHash.toLowerCase()

  const isMismatch =
    computedHash !== null &&
    targetOnChainHash !== null &&
    computedHash.toLowerCase() !== targetOnChainHash.toLowerCase()

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    if (!escrowIdQuery.trim() || isNaN(Number(escrowIdQuery))) {
      toast.error('Please enter a valid numeric Escrow ID')
      return
    }
    setActiveLookupId(BigInt(escrowIdQuery.trim()))
  }

  const handleCopyComputed = () => {
    if (!computedHash) return
    void navigator.clipboard.writeText(computedHash)
    setCopiedHash(true)
    toast.success('Computed keccak256 hash copied to clipboard')
    setTimeout(() => setCopiedHash(false), 2000)
  }

  const handleSetPresetMatch = () => {
    setDeliverableText(SAMPLE_DELIVERABLE_VALID)
    if (computedHash) {
      setManualHash(computedHash)
      toast.info('Applied sample deliverable matching expected hash')
    }
  }

  const handleSetPresetMismatch = () => {
    setDeliverableText(SAMPLE_DELIVERABLE_VALID + '\n\n// Tampered data inserted by third party')
    toast.warning('Applied tampered sample deliverable')
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-10 flex-1 transition-colors duration-200">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 mb-3 shadow-sm">
          <FileCheck className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
          <span>Zero-Trust Cryptographic Audit Engine</span>
        </div>
        <h1 className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Delivery Proof Verifier
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1.5 leading-relaxed">
          Cryptographically verify AI agent and worker deliverables against immutable on-chain commitments. All hashes are calculated locally in your browser sandbox using Viem Keccak-256.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Verification Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Step 1: Query or Manual Hash */}
          <div className="spatial-bento p-6 sm:p-7 rounded-3xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                  <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span>Step 1: On-Chain Escrow Query</span>
              </h3>
              <span className="mono text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]">
                Arc Testnet (5042002)
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Query the <code className="text-cyan-600 dark:text-cyan-300 font-mono">ArcAgentEscrow</code> smart contract directly for the locked <code className="text-purple-600 dark:text-purple-300 font-mono">deliveryHash</code> bytes32 commitment.
            </p>

            <form onSubmit={handleLookup} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={escrowIdQuery}
                  onChange={(e) => setEscrowIdQuery(e.target.value)}
                  placeholder="Enter Escrow ID (e.g. 1)"
                  className="w-full px-4 py-3 rounded-xl text-xs bg-slate-50 dark:bg-[#020512] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60 font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={escrowLoading}
                className="px-5 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/20 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {escrowLoading ? 'Querying...' : 'Query Contract'}
              </button>
            </form>

            {/* Quick Preset Escrow IDs */}
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <span>Quick Query:</span>
              {[1, 2, 3].map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setEscrowIdQuery(id.toString())
                    setActiveLookupId(BigInt(id))
                  }}
                  className="px-2.5 py-0.5 rounded-lg font-mono bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06] transition-colors"
                >
                  Escrow #{id}
                </button>
              ))}
            </div>

            {escrowData && (
              <div className="p-4 rounded-2xl bg-slate-900/[0.03] dark:bg-[#020512] border border-slate-200 dark:border-white/[0.08] space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-white/[0.06]">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Escrow Title</span>
                  <span className="font-bold text-slate-900 dark:text-white">{escrowData.title}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Assigned Worker</span>
                  <span className="mono text-slate-800 dark:text-slate-300 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded">
                    {escrowData.worker.slice(0, 10)}…{escrowData.worker.slice(-8)}
                  </span>
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Committed On-Chain Hash</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-semibold">bytes32</span>
                  </div>
                  <div className="mono text-xs font-bold text-cyan-600 dark:text-cyan-300 break-all p-2 rounded-lg bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20">
                    {escrowData.deliveryHash === ZERO_HASH ? (
                      <span className="text-amber-500 dark:text-amber-400">No proof submitted yet (0x000...)</span>
                    ) : (
                      escrowData.deliveryHash
                    )}
                  </div>
                </div>
                {escrowData.deliveryProof && (
                  <div className="pt-1.5 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span>Proof Reference URI:</span>
                    <span className="mono text-slate-800 dark:text-slate-200 font-medium truncate max-w-[280px]">
                      {escrowData.deliveryProof}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Manual Onchain Hash Override Fallback */}
            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-300 flex items-center justify-between">
                <span>Or Paste Expected Bytes32 Hash Directly:</span>
                {manualHash && (
                  <button
                    onClick={() => setManualHash('')}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    Clear
                  </button>
                )}
              </label>
              <input
                type="text"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#020512] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          </div>

          {/* Step 2: Input Deliverable Payload */}
          <div className="spatial-bento p-6 sm:p-7 rounded-3xl space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                  <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Step 2: Deliverable Content Verification</span>
              </h3>

              {/* Sample Presets for Testing */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleSetPresetMatch}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 transition-colors"
                >
                  Load Sample Match
                </button>
                <button
                  type="button"
                  onClick={handleSetPresetMismatch}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/25 transition-colors"
                >
                  Tamper Test
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Paste the deliverable text, audit summary, or IPFS CID. Viem executes Keccak-256 client-side to guarantee un-tampered data.
            </p>

            <textarea
              value={deliverableText}
              onChange={(e) => setDeliverableText(e.target.value)}
              rows={6}
              placeholder="Paste raw deliverable output (e.g. audit report markdown, IPFS CID bafy..., or JSON data payload)..."
              className="w-full px-4 py-3 rounded-2xl text-xs mono bg-slate-950 text-cyan-200 border border-slate-700 dark:border-white/[0.12] placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/60 resize-none leading-relaxed shadow-inner"
            />

            {/* Computed Local Hash Display */}
            {computedHash && (
              <div className="p-4 rounded-2xl bg-slate-900/[0.04] dark:bg-[#020512] border border-slate-200 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                    <Terminal className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Locally Computed Keccak-256:</span>
                  </div>
                  <button
                    onClick={handleCopyComputed}
                    className="flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="mono text-xs text-slate-900 dark:text-slate-200 break-all select-all font-semibold p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
                  {computedHash}
                </div>
              </div>
            )}

            {/* Verification Result Banner */}
            {isMatch && (
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/10 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <span>Cryptographically Verified</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 uppercase">
                      Exact Match
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    The deliverable content matches the on-chain commitment bit-for-bit. Cryptographic integrity and non-repudiation verified.
                  </p>
                </div>
              </div>
            )}

            {isMismatch && (
              <div className="flex items-center gap-4 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 shadow-lg shadow-rose-500/10 animate-in fade-in zoom-in-95 duration-200">
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-rose-500 dark:text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                    <span>Cryptographic Mismatch</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 uppercase">
                      Integrity Compromised
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    The deliverable text does NOT match the expected on-chain hash. The payload may have been altered or generated with different parameters.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Educational Explainer Bento */}
        <div className="lg:col-span-5 space-y-6">
          <div className="spatial-bento p-6 sm:p-7 rounded-3xl space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="display text-base font-bold text-slate-900 dark:text-white">
                  ERC-8183 Proof Standard
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Autonomous Escrow Verification</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When an AI agent or human worker completes a contract, they call <code className="text-cyan-600 dark:text-cyan-300 font-mono">submitDelivery(escrowId, proofUri, deliveryHash)</code> directly on Arc Testnet.
            </p>

            <div className="space-y-3 pt-1 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/[0.03] dark:bg-[#020512] border border-slate-200 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">Off-Chain Execution</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-7 text-[11px] leading-relaxed">
                  Worker generates deliverable (code, dataset, document) and computes <code className="text-purple-600 dark:text-purple-300 font-mono">keccak256(deliverable)</code>.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/[0.03] dark:bg-[#020512] border border-slate-200 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">Immutable Commitment</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-7 text-[11px] leading-relaxed">
                  The hash is permanently sealed into the smart contract struct on Arc Testnet, locking the proof in time.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/[0.03] dark:bg-[#020512] border border-slate-200 dark:border-white/[0.06] space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                    3
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">Zero-Trust Verification</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-7 text-[11px] leading-relaxed">
                  Anyone can verify deliverable integrity without trusting the worker, an intermediary, or a centralized API.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Deployed Contract:</span>
              <a
                href={`${EXPLORER_BASE}/address/${ESCROW_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
              >
                <span>Inspect Bytecode</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

