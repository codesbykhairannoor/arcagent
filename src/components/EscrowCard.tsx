import { useMemo } from 'react'
import { Clock, Shield, AlertTriangle, ArrowUpRight, Coins } from 'lucide-react'
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

  // Status mapping: 0=Funded, 1=Submitted, 2=Disputed, 3=Completed, 4=Refunded, 5=Expired
  const isPending = escrow.status === 0 || escrow.status === 1
  const isTerminal = escrow.status >= 3

  const roles: { label: string; color: string }[] = []
  if (isClient) roles.push({ label: 'Client', color: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30' })
  if (isWorker) roles.push({ label: 'Worker', color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' })
  if (isEvaluator && !isClient) roles.push({ label: 'Arbiter', color: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30' })

  // Calculate step progress (1: Funded, 2: Submitted, 3: Completed)
  const progressStep = escrow.status === 0 ? 1 : escrow.status === 1 ? 2 : 3

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick() }}
      className="group relative w-full text-left rounded-3xl p-5 spatial-bento cursor-pointer outline-none transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] border border-slate-200/80 dark:border-white/[0.08] shadow-sm hover:shadow-xl hover:shadow-cyan-950/20"
    >
      {/* Top row: Status pill & Roles & Amount */}
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status pill with beacon */}
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md"
            style={{
              background: `color-mix(in srgb, ${color} 14%, transparent)`,
              border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`,
              color,
            }}
          >
            <span className="relative flex h-2 w-2">
              {isPending && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: color }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: color }}
              />
            </span>
            <span>{status}</span>
          </div>

          {/* Role tags */}
          {roles.map((r) => (
            <span
              key={r.label}
              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${r.color}`}
            >
              {r.label}
            </span>
          ))}

          {/* Arbiter flag */}
          {escrow.evaluator.toLowerCase() !== escrow.client.toLowerCase() && (
            <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
              <Shield className="w-2.5 h-2.5" /> 3rd-Party Arbiter
            </span>
          )}

          {escrow.status === 2 && (
            <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <AlertTriangle className="w-3 h-3 text-rose-500 dark:text-rose-400" /> Disputed
            </span>
          )}
        </div>

        {/* USDC Amount Display */}
        <div className="flex items-baseline gap-1.5 shrink-0 bg-slate-100 dark:bg-white/[0.05] px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm">
          <Coins className="w-4 h-4 text-cyan-600 dark:text-cyan-400 self-center" />
          <span className="display text-base font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {formatAmount(escrow.amount)}
          </span>
          <span className="text-[10px] font-extrabold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
            USDC
          </span>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-3.5">
        <h3 className="text-base font-black text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-1">
          {escrow.title || `Escrow #${escrow.id}`}
        </h3>
        {escrow.description && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {escrow.description}
          </p>
        )}
      </div>

      {/* Visual Cryptographic Stepper */}
      <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/[0.05] my-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-2">
          <span className={progressStep >= 1 ? 'text-purple-600 dark:text-cyan-400 font-extrabold' : 'text-slate-400'}>
            1. Locked
          </span>
          <span className={progressStep >= 2 ? 'text-purple-600 dark:text-cyan-400 font-extrabold' : 'text-slate-400'}>
            2. Delivery Hash
          </span>
          <span className={progressStep >= 3 ? (escrow.status === 4 ? 'text-amber-500 font-extrabold' : 'text-emerald-500 font-extrabold') : 'text-slate-400'}>
            {escrow.status === 4 ? '3. Refunded' : '3. Atomic Settlement'}
          </span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-900/80 rounded-full overflow-hidden flex gap-1 p-0.5 border border-slate-200/80 dark:border-white/[0.06]">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressStep >= 1 ? 'bg-gradient-to-r from-purple-500 to-cyan-400 flex-1' : 'bg-slate-300 dark:bg-slate-800 flex-1'
            }`}
          />
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressStep >= 2 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400 flex-1' : 'bg-slate-300 dark:bg-slate-800 flex-1'
            }`}
          />
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressStep >= 3
                ? escrow.status === 4 ? 'bg-amber-400 flex-1' : 'bg-emerald-400 flex-1'
                : 'bg-slate-300 dark:bg-slate-800 flex-1'
            }`}
          />
        </div>
      </div>

      {/* Participant Addresses preview */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono py-1 mb-1">
        <span>Client: <span className="text-slate-700 dark:text-slate-300 font-semibold">{escrow.client.slice(0, 6)}…{escrow.client.slice(-4)}</span></span>
        <span>Worker: <span className="text-slate-700 dark:text-slate-300 font-semibold">{escrow.worker.slice(0, 6)}…{escrow.worker.slice(-4)}</span></span>
      </div>

      {/* Bottom Footer: Deadline + Arrow action */}
      <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/80 dark:border-white/[0.06] text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Clock className={`w-3.5 h-3.5 ${pastDeadline && !isTerminal ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400'}`} />
          <span className={pastDeadline && !isTerminal ? 'text-rose-500 dark:text-rose-400 font-semibold' : ''}>
            {pastDeadline && !isTerminal ? 'Expired: ' : 'Deadline: '}
            {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all text-xs font-bold">
          <span>Manage Escrow</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}
