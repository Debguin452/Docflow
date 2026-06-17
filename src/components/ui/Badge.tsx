import clsx from 'clsx'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'orange' | 'gray' | 'red'
  className?: string
}

export default function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded uppercase tracking-wide',
        {
          'bg-primary-50 text-primary-700': variant === 'blue',
          'bg-emerald-50 text-emerald-700': variant === 'green',
          'bg-orange-50 text-orange-700': variant === 'orange',
          'bg-gray-100 text-gray-600': variant === 'gray',
          'bg-red-50 text-red-700': variant === 'red',
        },
        className,
      )}
    >
      {children}
    </span>
  )
}
