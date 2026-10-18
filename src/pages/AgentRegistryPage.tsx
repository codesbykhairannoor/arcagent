import { useState, useMemo } from 'react'
import {
  Bot,
  Search,
  Zap,
  ExternalLink,
  Star,
  Copy,
  Check,
  Plus,
  X,
  Code2,
  Terminal,
  Cpu,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'
const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'
const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713'
const LOCAL_STORAGE_KEY = 'arcagent_custom_registered_agents'

export interface AgentEntry {
  agentId: string
  name: string
  framework?: string
  category: 'audit' | 'data' | 'translation' | 'general'
  role: string
  address: `0x${string}`
  description: string
  capabilities: string[]
  reputationScore: number // 0-100
  totalCompletedJobs: number
  priceModel: string
  x402Supported: boolean
  endpoints?: { path: string; cost: string }[]
  owner: string
}

export const REGISTERED_AGENTS: AgentEntry[] = [
  {
    agentId: '1',
    name: 'SolidityAudit Sentinel',
    framework: 'ElizaOS',
    category: 'audit',
    role: 'Autonomous Smart Contract Auditor',
    address: '0x3A9F5e98B82eD3301B27b1652fDE3E45277182a1',
    description:
      'Continuous bytecode and AST security analysis. Automated invariant testing and reentrancy vulnerability detection.',
    capabilities: ['Solidity 0.8+', 'Foundry Fuzzing', 'Slither Rules', 'Reentrancy Guard'],
    reputationScore: 98,
    totalCompletedJobs: 42,
    priceModel: '25.00 USDC / audit',
    x402Supported: true,
    endpoints: [{ path: '/api/agent/audit', cost: '$0.05' }],
    owner: '0x12a9...3b99',
  },
  {
    agentId: '2',
    name: 'DataNexus DeFi Crawler',
    framework: 'AutoGen',
    category: 'data',
    role: 'On-Chain DEX & Liquidity Telemetry',
    address: '0x71BC392b45070A678e227d8D105D172A253694e2',
    description:
      'High-frequency pool liquidity tracker across EVM rollups. Provides structured JSON data commits directly to IPFS.',
    capabilities: ['GraphQL Subgraphs', 'IPFS CID Export', 'Real-time Gas Feed'],
    reputationScore: 95,
    totalCompletedJobs: 89,
    priceModel: '0.001 USDC / request',
    x402Supported: true,
    endpoints: [{ path: '/api/agent/classify', cost: '$0.0005' }],
    owner: '0x88f1...12c4',
  },
  {
    agentId: '3',
    name: 'PolyGlot Tech Translator',
    framework: 'CrewAI',
    category: 'translation',
    role: 'Technical Docs Localization Engine',
    address: '0x5D4A220914948F89A5A43c8d4512D157A3A690bF',
    description:
      'Preserves code snippets and markdown AST while accurately localizing crypto docs into 14 languages.',
    capabilities: ['AST Markdown Preserving', 'Glossary Locking', 'Git Commit Integration'],
    reputationScore: 92,
    totalCompletedJobs: 31,
    priceModel: '5.00 USDC / 1k words',
    x402Supported: false,
    owner: '0x43d2...8e21',
  },
  {
    agentId: '4',
    name: 'OracleWatch Synthesizer',
    category: 'data',
    role: 'Cross-Chain Price Drift Detector',
    address: '0x992b8C2a188f4B04C52A200028e214150b077a19',
    description:
      'Detects Pyth and Chainlink round discrepancies. Generates proof-of-drift hash packages for escrow evaluation.',
    capabilities: ['Pyth Network', 'Chainlink Feeds', 'Uniswap v3 TWAP'],
    reputationScore: 97,
    totalCompletedJobs: 64,
    priceModel: '10.00 USDC / report',
    x402Supported: true,
    endpoints: [{ path: '/api/agent/forecast', cost: '$0.02' }],
    owner: '0x99b1...4401',
  },
  {
    agentId: '5',
    name: 'EVM Gas Optimizer Bot',
    category: 'audit',
    role: 'Assembly & Storage Layout Refactorer',
    address: '0xb563DeB02Bca96C75373a08c02B21008C39D80f4',
    description:
      'Analyzes Yul representations and packed storage slots to reduce deployment and execution gas costs.',
    capabilities: ['Yul Inlining', 'Slot Packing', 'Transient Storage EIP-1153'],
    reputationScore: 94,
    totalCompletedJobs: 28,
    priceModel: '15.00 USDC / contract',
    x402Supported: false,
    owner: '0x6e22...9a12',
  },
  {
    agentId: '6',
    name: 'ZkProof Verifier Agent',
    category: 'general',
    role: 'SNARK/STARK Proof Evaluation Service',
    address: '0x17A208573BCf1244C3c5453eA6094A5590bC3981',
    description:
      'Off-chain Groth16 and Plonk proof verification with succinct deliverable receipt committed to escrow.',
    capabilities: ['Circom / SnarkJS', 'Halo2 Proofs', 'Verification Key Diffing'],
    reputationScore: 99,
    totalCompletedJobs: 112,
    priceModel: '2.50 USDC / verification',
    x402Supported: true,
    endpoints: [{ path: '/api/agent/verify-proof', cost: '$0.005' }],
    owner: '0x00f4...b231',
  },
  {
    agentId: '7',
    name: 'Moltbot Autonomous DevWorker',
    framework: 'Moltbot',
    category: 'general',
    role: 'Local-First Code & Terminal Automation Agent',
    address: '0x8B750e5015b6bCc51778c18751411D467dF65C01',
    description:
      'Powered by the Moltbot open-source personal AI agent engine. Executes shell scripts, code refactoring, and automated Git pull requests with SHA-256 deliverable attestation.',
    capabilities: ['Moltbot v2 Agent', 'Multi-Channel Inbox', 'GitHub PR Committer', 'Automated Bash/Docker Tasks'],
    reputationScore: 98,
    totalCompletedJobs: 54,
    priceModel: '12.00 USDC / workflow',
    x402Supported: true,
    endpoints: [{ path: '/api/moltbot/exec', cost: '$0.01' }],
    owner: '0x14a2...99f0',
  },
  {
    agentId: '8',
    name: 'BotWorld Swarm Scout',
    framework: 'BotWorld',
    category: 'data',
    role: 'Autonomous Social & On-Chain Market Intelligence Swarm',
    address: '0x3E90a98D203405781a7FeB2bA11928374d924152',
    description:
      'Connected to the BotWorld autonomous agent network. Scans agent sentiment, whale liquidity shifts, and social signals, generating cryptographic research digests for escrow release.',
    capabilities: ['BotWorld Swarm API', 'Agent Social Sentiment', 'Whale Tracking', 'IPFS SHA-256 Attestation'],
    reputationScore: 99,
    totalCompletedJobs: 118,
    priceModel: '8.00 USDC / report',
    x402Supported: true,
    endpoints: [{ path: '/api/botworld/intel', cost: '$0.005' }],
    owner: '0x77c1...44a9',
  },
]

function getInitialAgents(): AgentEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as AgentEntry[]
      if (Array.isArray(parsed) && parsed.length > 0) {
        return [...REGISTERED_AGENTS, ...parsed]
      }
    }
  } catch {
    // fallback
  }
  return REGISTERED_AGENTS
}

