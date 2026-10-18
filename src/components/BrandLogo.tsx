import React from 'react'

interface BrandLogoProps {
  className?: string
  size?: number
}

/**
 * BrandLogo - Swiss Minimalist Arc Vault Monogram (Option 2).
 * 100% flat vector, zero AI gradients, pure transparent background.
 * Automatically adapts main stroke to light / dark theme via Tailwind fill classes.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-9 h-9', size }) => {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="ArcPact Logo"
    >
      {/* Outer Swiss Arch "A" with transparent negative-space vault chamber */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 28 236 L 114 26 C 120 12, 136 12, 142 26 L 228 236 C 233 248, 222 256, 210 256 L 176 256 C 166 256, 158 249, 154 240 L 138 200 L 118 200 L 102 240 C 98 249, 90 256, 80 256 L 46 256 C 34 256, 23 248, 28 236 Z M 128 78 L 154 148 L 102 148 Z"
        className="fill-slate-900 dark:fill-white transition-colors"
      />

      {/* The Horizontal Settlement Crossbar (The Pact Bridge) - Solid Arc Blue */}
      <rect
        x="64"
        y="164"
        width="128"
        height="28"
        rx="14"
        fill="#0052FF"
      />

      {/* Cryptographic Escrow Node / Keyway Core */}
      <circle
        cx="128"
        cy="112"
        r="11"
        fill="#0052FF"
      />
    </svg>
  )
}

export default BrandLogo
