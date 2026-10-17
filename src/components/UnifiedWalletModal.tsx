import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Wallet, Fingerprint, Loader2, KeyRound, ShieldCheck } from 'lucide-react'
import { useModal } from 'connectkit'
import { useCircleWallet } from './CircleWalletLogin'
import { toast } from 'sonner'

export const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
)

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function UnifiedWalletModal({ isOpen, onClose }: Props) {
  const { setOpen: openConnectKit } = useModal()
  const { isLoading: isCircleLoading, login: circleLogin, register: circleRegister } = useCircleWallet()
  const [googleMode, setGoogleMode] = useState<'quick' | 'register'>('quick')
  const [username, setUsername] = useState('')

  if (!isOpen) return null

  const handleGoogleQuickLogin = async () => {
    try {
      await circleLogin()
      onClose()
    } catch {
      // Handled in context toast
    }
  }

  const handleGoogleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      toast.error('Please enter a username or handle')
      return
    }
    try {
      await circleRegister(username.trim())
      onClose()
    } catch {
      // Handled in context toast
    }
  }

  const handleOpenConnectKit = () => {
    onClose()
    // Small timeout to allow smooth modal transition
    setTimeout(() => {
      openConnectKit(true)
    }, 150)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="relative w-full max-w-md rounded-3xl glass-panel p-6 shadow-2xl border border-slate-200/80 dark:border-white/[0.1] bg-white dark:bg-[#070c1b] space-y-5 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-600/10 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="display text-base font-extrabold text-slate-900 dark:text-white">
                  Connect to ArcAgent
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select your preferred Web3 identity or login method
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Featured Option: Google & Passkey Smart Wallet */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <span>Google Account & Passkey</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold lowercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero Seed Phrase</span>
              </span>
            </div>

            {googleMode === 'quick' ? (
              <div className="space-y-2">
                <button
                  type="button"
                  disabled={isCircleLoading}
                  onClick={handleGoogleQuickLogin}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 hover:bg-slate-100/80 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] transition-all group hover:scale-[1.01] active:scale-[0.99] text-left shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm border border-slate-200/60 dark:border-white/10 group-hover:scale-105 transition-transform shrink-0">
                      <GoogleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Continue with Google
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                          Smart Account
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Log in via Google Password Manager / Biometric Passkey
                      </p>
                    </div>
                  </div>
                  {isCircleLoading && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
                </button>

                <div className="flex items-center justify-between px-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">First time using passkey on this device?</span>
                  <button
                    type="button"
                    onClick={() => setGoogleMode('register')}
                    className="font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Register New Account
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleGoogleRegister} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-purple-500" />
                    <span>Register Google Passkey</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setGoogleMode('quick')}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Your Agent or User Handle:
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alice or agent-007"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-900 dark:text-white focus:outline-none focus:border-purple-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCircleLoading || !username.trim()}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isCircleLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Smart Account...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Create Smart Account</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-200/80 dark:border-white/[0.08]" />
            <span className="absolute bg-white dark:bg-[#070c1b] px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              or Web3 Wallets
            </span>
          </div>

          {/* Standard Web3 Wallets */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleOpenConnectKit}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    MetaMask, Coinbase & Browser Wallets
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Connect injected Web3 extensions or hardware wallets
                  </span>
                </div>
              </div>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-bold group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenConnectKit}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Fingerprint className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    WalletConnect & Mobile QR
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Scan with Trust Wallet, Rainbow, OKX, Phantom & 400+ apps
                  </span>
                </div>
              </div>
              <span className="text-xs text-cyan-600 dark:text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">
                →
              </span>
            </button>
          </div>

          {/* Footer note */}
          <div className="pt-2 text-center text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Arc Testnet · Chain ID 5042002 · Native USDC Escrow</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
