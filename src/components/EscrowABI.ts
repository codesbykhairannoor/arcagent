// ArcAgentEscrow ABI — v3 ERC-8183 evaluator/arbiter model, pull-payments
// Deployed: 0x761e00783fd733332a0506208413983e1e729493 (Arc Testnet)
export const ESCROW_ADDRESS = '0x761e00783fd733332a0506208413983e1e729493' as `0x${string}`

export const ESCROW_ABI = [
  // ── Events ────────────────────────────────────────────────────────────────
  {
    type: 'event', name: 'EscrowCreated',
    inputs: [
      { name: 'escrowId', type: 'uint256', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'worker', type: 'address', indexed: true },
      { name: 'evaluator', type: 'address', indexed: false },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
      { name: 'splitEnabled', type: 'bool', indexed: false },
    ],
  },
  {
    type: 'event', name: 'DeliverySubmitted',
    inputs: [
      { name: 'escrowId', type: 'uint256', indexed: true },
      { name: 'worker', type: 'address', indexed: true },
      { name: 'deliveryProof', type: 'string', indexed: false },
      { name: 'deliveryHash', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event', name: 'DisputeRaised',
    inputs: [
      { name: 'escrowId', type: 'uint256', indexed: true },
      { name: 'raisedBy', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event', name: 'EscrowCompleted',
    inputs: [
      { name: 'escrowId', type: 'uint256', indexed: true },
      { name: 'worker', type: 'address', indexed: true },
      { name: 'workerAmount', type: 'uint256', indexed: false },
      { name: 'treasuryAmount', type: 'uint256', indexed: false },
      { name: 'reason', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event', name: 'EscrowRefunded',
    inputs: [
      { name: 'escrowId', type: 'uint256', indexed: true },
      { name: 'client', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'reason', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event', name: 'AutoExpired',
    inputs: [
      { name: 'escrowId', type: 'uint256', indexed: true },
      { name: 'worker', type: 'address', indexed: true },
      { name: 'workerAmount', type: 'uint256', indexed: false },
      { name: 'treasuryAmount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'WithdrawalQueued',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event', name: 'Withdrawn',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },

  // ── Write functions ───────────────────────────────────────────────────────
  {
    type: 'function', name: 'createEscrow', stateMutability: 'nonpayable',
    inputs: [
      { name: 'worker', type: 'address' },
      { name: 'evaluator', type: 'address' },   // address(0) = client is evaluator
      { name: 'amount', type: 'uint256' },
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'splitEnabled', type: 'bool' },
    ],
    outputs: [{ name: 'escrowId', type: 'uint256' }],
  },
  {
    type: 'function', name: 'submitDelivery', stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'deliveryProof', type: 'string' },
      { name: 'deliveryHash', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'raiseDispute', stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'completeEscrow', stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'reason', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'refundClient', stateMutability: 'nonpayable',
    inputs: [
      { name: 'escrowId', type: 'uint256' },
      { name: 'reason', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    type: 'function', name: 'autoExpire', stateMutability: 'nonpayable',
    inputs: [{ name: 'escrowId', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function', name: 'withdraw', stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },

  // ── View functions ────────────────────────────────────────────────────────
  {
    type: 'function', name: 'getEscrow', stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{
      name: '', type: 'tuple',
      components: [
        { name: 'id', type: 'uint256' },
        { name: 'client', type: 'address' },
        { name: 'worker', type: 'address' },
        { name: 'evaluator', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'deadline', type: 'uint256' },
        { name: 'status', type: 'uint8' },
        { name: 'deliveryProof', type: 'string' },
        { name: 'deliveryHash', type: 'bytes32' },
        { name: 'splitEnabled', type: 'bool' },
        { name: 'createdAt', type: 'uint256' },
        { name: 'completedAt', type: 'uint256' },
      ],
    }],
  },
  {
    type: 'function', name: 'getClientEscrows', stateMutability: 'view',
    inputs: [{ name: 'client', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'getWorkerEscrows', stateMutability: 'view',
    inputs: [{ name: 'worker', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'getEvaluatorEscrows', stateMutability: 'view',
    inputs: [{ name: 'evaluator', type: 'address' }],
    outputs: [{ name: '', type: 'uint256[]' }],
  },
  {
    type: 'function', name: 'escrowCount', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'pendingWithdrawals', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    type: 'function', name: 'getProtocolFeeBps', stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
