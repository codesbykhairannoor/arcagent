# ArcAgent Escrow — v4 (Tier 2: Agent Identity + x402 Nanopayments + Multi-Milestone)

> Built with Arc Studio - money-powered apps in minutes

This is the **project memory** - what Arc Studio remembers about building this app. It helps future agents (or humans) understand and extend the project.

---

## What This App Does

A decentralized micro-escrow and milestone payout platform for human-to-AI and agent-to-agent service transactions using native USDC on Arc. Clients fund escrows, workers submit delivery proofs, and funds are atomically released on approval or auto-released after deadline.

## Deployed Contracts

| Contract | Chain | Address | Explorer |
|---|---|---|---|
| ArcAgentEscrow v1 | Arc Testnet | 0xf693b3906ac760e3011634e8d1e43ad1a8226fe2 | https://explorer.testnet.arc.io/address/0xf693b3906ac760e3011634e8d1e43ad1a8226fe2 |
| ArcAgentEscrow v3 (active) | Arc Testnet | 0x761e00783fd733332a0506208413983e1e729493 | https://explorer.testnet.arc.io/address/0x761e00783fd733332a0506208413983e1e729493 |
| ArcMilestoneEscrow v1 (active) | Arc Testnet | 0x6475145721074298d0b3cbcd79417988dc893d2d | https://explorer.testnet.arc.io/address/0x6475145721074298d0b3cbcd79417988dc893d2d |

## Tech Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Web3: wagmi v2, viem v2, ConnectKit
- Contracts: Solidity 0.8.28 + Foundry. Sources in `contracts/`, unit tests in `contracts/test/*.t.sol`. Build with `bun run contracts:build` (`forge build`), test with `bun run contracts:test` (`forge test`).
- Wallet: injected (MetaMask, etc.)
- Chain: Arc Testnet (Chain ID: 5042002, imported from `viem/chains`)
- Token: USDC (6 decimals) (Address: 0x3600000000000000000000000000000000000000, Chain: Arc Testnet)
- Toasts: Sonner

## Key Files

- `src/App.tsx` - Main application logic
- `src/components/` - UI components
- `src/config.ts` - wagmi config (chains, connectors, transports)

## To Run

```bash
bun install
bun run dev
```
