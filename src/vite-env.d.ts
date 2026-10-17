/// <reference types="vite/client" />

declare module '@circlefin/compass-chains' {
  export interface CompassChain {
    name: string
    explorerUrl?: string
    nativeCurrency: { symbol: string }
    [key: string]: unknown
  }
  export function getChain(name: string): CompassChain
}
