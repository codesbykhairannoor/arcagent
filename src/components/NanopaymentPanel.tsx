/**
 * NanopaymentPanel — x402 pay-per-call UI
 * Lets a connected wallet call the x402 backend endpoint and pay sub-cent USDC
 * via Circle Gateway Nanopayments. Handles the 402 → payment header → retry flow.
 *
 * The x402 protocol: client hits endpoint → gets 402 with `accepts[]` → builds
 * EIP-3009 authorization header → retries with `X-Payment` → gets 200 + response.
 *
 * This panel uses the Circle x402 client from @circle-fin/x402-batching/client
 * (loaded dynamically so it doesn't bloat the main bundle).
 */
import { useState } from 'react'
import { Zap, Loader2, ChevronDown, ChevronUp, ExternalLink, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAccount, useWalletClient } from 'wagmi'
import { toast } from 'sonner'

interface ServiceDef {
  name: string
  endpoint: string        // relative path, e.g. /api/agent/summarize
  method: 'POST' | 'GET'
  price: string           // display only, e.g. "$0.001"
  description: string
  inputLabel: string
  inputKey: string        // JSON body key for the user's input
  exampleInput: string
}

const SERVICES: ServiceDef[] = [
  {
    name: 'AI Summarize',
    endpoint: '/api/agent/summarize',
    method: 'POST',
    price: '$0.001 USDC',
    description: 'Summarize any text with an AI agent. Pay per call via Circle Gateway.',
    inputLabel: 'Text to summarize',
    inputKey: 'text',
    exampleInput: 'ArcAgent Escrow is a decentralized payment platform for human-to-AI and agent-to-agent work on Arc Network...',
  },
  {
    name: 'AI Classify',
    endpoint: '/api/agent/classify',
    method: 'POST',
    price: '$0.0005 USDC',
    description: 'Classify text into a category. Pay per call via Circle Gateway.',
    inputLabel: 'Text to classify',
    inputKey: 'text',
    exampleInput: 'Building a new DeFi lending protocol with USDC collateral on Arc testnet',
  },
]

interface CallResult {
  ok: boolean
  data: unknown
  paymentHeader?: string
  latencyMs: number
}

