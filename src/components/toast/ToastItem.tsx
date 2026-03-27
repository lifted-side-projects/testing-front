import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast, type Toast } from './ToastContext'

const VARIANT_CONFIG = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-sage-500/15',
    border: 'border-sage-500/25',
    iconColor: 'text-sage-400',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-coral-500/15',
    border: 'border-coral-500/25',
    iconColor: 'text-coral-400',
  },
  info: {
    icon: Info,
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/25',
    iconColor: 'text-violet-400',
  },
}

export function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast()
  const [exiting, setExiting] = useState(false)
  const config = VARIANT_CONFIG[toast.variant]
  const Icon = config.icon

  useEffect(() => {
    const exitTimeout = setTimeout(() => setExiting(true), toast.duration - 300)
    return () => clearTimeout(exitTimeout)
  }, [toast.duration])

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-lg',
        config.bg, config.border,
        exiting ? 'toast-exit' : 'toast-enter',
      )}
    >
      <Icon size={18} className={cn(config.iconColor, 'shrink-0')} />
      <p className="text-ink-100 text-sm flex-1">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="text-ink-500 hover:text-ink-300 transition-colors shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  )
}
