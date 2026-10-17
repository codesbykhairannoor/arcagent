/**
 * ArcAgent Escrow — x402 Nanopayments backend
 * Exposes a pay-per-call /api/agent endpoint protected by Circle Gateway Nanopayments.
 * Workers register their endpoint here; clients pay sub-cent USDC per call via x402.
 *
 * Circle Gateway handles gasless USDC authorizations on Arc Testnet.
 * Seller address receives payment; no gas needed from client.
 */
import express from 'express'
import { createGatewayMiddleware } from '@circle-fin/x402-batching/server'

const app = express()
app.use(express.json())
app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'content-type,authorization,x-payment,x-payment-response')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  if (_req.method === 'OPTIONS') { res.sendStatus(204); return }
  next()
})

const SELLER_ADDRESS = process.env.VITE_SELLER_ADDRESS
if (!SELLER_ADDRESS) {
  console.warn('[x402] VITE_SELLER_ADDRESS not set — x402 payments will not settle')
}

// ── Gateway middleware ────────────────────────────────────────────────────────
const gateway = createGatewayMiddleware({
  sellerAddress: (SELLER_ADDRESS ?? '0x0000000000000000000000000000000000000000') as `0x${string}`,
})

// ── Health (free) ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sellerAddress: SELLER_ADDRESS ?? 'not-set', timestamp: Date.now() })
})

// ── Registered services registry (free) ───────────────────────────────────────
interface ServiceEntry {
  name: string
  endpoint: string
  pricePerCall: string   // USDC string e.g. "0.001"
  description: string
  workerAddress: string
  registeredAt: number
}
const services: ServiceEntry[] = []

app.get('/services', (_req, res) => {
  res.json({ services, count: services.length })
})

app.post('/services/register', (req, res) => {
  const { name, endpoint, pricePerCall, description, workerAddress } = req.body as Partial<ServiceEntry>
  if (!name || !endpoint || !pricePerCall || !workerAddress) {
    res.status(400).json({ error: 'Missing required fields: name, endpoint, pricePerCall, workerAddress' })
    return
  }
  const entry: ServiceEntry = { name, endpoint, pricePerCall, description: description ?? '', workerAddress, registeredAt: Date.now() }
  services.push(entry)
  console.log('[x402] service registered:', name, 'by', workerAddress)
  res.json({ ok: true, service: entry })
})

// ── Demo paid endpoint: agent summarize ($0.001 per call) ─────────────────────
app.post(
  '/agent/summarize',
  gateway.require('$0.001'),
  (req, res) => {
    const { text } = req.body as { text?: string }
    if (!text) { res.status(400).json({ error: 'text required' }); return }
    // Demo: echo a mock summary (in production, call your AI model here)
    const words = text.trim().split(/\s+/).slice(0, 20).join(' ')
    res.json({
      summary: `[AI Summary] ${words}${text.split(/\s+/).length > 20 ? '...' : ''}`,
      model: 'arc-agent-demo-v1',
      paidWith: 'USDC via Circle Gateway x402',
      timestamp: Date.now(),
    })
  },
)

// ── Demo paid endpoint: agent classify ($0.0005 per call) ─────────────────────
app.post(
  '/agent/classify',
  gateway.require('$0.0005'),
  (req, res) => {
    const { text } = req.body as { text?: string }
    if (!text) { res.status(400).json({ error: 'text required' }); return }
    const categories = ['DeFi', 'Infrastructure', 'Gaming', 'AI', 'Social', 'Other']
    const picked = categories[Math.abs(text.length) % categories.length]
    res.json({
      category: picked,
      confidence: 0.87,
      model: 'arc-agent-demo-v1',
      paidWith: 'USDC via Circle Gateway x402',
      timestamp: Date.now(),
    })
  },
)

const PORT = process.env.X402_PORT ? parseInt(process.env.X402_PORT) : 3001
app.listen(PORT, () => {
  console.log(`[x402] server running on port ${PORT}`)
  console.log(`[x402] seller: ${SELLER_ADDRESS ?? 'NOT SET'}`)
  console.log('[x402] endpoints: POST /agent/summarize ($0.001) | POST /agent/classify ($0.0005)')
})
