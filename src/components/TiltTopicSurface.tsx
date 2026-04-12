import { useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from 'react'

type TiltTopicSurfaceProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: () => void
}

/**
 * Subtle 3D tilt toward pointer for a more app-like, tactile feel.
 */
export function TiltTopicSurface({ children, className = '', style, onClick }: TiltTopicSurfaceProps) {
  const ref = useRef<HTMLButtonElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    const rx = (y - 0.5) * -12
    const ry = (x - 0.5) * 12
    setTilt({ rx, ry })
  }

  const onPointerLeave = () => setTilt({ rx: 0, ry: 0 })

  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={{
        ...style,
        transform: `perspective(920px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
        transition: 'transform 0.12s ease-out',
      }}
      className={className}
    >
      {children}
    </button>
  )
}
