import { useMemo } from 'react'

/**
 * Shared background (landing + authenticated app): black-and-white fluid
 * marble texture. A dark scrim sits on top so foreground text and buttons
 * keep full contrast.
 */
const MARBLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <filter id="flow" x="-25%" y="-25%" width="150%" height="150%">
      <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.0058" numOctaves="3" seed="11" result="n"/>
      <feDisplacementMap in="SourceGraphic" in2="n" scale="260" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="0.9"/>
    </filter>
  </defs>
  <rect width="1600" height="1000" fill="#070908"/>
  <g filter="url(#flow)" fill="none" stroke="#f4f6f3" stroke-linecap="round">
    <path d="M-100,120 C300,60 700,220 1100,120 S1500,60 1750,140" stroke-width="85" opacity="0.05"/>
    <path d="M-100,180 C350,140 650,260 1050,180 S1450,120 1750,200" stroke-width="2.5" opacity="0.32"/>
    <path d="M-100,240 C300,300 800,160 1200,260 S1550,320 1750,240" stroke-width="1.4" opacity="0.26"/>
    <path d="M-100,360 C250,420 750,300 1150,400 S1500,460 1750,380" stroke-width="60" opacity="0.045"/>
    <path d="M-100,420 C400,360 700,500 1100,420 S1500,360 1750,440" stroke-width="2" opacity="0.3"/>
    <path d="M-100,470 C350,530 850,410 1250,500 S1550,540 1750,470" stroke-width="1.2" opacity="0.22"/>
    <path d="M-100,580 C300,520 700,660 1100,570 S1500,520 1750,600" stroke-width="95" opacity="0.05"/>
    <path d="M-100,640 C380,700 780,560 1180,660 S1520,700 1750,620" stroke-width="2.6" opacity="0.3"/>
    <path d="M-100,700 C320,650 720,760 1120,690 S1480,640 1750,720" stroke-width="1.3" opacity="0.24"/>
    <path d="M-100,820 C300,880 800,740 1200,840 S1550,880 1750,800" stroke-width="70" opacity="0.04"/>
    <path d="M-100,880 C400,820 700,940 1100,860 S1500,820 1750,900" stroke-width="2.2" opacity="0.28"/>
    <path d="M-100,940 C350,980 850,880 1250,950 S1550,980 1750,930" stroke-width="1.5" opacity="0.2"/>
  </g>
</svg>`

export function MeshBackdrop() {
  const backgroundImage = useMemo(
    () => `url("data:image/svg+xml,${encodeURIComponent(MARBLE_SVG)}")`,
    [],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
      <div className="absolute inset-0 bg-[#0f1412]" />
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage }}
      />
      <div className="absolute inset-0 bg-[#0f1412]/35" />
    </div>
  )
}
