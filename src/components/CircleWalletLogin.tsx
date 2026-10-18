/**
 * CircleWalletLogin — Google / Passkey login via Circle Modular Wallets SDK.
 *
 * This is a SEPARATE login path from ConnectKit (which handles injected/WalletConnect wallets).
 * When a user logs in here, their Circle smart account address is used throughout the app
 * via the CircleWalletContext.
 *
 * Setup required in Circle Console:
 *  - Client Key with Allowed Domain = i3cv3uqqwcz9ctkturkah.preview.studio.arc.io
 *  - Modular Wallets → Configurator → Passkeys → Domain Name = same hostname
 *  - VITE_CLIENT_KEY in .env
 */
import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, X, KeyRound, Fingerprint, LogOut, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

// Use SDK types via type-only import to avoid bundling the whole SDK at module load time.
// The actual SDK is loaded lazily inside loadSdk() below.
import type { WebAuthnCredential } from '@circle-fin/modular-wallets-core'

type SmartAccount = { address: `0x${string}`; [k: string]: unknown }

interface CircleWalletState {
  address: `0x${string}` | null
  account: SmartAccount | null
  credential: WebAuthnCredential | null
  isLoading: boolean
  login: () => Promise<void>
  register: (username: string) => Promise<void>
  logout: () => void
  isReady: boolean  // true if VITE_CLIENT_KEY is set
}

const CircleWalletContext = createContext<CircleWalletState>({
  address: null, account: null, credential: null, isLoading: false,
  login: async () => { }, register: async () => { }, logout: () => { }, isReady: false,
})

export function useCircleWallet() {
  return useContext(CircleWalletContext)
}

const CLIENT_KEY = import.meta.env.VITE_CLIENT_KEY as string | undefined
const CLIENT_URL = import.meta.env.VITE_CLIENT_URL as string | undefined
const STORAGE_KEY = 'arcagent_circle_credential'

