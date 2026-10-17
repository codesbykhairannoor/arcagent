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
} from 'lucide-react'
import { keccak256, toBytes } from 'viem'
import { useReadContract } from 'wagmi'
import { ESCROW_ADDRESS, ESCROW_ABI } from '../components/EscrowABI'
import { ARC_TESTNET_CHAIN_ID } from '../components/useEscrowData'
import { toast } from 'sonner'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'
const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

export default function VerifierPage() {
  const [escrowIdQuery, setEscrowIdQuery] = useState('')
  const [activeLookupId, setActiveLookupId] = useState<bigint | null>(null)
  const [deliverableText, setDeliverableText] = useState('')
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
    toast.success('Computed hash copied')
    setTimeout(() => setCopiedHash(false), 2000)
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-10 flex-1 transition-colors duration-200">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20 mb-2">
          <FileCheck className="w-3.5 h-3.5" />
          <span>Zero-Trust Cryptographic Audit</span>
        </div>
        <h1 className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          Delivery Proof Verifier
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
          Cryptographically verify AI agent and human worker deliverables against immutable on-chain commitments. All hashes are calculated locally in your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Verification Form */}
        <div className="lg:col-span-7 space-y-6">
          {/* Lookup by on-chain escrow ID */}
          <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <h3 className="display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Step 1: On-Chain Escrow Query (Optional)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Fetch the committed deliveryHash directly from ArcAgentEscrow contract on Arc Testnet.
            </p>

            <form onSubmit={handleLookup} className="flex gap-2">
              <input
                type="number"
                value={escrowIdQuery}
                onChange={(e) => setEscrowIdQuery(e.target.value)}
                placeholder="Enter Escrow ID (e.g. 1)"
                className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
              />
              <button
                type="submit"
                disabled={escrowLoading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md transition-all shrink-0"
              >
                {escrowLoading ? 'Querying...' : 'Query Contract'}
              </button>
            </form>

            {escrowData && (
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Escrow Title:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{escrowData.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Worker Address:</span>
                  <span className="mono text-slate-700 dark:text-slate-300">
                    {escrowData.worker.slice(0, 8)}…{escrowData.worker.slice(-6)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Onchain Commitment:</span>
                  <span className="mono font-bold text-cyan-600 dark:text-cyan-300 break-all text-[11px]">
                    {escrowData.deliveryHash === ZERO_HASH ? 'No proof submitted yet' : escrowData.deliveryHash}
                  </span>
                </div>
                {escrowData.deliveryProof && (
                  <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Proof URI/Note: <span className="text-slate-800 dark:text-slate-200">{escrowData.deliveryProof}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Or Manual On-Chain Hash Input */}
          {!escrowData && (
            <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-white/[0.08] space-y-2">
              <label className="text-xs font-bold text-slate-900 dark:text-white block">
                Or Paste Expected Bytes32 Hash Directly:
              </label>
              <input
                type="text"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                placeholder="0x..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.05] border border-slate-200/80 dark:border-white/[0.1] text-slate-900 dark:text-white mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
              />
            </div>
          )}

          {/* Input Deliverable Payload */}
          <div className="p-5 sm:p-6 rounded-3xl glass-panel border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <h3 className="display text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Step 2: Deliverable Content Verification</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Paste the exact deliverable text, code artifact, or IPFS CID. The browser will compute its keccak256 hash locally.
            </p>

            <textarea
              value={deliverableText}
              onChange={(e) => setDeliverableText(e.target.value)}
              rows={5}
              placeholder="Paste raw deliverable output (e.g. audit report markdown, IPFS CID bafy..., or JSON data payload)..."
              className="w-full px-4 py-3 rounded-2xl text-xs mono bg-slate-900/90 dark:bg-[#020510] text-slate-100 border border-slate-300 dark:border-white/[0.12] placeholder:text-slate-500 focus:outline-none focus:border-purple-400/50 resize-none leading-relaxed"
            />

            {/* Computed Local Hash Display */}
            {computedHash && (
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#020510] border border-slate-200/80 dark:border-white/[0.08] space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">Locally Computed keccak256:</span>
                  <button
                    onClick={handleCopyComputed}
                    className="flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline"
                  >
                    {copiedHash ? <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHash ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="mono text-xs text-slate-900 dark:text-slate-200 break-all select-all font-semibold">
                  {computedHash}
                </div>
              </div>
            )}

            {/* Verification Result Banner */}
            {isMatch && (
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Cryptographically Verified</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    The deliverable matches the on-chain commitment bit-for-bit. Integrity guaranteed.
                  </p>
                </div>
              </div>
            )}

            {isMismatch && (
              <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300">Cryptographic Mismatch</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    The deliverable text does NOT match the on-chain hash. The file may have been altered or modified.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Educational Explainer */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-6 sm:p-7 rounded-3xl glass-panel border border-slate-200/80 dark:border-white/[0.08] space-y-4">
            <h3 className="display text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>How ERC-8183 Verification Works</span>
            </h3>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              When an AI agent or human worker completes a job, they don’t just send a message — they call `submitDelivery(escrowId, proofUri, deliveryHash)` on the blockchain.
            </p>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">1. Off-Chain Execution</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Worker generates deliverable (code, dataset, document) and computes `keccak256(deliverable)`.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">2. Immutable Commitment</span>
                <span className="text-slate-600 dark:text-slate-400">
                  The hash is permanently stored in the escrow struct on Arc Testnet, locking the proof in time.
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-100/70 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">3. Zero-Trust Verification</span>
                <span className="text-slate-600 dark:text-slate-400">
                  Anyone can verify deliverable integrity without trusting the worker or a centralized server.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <a
                href={`${EXPLORER_BASE}/address/${ESCROW_ADDRESS}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                <span>Inspect ArcAgentEscrow Bytecode</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
