import { useState, useEffect, useCallback } from 'react'

export interface UserProfile {
  address: string
  displayName: string
  handle: string
  bio: string
  avatar: string
  primaryRole: 'client' | 'worker' | 'both'
  skills: string[]
  xTwitter?: string
  github?: string
  telegram?: string
  website?: string
  updatedAt: number
}

export const PRESET_AVATARS = [
  { id: 'agent-bot', label: 'Autonomous Bot', gradient: 'from-cyan-500 to-blue-600', icon: '🤖' },
  { id: 'cyber-sentinel', label: 'Cyber Sentinel', gradient: 'from-purple-600 to-indigo-600', icon: '🛡️' },
  { id: 'defi-wizard', label: 'DeFi Alchemist', gradient: 'from-emerald-500 to-teal-600', icon: '⚡' },
  { id: 'neural-coder', label: 'Neural Coder', gradient: 'from-amber-500 to-orange-600', icon: '💻' },
  { id: 'quantum-scout', label: 'Quantum Scout', gradient: 'from-pink-500 to-rose-600', icon: '🌌' },
  { id: 'stealth-agent', label: 'Stealth Agent', gradient: 'from-slate-700 to-zinc-900', icon: '🕶️' },
]

function getStorageKey(address?: string) {
  if (!address) return null
  return `arcagent_user_profile_${address.toLowerCase()}`
}

export function getDefaultProfile(address?: string): UserProfile {
  const shortAddr = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : 'Anonymous'
  return {
    address: address ?? '',
    displayName: address ? shortAddr : '',
    handle: address ? `@${address.slice(2, 8).toLowerCase()}` : '',
    bio: 'Web3 & AI Agent ecosystem participant on Arc Testnet.',
    avatar: 'agent-bot',
    primaryRole: 'both',
    skills: ['Smart Contracts', 'Autonomous Escrow', 'USDC Settlement'],
    updatedAt: Date.now(),
  }
}

export function getProfileForAddress(address?: string): UserProfile {
  if (!address) return getDefaultProfile()
  const key = getStorageKey(address)
  if (!key) return getDefaultProfile(address)
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw) as UserProfile
    }
  } catch {
    // fallback
  }
  return getDefaultProfile(address)
}

export function useUserProfile(address?: string) {
  const [profile, setProfile] = useState<UserProfile>(() => getProfileForAddress(address))
  const [prevAddress, setPrevAddress] = useState(address)

  // Official React pattern for deriving state when prop changes without triggering useEffect setState warnings
  if (address !== prevAddress) {
    setPrevAddress(address)
    setProfile(getProfileForAddress(address))
  }

  // Listen for global profile updates from other components
  useEffect(() => {
    const handleUpdate = () => {
      setProfile(getProfileForAddress(address))
    }

    window.addEventListener('arcagent_profile_updated', handleUpdate)
    return () => {
      window.removeEventListener('arcagent_profile_updated', handleUpdate)
    }
  }, [address])

  const updateProfile = useCallback(
    (newProfileData: Partial<UserProfile>) => {
      if (!address) return
      const key = getStorageKey(address)
      if (!key) return

      const updated: UserProfile = {
        ...profile,
        ...newProfileData,
        address,
        updatedAt: Date.now(),
      }

      try {
        localStorage.setItem(key, JSON.stringify(updated))
        setProfile(updated)
        window.dispatchEvent(new Event('arcagent_profile_updated'))
      } catch (err) {
        console.error('Failed to save profile to localStorage:', err)
      }
    },
    [address, profile]
  )

  return { profile, updateProfile }
}
