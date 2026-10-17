/**
 * AgentBadge — inline identity chip for an address.
 * Shows agent name from ERC-8004 if registered, reputation score, x402 support badge.
 * Falls back to truncated address if not registered.
 */
import { useState } from 'react'
import { Bot, Star, Zap, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import {
  useAgentIdsByWallet,
  useAgentById,
  useAgentCard,
  formatScore,
  scoreToStars,
  IDENTITY_REGISTRY,
} from './useAgentIdentity'


const EXPLORER_BASE = 'https://explorer.testnet.arc.io'

function truncate(addr: string) { return `${addr.slice(0, 6)}…${addr.slice(-4)}` }

interface Props {
  address: `0x${string}`
  label?: string          // e.g. "Worker", "Evaluator"
  showExpanded?: boolean  // show full card by default
}

function AgentDetails({ agentId, address }: { agentId: bigint; address: string }) {
  const { wallet, agentURI, reputationCount, reputationRaw, reputationDecimals, isLoading } = useAgentById(agentId)
  const { card, loading: cardLoading } = useAgentCard(agentURI)

  const score = formatScore(reputationRaw, reputationDecimals)
  const stars = score !== null ? scoreToStars(score) : null

  if (isLoading || cardLoading) {
    return (
      <div className="flex items-center gap-1.5 py-1" style={{ color: 'var(--subtle)' }}>
        <Loader2 className="w-3 h-3 animate-spin" />
        <span className="text-xs">Loading identity…</span>
      </div>
    )
  }

  return (
    <div className="mt-2 rounded-xl p-3 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
      {/* agent name + description */}
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, var(--violet) 0%, var(--accent-vivid) 100%)' }}>
          {card?.image
            ? <img src={card.image.startsWith('ipfs://') ? `https://ipfs.io/ipfs/${card.image.slice(7)}` : card.image}
                alt="agent" className="w-8 h-8 rounded-xl object-cover" />
            : <Bot className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
              {card?.name ?? `Agent #${agentId}`}
            </span>
            {card?.x402Support && (
              <span className="flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(141,216,159,0.12)', color: 'var(--success)' }}>
                <Zap className="w-2.5 h-2.5" />x402
              </span>
            )}
            {card?.active === false && (
              <span className="text-xs px-1.5 py-0.5 rounded-md"
                style={{ background: 'rgba(232,109,122,0.12)', color: 'var(--danger)' }}>inactive</span>
            )}
          </div>
          {card?.description && (
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--muted)' }}>{card.description}</p>
          )}
        </div>
      </div>

      {/* reputation */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          {stars !== null ? (
            <>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-3 h-3"
                  style={{ color: i < stars ? 'var(--warning)' : 'var(--surface-muted)', fill: i < stars ? 'var(--warning)' : 'transparent' }} />
              ))}
              <span className="text-xs ml-1 tabular-nums" style={{ color: 'var(--muted)' }}>
                {score?.toFixed(1)} ({reputationCount.toString()} reviews)
              </span>
            </>
          ) : (
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>No reviews yet</span>
          )}
        </div>
      </div>

      {/* services */}
      {card?.services && card.services.length > 0 && (
        <div className="space-y-1">
          {card.services.map((svc, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs font-semibold" style={{ color: 'var(--subtle)' }}>{svc.name}</span>
              <a href={svc.endpoint} target="_blank" rel="noreferrer"
                className="mono text-xs truncate flex items-center gap-0.5"
                style={{ color: 'var(--accent)' }}>
                {svc.endpoint.replace('https://', '').slice(0, 40)}
                <ExternalLink className="w-2.5 h-2.5 shrink-0" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* footer links */}
      <div className="flex items-center gap-3 pt-1 border-t" style={{ borderColor: 'var(--border)' }}>
        <a href={`${EXPLORER_BASE}/address/${wallet ?? address}`} target="_blank" rel="noreferrer"
          className="text-xs flex items-center gap-0.5" style={{ color: 'var(--subtle)' }}>
          {truncate(wallet ?? address)} on ArcScan <ExternalLink className="w-2.5 h-2.5" />
        </a>
        <a href={`${EXPLORER_BASE}/token/${IDENTITY_REGISTRY}/instance/${agentId}`} target="_blank" rel="noreferrer"
          className="text-xs flex items-center gap-0.5 ml-auto" style={{ color: 'var(--subtle)' }}>
          Agent #{agentId.toString()} <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  )
}

export default function AgentBadge({ address, label, showExpanded = false }: Props) {
  const [expanded, setExpanded] = useState(showExpanded)
  const { agentIds, isLoading: scanLoading } = useAgentIdsByWallet(address)
  const primaryId = agentIds[0]
  const isAgent = primaryId !== undefined

  return (
    <div className="w-full">
      <button
        onClick={() => isAgent && setExpanded(!expanded)}
        disabled={!isAgent}
        className="w-full flex items-center gap-2 text-left"
        style={{ cursor: isAgent ? 'pointer' : 'default' }}
      >
        {/* label */}
        {label && (
          <span className="text-xs font-semibold w-20 shrink-0" style={{ color: 'var(--subtle)' }}>{label}</span>
        )}

        {/* identity chip */}
        {scanLoading ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--subtle)' }}>
            <Loader2 className="w-3 h-3 animate-spin" />{truncate(address)}
          </span>
        ) : isAgent ? (
          <span className="flex items-center gap-1.5">
            <Bot className="w-3 h-3" style={{ color: 'var(--violet)' }} />
            <AgentNameInline agentId={primaryId} address={address} />
            {agentIds.length > 1 && (
              <span className="text-xs px-1 rounded" style={{ background: 'var(--surface-muted)', color: 'var(--subtle)' }}>
                +{agentIds.length - 1}
              </span>
            )}
            {expanded
              ? <ChevronUp className="w-3 h-3 ml-auto" style={{ color: 'var(--subtle)' }} />
              : <ChevronDown className="w-3 h-3 ml-auto" style={{ color: 'var(--subtle)' }} />}
          </span>
        ) : (
          <a href={`${EXPLORER_BASE}/address/${address}`} target="_blank" rel="noreferrer"
            className="mono text-xs flex items-center gap-1"
            style={{ color: 'var(--muted)' }}>
            {truncate(address)} <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </button>

      {/* expanded card */}
      {isAgent && expanded && (
        <AgentDetails agentId={primaryId} address={address} />
      )}
    </div>
  )
}

// Inline name chip — reads tokenURI + card just for the name
function AgentNameInline({ agentId, address }: { agentId: bigint; address: string }) {
  const { agentURI, isLoading } = useAgentById(agentId)
  const { card } = useAgentCard(agentURI)

  if (isLoading) return <span className="mono text-xs" style={{ color: 'var(--muted)' }}>{truncate(address)}</span>
  return (
    <span className="text-xs font-semibold" style={{ color: 'var(--violet)' }}>
      {card?.name ?? `Agent #${agentId}`}
    </span>
  )
}
