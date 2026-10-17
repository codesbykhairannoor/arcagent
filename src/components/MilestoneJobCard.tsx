import { ChevronRight, Layers } from 'lucide-react'
import { useAccount } from 'wagmi'
import { type JobData, milestoneStatusColor } from './useMilestoneData'
import { formatAmount } from './useEscrowData'

interface Props {
  job: JobData
  milestoneStatuses: number[]  // status of each milestone
  onClick: () => void
}

export default function MilestoneJobCard({ job, milestoneStatuses, onClick }: Props) {
  const { address } = useAccount()
  const isClient = address?.toLowerCase() === job.client.toLowerCase()
  const isWorker = address?.toLowerCase() === job.worker.toLowerCase()

  // Aggregate status: show most critical
  const hasDisputed = milestoneStatuses.some((s) => s === 2)
  const pendingCount = milestoneStatuses.filter((s) => s === 0 || s === 1).length
  const completedCount = milestoneStatuses.filter((s) => s === 3).length
  const total = milestoneStatuses.length

  const overallColor = hasDisputed ? 'var(--danger)'
    : completedCount === total ? 'var(--success)'
    : pendingCount > 0 ? 'var(--accent-vivid)'
    : 'var(--subtle)'

  const overallLabel = hasDisputed ? 'Disputed'
    : completedCount === total ? 'Complete'
    : `${completedCount}/${total} done`

  const roles: string[] = []
  if (isClient) roles.push('Client')
  if (isWorker) roles.push('Worker')

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all hover:bg-white/5 active:scale-[0.99]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: overallColor }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {job.jobTitle || `Job #${job.jobId}`}
          </span>
          <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
            style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--violet)' }}>
            <Layers className="w-2.5 h-2.5" />{total} milestones
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--muted)' }}>
            {formatAmount(job.totalAmount)} USDC total
          </span>
          {roles.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>{roles.join(' · ')}</span>
          )}
        </div>
        {/* milestone progress bar */}
        {total > 0 && (
          <div className="flex gap-0.5 mt-2">
            {milestoneStatuses.map((s, i) => (
              <div key={i} className="flex-1 h-1 rounded-full"
                style={{ background: milestoneStatusColor(s) }} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `color-mix(in srgb, ${overallColor} 15%, transparent)`, color: overallColor }}>
          {overallLabel}
        </span>
        <ChevronRight className="w-4 h-4" style={{ color: 'var(--subtle)' }} />
      </div>
    </button>
  )
}
