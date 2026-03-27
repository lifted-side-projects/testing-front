import { cn } from '@/lib/utils'
import { Button } from './Button'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center py-16 px-6 w-full', className)}>
      <div className="w-16 h-16 rounded-2xl bg-ink-800/40 border border-ink-700/30 flex items-center justify-center mb-4">
        <Icon size={28} className="text-ink-500" />
      </div>
      <h3 className="font-display text-lg font-semibold text-ink-200 mb-1">{title}</h3>
      {description && (
        <p className="text-ink-500 text-sm max-w-[260px] leading-relaxed">{description}</p>
      )}
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick} className="mt-5">
          {action.label}
        </Button>
      )}
    </div>
  )
}
