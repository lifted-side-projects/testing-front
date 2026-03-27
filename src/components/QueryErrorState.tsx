import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'
import { cn } from '@/lib/utils'

interface QueryErrorStateProps {
  message?: string
  onRetry?: () => void
  compact?: boolean
  className?: string
}

export function QueryErrorState({
  message = 'Не удалось загрузить данные',
  onRetry,
  compact = false,
  className,
}: QueryErrorStateProps) {
  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 bg-coral-500/5 border border-coral-500/15 rounded-xl px-4 py-3', className)}>
        <AlertCircle size={16} className="text-coral-400 shrink-0" />
        <p className="text-ink-400 text-sm flex-1">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="text-coral-400 hover:text-coral-300 transition-colors">
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6', className)}>
      <div className="w-14 h-14 rounded-2xl bg-coral-500/10 border border-coral-500/20 flex items-center justify-center mb-4">
        <AlertCircle size={24} className="text-coral-400" />
      </div>
      <p className="text-ink-300 text-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="flex items-center gap-2">
          <RefreshCw size={14} />
          Повторить
        </Button>
      )}
    </div>
  )
}
