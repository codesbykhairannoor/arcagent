import { useReadContract, useReadContracts } from 'wagmi'
import { MILESTONE_ADDRESS, MILESTONE_ABI, getMilestoneAddress } from './MilestoneABI'
import { useActiveChainId } from './useEscrowData'

export interface JobData {
  jobId: bigint
  client: `0x${string}`
  worker: `0x${string}`
  evaluator: `0x${string}`
  totalAmount: bigint
  jobTitle: string
  splitEnabled: boolean
  createdAt: bigint
  milestoneCount: bigint
}

export interface MilestoneData {
  milestoneId: bigint
  amount: bigint
  title: string
  description: string
  deadline: bigint
  status: number
  deliveryProof: string
  deliveryHash: `0x${string}`
  completedAt: bigint
}

// Milestone status: 0=Pending 1=Submitted 2=Disputed 3=Completed 4=Refunded 5=Expired
export function milestoneStatusLabel(n: number): string {
  return ['Pending', 'Submitted', 'Disputed', 'Completed', 'Refunded', 'Expired'][n] ?? 'Unknown'
}

export function milestoneStatusColor(n: number): string {
  switch (n) {
    case 0: return 'var(--subtle)'
    case 1: return 'var(--warning)'
    case 2: return 'var(--danger)'
    case 3: return 'var(--success)'
    case 4: return 'var(--subtle)'
    case 5: return 'var(--subtle)'
    default: return 'var(--subtle)'
  }
}

export function useClientJobs(address: `0x${string}` | undefined) {
  const activeChainId = useActiveChainId()
  const milestoneAddr = getMilestoneAddress(activeChainId)
  const { data, refetch } = useReadContract({
    address: milestoneAddr, abi: MILESTONE_ABI, functionName: 'getClientJobs',
    args: address ? [address] : undefined,
    query: { enabled: !!address }, chainId: activeChainId,
  })
  return { ids: data ?? [], refetch }
}

export function useWorkerJobs(address: `0x${string}` | undefined) {
  const activeChainId = useActiveChainId()
  const milestoneAddr = getMilestoneAddress(activeChainId)
  const { data, refetch } = useReadContract({
    address: milestoneAddr, abi: MILESTONE_ABI, functionName: 'getWorkerJobs',
    args: address ? [address] : undefined,
    query: { enabled: !!address }, chainId: activeChainId,
  })
  return { ids: data ?? [], refetch }
}

export function useJobs(ids: readonly bigint[]) {
  const activeChainId = useActiveChainId()
  const milestoneAddr = getMilestoneAddress(activeChainId)
  const { data, isLoading, refetch } = useReadContracts({
    contracts: ids.map((id) => ({
      address: milestoneAddr, abi: MILESTONE_ABI,
      functionName: 'getJob' as const, args: [id] as const,
      chainId: activeChainId,
    })),
    query: { enabled: ids.length > 0 },
  })
  const jobs: JobData[] = []
  if (data) for (const item of data) {
    if (item.status === 'success' && item.result) jobs.push(item.result)
  }
  return { jobs, isLoading, refetch }
}

export function useMilestones(jobId: bigint | undefined) {
  const activeChainId = useActiveChainId()
  const milestoneAddr = getMilestoneAddress(activeChainId)
  const { data, isLoading, refetch } = useReadContract({
    address: milestoneAddr, abi: MILESTONE_ABI, functionName: 'getMilestones',
    args: jobId !== undefined ? [jobId] : undefined,
    query: { enabled: jobId !== undefined }, chainId: activeChainId,
  })
  return { milestones: (data ?? []) as MilestoneData[], isLoading, refetch }
}

export function useMilestonePendingWithdrawal(address: `0x${string}` | undefined) {
  const activeChainId = useActiveChainId()
  const milestoneAddr = getMilestoneAddress(activeChainId)
  const { data, refetch } = useReadContract({
    address: milestoneAddr, abi: MILESTONE_ABI, functionName: 'pendingWithdrawals',
    args: address ? [address] : undefined,
    query: { enabled: !!address }, chainId: activeChainId,
  })
  return { raw: data ?? 0n, refetch }
}
