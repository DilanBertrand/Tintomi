type ProgressBarProps = {
  value: number
  max?: number
  className?: string
  label?: string
}

export function ProgressBar({
  value,
  max = 100,
  className = '',
  label,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`w-full ${className}`}>
      {label ? (
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>{label}</span>
          <span className="font-mono font-medium text-[#00FF88]">{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-[#00FF88] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
