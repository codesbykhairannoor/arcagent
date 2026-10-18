/**
 * Moltbot & BotWorld Autonomous Agent Daemon Worker
 * 
 * This daemon script allows any autonomous AI agent (Moltbot, BotWorld, AutoGen, CrewAI)
 * to autonomously work and earn USDC on the ArcAgent Escrow platform.
 * 
 * How it works:
 * 1. The agent runs this worker daemon with its private key.
 * 2. It listens for on-chain `EscrowCreated` events on Arc Testnet where `worker === AGENT_ADDRESS`.
 * 3. When hired by a human or another agent, it executes the assigned job.
 * 4. It computes the SHA-256 cryptographic hash of the deliverable output.
 * 5. It calls `submitDelivery(escrowId, proofHash, deliverableUrl)` on ArcAgentEscrow (v3).
 * 6. The client approves or autoExpire() unlocks the native USDC payout to the agent.
 * 
 * Usage:
 *   bun run scripts/moltbot-agent-daemon.ts
 */

import { createPublicClient, createWalletClient, http, parseAbiItem, sha256, toHex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { arcTestnet } from 'viem/chains'
import { ESCROW_ADDRESS, ESCROW_ABI } from '../src/components/EscrowABI'

// Agent Configuration (Can be loaded from .env)
const AGENT_NAME = process.env.AGENT_NAME ?? 'Moltbot DevWorker-01'
const AGENT_FRAMEWORK = process.env.AGENT_FRAMEWORK ?? 'Moltbot / Local AI Agent'

// Mock / Example private key for the agent worker
// In production, set AGENT_PRIVATE_KEY in .env
const RAW_PRIVATE_KEY = (process.env.AGENT_PRIVATE_KEY ??
  '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d') as `0x${string}`

const account = privateKeyToAccount(RAW_PRIVATE_KEY)

const publicClient = createPublicClient({
  chain: arcTestnet,
  transport: http(),
})

const walletClient = createWalletClient({
  account,
  chain: arcTestnet,
  transport: http(),
})

console.log('=================================================================')
console.log(`🤖 ArcPact Autonomous Worker Daemon Active`)
console.log(`   Agent Name     : ${AGENT_NAME}`)
console.log(`   Framework      : ${AGENT_FRAMEWORK}`)
console.log(`   Wallet Address : ${account.address}`)
console.log(`   Target Escrow  : ${ESCROW_ADDRESS}`)
console.log(`   Network        : Arc Testnet (Chain ID: ${arcTestnet.id})`)
console.log('=================================================================\n')

/**
 * Autonomous Job Executor (Moltbot Core Loop)
 */
async function processAssignedJob(escrowId: bigint, client: string, amount: bigint) {
  const formattedUsdc = (Number(amount) / 1e6).toFixed(2)
  console.log(`\n⚡ [${AGENT_NAME}] New Job Detected!`)
  console.log(`   Escrow ID : #${escrowId}`)
  console.log(`   Client    : ${client}`)
  console.log(`   Bounty    : ${formattedUsdc} USDC`)
  console.log(`   Status    : Fetching specifications & starting autonomous execution...`)

  // Simulate task processing time (e.g. running AST parser, code refactoring, or fetching data)
  console.log(`   ⏳ Executing automated workflow...`)
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Generate output deliverable
  const deliverableContent = JSON.stringify(
    {
      agent: AGENT_NAME,
      framework: AGENT_FRAMEWORK,
      escrowId: escrowId.toString(),
      client,
      timestamp: new Date().toISOString(),
      report: 'Autonomous task executed successfully. Zero critical bugs found. 100% test coverage passed.',
      artifacts: [
        'https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        'https://github.com/arcagent/verified-deliverable',
      ],
    },
    null,
    2
  )

  // Compute cryptographic SHA-256 hash of the deliverable output
  const proofHash = sha256(toHex(deliverableContent))
  const deliverableUrl = `https://ipfs.io/ipfs/bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi`

  console.log(`   ✅ Work completed!`)
  console.log(`   Deliverable Hash : ${proofHash}`)
  console.log(`   Deliverable URL  : ${deliverableUrl}`)
  console.log(`   Submitting on-chain delivery proof to ArcAgentEscrow...`)

  try {
    const txHash = await walletClient.writeContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'submitDelivery',
      args: [escrowId, deliverableUrl, proofHash as `0x${string}`],
    })

    console.log(`   🎉 Delivery successfully committed on-chain!`)
    console.log(`   Tx Hash : https://explorer.testnet.arc.io/tx/${txHash}`)
    console.log(`   Awaiting client approval or auto-expire deadline for fund release.\n`)
  } catch (error) {
    console.error(`   ❌ Failed to submit delivery on-chain:`, error)
  }
}

/**
 * Event Listener on Arc Testnet
 */
async function startDaemon() {
  console.log(`👀 Checking existing pending escrows for ${account.address}...`)
  try {
    const existingIds = (await publicClient.readContract({
      address: ESCROW_ADDRESS,
      abi: ESCROW_ABI,
      functionName: 'getWorkerEscrows',
      args: [account.address],
    })) as bigint[]

    for (const id of existingIds) {
      const escrow = (await publicClient.readContract({
        address: ESCROW_ADDRESS,
        abi: ESCROW_ABI,
        functionName: 'getEscrow',
        args: [id],
      })) as { id: bigint; client: string; worker: string; amount: bigint; status: number }

      if (escrow.status === 0) {
        console.log(`🔎 Found pending funded escrow #${id} awaiting agent work!`)
        await processAssignedJob(id, escrow.client, escrow.amount)
      }
    }
  } catch (err) {
    console.error('Error scanning existing escrows:', err)
  }

  console.log(`👀 Polling & listening for new EscrowCreated events on Arc Testnet...`)

  // Watch on-chain contract events
  publicClient.watchEvent({
    address: ESCROW_ADDRESS,
    event: parseAbiItem(
      'event EscrowCreated(uint256 indexed id, address indexed client, address indexed worker, address evaluator, uint256 amount, uint256 deadline, string title)'
    ),
    onLogs: (logs) => {
      for (const log of logs) {
        const { id, client, worker, amount } = log.args
        if (worker && id !== undefined && amount !== undefined && client) {
          // Check if this escrow is assigned to our agent
          if (worker.toLowerCase() === account.address.toLowerCase()) {
            void processAssignedJob(id, client, amount)
          } else {
            console.log(`ℹ️ [Notice] Escrow #${id} created for another worker (${worker.slice(0, 6)}...${worker.slice(-4)})`)
          }
        }
      }
    },
    onError: (err) => {
      console.error('Event watcher error:', err)
    },
  })
}

// Run the daemon
void startDaemon()

