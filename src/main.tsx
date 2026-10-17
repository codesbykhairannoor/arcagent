/*
 *  ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗
 *  ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
 *  ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
 *  ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
 *  ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝
 *
 *  Built with Arc Studio
 *  https://studio.arc.io
 */

import './tracing'
import './console-capture'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectKitProvider } from 'connectkit'
import { Toaster } from 'sonner'
import { config } from './config'
import App from './App'
import { CircleWalletProvider } from './components/CircleWalletLogin'
import { ThemeProvider, useTheme } from './components/ThemeProvider'
import './index.css'

const queryClient = new QueryClient()

// Studio logo SVG
const StudioLogo = () => (
  <svg width="14" height="16" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 21.5001C0.167192 16.2366 1.02308 11.3243 2.45378 7.50459C4.26573 2.66517 6.88869 0 9.83904 0C12.7894 0 15.412 2.66517 17.2243 7.50459C18.1669 10.0216 18.8605 13.0121 19.2713 16.2655C19.3081 16.556 19.3393 16.8513 19.3714 17.146C19.3819 17.1642 19.3881 17.1811 19.386 17.1949C19.386 17.1949 19.6275 18.7674 19.6788 21.5001H19.6515C19.2934 21.1937 15.0694 17.7329 8.06739 18.735C8.17304 17.4996 8.31833 16.2974 8.50603 15.1452C8.51562 15.0863 8.52671 15.0294 8.53649 14.9709C11.2828 14.8846 13.6866 15.2171 15.5299 15.6529C15.5231 15.6073 15.5173 15.5603 15.5103 15.5149C15.1314 13.0547 14.5724 10.8024 13.8517 8.87761C12.6732 5.73037 11.1354 3.77496 9.83904 3.77496C8.54269 3.77496 7.00493 5.73037 5.82649 8.87761C5.54123 9.63889 5.28154 10.4508 5.04866 11.3071C4.72126 12.507 4.44621 13.7934 4.22654 15.1451C3.90141 17.1412 3.69827 19.2821 3.62345 21.5001H0Z" fill="currentColor"/>
  </svg>
)

// Studio watermark component - links back to Studio
const StudioWatermark = () => (
  <a
    href="https://studio.arc.io/"
    target="_blank"
    rel="noopener noreferrer"
    style={{
      position: 'fixed',
      bottom: '16px',
      right: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '8px 14px',
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: '#1B3158',
      textDecoration: 'none',
      cursor: 'pointer',
      background: 'rgba(172, 198, 233, 0.85)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.4)',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(27, 49, 88, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
    }}
  >
    <StudioLogo />
    Built with Arc Studio
  </a>
)

function ThemedConnectKitApp() {
  const { resolvedTheme } = useTheme()

  const customTheme = resolvedTheme === 'dark' ? {
    '--ck-font-family': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    '--ck-border-radius': '20px',
    '--ck-body-background': '#070c1b',
    '--ck-body-background-secondary': '#0d1527',
    '--ck-body-background-tertiary': '#141d36',
    '--ck-body-color': '#f8fafc',
    '--ck-body-color-muted': '#94a3b8',
    '--ck-body-action-color': '#a78bfa',
    '--ck-body-divider': 'rgba(255, 255, 255, 0.08)',
    '--ck-qr-dot-color': '#ffffff',
    '--ck-qr-background': '#080e22',
    '--ck-qr-border-color': 'rgba(167, 139, 250, 0.35)',
    '--ck-primary-button-background': '#7c3aed',
    '--ck-primary-button-hover-background': '#6d28d9',
    '--ck-primary-button-color': '#ffffff',
    '--ck-secondary-button-background': 'rgba(255, 255, 255, 0.06)',
    '--ck-secondary-button-hover-background': 'rgba(255, 255, 255, 0.1)',
    '--ck-secondary-button-color': '#f8fafc',
    '--ck-focus-color': '#a78bfa',
    '--ck-modal-box-shadow': '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(167, 139, 250, 0.25)',
  } : {
    '--ck-font-family': "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
    '--ck-border-radius': '20px',
    '--ck-body-background': '#ffffff',
    '--ck-body-background-secondary': '#f8fafc',
    '--ck-body-background-tertiary': '#f1f5f9',
    '--ck-body-color': '#0f172a',
    '--ck-body-color-muted': '#64748b',
    '--ck-body-action-color': '#7c3aed',
    '--ck-body-divider': 'rgba(15, 23, 42, 0.08)',
    '--ck-qr-dot-color': '#0f172a',
    '--ck-qr-background': '#ffffff',
    '--ck-qr-border-color': 'rgba(15, 23, 42, 0.15)',
    '--ck-primary-button-background': '#7c3aed',
    '--ck-primary-button-hover-background': '#6d28d9',
    '--ck-primary-button-color': '#ffffff',
    '--ck-secondary-button-background': '#f1f5f9',
    '--ck-secondary-button-hover-background': '#e2e8f0',
    '--ck-secondary-button-color': '#0f172a',
    '--ck-focus-color': '#7c3aed',
    '--ck-modal-box-shadow': '0 25px 60px -15px rgba(15, 23, 42, 0.18), 0 0 25px -5px rgba(124, 58, 237, 0.15)',
  }

  return (
    <ConnectKitProvider
      mode={resolvedTheme}
      theme={resolvedTheme === 'dark' ? 'midnight' : 'soft'}
      customTheme={customTheme}
    >
      <CircleWalletProvider>
        <App />
        <StudioWatermark />
        <Toaster position="top-center" theme={resolvedTheme} richColors />
      </CircleWalletProvider>
    </ConnectKitProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ThemedConnectKitApp />
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)

