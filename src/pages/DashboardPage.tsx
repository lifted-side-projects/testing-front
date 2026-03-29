import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { getUser } from '@/lib/auth'
import {
  getCurrentRank, getNextRank, getProgressToNextRank,
} from '@/lib/gamification'
import { PageShell } from '@/components/PageShell'
import { cn } from '@/lib/utils'
import {
  Flame, Snowflake, Coins, ChevronRight, Play,
  BookOpen, Target, Lock, ClipboardList, CheckCircle2, RotateCcw,
} from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'

export function DashboardPage() {
  const navigate = useNavigate()
  const user = getUser()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['knowledge-stats'],
    queryFn: api.getKnowledgeStats,
  })

  const { data: plan, isLoading: planLoading } = useQuery({
    queryKey: ['learning-plan'],
    queryFn: api.getLearningPlan,
  })

  const { data: gamification } = useQuery({
    queryKey: ['gamification'],
    queryFn: () => api.checkin(),
  })

  const { data: missions } = useQuery({
    queryKey: ['daily-missions'],
    queryFn: api.getDailyMissions,
  })

  const { data: reviewsDue } = useQuery({
    queryKey: ['reviews-due'],
    queryFn: api.getReviewsDue,
  })

  const coins = gamification?.coins ?? 0
  const streak = gamification?.streak ?? 0
  const freezes = gamification?.freezes ?? 0

  const masteredPercent = stats ? Math.round((stats.mastered / stats.total) * 100) : 0
  const rank = getCurrentRank(masteredPercent)
  const nextRank = getNextRank(masteredPercent)
  const rankProgress = getProgressToNextRank(masteredPercent)

  // Find next lesson
  const nextTopic = plan?.items.find((item) => item.status === 'pending' || item.status === 'in_progress')

  const isLoading = statsLoading && planLoading

  if (isLoading) {
    return (
      <PageShell>
        <div className="px-5 pt-6 page-enter">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="skeleton h-4 w-16 mb-2" />
              <div className="skeleton h-7 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <div className="skeleton h-8 w-16 rounded-full" />
              <div className="skeleton h-8 w-16 rounded-full" />
            </div>
          </div>
          <div className="skeleton h-36 rounded-3xl mb-5" />
          <div className="skeleton h-20 rounded-2xl mb-5" />
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          </div>
          <div className="mb-5">
            <div className="skeleton h-4 w-36 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
            </div>
          </div>
          <div className="mb-8">
            <div className="skeleton h-4 w-28 mb-3" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="px-5 pt-6 page-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-ink-400 text-sm">Привет,</p>
            <h1 className="font-display text-2xl font-bold text-ink-50">
              {user?.name || 'Ученик'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Coins */}
            <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1.5">
              <Coins size={14} className="text-amber-400" />
              <span className="text-amber-300 text-sm font-semibold font-mono">{coins}</span>
            </div>
            {/* Streak */}
            <div className="flex items-center gap-1.5 bg-coral-500/10 border border-coral-500/20 rounded-full px-3 py-1.5">
              <Flame size={14} className="text-coral-400 fire-glow" />
              <span className="text-coral-300 text-sm font-semibold font-mono">{streak}</span>
            </div>
          </div>
        </div>

        {/* Rank Card */}
        <div className="relative bg-gradient-to-br from-ink-800/80 to-ink-800/40 border border-ink-700/40 rounded-3xl p-5 mb-5 overflow-hidden">
          {/* Decorative gradient */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: rank.color }} />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${rank.color}20`, border: `1px solid ${rank.color}30` }}>
              {rank.icon}
            </div>
            <div className="flex-1">
              <p className="text-ink-400 text-xs uppercase tracking-wider">Ваш ранг</p>
              <h2 className="font-display text-lg font-bold" style={{ color: rank.color }}>
                {rank.titleRu}
              </h2>
            </div>
          </div>

          {nextRank && (
            <div className="mt-4 relative z-10">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-ink-400">До «{nextRank.titleRu}»</span>
                <span className="text-ink-300 font-mono">{rankProgress}%</span>
              </div>
              <div className="h-2 bg-ink-700/60 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full progress-fill"
                  style={{ width: `${rankProgress}%`, background: rank.color }}
                />
              </div>
            </div>
          )}

          {/* Streak & Freeze */}
          <div className="flex items-center gap-4 mt-4 relative z-10">
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-coral-400" />
              <span className="text-ink-300 text-sm">{streak} {streak === 1 ? 'день' : 'дней'} подряд</span>
            </div>
            <div className="flex items-center gap-2">
              <Snowflake size={16} className="text-violet-400" />
              <span className="text-ink-300 text-sm">{freezes} заморозки</span>
            </div>
          </div>
        </div>

        {/* Continue Learning */}
        {nextTopic && (
          <button
            onClick={() => navigate(`/lesson/${nextTopic.topicId}`)}
            className="w-full bg-gradient-to-r from-amber-400/15 to-amber-400/5 border border-amber-400/20 rounded-2xl p-4 mb-5 flex items-center gap-4 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center shrink-0">
              <Play size={20} className="text-ink-950 ml-0.5" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-amber-300 text-xs font-medium uppercase tracking-wider">Продолжить</p>
              <p className="text-ink-100 text-sm font-medium mt-0.5 truncate">{nextTopic.title}</p>
            </div>
            <ChevronRight size={18} className="text-ink-500" />
          </button>
        )}

        {/* Knowledge Stats */}
        {statsLoading ? (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-24" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
          </div>
        ) : stats ? (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-ink-300 text-sm font-semibold">Карта знаний</h3>
              <button onClick={() => navigate('/knowledge-map')} className="text-amber-400 text-xs flex items-center gap-0.5">
                Открыть <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-sage-500/10 border border-sage-500/15 rounded-xl px-3 py-3 text-center">
                <div className="font-display text-xl font-bold text-sage-300">{stats.mastered}</div>
                <div className="text-ink-400 text-[10px] uppercase tracking-wider mt-0.5">Изучено</div>
              </div>
              <div className="bg-amber-400/10 border border-amber-400/15 rounded-xl px-3 py-3 text-center">
                <div className="font-display text-xl font-bold text-amber-300">{stats.learning}</div>
                <div className="text-ink-400 text-[10px] uppercase tracking-wider mt-0.5">В процессе</div>
              </div>
              <div className="bg-ink-800/50 border border-ink-700/30 rounded-xl px-3 py-3 text-center">
                <div className="font-display text-xl font-bold text-ink-400">{stats.unknown}</div>
                <div className="text-ink-500 text-[10px] uppercase tracking-wider mt-0.5">Неизвестно</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Due for Review */}
        {reviewsDue && reviewsDue.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw size={16} className="text-amber-400" />
              <h3 className="text-ink-300 text-sm font-semibold">Пора повторить</h3>
              <span className="text-amber-400 text-xs font-mono ml-auto">{reviewsDue.length}</span>
            </div>
            <div className="space-y-2">
              {reviewsDue.slice(0, 3).map((topic) => (
                <button
                  key={topic.topicId}
                  onClick={() => navigate(`/quiz/${topic.topicId}`)}
                  className="w-full flex items-center gap-3 bg-amber-400/5 border border-amber-400/15 rounded-xl px-4 py-3 text-left active:scale-[0.98] transition-transform"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-400/15 flex items-center justify-center shrink-0">
                    <RotateCcw size={14} className="text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ink-200 text-sm truncate">{topic.topicTitle}</p>
                    <p className="text-ink-500 text-xs">{topic.grade} класс</p>
                  </div>
                  <ChevronRight size={16} className="text-ink-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Daily Missions */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-violet-400" />
            <h3 className="text-ink-300 text-sm font-semibold">Ежедневные задания</h3>
          </div>
          <div className="space-y-2">
            {missions?.map((mission) => (
              <button
                key={mission.id}
                onClick={() => mission.targetTopicId && !mission.completed ? navigate(`/lesson/${mission.targetTopicId}`) : null}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                  mission.completed
                    ? 'bg-sage-500/5 border border-sage-500/15'
                    : 'bg-ink-800/40 border border-ink-700/30 active:scale-[0.98]'
                )}
              >
                {mission.completed ? (
                  <CheckCircle2 size={20} className="text-sage-400 shrink-0" />
                ) : (
                  <span className="text-xl shrink-0">{mission.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    mission.completed ? 'text-sage-300 line-through' : 'text-ink-200'
                  )}>
                    {mission.title}
                  </p>
                  <p className="text-ink-500 text-xs truncate">{mission.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Coins size={12} className="text-amber-400" />
                  <span className="text-amber-300 text-xs font-mono">+{mission.reward}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Learning Plan Preview */}
        {planLoading ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="skeleton h-4 w-28" />
              <div className="skeleton h-3 w-16" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          </div>
        ) : plan && plan.items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="План обучения пуст"
            description="Пройди диагностический тест, чтобы получить персональный план"
            className="mb-8 py-8"
          />
        ) : plan && plan.items.length > 0 ? (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-ink-300 text-sm font-semibold">План обучения</h3>
              <button onClick={() => navigate('/plan')} className="text-amber-400 text-xs flex items-center gap-0.5">
                Все темы <ChevronRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {plan.items.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.status !== 'completed' ? navigate(`/lesson/${item.topicId}`) : null}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
                    item.status === 'completed'
                      ? 'bg-sage-500/5 border border-sage-500/15'
                      : item.status === 'in_progress'
                      ? 'bg-amber-400/5 border border-amber-400/15'
                      : 'bg-ink-800/30 border border-ink-700/20'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center text-xs shrink-0',
                    item.status === 'completed' ? 'bg-sage-500/20 text-sage-400' :
                    item.status === 'in_progress' ? 'bg-amber-400/20 text-amber-400' :
                    'bg-ink-700/40 text-ink-500'
                  )}>
                    {item.status === 'completed' ? '✓' :
                     item.status === 'in_progress' ? <BookOpen size={14} /> :
                     <Lock size={12} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-sm truncate',
                      item.status === 'completed' ? 'text-sage-300' : 'text-ink-200'
                    )}>
                      {item.title}
                    </p>
                    <p className="text-ink-500 text-xs">{item.grade} класс</p>
                  </div>
                  {item.status !== 'completed' && (
                    <ChevronRight size={16} className="text-ink-600 shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Plan progress */}
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-ink-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-sage-500 rounded-full progress-fill"
                  style={{ width: `${Math.round(plan.progress * 100)}%` }}
                />
              </div>
              <span className="text-ink-400 text-xs font-mono">{Math.round(plan.progress * 100)}%</span>
            </div>
          </div>
        ) : null}
      </div>
    </PageShell>
  )
}
