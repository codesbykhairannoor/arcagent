/**
 * Escrow Template / Preset System — localStorage-backed.
 *
 * A "template" is a saved set of CreateEscrow form values minus
 * the one-time fields (amount, deadline) that always change.
 * Templates are stored as JSON in localStorage under a versioned key.
 *
 * Usage:
 *   const { templates, save, remove, apply } = useEscrowTemplates()
 *   apply(template) → returns form values to spread into state
 */

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'arc-escrow-templates-v1'

export interface EscrowTemplate {
  id: string
  name: string
  worker: string
  evaluatorMode: 'self' | 'custom'
  evaluatorAddr: string
  description: string
  splitEnabled: boolean
  /** saved amount as string — user can override */
  defaultAmount?: string
  /** relative deadline in hours — user picks a concrete date */
  defaultDeadlineHours?: number
  createdAt: number
}

function load(): EscrowTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as EscrowTemplate[]
  } catch {
    return []
  }
}

function persist(templates: EscrowTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // storage full — ignore
  }
}

export function useEscrowTemplates() {
  const [templates, setTemplates] = useState<EscrowTemplate[]>(() => load())

  const save = useCallback((
    name: string,
    fields: Omit<EscrowTemplate, 'id' | 'name' | 'createdAt'>,
  ) => {
    const entry: EscrowTemplate = {
      ...fields,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      createdAt: Date.now(),
    }
    setTemplates((prev) => {
      const next = [entry, ...prev].slice(0, 10) // keep last 10
      persist(next)
      return next
    })
    return entry
  }, [])

  const remove = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id)
      persist(next)
      return next
    })
  }, [])

  /** Returns form field values ready to spread into CreateEscrowModal state */
  const apply = useCallback((t: EscrowTemplate) => ({
    worker:        t.worker,
    evaluatorMode: t.evaluatorMode,
    evaluatorAddr: t.evaluatorAddr,
    description:   t.description,
    splitEnabled:  t.splitEnabled,
    amount:        t.defaultAmount ?? '',
    deadline:      t.defaultDeadlineHours
      ? new Date(Date.now() + t.defaultDeadlineHours * 3_600_000).toISOString().slice(0, 16)
      : '',
  }), [])

  return { templates, save, remove, apply }
}
