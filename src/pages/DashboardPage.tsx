import { useState, useMemo } from 'react'
import {
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
  Copy,
  Check,
  Zap,
  Briefcase,
  UserCog,
} from 'lucide-react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import EscrowCard from '../components/EscrowCard'
import MilestoneJobCard from '../components/MilestoneJobCard'
import { useUserProfile, PRESET_AVATARS } from '../components/useUserProfile'
import type { NavRoute } from '../components/Navbar'
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
import { ConnectKitButton } from 'connectkit'
import { toast } from 'sonner'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'
const MILESTONE_CONTRACT = '0x6475145721074298d0b3cbcd79417988dc893d2d'

type Tab = 'client' | 'worker' | 'evaluator' | 'milestones'
type StatusFilter = 'all' | 'funded' | 'submitted' | 'disputed' | 'completed'

interface Props {
  onSelectEscrow: (escrow: EscrowData) => void
  onSelectJob: (job: JobData) => void
  onOpenCreateEscrow: () => void
  onOpenCreateMilestone: () => void
  onOpenEditProfile?: () => void
  onNavigate?: (route: NavRoute) => void
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
  onOpenEditProfile,
  onNavigate,
  address,
  isConnected,
}: Props) {
  const [tab, setTab] = useState<Tab>('client')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState(false)

  const { profile } = useUserProfile(address)
  const handleOpenEdit = () => {
    if (onNavigate) {
      onNavigate('profile')
    } else if (onOpenEditProfile) {
      onOpenEditProfile()
    }
  }

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
    setIsSyncing(true)
    void Promise.allSettled([
      refetchBalance(),
      refetchPending(),
      refetchClient(),
      refetchWorker(),
      refetchEval(),
      refetchClientJobs(),
      refetchWorkerJobs(),
      refetchEscrows(),
      refetchJobs(),
    ]).then(() => {
      setTimeout(() => {
        setIsSyncing(false)
        toast.success('Workspace synchronized with Arc Testnet')
      }, 500)
    })
  }

  const copyAddress = () => {
    if (!address) return
    void navigator.clipboard.writeText(address)
    setCopiedAddr(true)
    toast.success('Address copied to clipboard')
    setTimeout(() => setCopiedAddr(false), 2000)
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

  const tabs: { key: Tab; label: string; count: number; icon: React.ReactNode; tooltip: string }[] = [
    {
      key: 'client',
      label: 'Client (Funded)',
      count: clientIds.length,
      icon: <Lock className="w-3.5 h-3.5" />,
      tooltip: 'Escrows funded by your account awaiting delivery review or auto-release',
    },
    {
      key: 'worker',
      label: 'Worker (Tasks)',
      count: workerIds.length,
      icon: <Bot className="w-3.5 h-3.5" />,
      tooltip: 'Tasks assigned to your address for delivery proof submission & fund claiming',
    },
    {
      key: 'evaluator',
      label: 'Arbiter Cases',
      count: evalIds.length,
      icon: <Shield className="w-3.5 h-3.5" />,
      tooltip: 'Disputed escrows where you are designated as the trusted resolver',
    },
    {
      key: 'milestones',
      label: 'Milestones',
      count: allJobIds.length,
      icon: <Layers className="w-3.5 h-3.5" />,
      tooltip: 'Multi-stage milestone projects linked to your account',
    },
  ]

  if (!isConnected && !address) {
    return (
      <div className="w-full max-w-4xl mx-auto py-20 px-4 text-center space-y-6 flex-1 flex flex-col justify-center items-center transition-colors duration-200">
        <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shadow-lg">
          <Lock className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="display text-2xl font-black text-slate-900 dark:text-white">
            Connect Wallet to Open Workspace
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Your personal workspace lets you fund escrows, track agent deliveries, approve milestones, and claim completed USDC payouts.
          </p>
        </div>
        <ConnectKitButton />
      </div>
    )
  }

  const currentTabInfo = tabs.find((t) => t.key === tab)

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 w-full flex-1 transition-colors duration-200">
      {/* ── Top Workspace Header with User Profile Card ────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 rounded-3xl spatial-bento border border-slate-200/90 dark:border-white/[0.1] shadow-xl">
        <div className="flex items-center gap-4">
          {/* Avatar with preset gradient & icon and glowing ring */}
          <div className="relative shrink-0">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${
                PRESET_AVATARS.find((p) => p.id === profile.avatar)?.gradient ?? 'from-purple-600 to-indigo-600'
              } flex items-center justify-center text-3xl shadow-xl border-2 border-white dark:border-white/10 glow-cyan`}
            >
              {PRESET_AVATARS.find((p) => p.id === profile.avatar)?.icon ?? '👤'}
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-[#040714] animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="display text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {profile.displayName || `${address?.slice(0, 6)}…${address?.slice(-4)}`}
              </h1>
              {profile.handle && (
                <span className="text-xs font-bold text-purple-600 dark:text-cyan-400">
                  {profile.handle}
                </span>
              )}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                {profile.primaryRole === 'client' ? '💼 Client Mode' : profile.primaryRole === 'worker' ? '⚡ Worker Mode' : '🔄 Dual Operator'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Arc Testnet</span>
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 max-w-xl">
              {profile.bio || 'Web3 escrow & AI agent operator on Arc Testnet.'}
            </p>

            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap pt-0.5 font-mono">
              <span>Address:</span>
              <span className="bg-slate-100 dark:bg-white/[0.06] px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-200 font-semibold">
                {address}
              </span>
              <button
                onClick={copyAddress}
                title="Copy wallet address"
                className="p-1 hover:text-purple-600 dark:hover:text-cyan-400 text-slate-400 transition-colors"
              >
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`${EXPLORER_BASE}/address/${address}`}
                target="_blank"
                rel="noreferrer"
                title="Inspect on Arc Explorer"
                className="p-1 text-slate-400 hover:text-cyan-500 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              {profile.xTwitter && (
                <span className="text-purple-600 dark:text-purple-400 font-semibold">{profile.xTwitter}</span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons: Manage Profile & Sync */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={() => onNavigate ? onNavigate('profile') : onOpenEditProfile?.()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] transition-all hover:scale-[1.02]"
          >
            <UserCog className="w-3.5 h-3.5 text-purple-600 dark:text-cyan-400" />
            <span>Manage Profile & Identity</span>
          </button>

          <button
            onClick={refetchAll}
            disabled={isSyncing}
            title="Synchronize on-chain data"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-cyan-500' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* ── Command Center Hero Row (3 Financial & Network Cards) ─────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: USDC Balance & Direct Action Shortcuts */}
        <div className="relative rounded-3xl p-6 spatial-bento border border-purple-500/25 overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all shadow-md">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-300">
                USDC Balance
              </span>
              <span className="text-[11px] font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                Settlement Currency
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-1">
              <span className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {balanceFmt ?? '0.00'}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">USDC</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Native gas & escrow settlement token on Arc Network.
            </p>
          </div>

          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-slate-200/80 dark:border-white/[0.08]">
            <button
              onClick={onOpenCreateEscrow}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-purple-600/20 hover:scale-[1.01]"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>+ Escrow</span>
            </button>
            <button
              onClick={onOpenCreateMilestone}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl text-xs font-black bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/25 transition-all hover:scale-[1.01]"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>+ Milestone</span>
            </button>
          </div>
        </div>

        {/* Card 2: Pending Claimable Vault */}
        <div
          className={`relative rounded-3xl p-6 spatial-bento flex flex-col justify-between transition-all duration-300 hover:scale-[1.01] ${
            pendingRaw > 0n
              ? 'border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/20 shadow-xl shadow-emerald-500/15 glow-emerald'
              : 'border-slate-200/80 dark:border-white/[0.08]'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <ArrowDownCircle className="w-4 h-4" />
                Claimable Vault
              </span>
              {pendingRaw > 0n && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 animate-pulse">
                  Funds Available
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-2 my-1">
              <span className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {pendingFmt ?? '0.00'}
              </span>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">USDC</span>
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
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
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
                <span className="text-[11px] mono text-slate-400">Pull-safety Active</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 3: Network Telemetry */}
        <div className="relative rounded-3xl p-6 spatial-bento border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between hover:scale-[1.01] transition-all shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Network Telemetry
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Single Escrow (v3):</span>
                <a
                  href={`${EXPLORER_BASE}/address/${ESCROW_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mono text-purple-600 dark:text-purple-300 hover:underline flex items-center gap-1"
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
                  className="mono text-cyan-600 dark:text-cyan-300 hover:underline flex items-center gap-1"
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

      {/* ── Tabs & Search & Filter Bar ─────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex gap-1.5 p-1.5 rounded-2xl spatial-bento overflow-x-auto">
            {tabs.map(({ key, label, count, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex items-center gap-2 py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
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

        {/* Tab Context Helper & Status Filter Chips */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {currentTabInfo?.tooltip}
          </p>

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
      </div>

      {/* ── Main Cards Grid & Contextual Empty States ────────────────── */}
      {tab === 'milestones' ? (
        jobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl glass-card animate-pulse" />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="p-12 text-center glass-panel rounded-3xl border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400 space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Milestone Projects Found</h3>
              <p className="mt-1 text-slate-500 dark:text-slate-400">
                You haven&apos;t created or been assigned to any multi-stage milestone projects yet.
              </p>
            </div>
            <button
              onClick={onOpenCreateMilestone}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02]"
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
        <div className="p-12 text-center glass-panel rounded-3xl border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400 space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
            {tab === 'client' ? <Lock className="w-6 h-6" /> : tab === 'worker' ? <Briefcase className="w-6 h-6" /> : <Shield className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {tab === 'client'
                ? 'No Funded Escrows Yet'
                : tab === 'worker'
                ? 'No Assigned Tasks Yet'
                : 'No Dispute Cases'}
            </h3>
            <p className="mt-1 text-slate-500 dark:text-slate-400 leading-relaxed">
              {tab === 'client'
                ? 'Create a trustless smart contract escrow to hire an AI agent or human worker with automatic deadline protection.'
                : tab === 'worker'
                ? 'You do not have any open deliverables. Browse the marketplace or share your worker address to receive escrow offers.'
                : 'You are not assigned as arbiter on any active dispute cases.'}
            </p>
          </div>

          {tab === 'client' && (
            <button
              onClick={onOpenCreateEscrow}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02]"
            >
              + Create Single Escrow
            </button>
          )}
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
