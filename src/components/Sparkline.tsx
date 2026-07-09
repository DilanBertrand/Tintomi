type SparklineProps = {
  values: number[]
  className?: string
  width?: number
  height?: number
  positive?: boolean
  prominent?: boolean
  /** Stretch horizontally inside parent */
  fluid?: boolean
}

export function Sparkline({
  values,
  className = '',
  width = 72,
  height = 28,
  positive = true,
  prominent = false,
  fluid = false,
}: SparklineProps) {
  const pad = prominent ? 3 : 2
  const pts = values.length >= 2 ? values : values.length === 1 ? [values[0], values[0]] : [0, 0]
  const min = Math.min(...pts)
  const max = Math.max(...pts)
  const range = max - min || 1

  const d = pts
    .map((v, i) => {
      const x = pad + (i / Math.max(1, pts.length - 1)) * (width - pad * 2)
      const y = height - pad - ((v - min) / range) * (height - pad * 2)
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')

  const stroke = positive ? '#2979ff' : '#e06a55'
  const sw = prominent ? 2.5 : 1.25

  return (
    <svg
      width={fluid ? '100%' : width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fluid ? 'none' : 'xMidYMid meet'}
      className={className}
      aria-hidden
    >
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={sw}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        opacity={0.98}
      />
    </svg>
  )
}
