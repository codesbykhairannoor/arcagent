import { useReadContract, useReadContracts } from 'wagmi'
import { erc20Abi } from 'viem'
import { ESCROW_ADDRESS, ESCROW_ABI } from './EscrowABI'
import { getUsdc } from '@/onchain-facts'

export const ARC_TESTNET_CHAIN_ID = 5042002
const USDC_ADDRESS = getUsdc(ARC_TESTNET_CHAIN_ID)!.address as `0x${string}`

// ── Status helpers ─────────────────────────────────────────────────────────────
// Funded=0 Submitted=1 Disputed=2 Completed=3 Refunded=4 Expired=5
export function statusLabel(n: number): string {
  const labels = ['Funded', 'Submitted', 'Disputed', 'Completed', 'Refunded', 'Expired']
  return labels[n] ?? 'Unknown'
}

export function statusColor(n: number): string {
  switch (n) {
    case 0: return 'var(--accent-vivid)'     // Funded — blue
    case 1: return 'var(--warning)'           // Submitted — amber
    case 2: return 'var(--danger)'            // Disputed — red
    case 3: return 'var(--success)'           // Completed — green
    case 4: return 'var(--subtle)'            // Refunded — grey
    case 5: return 'var(--subtle)'            // Expired — grey
    default: return 'var(--subtle)'
  }
}

export function formatAmount(raw: bigint): string {
  return (Number(raw) / 1_000_000).toFixed(2)
}

// ── EscrowData type ────────────────────────────────────────────────────────────
export interface EscrowData {
  id: bigint
  client: `0x${string}`
  worker: `0x${string}`
  evaluator: `0x${string}`
  amount: bigint
  title: string
  description: string
  deadline: bigint
  status: number
  deliveryProof: string
  deliveryHash: `0x${string}`
  splitEnabled: boolean
  createdAt: bigint
  completedAt: bigint
}

// ── Hooks ──────────────────────────────────────────────────────────────────────
export function useUsdcBalance(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return {
    raw: data ?? 0n,
    formatted: data !== undefined ? formatAmount(data) : undefined,
    isLoading,
    refetch,
  }
}

export function usePendingWithdrawal(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'pendingWithdrawals',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return {
    raw: data ?? 0n,
    formatted: data !== undefined && data > 0n ? formatAmount(data) : undefined,
    isLoading,
    refetch,
  }
}

export function useClientEscrows(address: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getClientEscrows',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return { ids: (data ?? []), refetch }
}

export function useWorkerEscrows(address: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getWorkerEscrows',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return { ids: (data ?? []), refetch }
}

export function useEvaluatorEscrows(address: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEvaluatorEscrows',
    args: address ? [address] : undefined,
    query: { enabled: !!address },
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return { ids: (data ?? []), refetch }
}

export function useEscrows(ids: readonly bigint[]) {
  const contracts = ids.map((id) => ({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'getEscrow' as const,
    args: [id] as const,
    chainId: ARC_TESTNET_CHAIN_ID,
  }))

  const { data, isLoading, refetch } = useReadContracts({
    contracts,
    query: { enabled: ids.length > 0 },
  })

  const escrows: EscrowData[] = []
  if (data) {
    for (const item of data) {
      if (item.status === 'success' && item.result) {
        escrows.push(item.result)
      }
    }
  }

  return { escrows, isLoading, refetch }
}

export function useUsdcAllowance(owner: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner ? [owner, ESCROW_ADDRESS] : undefined,
    query: { enabled: !!owner },
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return { allowance: data ?? 0n, refetch }
}
