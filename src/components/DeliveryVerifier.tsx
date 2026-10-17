/**
 * DeliveryVerifier — zero-trust proof verification in the browser.
 *
 * Worker or client pastes the original deliverable text / CID.
 * Component computes keccak256 locally and compares against
 * the bytes32 deliveryHash stored onchain in the escrow.
 *
 * Match   → green checkmark: proof is cryptographically verified
 * Mismatch → red warning:    content does not match the commitment
 */
import { useState } from 'react'
import { keccak256, toBytes } from 'viem'
import { ShieldCheck, ShieldAlert, Hash } from 'lucide-react'

interface Props {
  /** bytes32 deliveryHash stored onchain */
  onchainHash: `0x${string}`
}

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000'

export default function DeliveryVerifier({ onchainHash }: Props) {
  const [input, setInput] = useState('')

  if (!onchainHash || onchainHash === ZERO_HASH) return null

  const computed = input.trim() ? keccak256(toBytes(input.trim())) : null
  const match    = computed !== null && computed.toLowerCase() === onchainHash.toLowerCase()
  const mismatch = computed !== null && !match

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
      {/* header */}
      <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'var(--surface-muted)' }}>
        <Hash className="w-4 h-4" style={{ color: 'var(--violet)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Delivery Proof Verifier</span>
        <span className="ml-auto text-xs px-1.5 py-0.5 rounded-md"
          style={{ background: 'var(--violet-muted)', color: 'var(--violet)' }}>
          ERC-8183
        </span>
      </div>

      <div className="px-4 py-3 space-y-3" style={{ background: 'var(--surface)' }}>
        {/* onchain hash display */}
        <div>
          <p className="text-xs font-semibold mb-1" style={{ color: 'var(--subtle)' }}>Onchain Commitment</p>
          <p className="mono text-xs break-all" style={{ color: 'var(--muted)' }}>
            {onchainHash.slice(0, 18)}…{onchainHash.slice(-10)}
          </p>
        </div>

        {/* input */}
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ color: 'var(--muted)' }}>
            Paste deliverable text / IPFS CID to verify
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Paste the exact deliverable content or CID that was committed..."
            className="mono w-full px-3 py-2 rounded-xl text-xs outline-none resize-none"
            style={{
              background: 'var(--surface-muted)',
              border: `1px solid ${match ? 'var(--success)' : mismatch ? 'var(--danger)' : 'var(--border)'}`,
              color: 'var(--ink)',
            }}
          />
        </div>

        {/* computed hash */}
        {computed && (
          <div>
            <p className="text-xs font-semibold mb-1" style={{ color: 'var(--subtle)' }}>Computed Hash</p>
            <p className="mono text-xs break-all"
              style={{ color: match ? 'var(--success)' : 'var(--danger)' }}>
              {computed.slice(0, 18)}…{computed.slice(-10)}
            </p>
          </div>
        )}

        {/* result banner */}
        {match && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(141,216,159,0.08)', border: '1px solid rgba(141,216,159,0.3)' }}>
            <ShieldCheck className="w-5 h-5 shrink-0" style={{ color: 'var(--success)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Verified</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Content matches the onchain commitment — this proof is cryptographically verified.
              </p>
            </div>
          </div>
        )}

        {mismatch && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(232,109,122,0.08)', border: '1px solid rgba(232,109,122,0.3)' }}>
            <ShieldAlert className="w-5 h-5 shrink-0" style={{ color: 'var(--danger)' }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--danger)' }}>Mismatch</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Content does not match the onchain hash. The deliverable may have been altered.
              </p>
            </div>
          </div>
        )}

        {!computed && (
          <p className="text-xs" style={{ color: 'var(--subtle)' }}>
            keccak256 is computed locally in your browser — nothing is sent to any server.
          </p>
        )}
      </div>
    </div>
  )
}
