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
import { injected, coinbaseWallet, walletConnect } from 'wagmi/connectors'
import { registerChain } from './tracing'

// Pre-register chain RPC URLs so trace events show correct chain names immediately
registerChain(arcTestnet.id, arcTestnet.rpcUrls.default.http[0])

const wcProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined

export const config = createConfig({
  chains: [arcTestnet, mainnet], // mainnet needed for ENS resolution
  connectors: [
    injected(),                                       // MetaMask, Brave, Frame, etc.
    coinbaseWallet({ appName: 'ArcPact Escrow' }),   // Coinbase Wallet
    ...(wcProjectId
      ? [walletConnect({
          projectId: wcProjectId,
          showQrModal: false,
          metadata: {
            name: 'ArcPact Escrow',
            description: 'Autonomous micro-escrow and milestone payouts for human and AI work on Arc',
            url: 'https://i3cv3uqqwcz9ctkturkah.preview.studio.arc.io',
            icons: ['https://studio.arc.io/favicon.ico'],
          },
        })]
      : []),
  ],
  transports: {
    [arcTestnet.id]: http(),
    [mainnet.id]: http(), // ENS resolution uses mainnet
  },
})
