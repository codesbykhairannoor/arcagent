import { ConnectKitButton } from 'connectkit'
import { Shield, Plus, Layers, Menu, X, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useTheme } from './ThemeProvider'

export type NavRoute = 'home' | 'marketplace' | 'agents' | 'dashboard' | 'developer' | 'verifier'

interface Props {
  currentRoute: NavRoute
  onRouteChange: (route: NavRoute) => void
  onOpenCreateEscrow: () => void
  onOpenCreateMilestone: () => void
  isConnected: boolean
  totalUserContracts: number
}

export default function Navbar({
  currentRoute,
  onRouteChange,
  onOpenCreateEscrow,
  onOpenCreateMilestone,
  isConnected,
  totalUserContracts,
}: Props) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { resolvedTheme, toggleTheme } = useTheme()

  const navItems: { key: NavRoute; label: string; badge?: string }[] = [
    { key: 'home', label: 'Protocol' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'agents', label: 'Agent Registry', badge: 'ERC-8004' },
    { key: 'dashboard', label: 'Dashboard', badge: totalUserContracts > 0 ? String(totalUserContracts) : undefined },
    { key: 'developer', label: 'x402 Studio', badge: 'API' },
    { key: 'verifier', label: 'Verifier' },
  ]

  const handleNavClick = (route: NavRoute) => {
    onRouteChange(route)
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-white/85 dark:bg-[#040714]/90 border-b border-slate-200/80 dark:border-white/[0.08] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group outline-none"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-purple-900/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#070b18] rounded-[11px] flex items-center justify-center">
                <Shield className="w-4 h-4 text-cyan-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="display text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  ArcAgent
                </span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                  v4
                </span>
              </div>
              <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Arc Testnet · 5042002</span>
              </div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 ml-6">
            {navItems.map((item) => {
              const isActive = currentRoute === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => handleNavClick(item.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-white/[0.08] dark:text-white dark:border-white/[0.12] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold ${
                        isActive
                          ? 'bg-purple-500/20 text-purple-700 dark:bg-purple-500/30 dark:text-purple-200'
                          : 'bg-slate-100 text-slate-600 dark:bg-white/[0.05] dark:text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isConnected && (
            <div className="hidden sm:flex items-center gap-1.5">
              <button
                onClick={onOpenCreateEscrow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Escrow</span>
              </button>
              <button
                onClick={onOpenCreateMilestone}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] dark:text-cyan-300 dark:border-cyan-500/20 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Milestone</span>
              </button>
            </div>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border transition-all duration-200 flex items-center justify-center bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:border-white/[0.1] dark:text-slate-200 shadow-sm"
            title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-label="Toggle theme mode"
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-300 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
          </button>

          <ConnectKitButton />

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

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 space-y-1 bg-white/95 dark:bg-[#050918] border-b border-slate-200/80 dark:border-white/[0.08]">
          {navItems.map((item) => {
            const isActive = currentRoute === item.key
            return (
              <button
                key={item.key}
                onClick={() => handleNavClick(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.04]'
                }`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded text-[10px] bg-black/10 dark:bg-black/40 text-purple-700 dark:text-purple-200">
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}

          {isConnected && (
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  onOpenCreateEscrow()
                  setMobileMenuOpen(false)
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white"
              >
                + New Escrow
              </button>
              <button
                onClick={() => {
                  onOpenCreateMilestone()
                  setMobileMenuOpen(false)
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/[0.08] text-slate-800 dark:text-cyan-300 border border-slate-200 dark:border-cyan-500/30"
              >
                + Milestone
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}
