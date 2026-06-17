import clsx from 'clsx'

interface ProgressBarProps {
  value: number
  label?: string
  className?: string
  variant?: 'default' | 'success' | 'error'
}

export default function ProgressBar({ value, label, className, variant = 'default' }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={clsx('w-full', className)}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm text-gray-600">{label}</span>
          <span className="text-sm font-medium text-gray-800">{clamped}%</span>
        </div>
      )}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all duration-300 ease-out',
            {
              'bg-primary-600': variant === 'default',
              'bg-emerald-500': variant === 'success',
              'bg-red-500': variant === 'error',
            },
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}