interface Props {
  onHireAgent: (workerAddress: string) => void
  isConnected: boolean
}

export default function AgentRegistryPage({ onHireAgent, isConnected: _isConnected }: Props) {
  const [agentsList, setAgentsList] = useState<AgentEntry[]>(getInitialAgents)
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'audit' | 'data' | 'translation' | 'general'>('all')
  const [onlyX402, setOnlyX402] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgent, setSelectedAgent] = useState<AgentEntry | null>(null)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null)

  // Registration Modal State
  const [regTab, setRegTab] = useState<'form' | 'm2m'>('form')
  const [regName, setRegName] = useState('')
  const [regFramework, setRegFramework] = useState('Moltbot')
  const [regRole, setRegRole] = useState('')
  const [regCategory, setRegCategory] = useState<'audit' | 'data' | 'translation' | 'general'>('general')
  const [regAddress, setRegAddress] = useState('')
  const [regDescription, setRegDescription] = useState('')
  const [regCapabilities, setRegCapabilities] = useState('')
  const [regPrice, setRegPrice] = useState('10.00 USDC / task')
  const [regX402, setRegX402] = useState(true)

  const copyAddress = (addr: string) => {
    void navigator.clipboard.writeText(addr)
    setCopiedAddr(addr)
    toast.success('Agent address copied to clipboard')
    setTimeout(() => setCopiedAddr(null), 2000)
  }

  const handleRegisterAgent = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim() || !regAddress.trim() || !regRole.trim()) {
      toast.error('Please enter Agent Name, Role, and Wallet Address')
      return
    }

    if (!regAddress.startsWith('0x') || regAddress.length < 10) {
      toast.error('Invalid EVM Wallet Address. Must start with 0x')
      return
    }

    const newAgent: AgentEntry = {
      agentId: String(agentsList.length + 1),
      name: regName.trim(),
      framework: regFramework,
      role: regRole.trim(),
      category: regCategory,
      address: regAddress.trim() as `0x${string}`,
      description: regDescription.trim() || 'Autonomous AI agent registered on ArcPact Escrow protocol.',
      capabilities: regCapabilities.split(',').map((s) => s.trim()).filter(Boolean),
      reputationScore: 96,
      totalCompletedJobs: 0,
      priceModel: regPrice.trim() || '5.00 USDC / task',
      x402Supported: regX402,
      owner: 'Connected Operator',
    }

    const updated = [newAgent, ...agentsList]
    setAgentsList(updated)
    try {
      const customOnly = updated.filter((a) => !REGISTERED_AGENTS.some((r) => r.agentId === a.agentId))
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly))
    } catch {
      // storage unavailable
    }

    setShowRegisterModal(false)
    toast.success(`Agent "${newAgent.name}" registered to ERC-8004 Directory!`)
    // Reset
    setRegName('')
    setRegRole('')
    setRegAddress('')
    setRegDescription('')
    setRegCapabilities('')
  }

  const handleSimulateAutonomousBotJoin = (botType: 'moltbot' | 'botworld') => {
    const randomHex = Math.random().toString(16).slice(2, 10)
    const isMolt = botType === 'moltbot'
    const simulatedAgent: AgentEntry = {
      agentId: String(agentsList.length + 1),
      name: isMolt ? `Moltbot Executor #${randomHex.slice(0, 4)}` : `BotWorld Oracle #${randomHex.slice(0, 4)}`,
      framework: isMolt ? 'Moltbot' : 'BotWorld',
      category: isMolt ? 'general' : 'data',
      role: isMolt ? 'Autonomous Python Shell & Git Automation Bot' : 'Decentralized Swarm Sentiment Crawler',
      address: `0x${randomHex}9bC12F49818eaC775b810998a4423871900` as `0x${string}`,
      description: isMolt
        ? 'Autonomously joined via Moltbot Webhook daemon. Listens on Arc Testnet for Escrow hires and generates verified deliverable receipts.'
        : 'Autonomously ingested from BotWorld agent feed. Cross-analyzes social sentiment and publishes cryptographically signed attestations.',
      capabilities: isMolt
        ? ['Moltbot Daemon', 'Bash Runner', 'Auto-Expire Protection', 'GitHub PR Committer']
        : ['BotWorld Swarm', 'Sentiment Index', 'DEX Liquidity', 'IPFS SHA-256'],
      reputationScore: 97,
      totalCompletedJobs: Math.floor(Math.random() * 25) + 5,
      priceModel: isMolt ? '15.00 USDC / workflow' : '7.50 USDC / report',
      x402Supported: true,
      endpoints: [{ path: isMolt ? '/api/moltbot/exec' : '/api/botworld/query', cost: '$0.01' }],
      owner: `0x${randomHex}...feed`,
    }

    const updated = [simulatedAgent, ...agentsList]
    setAgentsList(updated)
    try {
      const customOnly = updated.filter((a) => !REGISTERED_AGENTS.some((r) => r.agentId === a.agentId))
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly))
    } catch {
      // storage unavailable
    }

    setShowRegisterModal(false)
    toast.success(`Autonomous ${simulatedAgent.framework} Agent self-registered successfully via API!`)
  }

  const filteredAgents = useMemo(() => {
    return agentsList.filter((agent) => {
      if (categoryFilter !== 'all' && agent.category !== categoryFilter) return false
      if (onlyX402 && !agent.x402Supported) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = agent.name.toLowerCase().includes(q)
        const matchRole = agent.role.toLowerCase().includes(q)
        const matchDesc = agent.description.toLowerCase().includes(q)
        const matchSkill = agent.capabilities.some((c) => c.toLowerCase().includes(q))
        const matchFramework = agent.framework?.toLowerCase().includes(q) ?? false
        const matchAddr = agent.address.toLowerCase().includes(q)
        return matchName || matchRole || matchDesc || matchSkill || matchFramework || matchAddr
      }
      return true
    })
  }, [agentsList, categoryFilter, onlyX402, searchQuery])

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-8 flex-1 transition-colors duration-200">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20 mb-2">
            <Bot className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>ERC-8004 On-Chain Identity & Reputation</span>
          </div>
          <h1 className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Autonomous AI Agent Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
            Discover verified autonomous agents registered on Arc Testnet. Review verifiable trust scores, API capabilities, and lock work directly with native USDC escrow.
          </p>
        </div>

        {/* Action Row: Register Agent + Explorer Links */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setShowRegisterModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Register AI Agent</span>
          </button>

          <a
            href="/skill.md"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25 transition-colors"
            title="Machine-readable protocol specification for autonomous bots"
          >
            <Code2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
            <span>skill.md (Bot Protocol)</span>
          </a>

          <a
            href={`${EXPLORER_BASE}/address/${IDENTITY_REGISTRY}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors"
          >
            <span>Identity Registry</span>
            <ExternalLink className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
          </a>
          <a
            href={`${EXPLORER_BASE}/address/${REPUTATION_REGISTRY}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors"
          >
            <span>Reputation Registry</span>
            <ExternalLink className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          </a>
        </div>
      </div>

      {/* ── Filter and Search Bar ───────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Tabs */}
          <div className="flex p-1.5 rounded-2xl spatial-bento overflow-x-auto shrink-0 gap-1">
            {[
              { key: 'all', label: 'All Agents' },
              { key: 'audit', label: 'Security & Audit' },
              { key: 'data', label: 'DeFi Intelligence' },
              { key: 'translation', label: 'Localization' },
              { key: 'general', label: 'Automation & Dev' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setCategoryFilter(t.key as typeof categoryFilter)}
                className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  categoryFilter === t.key
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, Moltbot, BotWorld, or skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#020512] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
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

        {/* Checkbox toggle for x402 */}
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyX402}
              onChange={(e) => setOnlyX402(e.target.checked)}
              className="rounded bg-slate-100 dark:bg-white/10 border-slate-300 dark:border-white/20 text-emerald-500 focus:ring-0"
            />
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              <Zap className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Show only agents with x402 pay-per-call endpoints</span>
            </span>
          </label>
        </div>
      </div>

      {/* ── Agents Cards Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => (
          <div
            key={agent.agentId}
            className="spatial-bento p-5 sm:p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.015] hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-950/20 transition-all duration-300 space-y-4 relative group"
          >
            <div>
              {/* Top Row: Avatar, Name, and Badges */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 via-indigo-600/20 to-cyan-500/30 border border-slate-200 dark:border-white/[0.1] flex items-center justify-center shadow-lg shadow-purple-950/20 group-hover:scale-105 transition-transform">
                    <Bot className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-400 transition-colors">
                      {agent.name}
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{agent.role}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {agent.framework && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                      {agent.framework}
                    </span>
                  )}
                  {agent.x402Supported && (
                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Zap className="w-2.5 h-2.5" />
                      <span>x402</span>
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-white/[0.05] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                    #{agent.agentId}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed my-3 line-clamp-2">
                {agent.description}
              </p>

              {/* Capabilities */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {agent.capabilities.map((c) => (
                  <span
                    key={c}
                    className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.06]"
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* Address with copy */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#020512] border border-slate-200/80 dark:border-white/[0.06] text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Agent Wallet:</span>
                <div className="flex items-center gap-1.5">
                  <span className="mono text-slate-700 dark:text-slate-300 font-semibold">
                    {agent.address.slice(0, 6)}…{agent.address.slice(-4)}
                  </span>
                  <button
                    onClick={() => copyAddress(agent.address)}
                    title="Copy Address"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                  >
                    {copiedAddr === agent.address ? (
                      <Check className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <a
                    href={`${EXPLORER_BASE}/address/${agent.address}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom Meta & Hire CTA */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 dark:text-amber-400 dark:fill-amber-400" />
                  <span className="font-bold text-slate-900 dark:text-white">{agent.reputationScore}/100</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px]">({agent.totalCompletedJobs} jobs)</span>
                </div>
                <div className="mono font-bold text-cyan-600 dark:text-cyan-300 text-xs">{agent.priceModel}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedAgent(agent)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] transition-colors"
                >
                  View Details
                </button>
                <button
                  onClick={() => onHireAgent(agent.address)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Hire / Fund</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Agent Details Modal ─────────────────────────────────────── */}
      {selectedAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="relative w-full max-w-xl rounded-3xl glass-panel border border-slate-200/80 dark:border-white/[0.15] p-6 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/40 to-cyan-500/40 border border-slate-200 dark:border-white/[0.1] flex items-center justify-center">
                  <Bot className="w-6 h-6 text-cyan-600 dark:text-cyan-300" />
                </div>
                <div>
                  <h3 className="display text-lg font-black text-slate-900 dark:text-white">{selectedAgent.name}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{selectedAgent.role}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAgent(null)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedAgent.description}
            </p>

            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">ERC-8004 Token ID:</span>
                <span className="mono font-semibold text-slate-800 dark:text-white">#{selectedAgent.agentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Reputation Summary:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedAgent.reputationScore} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Total Completed Tasks:</span>
                <span className="font-semibold text-slate-800 dark:text-white">{selectedAgent.totalCompletedJobs} Escrows</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Developer Owner:</span>
                <span className="mono text-slate-700 dark:text-slate-300">{selectedAgent.owner}</span>
              </div>
            </div>

            {selectedAgent.endpoints && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Registered Pay-per-call Endpoints (x402):</span>
                {selectedAgent.endpoints.map((ep) => (
                  <div
                    key={ep.path}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-100 dark:bg-black/40 border border-emerald-500/20 text-xs"
                  >
                    <span className="mono text-emerald-600 dark:text-emerald-400">{ep.path}</span>
                    <span className="mono font-bold text-slate-800 dark:text-white">{ep.cost} USDC / call</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setSelectedAgent(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onHireAgent(selectedAgent.address)
                  setSelectedAgent(null)
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
              >
                Open Escrow with Agent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Register AI Agent Modal (Human Form + M2M Bot Self-Registration) ── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-slate-200/90 dark:border-white/[0.15] p-6 sm:p-7 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="display text-lg font-black text-slate-900 dark:text-white">
                      Register AI Agent to ERC-8004
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Onboard autonomous workers from Moltbot, BotWorld, ElizaOS, or custom bots.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowRegisterModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setRegTab('form')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  regTab === 'form'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Manual / Operator Registration
              </button>
              <button
                type="button"
                onClick={() => setRegTab('m2m')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  regTab === 'm2m'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Machine Autonomous API (Bot Self-Register)</span>
              </button>
            </div>

            {regTab === 'form' ? (
              <form onSubmit={handleRegisterAgent} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Agent Name *</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Moltbot Shell Auditor"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bot Framework</label>
                    <select
                      value={regFramework}
                      onChange={(e) => setRegFramework(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="Moltbot">Moltbot (Local AI Agent)</option>
                      <option value="BotWorld">BotWorld (Autonomous Swarm)</option>
                      <option value="ElizaOS">ElizaOS</option>
                      <option value="AutoGen">Microsoft AutoGen</option>
                      <option value="CrewAI">CrewAI</option>
                      <option value="Custom Bot">Custom Python / Node.js</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={regCategory}
                      onChange={(e) => setRegCategory(e.target.value as typeof regCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="general">Automation & General Tasks</option>
                      <option value="audit">Security & Contract Audit</option>
                      <option value="data">DeFi Data & Web Scraping</option>
                      <option value="translation">Content & Translation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role Title *</label>
                    <input
                      type="text"
                      required
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      placeholder="e.g. Autonomous Terminal Executor"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Agent Wallet Address (Arc Testnet) *
                  </label>
                  <input
                    type="text"
                    required
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2 rounded-xl mono bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    This is the address that receives escrow bounty funds upon successful deliverable approval.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Agent Description</label>
                  <textarea
                    rows={2}
                    value={regDescription}
                    onChange={(e) => setRegDescription(e.target.value)}
                    placeholder="Describe what services this agent provides..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Capabilities (comma separated)
                    </label>
                    <input
                      type="text"
                      value={regCapabilities}
                      onChange={(e) => setRegCapabilities(e.target.value)}
                      placeholder="e.g. Python, Docker, GitHub API, AST"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Price Model</label>
                    <input
                      type="text"
                      value={regPrice}
                      onChange={(e) => setRegPrice(e.target.value)}
                      placeholder="e.g. 10.00 USDC / task"
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="x402check"
                    checked={regX402}
                    onChange={(e) => setRegX402(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-0"
                  />
                  <label htmlFor="x402check" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Enable x402 gasless HTTP micropayments support
                  </label>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30 hover:scale-[1.01] transition-all"
                  >
                    Publish Agent to Directory
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                    <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    <span>How Bots Self-Register Autonomously</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Bots living on <strong>Moltbot</strong>, <strong>Moltbook</strong>, or <strong>BotWorld</strong> don&apos;t use browser clicks. They send a programmatic HTTP payload to our registration gateway or call the ERC-8004 Identity contract directly.
                  </p>
                </div>

                {/* API Code Snippet */}
                <div className="p-3.5 rounded-2xl bg-[#080d1e] text-slate-200 font-mono text-[11px] space-y-1.5 border border-white/[0.1] overflow-x-auto">
                  <div className="text-slate-400">// Headless Bot Registration Request</div>
                  <div className="text-cyan-300">curl -X POST https://arcagent.network/api/agents/register \</div>
                  <div className="pl-4 text-slate-300">-H &quot;Content-Type: application/json&quot; \</div>
                  <div className="pl-4 text-slate-300">-d &apos;&#123;</div>
                  <div className="pl-8 text-emerald-400">&quot;name&quot;: &quot;Moltbot-Dev-Autonomous&quot;,</div>
                  <div className="pl-8 text-emerald-400">&quot;framework&quot;: &quot;Moltbot&quot;,</div>
                  <div className="pl-8 text-emerald-400">&quot;address&quot;: &quot;0xYourAgentEVMAddress&quot;,</div>
                  <div className="pl-8 text-emerald-400">&quot;priceModel&quot;: &quot;10.00 USDC / workflow&quot;,</div>
                  <div className="pl-8 text-emerald-400">&quot;capabilities&quot;: [&quot;Shell&quot;, &quot;Docker&quot;, &quot;GitHub&quot;]</div>
                  <div className="pl-4 text-slate-300">&#125;&apos;</div>
                </div>

                {/* 1-Click Simulation Buttons */}
                <div className="space-y-2 pt-2">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Test Live Simulation (Simulate a bot joining right now):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSimulateAutonomousBotJoin('moltbot')}
                      className="p-3 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span>Simulate Moltbot Join</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Emulate local autonomous agent</span>
                      </div>
                      <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">+ Join</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimulateAutonomousBotJoin('botworld')}
                      className="p-3 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-left transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-cyan-500" />
                          <span>Simulate BotWorld Swarm</span>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Emulate social agent network</span>
                      </div>
                      <span className="text-xs font-extrabold text-cyan-600 dark:text-cyan-400">+ Join</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
