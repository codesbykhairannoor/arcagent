import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Loader2, Fingerprint, ChevronRight, ShieldCheck, Sparkles } from 'lucide-react'
import { useModal } from 'connectkit'
import { useCircleWallet } from './CircleWalletLogin'


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

export const MetaMaskIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32">
    <path fill="#E17726" d="M29.67 11.26l-2.45-8.22c-.22-.74-1.07-1.07-1.7-.65L17.5 7.6 16 1.8c-.24-.96-1.76-.96-2 0L12.5 7.6 4.48 2.39c-.63-.42-1.48-.09-1.7.65L.33 11.26c-.25.84.14 1.73.9 2.05l5.22 2.22L4.3 21.6c-.36 1.25.68 2.45 1.95 2.24l7.25-1.19 1.83 6.47c.28 1 1.66 1 1.94 0l1.83-6.47 7.25 1.19c1.27.21 2.31-.99 1.95-2.24l-2.15-6.07 5.22-2.22c.76-.32 1.15-1.21.9-2.05z"/>
    <path fill="#E2761B" d="M26.24 23.84l-7.25-1.19L16 28.32l-2.99-5.67-7.25 1.19c-1.27.21-2.31-.99-1.95-2.24l2.15-6.07 7.79 3.51 2.25-2.04 2.25 2.04 7.79-3.51 2.15 6.07c.36 1.25-.68 2.45-1.95 2.24z"/>
    <path fill="#D7C1B3" d="M21.5 16.5l-2.25-2.04L16 16.5l-3.25-2.04L10.5 16.5l-4.05-1.72L4.3 21.6c-.36 1.25.68 2.45 1.95 2.24l7.25-1.19 2.5-4.65 2.5 4.65 7.25 1.19c1.27.21 2.31-.99 1.95-2.24l-2.15-6.82-4.05 1.72z"/>
    <path fill="#233447" d="M10.5 16.5l2.25-2.04L16 16.5l3.25-2.04 2.25 2.04-2.25 2.04L16 16.5l-3.25 2.04z"/>
  </svg>
)

export const CoinbaseIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32">
    <circle cx="16" cy="16" r="16" fill="#0052FF"/>
    <rect x="10" y="10" width="12" height="12" rx="3" fill="#FFFFFF"/>
    <circle cx="16" cy="16" r="3" fill="#0052FF"/>
  </svg>
)

export const WalletConnectIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32">
    <rect width="32" height="32" rx="8" fill="#3B99FC"/>
    <path
      fill="#FFFFFF"
      d="M9.16 12.63c3.78-3.7 9.9-3.7 13.68 0l.45.44c.19.19.19.49 0 .68l-1.56 1.53c-.19.19-.5.19-.69 0l-.6-.59c-2.45-2.4-6.42-2.4-8.87 0l-.65.64c-.19.19-.5.19-.69 0l-1.56-1.53c-.19-.19-.19-.49 0-.68l.49-.49zm16.94 3.2l1.39 1.36c.19.19.19.49 0 .68l-6.26 6.13c-.19.19-.5.19-.69 0l-4.44-4.35c-.1-.1-.25-.1-.35 0l-4.44 4.35c-.19.19-.5.19-.69 0L4.45 17.87c-.19-.19-.19-.49 0-.68l1.39-1.36c.19-.19.5-.19.69 0l4.44 4.35c.1.1.25.1.35 0l4.44-4.35c.19-.19.5-.19.69 0l4.44 4.35c.1.1.25.1.35 0l4.44-4.35c.19-.19.5-.19.69 0z"
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
  const [showRegisterInput, setShowRegisterInput] = useState(false)
  const [username, setUsername] = useState('')

  if (typeof document === 'undefined' || !isOpen) return null


  const handleGoogleClick = async () => {
    try {
      await circleLogin()
      onClose()
    } catch {
      // If login failed (e.g. no existing passkey on this device), suggest registering
      setShowRegisterInput(true)
    }
  }

  const handleGoogleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const handle = username.trim() || 'user-' + Math.random().toString(36).slice(2, 6)
    try {
      await circleRegister(handle)
      onClose()
    } catch {
      // Handled in context toast
    }
  }

  const handleOpenConnectKit = () => {
    onClose()
    setTimeout(() => {
      openConnectKit(true)
    }, 120)
  }

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Dark backdrop blur covering the entire viewport */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
      />

      {/* Centered Modal Card */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative z-10 w-full max-w-[390px] rounded-3xl bg-white dark:bg-[#0c1020] border border-slate-200 dark:border-white/[0.1] shadow-2xl shadow-black/40 p-6 space-y-4 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div>
            <h3 className="display text-lg font-black text-slate-900 dark:text-white tracking-tight">
              Connect Wallet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choose your Web3 wallet or Google account
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Featured: Continue with Google */}
        <div className="space-y-2">
          {!showRegisterInput ? (
            <button
              type="button"
              disabled={isCircleLoading}
              onClick={handleGoogleClick}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 dark:border-white/[0.12] bg-slate-50 hover:bg-slate-100/90 dark:bg-white/[0.05] dark:hover:bg-white/[0.08] transition-all group shadow-sm hover:scale-[1.01] active:scale-[0.99] text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center shadow-sm border border-slate-200/60 dark:border-white/10 shrink-0">
                  <GoogleIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Continue with Google
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25">
                      Smart Account
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Google Passkey · Zero gas · No seed phrase
                  </p>
                </div>
              </div>
              {isCircleLoading ? (
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
              ) : (
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              )}
            </button>
          ) : (
            <form onSubmit={handleGoogleRegisterSubmit} className="p-3.5 rounded-2xl bg-purple-500/[0.05] border border-purple-500/25 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-purple-500" />
                  <span>Create Google Passkey</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowRegisterInput(false)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                >
                  Cancel
                </button>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter handle or username..."
                className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#070b18] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isCircleLoading}
                className="w-full py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                {isCircleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Register with Google Passkey</span>
              </button>
            </form>
          )}
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-1">
          <div className="w-full border-t border-slate-200 dark:border-white/[0.08]" />
          <span className="absolute bg-white dark:bg-[#0c1020] px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            or
          </span>
        </div>

        {/* Web3 Wallets list */}
        <div className="space-y-2">
          {/* MetaMask / Injected */}
          <button
            type="button"
            onClick={handleOpenConnectKit}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                <MetaMaskIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  MetaMask / Browser Wallet
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  MetaMask, Rabby, Brave, or Injected
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* Coinbase Wallet */}
          <button
            type="button"
            onClick={handleOpenConnectKit}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                <CoinbaseIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Coinbase Wallet
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Coinbase Smart Wallet & Extension
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>

          {/* WalletConnect QR */}
          <button
            type="button"
            onClick={handleOpenConnectKit}
            className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 shrink-0">
                <WalletConnectIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  WalletConnect
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Scan QR with Trust, Rainbow, OKX & 400+ apps
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
          </button>
        </div>

        {/* Footer info badge */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Arc Testnet · 5042002</span>
          </div>
          <span className="flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>USDC Native</span>
          </span>
        </div>
      </motion.div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
