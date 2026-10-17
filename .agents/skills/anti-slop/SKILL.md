---
name: anti-slop
description: Anti-AI-slop design skill and engineering standards synthesized from Nutlope/hallmark (Together AI), miqdadbadjuber/anti-slop, and Anthropic frontend design guidelines. Eliminates generic AI tropes, fake metrics, cookie-cutter templates, and empty single-section gates.
---

# Anti-AI-Slop Skill & Design Engineering Rules

Adapted from **Nutlope/hallmark** and **miqdadbadjuber/anti-slop** for modern Web3, AI-Agent, and SaaS web applications.

---

## 1. Core Principles (Zero-Slop Standard)

1. **No Fabricated Content or Fake Metrics**:
   - Never invent arbitrary marketing statistics like *"99.9% accuracy"*, *"trusted by 50,000+ teams"*, or *"+47% faster"*.
   - Use verified on-chain facts, authentic protocol parameters (e.g. `Arc Testnet Chain ID 5042002`, `10% split fee`, `USDC 6 decimals`, `ERC-8183 escrow`), or real descriptive explanations.

2. **No Monolithic Single-Screen "Login Walls"**:
   - Never hide an entire web application behind a blank "Connect Wallet" or "Login" wall.
   - Always provide a rich, interactive, public exploratory experience:
     - Public Escrow / Job Explorer (read-only mode without forcing wallet connection).
     - Interactive feature demonstrations and live simulators.
     - Transparent step-by-step workflow ("How It Works").
     - Live on-chain metrics and verified smart contract addresses.
     - Full documentation, architectural security specs, and FAQ.

3. **No Cliché AI Tropes & Empty Buzzwords**:
   - Ban generic AI clichés: excessive sparkle icons everywhere, empty "Next-Gen 2.0" banners with no substance, meaningless gradient text without structure.
   - Ground visual and text elements in actual domain utility: explain cryptographic commitments (`keccak256`), explain smart contract states (`Funded -> Submitted -> Completed`), and show real transaction parameters.

4. **Typography Purity & Contrast**:
   - **No Italic Headers**: Display headings must be clean roman (`font-style: normal`). Italic headers are a primary AI slop tell.
   - High contrast text (`text-slate-100`, `text-slate-300`, `text-slate-400`). Never render low-contrast dark-grey on dark-blue text that fails WCAG.
   - Monospace tabular numbers for addresses, cryptographic hashes, and token balances (`tabular-nums font-mono`).

5. **Structural Variety Over Template Repetition**:
   - Do not repeat the predictable `hero -> 3-feature grid -> CTA -> footer` rhythm.
   - Combine diverse structural patterns: interactive command centers, split horizontal telemetry, searchable data tables, stage progress steppers, and live playgrounds.

6. **8-State Interactive Discipline**:
   - Interactive components (buttons, inputs, cards) must have explicit handling for:
     1. `default`
     2. `hover`
     3. `focus-visible`
     4. `active / press`
     5. `disabled`
     6. `loading / confirming`
     7. `error / failed`
     8. `success / confirmed`

7. **No Re-drawn Fake Chrome**:
   - Do not build fake mock browser bars (fake URL pills with traffic light red/yellow/green dots) or fake phone frames. Let the UI breathe in authentic native layouts.
