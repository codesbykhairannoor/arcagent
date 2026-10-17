import { useState, useCallback } from 'react'
import { ConnectKitButton } from 'connectkit'
import { useAccount } from 'wagmi'
import { Plus, RefreshCw, ArrowDownCircle, ExternalLink, Layers } from 'lucide-react'
import { toast } from 'sonner'
import EscrowCard from './components/EscrowCard'
import CreateEscrowModal from './components/CreateEscrowModal'
import EscrowDetailModal from './components/EscrowDetailModal'
import CreateMilestoneJobModal from './components/CreateMilestoneJobModal'
import MilestoneJobCard from './components/MilestoneJobCard'
import MilestoneJobDetailModal from './components/MilestoneJobDetailModal'
import NanopaymentPanel from './components/NanopaymentPanel'
import {
  useUsdcBalance,
  usePendingWithdrawal,
  useClientEscrows,
  useWorkerEscrows,
  useEvaluatorEscrows,
  useEscrows,
  type EscrowData,
} from './components/useEscrowData'
import { useClientJobs, useWorkerJobs, useJobs, useMilestones, type JobData } from './components/useMilestoneData'
import CircleWalletLogin, { useCircleWallet } from './components/CircleWalletLogin'
import { ESCROW_ADDRESS } from './components/EscrowABI'


const EXPLORER_BASE = 'https://explorer.testnet.arc.io'

type Tab = 'client' | 'worker' | 'evaluator' | 'milestones'

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; sub: string; icon: string }> = {
    client: { title: 'No escrows created', sub: 'Fund work by creating an escrow above', icon: '💼' },
    worker: { title: 'No assigned jobs', sub: 'Your address has no active worker assignments', icon: '⚙️' },
    evaluator: { title: 'No arbiter roles', sub: 'You are not assigned as evaluator on any escrow', icon: '⚖️' },
    milestones: { title: 'No milestone jobs', sub: 'Create a multi-milestone job to break work into stages', icon: '🎯' },
  }
  const { title, sub, icon } = messages[tab]
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-sm font-semibold mb-1" style={{ color: 'var(--muted)' }}>{title}</div>
      <div className="text-xs" style={{ color: 'var(--subtle)' }}>{sub}</div>
    </div>
  )
}

// Helper: fetch milestone statuses for a job (used in list view)
function useMilestoneStatuses(jobId: bigint) {
  const { milestones } = useMilestones(jobId)
  return milestones.map((m) => m.status)
}

// Wrapper so each card can call its own hook independently
function MilestoneJobCardWrapper({ job, onClick }: { job: JobData; onClick: () => void }) {
  const statuses = useMilestoneStatuses(job.jobId)
  return <MilestoneJobCard job={job} milestoneStatuses={statuses} onClick={onClick} />
}

