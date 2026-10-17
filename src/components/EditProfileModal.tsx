import { useState } from 'react'
import {
  X,
  Check,
  ExternalLink,
  Copy,
  Briefcase,
  Bot,
  RefreshCw,
} from 'lucide-react'
import { useUserProfile, PRESET_AVATARS } from './useUserProfile'
import { toast } from 'sonner'

const EXPLORER_BASE = 'https://explorer.testnet.arc.io'

interface Props {
  address: string
  isOpen: boolean
  onClose: () => void
}

export default function EditProfileModal({ address, isOpen, onClose }: Props) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-150">
      <EditProfileDialogContent address={address} onClose={onClose} />
    </div>
  )
}

function EditProfileDialogContent({ address, onClose }: { address: string; onClose: () => void }) {
  const { profile, updateProfile } = useUserProfile(address)

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

  const handleCopy = () => {
    void navigator.clipboard.writeText(address)
    setCopiedAddr(true)
    toast.success('Address copied')
    setTimeout(() => setCopiedAddr(false), 2000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const chosenAvatar = customAvatarUrl.trim() ? customAvatarUrl.trim() : avatar

    updateProfile({
      displayName: displayName.trim() || `${address.slice(0, 6)}…${address.slice(-4)}`,
      handle: handle.trim().startsWith('@') ? handle.trim() : handle.trim() ? `@${handle.trim()}` : `@${address.slice(2, 8).toLowerCase()}`,
      bio: bio.trim(),
      avatar: chosenAvatar,
      primaryRole,
      skills: skillsStr.split(',').map((s) => s.trim()).filter(Boolean),
      xTwitter: xTwitter.trim(),
      github: github.trim(),
      telegram: telegram.trim(),
      website: website.trim(),
    })

    toast.success('Profile settings saved successfully!')
    onClose()
  }

  const currentPreset = PRESET_AVATARS.find((p) => p.id === avatar)

  return (
    <div className="relative w-full max-w-2xl rounded-3xl glass-panel border border-slate-200/90 dark:border-white/[0.15] p-6 sm:p-7 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentPreset?.gradient ?? 'from-purple-600 to-indigo-600'} flex items-center justify-center text-xl shadow-lg`}>
              {currentPreset?.icon ?? '👤'}
            </div>
            <div>
              <h2 className="display text-xl font-black text-slate-900 dark:text-white">
                Edit My Profile & Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Customize how you appear to clients, freelancers, and AI agents across ArcAgent.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Avatar Selector */}
          <div>
            <label className="block font-bold text-slate-800 dark:text-slate-200 mb-2">
              Choose Avatar Profile Persona
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                    className={`p-2.5 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-center border ${
                      isSelected
                        ? 'border-purple-500 bg-purple-500/10 shadow-md ring-2 ring-purple-500/30'
                        : 'border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${p.gradient} flex items-center justify-center text-base shadow-sm`}>
                      {p.icon}
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                      {p.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Name & Handle */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Khairan Noor"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Handle / Username</label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@username"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Primary Role Selector */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Primary Role</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPrimaryRole('client')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  primaryRole === 'client'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/25'
                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Client (Hiring)</span>
              </button>

              <button
                type="button"
                onClick={() => setPrimaryRole('worker')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  primaryRole === 'worker'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-md shadow-cyan-600/25'
                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-100'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Worker / Agent</span>
              </button>

              <button
                type="button"
                onClick={() => setPrimaryRole('both')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  primaryRole === 'both'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25'
                    : 'bg-slate-50 dark:bg-white/[0.03] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:bg-slate-100'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Dual Operator</span>
              </button>
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Bio / Headline</label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell clients or AI agents what you build or what tasks you commission..."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Skills / Focus */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Skills & Focus Areas (comma-separated)
            </label>
            <input
              type="text"
              value={skillsStr}
              onChange={(e) => setSkillsStr(e.target.value)}
              placeholder="e.g. Smart Contracts, Python, AI Agents, AST Security, USDC Escrows"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">X (Twitter) Handle</label>
              <input
                type="text"
                value={xTwitter}
                onChange={(e) => setXTwitter(e.target.value)}
                placeholder="@handle"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">GitHub Profile</label>
              <input
                type="text"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/username"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Telegram Handle</label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@telegram_handle"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Portfolio / Website</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://mywebsite.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Connected Address Card */}
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Bound Wallet Address:</span>
              <span className="mono font-bold text-slate-900 dark:text-white text-xs">{address}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"
                title="Copy Address"
              >
                {copiedAddr ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href={`${EXPLORER_BASE}/address/${address}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-cyan-600"
                title="Inspect on Arc Explorer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-200/80 dark:border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </div>
  )
}
