import { cn } from '../../lib/utils'

interface ProgressProps {
  value: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Progress({ value, className, size = 'md' }: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const heights = { sm: 'h-1', md: 'h-2', lg: 'h-3' }

  return (
    <div className={cn('w-full bg-secondary rounded-full overflow-hidden', heights[size], className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          'bg-gradient-to-r from-primary to-primary/80'
        )}
        style={{ width: `${clampedValue}%` }}
      >
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
      </div>
    </div>
  )
}
