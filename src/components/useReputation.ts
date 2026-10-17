/**
 * ERC-8004 Reputation Registry hooks for ArcAgent Escrow.
 * Registry: 0x8004B663056A597Dffe9eCcC1965A193B7388713 (Arc Testnet)
 *
 * giveFeedback — called by client after escrow Completed/Refunded
 * getSummary   — read aggregate score for a worker's agentId
 * getClients   — enumerate who has given feedback (needed for getSummary call)
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { keccak256, toBytes } from 'viem'
import { ARC_TESTNET_CHAIN_ID } from './useEscrowData'

export const REPUTATION_REGISTRY = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as const
export const IDENTITY_REGISTRY   = '0x8004A818BFB912233c491871b3d84c89A494BD9e' as const

// ── ABIs ──────────────────────────────────────────────────────────────────────

export const REPUTATION_ABI = [
  {
    type: 'function', name: 'giveFeedback', stateMutability: 'nonpayable',
    inputs: [
      { name: 'agentId',      type: 'uint256' },
      { name: 'value',        type: 'int128'  },
      { name: 'valueDecimals',type: 'uint8'   },
      { name: 'tag1',         type: 'string'  },
      { name: 'tag2',         type: 'string'  },
      { name: 'endpoint',     type: 'string'  },
      { name: 'feedbackURI',  type: 'string'  },
      { name: 'feedbackHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'getSummary', stateMutability: 'view',
    inputs: [
      { name: 'agentId',        type: 'uint256'   },
      { name: 'clientAddresses',type: 'address[]' },
      { name: 'tag1',           type: 'string'    },
      { name: 'tag2',           type: 'string'    },
    ],
    outputs: [
      { name: 'count',                type: 'uint64'  },
      { name: 'summaryValue',         type: 'int128'  },
      { name: 'summaryValueDecimals', type: 'uint8'   },
    ],
  },
  {
    type: 'function', name: 'getClients', stateMutability: 'view',
    inputs:  [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    type: 'event', name: 'NewFeedback',
    inputs: [
      { name: 'agentId',       type: 'uint256', indexed: true  },
      { name: 'clientAddress', type: 'address', indexed: true  },
      { name: 'feedbackIndex', type: 'uint64',  indexed: false },
      { name: 'value',         type: 'int128',  indexed: false },
      { name: 'valueDecimals', type: 'uint8',   indexed: false },
      { name: 'tag1',          type: 'string',  indexed: false },
      { name: 'feedbackHash',  type: 'bytes32', indexed: false },
    ],
  },
] as const

export const IDENTITY_ABI = [
  {
    type: 'function', name: 'getAgentWallet', stateMutability: 'view',
    inputs:  [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
  {
    type: 'function', name: 'ownerOf', stateMutability: 'view',
    inputs:  [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Read aggregate reputation summary for an agent, across all feedback-givers. */
export function useReputationSummary(
  agentId: bigint | undefined,
  clientAddresses: `0x${string}`[],
) {
  const { data, isLoading, refetch } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_ABI,
    functionName: 'getSummary',
    args: agentId !== undefined && clientAddresses.length > 0
      ? [agentId, clientAddresses, 'job-completed', '']
      : undefined,
    query: { enabled: agentId !== undefined && clientAddresses.length > 0 },
    chainId: ARC_TESTNET_CHAIN_ID,
  })

  const [count, summaryValue, decimals] = data ?? [0n, 0n, 0]
  const score = count > 0n
    ? Number(summaryValue) / Math.pow(10, decimals)
    : null

  return { count, score, isLoading, refetch }
}

/** Read all client addresses who have given feedback for an agent. */
export function useAgentClients(agentId: bigint | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: REPUTATION_REGISTRY,
    abi: REPUTATION_ABI,
    functionName: 'getClients',
    args: agentId !== undefined ? [agentId] : undefined,
    query: { enabled: agentId !== undefined },
    chainId: ARC_TESTNET_CHAIN_ID,
  })
  return { clients: (data ?? []) as `0x${string}`[], isLoading, refetch }
}

/** Write feedback for an agent after a completed escrow. */
export function useGiveFeedback() {
  const { writeContract, data: txHash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash })

  function giveFeedback(params: {
    agentId: bigint
    /** 0–100 score */
    score: number
    /** 'job-completed' | 'job-refunded' */
    tag1: string
    escrowTitle: string
  }) {
    const body = JSON.stringify({ score: params.score, escrow: params.escrowTitle })
    const feedbackHash = keccak256(toBytes(body))
    writeContract({
      address: REPUTATION_REGISTRY,
      abi: REPUTATION_ABI,
      functionName: 'giveFeedback',
      args: [
        params.agentId,
        BigInt(params.score),
        0,                     // valueDecimals = 0 → score is integer 0–100
        params.tag1,
        '',
        '',
        '',                    // no feedbackURI
        feedbackHash,
      ],
      chainId: ARC_TESTNET_CHAIN_ID,
    })
  }

  return { giveFeedback, txHash, isPending, isConfirming, isSuccess }
}
