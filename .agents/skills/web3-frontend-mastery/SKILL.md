---
name: web3-frontend-mastery
description: Elite Web3, Cyber-AI UI/UX design system and clean code architecture rules synthesized from leading industry design systems and developer guidelines (awesome-cursorrules, Vercel, Tailwind glassmorphism).
---

# Web3 & Cyber-AI Frontend Mastery Skill

This skill provides an authoritative guide for building stunning, high-performance, and clean-code Web3 and AI-Agent web interfaces.

---

## 1. Design Aesthetics & Visual Tokens

### 1.1 Cosmic Dark Foundations
- **Base Background**: Avoid dull flat blacks (`#000000`). Use layered atmospheric deep tones:
  - Space Cadet: `#050814`, `#080d1a`, `#0a1128`
  - Subtle mesh ambient glows: Layer blurred ambient spots (`blur-[100px]`, `opacity-20` to `opacity-35`) using primary accents (`cyan-500`, `violet-600`, `emerald-500`).
- **Surface Elevation Levels**:
  - `Surface Low` (Cards/Panels): `bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]`
  - `Surface Mid` (Hovered/Active): `bg-white/[0.06] backdrop-blur-2xl border border-white/[0.14]`
  - `Surface High` (Modals/Flyouts): `bg-[#0a1124]/90 backdrop-blur-3xl border border-white/[0.18] shadow-2xl shadow-black/80`

### 1.2 Futuristic Accents & Gradients
- **Primary Cyber Violet**: `#a78bfa` / `#8b5cf6` with linear fade to Electric Indigo `#6366f1`
- **Cyan / Neon Ice**: `#22d3ee` / `#06b6d4` for active telemetry and blockchain facts
- **Emerald Pulse**: `#10b981` / `#34d399` for verified proof, funded status, and successful transactions
- **Amber Flame**: `#f59e0b` for pending evaluations and warnings
- **Coral / Rose**: `#f43f5e` for disputes, refunds, and errors

---

## 2. Typography & Numerical Data Rules

- **Header / Display**: Futuristic geometric sans (`Space Grotesk`, `Outfit`, or `DM Sans` with negative letter-spacing `-0.03em`).
- **Body Text**: Legible high-contrast slate (`text-slate-200` for primary, `text-slate-400` for secondary, `text-slate-500` for subtitles).
- **Crypto & Hash Monospace**: Always enforce tabular numbers and clean truncation for addresses, hashes, and token balances:
  - `font-mono tracking-tight tabular-nums`
  - Truncation rule: `0x1234...abcd` with one-click copy and block explorer link.

---

## 3. Clean Code & React Architecture Principles

### 3.1 Strict Typing & Component Hygiene
- Prefer functional components with explicit props interfaces (`interface Props { ... }`).
- Separate business logic into custom hooks (`useEscrowData`, `useAgentIdentity`, `useReputation`) leaving components focused on presentation and interaction.
- Avoid massive bloated monolithic components: split sub-views (e.g., Row items, Stat badges, Action banners) into modular subcomponents.

### 3.2 State Management & Transaction Flow
- Always represent on-chain transaction states explicitly:
  1. `Idle` $\rightarrow$ Standard action button.
  2. `Pending User Signature` $\rightarrow$ Pulsing loader with wallet notification hint.
  3. `Confirming on Chain` $\rightarrow$ Shimmering progress with block explorer link.
  4. `Success` $\rightarrow$ Toast feedback with transaction hash link + auto cache invalidation / refetch.
  5. `Error` $\rightarrow$ Human-readable error message with retry trigger.

---

## 4. Micro-Interactions & Framer Motion Guidelines

- **Interactive Hover**:
  - Cards should smoothly scale (`hover:scale-[1.01]`) with border glow transitions (`transition-all duration-300`).
  - Buttons should feature subtle radial light highlights and tactile active press (`active:scale-[0.98]`).
- **Modals & Overlays**:
  - Use `AnimatePresence` with spring physics:
    - Initial: `opacity: 0, scale: 0.95, y: 12`
    - Animate: `opacity: 1, scale: 1, y: 0`
    - Exit: `opacity: 0, scale: 0.96, y: 8`
    - Transition: `{ type: "spring", stiffness: 350, damping: 28 }`
- **Pulsing Live Badges**:
  - Live status indicators should have a pinging ring (`animate-ping`) alongside a solid center dot to make the app feel alive.

---

## 5. Web3 Specific UI Components

1. **Agent Identity Pill**: Displays avatar, verified badge, reputation score in stars, and x402 support.
2. **Delivery Proof Verifier**: Interactive browser-side keccak256 recalculator providing immediate cryptographic confirmation.
3. **Escrow Progress Timeline**: Step-by-step visual tracker (Created $\rightarrow$ Funded $\rightarrow$ Proof Submitted $\rightarrow$ Evaluated $\rightarrow$ Completed).
4. **Quick Templates**: One-click preset configurations for common AI Agent tasks (code review, LLM translation, image generation, data analysis).
