import { BottomNav } from './BottomNav'

export function PageShell({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-dvh flex flex-col">
      <div className={`flex-1 ${hideNav ? '' : 'pb-20'}`}>
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </div>
  )
}
