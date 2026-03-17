import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'relative font-semibold rounded-2xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none',
        {
          'bg-amber-400 text-ink-950 hover:bg-amber-300 shadow-lg shadow-amber-400/20': variant === 'primary',
          'bg-ink-800 text-ink-100 hover:bg-ink-700 border border-ink-700': variant === 'secondary',
          'bg-transparent text-ink-300 hover:text-ink-100 hover:bg-ink-800/50': variant === 'ghost',
          'bg-transparent text-amber-400 border border-amber-400/30 hover:bg-amber-400/10': variant === 'outline',
        },
        {
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg w-full': size === 'lg',
        },
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Загрузка...
        </span>
      ) : children}
    </button>
  )
}
