export const MILESTONE_ADDRESSES: Record<number, `0x${string}`> = {
  5042: '0x873af0e8ca7922709636346d07aa19421bfbe0f0', // Arc Mainnet
  5042002: '0x6475145721074298d0b3cbcd79417988dc893d2d', // Arc Testnet
}

export function getMilestoneAddress(chainId?: number): `0x${string}` {
  if (chainId && MILESTONE_ADDRESSES[chainId]) return MILESTONE_ADDRESSES[chainId]
  return '0x6475145721074298d0b3cbcd79417988dc893d2d'
}

export const MILESTONE_ADDRESS = '0x6475145721074298d0b3cbcd79417988dc893d2d' as const

export const MILESTONE_ABI = [
  { type: 'function', name: 'createJob', stateMutability: 'nonpayable',
    inputs: [
      { name: 'p', type: 'tuple', components: [
        { name: 'worker', type: 'address' },
        { name: 'evaluator', type: 'address' },
        { name: 'jobTitle', type: 'string' },
        { name: 'splitEnabled', type: 'bool' },
      ]},
      { name: 'milestones', type: 'tuple[]', components: [
        { name: 'amount', type: 'uint256' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'deadline', type: 'uint256' },
      ]},
    ],
    outputs: [{ name: 'jobId', type: 'uint256' }],
  },
  { type: 'function', name: 'submitMilestone', stateMutability: 'nonpayable',
    inputs: [
      { name: 'jobId', type: 'uint256' },
      { name: 'milestoneId', type: 'uint256' },
      { name: 'deliveryProof', type: 'string' },
      { name: 'deliveryHash', type: 'bytes32' },
    ], outputs: [],
  },
  { type: 'function', name: 'completeMilestone', stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }, { name: 'milestoneId', type: 'uint256' }], outputs: [],
  },
  { type: 'function', name: 'refundMilestone', stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }, { name: 'milestoneId', type: 'uint256' }], outputs: [],
  },
  { type: 'function', name: 'raiseDispute', stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }, { name: 'milestoneId', type: 'uint256' }], outputs: [],
  },
  { type: 'function', name: 'autoExpireMilestone', stateMutability: 'nonpayable',
    inputs: [{ name: 'jobId', type: 'uint256' }, { name: 'milestoneId', type: 'uint256' }], outputs: [],
  },
  { type: 'function', name: 'withdraw', stateMutability: 'nonpayable', inputs: [], outputs: [] },
  { type: 'function', name: 'getJob', stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple', components: [
      { name: 'jobId', type: 'uint256' },
      { name: 'client', type: 'address' },
      { name: 'worker', type: 'address' },
      { name: 'evaluator', type: 'address' },
      { name: 'totalAmount', type: 'uint256' },
      { name: 'jobTitle', type: 'string' },
      { name: 'splitEnabled', type: 'bool' },
      { name: 'createdAt', type: 'uint256' },
      { name: 'milestoneCount', type: 'uint256' },
    ]}],
  },
  { type: 'function', name: 'getMilestones', stateMutability: 'view',
    inputs: [{ name: 'jobId', type: 'uint256' }],
    outputs: [{ name: '', type: 'tuple[]', components: [
      { name: 'milestoneId', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'deliveryProof', type: 'string' },
      { name: 'deliveryHash', type: 'bytes32' },
      { name: 'completedAt', type: 'uint256' },
    ]}],
  },
  { type: 'function', name: 'getClientJobs', stateMutability: 'view',
    inputs: [{ name: 'client', type: 'address' }], outputs: [{ name: '', type: 'uint256[]' }],
  },
  { type: 'function', name: 'getWorkerJobs', stateMutability: 'view',
    inputs: [{ name: 'worker', type: 'address' }], outputs: [{ name: '', type: 'uint256[]' }],
  },
  { type: 'function', name: 'getEvaluatorJobs', stateMutability: 'view',
    inputs: [{ name: 'evaluator', type: 'address' }], outputs: [{ name: '', type: 'uint256[]' }],
  },
  { type: 'function', name: 'pendingWithdrawals', stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }], outputs: [{ name: '', type: 'uint256' }],
  },
] as const
