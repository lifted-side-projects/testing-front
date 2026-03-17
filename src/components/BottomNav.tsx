import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Map, User, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { path: '/', icon: Home, label: 'Главная' },
  { path: '/knowledge-map', icon: Map, label: 'Карта' },
  { path: '/plan', icon: BookOpen, label: 'План' },
  { path: '/profile', icon: User, label: 'Профиль' },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50">
      <div className="bg-ink-900/95 backdrop-blur-xl border-t border-ink-800/60 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive = location.pathname === tab.path
            const Icon = tab.icon
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-amber-400'
                    : 'text-ink-500 active:text-ink-300'
                )}
              >
                <Icon size={22} strokeWidth={isActive ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium tracking-wide">{tab.label}</span>
                {isActive && (
                  <div className="absolute bottom-1 w-1 h-1 rounded-full bg-amber-400" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
