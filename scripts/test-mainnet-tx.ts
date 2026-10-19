import { createWalletClient, createPublicClient, http, parseUnits, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import fs from 'fs';
import path from 'path';

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://rpc.mainnet.arc.io'] } },
  blockExplorers: { default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' } },
});

const USDC_MAINNET = '0x3600000000000000000000000000000000000000';
const ESCROW_ADDRESS = '0x65152f15482856ca9cf279e65696fa5e430ba9ac';

const ERC20_ABI = parseAbi([
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
]);

const ESCROW_ABI = parseAbi([
  'function createEscrow(address worker, address evaluator, uint256 amount, string title, string description, uint256 deadline, bool splitEnabled) returns (uint256)',
  'function completeEscrow(uint256 escrowId, bytes32 reason)',
]);

async function main() {
  const rawKey = process.env.DEPLOYER_PRIVATE_KEY;
  if (!rawKey) process.exit(1);

  const account = privateKeyToAccount(rawKey as `0x${string}`);
  const publicClient = createPublicClient({ chain: arcMainnet, transport: http() });
  const walletClient = createWalletClient({ account, chain: arcMainnet, transport: http() });

  console.log(`Creating test mainnet escrow with 0.01 USDC...`);
  const amount = 10000n; // 0.01 USDC (6 decimals)

  // 1. Approve USDC
  console.log('1. Approving USDC to Escrow...');
  const approveTx = await walletClient.writeContract({
    address: USDC_MAINNET,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [ESCROW_ADDRESS, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTx });
  console.log(`   Approved! Tx: https://explorer.arc.io/tx/${approveTx}`);

  // 2. Create Escrow
  console.log('2. Creating Escrow on Arc Mainnet...');
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400 * 7); // 7 days
  const createTx = await walletClient.writeContract({
    address: ESCROW_ADDRESS,
    abi: ESCROW_ABI,
    functionName: 'createEscrow',
    args: [
      '0x000000000000000000000000000000000000dEaD', // burn/worker address
      account.address, // evaluator
      amount,
      'Proof of Concept Escrow on Arc Mainnet',
      'Autonomous micro-escrow validation for DoraHacks Arc Microgrants',
      deadline,
      false,
    ],
  });
  await publicClient.waitForTransactionReceipt({ hash: createTx });
  console.log(`   🎉 Escrow Created! Tx: https://explorer.arc.io/tx/${createTx}`);
}

main().catch(console.error);
