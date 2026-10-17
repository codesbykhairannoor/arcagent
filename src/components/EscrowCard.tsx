import { useMemo } from 'react'
import { ChevronRight, Clock, Shield, AlertTriangle } from 'lucide-react'
import { useAccount } from 'wagmi'
import { type EscrowData, statusLabel, statusColor, formatAmount } from './useEscrowData'

interface Props {
  escrow: EscrowData
  onClick: () => void
}

export default function EscrowCard({ escrow, onClick }: Props) {
  const { address } = useAccount()
  const status = statusLabel(escrow.status)
  const color = statusColor(escrow.status)
  const isClient = address?.toLowerCase() === escrow.client.toLowerCase()
  const isWorker = address?.toLowerCase() === escrow.worker.toLowerCase()
  const isEvaluator = address?.toLowerCase() === escrow.evaluator.toLowerCase()

  const deadlineDate = new Date(Number(escrow.deadline) * 1000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [escrow.id])
  const pastDeadline = now > deadlineDate.getTime()

  const roles: string[] = []
  if (isClient) roles.push('Client')
  if (isWorker) roles.push('Worker')
  if (isEvaluator && !isClient) roles.push('Evaluator')

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl px-4 py-3.5 flex items-center gap-3 transition-all hover:bg-white/5 active:scale-[0.99]"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      {/* status dot */}
      <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: color }} />

      {/* main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
            {escrow.title || `Escrow #${escrow.id}`}
          </span>
          {escrow.status === 2 && (
            <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(232,109,122,0.15)', color: 'var(--danger)' }}>
              <AlertTriangle className="w-3 h-3" />Disputed
            </span>
          )}
          {escrow.evaluator.toLowerCase() !== escrow.client.toLowerCase() && (
            <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md"
              style={{ background: 'var(--violet-muted)', color: 'var(--violet)' }}>
              <Shield className="w-2.5 h-2.5" />Arbiter
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--muted)' }}>
            {formatAmount(escrow.amount)} USDC
          </span>
          <span className="text-xs" style={{ color: pastDeadline && escrow.status < 3 ? 'var(--danger)' : 'var(--subtle)' }}>
            <Clock className="w-3 h-3 inline mr-0.5 -mt-0.5" />
            {deadlineDate.toLocaleDateString()}
          </span>
          {roles.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>
              {roles.join(' · ')}
            </span>
          )}
        </div>
      </div>

      {/* status pill + chevron */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
          {status}
        </span>
        <ChevronRight className="w-4 h-4" style={{ color: 'var(--subtle)' }} />
      </div>
    </button>
  )
}
