import { useToast } from './ToastContext'
import { ToastItem } from './ToastItem'

export function ToastContainer() {
  const { toasts } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[10000] pointer-events-none px-4 pt-[env(safe-area-inset-top)]">
      <div className="flex flex-col gap-2 pt-3">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  )
}
