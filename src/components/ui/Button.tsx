import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import clsx from 'clsx'
import { prefersReducedMotion } from '../../lib/motion'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, className, disabled, onPointerDown, ...props }, ref) => {
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      onPointerDown?.(e)
      if (variant === 'ghost' || disabled || loading || prefersReducedMotion()) return
      const btn = e.currentTarget
      const r = btn.getBoundingClientRect()
      const size = Math.max(r.width, r.height) * 2
      const dot = document.createElement('span')
      dot.className = 'ripple'
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`
      btn.appendChild(dot)
      dot.addEventListener('animationend', () => dot.remove(), { once: true })
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        onPointerDown={handlePointerDown}
        className={clsx(
          'group ripple-host inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none',
          {
            // Variants
            'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/25 active:bg-primary-800': variant === 'primary',
            'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 active:bg-gray-100': variant === 'secondary',
            'text-gray-600 hover:bg-gray-100 hover:text-gray-800': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 active:bg-red-800': variant === 'danger',
            // Sizes
            'text-xs px-3 py-1.5': size === 'sm',
            'text-sm px-5 py-2.5': size === 'md',
            'text-base px-6 py-3': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {children}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
