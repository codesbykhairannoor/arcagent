import { Shield, Code2, ExternalLink, Zap } from 'lucide-react'
import { ESCROW_ADDRESS } from './EscrowABI'
import type { NavRoute } from './Navbar'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'
const GITHUB_REPO = 'https://github.com/codesbykhairannoor/arcagent.git'

interface Props {
  onNavigate: (route: NavRoute) => void
}

export default function Footer({ onNavigate }: Props) {
  return (
    <footer className="border-t border-slate-200/80 dark:border-white/[0.08] bg-slate-100/70 dark:bg-[#030611] py-12 px-4 sm:px-6 mt-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1px] flex items-center justify-center">
                <div className="w-full h-full bg-[#070b18] rounded-[10px] flex items-center justify-center">
                  <Shield className="w-4 h-4 text-cyan-300" />
                </div>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white text-base">ArcAgent Escrow</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Autonomous micro-escrow & milestone payout platform for human-to-AI and agent-to-agent transactions using native USDC on Arc.
            </p>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Chain ID: <span className="mono text-slate-700 dark:text-slate-300 font-semibold">5042002</span> · Native USDC Gas
            </div>
          </div>

          {/* Platform Navigation */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Platform</h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors">
                  Protocol Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('marketplace')} className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors">
                  Jobs Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('agents')} className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors">
                  ERC-8004 Agent Registry
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors">
                  My Workspace Dashboard
                </button>
              </li>
            </ul>
          </div>

          {/* Tools & Developers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Developers & Tools</h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <button onClick={() => onNavigate('developer')} className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <span>x402 Nanopayments Console</span>
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('verifier')} className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors">
                  Zero-Trust Proof Verifier
                </button>
              </li>
              <li>
                <a
                  href="https://developers.circle.com/gateway/nanopayments"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>Circle Gateway Docs</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href="https://docs.arc.io"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>Arc Network Documentation</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>

          {/* Contracts & Repos */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Verified Code</h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a
                  href={GITHUB_REPO}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <Code2 className="w-3 h-3" />
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a
                  href={`${EXPLORER_BASE}/address/${ESCROW_ADDRESS}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>ArcAgentEscrow on Explorer</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <a
                  href={`${EXPLORER_BASE}/address/0x6475145721074298d0b3cbcd79417988dc893d2d`}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-purple-600 dark:hover:text-cyan-300 transition-colors flex items-center gap-1"
                >
                  <span>ArcMilestoneEscrow on Explorer</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© 2026 ArcAgent Protocol · Built with Arc Studio on Arc Testnet.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span>Smart Contracts Active</span>
            </span>
            <span>USDC Native Gas</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
