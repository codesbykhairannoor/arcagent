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
import { getDefaultConfig } from 'connectkit'
import { registerChain } from './tracing'

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])

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
    chains: [arcTestnet, mainnet], // mainnet needed for ENS resolution
    transports: {
      [arcTestnet.id]: http(),
      [mainnet.id]: http(), // ENS resolution uses mainnet
    },
  })
)
