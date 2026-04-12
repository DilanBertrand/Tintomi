import type { CSSProperties } from 'react'

/**
 * Shared mesh + noise background (landing + authenticated app) for a seamless transition.
 */
export function MeshBackdrop() {
  const mesh: CSSProperties = {
    backgroundImage: `
      radial-gradient(ellipse 100% 80% at 20% 10%, rgba(34, 197, 94, 0.28) 0%, transparent 50%),
      radial-gradient(ellipse 80% 60% at 85% 5%, rgba(59, 130, 246, 0.32) 0%, transparent 48%),
      radial-gradient(ellipse 70% 50% at 0% 60%, rgba(16, 185, 129, 0.18) 0%, transparent 45%),
      radial-gradient(ellipse 90% 70% at 100% 45%, rgba(37, 99, 235, 0.22) 0%, transparent 50%),
      radial-gradient(ellipse 60% 40% at 50% 100%, rgba(5, 150, 105, 0.2) 0%, transparent 55%),
      radial-gradient(ellipse 50% 30% at 70% 80%, rgba(96, 165, 250, 0.12) 0%, transparent 40%)
    `,
  }
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 bg-[#030712]" />
      <div className="absolute inset-0 opacity-[0.92]" style={mesh} />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
