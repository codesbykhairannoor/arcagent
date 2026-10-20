/**
 * ArcPact Smart Contract QA & On-Chain RPC Verification Bot
 * Directly calls live RPC on both Arc Mainnet and Arc Testnet.
 */

import { createPublicClient, http } from 'viem'
import { ESCROW_ABI, ESCROW_ADDRESSES } from '../src/components/EscrowABI.ts'
import { MILESTONE_ABI, MILESTONE_ADDRESSES } from '../src/components/MilestoneABI.ts'

const CHAINS = [
  {
    name: 'Arc Mainnet',
    id: 5042,
    rpc: 'https://rpc.mainnet.arc.io',
    escrow: ESCROW_ADDRESSES[5042],
    milestone: MILESTONE_ADDRESSES[5042],
  },
  {
    name: 'Arc Testnet',
    id: 5042002,
    rpc: 'https://rpc.testnet.arc.io',
    escrow: ESCROW_ADDRESSES[5042002],
    milestone: MILESTONE_ADDRESSES[5042002],
  },
]

async function runContractQA() {
  console.log(`\n==================================================`)
  console.log(`⛓️  STARTING SMART CONTRACT ON-CHAIN RPC QA`)
  console.log(`==================================================\n`)

  let failedChecks = 0

  for (const c of CHAINS) {
    console.log(`📡 Testing Chain: [${c.name}] (Chain ID: ${c.id})`)
    const client = createPublicClient({
      transport: http(c.rpc),
    })

    try {
      const blockNumber = await client.getBlockNumber()
      console.log(`  ✅ RPC Connected! Current Block: #${blockNumber}`)

      // 1. Verify Escrow Contract Bytecode
      const escrowCode = await client.getBytecode({ address: c.escrow })
      if (!escrowCode || escrowCode === '0x') {
        console.error(`  ❌ [CRITICAL] Escrow contract ${c.escrow} has NO BYTECODE on ${c.name}!`)
        failedChecks++
      } else {
        console.log(`  ✅ Escrow Bytecode Verified at ${c.escrow} (${escrowCode.length / 2} bytes)`)
      }

      // 2. Call escrowCount()
      try {
        const count = await client.readContract({
          address: c.escrow,
          abi: ESCROW_ABI,
          functionName: 'escrowCount',
        })
        console.log(`  ✅ Read escrowCount(): ${count.toString()} total escrows`)
      } catch (e) {
        console.error(`  ❌ Failed reading escrowCount: ${e.message}`)
        failedChecks++
      }

      // 3. Verify Milestone Contract Bytecode
      const milestoneCode = await client.getBytecode({ address: c.milestone })
      if (!milestoneCode || milestoneCode === '0x') {
        console.error(`  ❌ [CRITICAL] Milestone contract ${c.milestone} has NO BYTECODE on ${c.name}!`)
        failedChecks++
      } else {
        console.log(`  ✅ Milestone Bytecode Verified at ${c.milestone} (${milestoneCode.length / 2} bytes)`)
      }

      // 4. Call treasury()
      try {
        const treasury = await client.readContract({
          address: c.escrow,
          abi: ESCROW_ABI,
          functionName: 'treasury',
        })
        console.log(`  ✅ Read treasury address: ${treasury}`)
      } catch (e) {
        console.error(`  ❌ Failed reading treasury: ${e.message}`)
        failedChecks++
      }

    } catch (err) {
      console.error(`  🚨 RPC Connection Error on ${c.name}: ${err.message}`)
      failedChecks++
    }

    console.log(`--------------------------------------------------`)
  }

  console.log(`\n==================================================`)
  if (failedChecks === 0) {
    console.log(`🎉 ALL SMART CONTRACTS & ON-CHAIN RPC CALLS PASSED!`)
    process.exit(0)
  } else {
    console.error(`🚨 ${failedChecks} SMART CONTRACT CHECKS FAILED!`)
    process.exit(1)
  }
}

runContractQA()
