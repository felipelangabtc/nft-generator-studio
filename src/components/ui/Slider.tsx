import { cn } from '../../lib/utils'

interface SliderProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  className?: string
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, className }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      )}
      <div className="relative h-2 w-full">
        <div className="absolute inset-0 rounded-full bg-secondary">
          <div
            className="absolute h-full rounded-full bg-primary transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background shadow"
          style={{ left: `calc(${percentage}% - 8px)` }}
        />
      </div>
    </div>
  )
}
