import { Layers, Coins, ArrowUpRight, AlertTriangle } from 'lucide-react'
import { useAccount } from 'wagmi'
import { type JobData, milestoneStatusColor } from './useMilestoneData'
import { formatAmount } from './useEscrowData'

interface Props {
  job: JobData
  milestoneStatuses: number[] // status of each milestone
  onClick: () => void
}

export default function MilestoneJobCard({ job, milestoneStatuses, onClick }: Props) {
  const { address } = useAccount()
  const isClient = address?.toLowerCase() === job.client.toLowerCase()
  const isWorker = address?.toLowerCase() === job.worker.toLowerCase()
  const isEvaluator = address?.toLowerCase() === job.evaluator.toLowerCase()

  // Aggregate status: show most critical
  const hasDisputed = milestoneStatuses.some((s) => s === 2)
  const pendingCount = milestoneStatuses.filter((s) => s === 0 || s === 1).length
  const completedCount = milestoneStatuses.filter((s) => s === 3).length
  const total = milestoneStatuses.length

  const overallColor = hasDisputed
    ? 'var(--danger)'
    : completedCount === total && total > 0
    ? 'var(--success)'
    : pendingCount > 0
    ? 'var(--cyan)'
    : 'var(--subtle)'

  const overallLabel = hasDisputed
    ? 'Disputed'
    : completedCount === total && total > 0
    ? 'All Milestones Complete'
    : `${completedCount} of ${total} Completed`

  const roles: { label: string; color: string }[] = []
  if (isClient) roles.push({ label: 'Client', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' })
  if (isWorker) roles.push({ label: 'Worker', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' })
  if (isEvaluator && !isClient) roles.push({ label: 'Arbiter', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' })

  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="group relative w-full text-left rounded-3xl p-5 spatial-bento cursor-pointer outline-none transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-xl hover:shadow-cyan-950/20"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status pill */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md"
            style={{
              background: `color-mix(in srgb, ${overallColor} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${overallColor} 30%, transparent)`,
              color: overallColor,
            }}
          >
            <span className="relative flex h-2 w-2">
              {pendingCount > 0 && !hasDisputed && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: overallColor }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: overallColor }}
              />
            </span>
            <span>{overallLabel}</span>
          </div>

          {/* Milestones count badge */}
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
            <Layers className="w-3 h-3" />
            {total} Stages
          </span>

          {/* Role tags */}
          {roles.map((r) => (
            <span
              key={r.label}
              className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${r.color}`}
            >
              {r.label}
            </span>
          ))}

          {hasDisputed && (
            <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <AlertTriangle className="w-3 h-3 text-rose-500 dark:text-rose-400" /> Disputed
            </span>
          )}
        </div>

        {/* Total locked USDC */}
        <div className="flex items-baseline gap-1.5 shrink-0 bg-slate-100 dark:bg-white/[0.04] px-3 py-1 rounded-xl border border-slate-200 dark:border-white/[0.06]">
          <Coins className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 self-center" />
          <span className="display text-base font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatAmount(job.totalAmount)}
          </span>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            USDC
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">
          {job.jobTitle || `Milestone Job #${job.jobId}`}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
          Multi-milestone project with sequential delivery verification
        </p>
      </div>

      {/* Segmented Milestone Progress Bars */}
      <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05] my-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
          <span>Stages Breakdown</span>
          <span className="font-extrabold text-cyan-600 dark:text-cyan-400">{progressPct}% Complete</span>
        </div>

        {total > 0 ? (
          <div className="flex gap-1.5 h-2 w-full p-0.5 bg-slate-200 dark:bg-slate-900/80 rounded-full border border-slate-200/80 dark:border-white/[0.06]">
            {milestoneStatuses.map((s, i) => (
              <div
                key={i}
                className="flex-1 h-full rounded-full transition-all duration-300 hover:brightness-125"
                style={{
                  background: milestoneStatusColor(s),
                  boxShadow: s === 3 ? '0 0 10px rgba(16, 185, 129, 0.4)' : undefined,
                }}
                title={`Stage ${i + 1}`}
              />
            ))}
          </div>
        ) : (
          <div className="h-1.5 w-full bg-slate-300 dark:bg-slate-800 rounded-full" />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 dark:border-white/[0.06] text-xs">
        <span className="text-slate-500 dark:text-slate-400">
          Job ID <span className="mono font-semibold text-slate-700 dark:text-slate-300">#{job.jobId.toString()}</span>
        </span>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all text-xs font-semibold">
          <span>View Stages</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}
