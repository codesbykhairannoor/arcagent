# Frontend Engineering & UI/UX Standards

1. **Design Tokens & Theme**:
   - Dark theme is primary. Use layered cosmic tones (`#060a16`, `#0b1329`, `#111d42`).
   - Use high-contrast text (`text-slate-100`, `text-slate-300`).
   - Use neon crypto accents: Violet `#a78bfa`, Cyan `#06b6d4`, Emerald `#10b981`, Amber `#f59e0b`.
   - Subtle glassmorphism with backdrop blur (`backdrop-blur-xl`), semi-transparent borders (`border-white/10`).

2. **Clean Code Structure**:
   - Explicit TypeScript interfaces for all props and data models.
   - Separation of concerns: business logic in hooks, presentation in components.
   - Consistent error handling and toast notifications via `sonner`.
   - Accessible semantic HTML with keyboard navigation support.

3. **Motion & Feedback**:
   - Fluid transitions using `framer-motion`.
   - Micro-animations for buttons, cards, tabs, and modals.
   - Live pulsating status rings for real-time blockchain states.