export default function NanopaymentPanel() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(0)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CallResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const svc = SERVICES[selected]

  async function handleCall() {
    if (!isConnected || !address || !walletClient) {
      toast.error('Connect your wallet first')
      return
    }
    if (!input.trim()) { toast.error('Enter some text first'); return }

    setLoading(true)
    setResult(null)
    setError(null)
    const t0 = Date.now()

    try {
      // Step 1: probe for 402
      const body = JSON.stringify({ [svc.inputKey]: input.trim() })
      const probe = await fetch(svc.endpoint, {
        method: svc.method,
        headers: { 'Content-Type': 'application/json' },
        body,
      })

      if (probe.ok) {
        // Endpoint is free (no gateway in dev mode) — just use the response
        const data = await probe.json() as unknown
        setResult({ ok: true, data, latencyMs: Date.now() - t0 })
        setLoading(false)
        return
      }

      if (probe.status !== 402) {
        const text = await probe.text()
        throw new Error(`Unexpected ${probe.status}: ${text.slice(0, 200)}`)
      }

      // Step 2: parse 402 accepts
      const paymentRequired = await probe.json() as {
        accepts?: { network: string; asset: string; payTo: string; maxAmountRequired: string }[]
        error?: string
      }

      if (!paymentRequired.accepts?.length) {
        throw new Error('No payment options returned by server')
      }

      const accept = paymentRequired.accepts[0]

      // Step 3: build EIP-3009 TransferWithAuthorization payment header
      // For Circle Gateway: sign a typed-data authorization offline, send as X-Payment header
      // Full implementation requires @circle-fin/x402-batching/client — showing simplified flow
      // that works when SELLER_ADDRESS is set and Gateway is configured on testnet.
      type PaymentHeaderFn = (opts: { walletClient: typeof walletClient; accept: typeof accept }) => Promise<string>
      const x402Mod = await import('@circle-fin/x402-batching/client').catch(() => null)
      const createPaymentHeader = (x402Mod as null | { createPaymentHeader: PaymentHeaderFn })?.createPaymentHeader ?? null

      let xPayment: string | undefined

      if (createPaymentHeader) {
        xPayment = await createPaymentHeader({
          walletClient,
          accept,
        })
      } else {
        // Fallback: show info that x402 client needs to be installed
        setError('x402 client library not available in this environment. Install @circle-fin/x402-batching to enable nanopayments.')
        setLoading(false)
        return
      }

      // Step 4: retry with payment header
      if (!xPayment) throw new Error('Payment header was not generated')
      const paid = await fetch(svc.endpoint, {
        method: svc.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Payment': xPayment,
        } satisfies Record<string, string>,
        body,
      })

      if (!paid.ok) {
        const errText = await paid.text()
        throw new Error(`Payment failed: ${paid.status} ${errText.slice(0, 200)}`)
      }

      const data = await paid.json() as unknown
      setResult({ ok: true, data, paymentHeader: xPayment, latencyMs: Date.now() - t0 })
      toast.success(`Paid ${svc.price} · ${Date.now() - t0}ms`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      toast.error('Call failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-white/5"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(141,216,159,0.12)', border: '1px solid rgba(141,216,159,0.25)' }}>
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>x402 Nanopayments</p>
            <p className="text-xs" style={{ color: 'var(--subtle)' }}>Pay-per-call agent APIs · Circle Gateway</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'var(--subtle)' }} />
               : <ChevronDown className="w-4 h-4" style={{ color: 'var(--subtle)' }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="pt-3 space-y-1 text-xs" style={{ color: 'var(--subtle)' }}>
            <p>Call any registered AI agent endpoint and pay micro-USDC per request via Circle Gateway.</p>
            <p>No gas · No wallet connect per call · Sub-cent billing · Arc Testnet</p>
          </div>

          {/* service selector */}
          <div className="flex gap-2 flex-wrap">
            {SERVICES.map((s, i) => (
              <button key={s.name} onClick={() => { setSelected(i); setResult(null); setError(null) }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: selected === i ? 'rgba(141,216,159,0.12)' : 'var(--surface-muted)',
                  border: `1px solid ${selected === i ? 'rgba(141,216,159,0.4)' : 'var(--border)'}`,
                  color: selected === i ? 'var(--success)' : 'var(--subtle)',
                }}>
                {s.name} · {s.price}
              </button>
            ))}
          </div>

          {/* description */}
          <p className="text-xs" style={{ color: 'var(--muted)' }}>{svc.description}</p>

          {/* input */}
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ color: 'var(--muted)' }}>{svc.inputLabel}</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={3}
              placeholder={svc.exampleInput}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--ink)' }}
            />
          </div>

          {/* call button */}
          <button
            onClick={() => void handleCall()}
            disabled={!isConnected || !input.trim() || loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'rgba(141,216,159,0.15)', border: '1px solid rgba(141,216,159,0.35)', color: 'var(--success)' }}
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" />Processing payment...</>
              : <><Zap className="w-4 h-4" />Pay {svc.price} · Call {svc.name}</>}
          </button>

          {!isConnected && (
            <p className="text-xs text-center" style={{ color: 'var(--subtle)' }}>Connect wallet to pay</p>
          )}

          {/* result */}
          {result && (
            <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid rgba(141,216,159,0.2)' }}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--success)' }}>
                  Response · {result.latencyMs}ms
                </span>
              </div>
              <pre className="text-xs overflow-auto max-h-32 whitespace-pre-wrap break-all"
                style={{ color: 'var(--muted)' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
              {result.paymentHeader && (
                <p className="text-xs" style={{ color: 'var(--subtle)' }}>
                  x402 payment header sent · Circle Gateway settled on Arc Testnet
                </p>
              )}
            </div>
          )}

          {/* error */}
          {error && (
            <div className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: 'rgba(232,109,122,0.08)', border: '1px solid rgba(232,109,122,0.25)' }}>
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
              <p className="text-xs break-all" style={{ color: 'var(--danger)' }}>{error}</p>
            </div>
          )}

          {/* docs link */}
          <a href="https://developers.circle.com/gateway/nanopayments" target="_blank" rel="noreferrer"
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--subtle)' }}>
            Circle Gateway Nanopayments docs <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  )
}
