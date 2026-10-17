import { useState, useMemo } from 'react'
import {
  Search,
  Plus,
  Layers,
  Filter,
  RefreshCw,
  Coins,
  Shield,
  Bot,
  ExternalLink,
} from 'lucide-react'
import EscrowCard from '../components/EscrowCard'
import MilestoneJobCard from '../components/MilestoneJobCard'
import {
  useEscrows,
  type EscrowData,
} from '../components/useEscrowData'
import {
  useJobs,
  useMilestones,
  type JobData,
} from '../components/useMilestoneData'
import { ESCROW_ADDRESS } from '../components/EscrowABI'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'

interface Props {
  onSelectEscrow: (escrow: EscrowData) => void
  onSelectJob: (job: JobData) => void
  onOpenCreateEscrow: () => void
  onOpenCreateMilestone: () => void
  clientIds: readonly bigint[]
  workerIds: readonly bigint[]
  allJobIds: readonly bigint[]
  isConnected: boolean
}

function MilestoneJobCardWrapper({ job, onClick }: { job: JobData; onClick: () => void }) {
  const { milestones } = useMilestones(job.jobId)
  const statuses = useMemo(() => milestones.map((m) => m.status), [milestones])
  return <MilestoneJobCard job={job} milestoneStatuses={statuses} onClick={onClick} />
}

export default function MarketplacePage({
  onSelectEscrow,
  onSelectJob,
  onOpenCreateEscrow,
  onOpenCreateMilestone,
  clientIds,
  workerIds,
  allJobIds,
  isConnected: _isConnected,
}: Props) {
  const [tabType, setTabType] = useState<'all' | 'single' | 'milestones'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'funded' | 'submitted' | 'completed' | 'disputed'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const combinedEscrowIds = useMemo(() => {
    return [...new Set([...clientIds, ...workerIds])]
  }, [clientIds, workerIds])

  const { escrows, isLoading: escrowsLoading, refetch: refetchEscrows } = useEscrows(combinedEscrowIds)
  const { jobs, isLoading: jobsLoading, refetch: refetchJobs } = useJobs(allJobIds)

  const handleRefresh = () => {
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

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8 flex-1 transition-colors duration-200">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 mb-2">
            <Coins className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>Public Escrow Explorer</span>
          </div>
          <h1 className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Work & Escrow Marketplace
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
            Browse active jobs, smart contract escrow contracts, and multi-stage milestone projects across Arc Testnet.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleRefresh}
            title="Refresh feed"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenCreateEscrow}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>New Escrow</span>
          </button>
          <button
            onClick={onOpenCreateMilestone}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/30 transition-all hover:scale-[1.02]"
          >
            <Layers className="w-4 h-4" />
            <span>Milestone Project</span>
          </button>
        </div>
      </div>

      {/* Protocol Telemetry Counter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-white/[0.08]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Active Single Escrows
          </span>
          <div className="display text-2xl font-black text-slate-900 dark:text-white">{escrows.length}</div>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-white/[0.08]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Milestone Projects
          </span>
          <div className="display text-2xl font-black text-cyan-600 dark:text-cyan-300">{jobs.length}</div>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-white/[0.08]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Settlement Asset
          </span>
          <div className="display text-2xl font-black text-emerald-600 dark:text-emerald-400">USDC</div>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-slate-200/80 dark:border-white/[0.08]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Arc Testnet Status
          </span>
          <div className="flex items-center gap-1.5 display text-base font-bold text-slate-800 dark:text-slate-200 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Format Type Tabs */}
          <div className="flex p-1 rounded-2xl glass-panel border border-slate-200/80 dark:border-white/[0.08] shrink-0">
            {[
              { key: 'all', label: 'All Jobs' },
              { key: 'single', label: 'Single Escrows' },
              { key: 'milestones', label: 'Milestone Projects' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTabType(t.key as typeof tabType)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  tabType === t.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, worker, or ID..."
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

        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 dark:text-slate-400 text-[11px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Status:
          </span>
          {[
            { key: 'all', label: 'All Status' },
            { key: 'funded', label: 'Funded (Active)' },
            { key: 'submitted', label: 'Delivered / Submitted' },
            { key: 'completed', label: 'Settled / Completed' },
            { key: 'disputed', label: 'Disputed' },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key as typeof statusFilter)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shrink-0 ${
                statusFilter === s.key
                  ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-white/[0.05]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid Feed */}
      <div className="space-y-6">
        {/* Render Single Escrows */}
        {(tabType === 'all' || tabType === 'single') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Single Task Escrows (ERC-8183)
              </span>
              <span className="text-slate-500">{filteredEscrows.length} total</span>
            </div>

            {escrowsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 rounded-2xl glass-card animate-pulse" />
                ))}
              </div>
            ) : filteredEscrows.length === 0 ? (
              <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400">
                No single escrows match your filters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredEscrows.map((e) => (
                  <EscrowCard key={e.id.toString()} escrow={e} onClick={() => onSelectEscrow(e)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Render Milestone Jobs */}
        {(tabType === 'all' || tabType === 'milestones') && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                Multi-Milestone Jobs (Sequential Stages)
              </span>
              <span className="text-slate-500">{filteredJobs.length} total</span>
            </div>

            {jobsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-44 rounded-2xl glass-card animate-pulse" />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="p-8 text-center glass-panel rounded-2xl border border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-500 dark:text-slate-400">
                No milestone jobs match your filters.
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
            )}
          </div>
        )}
      </div>

      {/* Contract reference banner */}
      <div className="p-4 rounded-2xl glass-card border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 flex-wrap gap-2">
        <span className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>All escrow state transitions are verified on Arc Testnet block by block.</span>
        </span>
        <a
          href={`${EXPLORER_BASE}/address/${ESCROW_ADDRESS}`}
          target="_blank"
          rel="noreferrer"
          className="text-purple-600 dark:text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
        >
          <span>View Escrow Ledger</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  )
}
