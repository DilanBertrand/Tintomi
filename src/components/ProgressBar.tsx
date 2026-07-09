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
        <div className="mb-1 flex justify-between text-xs text-[#a7b0a8]">
          <span>{label}</span>
          <span className="font-mono font-medium text-[#2979ff]">{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-transparent">
        <div
          className="h-full rounded-full bg-[#2979ff] transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
