/**
 * wagmi configuration
 * Built with Arc Studio — https://studio.arc.io
 *
 * Connectors:
 *  - injected()        → MetaMask, Brave, Frame, any injected EIP-1193 wallet
 *  - coinbaseWallet()  → Coinbase Wallet (browser extension + mobile)
 *  - walletConnect()   → WalletConnect v2 QR — unlocks 400+ wallets
 *                        (Trust, Rainbow, Zerion, OKX, Phantom, Safe, etc.)
 *                        Requires VITE_WALLETCONNECT_PROJECT_ID in .env
 */

import { http, createConfig } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import { arcTestnet } from 'viem/chains'
import { defineChain } from 'viem'
import { getDefaultConfig } from 'connectkit'
import { registerChain } from './tracing'

// Define official Arc Mainnet
export const arcMainnet = defineChain({
  id: 5042,
  name: 'Arc Mainnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' },
  },
})

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])
registerChain(arcMainnet.id, arcMainnet.rpcUrls.default.http[0])

// Default WalletConnect Project ID fallback ensures QR modal works on Vercel even if env var was not redeployed yet
const DEFAULT_WC_PROJECT_ID = 'c0891d12d1bca7289e089af886e1945b'
const wcProjectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) || DEFAULT_WC_PROJECT_ID

export const config = createConfig(
  getDefaultConfig({
    appName: 'ArcPact Escrow',
    appDescription: 'Autonomous micro-escrow and milestone payouts for human and AI work on Arc',
    appUrl: typeof window !== 'undefined' ? window.location.origin : 'https://arcagent.vercel.app',
    appIcon: 'https://arcagent.vercel.app/favicon.ico',
    walletConnectProjectId: wcProjectId,
    chains: [arcMainnet, arcTestnet, mainnet], // Arc Mainnet priority, fallback testnet & mainnet for ENS
    transports: {
      [arcMainnet.id]: http(),
      [arcTestnet.id]: http(),
      [mainnet.id]: http(), // ENS resolution uses mainnet
    },
  })
)
