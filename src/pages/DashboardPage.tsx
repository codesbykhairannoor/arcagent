import { useState, useMemo } from 'react'
import {
  Plus,
  RefreshCw,
  ArrowDownCircle,
  ExternalLink,
  Layers,
  Search,
  Shield,
  CheckCircle2,
  Lock,
  Bot,
  Filter,
} from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import EscrowCard from '../components/EscrowCard'
import MilestoneJobCard from '../components/MilestoneJobCard'
import {
  useUsdcBalance,
  usePendingWithdrawal,
  useClientEscrows,
  useWorkerEscrows,
  useEvaluatorEscrows,
  useEscrows,
  type EscrowData,
  ARC_TESTNET_CHAIN_ID,
} from '../components/useEscrowData'
import {
  useClientJobs,
  useWorkerJobs,
  useJobs,
  useMilestones,
  type JobData,
} from '../components/useMilestoneData'
import { ESCROW_ADDRESS, ESCROW_ABI } from '../components/EscrowABI'
import UnifiedWalletModal, { GoogleIcon } from '../components/UnifiedWalletModal'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'
const MILESTONE_CONTRACT = '0x6475145721074298d0b3cbcd79417988dc893d2d'

type Tab = 'client' | 'worker' | 'evaluator' | 'milestones'
type StatusFilter = 'all' | 'funded' | 'submitted' | 'disputed' | 'completed'

interface Props {
  onSelectEscrow: (escrow: EscrowData) => void
  onSelectJob: (job: JobData) => void
  onOpenCreateEscrow: () => void
  onOpenCreateMilestone: () => void
  address?: `0x${string}`
  isConnected: boolean
}

function MilestoneJobCardWrapper({ job, onClick }: { job: JobData; onClick: () => void }) {
  const { milestones } = useMilestones(job.jobId)
  const statuses = useMemo(() => milestones.map((m) => m.status), [milestones])
  return <MilestoneJobCard job={job} milestoneStatuses={statuses} onClick={onClick} />
}

