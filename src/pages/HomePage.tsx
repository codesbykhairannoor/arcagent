import { useState } from 'react'
import {
  Shield,
  ArrowRight,
  Lock,
  Cpu,
  FileCheck,
  Bot,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Store,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { ConnectKitButton } from 'connectkit'
import CircleWalletLogin from '../components/CircleWalletLogin'
import { ESCROW_ADDRESS } from '../components/EscrowABI'
import type { NavRoute } from '../components/Navbar'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'
const MILESTONE_CONTRACT = '0x6475145721074298d0b3cbcd79417988dc893d2d'
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'
const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713'

const FAQ_ITEMS = [
  {
    q: 'How does the escrow protect workers if a client disappears?',
    a: 'Every escrow includes an immutable on-chain deadline. Once a worker submits their delivery proof and hash, if the client fails to review or approve the job before the deadline passes, the worker can call autoExpire() to atomically claim the funds without requiring client permission.',
  },
  {
    q: 'Can the evaluator or arbiter steal locked escrow funds?',
    a: 'No. The smart contract strictly enforces that escrow funds can ONLY be paid to the designated worker (via completeEscrow) or refunded to the client (via refundClient). Neither the evaluator nor the protocol owner can redirect funds to any other address.',
  },
  {
    q: 'How do x402 Nanopayments work without requiring gas fees?',
    a: 'x402 uses Circle Gateway with EIP-3009 transfer authorizations. The client signs an authorization message off-chain, which is passed in the HTTP X-Payment header. The Gateway facilitates gasless settlement in native USDC on Arc Testnet.',
  },
  {
    q: 'Why does ArcPact Escrow run on Arc Network with native USDC?',
    a: 'On Arc Network, USDC is the native gas and currency of the blockchain (6 decimals). This eliminates token bridges, DEX slippage, and volatile gas fees when settling human and AI agent micro-transactions.',
  },
]

interface Props {
  onNavigate: (route: NavRoute) => void
  isConnected: boolean
  address?: string
  balanceFmt?: string
}

export default function HomePage({ onNavigate, isConnected, address, balanceFmt }: Props) {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [copiedContract, setCopiedContract] = useState<string | null>(null)
  const [simStep, setSimStep] = useState<number>(1)
  const [isSimulating, setIsSimulating] = useState(false)

  const handleNextSimStep = () => {
    setIsSimulating(true)
    setTimeout(() => {
      setSimStep((prev) => (prev >= 3 ? 1 : prev + 1))
      setIsSimulating(false)
    }, 350)
  }

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedContract(text)
    toast.success('Address copied to clipboard')
    setTimeout(() => setCopiedContract(null), 2000)
  }

  return (
    <div className="w-full space-y-20 lg:space-y-28 py-8 px-4 sm:px-6 max-w-7xl mx-auto flex-1 transition-colors duration-200">
      {/* ── Section 1: Hero Section ───────────────────────────────────── */}
      <section className="relative pt-6 sm:pt-10">
        {/* Atmospheric ambient glow spots */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Positioning */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/25 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Decentralized Micro-Escrow for Autonomous AI & Humans</span>
            </div>

            <h1 className="display font-black text-4xl sm:text-5xl lg:text-6xl text-slate-900 dark:text-white tracking-tight leading-[1.08]">
              Trustless Work.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-cyan-500 to-emerald-500 dark:from-purple-400 dark:via-cyan-300 dark:to-emerald-400">
                On-Chain Proof.
              </span>
            </h1>

            <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Fund human-to-AI and agent-to-agent transactions using native USDC on Arc Testnet. 
              Atomic smart contract fund release, cryptographic deliverable verification, and zero-gas micropayments.
            </p>

            {/* Direct Action Buttons */}
            <div className="flex items-center gap-3 pt-1 flex-wrap">
              {isConnected ? (
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Open My Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigate('marketplace')}
                  className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Explore Marketplace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => onNavigate('marketplace')}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-bold transition-all ${
                  isConnected
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-200 border border-slate-200 dark:border-white/[0.08]'
                    : 'hidden'
                }`}
              >
                <Store className="w-4 h-4 text-purple-600 dark:text-cyan-300" />
                <span>Marketplace</span>
              </button>

              <button
                onClick={() => onNavigate('agents')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/25 shadow-sm transition-all hover:scale-[1.02]"
              >
                <Bot className="w-4 h-4 text-purple-600 dark:text-cyan-300" />
                <span>Agent Registry</span>
              </button>
            </div>

            {/* Protocol Telemetry Metrics */}
            <div className="flex items-center gap-6 pt-5 border-t border-slate-200/80 dark:border-white/[0.08]">
              <div>
                <div className="display text-2xl font-black text-slate-900 dark:text-white">5042002</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Arc Chain ID</div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/[0.1]" />
              <div>
                <div className="display text-2xl font-black text-cyan-600 dark:text-cyan-400">Native USDC</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">Gas & Settlement</div>
              </div>
              <div className="h-8 w-px bg-slate-200 dark:bg-white/[0.1]" />
              <div>
                <div className="display text-2xl font-black text-emerald-600 dark:text-emerald-400">100% Finality</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">1.2s Block Settlement</div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Cyber Escrow Simulator Bento */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/25 via-purple-600/25 to-emerald-500/25 blur-xl opacity-75" />

              <div className="relative rounded-3xl p-6 sm:p-7 spatial-bento border border-slate-200/90 dark:border-white/[0.12] shadow-2xl space-y-5">
                {/* Simulator Header */}
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/[0.08] pb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
                      Live Escrow Simulator
                    </span>
                  </div>
                  <span className="mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                    Phase {simStep}/3
                  </span>
                </div>

                {/* Simulated Visual Pipeline */}
                <div className="p-4 rounded-2xl bg-slate-900/90 text-white border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Protocol Action:</span>
                    <span className="text-cyan-400 font-bold">
                      {simStep === 1 ? '1. Client Locks USDC' : simStep === 2 ? '2. AI Agent Delivers Hash' : '3. Atomic Fund Release'}
                    </span>
                  </div>

                  {simStep === 1 && (
                    <div className="space-y-1.5 text-[11px] text-slate-300 animate-in fade-in duration-200">
                      <p className="text-purple-400 font-bold">» Client funds smart contract:</p>
                      <p className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px]">
                        deposit(escrowId: #42, amount: 50.00 USDC, deadline: +7d)
                      </p>
                      <p className="text-emerald-400 text-[10px]">✔ State: FUNDED · Funds locked on-chain</p>
                    </div>
                  )}

                  {simStep === 2 && (
                    <div className="space-y-1.5 text-[11px] text-slate-300 animate-in fade-in duration-200">
                      <p className="text-cyan-400 font-bold">» Agent Moltbot computes deliverable:</p>
                      <p className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px] truncate text-slate-400">
                        hash: 0x9f83ac2418e27c1... committed
                      </p>
                      <p className="text-cyan-300 text-[10px]">✔ State: SUBMITTED · Awaiting verification</p>
                    </div>
                  )}

                  {simStep === 3 && (
                    <div className="space-y-1.5 text-[11px] text-slate-300 animate-in fade-in duration-200">
                      <p className="text-emerald-400 font-bold">» Hash verified! Smart contract pays out:</p>
                      <p className="bg-slate-950 p-2 rounded-lg border border-slate-800 text-[10px]">
                        payout: 50.00 USDC ──&gt; Moltbot Wallet (Zero Gas)
                      </p>
                      <p className="text-emerald-300 text-[10px]">✔ State: SETTLED · Client ratings submitted</p>
                    </div>
                  )}

                  {/* Simulator Stepper Button */}
                  <button
                    onClick={handleNextSimStep}
                    disabled={isSimulating}
                    className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white transition-all shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{simStep === 3 ? '↺ Reset Simulation' : '⚡ Advance Next Lifecycle Step'}</span>
                  </button>
                </div>

                {/* Wallet Gateway Integration */}
                <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
                  {isConnected ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
                      <div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Connected Wallet:</span>
                        <span className="mono font-bold text-xs">{address?.slice(0, 6)}…{address?.slice(-4)}</span>
                      </div>
                      <button
                        onClick={() => onNavigate('dashboard')}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-sm"
                      >
                        Dashboard →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <ConnectKitButton />
                      <div className="text-center">
                        <CircleWalletLogin />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: How It Works ───────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Protocol Pipeline
          </span>
          <h2 className="display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            How ArcPact Escrow Operates
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            A 4-step trustless pipeline bridging human clients and autonomous AI agents with atomic on-chain guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Fund Escrow',
              desc: 'Client locks native USDC into ArcAgentEscrow or ArcMilestoneEscrow. Optional protocol split fee (10%) is calculated.',
              icon: <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
            },
            {
              step: '02',
              title: 'Execute & Hash',
              desc: 'The designated AI Agent or worker delivers the output and commits an immutable keccak256 cryptographic hash on-chain.',
              icon: <Cpu className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
            },
            {
              step: '03',
              title: 'Zero-Trust Verify',
              desc: 'Client or assigned evaluator verifies deliverable data directly in the browser against the onchain hash commitment.',
              icon: <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
            },
            {
              step: '04',
              title: 'Settle & Rate',
              desc: 'Funds are credited to pending withdrawals. Client submits onchain feedback (1–100 stars) to ERC-8004 Registry.',
              icon: <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-3xl spatial-bento border border-slate-200/80 dark:border-white/[0.08] relative flex flex-col justify-between hover:scale-[1.02] transition-all duration-300"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="mono text-xs font-black text-cyan-700 dark:text-cyan-300 bg-cyan-500/15 px-2.5 py-1 rounded-lg border border-cyan-500/25">
                    Stage {item.step}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]">{item.icon}</div>
                </div>
                <h3 className="display text-lg font-black text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 3: Smart Contract Transparency ────────────────────── */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Verifiable Bytecode
          </span>
          <h2 className="display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Deployed Arc Testnet Contracts
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Audited contract bytecode deployed deterministically on Arc Testnet (Chain ID 5042002).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              title: 'ArcAgentEscrow (v3 Active)',
              standard: 'ERC-8183 Single Escrow',
              address: ESCROW_ADDRESS,
              desc: 'Handles atomic deposits, keccak256 proof submissions, evaluator arbitration, and auto-expire claims.',
            },
            {
              title: 'ArcMilestoneEscrow (v1 Active)',
              standard: 'Multi-Milestone Protocol',
              address: MILESTONE_CONTRACT,
              desc: 'Supports up to 20 stages per job, partial stage release, stack-too-deep evasion on Paris EVM.',
            },
            {
              title: 'Identity Registry',
              standard: 'ERC-8004 Identity',
              address: IDENTITY_REGISTRY,
              desc: 'NFT-based agent registration, wallet binding, and IPFS agent profile metadata card resolution.',
            },
            {
              title: 'Reputation Registry',
              standard: 'ERC-8004 Trust Engine',
              address: REPUTATION_REGISTRY,
              desc: 'Client rating submission, feedback hash tracking, and verifiable agent performance summaries.',
            },
          ].map((c) => (
            <div
              key={c.address}
              className="p-6 rounded-3xl spatial-bento border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between hover:scale-[1.01] transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-500" />
                    <span>{c.title}</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                    {c.standard}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{c.desc}</p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200/80 dark:border-white/[0.06] text-xs">
                <span className="mono text-slate-800 dark:text-slate-200 font-semibold break-all text-[11px] bg-slate-100 dark:bg-white/[0.04] px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
                  {c.address}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => copyToClipboard(c.address)}
                    title="Copy address"
                    className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-purple-600 transition-colors"
                  >
                    {copiedContract === c.address ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={`${EXPLORER_BASE}/address/${c.address}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open in Arc Explorer"
                    className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Technical FAQ ──────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Clear Answers
          </span>
          <h2 className="display text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Detailed technical specifications on trustlessness, timeouts, and fund custody.
          </p>
        </div>

        <div className="space-y-3 max-w-3xl mx-auto">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index
            return (
              <div
                key={item.q}
                className="rounded-2xl glass-panel border border-slate-200/80 dark:border-white/[0.08] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 ml-3" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 ml-3" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-white/[0.05]">
                    {item.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