export default function App() {
  const { address: wagmiAddress, isConnected } = useAccount()
  const { address: circleAddress } = useCircleWallet()
  // Use circle address as fallback when no injected wallet is connected
  const address = wagmiAddress ?? circleAddress ?? undefined
  const [tab, setTab] = useState<Tab>('client')
  const [showCreate, setShowCreate] = useState(false)
  const [showCreateMilestone, setShowCreateMilestone] = useState(false)
  const [selected, setSelected] = useState<EscrowData | null>(null)
  const [selectedJob, setSelectedJob] = useState<JobData | null>(null)

  const { formatted: balanceFmt, refetch: refetchBalance } = useUsdcBalance(address)
  const { formatted: pendingFmt, raw: pendingRaw, refetch: refetchPending } = usePendingWithdrawal(address)

  const { ids: clientIds, refetch: refetchClient } = useClientEscrows(address)
  const { ids: workerIds, refetch: refetchWorker } = useWorkerEscrows(address)
  const { ids: evalIds, refetch: refetchEval } = useEvaluatorEscrows(address)
  const { ids: clientJobIds, refetch: refetchClientJobs } = useClientJobs(address)
  const { ids: workerJobIds, refetch: refetchWorkerJobs } = useWorkerJobs(address)

  const activeIds = tab === 'client' ? clientIds : tab === 'worker' ? workerIds : tab === 'evaluator' ? evalIds : []
  const { escrows, isLoading, refetch: refetchEscrows } = useEscrows(activeIds)

  const allJobIds = [...new Set([...clientJobIds, ...workerJobIds])]
  const { jobs, isLoading: jobsLoading, refetch: refetchJobs } = useJobs(tab === 'milestones' ? allJobIds : [])

  const refetchAll = useCallback(() => {
    void refetchBalance()
    void refetchPending()
    void refetchClient()
    void refetchWorker()
    void refetchEval()
    void refetchEscrows()
    void refetchClientJobs()
    void refetchWorkerJobs()
    void refetchJobs()
    toast.success('Refreshed')
  }, [refetchBalance, refetchPending, refetchClient, refetchWorker, refetchEval, refetchEscrows, refetchClientJobs, refetchWorkerJobs, refetchJobs])

  const tabs: { key: Tab; label: string; count: number; icon?: React.ReactNode }[] = [
    { key: 'client', label: 'Client', count: clientIds.length },
    { key: 'worker', label: 'Worker', count: workerIds.length },
    { key: 'evaluator', label: 'Evaluator', count: evalIds.length },
    { key: 'milestones', label: 'Milestones', count: allJobIds.length, icon: <Layers className="w-3 h-3" /> },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Top Nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40" style={{
        borderBottom: '1px solid var(--border)',
        background: 'rgba(5,15,30,0.85)',
        backdropFilter: 'blur(20px)',
      }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--violet) 0%, var(--accent-vivid) 100%)' }}>
              <span className="text-[13px]">⟠</span>
            </div>
            <span className="display text-base font-bold" style={{ color: 'var(--ink)' }}>ArcAgent Escrow</span>
          </div>
          <ConnectKitButton />
        </div>
      </header>

      {/* ── Connect screen ─────────────────────────────────────────────────── */}
      {!isConnected && !circleAddress && (
        <div style={{ minHeight: 'calc(100dvh - 56px)', display: 'grid', gridTemplateColumns: '1fr', pointerEvents: 'none' }}
          className="sm:items-center">
          {/* pointer-events: none on outer shell so ConnectKit fixed portal is never blocked */}
          <div style={{ pointerEvents: 'auto', maxWidth: 1100, margin: '0 auto', width: '100%', padding: '3rem 1.5rem' }}
            className="grid grid-cols-1 gap-12"
            // two-column on large screens via inline responsive trick
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '3rem', alignItems: 'center' }}
              className="connect-grid">
              {/* ── Left: Branding + feature pills ──────────────────────── */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, var(--violet) 0%, var(--accent-vivid) 100%)', boxShadow: '0 0 32px rgba(167,139,250,0.35)' }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                    </svg>
                  </div>
                  <div>
                    <div className="display text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--violet)', letterSpacing: '0.12em' }}>ArcAgent</div>
                    <div className="display text-2xl font-black" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>Escrow</div>
                  </div>
                </div>

                <h1 className="display font-black mb-4"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3.25rem)', lineHeight: 1.08, letterSpacing: '-0.04em', color: 'var(--ink)' }}>
                  Trustless work.<br />
                  <span style={{ color: 'var(--violet)' }}>On-chain proof.</span>
                </h1>
                <p className="mb-8" style={{ color: 'var(--muted)', fontSize: '1.05rem', lineHeight: 1.65, maxWidth: '42ch' }}>
                  ERC-8183 escrow for human-to-AI and agent-to-agent work. Fund jobs, assign an arbiter, and release funds only when proof is verified.
                </p>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: '◈', label: 'USDC on Arc Testnet' },
                    { icon: '⚖', label: 'On-chain Arbitration' },
                    { icon: '◉', label: 'ERC-8004 Agent Identity' },
                    { icon: '◆', label: 'Multi-Milestone Jobs' },
                    { icon: '⟳', label: 'Pull-based Withdrawal' },
                  ].map(({ icon, label }) => (
                    <div key={label}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                      <span style={{ color: 'var(--accent-vivid)', fontSize: '0.7rem' }}>{icon}</span>
                      {label}
                    </div>
                  ))}
                </div>

                {/* Stats row */}
                <div className="flex gap-6 mt-8">
                  {[
                    { value: '2', label: 'Contracts' },
                    { value: 'Arc', label: 'Testnet' },
                    { value: 'USDC', label: 'Native Gas' },
                  ].map(({ value, label }) => (
                    <div key={label}>
                      <div className="display text-xl font-black tabular-nums" style={{ color: 'var(--ink)' }}>{value}</div>
                      <div className="text-xs" style={{ color: 'var(--subtle)' }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right: Wallet connect card ──────────────────────────── */}
              <div style={{ maxWidth: 420 }}>
                {/* Glow behind card */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', inset: -24, borderRadius: 32,
                    background: 'radial-gradient(ellipse at 50% 50%, rgba(167,139,250,0.12) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }} />
                  <div className="relative rounded-3xl p-6"
                    style={{ background: 'rgba(255,255,255,0.055)', border: '1px solid var(--border-strong)', backdropFilter: 'blur(24px)' }}>

                    <div className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: 'var(--subtle)', letterSpacing: '0.1em' }}>
                      Connect to get started
                    </div>

                    {/* Browser wallet block */}
                    <div className="rounded-2xl p-4 mb-3"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
                      <div className="text-xs font-semibold mb-3" style={{ color: 'var(--muted)' }}>Browser Wallet</div>
                      <ConnectKitButton />
                      <p className="text-[10px] mt-2.5 leading-tight" style={{ color: 'var(--subtle)' }}>
                        MetaMask · Coinbase Wallet · WalletConnect<br />Trust, Rainbow, OKX, Zerion, Safe, 400+ more
                      </p>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--subtle)' }}>or</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                    </div>

                    {/* Passkey block */}
                    <CircleWalletLogin />

                    {/* Footer note */}
                    <p className="text-[10px] text-center mt-4" style={{ color: 'var(--subtle)' }}>
                      Testnet only · No real funds at risk
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isConnected || circleAddress) && <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
          <>
            {/* ── Balance card ───────────────────────────────────────────── */}
            <div className="rounded-3xl p-5 relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, rgba(76,29,149,0.3) 0%, rgba(15,35,68,0.6) 100%)', border: '1px solid rgba(167,139,250,0.25)' }}>
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 60% 60% at 80% 50%, rgba(167,139,250,0.15) 0%, transparent 70%)',
              }} />
              <div className="relative">
                <div className="text-xs font-semibold uppercase tracking-widest mb-1.5" style={{ color: 'var(--violet)' }}>
                  USDC Balance · Arc Testnet
                </div>
                <div className="display text-4xl font-black tabular-nums" style={{ color: 'var(--ink)' }}>
                  {balanceFmt ?? '—'}
                </div>
                <div className="flex items-center gap-3 mt-3 flex-wrap">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
                    style={{ background: 'var(--violet)', color: '#fff' }}
                  >
                    <Plus className="w-4 h-4" />New Escrow
                  </button>
                  <button
                    onClick={() => setShowCreateMilestone(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
                    style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.35)', color: 'var(--violet)' }}
                  >
                    <Layers className="w-3.5 h-3.5" />Milestone Job
                  </button>
                  <button
                    onClick={refetchAll}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-white/10"
                    style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--muted)' }}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />Refresh
                  </button>
                  <a
                    href={`${EXPLORER_BASE}/address/${ESCROW_ADDRESS}`}
                    target="_blank" rel="noopener"
                    className="flex items-center gap-1 text-xs ml-auto"
                    style={{ color: 'var(--subtle)' }}
                  >
                    Contract <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* ── Pending withdrawal banner ──────────────────────────────── */}
            {pendingRaw > 0n && (
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl"
                style={{ background: 'rgba(141,216,159,0.08)', border: '1px solid rgba(141,216,159,0.3)' }}>
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--success)' }}>Pending Withdrawal</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{pendingFmt} USDC credited — open any escrow to withdraw</div>
                </div>
                <ArrowDownCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
              </div>
            )}

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)' }}>
              {tabs.map(({ key, label, count, icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: tab === key ? 'var(--surface-raised)' : 'transparent',
                    color: tab === key ? 'var(--ink)' : 'var(--subtle)',
                    boxShadow: tab === key ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  {icon}
                  {label}
                  {count > 0 && (
                    <span className="w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black"
                      style={{
                        background: tab === key ? 'var(--violet)' : 'var(--surface-muted)',
                        color: tab === key ? '#fff' : 'var(--subtle)',
                      }}>
                      {count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Escrow / Milestone list ─────────────────────────────────── */}
            {tab === 'milestones' ? (
              jobsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />)}
                </div>
              ) : jobs.length === 0 ? (
                <EmptyState tab="milestones" />
              ) : (
                <div className="space-y-2">
                  {[...jobs].reverse().map((j) => (
                    <MilestoneJobCardWrapper key={j.jobId.toString()} job={j} onClick={() => setSelectedJob(j)} />
                  ))}
                </div>
              )
            ) : isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />
                ))}
              </div>
            ) : escrows.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <div className="space-y-2">
                {[...escrows].reverse().map((e) => (
                  <EscrowCard key={e.id.toString()} escrow={e} onClick={() => setSelected(e)} />
                ))}
              </div>
            )}

            {/* ── x402 Nanopayments panel ─────────────────────────────────── */}
            <NanopaymentPanel />
          </>
      </main>}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateEscrowModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            void refetchClient()
            void refetchBalance()
          }}
        />
      )}
      {showCreateMilestone && (
        <CreateMilestoneJobModal
          onClose={() => setShowCreateMilestone(false)}
          onCreated={() => {
            void refetchClientJobs()
            void refetchBalance()
            setTab('milestones')
          }}
        />
      )}
      {selected && (
        <EscrowDetailModal
          escrow={selected}
          onClose={() => setSelected(null)}
          onAction={() => {
            void refetchBalance()
            void refetchPending()
            void refetchClient()
            void refetchWorker()
            void refetchEval()
            void refetchEscrows()
            setSelected(null)
          }}
        />
      )}
      {selectedJob && (
        <MilestoneJobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAction={() => {
            void refetchBalance()
            void refetchJobs()
          }}
        />
      )}
    </div>
  )
}
