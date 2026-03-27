import { useNavigate } from 'react-router-dom'
import { getDueCount } from '@/lib/srs'
import { Brain, CheckCircle2 } from 'lucide-react'

export function SRSWidget() {
  const navigate = useNavigate()
  const dueCount = getDueCount()

  if (dueCount === 0) {
    return (
      <div className="bg-violet-400/5 border border-violet-400/15 rounded-2xl p-4 mb-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-violet-400/15 flex items-center justify-center shrink-0">
          <CheckCircle2 size={20} className="text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-violet-300 text-sm font-medium">Все повторено</p>
          <p className="text-ink-500 text-xs mt-0.5">Карточки появятся после тестов</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => navigate('/review')}
      className="w-full bg-gradient-to-r from-violet-500/15 to-violet-500/5 border border-violet-500/20 rounded-2xl p-4 mb-5 flex items-center gap-4 active:scale-[0.98] transition-transform text-left"
    >
      <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
        <Brain size={22} className="text-violet-400" />
      </div>
      <div className="flex-1">
        <p className="text-violet-300 text-xs font-medium uppercase tracking-wider">Повторение</p>
        <p className="text-ink-100 text-sm font-medium mt-0.5">
          {dueCount} {dueCount === 1 ? 'карточка' : dueCount < 5 ? 'карточки' : 'карточек'} к повторению
        </p>
      </div>
      <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center shrink-0">
        <span className="text-white text-xs font-bold">{dueCount}</span>
      </div>
    </button>
  )
}
