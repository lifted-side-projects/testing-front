import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PageShell } from '@/components/PageShell'
import { cn } from '@/lib/utils'
import {
  CheckCircle2, Circle, ChevronRight,
  Play, Loader2, GraduationCap,
} from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

export function LearningPlanPage() {
  const navigate = useNavigate()

  const { data: plan, isLoading } = useQuery({
    queryKey: ['learning-plan'],
    queryFn: api.getLearningPlan,
  })

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex items-center justify-center min-h-[60dvh]">
          <Loader2 size={24} className="text-amber-400 animate-spin" />
        </div>
      </PageShell>
    )
  }

  if (!plan || !plan.items.length) {
    return (
      <PageShell>
        <div className="min-h-[60dvh] flex items-center">
          <EmptyState
            icon={GraduationCap}
            title="План обучения пока не создан"
            description="Пройди диагностический тест для создания персонального плана обучения"
            action={{
              label: 'Пройти диагностику',
              onClick: () => navigate('/diagnostic'),
            }}
          />
        </div>
      </PageShell>
    )
  }

  const completed = plan.items.filter((item) => item.status === 'completed').length
  const total = plan.items.length
  const progressPct = Math.round((completed / total) * 100)

  // Group by grade
  const grouped = plan.items.reduce<Record<number, typeof plan.items>>((acc, item) => {
    if (!acc[item.grade]) acc[item.grade] = []
    acc[item.grade].push(item)
    return acc
  }, {})

  return (
    <PageShell>
      <div className="px-5 pt-6 page-enter">
        <h1 className="font-display text-2xl font-bold text-ink-50 mb-1">План обучения</h1>
        <p className="text-ink-400 text-sm mb-4">
          {completed} из {total} тем пройдено
        </p>

        {/* Overall progress */}
        <div className="bg-ink-800/40 border border-ink-700/30 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-ink-300 font-medium">Общий прогресс</span>
            <span className="text-ink-300 font-mono">{progressPct}%</span>
          </div>
          <div className="h-3 bg-ink-700/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full progress-fill"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #52b788, #40916c)',
              }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-ink-500">
            <span>{completed} пройдено</span>
            <span>{total - completed} осталось</span>
          </div>
        </div>

        {/* Plan items by grade */}
        <div className="space-y-6 pb-6">
          {Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, items]) => {
            const gradeCompleted = items.filter((i) => i.status === 'completed').length
            return (
              <div key={grade}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-ink-300 text-sm font-semibold">{grade} класс</h3>
                  <span className="text-ink-500 text-xs font-mono">{gradeCompleted}/{items.length}</span>
                </div>

                <div className="space-y-1.5">
                  {items.map((item) => {
                    const isCompleted = item.status === 'completed'
                    const isInProgress = item.status === 'in_progress'

                    return (
                      <button
                        key={item.id}
                        onClick={() => !isCompleted && navigate(`/lesson/${item.topicId}`)}
                        disabled={isCompleted}
                        className={cn(
                          'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                          isCompleted
                            ? 'bg-sage-500/5 border border-sage-500/10'
                            : isInProgress
                            ? 'bg-amber-400/8 border border-amber-400/15 active:scale-[0.98]'
                            : 'bg-ink-800/20 border border-ink-700/15 active:scale-[0.98]'
                        )}
                      >
                        {/* Status icon */}
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                          isCompleted ? 'bg-sage-500/20' :
                          isInProgress ? 'bg-amber-400/20' :
                          'bg-ink-700/30'
                        )}>
                          {isCompleted ? <CheckCircle2 size={16} className="text-sage-400" /> :
                           isInProgress ? <Play size={14} className="text-amber-400 ml-0.5" /> :
                           <Circle size={14} className="text-ink-600" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm truncate',
                            isCompleted ? 'text-sage-300 line-through opacity-60' :
                            isInProgress ? 'text-ink-100 font-medium' :
                            'text-ink-300'
                          )}>
                            {item.title}
                          </p>
                        </div>

                        {/* Arrow for actionable items */}
                        {!isCompleted && (
                          <ChevronRight size={16} className="text-ink-600 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </PageShell>
  )
}
