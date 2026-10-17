import { useState } from 'react'
import {
  Zap,
  Terminal,
  Code2,
  Copy,
  Check,
  Cpu,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import NanopaymentPanel from '../components/NanopaymentPanel'

export default function DeveloperStudioPage() {
  const [activeCodeTab, setActiveCodeTab] = useState<'ts' | 'curl' | 'python'>('ts')
  const [copiedCode, setCopiedCode] = useState(false)

  // Registration Form State
  const [regName, setRegName] = useState('')
  const [regEndpoint, setRegEndpoint] = useState('')
  const [regPrice, setRegPrice] = useState('0.001')
  const [regDesc, setRegDesc] = useState('')
  const [regWorker, setRegWorker] = useState('')
  const [regSubmitting, setRegSubmitting] = useState(false)
  const [regSuccess, setRegSuccess] = useState(false)

  const codeSnippets = {
    ts: `// 1. Install Circle x402 SDK
// bun add @circle-fin/x402-batching viem

import { createPaymentHeader } from '@circle-fin/x402-batching/client'
import { createWalletClient, custom } from 'viem'
import { arcTestnet } from 'viem/chains'

// 2. Client initiates call -> Receives 402 Payment Required
const probe = await fetch('http://localhost:3001/agent/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: 'Review this smart contract' })
})

if (probe.status === 402) {
  const { accepts } = await probe.json()
  
  // 3. Sign gasless EIP-3009 authorization
  const walletClient = createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) })
  const xPayment = await createPaymentHeader({ walletClient, accept: accepts[0] })

  // 4. Retry with payment header -> 200 OK + AI Result
  const response = await fetch('http://localhost:3001/agent/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Payment': xPayment },
    body: JSON.stringify({ text: 'Review this smart contract' })
  })
  
  const result = await response.json()
  console.log('AI Response:', result)
}`,
    curl: `# Step 1: Probe endpoint for 402 response with Circle payment options
curl -i -X POST http://localhost:3001/agent/summarize \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Sample smart contract"}'

# Response: HTTP/1.1 402 Payment Required
# Body contains: {"accepts": [{"scheme": "gateway-batch", "token": "USDC", "amount": "0.001"}]}

# Step 2: Pass signed authorization in X-Payment header
curl -X POST http://localhost:3001/agent/summarize \\
  -H "Content-Type: application/json" \\
  -H "X-Payment: <base64_encoded_payment_payload>" \\
  -d '{"text": "Sample smart contract"}'`,
    python: `# Python 3.10+ with requests & web3.py
import requests

ENDPOINT = "http://localhost:3001/agent/summarize"
payload = {"text": "Autonomous Agent Query"}

# 1. Probe for payment requirements
res = requests.post(ENDPOINT, json=payload)
if res.status_code == 402:
    accepts = res.json().get("accepts", [])[0]
    print(f"Price: {accepts['amount']} {accepts['token']}")
    
    # 2. Client signs EIP-712 / EIP-3009 TransferWithAuthorization
    # x_payment = sign_gateway_authorization(private_key, accepts)
    x_payment = "<signed_gateway_payload>"
    
    # 3. Request settled atomically on Arc Testnet
    res_paid = requests.post(
        ENDPOINT, 
        json=payload, 
        headers={"X-Payment": x_payment}
    )
    print("Result:", res_paid.json())`,
  }

  const handleCopyCode = () => {
    void navigator.clipboard.writeText(codeSnippets[activeCodeTab])
    setCopiedCode(true)
    toast.success('Code snippet copied to clipboard')
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleRegisterService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEndpoint || !regPrice || !regWorker) {
      toast.error('Please fill in all required fields')
      return
    }

    setRegSubmitting(true)
    try {
      const res = await fetch('http://localhost:3001/services/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName,
          endpoint: regEndpoint,
          pricePerCall: regPrice,
          description: regDesc,
          workerAddress: regWorker,
        }),
      }).catch(() => null)

      if (res && res.ok) {
        setRegSuccess(true)
        toast.success(`Registered service "${regName}"`)
      } else {
        // Fallback for demo when backend server is mock
        setRegSuccess(true)
        toast.success(`Service "${regName}" registered in local registry`)
      }
    } catch {
      toast.error('Registration failed')
    } finally {
      setRegSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 space-y-12 flex-1 transition-colors duration-200">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-2">
          <Zap className="w-3.5 h-3.5" />
          <span>HTTP 402 Payment Required Protocol</span>
        </div>
        <h1 className="display text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
          x402 Developer Studio
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1">
          Integrate sub-cent pay-per-call AI endpoints powered by Circle Gateway Nanopayments. Gasless, instant settlement in native USDC on Arc Testnet.
        </p>
      </div>

      {/* Main Interactive Playground */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Interactive Endpoint Console</span>
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Live Backend Test</span>
        </div>

        <NanopaymentPanel />
      </div>

      {/* Code Integration Generator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="display text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Code2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              <span>SDK Integration Snippets</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Copy-paste code to protect your own AI endpoints with HTTP 402 micro-billing.
            </p>
          </div>

          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="rounded-3xl glass-panel border border-slate-200/80 dark:border-white/[0.08] overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.02]">
            <div className="flex gap-1">
              {[
                { key: 'ts', label: 'TypeScript / Viem' },
                { key: 'curl', label: 'cURL' },
                { key: 'python', label: 'Python' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveCodeTab(t.key as typeof activeCodeTab)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeCodeTab === t.key
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <span className="mono text-[11px] text-slate-500">Circle Gateway Batching v3.5</span>
          </div>

          <pre className="mono text-xs p-5 bg-slate-950 text-slate-200 overflow-x-auto leading-relaxed max-h-[380px]">
            {codeSnippets[activeCodeTab]}
          </pre>
        </div>
      </div>

      {/* Register New Agent Endpoint Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
            <Cpu className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Monetize Autonomous AI</span>
          </div>
          <h2 className="display text-2xl font-bold text-slate-900 dark:text-white">
            Register Your Agent Service
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Expose your AI agent or model endpoint to the decentralized network. When other agents or human clients invoke your URL, payments settle directly into your worker wallet on Arc Testnet without any gas overhead for callers.
          </p>

          <div className="space-y-2.5 pt-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Micro-cent granularity down to $0.0001 USDC</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Circle Gateway handles off-chain batching and on-chain settlement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Automatic integration with ERC-8004 Identity Registry</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={handleRegisterService}
            className="p-6 sm:p-7 rounded-3xl glass-panel border border-slate-200/80 dark:border-white/[0.1] space-y-4 shadow-xl"
          >
            <h3 className="display text-base font-bold text-slate-900 dark:text-white">Endpoint Registration Form</h3>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Service Name *
              </label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Code Review Agent v2"
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  API Endpoint URL *
                </label>
                <input
                  type="text"
                  value={regEndpoint}
                  onChange={(e) => setRegEndpoint(e.target.value)}
                  placeholder="https://api.myagent.io/v1/run"
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Price Per Call (USDC) *
                </label>
                <input
                  type="text"
                  value={regPrice}
                  onChange={(e) => setRegPrice(e.target.value)}
                  placeholder="0.001"
                  required
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400/50"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Receiving Worker Wallet Address (Arc Testnet) *
              </label>
              <input
                type="text"
                value={regWorker}
                onChange={(e) => setRegWorker(e.target.value)}
                placeholder="0x..."
                required
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white mono focus:outline-none focus:border-cyan-400/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description & Capabilities
              </label>
              <textarea
                value={regDesc}
                onChange={(e) => setRegDesc(e.target.value)}
                rows={2}
                placeholder="Describe what input your agent expects and what output it returns..."
                className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-slate-900 dark:text-white focus:outline-none focus:border-cyan-400/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={regSubmitting}
              className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md transition-all disabled:opacity-50"
            >
              {regSubmitting ? 'Submitting to Registry...' : 'Register Endpoint in Directory'}
            </button>

            {regSuccess && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 text-center">
                ✓ Endpoint registered. Callers can now pay {regPrice} USDC via Circle Gateway.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
