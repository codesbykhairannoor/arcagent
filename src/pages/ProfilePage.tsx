import { useState } from 'react'
import {
  Check,
  Copy,
  ExternalLink,
  Shield,
  Zap,
  Globe,
  Github,
  Twitter,
  Send,
  Save,
  Wallet,
  ArrowRight,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { ConnectKitButton } from 'connectkit'
import { useUserProfile, PRESET_AVATARS } from '../components/useUserProfile'
import { useCircleWallet } from '../components/CircleWalletLogin'
import { useEscrowStats } from '../components/useEscrowData'
import { toast } from 'sonner'
import type { NavRoute } from '../components/Navbar'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'

interface Props {
  address?: string
  isConnected: boolean
  onNavigate: (route: NavRoute) => void
  onOpenCreateEscrow?: () => void
}

export default function ProfilePage({ address, isConnected, onNavigate }: Props) {
  const { profile, updateProfile } = useUserProfile(address)
  const { address: circleAddress, logout: circleLogout } = useCircleWallet()
  const { activeCount, clientCount, workerCount, refetchAll } = useEscrowStats(address)

  // Form State
  const [displayName, setDisplayName] = useState(profile.displayName || '')
  const [handle, setHandle] = useState(profile.handle || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || 'agent-bot')
  const [customAvatarUrl, setCustomAvatarUrl] = useState('')
  const [primaryRole, setPrimaryRole] = useState<'client' | 'worker' | 'both'>(profile.primaryRole || 'both')
  const [skillsStr, setSkillsStr] = useState(profile.skills?.join(', ') || '')
  const [xTwitter, setXTwitter] = useState(profile.xTwitter || '')
  const [github, setGithub] = useState(profile.github || '')
  const [telegram, setTelegram] = useState(profile.telegram || '')
  const [website, setWebsite] = useState(profile.website || '')

  const [copiedAddr, setCopiedAddr] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const activeAddress = address || circleAddress

  const handleCopy = () => {
    if (!activeAddress) return
    void navigator.clipboard.writeText(activeAddress)
    setCopiedAddr(true)
    toast.success('Wallet address copied to clipboard')
    setTimeout(() => setCopiedAddr(false), 2000)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeAddress) {
      toast.error('Connect your wallet first to save profile settings')
      return
    }

    setIsSaving(true)
    const chosenAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : avatar

    updateProfile({
      displayName: displayName.trim() || `${activeAddress.slice(0, 6)}…${activeAddress.slice(-4)}`,
      handle: handle.trim().startsWith('@')
        ? handle.trim()
        : handle.trim()
        ? `@${handle.trim()}`
        : `@${activeAddress.slice(2, 8).toLowerCase()}`,
      bio: bio.trim(),
      avatar: chosenAvatar,
      primaryRole,
      skills: skillsStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      xTwitter: xTwitter.trim(),
      github: github.trim(),
      telegram: telegram.trim(),
      website: website.trim(),
    })

    setTimeout(() => {
      setIsSaving(false)
      toast.success('Profile and persona settings saved successfully!')
    }, 300)
  }

  const currentPreset = PRESET_AVATARS.find((p) => p.id === avatar)

  // Unauthenticated / Disconnected State
  if (!isConnected && !circleAddress) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6 w-full flex-1">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-purple-600 to-cyan-500 p-[2px] flex items-center justify-center shadow-2xl">
          <div className="w-full h-full bg-[#070b18] rounded-[22px] flex items-center justify-center">
            <Wallet className="w-9 h-9 text-cyan-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="display text-3xl font-black text-slate-950 dark:text-white">
            Connect Your Wallet to View Profile
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Manage your on-chain identity, persona profile, ERC-8004 reputation, and connected smart account settings.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <ConnectKitButton />
        </div>
      </main>
    )
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 w-full flex-1 transition-colors duration-200">
      {/* ── Top Header Bar ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/[0.08] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Unified Profile & Wallet Center</span>
          </div>
          <h1 className="display text-2xl sm:text-3xl font-black text-slate-950 dark:text-white tracking-tight">
            Account & Identity Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Kustomisasi profil Anda, atur persona, dan kelola dompet on-chain Arc Testnet di satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] transition-all hover:scale-[1.01]"
          >
            <span>Back to Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Left Column: Wallet Overview & Identity Card (4 cols) ────── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Live Persona Card Preview */}
          <div className="p-6 rounded-3xl spatial-bento border border-slate-200/90 dark:border-white/[0.1] shadow-xl space-y-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div
                  className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${
                    currentPreset?.gradient ?? 'from-purple-600 to-indigo-600'
                  } flex items-center justify-center text-3xl shadow-xl border-2 border-white dark:border-white/10 glow-cyan`}
                >
                  {currentPreset?.icon ?? '👤'}
                </div>
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white dark:border-[#040714] animate-pulse" />
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <h2 className="display text-lg font-black text-slate-900 dark:text-white truncate">
                  {displayName || `${activeAddress?.slice(0, 6)}…${activeAddress?.slice(-4)}`}
                </h2>
                <div className="text-xs font-bold text-purple-600 dark:text-cyan-400 truncate">
                  {handle || `@${activeAddress?.slice(2, 8).toLowerCase()}`}
                </div>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/25">
                  {primaryRole === 'client'
                    ? '💼 Client Mode'
                    : primaryRole === 'worker'
                    ? '⚡ Worker Mode'
                    : '🔄 Dual Operator'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
              {bio || 'Web3 escrow & AI agent ecosystem participant on Arc Testnet.'}
            </p>

            {/* Wallet Address Chip */}
            <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-black/40 border border-slate-200 dark:border-white/[0.08] space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                <span>Connected Wallet</span>
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Arc Testnet (5042002)
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {activeAddress}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                    title="Copy Address"
                  >
                    {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`${EXPLORER_BASE}/address/${activeAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-400 hover:text-cyan-400 transition-colors"
                    title="View on Arc Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Wallet Actions (Integrated with ConnectKit / Circle) */}
            <div className="pt-1 flex items-center justify-between gap-3">
              <div className="flex-1">
                {circleAddress ? (
                  <button
                    type="button"
                    onClick={circleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Smart Account</span>
                  </button>
                ) : (
                  <ConnectKitButton.Custom>
                    {({ show }) => (
                      <button
                        type="button"
                        onClick={show}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] dark:text-white border border-slate-300 dark:border-white/[0.1] transition-all"
                      >
                        <Wallet className="w-3.5 h-3.5 text-purple-600 dark:text-cyan-400" />
                        <span>Switch / Manage Wallet</span>
                      </button>
                    )}
                  </ConnectKitButton.Custom>
                )}
              </div>
            </div>
          </div>

          {/* Quick On-Chain Stats */}
          <div className="p-5 rounded-3xl spatial-bento border border-slate-200/90 dark:border-white/[0.1] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                On-Chain Activity
              </h3>
              <button
                type="button"
                onClick={refetchAll}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                title="Sync on-chain data"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]">
                <div className="display text-base font-black text-slate-900 dark:text-white">{activeCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Active Escrows</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]">
                <div className="display text-base font-black text-slate-900 dark:text-white">{clientCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Client Jobs</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]">
                <div className="display text-base font-black text-slate-900 dark:text-white">{workerCount}</div>
                <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Worker Tasks</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Profile & Settings Form (8 cols) ───────────── */}
        <div className="lg:col-span-8">
          <form
            onSubmit={handleSave}
            className="p-7 rounded-3xl spatial-bento border border-slate-200/90 dark:border-white/[0.1] shadow-2xl space-y-6"
          >
            <div>
              <h2 className="display text-xl font-black text-slate-900 dark:text-white">
                Edit Profile & Persona Information
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Semua perubahan langsung tersimpan ke profil on-chain / browser Anda dan tersinkronisasi ke seluruh platform.
              </p>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Pilih Karakter Avatar Persona
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {PRESET_AVATARS.map((p) => {
                  const isSelected = avatar === p.id && !customAvatarUrl
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setAvatar(p.id)
                        setCustomAvatarUrl('')
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-center transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 shadow-lg scale-105 ring-2 ring-purple-500/30'
                          : 'border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] bg-slate-100/50 dark:bg-white/[0.02]'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${p.gradient} flex items-center justify-center text-lg shadow-md`}
                      >
                        {p.icon}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 line-clamp-1">
                        {p.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Display Name & Handle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Rivera or Moltbot Operator"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Handle (@username)
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@alex_web3"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Role Selection (Client / Worker / Dual) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Primary Platform Persona / Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'client' as const,
                    title: 'Client (Hiring)',
                    desc: 'Saya mendanai escrow dan mempekerjakan agen AI atau freelancer.',
                    icon: <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
                  },
                  {
                    id: 'worker' as const,
                    title: 'Worker / AI Operator',
                    desc: 'Saya menyediakan jasa, mengoperasikan bot AI, dan menerima bayaran USDC.',
                    icon: <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
                  },
                  {
                    id: 'both' as const,
                    title: 'Dual Operator',
                    desc: 'Saya beroperasi sebagai klien sekaligus pekerja di ekosistem Arc.',
                    icon: <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
                  },
                ].map((r) => {
                  const isSelected = primaryRole === r.id
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setPrimaryRole(r.id)}
                      className={`flex flex-col text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/10 shadow-md ring-1 ring-purple-500/30'
                          : 'border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] bg-slate-100/40 dark:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {r.icon}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{r.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{r.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Bio & Experience Overview
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Ceritakan keahlian, track record, atau jenis agen AI yang Anda operasikan..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Skills Tags */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Skills & Capabilities (Pisahkan dengan koma)
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                placeholder="Smart Contracts, Solidity Audit, AI Agent Deployment, DeFi"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors"
              />
            </div>

            {/* Social Links Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Social & Developer Profiles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Twitter className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={xTwitter}
                    onChange={(e) => setXTwitter(e.target.value)}
                    placeholder="X / Twitter (@handle)"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Github className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="GitHub username"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Send className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    placeholder="Telegram (@handle)"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Globe className="w-3.5 h-3.5" />
                  </span>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="Website or Portfolio URL"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl text-xs outline-none bg-slate-100/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.1] text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200/80 dark:border-white/[0.08]">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/30 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil & Pengaturan'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
