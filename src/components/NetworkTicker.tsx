import { Radio, Zap, ShieldCheck, Cpu, ArrowUpRight } from 'lucide-react'

const TICKER_ITEMS = [
  {
    icon: <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />,
    label: 'ARC TESTNET',
    value: 'Chain ID 5042002 (1.2s Finality)',
    highlight: true,
  },
  {
    icon: <Zap className="w-3 h-3 text-cyan-400" />,
    label: 'NATIVE GAS',
    value: '<$0.001 USDC (Zero Slippage)',
  },
  {
    icon: <ShieldCheck className="w-3 h-3 text-purple-400" />,
    label: 'CONTRACTS',
    value: 'ArcAgentEscrow v3 + ArcMilestoneEscrow v1 Live',
  },
  {
    icon: <Cpu className="w-3 h-3 text-amber-400" />,
    label: 'AGENT PROTOCOL',
    value: 'ERC-8004 Identity & Moltbot / BotWorld Swarm Ready',
  },
  {
    icon: <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />,
    label: 'LATEST TX',
    value: 'Escrow #42: 50.00 USDC released via keccak256 proof',
  },
  {
    icon: <ArrowUpRight className="w-3 h-3 text-cyan-400" />,
    label: 'x402 GATEWAY',
    value: 'EIP-3009 Gasless Nanopayments Active',
  },
]

export default function NetworkTicker() {
  return (
    <div className="relative w-full overflow-hidden bg-slate-950/70 dark:bg-[#030612]/80 backdrop-blur-md border-b border-slate-200/60 dark:border-white/[0.06] text-[11px] font-mono py-1.5 transition-colors duration-200 z-30 select-none">
      <div className="flex animate-marquee items-center gap-8 whitespace-nowrap">
        {/* First Loop */}
        {TICKER_ITEMS.map((item, idx) => (
          <div key={`ticker-1-${idx}`} className="flex items-center gap-2 shrink-0 text-slate-400 dark:text-slate-400">
            {item.icon}
            <span className="font-extrabold text-slate-900 dark:text-slate-200">{item.label}:</span>
            <span className={item.highlight ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
              {item.value}
            </span>
            <span className="text-slate-300 dark:text-white/[0.1] px-2">•</span>
          </div>
        ))}

        {/* Second Loop for Seamless Infinite Marquee */}
        {TICKER_ITEMS.map((item, idx) => (
          <div key={`ticker-2-${idx}`} className="flex items-center gap-2 shrink-0 text-slate-400 dark:text-slate-400">
            {item.icon}
            <span className="font-extrabold text-slate-900 dark:text-slate-200">{item.label}:</span>
            <span className={item.highlight ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
              {item.value}
            </span>
            <span className="text-slate-300 dark:text-white/[0.1] px-2">•</span>
          </div>
        ))}
      </div>
    </div>
  )
}
