import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
import fs from 'fs';
import path from 'path';

// Load .env
import dotenv from 'dotenv';
dotenv.config();

const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' },
  },
});

const USDC_MAINNET = '0x3600000000000000000000000000000000000000';

async function main() {
  const rawKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!rawKey) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY tidak ditemukan di .env!');
    console.error('Silakan tambahkan ke .env: DEPLOYER_PRIVATE_KEY=0x...');
    process.exit(1);
  }

  const formattedKey = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`;
  const account = privateKeyToAccount(formattedKey);

  console.log(`🚀 Starting Arc Mainnet Deployment...`);
  console.log(`👤 Deployer Address: ${account.address}`);

  const publicClient = createPublicClient({
    chain: arcMainnet,
    transport: http('https://rpc.mainnet.arc.io'),
  });

  const walletClient = createWalletClient({
    account,
    chain: arcMainnet,
    transport: http('https://rpc.mainnet.arc.io'),
  });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`💰 Deployer Balance: ${(Number(balance) / 1e18).toFixed(4)} USDC`);

  if (balance === 0n) {
    console.error('❌ Error: Saldo USDC di Arc Mainnet kosong!');
    process.exit(1);
  }

  // Read Compiled Artifacts
  const escrowArtifactPath = path.resolve(__dirname, '../contracts/out/ArcAgentEscrow.sol/ArcAgentEscrow.json');
  const milestoneArtifactPath = path.resolve(__dirname, '../contracts/out/ArcMilestoneEscrow.sol/ArcMilestoneEscrow.json');

  const escrowArtifact = JSON.parse(fs.readFileSync(escrowArtifactPath, 'utf8'));
  const milestoneArtifact = JSON.parse(fs.readFileSync(milestoneArtifactPath, 'utf8'));

  // 1. Deploy ArcAgentEscrow
  console.log('\n📦 [1/2] Deploying ArcAgentEscrow...');
  const escrowTxHash = await walletClient.deployContract({
    abi: escrowArtifact.abi,
    bytecode: escrowArtifact.bytecode.object,
    args: [USDC_MAINNET, account.address],
  });
  console.log(`   ⏳ Tx broadcasted: https://explorer.arc.io/tx/${escrowTxHash}`);
  const escrowReceipt = await publicClient.waitForTransactionReceipt({ hash: escrowTxHash });
  const escrowAddress = escrowReceipt.contractAddress;
  console.log(`   ✅ ArcAgentEscrow Deployed at: ${escrowAddress}`);

  // 2. Deploy ArcMilestoneEscrow
  console.log('\n📦 [2/2] Deploying ArcMilestoneEscrow...');
  const milestoneTxHash = await walletClient.deployContract({
    abi: milestoneArtifact.abi,
    bytecode: milestoneArtifact.bytecode.object,
    args: [USDC_MAINNET, account.address],
  });
  console.log(`   ⏳ Tx broadcasted: https://explorer.arc.io/tx/${milestoneTxHash}`);
  const milestoneReceipt = await publicClient.waitForTransactionReceipt({ hash: milestoneTxHash });
  const milestoneAddress = milestoneReceipt.contractAddress;
  console.log(`   ✅ ArcMilestoneEscrow Deployed at: ${milestoneAddress}`);

  // 3. Update Frontend ABI Constants
  console.log('\n📝 Updating frontend config with new Mainnet addresses...');

  const escrowAbiPath = path.resolve(__dirname, '../src/components/EscrowABI.ts');
  let escrowAbiContent = fs.readFileSync(escrowAbiPath, 'utf8');
  escrowAbiContent = escrowAbiContent.replace(
    /export const ESCROW_ADDRESS = '0x[a-fA-F0-9]+'/,
    `export const ESCROW_ADDRESS = '${escrowAddress}'`
  );
  fs.writeFileSync(escrowAbiPath, escrowAbiContent, 'utf8');

  const milestoneAbiPath = path.resolve(__dirname, '../src/components/MilestoneABI.ts');
  let milestoneAbiContent = fs.readFileSync(milestoneAbiPath, 'utf8');
  milestoneAbiContent = milestoneAbiContent.replace(
    /export const MILESTONE_ADDRESS = '0x[a-fA-F0-9]+'/,
    `export const MILESTONE_ADDRESS = '${milestoneAddress}'`
  );
  fs.writeFileSync(milestoneAbiPath, milestoneAbiContent, 'utf8');

  // Update AGENTS.md record
  const agentsMdPath = path.resolve(__dirname, '../AGENTS.md');
  if (fs.existsSync(agentsMdPath)) {
    let agentsMd = fs.readFileSync(agentsMdPath, 'utf8');
    agentsMd += `\n| ArcAgentEscrow Mainnet | Arc Mainnet | ${escrowAddress} | https://explorer.arc.io/address/${escrowAddress} |`;
    agentsMd += `\n| ArcMilestoneEscrow Mainnet | Arc Mainnet | ${milestoneAddress} | https://explorer.arc.io/address/${milestoneAddress} |\n`;
    fs.writeFileSync(agentsMdPath, agentsMd, 'utf8');
  }

  console.log('\n🎉 ALL DONE! DEPLOYMENT SUCCESSFUL!');
  console.log('====================================================');
  console.log(`ArcAgentEscrow:    ${escrowAddress}`);
  console.log(`ArcMilestoneEscrow: ${milestoneAddress}`);
  console.log(`Tx 1 Explorer:     https://explorer.arc.io/tx/${escrowTxHash}`);
  console.log(`Tx 2 Explorer:     https://explorer.arc.io/tx/${milestoneTxHash}`);
  console.log('====================================================');
}

main().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});
