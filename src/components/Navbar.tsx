import { ConnectKitButton } from 'connectkit'
import { useDisconnect } from 'wagmi'
import {
  Shield,
  Plus,
  Layers,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Copy,
  Check,
  ChevronDown,
  Wrench,
  FileCheck,
  Code2,
  ExternalLink,
  Zap,
  LayoutDashboard,
  Store,
  Bot,
  HelpCircle,
  UserCog,
  Wallet,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from './ThemeProvider'
import { useCircleWallet } from './CircleWalletLogin'
import { useUserProfile, PRESET_AVATARS } from './useUserProfile'
import { toast } from 'sonner'
import { BrandLogo } from './BrandLogo'

export type NavRoute = 'home' | 'marketplace' | 'agents' | 'dashboard' | 'developer' | 'verifier' | 'profile'

interface Props {
  currentRoute: NavRoute
  onRouteChange: (route: NavRoute) => void
  onOpenCreateEscrow: () => void
  onOpenCreateMilestone: () => void
  onOpenEditProfile?: () => void
  address?: string
  isConnected: boolean
  totalUserContracts: number
}

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'

export default function Navbar({
  currentRoute,
  onRouteChange,
  onOpenCreateEscrow,
  onOpenCreateMilestone,
  onOpenEditProfile,
  address,
  isConnected,
  totalUserContracts,
}: Props) {
  const { profile } = useUserProfile(address)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false)
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [copiedAddr, setCopiedAddr] = useState(false)

  const toolsRef = useRef<HTMLDivElement>(null)
  const createRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { resolvedTheme, setTheme } = useTheme()
  const { address: circleAddress, logout: circleLogout } = useCircleWallet()
  const { disconnect } = useDisconnect()

  const activeAddress = address || circleAddress

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setToolsDropdownOpen(false)
      }
      if (createRef.current && !createRef.current.contains(event.target as Node)) {
        setCreateDropdownOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setToolsDropdownOpen(false)
        setCreateDropdownOpen(false)
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleNavClick = (route: NavRoute) => {
    onRouteChange(route)
    setMobileMenuOpen(false)
    setToolsDropdownOpen(false)
    setCreateDropdownOpen(false)
    setUserMenuOpen(false)
  }

  const isToolsActive = currentRoute === 'verifier' || currentRoute === 'developer'

  return (
    <header className="relative z-50 w-full backdrop-blur-2xl bg-white/95 dark:bg-[#040714]/95 border-b border-slate-200/80 dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* ── Brand Logo ────────────────────────────────────────────── */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left group outline-none"
            aria-label="ArcPact Home"
          >
            <BrandLogo className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 group-hover:scale-105 transition-transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="display text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Arc<span className="text-blue-600 dark:text-blue-400">Pact</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  v4
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Arc Testnet</span>
              </div>
            </div>
          </button>

          {/* ── Desktop Navigation Links ────────────────────────────── */}
          <nav className="hidden lg:flex items-center gap-1">
            {/* Authenticated Workspace Tab (Only shown when wallet connected) */}
            {isConnected && (
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  currentRoute === 'dashboard'
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.04]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
                {totalUserContracts > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      currentRoute === 'dashboard'
                        ? 'bg-white/25 text-white'
                        : 'bg-purple-500/15 text-purple-700 dark:bg-purple-500/25 dark:text-purple-300'
                    }`}
                  >
                    {totalUserContracts}
                  </span>
                )}
              </button>
            )}

            {/* Marketplace */}
            <button
              onClick={() => handleNavClick('marketplace')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                currentRoute === 'marketplace'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-white/[0.08] dark:text-white dark:border-white/[0.12] shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.04]'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </button>

            {/* Agent Registry */}
            <button
              onClick={() => handleNavClick('agents')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                currentRoute === 'agents'
                  ? 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-white/[0.08] dark:text-white dark:border-white/[0.12] shadow-sm'
                  : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.04]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Agent Registry</span>
              <span className="hidden xl:inline-block px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30">
                ERC-8004
              </span>
            </button>

            {/* Tools Dropdown (Consolidates x402 Studio + Verifier + Explorer into one clean menu) */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setToolsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isToolsActive
                    ? 'bg-purple-100 text-purple-900 border border-purple-300 dark:bg-white/[0.08] dark:text-white dark:border-white/[0.12] shadow-sm'
                    : 'text-slate-800 hover:text-slate-950 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/[0.04]'
                }`}
                aria-haspopup="true"
                aria-expanded={toolsDropdownOpen}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Tools</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-200 ${
                    toolsDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-2xl p-1.5 bg-white dark:bg-[#070c1e] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => handleNavClick('verifier')}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors ${
                      currentRoute === 'verifier'
                        ? 'bg-purple-50 dark:bg-white/[0.06] text-purple-700 dark:text-white'
                        : 'hover:bg-slate-100/70 dark:hover:bg-white/[0.03] text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 mt-0.5">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>Delivery Verifier</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Verify SHA-256 work hashes and cryptographic proof artifacts.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleNavClick('developer')}
                    className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left transition-colors mt-1 ${
                      currentRoute === 'developer'
                        ? 'bg-purple-50 dark:bg-white/[0.06] text-purple-700 dark:text-white'
                        : 'hover:bg-slate-100/70 dark:hover:bg-white/[0.03] text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 mt-0.5">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        <span>x402 Studio</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-300">
                          API
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Test gasless EIP-3009 nanopayments via HTTP 402 header.
                      </p>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-200/80 dark:border-white/[0.06]" />

                  <a
                    href={EXPLORER_BASE}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Arc Block Explorer</span>
                    </span>
                    <span className="text-[10px] mono text-slate-400">5042002</span>
                  </a>
                </div>
              )}
            </div>

            {/* Guest Info Link (Only shown when disconnected) */}
            {!isConnected && (
              <button
                onClick={() => handleNavClick('home')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  currentRoute === 'home'
                    ? 'text-purple-600 dark:text-purple-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 opacity-70" />
                <span>Protocol</span>
              </button>
            )}
          </nav>
        </div>

        {/* ── Right Action Bar ────────────────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unified Create Dropdown (Connected Mode Only) */}
          {isConnected && (
            <div className="relative hidden sm:block" ref={createRef}>
              <button
                type="button"
                onClick={() => setCreateDropdownOpen((prev) => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                aria-haspopup="true"
                aria-expanded={createDropdownOpen}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
                <ChevronDown
                  className={`w-3 h-3 opacity-75 transition-transform duration-200 ${
                    createDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {createDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl p-1.5 bg-white dark:bg-[#070c1e] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    onClick={() => {
                      onOpenCreateEscrow()
                      setCreateDropdownOpen(false)
                    }}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left hover:bg-purple-50 dark:hover:bg-white/[0.04] transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Single Escrow</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-300">
                          v3
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Direct escrow with cryptographic deliverable proof hash and auto-release deadline.
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onOpenCreateMilestone()
                      setCreateDropdownOpen(false)
                    }}
                    className="w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left hover:bg-cyan-500/5 dark:hover:bg-white/[0.04] transition-colors group mt-1"
                  >
                    <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform mt-0.5">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>Milestone Project</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-cyan-500/15 text-cyan-600 dark:text-cyan-300">
                          v1
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                        Multi-phase contract with staged deliverables and modular milestone payouts.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Theme Toggle (Sleek single button) */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100/90 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] transition-all shrink-0"
            title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Unified Web3 Identity & Wallet Pill */}
          {activeAddress ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-2xl border transition-all duration-150 hover:scale-[1.02] ${
                  currentRoute === 'profile' || userMenuOpen
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-slate-200 border-slate-200 dark:border-white/[0.08]'
                }`}
                title="Account, Profile & Wallet Settings"
                aria-label="User Account Menu"
                aria-haspopup="true"
                aria-expanded={userMenuOpen}
              >
                <div
                  className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${
                    PRESET_AVATARS.find((p) => p.id === profile.avatar)?.gradient ?? 'from-purple-600 to-indigo-600'
                  } flex items-center justify-center text-sm shadow-sm shrink-0`}
                >
                  {PRESET_AVATARS.find((p) => p.id === profile.avatar)?.icon ?? '👤'}
                </div>
                <div className="text-left leading-tight hidden sm:block">
                  <div className="text-xs font-bold truncate max-w-[105px]">
                    {profile.displayName || `${activeAddress.slice(0, 6)}…${activeAddress.slice(-4)}`}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{activeAddress.slice(0, 6)}…{activeAddress.slice(-4)}</span>
                  </div>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    userMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Identity & Wallet Dropdown Menu */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-3xl p-3 bg-white dark:bg-[#070c1e] border border-slate-200/90 dark:border-white/[0.1] shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150 space-y-3">
                  {/* Account Header */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                        PRESET_AVATARS.find((p) => p.id === profile.avatar)?.gradient ?? 'from-purple-600 to-indigo-600'
                      } flex items-center justify-center text-xl shadow-md shrink-0`}
                    >
                      {PRESET_AVATARS.find((p) => p.id === profile.avatar)?.icon ?? '👤'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {profile.displayName || 'Arc Operator'}
                      </div>
                      {profile.handle && (
                        <div className="text-[11px] font-bold text-purple-600 dark:text-cyan-400 truncate">
                          {profile.handle}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        <span className="truncate">{activeAddress.slice(0, 6)}…{activeAddress.slice(-4)}</span>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(activeAddress)
                            setCopiedAddr(true)
                            toast.success('Address copied!')
                            setTimeout(() => setCopiedAddr(false), 2000)
                          }}
                          className="hover:text-purple-600 dark:hover:text-cyan-400 transition-colors"
                          title="Copy Address"
                        >
                          {copiedAddr ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={`${EXPLORER_BASE}/address/${activeAddress}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-cyan-400 transition-colors"
                          title="View on Arc Explorer"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Network Telemetry */}
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Arc Testnet (5042002)
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">1.2s Finality</span>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1">
                    <button
                      type="button"
                      onClick={() => handleNavClick('profile')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        currentRoute === 'profile'
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-300'
                      }`}
                    >
                      <UserCog className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>My Profile & Settings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleNavClick('dashboard')}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        currentRoute === 'dashboard'
                          ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4 text-cyan-500" />
                      <span>Workspace & Escrows</span>
                    </button>

                    {!circleAddress && (
                      <ConnectKitButton.Custom>
                        {({ show }) => (
                          <button
                            type="button"
                            onClick={() => {
                              setUserMenuOpen(false)
                              show?.()
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors"
                          >
                            <Wallet className="w-4 h-4 text-blue-500" />
                            <span>Switch / Manage Wallet</span>
                          </button>
                        )}
                      </ConnectKitButton.Custom>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setUserMenuOpen(false)
                        if (circleAddress) {
                          circleLogout()
                        } else {
                          disconnect()
                        }
                        toast.info('Wallet disconnected')
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors border-t border-slate-200/80 dark:border-white/[0.06] pt-2 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Disconnect Wallet</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ConnectKitButton />
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-slate-300 dark:hover:text-white"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu Dropdown ────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-1 bg-white/95 dark:bg-[#050918] border-b border-slate-200/80 dark:border-white/[0.08]">
          {isConnected && (
            <button
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                currentRoute === 'dashboard'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </span>
              {totalUserContracts > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white">
                  {totalUserContracts}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => handleNavClick('marketplace')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
              currentRoute === 'marketplace'
                ? 'bg-purple-600 text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              <span>Marketplace</span>
            </span>
          </button>

          <button
            onClick={() => handleNavClick('agents')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
              currentRoute === 'agents'
                ? 'bg-purple-600 text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <span>Agent Registry</span>
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              ERC-8004
            </span>
          </button>

          <button
            onClick={() => handleNavClick('verifier')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
              currentRoute === 'verifier'
                ? 'bg-purple-600 text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              <span>Delivery Verifier</span>
            </span>
          </button>

          <button
            onClick={() => handleNavClick('developer')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
              currentRoute === 'developer'
                ? 'bg-purple-600 text-white'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4" />
              <span>x402 Studio (API)</span>
            </span>
          </button>

          {isConnected && (
            <button
              onClick={() => handleNavClick('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                currentRoute === 'profile'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserCog className="w-4 h-4" />
                <span>My Profile & Settings</span>
              </span>
              <span className="text-[10px] font-bold opacity-80">
                {profile.displayName || `${address?.slice(0, 6)}…`}
              </span>
            </button>
          )}

          {isConnected && (
            <div className="pt-2 flex gap-2 border-t border-slate-200/80 dark:border-white/[0.08] mt-2">
              <button
                onClick={() => {
                  onOpenCreateEscrow()
                  setMobileMenuOpen(false)
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>+ Single Escrow</span>
              </button>
              <button
                onClick={() => {
                  onOpenCreateMilestone()
                  setMobileMenuOpen(false)
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/30 flex items-center justify-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>+ Milestone</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