export default function DashboardPage({
  onSelectEscrow,
  onSelectJob,
  onOpenCreateEscrow,
  onOpenCreateMilestone,
  address,
  isConnected,
}: Props) {
  const [tab, setTab] = useState<Tab>('client')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Blockchain Queries
  const { formatted: balanceFmt, refetch: refetchBalance } = useUsdcBalance(address)
  const { raw: pendingRaw, formatted: pendingFmt, refetch: refetchPending } = usePendingWithdrawal(address)

  const { ids: clientIds, refetch: refetchClient } = useClientEscrows(address)
  const { ids: workerIds, refetch: refetchWorker } = useWorkerEscrows(address)
  const { ids: evalIds, refetch: refetchEval } = useEvaluatorEscrows(address)

  const { ids: clientJobIds, refetch: refetchClientJobs } = useClientJobs(address)
  const { ids: workerJobIds, refetch: refetchWorkerJobs } = useWorkerJobs(address)

  const allJobIds = useMemo(() => {
    return [...new Set([...clientJobIds, ...workerJobIds])]
  }, [clientJobIds, workerJobIds])

  const activeIds = tab === 'client' ? clientIds : tab === 'worker' ? workerIds : evalIds
  const { escrows, isLoading, refetch: refetchEscrows } = useEscrows(activeIds)
  const { jobs, isLoading: jobsLoading, refetch: refetchJobs } = useJobs(allJobIds)

  // Direct 1-Click Pull Withdrawal Hook
  const { writeContract: withdraw, data: withdrawHash, isPending: withdrawPending } = useWriteContract()
  const { isLoading: withdrawConfirming, isSuccess: withdrawSuccess } = useWaitForTransactionReceipt({ hash: withdrawHash })

  if (withdrawSuccess) {
    void refetchPending()
    void refetchBalance()
  }

  const handleQuickWithdraw = () => {
    withdraw({
      chainId: ARC_TESTNET_CHAIN_ID,
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'withdraw',
    })
  }

  const refetchAll = () => {
    void refetchBalance()
    void refetchPending()
    void refetchClient()
    void refetchWorker()
    void refetchEval()
    void refetchClientJobs()
    void refetchWorkerJobs()
    void refetchEscrows()
    void refetchJobs()
  }

  // Filter single escrows
  const filteredEscrows = useMemo(() => {
    return escrows.filter((e) => {
      if (statusFilter === 'funded' && e.status !== 0) return false
      if (statusFilter === 'submitted' && e.status !== 1) return false
      if (statusFilter === 'disputed' && e.status !== 2) return false
      if (statusFilter === 'completed' && e.status < 3) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          e.title.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.worker.toLowerCase().includes(q) ||
          e.client.toLowerCase().includes(q) ||
          e.id.toString().includes(q)
        )
      }
      return true
    })
  }, [escrows, statusFilter, searchQuery])

  // Filter milestone jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return (
          j.jobTitle.toLowerCase().includes(q) ||
          j.worker.toLowerCase().includes(q) ||
          j.client.toLowerCase().includes(q) ||
          j.jobId.toString().includes(q)
        )
      }
      return true
    })
  }, [jobs, searchQuery])

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'client', label: 'Client (Funded)', count: clientIds.length, icon: <Lock className="w-3.5 h-3.5" /> },
    { key: 'worker', label: 'Worker (Tasks)', count: workerIds.length, icon: <Bot className="w-3.5 h-3.5" /> },
    { key: 'evaluator', label: 'Arbiter Cases', count: evalIds.length, icon: <Shield className="w-3.5 h-3.5" /> },
    { key: 'milestones', label: 'Milestones', count: allJobIds.length, icon: <Layers className="w-3.5 h-3.5" /> },
  ]

  const [walletModalOpen, setWalletModalOpen] = useState(false)

  if (!isConnected && !address) {
    return (
      <div className="w-full max-w-4xl mx-auto py-16 px-4 text-center space-y-6 flex-1 flex flex-col justify-center items-center transition-colors duration-200">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="display text-2xl font-black text-slate-900 dark:text-white">Connect Wallet to Open Dashboard</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Your personal dashboard allows you to view your funded escrows, claim completed worker payouts, and manage arbitration disputes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setWalletModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-900/25 transition-all hover:scale-[1.02]"
        >
          <GoogleIcon className="w-4 h-4 shrink-0" />
          <span>Connect Wallet / Google</span>
        </button>
        <UnifiedWalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
      </div>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 w-full flex-1 transition-colors duration-200">
      {/* Top Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="display text-3xl font-black text-slate-900 dark:text-white">My Workspace & Dashboard</h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Connected address: <span className="mono text-slate-800 dark:text-slate-300 font-semibold">{address}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refetchAll}
            title="Synchronize Blockchain"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync</span>
          </button>
          <button
            onClick={onOpenCreateEscrow}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Escrow</span>
          </button>
        </div>
      </div>

      {/* Command Center Hero Row (3 Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: USDC Balance & Actions */}
        <div className="relative rounded-3xl p-5 sm:p-6 glass-panel border border-purple-500/20 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                USDC Balance
              </span>
              <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Arc Testnet
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-1">
              <span className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {balanceFmt ?? '0.00'}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">USDC</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Native gas and payment currency on Arc.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            <button
              onClick={onOpenCreateEscrow}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md shadow-purple-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Escrow</span>
            </button>
            <button
              onClick={onOpenCreateMilestone}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/20 transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Milestone</span>
            </button>
          </div>
        </div>

        {/* Card 2: Pending Withdrawal Vault */}
        <div
          className={`relative rounded-3xl p-5 sm:p-6 glass-panel flex flex-col justify-between transition-all duration-300 ${
            pendingRaw > 0n
              ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/15 shadow-xl shadow-emerald-500/10 dark:shadow-emerald-950/30'
              : 'border-slate-200/80 dark:border-white/[0.08]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ArrowDownCircle className="w-4 h-4" />
                Claimable Vault
              </span>
              {pendingRaw > 0n && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 animate-pulse">
                  Funds Available
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 my-1">
              <span className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {pendingFmt ?? '0.00'}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400">USDC</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {pendingRaw > 0n
                ? 'Completed earnings & refunds awaiting one-click transfer.'
                : 'All earned funds have been safely withdrawn to your wallet.'}
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            {pendingRaw > 0n ? (
              <button
                onClick={handleQuickWithdraw}
                disabled={withdrawPending || withdrawConfirming}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>
                  {withdrawPending || withdrawConfirming
                    ? 'Confirming on Chain...'
                    : `Withdraw ${pendingFmt} USDC to Wallet`}
                </span>
              </button>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 py-1">
                <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Vault Settled
                </span>
                <span className="mono text-[11px] text-slate-500 dark:text-slate-400">Pull-safety Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Assigned Roles & Telemetry */}
        <div className="relative rounded-3xl p-5 sm:p-6 glass-panel border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Network Telemetry
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </div>

            <div className="space-y-2 mt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Single Escrow (v3):</span>
                <a
                  href={`${EXPLORER_BASE}/address/${ESCROW_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-purple-600 dark:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  {ESCROW_ADDRESS.slice(0, 6)}…{ESCROW_ADDRESS.slice(-4)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Milestone Escrow (v1):</span>
                <a
                  href={`${EXPLORER_BASE}/address/${MILESTONE_CONTRACT}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-purple-600 dark:text-cyan-300 hover:underline flex items-center gap-1"
                >
                  {MILESTONE_CONTRACT.slice(0, 6)}…{MILESTONE_CONTRACT.slice(-4)}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Your Active Contracts:</span>
                <span className="font-bold text-purple-700 dark:text-purple-300">
                  {clientIds.length + workerIds.length + evalIds.length + allJobIds.length} Total
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200/80 dark:border-white/[0.08] text-xs">
            <span className="text-slate-500 dark:text-slate-400">Protocol Fee:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">10% on Split</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search & Filter Bar */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-2xl glass-panel border border-slate-200/80 dark:border-white/[0.08] overflow-x-auto">
            {tabs.map(({ key, label, count, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  tab === key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                }`}
              >
                {icon}
                <span>{label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                    tab === key ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title, address, or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Chips */}
        {tab !== 'milestones' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Status:
            </span>
            {[
              { key: 'all', label: 'All' },
              { key: 'funded', label: 'Funded' },
              { key: 'submitted', label: 'Submitted' },
              { key: 'disputed', label: 'Disputed' },
              { key: 'completed', label: 'Completed' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key as typeof statusFilter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                  statusFilter === key
                    ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40'
                    : 'bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-white/[0.05]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Cards Grid */}
      {tab === 'milestones' ? (
        jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl glass-card animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-3xl border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400 space-y-3">
            <Layers className="w-8 h-8 text-cyan-600 dark:text-cyan-400 mx-auto" />
            <p>No milestone projects found for your address in this category.</p>
            <button
              onClick={onOpenCreateMilestone}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/30"
            >
              + Create Milestone Job
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJobs.map((j) => (
              <MilestoneJobCardWrapper
                key={j.jobId.toString()}
                job={j}
                onClick={() => onSelectJob(j)}
              />
            ))}
          </div>
        )
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl glass-card animate-pulse" />
          ))}
        </div>
      ) : filteredEscrows.length === 0 ? (
        <div className="p-12 text-center glass-panel rounded-3xl border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400 space-y-3">
          <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto" />
          <p>No escrow contracts found matching your filters.</p>
          <button
            onClick={onOpenCreateEscrow}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white"
          >
            + Create New Escrow
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEscrows.map((e) => (
            <EscrowCard key={e.id.toString()} escrow={e} onClick={() => onSelectEscrow(e)} />
          ))}
        </div>
      )}
    </main>
  )
}
