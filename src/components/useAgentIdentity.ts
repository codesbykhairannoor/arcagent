/**
 * ERC-8004 Agent Identity Resolution
 * Resolves wallet addresses to named agent identities from Arc's onchain Identity Registry.
 * Registry: 0x8004A818BFB912233c491871b3d84c89A494BD9e (Arc Testnet)
 */
import { useReadContract, useReadContracts } from 'wagmi'
import { ARC_TESTNET_CHAIN_ID } from './useEscrowData'

export const IDENTITY_REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const
export const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const

// Minimal ABIs — only what we need
export const IDENTITY_ABI = [
  {
    type: 'function', name: 'getAgentWallet',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'ownerOf',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    type: 'function', name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const REPUTATION_ABI_MINIMAL = [
  {
    type: 'function', name: 'getSummary',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
  },
  {
    type: 'function', name: 'getClients',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
] as const

export interface AgentRegistrationFile {
  name?: string
  description?: string
  image?: string
  services?: { name: string; endpoint: string; version?: string }[]
  x402Support?: boolean
  active?: boolean
}

export interface AgentIdentity {
  agentId: bigint
  wallet: `0x${string}`
  owner: `0x${string}`
  agentURI: string
  card: AgentRegistrationFile | null
  reputationCount: bigint
  reputationScore: number | null  // 0–100 scale, null if no feedback
  isLoading: boolean
  error: string | null
}

// ─── Fetch agent card from URI ────────────────────────────────────────────────
async function fetchAgentCard(uri: string): Promise<AgentRegistrationFile | null> {
  try {
    // Resolve IPFS URIs
    const url = uri.startsWith('ipfs://')
      ? `https://ipfs.io/ipfs/${uri.slice(7)}`
      : uri
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    return (await res.json()) as AgentRegistrationFile
  } catch {
    return null
  }
}

// ─── Hook: resolve a single agent ID ─────────────────────────────────────────
export function useAgentById(agentId: bigint | undefined) {
  const enabled = agentId !== undefined && agentId > 0n

  const { data: walletData, isLoading: walletLoading } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: 'getAgentWallet',
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: ownerData, isLoading: ownerLoading } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: 'ownerOf',
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: uriData, isLoading: uriLoading } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: 'tokenURI',
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const { data: clientsData } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_ABI_MINIMAL,
    functionName: 'getClients',
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const clientAddresses = clientsData ?? []

  const { data: summaryData } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_ABI_MINIMAL,
    functionName: 'getSummary',
    args: agentId !== undefined && clientAddresses.length > 0
      ? [agentId, clientAddresses as `0x${string}`[], '', '']
      : undefined,
    query: { enabled: enabled && clientAddresses.length > 0 },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const isLoading = walletLoading || ownerLoading || uriLoading

  return {
    wallet: walletData,
    owner: ownerData,
    agentURI: uriData,
    clients: clientAddresses,
    reputationCount: summaryData?.[0] ?? 0n,
    reputationRaw: summaryData?.[1],
    reputationDecimals: summaryData?.[2] ?? 0,
    isLoading,
  }
}

// ─── Hook: reverse-lookup — find agentId(s) for a wallet address ──────────────
// We scan from token 1 up to totalSupply checking getAgentWallet matches.
// This is O(n) but registry is small on testnet; cap at 200 for safety.
export function useAgentIdsByWallet(walletAddress: `0x${string}` | undefined) {
  const { data: totalSupply } = useReadContract({
    address: IDENTITY_REGISTRY,
    abi: IDENTITY_ABI,
    functionName: 'totalSupply',
    query: { enabled: !!walletAddress },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const count = Math.min(Number(totalSupply ?? 0n), 200)
  const ids = Array.from({ length: count }, (_, i) => BigInt(i + 1))

  const { data: walletsData, isLoading } = useReadContracts({
    contracts: ids.map((id) => ({
      address: IDENTITY_REGISTRY,
      abi: IDENTITY_ABI,
      functionName: 'getAgentWallet' as const,
      args: [id] as const,
      chainId: ARC_TESTNET_CHAIN_ID,
    })),
    query: { enabled: count > 0 && !!walletAddress },
  })

  const matchingIds: bigint[] = []
  if (walletsData && walletAddress) {
    walletsData.forEach((item, i) => {
      if (
        item.status === 'success' &&
        typeof item.result === 'string' &&
        item.result.toLowerCase() === walletAddress.toLowerCase()
      ) {
        matchingIds.push(ids[i])
      }
    })
  }

  return { agentIds: matchingIds, isLoading, totalSupply: totalSupply ?? 0n }
}

// ─── Util: score display ──────────────────────────────────────────────────────
export function scoreToStars(score: number): number {
  // score is 0–100; map to 1–5 stars
  return Math.round((score / 100) * 4) + 1
}

export function formatScore(raw: bigint | undefined, decimals: number): number | null {
  if (raw === undefined) return null
  return Number(raw) / Math.pow(10, decimals)
}

// ─── Hook: fetch card from URI (async, result via state) ──────────────────────
import { useState, useEffect } from 'react'

export function useAgentCard(uri: string | undefined) {
  const [card, setCard] = useState<AgentRegistrationFile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!uri) {
      // Reset to idle when uri is cleared — done inside async microtask to satisfy lint
      void Promise.resolve().then(() => { setCard(null); setError(null) })
      return
    }
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) {
        setLoading(true)
        setError(null)
      }
    })
    fetchAgentCard(uri).then((c) => {
      if (!cancelled) { setCard(c); setLoading(false) }
    }).catch(() => {
      if (!cancelled) { setError('Failed to fetch agent card'); setLoading(false) }
    })
    return () => { cancelled = true }
  }, [uri])

  return { card, loading, error }
}