export function CircleWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<`0x${string}` | null>(null)
  const [account, setAccount] = useState<SmartAccount | null>(null)
  const [credential, setCredential] = useState<WebAuthnCredential | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const isReady = !!(CLIENT_KEY && CLIENT_URL)

  // Restore session from localStorage on mount
  useEffect(() => {
    if (!isReady) return
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored) as WebAuthnCredential
      void restoreSession(parsed)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady])

  async function loadSdk() {
    const [
      { toWebAuthnCredential, toCircleSmartAccount, toPasskeyTransport, toModularTransport, WebAuthnMode },
      { toWebAuthnAccount },
      { createPublicClient },
      { arcTestnet },
    ] = await Promise.all([
      import('@circle-fin/modular-wallets-core'),
      import('viem/account-abstraction'),
      import('viem'),
      import('viem/chains'),
    ])
    const passkeyTransport = toPasskeyTransport(CLIENT_URL!, CLIENT_KEY!)
    const modularTransport = toModularTransport(`${CLIENT_URL}/arcTestnet`, CLIENT_KEY!)
    const publicClient = createPublicClient({ chain: arcTestnet, transport: modularTransport })
    return { toWebAuthnCredential, toCircleSmartAccount, toWebAuthnAccount, WebAuthnMode, passkeyTransport, publicClient }
  }

  async function restoreSession(cred: WebAuthnCredential) {
    try {
      setIsLoading(true)
      const { toCircleSmartAccount, toWebAuthnAccount, publicClient } = await loadSdk()
      const webAuthnAccount = toWebAuthnAccount({ credential: cred })
      const smartAccount = await toCircleSmartAccount({ client: publicClient, owner: webAuthnAccount })
      setCredential(cred)
      setAccount(smartAccount)
      setAddress(smartAccount.address)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }

  async function register(username: string) {
    if (!isReady) { toast.error('Circle Client Key not configured'); return }
    setIsLoading(true)
    try {
      const { toWebAuthnCredential, toCircleSmartAccount, toWebAuthnAccount, WebAuthnMode, passkeyTransport, publicClient } = await loadSdk()
      const cred = await toWebAuthnCredential({ transport: passkeyTransport, mode: WebAuthnMode.Register, username })
      const webAuthnAccount = toWebAuthnAccount({ credential: cred })
      const smartAccount = await toCircleSmartAccount({ client: publicClient, owner: webAuthnAccount, name: username })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cred))
      setCredential(cred)
      setAccount(smartAccount)
      setAddress(smartAccount.address)
      toast.success('Passkey registered: smart account ready')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('InvalidStateError')) {
        toast.error('Passkey already registered for this device. Try Login instead')
      } else if (msg.includes('NotAllowedError')) {
        toast.error('Passkey cancelled')
      } else {
        toast.error(`Registration failed: ${msg.slice(0, 120)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function login() {
    if (!isReady) { toast.error('Circle Client Key not configured'); return }
    setIsLoading(true)
    try {
      const { toWebAuthnCredential, toCircleSmartAccount, toWebAuthnAccount, WebAuthnMode, passkeyTransport, publicClient } = await loadSdk()
      const cred = await toWebAuthnCredential({ transport: passkeyTransport, mode: WebAuthnMode.Login })
      const webAuthnAccount = toWebAuthnAccount({ credential: cred })
      const smartAccount = await toCircleSmartAccount({ client: publicClient, owner: webAuthnAccount })
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cred))
      setCredential(cred)
      setAccount(smartAccount)
      setAddress(smartAccount.address)
      toast.success('Logged in with passkey')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('NotAllowedError')) {
        toast.error('Passkey cancelled')
      } else {
        toast.error(`Login failed: ${msg.slice(0, 120)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setCredential(null)
    setAccount(null)
    setAddress(null)
    toast.success('Logged out')
  }

  return (
    <CircleWalletContext.Provider value={{ address, account, credential, isLoading, login, register, logout, isReady }}>
      {children}
    </CircleWalletContext.Provider>
  )
}

// ─── UI Component ────────────────────────────────────────────────────────────

type Mode = 'register' | 'login'

export default function CircleWalletLogin() {
  const { address, isLoading, login, register, logout, isReady } = useCircleWallet()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('register')
  const [username, setUsername] = useState('')

  if (!isReady) {
    // Show a muted placeholder when Client Key is not yet configured
    return (
      <div className="w-full rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.06)' }}>
          <KeyRound className="w-4 h-4" style={{ color: 'var(--subtle)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--subtle)' }}>Passkey / Google login</p>
          <p className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--subtle)', opacity: 0.6 }}>
            Add VITE_CLIENT_KEY to .env to enable
          </p>
        </div>
        <a href="https://console.circle.com" target="_blank" rel="noreferrer"
          className="shrink-0 text-[10px] flex items-center gap-0.5"
          style={{ color: 'var(--subtle)' }}>
          Console <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    )
  }

  if (address) {
    // Logged-in state
    return (
      <div className="w-full rounded-2xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'rgba(141,216,159,0.08)', border: '1px solid rgba(141,216,159,0.25)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(141,216,159,0.15)' }}>
          <Fingerprint className="w-4 h-4" style={{ color: 'var(--success)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--success)' }}>Passkey wallet active</p>
          <p className="mono text-[10px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            {address.slice(0, 10)}...{address.slice(-8)}
          </p>
        </div>
        <button onClick={logout}
          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-colors hover:bg-white/10"
          style={{ color: 'var(--subtle)' }}>
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      {/* Header row */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5"
      >
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)' }}>
          <KeyRound className="w-4 h-4" style={{ color: 'var(--violet)' }} />
        </div>
        <div className="flex-1 text-left">
          <p className="text-xs font-bold" style={{ color: 'var(--ink)' }}>Passkey / Biometric login</p>
          <p className="text-[10px]" style={{ color: 'var(--subtle)' }}>No seed phrase · Circle smart account · Arc Testnet</p>
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--subtle)' }} />
          : <ChevronDown className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--subtle)' }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="pt-3 space-y-1 text-xs" style={{ color: 'var(--subtle)' }}>
                <p>Log in using your device's built-in biometrics (Face ID, Touch ID, Windows Hello) or a hardware security key. No seed phrase, no MetaMask required.</p>
                <p className="text-[10px]">Powered by Circle Modular Wallets · ERC-4337 smart account · gasless on Arc</p>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2">
                {(['register', 'login'] as Mode[]).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                    style={{
                      background: mode === m ? 'var(--violet-muted)' : 'var(--surface-muted)',
                      border: `1px solid ${mode === m ? 'var(--violet)' : 'var(--border)'}`,
                      color: mode === m ? 'var(--violet)' : 'var(--subtle)',
                    }}>
                    {m === 'register' ? 'New passkey' : 'Existing passkey'}
                  </button>
                ))}
              </div>

              {mode === 'register' && (
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>
                    Username (shown in passkey prompt)
                  </label>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. alice or agent-007"
                    className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
                  />
                </div>
              )}

              <button
                onClick={() => void (mode === 'register' ? register(username || 'user') : login())}
                disabled={isLoading || (mode === 'register' && !username.trim())}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'var(--violet)', color: '#fff' }}
              >
                {isLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Processing...</>
                  : <><Fingerprint className="w-4 h-4" />{mode === 'register' ? 'Register passkey' : 'Sign in with passkey'}</>}
              </button>

              <p className="text-[10px] text-center" style={{ color: 'var(--subtle)' }}>
                Your passkey is stored on this device. Works like Face ID / Touch ID / Windows Hello.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Dismiss button helper (used in modal context) ──────────────────────────

export function CircleWalletDismissButton({ onClose }: { onClose: () => void }) {
  return (
    <button onClick={onClose}
      className="flex items-center justify-center w-8 h-8 rounded-xl transition-colors hover:bg-white/10"
      style={{ color: 'var(--subtle)' }}>
      <X className="w-4 h-4" />
    </button>
  )
}
